import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { CommentEntity } from "modules/comments/comment.entity";
import { PostsPaginationResponseDto } from "modules/post/dto/posts-response.dto";
import { PostEntity } from "modules/post/post.entity";
import { ERROR_MESSAGES } from "constants/messages";
import { PostStatus, ReactionCounter } from "enums";
import { logger } from "services/logger.service";
import { calculateOffset, calculateTotalPages } from "utils/helper";
import { ReactionEntity } from "./reaction.entity";
import { ApplyReactionToComment, ApplyReactionToPost } from "./reaction.types";

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
   * Retrieves a paginated collection of posts that the specified user has liked.
   *
   * @param page - The current results page.
   * @param limit - The maximum number of posts per page.
   * @param userId - The user whose liked content is being fetched.
   * @returns A paginated object containing a list of {@link PostsPaginationResponseDto} records.
   */
  async getLikedPosts(page: number, limit: number, userId: string): Promise<PostsPaginationResponseDto> {
    logger.info("Fetching liked posts for user %s", userId);

    const [reactions, total] = await this.reactionRepository.findAndCount({
      where: {
        isLiked: true,
        reactedBy: { id: userId },
        post: { status: PostStatus.PUBLISHED },
      },
      relations: { post: true },
      skip: calculateOffset(page, limit),
      take: limit,
    });
    const likedPosts = reactions.map((reaction) => reaction.post).filter((post): post is PostEntity => !!post);

    logger.info("Retrieved %d liked posts", likedPosts.length);

    return {
      data: likedPosts,
      page,
      limit,
      total,
      totalPages: calculateTotalPages(total, limit),
    };
  }

  /**
   * Retrieves a paginated collection of posts that the specified user has disliked.
   *
   * @param page - The results page number.
   * @param limit - The results limit.
   * @param userId - The user identifier.
   * @returns A paginated object containing the disliked {@link PostsPaginationResponseDto} records.
   */
  async getDislikedPosts(page: number, limit: number, userId: string): Promise<PostsPaginationResponseDto> {
    logger.info("Fetching disliked posts for user %s", userId);

    const [reactions, total] = await this.reactionRepository.findAndCount({
      where: {
        isLiked: false,
        reactedBy: { id: userId },
        post: { status: PostStatus.PUBLISHED },
      },
      relations: { post: true },
      skip: calculateOffset(page, limit),
      take: limit,
    });

    const dislikedPosts = reactions.map((reaction) => reaction.post).filter((post): post is PostEntity => !!post);

    logger.info("Retrieved %d disliked posts", dislikedPosts.length);

    return {
      data: dislikedPosts,
      page,
      limit,
      total,
      totalPages: calculateTotalPages(total, limit),
    };
  }

  /**
   * Toggles or switches a user's reaction state on a post using a transactional lock.
   *
   * @remarks
   * Executes a pessimistic write lock on the target post to ensure counter integrity.
   * Handles first-time reactions, removals (un-reacting), and switching between like/dislike.
   *
   * @param reactionDetails - The IDs and state required to process the post reaction.
   * @returns A promise that resolves when the transaction is committed.
   * @throws NotFoundException if the post does not exist.
   * @group Social & Interaction Services
   */
  async applyReactionToPost(reactionDetails: ApplyReactionToPost): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const { postId, userId, isLiked } = reactionDetails;

      logger.info("Processing post reaction transaction for User: %s, Post: %s", userId, postId);

      const postRepository = manager.getRepository(PostEntity);
      const reactionRepository = manager.getRepository(ReactionEntity);

      const post = await postRepository.findOne({
        where: { id: postId, status: PostStatus.PUBLISHED },
        lock: { mode: "pessimistic_write" },
      });

      if (!post) {
        throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
      }

      const existingReaction = await reactionRepository.findOne({
        where: {
          post: { id: postId },
          reactedBy: { id: userId },
        },
      });

      /**
       * CASE 1: No existing reaction → create one
       */
      if (!existingReaction) {
        logger.debug("Creating new %s reaction for post %s", isLiked ? "like" : "dislike", postId);

        await this.increment(this.getCounter(isLiked), postRepository, postId);

        await reactionRepository.save(
          reactionRepository.create({
            post,
            reactedBy: { id: userId },
            isLiked,
          }),
        );

        return;
      }

      /**
       * CASE 2: Same reaction again → remove reaction
       */
      if (existingReaction.isLiked === isLiked) {
        logger.debug("Removing existing %s from post %s", isLiked ? "like" : "dislike", postId);

        await this.decrement(this.getCounter(isLiked), postRepository, postId);
        await reactionRepository.softDelete(existingReaction.id);

        return;
      }

      /**
       * CASE 3: Switching reaction (like ↔ dislike)
       */
      await this.decrement(this.getCounter(existingReaction.isLiked), postRepository, postId);
      await this.increment(this.getCounter(isLiked), postRepository, postId);

      existingReaction.isLiked = isLiked;
      await reactionRepository.save(existingReaction);

      logger.info("Reaction transaction committed for post %s", postId);
    });
  }

  /**
   * Toggles or switches a user's reaction state on a comment using a transactional lock.
   *
   * @remarks
   * Utilizes a row-level lock on the comment entity to safely increment or decrement
   * interaction counts while preventing race conditions in high-traffic environments.
   *
   * @param reactionDetails - The IDs and state required to process the comment reaction.
   * @returns A promise that resolves when the transaction is committed.
   * @throws NotFoundException if the comment does not exist.
   * @group Social & Interaction Services
   */
  async applyReactionToComment(reactionDetails: ApplyReactionToComment): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const { commentId, userId, isLiked } = reactionDetails;

      logger.info("Processing comment reaction transaction for User: %s, Comment: %s", userId, commentId);

      const commentRepository = manager.getRepository(CommentEntity);
      const reactionRepository = manager.getRepository(ReactionEntity);

      const comment = await commentRepository.findOne({
        where: { id: commentId },
        lock: { mode: "pessimistic_write" },
      });

      if (!comment) {
        throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);
      }

      const existingReaction = await reactionRepository.findOne({
        where: {
          comment: { id: commentId },
          reactedBy: { id: userId },
        },
      });

      /**
       * CASE 1: No existing reaction → create one
       */
      if (!existingReaction) {
        await this.increment(this.getCounter(isLiked), commentRepository, commentId);
        const reaction = reactionRepository.create({
          comment,
          reactedBy: { id: userId },
          isLiked,
        });
        await reactionRepository.save(reaction);

        return;
      }
      /**
       * CASE 2: Same reaction again → remove reaction
       */
      if (existingReaction.isLiked === isLiked) {
        await this.decrement(this.getCounter(isLiked), commentRepository, commentId);
        await reactionRepository.softDelete(existingReaction.id);

        return;
      }

      /**
       * CASE 3: Switching reaction (like ↔ dislike)
       */
      await this.decrement(this.getCounter(existingReaction.isLiked), commentRepository, commentId);
      await this.increment(this.getCounter(isLiked), commentRepository, commentId);
      await reactionRepository.save(existingReaction);

      logger.info("Reaction transaction committed for comment %s", commentId);
    });
  }

  getCounter = (liked: boolean): ReactionCounter => (liked ? ReactionCounter.LIKE : ReactionCounter.DISLIKE);

  increment = (counter: ReactionCounter, entityRepository: Repository<PostEntity | CommentEntity>, entityId: string) =>
    entityRepository.increment({ id: entityId }, counter, 1);

  decrement = (counter: ReactionCounter, entityRepository: Repository<PostEntity | CommentEntity>, entityId: string) =>
    entityRepository.decrement({ id: entityId }, counter, 1);
}
