import { Expose, Type } from "class-transformer";
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

export class UsersResponseDto {
  @ApiPropertyWritable({ type: UsersResponse })
  @Type(() => UsersResponse)
  @Expose()
  data: UsersResponse;

  @ApiPropertyWritable()
  @Expose()
  message: string;
}

export class PaginationDataDto {
  @ApiPropertyWritable()
  @Expose()
  total: number;

  @ApiPropertyWritable()
  @Expose()
  page: number;

  @ApiPropertyWritable()
  @Expose()
  limit: number;

  @ApiPropertyWritable()
  @Expose()
  totalPages: number;
}

export class UsersPaginationDataDto extends PaginationDataDto {
  @ApiPropertyWritable({ type: [UsersResponse] })
  @Type(() => UsersResponse)
  @Expose()
  data: UsersResponse[];
}

export class PaginatedUserResponseDto {
  @ApiPropertyWritable({ type: UsersPaginationDataDto })
  @Expose()
  @Type(() => UsersPaginationDataDto)
  data: UsersPaginationDataDto;

  @ApiPropertyWritable()
  @Expose()
  message: string;
}
