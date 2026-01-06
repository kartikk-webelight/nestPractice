import { ApiPropertyWritable } from "src/swagger/swagger.writable.decorator";

import { Expose } from "class-transformer";

export class UsersResponse {
  @Expose()
  @ApiPropertyWritable()
  id: string;

  @Expose()
  @ApiPropertyWritable()
  name: string;

  @Expose()
  @ApiPropertyWritable()
  email: string;
}
