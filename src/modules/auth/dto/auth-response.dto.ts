import { Expose } from "class-transformer";
import { UsersResponseDto } from "dto/common-response.dto";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

export class CreateUserResponseDto extends UsersResponseDto {}

export class UpdateUserResponseDto extends UsersResponseDto {}

export class CurrentUserResponseDto extends UsersResponseDto {}

export class LogoutUserResponseDto {
  @ApiPropertyWritable()
  @Expose()
  data: {};

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
