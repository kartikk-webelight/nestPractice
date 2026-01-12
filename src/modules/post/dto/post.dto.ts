import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
import { TrimString } from "decorators/trim-string.decorator";
import { PaginationQueryDto } from "dto/common-request.dto";
import {} from "dto/common-response.dto";

export class CreatePostDto {
  @ApiProperty({
    example: "Post title",
    description: "title of the post",
  })
  @IsNotEmpty()
  @TrimString()
  title: string;

  @ApiProperty({
    example: "Post content",
    description: "content of the post",
  })
  @IsNotEmpty()
  @TrimString()
  content: string;
}

export class UpdatePostDto {
  @ApiProperty({
    example: "Post title",
    description: "title of the post",
  })
  @IsNotEmpty()
  @TrimString()
  postId: string;

  @ApiProperty({
    example: "Post title",
    description: "title of the post",
  })
  @IsNotEmpty()
  @TrimString()
  title?: string;

  @ApiProperty({
    example: "Post content",
    description: "content of the post",
  })
  @IsNotEmpty()
  @TrimString()
  content?: string;
}

export class GetAllPostsDto extends PaginationQueryDto {}

export class GetPublishedPostsDto extends PaginationQueryDto {}

export class GetMyPostsDto extends PaginationQueryDto {}
