import { Expose, Type } from "class-transformer";
import { MessageResponseDto, PaginationDataDto } from "dto/common-response.dto";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

export class CategoryResponse {
  @ApiPropertyWritable({
    example: "c_mxmsoisx123",
    description: "Unique identifier of the category",
  })
  @Expose()
  id: string;

  @ApiPropertyWritable({
    example: "Tech",
    description: "Category that the post belongs to",
  })
  @Expose()
  name: string;

  @ApiPropertyWritable({
    example: "This Category explains how to properly design rotes in NestJS...",
    description: "Description of the category",
  })
  @Expose()
  description: string;

  @ApiPropertyWritable({
    example: "science-technology",
    description: "Unique URL-friendly identifier for the category",
  })
  @Expose()
  slug: string;

  @ApiPropertyWritable()
  @Expose()
  createdAt: Date;

  @ApiPropertyWritable()
  @Expose()
  updatedAt: Date;
}

export class CategoryResponseDto extends MessageResponseDto {
  @ApiPropertyWritable({ type: CategoryResponse })
  @Type(() => CategoryResponse)
  @Expose()
  data: CategoryResponse;
}

export class CategoriesPaginationResponseDto extends PaginationDataDto {
  @ApiPropertyWritable({ type: [CategoryResponse] })
  @Type(() => CategoryResponse)
  @Expose()
  data: CategoryResponse[];
}

export class PaginatedCategoryResponseDto extends MessageResponseDto {
  @ApiPropertyWritable({
    type: CategoriesPaginationResponseDto,
    description: "Paginated categories response with metadata",
  })
  @Type(() => CategoriesPaginationResponseDto)
  @Expose()
  data: CategoriesPaginationResponseDto;
}

export class CreateCategoryResponseDto extends CategoryResponseDto {}

export class UpdateCategoryResponseDto extends CategoryResponseDto {}

export class GetCategoryByIdResponseDto extends CategoryResponseDto {}

export class GetCategoriesResponseDto extends PaginatedCategoryResponseDto {}
