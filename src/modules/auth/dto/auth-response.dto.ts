import { Expose } from "class-transformer";
import { MessageResponseDto, UserResponseDto } from "dto/common-response.dto";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

export class CreateUserResponseDto extends UserResponseDto {}

export class UpdateUserResponseDto extends UserResponseDto {}

export class CurrentUserResponseDto extends UserResponseDto {}

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

export class RefreshTokenResponse {
  @ApiPropertyWritable({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.newAccess",
    description: "Newly issued JWT access token",
  })
  @Expose()
  newAccessToken: string;
}

export class RefreshTokenResponseDto extends MessageResponseDto {
  @ApiPropertyWritable({
    type: RefreshTokenResponse,
    description: "New authentication tokens returned after refreshing",
  })
  @Expose()
  data: RefreshTokenResponse;
}
