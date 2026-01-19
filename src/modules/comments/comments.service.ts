import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PostService } from "modules/post/post.service";
import { UsersService } from "modules/users/users.service";
import { ERROR_MESSAGES } from "constants/messages.constants";
import { UserRole } from "enums";
import { CommentEntity } from "./comment.entity";
import { CreateComment, ReplyComment, UpdateComment } from "./comment.types";
import type { User } from "types/types";

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    private readonly userService: UsersService,
    private readonly postService: PostService,
  ) {}

  async createComment(body: CreateComment, userId: string) {
    const { postId, content } = body;

    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const post = await this.postService.findById(postId);

    if (!post) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    const comment = this.commentRepository.create({
      content,
      post,
      author: user,
      parentComment: null,
    });

    const savedComment = await this.commentRepository.save(comment);

    if (!savedComment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);
    }

    return savedComment;
  }

  async replyComment(body: ReplyComment, userId: string) {
    const { postId, content, parentCommentId } = body;

    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const post = await this.postService.findById(postId);

    if (!post) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    const parentComment = await this.commentRepository.findOne({ where: { id: parentCommentId } });

    if (!parentComment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);
    }

    const comment = this.commentRepository.create({
      content,
      post,
      author: user,
      parentComment,
    });

    const savedComment = await this.commentRepository.save(comment);

    if (!savedComment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);
    }

    return savedComment;
  }

  async getAllComments(page: number, limit: number) {
    const [comments, total] = await this.commentRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCommentById(commentId: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: { author: true, post: true },
    });

    if (!comment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);
    }

    return comment;
  }

  async updateComment(commentId: string, body: UpdateComment, userId: string) {
    const { content } = body;
    const comment = await this.commentRepository.findOne({ where: { id: commentId }, relations: { author: true } });

    if (!comment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);
    }
    if (comment.author.id !== userId) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (content && content.trim() !== "") {
      comment.content = content;
    }

    const updatedComment = await this.commentRepository.save(comment);

    if (!updatedComment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);
    }

    return updatedComment;
  }

  async deleteComment(commentId: string, user: User) {
    const comment = await this.commentRepository.findOne({ where: { id: commentId }, relations: { author: true } });

    if (!comment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);
    }

    if (comment.author.id !== user.id && ![UserRole.ADMIN, UserRole.EDITOR].includes(user.role)) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    await this.commentRepository.softDelete({ id: commentId });

    return {};
  }

  async getCommentByPostId(page: number, limit: number, postId: string) {
    const [comments, total] = await this.commentRepository.findAndCount({
      where: {
        post: { id: postId },
      },
      relations: { author: true },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
