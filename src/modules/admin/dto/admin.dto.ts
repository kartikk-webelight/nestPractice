import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional } from "class-validator";
import { TrimString } from "decorators/trim-string.decorator";
import { PaginationQueryDto } from "dto/common-request.dto";
import { OrderBy, UserRole } from "enums";

export class GetUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @TrimString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @TrimString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: "2024-01-01" })
  @IsOptional()
  @TrimString()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: "2024-12-31" })
  @IsOptional()
  @TrimString()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ example: OrderBy.DESC })
  @IsOptional()
  @IsEnum(OrderBy)
  order?: OrderBy;

  @ApiPropertyOptional({ example: UserRole.AUTHOR })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
