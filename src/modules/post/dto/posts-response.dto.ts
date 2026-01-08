import { Expose, Type } from "class-transformer";
import { TrimString } from "src/decorators/trim-string.decorator";
import { PaginationDto, PaginationMetaDto } from "src/dto/common.dto";
import { ApiPropertyWritable } from "src/swagger/swagger.writable.decorator";

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

export class PostResult {
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
  @ApiPropertyWritable({ type: PostResult })
  @Type(() => PostResult)
  @Expose()
  data: PostResult;

  @Expose()
  @ApiPropertyWritable()
  message: string;
}





export class PaginatedPostResonseDto {
  @ApiPropertyWritable({ type: PostResult })
  @Type(() => PostResult)
  @Expose()
  data: PostResult[];

  @ApiPropertyWritable({ type: PaginationMetaDto })
  @Type(() => PaginationMetaDto)
  @Expose()
  meta: PaginationMetaDto;

  @Expose()
  @ApiPropertyWritable()
  message: string;
}




