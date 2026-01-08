import { ApiPropertyWritable } from "src/swagger/swagger.writable.decorator";
import { Exclude, Expose, Type } from "class-transformer";
import { UserRole } from "src/enums";

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





