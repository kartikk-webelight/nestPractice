import { Expose, Type } from "class-transformer";
import { MessageResponseDto, PaginationDataDto } from "dto/common-response.dto";
import { RoleStatus, UserRole } from "enums";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

export class RoleRequestResponse {
  @ApiPropertyWritable({ example: UserRole.AUTHOR })
  @Expose()
  requestedRole: UserRole;

  @ApiPropertyWritable({ example: RoleStatus.APPROVED })
  @Expose()
  status: RoleStatus;
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
