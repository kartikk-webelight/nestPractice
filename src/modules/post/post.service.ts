import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ERROR_MESSAGES } from "constants/messages.constants";
import { EntityType, PostSortBy, PostStatus, UserRole } from "enums/index";
import { AttachmentService } from "modules/attachment/attachment.service";
import { UsersService } from "modules/users/users.service";
import { SlugService } from "shared/slug.service";
import { Repository } from "typeorm";
import { generateKSUID } from "utils/helper.utils";

import { PostEntity } from "./post.entity";
import { CreatePost, SearchPostsQuery, UpdatePost } from "./post.types";

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    private readonly attachmentService: AttachmentService,
    private readonly usersService: UsersService,
    private readonly slugService: SlugService,
  ) {}

  async createPost(body: CreatePost, userId: string, files: Express.Multer.File[]) {
    const { title, content } = body;

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    const slugId = await generateKSUID("s");

    const slug = this.slugService.buildSlug(title, slugId);

    const post = this.postRepository.create({
      title,
      content,
      author: user,
      slug,
    });

    const savedPost = await this.postRepository.save(post);

    const attachments = await this.attachmentService.createAttachments(files, savedPost.id, EntityType.POST);

    return {
      ...savedPost,
      attachments,
    };
  }

  async getAllPosts(page: number, limit: number) {
    const [posts, total] = await this.postRepository.findAndCount({
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

  async publishPost(postId: string, user: any) {
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

  async unPublishPost(postId: string, user: any) {
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

  async deletePost(postId: string, user: any) {
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

  async getPublishedPosts(page: number, limit: number) {
    const [posts, total] = await this.postRepository.findAndCount({
      where: { status: PostStatus.PUBLISHED },
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

  async searchPosts(query: SearchPostsQuery) {
    const { q, fromDate, toDate, sortBy = "createdAt", order = "DESC", page, limit } = query;

    const allowedSorts = ["createdAt", "likes", "viewCount"];

    if (!allowedSorts.includes(sortBy)) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_SORTING_FIELD);
    }

    const qb = this.postRepository.createQueryBuilder("post");

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
    const SORT_MAP: Record<PostSortBy, string> = {
      [PostSortBy.CREATED_AT]: "post.createdAt",
      [PostSortBy.LIKES]: "post.likes",
      [PostSortBy.VIEWS]: "post.views",
    };

    qb.orderBy(SORT_MAP[sortBy ?? PostSortBy.CREATED_AT], order);

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
