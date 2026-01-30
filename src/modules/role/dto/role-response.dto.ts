import { Expose, Type } from "class-transformer";
import { MessageResponseDto, PaginationDataDto } from "dto/common-response.dto";
import { RoleStatus, UserRole } from "enums";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

export class RoleRequestUser {
  @ApiPropertyWritable({
    example: "user_mxms123",
    description: "Unique identifier of the role request user",
  })
  @Expose()
  id: string;

  @ApiPropertyWritable({
    example: "John Doe",
    description: "Name of the  user",
  })
  @Expose()
  name: string;

  @ApiPropertyWritable({
    example: "johndoe@gmail.com",
    description: "Email address of the user ",
  })
  @Expose()
  email: string;

  @ApiPropertyWritable({
    example: UserRole.AUTHOR,
    description: "Role of the user",
  })
  @Expose()
  role: UserRole;
}

export class RoleRequestResponse {
  @ApiPropertyWritable({ example: "diwpjdsnoixj" })
  @Expose()
  id: string;

  @ApiPropertyWritable({ type: RoleRequestUser })
  @Type(() => RoleRequestUser)
  @Expose()
  user: RoleRequestUser;

  @ApiPropertyWritable({ example: UserRole.AUTHOR })
  @Expose()
  requestedRole: UserRole;

  @ApiPropertyWritable({ example: RoleStatus.APPROVED })
  @Expose()
  status: RoleStatus;

  @ApiPropertyWritable({
    example: "2024-01-10T09:30:00.000Z",
    description: "Date and time when the role request was created",
  })
  @Expose()
  createdAt: Date;
}

export class GetRequestedRoleStatusResponseDto extends MessageResponseDto {
  @ApiPropertyWritable({ type: RoleRequestResponse })
  @Type(() => RoleRequestResponse)
  @Expose()
  data: RoleRequestResponse;
}

export class RoleRequestPaginationDataDto extends PaginationDataDto {
  @ApiPropertyWritable({ type: [RoleRequestResponse] })
  @Type(() => RoleRequestResponse)
  @Expose()
  data: RoleRequestResponse[];
}

export class PaginatedRoleRequestsResponseDto extends MessageResponseDto {
  @ApiPropertyWritable({ type: RoleRequestPaginationDataDto })
  @Type(() => RoleRequestPaginationDataDto)
  @Expose()
  data: RoleRequestPaginationDataDto;
}

export class GetRoleRequestsResponseDto extends PaginatedRoleRequestsResponseDto {}
