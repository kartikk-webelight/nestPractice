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
