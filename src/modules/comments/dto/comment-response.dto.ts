import { Expose, Type } from "class-transformer";
import { PaginationMetaDto, UsersResponse } from "src/dto/common.dto";
import { PostResult } from "src/modules/post/dto/posts-response.dto";
import { ApiPropertyWritable } from "src/swagger/swagger.writable.decorator";

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
  commentStatus: string;

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

  @ApiPropertyWritable({ type: PostResult })
  @Expose()
  @Type(() => PostResult)
  post: PostResult;

  @ApiPropertyWritable({ nullable: true })
  @Expose()
  @Type(() => CommentResponse)
  parentComment: CommentResponse | null;
}


export class CommentResponseDto {

  @ApiPropertyWritable({type:CommentResponse})
  @Type(()=>CommentResponse)
  @Expose()
  data:CommentResponse

  @ApiPropertyWritable({type:CommentResponse})
  @Expose()
  message:string
}

export class CreateCommentResponseDto extends CommentResponseDto{}
export class ReplyCommentResponseDto extends CommentResponseDto{}
export class GetCommentByIdResponseDto extends CommentResponseDto{}
export class UpdateCommentResponseDto extends CommentResponseDto{}

export class PaginatedCommentResonseDto {
  @ApiPropertyWritable({ type: CommentResponse })
  @Type(() => CommentResponse)
  @Expose()
  data: CommentResponse[];

  @ApiPropertyWritable({ type: PaginationMetaDto })
  @Type(() => PaginationMetaDto)
  @Expose()
  meta: PaginationMetaDto;

  @Expose()
  @ApiPropertyWritable()
  message: string;
}