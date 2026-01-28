import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional } from "class-validator";
import { TrimString } from "decorators/trim-string.decorator";
import { BaseQueryDto, PaginationQueryDto } from "dto/common-request.dto";
import { PostStatus, SortBy } from "enums";
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

export class GetPostsQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ example: PostStatus.PUBLISHED })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiPropertyOptional({ example: SortBy.LIKES })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}

export class GetAllPostsDto extends PaginationQueryDto {}

export class GetPublishedPostsDto extends PaginationQueryDto {}

export class GetMyPostsDto extends PaginationQueryDto {}
