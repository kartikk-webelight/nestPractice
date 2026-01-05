import { Controller, Get, Post, Body, Res, Param, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import responseUtils from "src/utils/response.utils";
import { UsersResponse } from "./users.response";
import { UsersEntity } from "./users.entity";
import { UsersService } from "./users.service";
import { ApiSwaggerResponse } from "../swagger/swagger.decorator";
import { MessageResponse } from "../swagger/dtos/response.dtos";
import { CreateUserDto, loginDto } from "./users.dto";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiSwaggerResponse(MessageResponse, { status: StatusCodes.CREATED })
  @Post("create")
  async create(@Res() res: Response, @Body() user: CreateUserDto) {
    try {
      await this.usersService.create(user);
      return responseUtils.success(res, {
        data: { message: "User created successfully" },
        status: StatusCodes.CREATED,
      });
    } catch (error) {
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(UsersResponse)
  @Get()
  async findAll(@Res() res: Response) {
    try {
      const users = await this.usersService.findAll();

      return responseUtils.success(res, {
        data: users,
        status: StatusCodes.OK,
      });
    } catch (error) {
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(UsersResponse, { status: StatusCodes.OK })
  @Get(":id")
  async getUserById(@Res() res: Response, @Param("id") userId: string) {
    try {
      const user = await this.usersService.getUserById(userId);
      return responseUtils.success(res, {
        data: user,
        status: StatusCodes.OK,
      });
    } catch (error) {
      return responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(UsersResponse, { status: StatusCodes.OK })
  @Post("login")
  async login(@Body() body: loginDto, @Res() res: Response) {
    try {
      const { refreshToken, accessToken } = await this.usersService.login(body);
      const cookieOptions = {
        httpOnly: true,
        sameSite: "strict" as const,
      };
      res.cookie("refreshToken", refreshToken, cookieOptions);
      res.cookie("accessToken", accessToken, cookieOptions);
      return responseUtils.success(res, {
        data: { refreshToken, accessToken },
        status: StatusCodes.OK,
      });
    } catch (error) {
      responseUtils.error({ res, error });
    }
  }

  @ApiSwaggerResponse(UsersResponse, { status: StatusCodes.OK })
  @Post("refreshToken")
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    const result = await this.usersService.refreshToken(incomingRefreshToken);

    const cookieOptions = {
      httpOnly: true,
    };

    res.cookie("accessToken", result.newAccessToken, cookieOptions);
    res.cookie("refreshToken", result.newRefreshToken, cookieOptions);

    return responseUtils.success(res, {
      data: { accessToken: result.newAccessToken, refreshToken: result.newRefreshToken },
      status: StatusCodes.OK,
    });
  }
}
