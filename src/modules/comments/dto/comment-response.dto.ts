import { Expose, Type } from "class-transformer";
import { PaginationDataDto, UsersResponse } from "dto/common-response.dto";
import { PostResponse } from "modules/post/dto/posts-response.dto";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

export class CommentResponse {
  @ApiPropertyWritable()
  @Expose()
  id: string;

  @ApiPropertyWritable()
  @Expose()
  createdAt: Date;

  @ApiPropertyWritable()
  @Expose()
  content: string;

  @ApiPropertyWritable()
  @Expose()
  status: string;

  @ApiPropertyWritable()
  @Expose()
  upvotes: number;

  @ApiPropertyWritable()
  @Expose()
  downvotes: number;

  @ApiPropertyWritable({ type: UsersResponse })
  @Expose()
  @Type(() => UsersResponse)
  author: UsersResponse;

  @ApiPropertyWritable({ type: PostResponse })
  @Expose()
  @Type(() => PostResponse)
  post: PostResponse;

  @ApiPropertyWritable({ nullable: true })
  @Expose()
  @Type(() => CommentResponse)
  parentComment: CommentResponse | null;
}

export class CommentResponseDto {
  @ApiPropertyWritable({ type: CommentResponse })
  @Type(() => CommentResponse)
  @Expose()
  data: CommentResponse;

  @ApiPropertyWritable({ type: CommentResponse })
  @Expose()
  message: string;
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

export class PaginatedCommentResonseDto {
  @ApiPropertyWritable({ type: CommentsPaginationDataDto })
  @Type(() => CommentsPaginationDataDto)
  @Expose()
  data: CommentsPaginationDataDto;

  @Expose()
  @ApiPropertyWritable()
  message: string;
}

export class GetAllCommentsResponseDto extends PaginatedCommentResonseDto {}
