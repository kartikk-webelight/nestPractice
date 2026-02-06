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
  isliked: boolean;
}
