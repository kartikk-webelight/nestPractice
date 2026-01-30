import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { CommentEntity } from "modules/comments/comment.entity";
import { PostEntity } from "modules/post/post.entity";
import { ERROR_MESSAGES } from "constants/messages";
import { PostStatus } from "enums";
import { calculateOffset, calculateTotalPages } from "utils/helper";
import { ReactionEntity } from "./reaction.entity";

@Injectable()
export class ReactionService {
  constructor(
    @InjectRepository(ReactionEntity)
    private readonly reactionRepository: Repository<ReactionEntity>,

    private readonly dataSource: DataSource,
  ) {}

  async likePost(postId: string, userId: string) {
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

      return;
    });
  }

  async dislikePost(postId: string, userId: string) {
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

      return;
    });
  }

  async likeComment(commentId: string, userId: string) {
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

      return;
    });
  }

  async dislikeComment(commentId: string, userId: string) {
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

      return;
    });
  }

  async getLikedPosts(page: number, limit: number, userId: string) {
    const [reactions, total] = await this.reactionRepository.findAndCount({
      where: {
        isLiked: true,
        reactedBy: { id: userId },
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

  async getDislikedPosts(page: number, limit: number, userId: string) {
    const [reactions, total] = await this.reactionRepository.findAndCount({
      where: {
        isLiked: false,
        reactedBy: { id: userId },
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
