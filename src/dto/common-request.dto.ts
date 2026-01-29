import { ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsEnum, IsISO8601, IsOptional, IsString, Max, Min } from "class-validator";
import { IsAfter } from "decorators/date-range.decorator";
import { TrimString } from "decorators/trim-string.decorator";
import { OrderBy } from "enums";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

/**
 * Basic pagination parameters for list requests.
 * @group Common DTOs
 */
export class PaginationQueryDto {
  /**
   * The page index to retrieve.
   * @defaultValue 1
   */
  @ApiPropertyWritable({
    example: 1,
    description: "Page number to retrieve (starts from 1)",
  })
  @Expose()
  @Type(() => Number)
  @Min(1)
  page = 1;

  /**
   * Maximum number of records to return per page.
   * @defaultValue 10
   * @maximum 50
   */
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

/**
 * Standard query parameters for filtering, searching, and sorting.
 * @group Common DTOs
 */
export class BaseQueryDto extends PaginationQueryDto {
  /**
   * A fuzzy search string applied across multiple database columns.
   */
  @ApiPropertyOptional({
    example: "nestjs",
    description: "Search term applied to multiple fields",
  })
  @IsOptional()
  @IsString()
  @TrimString()
  search?: string;

  /**
   * Start date for filtering records (ISO 8601 format).
   */
  @ApiPropertyOptional({ example: "2024-01-01", description: "Filter from this date" })
  @IsOptional()
  @IsISO8601()
  fromDate?: string;

  /**
   * End date for filtering records. Must be chronologically after {@link fromDate}.
   */
  @ApiPropertyOptional({ example: "2024-12-31", description: "Filter up to this date" })
  @IsOptional()
  @IsISO8601()
  @IsAfter("fromDate", { message: "toDate must be after fromDate" })
  toDate?: string;

  /**
   * Direction of the sort.
   * @see {@link OrderBy}
   */
  @ApiPropertyOptional({ example: OrderBy.DESC, description: "Order of sorting" })
  @IsOptional()
  @IsEnum(OrderBy)
  order?: OrderBy;
}
