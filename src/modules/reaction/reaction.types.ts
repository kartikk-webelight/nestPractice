import { EntityManager, FindOptionsWhere, Repository } from "typeorm";
import { CommentEntity } from "modules/comments/comment.entity";
import { PostEntity } from "modules/post/post.entity";
import { ReactionRelation } from "enums";
import { ReactionEntity } from "./reaction.entity";

export interface BaseReactionInput {
  userId: string;
  isLiked: boolean;
}

export interface ApplyReactionToPost extends BaseReactionInput {
  postId: string;
}

export interface ApplyReactionToComment extends BaseReactionInput {
  commentId: string;
}

export interface GetPostByReaction {
  page: number;
  limit: number;
  userId: string;
  isLiked: boolean;
}

export interface Options extends BaseReactionInput {
  relationKey: ReactionRelation;
  entityId: string;
  entityRepository: Repository<PostEntity | CommentEntity>;
  manager: EntityManager;
  extraWhere?: FindOptionsWhere<PostEntity>;
  reactionWhere: FindOptionsWhere<ReactionEntity>;
  errorMessage: string;
}
