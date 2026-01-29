import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PostService } from "modules/post/post.service";
import { ERROR_MESSAGES } from "constants/messages";
import { OrderBy, UserRole } from "enums";
import { calculateOffset, calculateTotalPages } from "utils/helper";
import { CommentEntity } from "./comment.entity";
import { CommentResponse, CommentsPaginationResponseDto } from "./dto/comment-response.dto";
import { CreateCommentDto, ReplyCommentDto, UpdateCommentDto } from "./dto/comment.dto";
import type { User } from "types/types";

/**
 * Provides operations for managing user interactions through comments and threaded replies.
 *
 * @remarks
 * This service handles the lifecycle of comments, including parent-child relationships for
 * nested discussions and integration with the {@link PostService} to validate content targets.
 *
 * @group Social & Interaction Services
 */
@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    private readonly postService: PostService,
  ) {}

  /**
   * Creates a new top-level comment on a specific post.
   *
   * @param body - The {@link CreateCommentDto} containing the post ID and content.
   * @param userId - The identifier of the user authoring the comment.
   * @returns A promise resolving to {@link CommentResponse}.
   * @throws NotFoundException if the target post does not exist.
   */
  async createComment(body: CreateCommentDto, userId: string): Promise<CommentResponse> {
    const { postId, content } = body;

    const post = await this.postService.findById(postId);

    if (!post) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    const comment = this.commentRepository.create({
      content,
      post,
      author: { id: userId },
      parentComment: null,
    });

    const savedComment = await this.commentRepository.save(comment);

    return savedComment;
  }

  /**
   * Creates a nested reply to an existing comment.
   *
   * @param body - The {@link ReplyCommentDto} containing parent comment and post context.
   * @param userId - The identifier of the user authoring the reply.
   * @returns A promise resolving to reply as {@link CommentResponse}.
   * @throws NotFoundException if the post or parent comment is not found.
   */
  async replyComment(body: ReplyCommentDto, userId: string): Promise<CommentResponse> {
    const { postId, content, parentCommentId } = body;

    const post = await this.postService.findById(postId);

    if (!post) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    const parentComment = await this.commentRepository.findOne({
      where: { id: parentCommentId, post: { id: postId } },
    });

    if (!parentComment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);
    }

    const comment = this.commentRepository.create({
      content,
      post,
      author: { id: userId },
      parentComment,
    });

    const savedComment = await this.commentRepository.save(comment);

    return savedComment;
  }

  /**
   * Retrieves a paginated collection of all comments across the system.
   *
   * @param page - The current page number for pagination.
   * @param limit - The maximum number of records to return.
   * @returns A promise resolving to a paginated object containing comment data and metadata {@link CommentsPaginationResponseDto}.
   */
  async getComments(page: number, limit: number): Promise<CommentsPaginationResponseDto> {
    const [comments, total] = await this.commentRepository.findAndCount({
      skip: calculateOffset(page, limit),
      take: limit,
      order: { createdAt: OrderBy.DESC },
    });

    return {
      data: comments,
      total,
      page,
      limit,
      totalPages: calculateTotalPages(total, limit),
    };
  }

  /**
   * Retrieves a specific comment's details including its author and associated post.
   *
   * @param commentId - The unique identifier of the comment.
   * @returns A promise resolving to the {@link CommentResponse}.
   * @throws NotFoundException if the comment does not exist.
   */
  async getCommentById(commentId: string): Promise<CommentResponse> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: { author: true, post: true },
      order: { createdAt: OrderBy.DESC },
    });

    if (!comment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);
    }

    return comment;
  }

  /**
   * Updates the content of an existing comment after verifying authorship.
   *
   * @param commentId - The ID of the comment to update.
   * @param body - The {@link UpdateCommentDto} containing the new content.
   * @param userId - The ID of the user attempting the update.
   * @returns A promise resolving to the updated {@link CommentResponse}.
   * @throws NotFoundException if the comment is not found.
   * @throws UnauthorizedException if the user is not the original author.
   */
  async updateComment(commentId: string, body: UpdateCommentDto, userId: string): Promise<CommentResponse> {
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

    return updatedComment;
  }

  /**
   * Performs a soft delete on a comment if the user is the author or has elevated privileges.
   *
   * @param commentId - The ID of the comment to remove.
   * @param user - The {@link User} object containing ID and role for authorization.
   * @returns void
   * @throws NotFoundException if the comment does not exist.
   * @throws UnauthorizedException if the user lacks the necessary permissions.
   */
  async deleteComment(commentId: string, user: User): Promise<void> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId }, relations: { author: true } });

    if (!comment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);
    }

    if (comment.author.id !== user.id && ![UserRole.ADMIN, UserRole.EDITOR].includes(user.role)) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    await this.commentRepository.softDelete(commentId);
  }

  /**
   * Retrieves a paginated list of comments specifically associated with a single post.
   *
   * @param page - The current page number.
   * @param limit - The maximum number of records.
   * @param postId - The identifier of the post.
   * @returns A promise resolving to the paginated collection of post-specific comments {@link CommentsPaginationResponseDto}.
   */
  async getCommentByPostId(page: number, limit: number, postId: string): Promise<CommentsPaginationResponseDto> {
    const [comments, total] = await this.commentRepository.findAndCount({
      where: {
        post: { id: postId },
      },
      relations: { author: true },
      skip: calculateOffset(page, limit),
      take: limit,
    });

    return {
      data: comments,
      total,
      page,
      limit,
      totalPages: calculateTotalPages(total, limit),
    };
  }
}
