import { Expose, Type } from "class-transformer";
import { PaginationDataDto } from "dto/common-response.dto";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

export class PostAuthorResponse {
  @ApiPropertyWritable()
  @Expose()
  id: string;

  @ApiPropertyWritable()
  @Expose()
  name: string;

  @ApiPropertyWritable()
  @Expose()
  email: string;

  @ApiPropertyWritable()
  @Expose()
  role: string;
}

export class PostResponse {
  @ApiPropertyWritable()
  @Expose()
  id: string;

  @ApiPropertyWritable()
  @Expose()
  title: string;

  @ApiPropertyWritable()
  @Expose()
  content: string;

  @ApiPropertyWritable()
  @Expose()
  status: string;

  @ApiPropertyWritable()
  @Expose()
  viewCount: number;

  @ApiPropertyWritable()
  @Expose()
  upvotesCount: number;

  @ApiPropertyWritable()
  @Expose()
  downvotesCount: number;

  @ApiPropertyWritable()
  @Expose()
  createdAt: Date;

  @ApiPropertyWritable()
  @Expose()
  publishedAt?: Date | null;

  @ApiPropertyWritable()
  @Expose()
  @Type(() => PostAuthorResponse)
  author: PostAuthorResponse;
}

export class PostResonseDto {
  @ApiPropertyWritable({ type: PostResponse })
  @Type(() => PostResponse)
  @Expose()
  data: PostResponse;

  @Expose()
  @ApiPropertyWritable()
  message: string;
}

export class PostsPaginationDataDto extends PaginationDataDto {
  @ApiPropertyWritable({ type: [PostResponse] })
  @Type(() => PostResponse)
  @Expose()
  data: PostResponse[];
}

export class PaginatedPostResonseDto {
  @ApiPropertyWritable({ type: PostsPaginationDataDto })
  @Type(() => PostsPaginationDataDto)
  @Expose()
  data: PostsPaginationDataDto;

  @Expose()
  @ApiPropertyWritable()
  message: string;
}

export class GetAllPostsResponseDto extends PaginatedPostResonseDto {}
