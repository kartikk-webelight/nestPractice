import { PartialType } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
import { TrimString } from "decorators/trim-string.decorator";
import { BaseQueryDto } from "dto/common-request.dto";
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

export class GetCategoriesQueryDto extends BaseQueryDto {}
