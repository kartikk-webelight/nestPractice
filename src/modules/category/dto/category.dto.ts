import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional } from "class-validator";
import { TrimString } from "decorators/trim-string.decorator";
import { PaginationQueryDto } from "dto/common-request.dto";
import { OrderBy, SortBy } from "enums";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

export class CreateCategoryDto {
  @ApiPropertyWritable()
  @TrimString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyWritable()
  @TrimString()
  @IsNotEmpty()
  description: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class GetCategoriesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: "nestjs" })
  @TrimString()
  @IsOptional()
  q?: string;

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

  @ApiPropertyOptional({ example: SortBy.LIKES })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;

  @ApiPropertyOptional({ example: OrderBy.DESC })
  @IsOptional()
  @IsEnum(OrderBy)
  order?: OrderBy;
}
