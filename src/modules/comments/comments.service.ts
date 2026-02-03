import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PostService } from "modules/post/post.service";
import { REDIS_PREFIX } from "constants/cache-prefixes";
import { DURATION_CONSTANTS } from "constants/duration";
import { ERROR_MESSAGES } from "constants/messages";
import { OrderBy, UserRole } from "enums";
import { logger } from "services/logger.service";
import { RedisService } from "shared/redis/redis.service";
import { calculateOffset, calculateTotalPages } from "utils/helper";
import { getCachedJson, makeRedisKey } from "utils/redis-cache";
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
    private readonly redisService: RedisService,
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
    logger.info("Comment creation initiated by user %s for post %s", userId, body.postId);

    // Step 1: Validate target post existence before attaching a comment

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

    await this.invalidateCommentCaches(savedComment.id);

    logger.info("Comment created successfully. ID: %s", savedComment.id);

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
    logger.info("User %s is replying to comment %s", userId, body.parentCommentId);

    // Step 1: Validate both the target post and the parent comment existence

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
    // Step 2: Map the hierarchical relationship and save the reply

    const comment = this.commentRepository.create({
      content,
      post,
      author: { id: userId },
      parentComment,
    });

    const savedComment = await this.commentRepository.save(comment);

    await this.invalidateCommentCaches(savedComment.id);

    logger.info("Reply successfully saved. ID: %s", savedComment.id);

    return savedComment;
  }

  /**
   * Retrieves a specific comment's details including its author and associated post.
   *
   * @param commentId - The unique identifier of the comment.
   * @returns A promise resolving to the {@link CommentResponse}.
   * @throws NotFoundException if the comment does not exist.
   */
  async getCommentById(commentId: string): Promise<CommentResponse> {
    logger.info("Fetching details for comment: %s", commentId);

    const commentCacheKey = makeRedisKey(REDIS_PREFIX.COMMENT, commentId);

    const cachedComment = await getCachedJson<CommentResponse>(commentCacheKey, this.redisService);

    if (cachedComment) {
      logger.info("Cache hit for comment with ID: %s", commentId);

      return cachedComment;
    }

    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: { author: true, post: true },
      order: { createdAt: OrderBy.DESC },
    });

    if (!comment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);
    }

    await this.redisService.set(commentCacheKey, JSON.stringify(comment), DURATION_CONSTANTS.TWO_MIN_IN_SEC);

    logger.info("Retrieved comment with id: %s", commentId);

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
    logger.info("Update request for comment %s by user %s", commentId, userId);

    // Step 1: Verify existence and ownership permissions before updating

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

    await this.invalidateCommentCaches(commentId);

    logger.info("Comment %s successfully updated", commentId);

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
    logger.info("Delete request for comment %s by user %s", commentId, user.id);

    const comment = await this.commentRepository.findOne({ where: { id: commentId }, relations: { author: true } });

    if (!comment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);
    }

    if (comment.author.id !== user.id && ![UserRole.ADMIN, UserRole.EDITOR].includes(user.role)) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    await this.commentRepository.softDelete(commentId);

    logger.info("Comment %s has been soft-deleted", commentId);
  }

  /**
   * Retrieves a paginated list of comments associated with a specific post.
   *
   * Results are cached for a short duration to reduce database load.
   *
   * @param page - Current page number.
   * @param limit - Number of records per page.
   * @param postId - Identifier of the post.
   * @returns Paginated comments for the given post {@link CommentsPaginationResponseDto}.
   */
  async getCommentsByPostId(page: number, limit: number, postId: string): Promise<CommentsPaginationResponseDto> {
    logger.info("Fetching comments for Post ID: %s (Page: %d, Limit: %d)", postId, page, limit);

    const commentsCacheKey = makeRedisKey(REDIS_PREFIX.COMMENTS, { page, postId, limit });

    const cachedComments = await getCachedJson<CommentsPaginationResponseDto>(commentsCacheKey, this.redisService);

    if (cachedComments) {
      logger.info("Cache hit for comments of post %s", postId);

      return cachedComments;
    }

    const [comments, total] = await this.commentRepository.findAndCount({
      where: {
        post: { id: postId },
      },
      relations: { author: true },
      skip: calculateOffset(page, limit),
      take: limit,
    });

    logger.info("Found %d comments for post %s", comments.length, postId);

    const paginatedResponse = {
      data: comments,
      total,
      page,
      limit,
      totalPages: calculateTotalPages(total, limit),
    };

    await this.redisService.set(commentsCacheKey, JSON.stringify(paginatedResponse), DURATION_CONSTANTS.TWO_MIN_IN_SEC);

    return paginatedResponse;
  }

  /**
   * Clears Redis caches for a comment and related comment lists.
   * @param commentId - ID of the comment to invalidate
   */
  private async invalidateCommentCaches(commentId: string): Promise<void> {
    const commentCacheKey = makeRedisKey(REDIS_PREFIX.COMMENT, commentId);
    const commentsCacheKey = makeRedisKey(REDIS_PREFIX.COMMENTS, "");

    // Delete single comment cache
    await this.redisService.delete([commentCacheKey]);

    // Delete all cached comment lists
    await this.redisService.deleteByPattern(`${commentsCacheKey}*`);
  }
}
