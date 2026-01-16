import { Expose, Type } from "class-transformer";
import { UserRole } from "enums";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

export class MessageResponseDto {
  @ApiPropertyWritable({
    example: "User fetched successfully",
    description: "Human-readable message describing the result of the request",
  })
  @Expose()
  message: string;
}

export class AttachmentResponseDto {
  @ApiPropertyWritable({
    description: "Attachment id",
    example: "a_123xyz",
  })
  @Expose()
  id: string;

  @ApiPropertyWritable({
    description: "Secure path of the attachment",
    example: "/image.jpg",
  })
  @Expose()
  path: string;

  @ApiPropertyWritable({
    description: "MIME type of the attachment",
    example: "image/png",
  })
  @Expose()
  mimeType: string;

  @ApiPropertyWritable({
    description: "File size in bytes",
    example: 245678,
  })
  @Expose()
  size: number;

  @ApiPropertyWritable({
    description: "Original file name",
    example: "cover.png",
    required: false,
  })
  @Expose()
  originalName?: string;
}

export class UsersResponse {
  @ApiPropertyWritable({
    example: "user_mxmsoisx123",
    description: "Unique identifier of the user",
  })
  @Expose()
  id: string;

  @ApiPropertyWritable({
    example: "John Doe",
    description: "Full name of the user",
  })
  @Expose()
  name: string;

  @ApiPropertyWritable({
    example: "johndoe@gmail.com",
    description: "Email address of the user",
  })
  @Expose()
  email: string;

  @ApiPropertyWritable({
    enum: UserRole,
    example: UserRole.AUTHOR,
    description: "Role assigned to the user in the system",
  })
  @Expose()
  role: UserRole;

  @ApiPropertyWritable({
    description: "Profile image of the user",
    required: false,
    type: [AttachmentResponseDto],
  })
  @Expose()
  @Type(() => AttachmentResponseDto)
  attachment?: AttachmentResponseDto[];

  @ApiPropertyWritable({
    example: "2024-01-10T09:30:00.000Z",
    description: "Date and time when the user was created",
  })
  @Expose()
  createdAt: Date;

  @ApiPropertyWritable({
    example: "2024-01-15T12:45:20.000Z",
    description: "Date and time when the user was last updated",
  })
  @Expose()
  updatedAt: Date;
}

export class UsersResponseDto extends MessageResponseDto {
  @ApiPropertyWritable({
    type: UsersResponse,
    description: "User details returned in the response",
  })
  @Type(() => UsersResponse)
  @Expose()
  data: UsersResponse;
}

export class PaginationDataDto {
  @ApiPropertyWritable({
    example: 120,
    description: "Total number of records available",
  })
  @Expose()
  total: number;

  @ApiPropertyWritable({
    example: 1,
    description: "Current page number",
  })
  @Expose()
  page: number;

  @ApiPropertyWritable({
    example: 10,
    description: "Number of records per page",
  })
  @Expose()
  limit: number;

  @ApiPropertyWritable({
    example: 12,
    description: "Total number of pages available",
  })
  @Expose()
  totalPages: number;
}

export class UsersPaginationDataDto extends PaginationDataDto {
  @ApiPropertyWritable({
    type: [UsersResponse],
    description: "List of users for the current page",
  })
  @Type(() => UsersResponse)
  @Expose()
  data: UsersResponse[];
}

export class PaginatedUserResponseDto extends MessageResponseDto {
  @ApiPropertyWritable({
    type: UsersPaginationDataDto,
    description: "Paginated users response along with metadata",
  })
  @Expose()
  @Type(() => UsersPaginationDataDto)
  data: UsersPaginationDataDto;
}
