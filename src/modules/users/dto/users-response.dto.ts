import { ApiPropertyWritable } from "src/swagger/swagger.writable.decorator";
import { Exclude, Expose, Type } from "class-transformer";
import { UserRole } from "src/enums";
import { TrimString } from "src/decorators/trim-string.decorator";

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

export class LoginResponse {
  @ApiPropertyWritable()
  @Expose()
  accessToken: string;

  @ApiPropertyWritable()
  @Expose()
  refreshToken: string;
}

export class LoginResponseDto {
  @ApiPropertyWritable({ type: LoginResponse })
  @Expose()
  data: LoginResponse;

  @ApiPropertyWritable()
  @Expose()
  message: string;
}

export class RefreshResponse {
  @ApiPropertyWritable()
  @Expose()
  newAccessToken: string;

  @ApiPropertyWritable()
  @Expose()
  newRefreshToken: string;
}

export class RefreshResponseDto {
  @ApiPropertyWritable({ type: RefreshResponse })
  @Expose()
  data: RefreshResponse;

  @ApiPropertyWritable()
  @Expose()
  message: string;
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

export class GetAllUsersDto extends PaginationDto {}

export class GetPublishedPostsDto extends PaginationDto {}

export class GetMyPostsDto extends PaginationDto {}
