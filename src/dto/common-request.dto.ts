import { ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsEnum, IsISO8601, IsOptional, IsString, Max, Min } from "class-validator";
import { IsAfter } from "decorators/date-range.decorator";
import { TrimString } from "decorators/trim-string.decorator";
import { OrderBy } from "enums";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

// Basic pagination parameters for list requests
export class PaginationQueryDto {
  @ApiPropertyWritable({
    example: 1,
    description: "Page number to retrieve (starts from 1)",
  })
  @Expose()
  @Type(() => Number)
  @Min(1)
  page = 1; // The page index to retrieve

  @ApiPropertyWritable({
    example: 10,
    description: "Number of records to return per page",
  })
  @Expose()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  limit = 10; // Maximum records per page
}

// Standard query parameters for filtering, searching, and sorting
export class BaseQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: "nestjs",
    description: "Search term applied to multiple fields",
  })
  @IsOptional()
  @IsString()
  @TrimString()
  search?: string; // Fuzzy search string

  @ApiPropertyOptional({ example: "2024-01-01", description: "Filter from this date" })
  @IsOptional()
  @IsISO8601()
  fromDate?: string; // ISO 8601 start date filter

  @ApiPropertyOptional({ example: "2024-12-31", description: "Filter up to this date" })
  @IsOptional()
  @IsISO8601()
  @IsAfter("fromDate", { message: "toDate must be after fromDate" })
  toDate?: string; // ISO 8601 end date filter

  @ApiPropertyOptional({ example: OrderBy.DESC, description: "Order of sorting" })
  @IsOptional()
  @IsEnum(OrderBy)
  order?: OrderBy; // Sort direction (ASC/DESC)
}
