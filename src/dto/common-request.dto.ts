import { Expose, Type } from "class-transformer";
import { Max, Min } from "class-validator";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

export class PaginationQueryDto {
  @ApiPropertyWritable({
    example: 1,
    description: "Page number to retrieve (starts from 1)",
  })
  @Expose()
  @Type(() => Number)
  @Min(1)
  page: number = 1;

  @ApiPropertyWritable({
    example: 10,
    description: "Number of records to return per page",
  })
  @Expose()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  limit: number = 10;
}
