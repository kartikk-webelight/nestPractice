import { Controller, Get, Post, Body, Res, Param, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import responseUtils from "src/utils/response.utils";
import { UsersResponse } from "./users.response";
import { UsersService } from "./users.service";
import { ApiSwaggerResponse } from "../../swagger/swagger.decorator";
import { MessageResponse } from "../../swagger/dtos/response.dtos";
import { CreateUserDto, loginDto, updateDetailsDto } from "./users.dto";
import { AuthGuard } from "src/guards/auth-guard";
@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @ApiSwaggerResponse(UsersResponse, { status: StatusCodes.OK })
  @UseGuards(AuthGuard)
  @Get("current")
  async getCurrentUser(@Req() req: Request, @Res() res: Response) {

    const result = await this.usersService.getCurrentUser(req.user.id);

    return responseUtils.success(res, {
      data: {result, message:"current user"},
      status: StatusCodes.OK,
    });
  }

  @ApiSwaggerResponse(UsersResponse)
  @Get()
  async findAll(@Res() res: Response) {
    const result = await this.usersService.findAll();

    return responseUtils.success(res, {
      data: {result, message:"all users fetched"},
      status: StatusCodes.OK,
    });
  }

  @ApiSwaggerResponse(MessageResponse, { status: StatusCodes.CREATED })
  @Post("create")
  async create(@Res() res: Response, @Body() body: CreateUserDto) {
    const result = await this.usersService.create(body);
    return responseUtils.success(res, {
      data: { result, message: "User created successfully" },
      status: StatusCodes.CREATED,
    });
  }


  @ApiSwaggerResponse(UsersResponse, { status: StatusCodes.OK })
  @Get(":id")
  async getUserById(@Res() res: Response, @Param("id") userId: string) {
    const result = await this.usersService.getUserById(userId);
    return responseUtils.success(res, {
      data: {result, message:"user fetched"},
      status: StatusCodes.OK,
    });
  }

  @ApiSwaggerResponse(UsersResponse, { status: StatusCodes.OK })
  @Post("login")
  async login(@Body() body: loginDto, @Res() res: Response) {
    const result = await this.usersService.login(body);
    const cookieOptions = {
      httpOnly: true,
      sameSite: "strict" as const,
    };
    res.cookie("refreshToken", result.refreshToken, cookieOptions);
    res.cookie("accessToken", result.accessToken, cookieOptions);
    return responseUtils.success(res, {
      data: { result, message:"user logged in"},
      status: StatusCodes.OK,
    });
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
      data: { result, message:"tokens refreshed" },
      status: StatusCodes.OK,
    });
  }

  @ApiSwaggerResponse(UsersResponse, {status:StatusCodes.OK})
  @UseGuards(AuthGuard)
  @Post("update")
  async updateDetails(
    @Req() req:Request,
    @Body() body:updateDetailsDto,
    @Res() res:Response 
  ){
    const result=await this.usersService.updateDetails(body, req.user.id)

    return responseUtils.success(res,{
      data:{result, message:"details updated successfully"}
    })
  }



  @ApiSwaggerResponse(UsersResponse, { status: StatusCodes.ACCEPTED })
  @UseGuards(AuthGuard)
  @Post('logout')
  async logoutUser(
    @Req() req: Request,
    @Res() res: Response
  ) {
    const result = await this.usersService.logoutUser(req.user.id)

    const cookieOptions = {
      httpOnly: true
    }
    res.clearCookie("accessToken", cookieOptions)
    res.clearCookie("refreshToken", cookieOptions)

    return responseUtils.success(res, {
      data: {result, message:"user logged out" }
    })
  }
}
