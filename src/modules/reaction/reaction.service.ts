import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CommentEntity } from "modules/comments/comment.entity";
import { PostEntity } from "modules/post/post.entity";
import { ERROR_MESSAGES } from "constants/messages.constants";
import { calculateOffset, calculateTotalPages } from "utils/helper";
import { ReactionEntity } from "./reaction.entity";

@Injectable()
export class ReactionService {
  constructor(
    @InjectRepository(ReactionEntity)
    private readonly ReactionRepository: Repository<ReactionEntity>,

    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,

    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
  ) {}

  async likePost(postId: string, userId: string) {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    const existingReaction = await this.ReactionRepository.findOne({
      where: {
        post: { id: postId },
        reactedBy: { id: userId },
      },
    });

    // first like
    if (!existingReaction) {
      await this.postRepository.increment({ id: postId }, "likes", 1);

      const reaction = this.ReactionRepository.create({
        post,
        reactedBy: { id: userId },
        isLiked: true,
      });

      await this.ReactionRepository.save(reaction);

      return;
    }

    // already liked → remove like
    if (existingReaction.isLiked) {
      if (post.likes > 0) await this.postRepository.decrement({ id: postId }, "likes", 1);

      await this.ReactionRepository.delete({ id: existingReaction.id });

      return;
    }

    // previously disliked → switch
    if (post.dislikes > 0) await this.postRepository.decrement({ id: postId }, "dislike", 1);
    await this.postRepository.increment({ id: postId }, "likes", 1);

    existingReaction.isLiked = true;
    await this.ReactionRepository.save(existingReaction);

    return;
  }

  async dislikePost(postId: string, userId: string) {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    const existingReaction = await this.ReactionRepository.findOne({
      where: {
        post: { id: postId },
        reactedBy: { id: userId },
      },
    });

    // first dislike
    if (!existingReaction) {
      await this.postRepository.increment({ id: postId }, "dislike", 1);

      const reaction = this.ReactionRepository.create({
        post,
        reactedBy: { id: userId },
        isLiked: false,
      });

      await this.ReactionRepository.save(reaction);

      return;
    }

    // already disliked → remove dislike
    if (!existingReaction.isLiked) {
      if (post.dislikes > 0) await this.postRepository.decrement({ id: postId }, "dislike", 1);

      await this.ReactionRepository.delete({ id: existingReaction.id });

      return;
    }

    // previously liked → switch
    if (post.likes > 0) await this.postRepository.decrement({ id: postId }, "like", 1);
    await this.ReactionRepository.increment({ id: postId }, "dislike", 1);

    existingReaction.isLiked = false;
    await this.ReactionRepository.save(existingReaction);

    return;
  }

  async likeComment(commentId: string, userId: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);
    }

    const existingReaction = await this.ReactionRepository.findOne({
      where: {
        comment: { id: commentId },
        reactedBy: { id: userId },
      },
    });

    // first like
    if (!existingReaction) {
      await this.commentRepository.increment({ id: commentId }, "like", 1);

      const reaction = this.ReactionRepository.create({
        comment,
        reactedBy: { id: userId },
        isLiked: true,
      });

      await this.ReactionRepository.save(reaction);

      return;
    }

    // already liked → remove like
    if (existingReaction.isLiked) {
      if (comment.likes > 0) await this.commentRepository.decrement({ id: commentId }, "like", 1);

      await this.ReactionRepository.delete({ id: existingReaction.id });

      return;
    }

    // previously disliked → switch
    if (comment.dislikes > 0) await this.commentRepository.decrement({ id: commentId }, "dislike", 1);
    await this.commentRepository.increment({ id: commentId }, "like", 1);

    existingReaction.isLiked = true;
    await this.ReactionRepository.save(existingReaction);

    return;
  }

  async dislikeComment(commentId: string, userId: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);
    }

    const existingReaction = await this.ReactionRepository.findOne({
      where: {
        comment: { id: commentId },
        reactedBy: { id: userId },
      },
    });

    // first dislike
    if (!existingReaction) {
      await this.commentRepository.increment({ id: commentId }, "dislike", 1);

      const reaction = this.ReactionRepository.create({
        comment,
        reactedBy: { id: userId },
        isLiked: false,
      });

      await this.ReactionRepository.save(reaction);

      return;
    }

    // already disliked → remove dislike
    if (!existingReaction.isLiked) {
      if (comment.dislikes > 0) await this.commentRepository.decrement({ id: commentId }, "dislike", 1);

      await this.ReactionRepository.delete({ id: existingReaction.id });

      return;
    }

    // previously liked → switch
    if (comment.likes > 0) await this.commentRepository.decrement({ id: commentId }, "like", 1);
    await this.commentRepository.increment({ id: commentId }, "dislike", 1);

    existingReaction.isLiked = false;
    await this.ReactionRepository.save(existingReaction);

    return;
  }

  async getLikedPosts(page: number, limit: number, userId: string) {
    const [reactions, total] = await this.ReactionRepository.findAndCount({
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
    const [reactions, total] = await this.ReactionRepository.findAndCount({
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
