import { Exclude, Expose, Type } from "class-transformer";
import { TrimString } from "src/decorators/trim-string.decorator";
import { UserRole } from "src/enums";
import { ApiPropertyWritable } from "src/swagger/swagger.writable.decorator";

export class PaginationMetaDto {
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


export class PaginationDto {
  @Expose()
  @TrimString()
  @ApiPropertyWritable()
  page: number;

  @ApiPropertyWritable()
  @TrimString()
  @Expose()
  limit: number;
}


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

export class PaginatedUserResponseDto {
  @ApiPropertyWritable({ type: [UsersResponse] })
  @Type(() => UsersResponse)
  @Expose()
  data: UsersResponse[];

  @ApiPropertyWritable({ type: PaginationMetaDto })
  @Type(() => PaginationMetaDto)
  @Expose()
  meta: PaginationMetaDto;

  @ApiPropertyWritable()
  @Expose()
  message: string;
}