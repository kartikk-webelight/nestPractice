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
import { PostEntity } from "./post.entity";
import type { User } from "types/types";

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

  async createPost(body: CreatePostDto, userId: string, files: Express.Multer.File[]) {
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

  async getPostById(postId: string) {
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

  async getMyPosts(userId: string, page: number, limit: number) {
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

  async updatePost(body: UpdatePostDto, userId: string, postId: string) {
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

  async publishPost(postId: string, user: User) {
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

  async unPublishPost(postId: string, user: User) {
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

  async deletePost(postId: string, user: User) {
    const post = await this.postRepository.findOne({ where: { id: postId }, relations: { author: true } });

    if (!post) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }
    if (post.author.id !== user.id && ![UserRole.ADMIN, UserRole.EDITOR].includes(user.role)) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }
    await this.postRepository.softDelete({ id: postId });

    return {};
  }

  async getPostBySlug(slug: string) {
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

  async getPosts(query: GetPostsQueryDto, currentUser: User) {
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

  async findById(postId: string) {
    return await this.postRepository.findOne({ where: { id: postId } });
  }
}
