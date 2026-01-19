import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CommentEntity } from "modules/comments/comment.entity";
import { PostEntity } from "modules/post/post.entity";
import { UserEntity } from "modules/users/users.entity";
import { ERROR_MESSAGES } from "constants/messages.constants";
import { totalPages } from "utils/helper.utils";
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

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async likePost(postId: string, userId: string) {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const existingReaction = await this.ReactionRepository.findOne({
      where: {
        post: { id: postId },
        reactedBy: { id: userId },
      },
    });

    // first like
    if (!existingReaction) {
      post.likes += 1;

      const reaction = this.ReactionRepository.create({
        post,
        reactedBy: user,
        isLiked: true,
      });

      await this.ReactionRepository.save(reaction);
      await this.postRepository.save(post);

      return;
    }

    // already liked → remove like
    if (existingReaction.isLiked) {
      if (post.likes > 0) post.likes -= 1;

      await this.ReactionRepository.delete({ id: existingReaction.id });
      await this.postRepository.save(post);

      return;
    }

    // previously disliked → switch
    if (post.dislikes > 0) post.dislikes -= 1;
    post.likes += 1;

    existingReaction.isLiked = true;
    await this.ReactionRepository.save(existingReaction);
    await this.postRepository.save(post);

    return;
  }

  async dislikePost(postId: string, userId: string) {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const existingReaction = await this.ReactionRepository.findOne({
      where: {
        post: { id: postId },
        reactedBy: { id: userId },
      },
    });

    // first dislike
    if (!existingReaction) {
      post.dislikes += 1;

      const reaction = this.ReactionRepository.create({
        post,
        reactedBy: user,
        isLiked: false,
      });

      await this.ReactionRepository.save(reaction);
      await this.postRepository.save(post);

      return;
    }

    // already disliked → remove dislike
    if (!existingReaction.isLiked) {
      if (post.dislikes > 0) post.dislikes -= 1;

      await this.ReactionRepository.delete({ id: existingReaction.id });
      await this.postRepository.save(post);

      return;
    }

    // previously liked → switch
    if (post.likes > 0) post.likes -= 1;
    post.dislikes += 1;

    existingReaction.isLiked = false;
    await this.ReactionRepository.save(existingReaction);
    await this.postRepository.save(post);

    return post;
  }

  async likeComment(commentId: string, userId: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const existingReaction = await this.ReactionRepository.findOne({
      where: {
        comment: { id: commentId },
        reactedBy: { id: userId },
      },
    });

    // first like
    if (!existingReaction) {
      comment.likes += 1;

      const reaction = this.ReactionRepository.create({
        comment,
        reactedBy: user,
        isLiked: true,
      });

      await this.ReactionRepository.save(reaction);
      await this.commentRepository.save(comment);

      return;
    }

    // already liked → remove like
    if (existingReaction.isLiked) {
      if (comment.likes > 0) comment.likes -= 1;

      await this.ReactionRepository.delete({ id: existingReaction.id });
      await this.commentRepository.save(comment);

      return;
    }

    // previously disliked → switch
    if (comment.dislikes > 0) comment.dislikes -= 1;
    comment.likes += 1;

    existingReaction.isLiked = true;
    await this.ReactionRepository.save(existingReaction);
    await this.commentRepository.save(comment);

    return;
  }

  async dislikeComment(commentId: string, userId: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const existingReaction = await this.ReactionRepository.findOne({
      where: {
        comment: { id: commentId },
        reactedBy: { id: userId },
      },
    });

    // first dislike
    if (!existingReaction) {
      comment.dislikes += 1;

      const reaction = this.ReactionRepository.create({
        comment,
        reactedBy: user,
        isLiked: false,
      });

      await this.ReactionRepository.save(reaction);
      await this.commentRepository.save(comment);

      return;
    }

    // already disliked → remove dislike
    if (!existingReaction.isLiked) {
      if (comment.dislikes > 0) comment.dislikes -= 1;

      await this.ReactionRepository.delete({ id: existingReaction.id });
      await this.commentRepository.save(comment);

      return;
    }

    // previously liked → switch
    if (comment.likes > 0) comment.likes -= 1;
    comment.dislikes += 1;

    existingReaction.isLiked = false;
    await this.ReactionRepository.save(existingReaction);
    await this.commentRepository.save(comment);

    return;
  }

  async getLikedPosts(page: number, limit: number, userId: string) {
    const [reactions, total] = await this.ReactionRepository.findAndCount({
      where: {
        isLiked: true,
        reactedBy: { id: userId },
      },
      relations: { post: true },
      skip: (page - 1) * limit,
      take: limit,
    });
    const likedPosts = reactions.map((reaction) => reaction.post).filter((post): post is PostEntity => !!post);

    return {
      data: likedPosts,
      total,
      page,
      limit,
      totalPages: totalPages(page, limit),
    };
  }

  async getDislikedPosts(page: number, limit: number, userId: string) {
    const [reactions, total] = await this.ReactionRepository.findAndCount({
      where: {
        isLiked: true,
        reactedBy: { id: userId },
      },
      relations: { post: true },
      skip: (page - 1) * limit,
      take: limit,
    });

    const dislikedPosts = reactions.map((reaction) => reaction.post).filter((post): post is PostEntity => !!post);

    return {
      data: dislikedPosts,
      total,
      page,
      limit,
      totalPages: totalPages(page, limit),
    };
  }
}
