import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { CommentEntity } from "modules/comments/comment.entity";
import { PostsPaginationResponseDto } from "modules/post/dto/posts-response.dto";
import { PostEntity } from "modules/post/post.entity";
import { ERROR_MESSAGES } from "constants/messages";
import { PostStatus, ReactionCounter, ReactionRelation } from "enums";
import { logger } from "services/logger.service";
import { RedisService } from "shared/redis/redis.service";
import { calculateOffset, calculateTotalPages } from "utils/helper";
import { ReactionEntity } from "./reaction.entity";
import { ApplyReactionToComment, ApplyReactionToPost, GetPostByReaction, Options } from "./reaction.types";

/**
 * Provides transactional operations for managing user reactions on content.
 *
 * @remarks
 * This service coordinates complex state logic for likes and dislikes across
 * {@link PostEntity} and {@link CommentEntity}. It utilizes the {@link DataSource}
 * to ensure atomicity when incrementing counts and updating {@link ReactionEntity} records.
 *
 * @group Social & Interaction Services
 */
@Injectable()
export class ReactionService {
  constructor(
    @InjectRepository(ReactionEntity)
    private readonly reactionRepository: Repository<ReactionEntity>,

    private readonly redisService: RedisService,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * Toggles or switches a user's 'Like' reaction on a specific post.
   *
   * @param postId - The ID of the post to react to.
   * @param userId - The ID of the user performing the action.
   * @returns A promise that resolves when the transaction completes.
   * @throws NotFoundException if the post does not exist or is not published.
   */
  async likePost(postId: string, userId: string): Promise<void> {
    logger.info("User %s requested to like post %s", userId, postId);

    await this.applyReactionToPost({ postId, userId, isLiked: true });
  }

  /**
   * Toggles or switches a user's 'Dislike' reaction on a specific post.
   *
   * @param postId - The ID of the post to react to.
   * @param userId - The ID of the user performing the action.
   * @returns A promise that resolves after the state update.
   * @throws NotFoundException if the post is not found.
   */
  async dislikePost(postId: string, userId: string): Promise<void> {
    logger.info("User %s requested to dislike post %s", userId, postId);

    await this.applyReactionToPost({ postId, userId, isLiked: false });
  }

  /**
   * Manages the 'Like' state for a specific comment, handling first-time likes, switches, and removals.
   *
   * @param commentId - The unique identifier of the target comment.
   * @param userId - The identifier of the user reacting.
   * @returns A promise that resolves when the comment count and reaction record are synced.
   * @throws NotFoundException if the comment record is missing.
   */
  async likeComment(commentId: string, userId: string): Promise<void> {
    logger.info("User %s requested to like post %s", userId, commentId);

    await this.applyReactionToComment({ commentId, userId, isLiked: true });
  }

  /**
   * Manages the 'Dislike' state for a specific comment.
   *
   * @param commentId - The ID of the comment.
   * @param userId - The ID of the user.
   * @returns A promise that resolves upon successful transaction commit.
   * @throws NotFoundException if the comment record is missing.
   */
  async dislikeComment(commentId: string, userId: string): Promise<void> {
    logger.info("User %s requested to dislike post %s", userId, commentId);

    await this.applyReactionToComment({ commentId, userId, isLiked: false });
  }

  /**
   * Retrieves a paginated list of posts liked by a user.
   *
   * @param page - Current page number.
   * @param limit - Number of posts per page.
   * @param userId - Identifier of the user.
   * @returns A paginated response containing liked posts.
   */

  async getLikedPosts(page: number, limit: number, userId: string): Promise<PostsPaginationResponseDto> {
    return this.getPostsReactedByUser({ page, limit, userId, isLiked: true });
  }

  /**
   * Retrieves a paginated list of posts disliked by a user.
   *
   * @param page - Current page number.
   * @param limit - Number of posts per page.
   * @param userId - Identifier of the user.
   * @returns A paginated response containing disliked posts.
   */
  async getDislikedPosts(page: number, limit: number, userId: string): Promise<PostsPaginationResponseDto> {
    return this.getPostsReactedByUser({ page, limit, userId, isLiked: false });
  }

  /**
   * Retrieves a paginated list of posts liked/disliked by a user.
   *
   * @param page - Current page number.
   * @param limit - Number of posts per page.
   * @param userId - Identifier of the user.
   * @returns A paginated response containing disliked posts.
   */
  async getPostsReactedByUser(getPostByReaction: GetPostByReaction): Promise<PostsPaginationResponseDto> {
    const { page, limit, userId, isLiked } = getPostByReaction;

    const reactionType = isLiked ? "liked" : "disliked";
    logger.info("Fetching %s  posts for user %s", reactionType, userId);

    const [reactions, total] = await this.reactionRepository.findAndCount({
      where: {
        isLiked,
        reactedBy: { id: userId },
        post: { status: PostStatus.PUBLISHED },
      },
      relations: { post: true },
      skip: calculateOffset(page, limit),
      take: limit,
    });

    const reactedPosts = reactions.map((reaction) => reaction.post).filter((post): post is PostEntity => !!post);

    const paginatedResponse = {
      data: reactedPosts,
      page,
      limit,
      total,
      totalPages: calculateTotalPages(total, limit),
    };

    logger.info("Retrieved %d %s posts", reactedPosts.length, reactionType);

    return paginatedResponse;
  }

  /**
   * Processes a user's reaction on a Post.
   *
   * @remarks
   * Creates, removes, or switches the reaction while keeping counters consistent
   * within a transactional boundary.
   *
   * @throws NotFoundException if the post does not exist
   */
  async applyReactionToPost(reactionDetails: ApplyReactionToPost): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const { postId, userId, isLiked } = reactionDetails;

      logger.info("Processing post reaction for User: %s, Post: %s", userId, postId);

      await this.applyReaction({
        entityId: postId,
        userId,
        isLiked,
        entityRepository: manager.getRepository(PostEntity),
        manager,
        reactionWhere: { post: { id: postId } },
        relationKey: ReactionRelation.POST,
        errorMessage: ERROR_MESSAGES.POST_NOT_FOUND,
      });

      logger.info("Reaction committed for post %s", postId);
    });
  }

  /**
   * Processes a user's reaction on a comment.
   *
   * @remarks
   * Creates, removes, or switches the reaction while keeping counters consistent
   * within a transactional boundary.
   *
   * @throws NotFoundException if the comment does not exist
   */
  async applyReactionToComment(reactionDetails: ApplyReactionToComment): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const { commentId, userId, isLiked } = reactionDetails;

      logger.info("Processing comment reaction for User: %s, Comment: %s", userId, commentId);

      await this.applyReaction({
        entityId: commentId,
        userId,
        isLiked,
        entityRepository: manager.getRepository(CommentEntity),
        manager,
        reactionWhere: { comment: { id: commentId } },
        relationKey: ReactionRelation.COMMENT,
        errorMessage: ERROR_MESSAGES.COMMENT_NOT_FOUND,
      });

      logger.info("Reaction committed for comment %s", commentId);
    });
  }

  /**
   * Applies a user's reaction to a reactable entity.
   *
   * @remarks
   * Executes within a transaction, ensuring safe reaction state changes
   * and consistent counter updates.
   *
   * @throws NotFoundException if the target entity is not found
   */
  async applyReaction(options: Options): Promise<void> {
    const {
      entityId,
      entityRepository,
      userId,
      manager,
      extraWhere = {},
      reactionWhere = {},
      isLiked,
      relationKey,
      errorMessage,
    } = options;

    const reactionRepository = manager.getRepository(ReactionEntity);

    const entity = await entityRepository.findOne({
      where: { id: entityId, ...extraWhere },
      lock: { mode: "pessimistic_write" },
    });

    if (!entity) {
      throw new NotFoundException(errorMessage);
    }

    const existingReaction = await reactionRepository.findOne({
      where: {
        reactedBy: { id: userId },
        ...reactionWhere,
      },
    });

    // First-time reaction
    if (!existingReaction) {
      await this.increment(this.getCounter(isLiked), entityRepository, entityId);

      await reactionRepository.save(
        reactionRepository.create({
          reactedBy: { id: userId },
          isLiked,
          [relationKey]: entity,
        }),
      );

      return;
    }

    // Same reaction → remove
    if (existingReaction.isLiked === isLiked) {
      await this.decrement(this.getCounter(isLiked), entityRepository, entityId);
      await reactionRepository.softDelete(existingReaction.id);

      return;
    }

    // Switch reaction
    await this.increment(this.getCounter(isLiked), entityRepository, entityId);
    await this.decrement(this.getCounter(existingReaction.isLiked), entityRepository, entityId);

    await reactionRepository.update(existingReaction.id, { isLiked });
  }

  getCounter = (liked: boolean): ReactionCounter => (liked ? ReactionCounter.LIKE : ReactionCounter.DISLIKE);

  increment = (counter: ReactionCounter, entityRepository: Repository<PostEntity | CommentEntity>, entityId: string) =>
    entityRepository.increment({ id: entityId }, counter, 1);

  decrement = (counter: ReactionCounter, entityRepository: Repository<PostEntity | CommentEntity>, entityId: string) =>
    entityRepository.decrement({ id: entityId }, counter, 1);
}
