import { Expose, Type } from "class-transformer";
import { AttachmentResponseDto, MessageResponseDto, PaginationDataDto } from "dto/common-response.dto";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

export class PostAuthorResponse {
  @ApiPropertyWritable({
    example: "user_mxms123",
    description: "Unique identifier of the post author",
  })
  @Expose()
  id: string;

  @ApiPropertyWritable({
    example: "John Doe",
    description: "Name of the post author",
  })
  @Expose()
  name: string;

  @ApiPropertyWritable({
    example: "johndoe@gmail.com",
    description: "Email address of the post author",
  })
  @Expose()
  email: string;

  @ApiPropertyWritable({
    example: "author",
    description: "Role of the user who authored the post",
  })
  @Expose()
  role: string;
}

export class PostResponse {
  @ApiPropertyWritable({
    example: "post_mxmsoisx123",
    description: "Unique identifier of the post",
  })
  @Expose()
  id: string;

  @ApiPropertyWritable({
    example: "How to use NestJS DTOs correctly",
    description: "Title of the post",
  })
  @Expose()
  title: string;

  @ApiPropertyWritable({
    example: "This post explains how to properly design DTOs in NestJS...",
    description: "Content/body of the post",
  })
  @Expose()
  content: string;

  @ApiPropertyWritable({
    example: "published",
    description: "Current status of the post (draft, published, archived)",
  })
  @Expose()
  status: string;

  @ApiPropertyWritable({
    example: 152,
    description: "Number of times the post has been viewed",
  })
  @Expose()
  viewCount: number;

  @ApiPropertyWritable({
    example: 24,
    description: "Total number of likes received by the post",
  })
  @Expose()
  likes: number;

  @ApiPropertyWritable({
    example: "how-to-use-nestjs-dtos-correctly",
    description: "URL-friendly slug generated from the post title",
  })
  @Expose()
  slug: string;

  @ApiPropertyWritable({
    example: 3,
    description: "Total number of dislikes received by the post",
  })
  @Expose()
  dislikes: number;

  @ApiPropertyWritable({
    example: "2024-01-10T10:15:30.000Z",
    description: "Date and time when the post was created",
  })
  @Expose()
  createdAt: Date;

  @ApiPropertyWritable({
    example: "2024-01-12T08:00:00.000Z",
    nullable: true,
    description: "Date and time when the post was published; null if unpublished",
  })
  @Expose()
  publishedAt?: Date | null;

  @ApiPropertyWritable({
    example: "files uploaded on the post",
    nullable: true,
    description: "files uploaded on the post",
  })
  @Expose()
  @Type(() => AttachmentResponseDto)
  attachments?: AttachmentResponseDto[];

  @ApiPropertyWritable({
    type: PostAuthorResponse,
    description: "Author details of the post",
  })
  @Expose()
  @Type(() => PostAuthorResponse)
  author: PostAuthorResponse;
}

export class PostResponseDto extends MessageResponseDto {
  @ApiPropertyWritable({
    type: PostResponse,
    description: "Post details returned in the response",
  })
  @Type(() => PostResponse)
  @Expose()
  data: PostResponse;
}

export class PostsPaginationDataDto extends PaginationDataDto {
  @ApiPropertyWritable({
    type: [PostResponse],
    description: "List of posts for the current page",
  })
  @Type(() => PostResponse)
  @Expose()
  data: PostResponse[];
}

export class PaginatedPostResponseDto extends MessageResponseDto {
  @ApiPropertyWritable({
    type: PostsPaginationDataDto,
    description: "Paginated posts response with metadata",
  })
  @Type(() => PostsPaginationDataDto)
  @Expose()
  data: PostsPaginationDataDto;
}

export class GetAllPostsResponseDto extends PaginatedPostResponseDto {}
