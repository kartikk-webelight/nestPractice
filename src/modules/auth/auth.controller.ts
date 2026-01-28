import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags } from "@nestjs/swagger";
import { StatusCodes } from "http-status-codes";
import { accessCookieOptions, refreshCookieOptions } from "config/cookie.config";
import { SUCCESS_MESSAGES } from "constants/messages.constants";
import { MessageResponseDto } from "dto/common-response.dto";
import { AuthGuard } from "guards/auth-guard";
import { multerMemoryOptions } from "shared/multer/multer.service";
import { ApiSwaggerResponse } from "swagger/swagger.decorator";
import responseUtils from "utils/response.utils";
import { AuthService } from "./auth.service";
import {
  CreateUserResponseDto,
  CurrentUserResponseDto,
  LoginResponseDto,
  LogoutUserResponseDto,
  RefreshResponseDto,
  UpdateUserResponseDto,
} from "./dto/auth-response.dto";
import { CreateUserDto, LoginDto, ResendVerificationEmailDto, UpdateDetailsDto } from "./dto/auth.dto";
import type { Request, Response } from "express";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiSwaggerResponse(CreateUserResponseDto, { status: StatusCodes.CREATED })
  @UseInterceptors(FileInterceptor("file", multerMemoryOptions))
  @Post()
  async create(@Res() res: Response, @Body() body: CreateUserDto, @UploadedFile() file: Express.Multer.File) {
    const data = await this.authService.create(body, file);

    return responseUtils.success<CreateUserResponseDto>(res, {
      data: { data, message: SUCCESS_MESSAGES.CREATED },
      status: StatusCodes.CREATED,
      transformWith: CreateUserResponseDto,
    });
  }

  @ApiSwaggerResponse(CurrentUserResponseDto)
  @UseGuards(AuthGuard)
  @Get()
  async getCurrentUser(@Req() req: Request, @Res() res: Response) {
    const data = await this.authService.getCurrentUser(req.user.id);

    return responseUtils.success<CurrentUserResponseDto>(res, {
      data: { data, message: SUCCESS_MESSAGES.USER_FETCHED },
      status: StatusCodes.OK,
      transformWith: CurrentUserResponseDto,
    });
  }

  @ApiSwaggerResponse(LoginResponseDto, { status: StatusCodes.OK })
  @Post("login")
  async login(@Body() body: LoginDto, @Res() res: Response) {
    const data = await this.authService.login(body);

    res.cookie("refreshToken", data.refreshToken, refreshCookieOptions);
    res.cookie("accessToken", data.accessToken, accessCookieOptions);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.USER_LOGGED_IN },
      status: StatusCodes.OK,
      transformWith: LoginResponseDto,
    });
  }

  @ApiSwaggerResponse(RefreshResponseDto, { status: StatusCodes.OK })
  @Post("refresh-token")
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    const data = await this.authService.refreshToken(incomingRefreshToken);

    res.cookie("accessToken", data.newAccessToken, accessCookieOptions);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.TOKEN_REFRESHED },
      status: StatusCodes.OK,
      transformWith: RefreshResponseDto,
    });
  }

  @ApiSwaggerResponse(UpdateUserResponseDto, { status: StatusCodes.OK })
  @UseGuards(AuthGuard)
  @Patch()
  async updateDetails(@Req() req: Request, @Body() body: UpdateDetailsDto, @Res() res: Response) {
    const data = await this.authService.updateDetails(body, req.user.id);

    return responseUtils.success<UpdateUserResponseDto>(res, {
      data: { data, message: SUCCESS_MESSAGES.UPDATED },
      transformWith: UpdateUserResponseDto,
    });
  }

  @ApiSwaggerResponse(LogoutUserResponseDto)
  @UseGuards(AuthGuard)
  @Post("logout")
  async logoutUser(@Req() req: Request, @Res() res: Response) {
    const data = await this.authService.logoutUser(req.user.id);

    const cookieOptions = {
      httpOnly: true,
    };
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.USER_LOGGED_OUT },
    });
  }

  @ApiSwaggerResponse(MessageResponseDto)
  @Get("verify-email")
  async verifyEmail(@Query("token") token: string, @Res() res: Response) {
    await this.authService.verifyEmail(token);

    return responseUtils.success(res, {
      data: { message: "email verified" },
      transformWith: MessageResponseDto,
    });
  }

  @ApiSwaggerResponse(MessageResponseDto)
  @Post("resend-verification-email")
  async resendVerificationEmail(@Body() body: ResendVerificationEmailDto, @Res() res: Response) {
    await this.authService.resendVerificationEmail(body.email);

    return responseUtils.success(res, {
      data: { message: SUCCESS_MESSAGES.EMAIL_SENT },
      transformWith: MessageResponseDto,
    });
  }
}
