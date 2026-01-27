import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional } from "class-validator";
import { TrimString } from "decorators/trim-string.decorator";
import { ApiPropertyWritable } from "swagger/swagger.writable.decorator";

export class CreateUserDto {
  @ApiProperty({
    example: "John Doe",
    description: "Full name of the user",
  })
  @IsNotEmpty({ message: "Name is required" })
  @TrimString()
  name: string;

  @ApiProperty({
    example: "johndoe@gmail.com",
    description: "Email address of the user",
  })
  @IsNotEmpty({ message: "Email is required" })
  @TrimString()
  @IsEmail({}, { message: "Email must be a valid email address" })
  email: string;

  @ApiProperty({
    example: "John@1234",
    description: "Password used to authenticate the user",
  })
  @IsNotEmpty({ message: "Password is required" })
  @TrimString()
  password: string;
}

export class LoginDto {
  @ApiPropertyWritable({
    example: "johndoe@gmail.com",
    description: "Registered email address of the user",
  })
  @IsNotEmpty({ message: "Email is required" })
  @TrimString()
  @IsEmail({}, { message: "Email must be a valid email address" })
  email: string;

  @ApiPropertyWritable({
    example: "John@1234",
    description: "Account password",
  })
  @IsNotEmpty({ message: "Password is required" })
  @TrimString()
  password: string;
}

export class UpdateDetailsDto {
  @ApiPropertyWritable({
    example: "John Doe",
    description: "Updated full name of the user",
    required: false,
  })
  @IsOptional()
  @IsNotEmpty({ message: "Name must not be empty if provided" })
  @TrimString()
  name?: string;

  @ApiPropertyWritable({
    example: "john.updated@gmail.com",
    description: "Updated email address of the user",
    required: false,
  })
  @IsOptional()
  @IsNotEmpty({ message: "Email must not be empty if provided" })
  @TrimString()
  @IsEmail({}, { message: "Email must be a valid email address" })
  email?: string;

  @ApiPropertyWritable({
    example: "NewPass@123",
    description: "Current or new password used to confirm the update",
  })
  @IsNotEmpty({ message: "Password is required to update user details" })
  @TrimString()
  password: string;
}

export class ResendVerificationEmailDto {
  @ApiPropertyWritable({
    example: "john.updated@gmail.com",
    description: "Updated email address of the user",
  })
  @IsNotEmpty({ message: "Email must not be empty if provided" })
  @TrimString()
  @IsEmail({}, { message: "Email must be a valid email address" })
  email: string;
}
