import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { AttachmentService } from "modules/attachment/attachment.service";
import { CategoryEntity } from "modules/category/category.entity";
import { ERROR_MESSAGES } from "constants/messages";
import { EntityType, OrderBy, PostStatus, SortBy, UserRole } from "enums/index";
import { SlugService } from "shared/slug.service";
import { calculateOffset, calculateTotalPages } from "utils/helper";
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
    return this.dataSource.transaction(async (manager) => {
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

      const savedPost = await manager.save(post);

      const postWithCategories = await manager.findOne(PostEntity, {
        where: { id: savedPost.id },
        relations: ["categories"],
      });

      if (!postWithCategories) {
        throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
      }

      const attachments = await this.attachmentService.createAttachments(files, savedPost.id, EntityType.POST, manager);

      return {
        ...postWithCategories,
        attachments,
      };
    });
  }

  /**
   * Retrieves a single post and its associated media by its unique identifier.
   *
   * @param postId - The ID of the post to retrieve.
   * @returns A promise resolving to the {@link PostResponse} including its attachment metadata.
   * @throws NotFoundException if the post does not exist.
   */
  async getPostById(postId: string): Promise<PostResponse> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: { author: true, categories: true },
    });

    if (!post) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    const attachmentMap = await this.attachmentService.getAttachmentsByEntityIds([post.id], EntityType.POST);

    const postWithAttachment = {
      ...post,
      attachments: attachmentMap[post.id] || [],
    };

    return postWithAttachment;
  }

  /**
   * Retrieves a paginated collection of posts authored by a specific user.
   *
   * @param userId - The identifier of the author.
   * @param page - The current page number.
   * @param limit - The number of records per page.
   * @returns A promise resolving to a paginated object containing posts and media {@link PostsPaginationResponseDto}.
   */
  async getMyPosts(userId: string, page: number, limit: number): Promise<PostsPaginationResponseDto> {
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

    return {
      data: postsWithAttachments,
      total,
      page,
      limit,
      totalPages: calculateTotalPages(total, limit),
    };
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
    const { title, content, categoryIds } = body;

    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: { author: true, categories: true },
    });

    if (!post) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

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
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: { author: true, categories: true },
    });

    if (!post) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    if (post.author.id !== user.id && ![UserRole.ADMIN, UserRole.EDITOR].includes(user.role)) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }
    post.status = PostStatus.PUBLISHED;
    post.publishedAt = new Date();

    const publishedPost = await this.postRepository.save(post);

    return publishedPost;
  }

  /**
   * Reverts a post's status to draft mode, removing it from public visibility.
   *
   * @param postId - The ID of the post to unpublish.
   * @param user - The {@link User} performing the action.
   * @returns A promise resolving to the drafted {@link PostResponse}.
   */
  async unPublishPost(postId: string, user: User): Promise<PostResponse> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: { author: true, categories: true },
    });

    if (!post) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    if (post.author.id !== user.id && ![UserRole.ADMIN, UserRole.EDITOR].includes(user.role)) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }
    post.status = PostStatus.DRAFT;

    const unPublishedPost = await this.postRepository.save(post);

    return unPublishedPost;
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
    const post = await this.postRepository.findOne({ where: { id: postId }, relations: { author: true } });

    if (!post) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }
    if (post.author.id !== user.id && ![UserRole.ADMIN, UserRole.EDITOR].includes(user.role)) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }
    await this.postRepository.softDelete({ id: postId });
  }

  /**
   * Retrieves a post using its unique URL-friendly slug.
   *
   * @param slug - The slug string generated from the title.
   * @returns A promise resolving to the {@link PostResponse} and its attachments.
   */
  async getPostBySlug(slug: string): Promise<PostResponse> {
    const post = await this.postRepository.findOne({
      where: { slug },
      relations: { author: true, categories: true },
    });

    if (!post) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    const attachmentMap = await this.attachmentService.getAttachmentsByEntityIds([post.id], EntityType.POST);

    const postWithAttachment = {
      ...post,
      attachments: attachmentMap[post.id] || [],
    };

    return postWithAttachment;
  }

  /**
   * Performs a complex filtered search of posts with visibility logic tailored to the user's role.
   *
   * @param query - The {@link GetPostsQueryDto} containing search, sort, and filter parameters.
   * @param currentUser - The {@link User} requesting the data, used to determine accessible statuses.
   * @returns A promise resolving to a paginated list of posts and their attachments.
   */
  async getPosts(query: GetPostsQueryDto, currentUser: User): Promise<PostsPaginationResponseDto> {
    const { search, fromDate, toDate, sortBy = SortBy.CREATED_AT, order = OrderBy.DESC, status, page, limit } = query;

    const qb = this.postRepository.createQueryBuilder("post");

    qb.leftJoinAndSelect("post.author", "author");

    if (currentUser.role === UserRole.READER) {
      qb.andWhere("post.status = :published", { published: PostStatus.PUBLISHED });
    } else if (currentUser.role === UserRole.AUTHOR) {
      if (status === PostStatus.PUBLISHED) {
        qb.andWhere("post.status = :published", { published: PostStatus.PUBLISHED });
      } else if (status === PostStatus.DRAFT) {
        qb.andWhere("post.status = :draft AND  author.id = :userId", {
          draft: PostStatus.DRAFT,
          userId: currentUser.id,
        });
      } else {
        // default if no status provided: all published + own drafts
        qb.andWhere("(post.status = :published OR (post.status = :draft AND  author.id = :userId))", {
          published: PostStatus.PUBLISHED,
          draft: PostStatus.DRAFT,
          userId: currentUser.id,
        });
      }
    } else if (currentUser.role === UserRole.EDITOR || currentUser.role === UserRole.ADMIN) {
      // Editors and admins can see all posts
      if (status) {
        qb.andWhere("post.status = :status", { status });
      }
    }

    // Search title + content
    if (search) {
      qb.andWhere("(post.title ILIKE :search OR post.content ILIKE :search)", { search: `%${search}%` });
    }

    // Date range filter
    if (fromDate) {
      qb.andWhere("post.createdAt >= :fromDate", { fromDate });
    }

    if (toDate) {
      qb.andWhere("post.createdAt <= :toDate", { toDate });
    }

    // Sorting
    const SORT_MAP: Record<SortBy, string> = {
      [SortBy.CREATED_AT]: "post.createdAt",
      [SortBy.LIKES]: "post.likes",
      [SortBy.VIEWCOUNT]: "post.viewCount",
    };

    qb.orderBy(SORT_MAP[sortBy ?? SortBy.CREATED_AT], order);

    // Pagination
    qb.skip(calculateOffset(page, limit)).take(limit);

    const [posts, total] = await qb.getManyAndCount();

    const postIds = posts.map((post) => post.id);

    const attachmentMap = await this.attachmentService.getAttachmentsByEntityIds(postIds, EntityType.POST);

    const postsWithAttachments = posts.map((post) => {
      return {
        ...post,
        attachments: attachmentMap[post.id] || [],
      };
    });

    return {
      data: postsWithAttachments,
      total,
      page,
      limit,
      totalPages: calculateTotalPages(total, limit),
    };
  }

  async findById(postId: string): Promise<PostEntity | null> {
    return await this.postRepository.findOne({ where: { id: postId } });
  }
}
