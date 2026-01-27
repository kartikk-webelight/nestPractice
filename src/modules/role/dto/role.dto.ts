import { IsEnum, IsNotEmpty, IsOptional } from "class-validator";
import { TrimString } from "decorators/trim-string.decorator";
import { BaseQueryDto } from "dto/common-request.dto";
import { RoleRequestAction, RoleStatus, UserRole } from "enums";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

export class CreateRoleRequestDto {
  @ApiPropertyWritable({ example: UserRole.AUTHOR, description: "Requested role" })
  @TrimString()
  @IsNotEmpty()
  @IsEnum(UserRole)
  requestedRole: UserRole;
}

export class UpdateRoleRequestDto {
  @ApiPropertyWritable({ example: RoleRequestAction.APPROVE, description: "action to approve or reject the request" })
  @TrimString()
  @IsNotEmpty()
  @IsEnum(RoleRequestAction)
  action: RoleRequestAction;
}

export class GetRoleRequestsQueryDto extends BaseQueryDto {
  @ApiPropertyWritable({ example: RoleStatus.APPROVED })
  @TrimString()
  @IsOptional()
  @IsEnum(RoleStatus)
  status?: RoleStatus;
}
