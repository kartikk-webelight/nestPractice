import { Controller, Post, Body, Res, Req, UseGuards, Patch, Get, } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import responseUtils from "src/utils/response.utils";
import { ApiSwaggerResponse } from "../../swagger/swagger.decorator";
import { AuthGuard } from "src/guards/auth-guard";
import {
    CreateUserResponseDto,
    CurrentUserResponseDto,
    LoginResponseDto,
    LogoutUserResponseDto,
    RefreshResponseDto,
    UpdateUserResponseDto,
} from "./dto/auth-response.dto";
import { AuthService } from "./auth.service";
import { CreateUserDto, LoginDto, UpdateDetailsDto } from "./dto/auth.dto";
import { SUCCESS_MESSAGES } from "src/constants/messages.constants";

@ApiTags("Auth")
@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService
    ) { }


    @ApiSwaggerResponse(CreateUserResponseDto, { status: StatusCodes.CREATED })
    @Post("create")
    async create(@Res() res: Response, @Body() body: CreateUserDto) {
        const data = await this.authService.create(body);
        return responseUtils.success<CreateUserResponseDto>(res, {
            data: { data, message: SUCCESS_MESSAGES.CREATED },
            status: StatusCodes.CREATED,
            transformWith: CreateUserResponseDto,
        });
    }

    @ApiSwaggerResponse(CurrentUserResponseDto)
    @UseGuards(AuthGuard)
    @Get("current")
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
        const cookieOptions = {
            httpOnly: true,
            sameSite: "strict" as const,
        };
        res.cookie("refreshToken", data.refreshToken, cookieOptions);
        res.cookie("accessToken", data.accessToken, cookieOptions);
        return responseUtils.success(res, {
            data: { data, message: SUCCESS_MESSAGES.USER_LOGGED_IN },
            status: StatusCodes.OK,
            transformWith: LoginResponseDto,
        });
    }

    @ApiSwaggerResponse(RefreshResponseDto, { status: StatusCodes.OK })
    @Post("refreshToken")
    async refreshToken(@Req() req: Request, @Res() res: Response) {
        const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

        const data = await this.authService.refreshToken(incomingRefreshToken);

        const cookieOptions = {
            httpOnly: true,
        };

        res.cookie("accessToken", data.newAccessToken, cookieOptions);
        res.cookie("refreshToken", data.newRefreshToken, cookieOptions);

        return responseUtils.success(res, {
            data: { data, message: SUCCESS_MESSAGES.TOKEN_REFRESHED },
            status: StatusCodes.OK,
            transformWith: RefreshResponseDto,
        });
    }

    @ApiSwaggerResponse(UpdateUserResponseDto, { status: StatusCodes.OK })
    @UseGuards(AuthGuard)
    @Patch("update")
    async updateDetails(@Req() req: Request, @Body() body: UpdateDetailsDto, @Res() res: Response) {
        const data = await this.authService.updateDetails(body, req.user.id);

        return responseUtils.success<UpdateUserResponseDto>(res, {
            data: { data, message:SUCCESS_MESSAGES.UPDATED  },
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
}
