export interface CommentContent {
  content: string;
}

// For creating a top-level comment
export interface CreateComment extends CommentContent {
  postId: string;
}

// For updating an existing comment
export interface UpdateComment extends CommentContent {
  // Inherits only 'content'
}

// For replying to an existing comment
export interface ReplyComment extends CreateComment {
  // Inherits 'content' and 'postId'
  parentCommentId: string;
}
