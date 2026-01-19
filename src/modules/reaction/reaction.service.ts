import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CommentEntity } from "modules/comments/comment.entity";
import { PostEntity } from "modules/post/post.entity";
import { UserEntity } from "modules/users/users.entity";
import { ERROR_MESSAGES } from "constants/messages.constants";
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

    const existingVote = await this.ReactionRepository.findOne({
      where: {
        post: { id: postId },
        reactedBy: { id: userId },
      },
    });

    // first like
    if (!existingVote) {
      post.likes += 1;

      const vote = this.ReactionRepository.create({
        post,
        reactedBy: user,
        isLiked: true,
      });

      await this.ReactionRepository.save(vote);
      await this.postRepository.save(post);

      return post;
    }

    // already liked → remove like
    if (existingVote.isLiked) {
      if (post.likes > 0) post.likes -= 1;

      await this.ReactionRepository.delete({ id: existingVote.id });
      await this.postRepository.save(post);

      return post;
    }

    // previously disliked → switch
    if (post.dislikes > 0) post.dislikes -= 1;
    post.likes += 1;

    existingVote.isLiked = true;
    await this.ReactionRepository.save(existingVote);
    await this.postRepository.save(post);

    return post;
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

    const existingVote = await this.ReactionRepository.findOne({
      where: {
        post: { id: postId },
        reactedBy: { id: userId },
      },
    });

    // first dislike
    if (!existingVote) {
      post.dislikes += 1;

      const vote = this.ReactionRepository.create({
        post,
        reactedBy: user,
        isLiked: false,
      });

      await this.ReactionRepository.save(vote);
      await this.postRepository.save(post);

      return post;
    }

    // already disliked → remove dislike
    if (!existingVote.isLiked) {
      if (post.dislikes > 0) post.dislikes -= 1;

      await this.ReactionRepository.delete({ id: existingVote.id });
      await this.postRepository.save(post);

      return post;
    }

    // previously liked → switch
    if (post.likes > 0) post.likes -= 1;
    post.dislikes += 1;

    existingVote.isLiked = false;
    await this.ReactionRepository.save(existingVote);
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

    const existingVote = await this.ReactionRepository.findOne({
      where: {
        comment: { id: commentId },
        reactedBy: { id: userId },
      },
    });

    // first like
    if (!existingVote) {
      comment.likes += 1;

      const vote = this.ReactionRepository.create({
        comment,
        reactedBy: user,
        isLiked: true,
      });

      await this.ReactionRepository.save(vote);
      await this.commentRepository.save(comment);

      return comment;
    }

    // already liked → remove like
    if (existingVote.isLiked) {
      if (comment.likes > 0) comment.likes -= 1;

      await this.ReactionRepository.delete({ id: existingVote.id });
      await this.commentRepository.save(comment);

      return comment;
    }

    // previously disliked → switch
    if (comment.dislikes > 0) comment.dislikes -= 1;
    comment.likes += 1;

    existingVote.isLiked = true;
    await this.ReactionRepository.save(existingVote);
    await this.commentRepository.save(comment);

    return comment;
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

    const existingVote = await this.ReactionRepository.findOne({
      where: {
        comment: { id: commentId },
        reactedBy: { id: userId },
      },
    });

    // first dislike
    if (!existingVote) {
      comment.dislikes += 1;

      const vote = this.ReactionRepository.create({
        comment,
        reactedBy: user,
        isLiked: false,
      });

      await this.ReactionRepository.save(vote);
      await this.commentRepository.save(comment);

      return comment;
    }

    // already disliked → remove dislike
    if (!existingVote.isLiked) {
      if (comment.dislikes > 0) comment.dislikes -= 1;

      await this.ReactionRepository.delete({ id: existingVote.id });
      await this.commentRepository.save(comment);

      return comment;
    }

    // previously liked → switch
    if (comment.likes > 0) comment.likes -= 1;
    comment.dislikes += 1;

    existingVote.isLiked = false;
    await this.ReactionRepository.save(existingVote);
    await this.commentRepository.save(comment);

    return comment;
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
      totalPages: Math.ceil(total / limit),
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
      totalPages: Math.ceil(total / limit),
    };
  }
}
