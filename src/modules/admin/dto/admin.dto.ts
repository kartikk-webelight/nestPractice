import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { BaseQueryDto } from "dto/common-request.dto";
import { UserRole } from "enums";

export class GetUsersQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ example: UserRole.AUTHOR })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
