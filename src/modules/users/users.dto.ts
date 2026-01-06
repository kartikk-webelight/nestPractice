import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional } from "class-validator";
import { TrimString } from "src/decorators/trim-string.decorator";

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  password: string;
}

export class loginDto {
  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  password: string;
}

export class updateDetailsDto {

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  @TrimString()
  name?: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  @TrimString()
  @IsEmail()
  email?: string;

  @ApiProperty()
  @IsNotEmpty()
  @TrimString()
  password: string;
}

