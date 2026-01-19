import { Expose, Type } from "class-transformer";
import { PostResponse } from "modules/post/dto/posts-response.dto";
import { MessageResponseDto, PaginationDataDto, UsersResponse } from "dto/common-response.dto";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

export class CommentResponse {
  @ApiPropertyWritable({
    example: "cmt_123abc",
    description: "Unique identifier of the comment",
  })
  @Expose()
  id: string;

  @ApiPropertyWritable({
    example: "2024-01-10T12:30:45.000Z",
    description: "Date and time when the comment was created",
  })
  @Expose()
  createdAt: Date;

  @ApiPropertyWritable({
    example: "This is a comment on the post",
    description: "Content/body of the comment",
  })
  @Expose()
  content: string;

  @ApiPropertyWritable({
    example: 12,
    description: "Number of upvotes received by the comment",
  })
  @Expose()
  likes: number;

  @ApiPropertyWritable({
    example: 2,
    description: "Number of downvotes received by the comment",
  })
  @Expose()
  dislikes: number;

  @ApiPropertyWritable({
    type: UsersResponse,
    description: "Author of the comment",
  })
  @Expose()
  @Type(() => UsersResponse)
  author: UsersResponse;

  @ApiPropertyWritable({
    type: PostResponse,
    description: "Post to which this comment belongs",
  })
  @Expose()
  @Type(() => PostResponse)
  post: PostResponse;

  @ApiPropertyWritable({
    nullable: true,
    type: CommentResponse,
    example: null,
    description: "Parent comment if this is a reply; null if it is a top-level comment",
  })
  @Expose()
  @Type(() => CommentResponse)
  parentComment: CommentResponse | null;
}

export class CommentResponseDto extends MessageResponseDto {
  @ApiPropertyWritable({ type: CommentResponse })
  @Type(() => CommentResponse)
  @Expose()
  data: CommentResponse;
}

export class CreateCommentResponseDto extends CommentResponseDto {}
export class ReplyCommentResponseDto extends CommentResponseDto {}
export class GetCommentByIdResponseDto extends CommentResponseDto {}
export class UpdateCommentResponseDto extends CommentResponseDto {}

export class CommentsPaginationDataDto extends PaginationDataDto {
  @ApiPropertyWritable({ type: [CommentResponse] })
  @Type(() => CommentResponse)
  @Expose()
  data: CommentResponse[];
}

export class PaginatedCommentResonseDto extends MessageResponseDto {
  @ApiPropertyWritable({ type: CommentsPaginationDataDto })
  @Type(() => CommentsPaginationDataDto)
  @Expose()
  data: CommentsPaginationDataDto;
}

export class GetAllCommentsResponseDto extends PaginatedCommentResonseDto {}
export class getCommentByPostIdResponseDto extends PaginatedCommentResonseDto {}
