import { Exclude, Expose, Type } from "class-transformer";
import { UserRole } from "enums";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

export class UsersResponse {
  @ApiPropertyWritable()
  @Expose()
  id: string;

  @ApiPropertyWritable()
  @Expose()
  name: string;

  @ApiPropertyWritable()
  @Expose()
  email: string;

  @ApiPropertyWritable({ enum: UserRole })
  @Expose()
  role: UserRole;

  @ApiPropertyWritable()
  @Expose()
  createdAt: Date;

  @ApiPropertyWritable()
  @Expose()
  updatedAt: Date;
}

@Exclude()
export class UsersResponseDto {
  @ApiPropertyWritable({ type: UsersResponse })
  @Type(() => UsersResponse)
  @Expose()
  data: UsersResponse;

  @ApiPropertyWritable()
  @Expose()
  message: string;
}
