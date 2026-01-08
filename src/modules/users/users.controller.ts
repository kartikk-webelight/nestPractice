import { Controller, Get, Post, Body, Res, Param, Req, UseGuards, Patch, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import responseUtils from "src/utils/response.utils";
import { UsersService } from "./users.service";
import { ApiSwaggerResponse } from "../../swagger/swagger.decorator";
import { CreateUserDto, LoginDto, UpdateDetailsDto } from "./dto/users.dto";
import { AuthGuard } from "src/guards/auth-guard";
import {
  GetAllUsersDto,
  LoginResponseDto,
  PaginatedUserResponseDto,
  RefreshResponseDto,
  UsersResponseDto,
} from "./dto/users-response.dto";
@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiSwaggerResponse(UsersResponseDto)
  @UseGuards(AuthGuard)
  @Get("current")
  async getCurrentUser(@Req() req: Request, @Res() res: Response) {
    const data = await this.usersService.getCurrentUser(req.user.id);

    return responseUtils.success<UsersResponseDto>(res, {
      data: { data, message: "current user" },
      status: StatusCodes.OK,
      transformWith: UsersResponseDto,
    });
  }

  @ApiSwaggerResponse(PaginatedUserResponseDto)
  @Get()
  async getAllUsers(@Res() res: Response, @Query() query: GetAllUsersDto) {
    const { page, limit } = query;
    const { data, meta } = await this.usersService.getAllUsers(page, limit);

    return responseUtils.success(res, {
      data: { data, meta, message: "all users fetched" },
      status: StatusCodes.OK,
      transformWith: PaginatedUserResponseDto,
    });
  }

  @ApiSwaggerResponse(UsersResponseDto, { status: StatusCodes.CREATED })
  @Post("create")
  async create(@Res() res: Response, @Body() body: CreateUserDto) {
    const data = await this.usersService.create(body);
    return responseUtils.success(res, {
      data: { data, message: "User created successfully" },
      status: StatusCodes.CREATED,
      transformWith: UsersResponseDto,
    });
  }

  @ApiSwaggerResponse(UsersResponseDto, { status: StatusCodes.OK })
  @Get(":id")
  async getUserById(@Res() res: Response, @Param("id") userId: string) {
    const data = await this.usersService.getUserById(userId);
    return responseUtils.success(res, {
      data: { data, message: "user fetched" },
      status: StatusCodes.OK,
      transformWith: UsersResponseDto,
    });
  }

  @ApiSwaggerResponse(LoginResponseDto, { status: StatusCodes.OK })
  @Post("login")
  async login(@Body() body: LoginDto, @Res() res: Response) {
    const data = await this.usersService.login(body);
    const cookieOptions = {
      httpOnly: true,
      sameSite: "strict" as const,
    };
    res.cookie("refreshToken", data.refreshToken, cookieOptions);
    res.cookie("accessToken", data.accessToken, cookieOptions);
    return responseUtils.success(res, {
      data: { data, message: "user logged in" },
      status: StatusCodes.OK,
      transformWith: LoginResponseDto,
    });
  }

  @ApiSwaggerResponse(RefreshResponseDto, { status: StatusCodes.OK })
  @Post("refreshToken")
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    const data = await this.usersService.refreshToken(incomingRefreshToken);

    const cookieOptions = {
      httpOnly: true,
    };

    res.cookie("accessToken", data.newAccessToken, cookieOptions);
    res.cookie("refreshToken", data.newRefreshToken, cookieOptions);

    return responseUtils.success(res, {
      data: { data, message: "tokens refreshed" },
      status: StatusCodes.OK,
      transformWith: RefreshResponseDto,
    });
  }

  @ApiSwaggerResponse(UsersResponseDto, { status: StatusCodes.OK })
  @UseGuards(AuthGuard)
  @Patch("update")
  async updateDetails(@Req() req: Request, @Body() body: UpdateDetailsDto, @Res() res: Response) {
    const data = await this.usersService.updateDetails(body, req.user.id);

    return responseUtils.success(res, {
      data: { data, message: "details updated successfully" },
      transformWith: UsersResponseDto,
    });
  }

  @ApiSwaggerResponse(UsersResponseDto, { status: StatusCodes.ACCEPTED })
  @UseGuards(AuthGuard)
  @Post("logout")
  async logoutUser(@Req() req: Request, @Res() res: Response) {
    const data = await this.usersService.logoutUser(req.user.id);

    const cookieOptions = {
      httpOnly: true,
    };
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return responseUtils.success(res, {
      data: { data, message: "user logged out" },
    });
  }
}
