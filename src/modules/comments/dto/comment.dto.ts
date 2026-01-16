import { IsNotEmpty } from "class-validator";
import { TrimString } from "decorators/trim-string.decorator";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

export class CommentContentDto {
  @ApiPropertyWritable({
    example: "This is a comment on the post",
    description: "Text content of the comment",
  })
  @IsNotEmpty({ message: "Comment content must not be empty" })
  @TrimString()
  content: string;
}

// UPDATE: Only needs content
export class UpdateCommentDto extends CommentContentDto {}

// CREATE: Needs content + postId
export class CreateCommentDto extends CommentContentDto {
  @ApiPropertyWritable({
    example: "post_mxmsoisx123",
    description: "Unique identifier of the post on which the comment is created",
  })
  @IsNotEmpty({ message: "Post ID is required to create a comment" })
  @TrimString()
  postId: string;
}

// REPLY: Needs content + postId + parentCommentId
export class ReplyCommentDto extends CreateCommentDto {
  @ApiPropertyWritable({
    example: "comment_mxmsoisx456",
    description: "Unique identifier of the parent comment being replied to",
  })
  @IsNotEmpty({ message: "Parent comment ID is required when replying to a comment" })
  @TrimString()
  parentCommentId: string;
}
