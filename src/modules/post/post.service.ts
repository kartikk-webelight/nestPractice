import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, FindOptionsRelations, In, Repository, SelectQueryBuilder } from "typeorm";
import { AttachmentService } from "modules/attachment/attachment.service";
import { CategoryEntity } from "modules/category/category.entity";
import { REDIS_PREFIX } from "constants/cache-prefixes";
import { DURATION_CONSTANTS } from "constants/duration";
import { ERROR_MESSAGES } from "constants/messages";
import { EntityType, OrderBy, PostAction, PostStatus, SortBy, UserRole } from "enums/index";
import { logger } from "services/logger.service";
import { RedisService } from "shared/redis/redis.service";
import { SlugService } from "shared/slug.service";
import { calculateOffset, calculateTotalPages } from "utils/helper";
import { getCachedJson, makeRedisKey } from "utils/redis-cache";
import { CreatePostDto, GetPostsQueryDto, UpdatePostDto } from "./dto/post.dto";
import { PostResponse, PostsPaginationResponseDto } from "./dto/posts-response.dto";
import { PostEntity } from "./post.entity";
import type { User } from "types/types";

/**
 * Provides comprehensive operations for managing blog posts, including publishing workflows and media integration.
 *
 * @remarks
 * This service manages the full lifecycle of content, utilizing the {@link DataSource} for
 * transactional safety when handling attachments and categories. It implements complex
 * visibility logic based on user roles and post status.
 *
 * @group Content Management Services
 */
@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    private readonly attachmentService: AttachmentService,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly slugService: SlugService,
    private readonly redisService: RedisService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Processes the creation of a new post within a database transaction, including slug generation and media uploads.
   *
   * @param body - The {@link CreatePostDto} containing content and category identifiers.
   * @param userId - The identifier of the author creating the post.
   * @param files - An array of uploaded files to be persisted as attachments.
   * @returns A promise resolving to the {@link PostResponse} with populated categories and attachments.
   * @throws BadRequestException if provided category IDs are invalid.
   * @throws NotFoundException if the post cannot be retrieved after creation.
   */
  async createPost(body: CreatePostDto, userId: string, files: Express.Multer.File[]): Promise<PostResponse> {
    logger.info("Starting post creation for user: %s", userId);

    const savedPost = await this.dataSource.transaction(async (manager) => {
      // Step 1: Validate category IDs and generate a unique URL slug

      const categoryRepository = manager.getRepository(CategoryEntity);
      const { title, content, categoryIds } = body;
      let categories: CategoryEntity[] = [];

      if (categoryIds?.length) {
        categories = await categoryRepository.find({
          where: { id: In(categoryIds) },
        });

        if (categories.length !== categoryIds.length) {
          throw new BadRequestException(ERROR_MESSAGES.INVALID_CATEGORY_ID);
        }
      }
      const slug = this.slugService.buildSlug(title);

      const post = manager.create(PostEntity, {
        title,
        content,
        slug,
        author: { id: userId },
        categories,
      });

      // Step 2: Persist post entity and handle media attachments within transaction

      const savedPost = await manager.save(post);

      const attachments = await this.attachmentService.createAttachments(files, savedPost.id, EntityType.POST, manager);

      logger.info("Post created successfully. ID: %s, Slug: %s", savedPost.id, slug);

      return {
        ...savedPost,
        categories,
        attachments,
      };
    });
    await this.invalidatePostCaches(savedPost.id);

    return savedPost;
  }

  /**
   * Retrieves a single post by its identifier along with its attachments.
   *
   * The result is cached in Redis using the post ID.
   *
   * @param postId - Identifier of the post.
   * @returns The post with attachments.
   * @throws NotFoundException if the post does not exist.
   */
  async getPostById(postId: string): Promise<PostResponse> {
    logger.info("Fetching post by ID: %s", postId);

    const post = await this.findPostOrThrow({ id: postId }, { author: true, categories: true });

    const attachmentMap = await this.attachmentService.getAttachmentsByEntityIds([post.id], EntityType.POST);

    const postWithAttachment = {
      ...post,
      attachments: attachmentMap[post.id] || [],
    };

    return postWithAttachment;
  }

  /**
   * Retrieves a paginated collection of posts authored by a specific user,
   * including attachments, and caches the result in Redis.
   *
   * @param userId - The ID of the author.
   * @param page - Current page number.
   * @param limit - Number of records per page.
   * @returns Paginated posts with attachments {@link PostsPaginationResponseDto}.
   */
  async getMyPosts(userId: string, page: number, limit: number): Promise<PostsPaginationResponseDto> {
    const postsCacheKey = makeRedisKey("posts", { userId, page, limit });

    const cachedPosts = await getCachedJson<PostsPaginationResponseDto>(postsCacheKey, this.redisService);

    if (cachedPosts) {
      logger.info("Cache hit for posts list of user with ID %s", userId);

      return cachedPosts;
    }

    const [posts, total] = await this.postRepository.findAndCount({
      where: { author: { id: userId } },
      relations: { author: true, categories: true },
      skip: calculateOffset(page, limit),
      take: limit,
    });

    const postIds = posts.map((post) => post.id);

    const attachmentMap = await this.attachmentService.getAttachmentsByEntityIds(postIds, EntityType.POST);

    const postsWithAttachments = posts.map((post) => ({
      ...post,
      attachments: attachmentMap[post.id] || [],
    }));

    const paginatedResponse = {
      data: postsWithAttachments,
      total,
      page,
      limit,
      totalPages: calculateTotalPages(total, limit),
    };

    await this.redisService.set(postsCacheKey, JSON.stringify(paginatedResponse), DURATION_CONSTANTS.TWO_MIN_IN_SEC);

    return paginatedResponse;
  }

  /**
   * Updates an existing post's details and regenerates the slug if the title is modified.
   *
   * @param body - The {@link UpdatePostDto} containing updated fields.
   * @param userId - The ID of the user attempting the update.
   * @param postId - The ID of the post to be modified.
   * @returns A promise resolving to the updated {@link PostResponse}.
   * @throws UnauthorizedException if the user is not the original author.
   * @throws NotFoundException if the post is not found.
   */
  async updatePost(body: UpdatePostDto, userId: string, postId: string): Promise<PostResponse> {
    logger.info("Update request for Post %s by user %s", postId, userId);

    // Step 1: Validate post ownership and existence before processing updates

    const { title, content, categoryIds } = body;

    const post = await this.findPostOrThrow({ id: postId }, { author: true, categories: true });

    if (post?.author.id !== userId) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (title) {
      const slug = this.slugService.buildSlug(title);
      post.slug = slug;
      post.title = title;
    }
    if (content) {
      post.content = content;
    }

    if (categoryIds !== undefined) {
      const categories = categoryIds.length
        ? await this.categoryRepository.find({
            where: { id: In(categoryIds) },
          })
        : [];

      if (categories.length !== categoryIds.length) {
        throw new BadRequestException(ERROR_MESSAGES.INVALID_CATEGORY_ID);
      }

      post.categories = categories;
    }

    const updatedPost = await this.postRepository.save(post);

    await this.invalidatePostCaches(postId);

    logger.info("Post %s updated successfully", postId);

    return updatedPost;
  }

  /**
   * Transitions a post's status to published and records the timestamp.
   *
   * @param postId - The ID of the post to publish.
   * @param user - The {@link User} performing the action, checked for authorship or admin roles.
   * @returns A promise resolving to the published {@link PostResponse}.
   * @throws UnauthorizedException if permissions are insufficient.
   */
  async publishPost(postId: string, user: User): Promise<PostResponse> {
    logger.info("Status transition requested for Post %s to %s", postId, PostStatus.PUBLISHED);

    return this.applyPostAction(postId, user, PostAction.PUBLISH);
  }

  /**
   * Reverts a post's status to draft mode, removing it from public visibility.
   *
   * @param postId - The ID of the post to unpublish.
   * @param user - The {@link User} performing the action.
   * @returns A promise resolving to the drafted {@link PostResponse}.
   */
  async unPublishPost(postId: string, user: User): Promise<PostResponse> {
    logger.info("Status transition requested for Post %s to %s", postId, PostStatus.DRAFT);

    return this.applyPostAction(postId, user, PostAction.UNPUBLISH);
  }

  async applyPostAction(postId: string, user: User, action: PostAction): Promise<PostResponse> {
    // Step 1: Verify permissions and transition post status

    const post = await this.findPostOrThrow({ id: postId }, { author: true, categories: true });

    if (post.author.id !== user.id && ![UserRole.ADMIN, UserRole.EDITOR].includes(user.role)) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }
    post.status = action === PostAction.PUBLISH ? PostStatus.PUBLISHED : PostStatus.DRAFT;

    const updatedPost = await this.postRepository.save(post);

    await this.invalidatePostCaches(postId);

    logger.info("Post %s is now %s", postId, post.status);

    return updatedPost;
  }

  /**
   * Executes a soft delete for a post resource after verifying permissions.
   *
   * @param postId - The ID of the post to remove.
   * @param user - The {@link User} performing the deletion.
   * @returns void
   * @throws NotFoundException if the post is not found.
   */
  async deletePost(postId: string, user: User): Promise<void> {
    logger.info("Deletion requested for Post: %s", postId);

    const post = await this.findPostOrThrow({ id: postId }, { author: true });

    if (post.author.id !== user.id && ![UserRole.ADMIN, UserRole.EDITOR].includes(user.role)) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }
    await this.postRepository.softDelete({ id: postId });

    await this.invalidatePostCaches(postId);

    logger.info("Post %s successfully soft-deleted", postId);
  }

  /**
   * Retrieves a post using its URL-friendly slug.
   *
   *
   * @param slug - URL-friendly post identifier.
   * @returns The post with attachments.
   * @throws NotFoundException if the post does not exist.
   */
  async getPostBySlug(slug: string): Promise<PostResponse> {
    logger.info("Fetching post with slug: %s", slug);

    const post = await this.findPostOrThrow({ slug }, { author: true, categories: true });

    // Fetch and map attachments associated with the found post

    const attachmentMap = await this.attachmentService.getAttachmentsByEntityIds([post.id], EntityType.POST);

    const postWithAttachment = {
      ...post,
      attachments: attachmentMap[post.id] || [],
    };

    logger.info("Successfully retrieved post: %s", post.slug);

    return postWithAttachment;
  }

  /**
   * Retrieves a paginated and filtered list of posts based on user visibility rules.
   *
   *
   * @param query - Search, filter, sort, and pagination parameters.
   * @param currentUser - User requesting the posts, used to apply visibility rules.
   * @returns A paginated list of posts with attachments.
   */
  async getPosts(query: GetPostsQueryDto, currentUser: User): Promise<PostsPaginationResponseDto> {
    logger.info("Processing paginated post search for user: %s", currentUser.id);

    const { search, fromDate, toDate, sortBy = SortBy.CREATED_AT, order = OrderBy.DESC, status, page, limit } = query;

    // Step 1: Initialize query builder and apply visibility rules based on user role
    const qb = this.postRepository.createQueryBuilder("post").leftJoinAndSelect("post.author", "author");
    this.applyPostVisibilityFilters(qb, currentUser, status);

    // Step 2: Apply filters (search, date range)
    if (search) {
      qb.andWhere("(post.title ILIKE :search OR post.content ILIKE :search)", { search: `%${search}%` });
    }
    if (fromDate) qb.andWhere("post.createdAt >= :fromDate", { fromDate });
    if (toDate) qb.andWhere("post.createdAt <= :toDate", { toDate });

    // Step 3: Apply sorting and pagination
    qb.orderBy(`post.${sortBy}`, order).skip(calculateOffset(page, limit)).take(limit);

    // Step 4: Execute query and fetch related attachments
    const [posts, total] = await qb.getManyAndCount();
    const postIds = posts.map((post) => post.id);
    const attachmentMap = await this.attachmentService.getAttachmentsByEntityIds(postIds, EntityType.POST);

    const postsWithAttachments = posts.map((post) => ({
      ...post,
      attachments: attachmentMap[post.id] ?? [],
    }));

    // Step 5: Build paginated response
    const paginatedResponse: PostsPaginationResponseDto = {
      data: postsWithAttachments,
      total,
      page,
      limit,
      totalPages: calculateTotalPages(total, limit),
    };

    logger.info("Retrieved %d posts for the current page", posts.length);

    return paginatedResponse;
  }

  /**
   * Applies role-based visibility and status filters to the post query.
   *
   * Visibility rules:
   * - Readers → published posts only
   * - Authors → published posts + own drafts
   * - Editors/Admins → all posts (optionally filtered by status)
   *
   * @param qb - QueryBuilder to apply filters on
   * @param currentUser - User requesting the posts
   * @param status - Optional status filter
   */
  private applyPostVisibilityFilters(qb: SelectQueryBuilder<PostEntity>, currentUser: User, status?: PostStatus): void {
    switch (currentUser.role) {
      case UserRole.READER:
        // Readers can only see published content
        qb.andWhere("post.status = :published", {
          published: PostStatus.PUBLISHED,
        });
        break;

      case UserRole.AUTHOR:
        if (status === PostStatus.PUBLISHED) {
          qb.andWhere("post.status = :published", {
            published: PostStatus.PUBLISHED,
          });
        } else if (status === PostStatus.DRAFT) {
          // Authors are restricted to their own drafts
          qb.andWhere("post.status = :draft AND author.id = :userId", {
            draft: PostStatus.DRAFT,
            userId: currentUser.id,
          });
        } else {
          // Default author view: published posts + own drafts
          qb.andWhere("(post.status = :published OR (post.status = :draft AND author.id = :userId))", {
            published: PostStatus.PUBLISHED,
            draft: PostStatus.DRAFT,
            userId: currentUser.id,
          });
        }
        break;

      case UserRole.EDITOR:
      case UserRole.ADMIN:
        // Editors/Admins have full visibility; status filter is optional
        if (status) {
          qb.andWhere("post.status = :status", { status });
        }
        break;
    }
  }

  /**
   * Clears Redis caches for a post and related post lists.
   * @param postId - ID of the post to invalidate
   */
  private async invalidatePostCaches(postId: string): Promise<void> {
    const postCacheKey = makeRedisKey(REDIS_PREFIX.POST, postId);
    const postsCacheKey = makeRedisKey(REDIS_PREFIX.POSTS, "");

    await this.redisService.delete([postCacheKey]);
    await this.redisService.deleteByPattern(`${postsCacheKey}*`);
  }

  async findPostOrThrow(
    identifier: { id?: string; slug?: string },
    relations: FindOptionsRelations<PostEntity> = {},
  ): Promise<PostEntity> {
    if (!identifier.id && !identifier.slug) {
      throw new BadRequestException(ERROR_MESSAGES.IDENTIFIER_REQUIRED);
    }

    const post = await this.postRepository.findOne({
      where: identifier,
      relations,
    });
    if (!post) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    return post;
  }
}
