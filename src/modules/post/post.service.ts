import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ERROR_MESSAGES } from "constants/messages.constants";
import { EntityType, OrderBy, PostStatus, SortBy, UserRole } from "enums/index";
import { AttachmentService } from "modules/attachment/attachment.service";
import { SlugService } from "shared/slug.service";
import { DataSource, Repository } from "typeorm";
import { User } from "types/types";
import { generateKSUID } from "utils/helper.utils";

import { PostEntity } from "./post.entity";
import { CreatePost, GetPostsQuery, UpdatePost } from "./post.types";

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    private readonly attachmentService: AttachmentService,
    private readonly slugService: SlugService,
    private readonly dataSource: DataSource,
  ) {}

  async createPost(body: CreatePost, userId: string, files: Express.Multer.File[]) {
    return this.dataSource.transaction(async (manager) => {
      const { title, content } = body;

      const slugId = await generateKSUID("s");
      const slug = this.slugService.buildSlug(title, slugId);

      const post = manager.create(PostEntity, {
        title,
        content,
        slug,
        author: { id: userId },
      });

      const savedPost = await manager.save(post);

      const attachments = await this.attachmentService.createAttachments(files, savedPost.id, EntityType.POST);

      return {
        ...savedPost,
        attachments,
      };
    });
  }

  async getPostById(postId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: { author: true },
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

  async getMyposts(userId: string, page: number, limit: number) {
    const [posts, total] = await this.postRepository.findAndCount({
      where: { author: { id: userId } },
      relations: { author: true },
      skip: (page - 1) * limit,
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
      totalPages: Math.ceil(total / limit),
    };
  }

  async updatePost(body: UpdatePost, userId: string, postId: string) {
    const { title, content } = body;

    const post = await this.postRepository.findOne({ where: { id: postId }, relations: { author: true } });

    if (!post) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    if (post?.author.id !== userId) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (title && title !== undefined) {
      post.title = title;
    }
    if (content && content !== undefined) {
      post.content = content;
    }

    const updatedPost = await this.postRepository.save(post);

    if (!updatedPost) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    return updatedPost;
  }

  async publishPost(postId: string, user: User) {
    const post = await this.postRepository.findOne({ where: { id: postId }, relations: { author: true } });

    if (!post) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    if (post.author.id !== user.id && ![UserRole.ADMIN, UserRole.EDITOR].includes(user.role)) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }
    post.status = PostStatus.PUBLISHED;
    post.publishedAt = new Date();

    const publishedPost = await this.postRepository.save(post);

    if (!publishedPost) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    return publishedPost;
  }

  async unPublishPost(postId: string, user: User) {
    const post = await this.postRepository.findOne({ where: { id: postId }, relations: { author: true } });

    if (!post) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    if (post.author.id !== user.id && ![UserRole.ADMIN, UserRole.EDITOR].includes(user.role)) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }
    post.status = PostStatus.DRAFT;

    const unPublishedPost = await this.postRepository.save(post);

    if (!unPublishedPost) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

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
      relations: { author: true },
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

  async getPosts(query: GetPostsQuery, currentUser: User) {
    const { q, fromDate, toDate, sortBy = SortBy.CREATED_AT, order = OrderBy.DESC, status, page, limit } = query;

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
    if (q) {
      qb.andWhere("(post.title ILIKE :q OR post.content ILIKE :q)", { q: `%${q}%` });
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
      [SortBy.VIEWS]: "post.views",
    };

    qb.orderBy(SORT_MAP[sortBy ?? SortBy.CREATED_AT], order);

    // Pagination
    qb.skip((page - 1) * limit).take(limit);

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
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(postId: string) {
    return await this.postRepository.findOne({ where: { id: postId } });
  }
}
