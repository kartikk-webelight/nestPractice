import { Controller, Get, Param, Query, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { StatusCodes } from "http-status-codes";
import { SUCCESS_MESSAGES } from "constants/messages.constants";
import { Roles } from "decorators/role";
import { UserRole } from "enums";
import { AuthGuard } from "guards/auth-guard";
import { RolesGuard } from "guards/role-guard";
import { ApiSwaggerResponse } from "swagger/swagger.decorator";
import responseUtils from "utils/response.utils";
import { AdminService } from "./admin.service";
import { GetUsersResponseDto, getUserByIdResponseDto } from "./dto/admin-response.dto";
import { GetUsersQueryDto } from "./dto/admin.dto";
import type { Response } from "express";

@ApiTags("Admin")
@Roles(UserRole.ADMIN)
@UseGuards(AuthGuard, RolesGuard)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiSwaggerResponse(GetUsersResponseDto)
  @Get("users")
  async getUsers(@Res() res: Response, @Query() query: GetUsersQueryDto) {
    const data = await this.adminService.getUsers(query);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_USERS_FETCHED },
      transformWith: GetUsersResponseDto,
    });
  }

  @ApiSwaggerResponse(getUserByIdResponseDto, { status: StatusCodes.OK })
  @Get(":id/users")
  async getUserById(@Res() res: Response, @Param("id") userId: string) {
    const data = await this.adminService.getUserById(userId);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.USER_FETCHED },
      transformWith: getUserByIdResponseDto,
    });
  }
}
