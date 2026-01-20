import { IsDateString, IsEnum, IsNotEmpty, IsOptional } from "class-validator";
import { TrimString } from "decorators/trim-string.decorator";
import { PaginationQueryDto } from "dto/common-request.dto";
import { OrderBy, RoleStatus, UserRole } from "enums";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

export class CreateRoleRequestDto {
  @ApiPropertyWritable({ example: "author", description: "Requested role" })
  @TrimString()
  @IsNotEmpty()
  requestedRole: UserRole;
}

export class UpdateRoleDto {
  @ApiPropertyWritable({ example: RoleStatus.APPROVED, description: "action to approve or reject the request" })
  @TrimString()
  @IsNotEmpty()
  @IsEnum(RoleStatus)
  action: RoleStatus;
}

export class GetRoleRequestsQueryDto extends PaginationQueryDto {
  @ApiPropertyWritable()
  @TrimString()
  @IsOptional()
  name?: string;

  @ApiPropertyWritable({ example: RoleStatus.APPROVED })
  @TrimString()
  @IsOptional()
  @IsEnum(RoleStatus)
  status?: RoleStatus;

  @ApiPropertyWritable({ example: OrderBy.DESC })
  @TrimString()
  @IsOptional()
  @IsEnum(OrderBy)
  order?: OrderBy;

  @ApiPropertyWritable({ example: "2024-12-31" })
  @TrimString()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyWritable({ example: "2024-12-31" })
  @TrimString()
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
