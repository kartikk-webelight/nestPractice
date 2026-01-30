import { Expose, Type } from "class-transformer";
import { UserRole } from "enums";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

// Standard response wrapper with a status message
export class MessageResponseDto {
  @ApiPropertyWritable({
    example: "User fetched successfully",
    description: "Human-readable message describing the result of the request",
  })
  @Expose()
  message: string;
}

// Data shape for file attachments
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

// Core user data structure
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

// Wrapper for a single user response
export class UserResponseDto extends MessageResponseDto {
  @ApiPropertyWritable({ type: UserResponse, description: "User details" })
  @Expose()
  @Type(() => UserResponse)
  data: UserResponse;
}

// Metadata for paginated results
export class PaginationDataDto {
  @Expose() total: number;
  @Expose() page: number;
  @Expose() limit: number;
  @Expose() totalPages: number;
}

// Payload structure for a list of users
export class UsersPaginationResponseDto extends PaginationDataDto {
  @ApiPropertyWritable({ type: [UserResponse], description: "List of users" })
  @Type(() => UserResponse)
  @Expose()
  data: UserResponse[];
}

// Final response for paginated user requests
export class PaginatedUserResponseDto extends MessageResponseDto {
  @ApiPropertyWritable({ type: UsersPaginationResponseDto, description: "Paginated users payload" })
  @Expose()
  @Type(() => UsersPaginationResponseDto)
  data: UsersPaginationResponseDto;
}
