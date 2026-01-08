import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional } from "class-validator";
import { TrimString } from "src/decorators/trim-string.decorator";

export class CreateUserDto {
  @ApiProperty({
    example: "jhon doe",
    description: "name of the user",
  })
  @IsNotEmpty()
  @TrimString()
  name: string;

  @ApiProperty({
    example: "jhondoe@gmail.com",
    description: "email of the user",
  })
  @IsNotEmpty()
  @TrimString()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "jhondoe123",
    description: "password of the user",
  })
  @IsNotEmpty()
  @TrimString()
  password: string;
}

export class LoginDto {
  @ApiProperty({
    example: "jhondoe@gmail.com",
    description: "email of the user",
  })
  @IsNotEmpty()
  @TrimString()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "jhondoe123",
    description: "password of the user",
  })
  @IsNotEmpty()
  @TrimString()
  password: string;
}


export class UpdateDetailsDto {
  @ApiProperty({
    example: "jhon doe",
    description: "name of the user",
  })
  @IsOptional()
  @IsNotEmpty()
  @TrimString()
  name?: string;

  @ApiProperty({
    example: "jhondoe@gmail.com",
    description: "new email of the user",
  })
  @IsOptional()
  @IsNotEmpty()
  @TrimString()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: "jhondoe123",
    description: "password of the user",
  })
  @IsNotEmpty()
  @TrimString()
  password: string;
}
