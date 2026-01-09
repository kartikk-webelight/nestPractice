import { Expose } from "class-transformer";
import { TrimString } from "decorators/trim-string.decorator";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

export class PaginationQueryDto {
  @Expose()
  @TrimString()
  @ApiPropertyWritable()
  page: number;

  @ApiPropertyWritable()
  @TrimString()
  @Expose()
  limit: number;
}
