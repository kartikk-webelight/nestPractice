import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import responseUtils from 'src/utils/response.utils';
import { StatusCodes } from 'http-status-codes';
import { ApiSwaggerResponse } from 'src/swagger/swagger.decorator';
import type { Response } from 'express';
import { AuthGuard } from 'src/guards/auth-guard';
import { RolesGuard } from 'src/guards/role-guard';
import { Roles } from 'src/decorators/role';
import { UserRole } from 'src/enums';
import { GetAllUsersResponseDto, getUserByIdResponseDto } from './dto/admin-response.dto';
import { GetAllUsersDto } from './dto/admin.dto';
import { SUCCESS_MESSAGES } from 'src/constants/messages.constants';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @ApiSwaggerResponse(GetAllUsersResponseDto)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('users')
  async getAllUsers(@Res() res: Response,
    @Query() query: GetAllUsersDto) {
    const { page, limit } = query;
    const { data, meta } = await this.adminService.getAllUsers(page, limit);

    return responseUtils.success(res, {
      data: { data, meta, message: SUCCESS_MESSAGES.ALL_USERS_FETCHED },
      status: StatusCodes.OK,
      transformWith: GetAllUsersResponseDto,
    });
  }


  @ApiSwaggerResponse(getUserByIdResponseDto, { status: StatusCodes.OK })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get("user/:id")
  async getUserById(@Res() res: Response, @Param("id") userId: string) {
    const data = await this.adminService.getUserById(userId);
    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.USER_FETCHED },
      status: StatusCodes.OK,
      transformWith: getUserByIdResponseDto,
    });
  }

}
