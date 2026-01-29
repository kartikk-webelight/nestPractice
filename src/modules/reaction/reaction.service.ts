import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { CommentEntity } from "modules/comments/comment.entity";
import { PostsPaginationResponseDto } from "modules/post/dto/posts-response.dto";
import { PostEntity } from "modules/post/post.entity";
import { ERROR_MESSAGES } from "constants/messages";
import { PostStatus } from "enums";
import { calculateOffset, calculateTotalPages } from "utils/helper";
import { ReactionEntity } from "./reaction.entity";

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
    await this.dataSource.transaction(async (manager) => {
      const postRepository = manager.getRepository(PostEntity);
      const reactionRepository = manager.getRepository(ReactionEntity);

      const post = await postRepository.findOne({ where: { id: postId, status: PostStatus.PUBLISHED } });
      if (!post) {
        throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
      }

      const existingReaction = await reactionRepository.findOne({
        where: {
          post: { id: postId },
          reactedBy: { id: userId },
        },
      });

      // first like
      if (!existingReaction) {
        await postRepository.increment({ id: postId }, "likes", 1);

        const reaction = reactionRepository.create({
          post,
          reactedBy: { id: userId },
          isLiked: true,
        });

        await reactionRepository.save(reaction);

        return;
      }

      // already liked → remove like
      if (existingReaction.isLiked) {
        if (post.likes > 0) await postRepository.decrement({ id: postId }, "likes", 1);

        await reactionRepository.delete({ id: existingReaction.id });

        return;
      }

      // previously disliked → switch
      if (post.dislikes > 0) await postRepository.decrement({ id: postId }, "dislikes", 1);
      await postRepository.increment({ id: postId }, "likes", 1);

      existingReaction.isLiked = true;
      await reactionRepository.save(existingReaction);
    });
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
    await this.dataSource.transaction(async (manager) => {
      const postRepository = manager.getRepository(PostEntity);
      const reactionRepository = manager.getRepository(ReactionEntity);
      const post = await postRepository.findOne({ where: { id: postId, status: PostStatus.PUBLISHED } });
      if (!post) {
        throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
      }

      const existingReaction = await reactionRepository.findOne({
        where: {
          post: { id: postId },
          reactedBy: { id: userId },
        },
      });

      // first dislike
      if (!existingReaction) {
        await postRepository.increment({ id: postId }, "dislikes", 1);

        const reaction = reactionRepository.create({
          post,
          reactedBy: { id: userId },
          isLiked: false,
        });

        await reactionRepository.save(reaction);

        return;
      }

      // already disliked → remove dislike
      if (!existingReaction.isLiked) {
        if (post.dislikes > 0) await postRepository.decrement({ id: postId }, "dislikes", 1);

        await reactionRepository.delete({ id: existingReaction.id });

        return;
      }

      // previously liked → switch
      if (post.likes > 0) await postRepository.decrement({ id: postId }, "likes", 1);
      await postRepository.increment({ id: postId }, "dislikes", 1);

      existingReaction.isLiked = false;
      await reactionRepository.save(existingReaction);
    });
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
    await this.dataSource.transaction(async (manager) => {
      const commentRepository = manager.getRepository(CommentEntity);
      const reactionRepository = manager.getRepository(ReactionEntity);

      const comment = await commentRepository.findOne({
        where: { id: commentId },
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

      // first like
      if (!existingReaction) {
        await commentRepository.increment({ id: commentId }, "likes", 1);

        const reaction = reactionRepository.create({
          comment,
          reactedBy: { id: userId },
          isLiked: true,
        });

        await reactionRepository.save(reaction);

        return;
      }

      // already liked → remove like
      if (existingReaction.isLiked) {
        if (comment.likes > 0) await commentRepository.decrement({ id: commentId }, "likes", 1);

        await reactionRepository.delete({ id: existingReaction.id });

        return;
      }

      // previously disliked → switch
      if (comment.dislikes > 0) await commentRepository.decrement({ id: commentId }, "dislikes", 1);
      await commentRepository.increment({ id: commentId }, "likes", 1);

      existingReaction.isLiked = true;
      await reactionRepository.save(existingReaction);
    });
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
    await this.dataSource.transaction(async (manager) => {
      const commentRepository = manager.getRepository(CommentEntity);
      const reactionRepository = manager.getRepository(ReactionEntity);

      const comment = await commentRepository.findOne({
        where: { id: commentId },
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

      // first dislike
      if (!existingReaction) {
        await commentRepository.increment({ id: commentId }, "dislikes", 1);

        const reaction = reactionRepository.create({
          comment,
          reactedBy: { id: userId },
          isLiked: false,
        });

        await reactionRepository.save(reaction);

        return;
      }

      // already disliked → remove dislike
      if (!existingReaction.isLiked) {
        if (comment.dislikes > 0) await commentRepository.decrement({ id: commentId }, "dislikes", 1);

        await reactionRepository.delete({ id: existingReaction.id });

        return;
      }

      // previously liked → switch
      if (comment.likes > 0) await commentRepository.decrement({ id: commentId }, "likes", 1);
      await commentRepository.increment({ id: commentId }, "dislikes", 1);

      existingReaction.isLiked = false;
      await reactionRepository.save(existingReaction);
    });
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

    return {
      data: dislikedPosts,
      page,
      limit,
      total,
      totalPages: calculateTotalPages(total, limit),
    };
  }
}
