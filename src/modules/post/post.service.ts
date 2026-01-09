import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ERROR_MESSAGES } from "constants/messages.constants";
import { PostStatus, UserRole } from "enums/index";
import { Repository } from "typeorm";

import { UsersService } from "../users/users.service";
import { PostEntity } from "./post.entity";
import { CreatePost, UpdatePost } from "./post.types";

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    private readonly usersService: UsersService,
  ) {}

  async createPost(body: CreatePost, userId: string) {
    const { title, content } = body;

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    const post = this.postRepository.create({
      title,
      content,
      author: user,
    });

    const savedPost = await this.postRepository.save(post);

    if (!savedPost) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    return savedPost;
  }

  async getAllPosts(page: number, limit: number) {
    const [posts, total] = await this.postRepository.findAndCount({
      relations: { author: true },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: posts,
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
    return post;
  }

  async getMyposts(userId: string, page: number, limit: number) {
    const [posts, total] = await this.postRepository.findAndCount({
      where: { author: { id: userId } },
      relations: { author: true },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updatePost(body: UpdatePost, userId: string) {
    const { title, content, postId } = body;

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

    return {
      data: posts,
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
