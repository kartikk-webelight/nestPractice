import { IsNotEmpty } from "class-validator";
import { TrimString } from "decorators/trim-string.decorator";
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
