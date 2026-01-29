import { Expose, Type } from "class-transformer";
import { UserRole } from "enums";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

/**
 * Standard response wrapper containing a status message.
 * @group Common DTOs
 */
export class MessageResponseDto {
  @ApiPropertyWritable({
    example: "User fetched successfully",
    description: "Human-readable message describing the result of the request",
  })
  @Expose()
  message: string;
}

/**
 * Represents a file attachment (image, document, etc.) associated with an entity.
 * @group Media
 */
export class AttachmentResponseDto {
  @ApiPropertyWritable({ description: "Attachment id", example: "a_123xyz" })
  @Expose()
  id: string;

  @ApiPropertyWritable({ description: "Secure path of the attachment", example: "/image.jpg" })
  @Expose()
  path: string;

  @ApiPropertyWritable({ description: "MIME type of the attachment", example: "image/png" })
  @Expose()
  mimeType: string;

  @ApiPropertyWritable({ description: "File size in bytes", example: 245678 })
  @Expose()
  size: number;

  @ApiPropertyWritable({ description: "Original file name", example: "cover.png", required: false })
  @Expose()
  originalName?: string;
}

/**
 * Data shape for a User entity.
 * @group User Management
 */
export class UserResponse {
  @ApiPropertyWritable({ example: "user_mxmsoisx123", description: "Unique identifier of the user" })
  @Expose()
  id: string;

  @ApiPropertyWritable({ example: "John Doe", description: "Full name of the user" })
  @Expose()
  name: string;

  @ApiPropertyWritable({ example: "johndoe@gmail.com", description: "Email address of the user" })
  @Expose()
  email: string;

  @ApiPropertyWritable({ enum: UserRole, example: UserRole.AUTHOR, description: "Role assigned to the user" })
  @Expose()
  role: UserRole;

  /**
   * Collection of profile attachments.
   */
  @ApiPropertyWritable({ description: "Profile image of the user", required: false, type: [AttachmentResponseDto] })
  @Expose()
  @Type(() => AttachmentResponseDto)
  attachment?: AttachmentResponseDto[];

  @ApiPropertyWritable({ example: "2024-01-10T09:30:00.000Z", description: "Date/time of creation" })
  @Expose()
  createdAt: Date;

  @ApiPropertyWritable({ example: "2024-01-15T12:45:20.000Z", description: "Date/time of last update" })
  @Expose()
  updatedAt: Date;
}

/**
 * Wrapped response for a single user fetch.
 * @group User Management
 */
export class UserResponseDto extends MessageResponseDto {
  @ApiPropertyWritable({ type: UserResponse, description: "User details" })
  @Expose()
  @Type(() => UserResponse)
  data: UserResponse;
}

/**
 * Metadata for paginated collections.
 * @group Common DTOs
 */
export class PaginationDataDto {
  @Expose() total: number;
  @Expose() page: number;
  @Expose() limit: number;
  @Expose() totalPages: number;
}

/**
 * Container for a paginated list of users.
 * @group User Management
 */
export class UsersPaginationResponseDto extends PaginationDataDto {
  @ApiPropertyWritable({ type: [UserResponse], description: "List of users" })
  @Type(() => UserResponse)
  @Expose()
  data: UserResponse[];
}

/**
 * Final response structure for paginated user requests.
 * @group User Management
 */
export class PaginatedUserResponseDto extends MessageResponseDto {
  @ApiPropertyWritable({ type: UsersPaginationResponseDto, description: "Paginated users payload" })
  @Expose()
  @Type(() => UsersPaginationResponseDto)
  data: UsersPaginationResponseDto;
}
