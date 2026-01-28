import { ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsEnum, IsISO8601, IsOptional, IsString, Max, Min } from "class-validator";
import { IsAfter } from "decorators/date-range.decorator";
import { TrimString } from "decorators/trim-string.decorator";
import { OrderBy } from "enums";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

export class PaginationQueryDto {
  @ApiPropertyWritable({
    example: 1,
    description: "Page number to retrieve (starts from 1)",
  })
  @Expose()
  @Type(() => Number)
  @Min(1)
  page = 1;

  @ApiPropertyWritable({
    example: 10,
    description: "Number of records to return per page",
  })
  @Expose()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  limit = 10;
}

export class BaseQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: "nestjs",
    description: "Search term applied to multiple fields",
  })
  @IsOptional()
  @IsString()
  @TrimString()
  search?: string;

  @ApiPropertyOptional({ example: "2024-01-01", description: "Filter from this date" })
  @IsOptional()
  @IsISO8601()
  fromDate?: string;

  @ApiPropertyOptional({ example: "2024-12-31", description: "Filter up to this date" })
  @IsOptional()
  @IsISO8601()
  @IsAfter("fromDate", { message: "toDate must be after fromDate" })
  toDate?: string;

  @ApiPropertyOptional({ example: OrderBy.DESC, description: "Order of sorting" })
  @IsOptional()
  @IsEnum(OrderBy)
  order?: OrderBy;
}
