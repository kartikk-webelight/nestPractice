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
import { SUCCESS_MESSAGES } from "constants/messages";
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
  RefreshTokenResponseDto,
  UpdateUserResponseDto,
} from "./dto/auth-response.dto";
import { CreateUserDto, LoginDto, ResendVerificationEmailDto, UpdateDetailsDto } from "./dto/auth.dto";
import type { Request, Response } from "express";

/**
 * Handles incoming HTTP requests for authentication, session management, and account verification.
 *
 * @remarks
 * This controller serves as the entry point for identity operations, coordinating with the
 * {@link AuthService} to manage JWT issuance via cookies and validate user credentials.
 * @group Identity Controllers
 */
@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new user account and processes an optional profile image.
   *
   * @param res - The Express response object.
   * @param body - The {@link CreateUserDto} containing account details.
   * @param file - The profile image file from {@link FileInterceptor}.
   * @returns A success response with the created {@link CreateUserResponseDto}.
   */
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

  /**
   * Retrieves the profile data for the currently authenticated user.
   *
   * @param req - The {@link Request} object populated by the {@link AuthGuard}.
   * @param res - The Express response object.
   * @returns The user's profile information encapsulated in {@link CurrentUserResponseDto}.
   */
  @ApiSwaggerResponse(CurrentUserResponseDto)
  @UseGuards(AuthGuard)
  @Get()
  async getCurrentUser(@Req() req: Request, @Res() res: Response) {
    const data = await this.authService.getCurrentUser(req.user.id);

    return responseUtils.success<CurrentUserResponseDto>(res, {
      data: { data, message: SUCCESS_MESSAGES.USER_FETCHED },
      transformWith: CurrentUserResponseDto,
    });
  }

  /**
   * Authenticates user credentials and establishes a session via secure cookies.
   *
   * @param body - The {@link LoginDto} credentials.
   * @param res - The Express response object used to set authentication cookies.
   * @returns A confirmation message and tokens within {@link LoginResponseDto}.
   */
  @ApiSwaggerResponse(LoginResponseDto)
  @Post("login")
  async login(@Body() body: LoginDto, @Res() res: Response) {
    const data = await this.authService.login(body);

    res.cookie("refreshToken", data.refreshToken, refreshCookieOptions);
    res.cookie("accessToken", data.accessToken, accessCookieOptions);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.USER_LOGGED_IN },
      transformWith: LoginResponseDto,
    });
  }

  /**
   * Issues a new access token using a valid refresh token from cookies or body.
   *
   * @param req - The incoming request containing the refresh token.
   * @param res - The response object to update the access token cookie.
   * @returns The newly generated token wrapped in {@link RefreshTokenResponseDto}.
   */
  @ApiSwaggerResponse(RefreshTokenResponseDto)
  @Post("refresh-token")
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    const data = await this.authService.refreshToken(incomingRefreshToken);

    res.cookie("accessToken", data.newAccessToken, accessCookieOptions);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.TOKEN_REFRESHED },
      transformWith: RefreshTokenResponseDto,
    });
  }

  /**
   * Updates account details for the authenticated user.
   *
   * @param req - The request object containing user identity.
   * @param body - The {@link UpdateDetailsDto} with new account data.
   * @param res - The Express response object.
   * @returns The updated profile details via {@link UpdateUserResponseDto}.
   */
  @ApiSwaggerResponse(UpdateUserResponseDto)
  @UseGuards(AuthGuard)
  @Patch()
  async updateDetails(@Req() req: Request, @Body() body: UpdateDetailsDto, @Res() res: Response) {
    const data = await this.authService.updateDetails(body, req.user.id);

    return responseUtils.success<UpdateUserResponseDto>(res, {
      data: { data, message: SUCCESS_MESSAGES.UPDATED },
      transformWith: UpdateUserResponseDto,
    });
  }

  /**
   * Terminates the user session by clearing all authentication cookies.
   *
   * @param req - The request object.
   * @param res - The response object used to clear session identifiers.
   * @returns A simple success message indicating the session was destroyed.
   */
  @ApiSwaggerResponse(LogoutUserResponseDto)
  @UseGuards(AuthGuard)
  @Post("logout")
  async logoutUser(@Req() req: Request, @Res() res: Response) {
    const cookieOptions = {
      httpOnly: true,
    };
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return responseUtils.success(res, {
      data: { message: SUCCESS_MESSAGES.USER_LOGGED_OUT },
    });
  }

  /**
   * Finalizes account activation using the verification token sent via email.
   *
   * @param token - The unique verification identifier from the query string.
   * @param res - The Express response object.
   * @returns A {@link MessageResponseDto} confirming account activation.
   */
  @ApiSwaggerResponse(MessageResponseDto)
  @Get("verify-email")
  async verifyEmail(@Query("token") token: string, @Res() res: Response) {
    await this.authService.verifyEmail(token);

    return responseUtils.success(res, {
      data: { message: SUCCESS_MESSAGES.ACCOUNT_VERIFIED },
      transformWith: MessageResponseDto,
    });
  }

  /**
   * Triggers a new verification email for an unverified account.
   *
   * @param body - The {@link ResendVerificationEmailDto} containing the target email.
   * @param res - The Express response object.
   * @returns A {@link MessageResponseDto} confirming the email has been dispatched.
   */
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
