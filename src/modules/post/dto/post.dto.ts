import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
import { TrimString } from "src/decorators/trim-string.decorator";
import { PaginationDto } from "src/dto/common.dto";

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


export class GetAllPostsDto extends PaginationDto {}

export class GetPublishedPostsDto extends PaginationDto {}

export class GetMyPostsDto extends PaginationDto {}
