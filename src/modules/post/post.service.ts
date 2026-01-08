import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PostEntity } from "./post.entity";
import { Repository } from "typeorm";
import { UsersService } from "../users/users.service";
import { PostStatus } from "src/enums/index";
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
      throw new UnauthorizedException("user not found");
    }

    const post = this.postRepository.create({
      title,
      content,
      author: user,
    });

    const savedPost = await this.postRepository.save(post);

    if (!savedPost) {
      throw new NotFoundException("post not found");
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
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPostById(postId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: { author: true },
    });

    if (!post) {
      throw new NotFoundException("post not found");
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
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updatePost(body: UpdatePost, userId: string) {
    const { title, content, postId } = body;

    const post = await this.postRepository.findOne({ where: { id: postId }, relations: { author: true } });

    if (!post) {
      throw new NotFoundException("post not found");
    }

    if (post?.author.id !== userId) {
      throw new UnauthorizedException("not allowed to edit the post");
    }

    if (title && title !== undefined) {
      post.title = title;
    }
    if (content && content !== undefined) {
      post.content = content;
    }

    const updatedPost = await this.postRepository.save(post);

    if (!updatedPost) {
      throw new NotFoundException("updated post not found");
    }

    return updatedPost;
  }

  async publishPost(postId: string, user: any) {
    const post = await this.postRepository.findOne({ where: { id: postId }, relations: { author: true } });

    if (!post) {
      throw new NotFoundException("post not found");
    }

    if (post.author.id !== user.id && !["admin", "editor"].includes(user.role)) {
      throw new UnauthorizedException("not allowed to publish the post");
    }
    post.status = PostStatus.PUBLISHED;
    post.publishedAt = new Date();

    const publishedPost = await this.postRepository.save(post);

    if (!publishedPost) {
      throw new NotFoundException("published post not found");
    }

    return publishedPost;
  }

  async unPublishPost(postId: string, user: any) {
    const post = await this.postRepository.findOne({ where: { id: postId }, relations: { author: true } });

    if (!post) {
      throw new NotFoundException("post not found");
    }

    if (post.author.id !== user.id && !["admin", "editor"].includes(user.role)) {
      throw new UnauthorizedException("not allowed to unpublish the post");
    }
    post.status = PostStatus.DRAFT;

    const unPublishedPost = await this.postRepository.save(post);

    if (!unPublishedPost) {
      throw new NotFoundException("published post not found");
    }

    return unPublishedPost;
  }

  async deletePost(postId: string, user: any) {
    const post = await this.postRepository.findOne({ where: { id: postId }, relations: { author: true } });

    if (!post) {
      throw new NotFoundException("post not found");
    }
    if (post.author.id !== user.id && !["admin", "editor"].includes(user.role)) {
      throw new UnauthorizedException("not allowed to delete the post");
    }
    await this.postRepository.delete({ id: postId });

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
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
