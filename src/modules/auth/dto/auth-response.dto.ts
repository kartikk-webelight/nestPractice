import { Expose } from "class-transformer";
import { MessageResponseDto, UsersResponseDto } from "dto/common-response.dto";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

export class CreateUserResponseDto extends UsersResponseDto {}

export class UpdateUserResponseDto extends UsersResponseDto {}

export class CurrentUserResponseDto extends UsersResponseDto {}

export class LogoutUserResponseDto extends MessageResponseDto {
  @ApiPropertyWritable({
    example: {},
    description: "Empty data object returned after successful logout",
  })
  @Expose()
  data: object;
}

export class LoginResponse {
  @ApiPropertyWritable({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access",
    description: "JWT access token used for authenticating API requests",
  })
  @Expose()
  accessToken: string;

  @ApiPropertyWritable({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh",
    description: "JWT refresh token used to obtain a new access token",
  })
  @Expose()
  refreshToken: string;
}

export class LoginResponseDto extends MessageResponseDto {
  @ApiPropertyWritable({
    type: LoginResponse,
    description: "Authentication tokens returned after successful login",
  })
  @Expose()
  data: LoginResponse;
}

export class RefreshResponse {
  @ApiPropertyWritable({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.newAccess",
    description: "Newly issued JWT access token",
  })
  @Expose()
  newAccessToken: string;
}

export class RefreshResponseDto extends MessageResponseDto {
  @ApiPropertyWritable({
    type: RefreshResponse,
    description: "New authentication tokens returned after refreshing",
  })
  @Expose()
  data: RefreshResponse;
}
