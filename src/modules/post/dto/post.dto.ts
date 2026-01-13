import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { TrimString } from "decorators/trim-string.decorator";
import { PaginationQueryDto } from "dto/common-request.dto";
import { PostOrderBy, PostSortBy } from "enums";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

export class CreatePostDto {
  @ApiPropertyWritable({
    example: "Post title",
    description: "Title of the post",
  })
  @IsNotEmpty({ message: "Post title is required" })
  @TrimString()
  title: string;

  @ApiPropertyWritable({
    example: "Post content",
    description: "Content/body of the post",
  })
  @IsNotEmpty({ message: "Post content is required" })
  @TrimString()
  content: string;
}

export class SearchPostsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: "nestjs" })
  @IsOptional()
  @IsString()
  @TrimString()
  q?: string; // title + content

  @ApiPropertyOptional({ example: "2024-01-01" })
  @IsOptional()
  @TrimString()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: "2024-12-31" })
  @IsOptional()
  @TrimString()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ example: "likes" })
  @IsOptional()
  @IsEnum(PostSortBy)
  sortBy?: PostSortBy;

  @ApiPropertyOptional({ example: "DESC" })
  @IsOptional()
  @IsEnum(PostOrderBy)
  order?: PostOrderBy;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}

export class GetAllPostsDto extends PaginationQueryDto {}

export class GetPublishedPostsDto extends PaginationQueryDto {}

export class GetMyPostsDto extends PaginationQueryDto {}
