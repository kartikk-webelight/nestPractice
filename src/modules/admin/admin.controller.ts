import { Controller, Get, Param, Query, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SUCCESS_MESSAGES } from "constants/messages";
import { Roles } from "decorators/role";
import { UserRole } from "enums";
import { AuthGuard } from "guards/auth-guard";
import { RolesGuard } from "guards/role-guard";
import { ApiSwaggerResponse } from "swagger/swagger.decorator";
import responseUtils from "utils/response.utils";
import { AdminService } from "./admin.service";
import { GetUsersResponseDto, GetUserByIdResponseDto } from "./dto/admin-response.dto";
import { GetUsersQueryDto } from "./dto/admin.dto";
import type { Response } from "express";

/**
 * Provides administrative endpoints for user oversight and system-level management.
 *
 * @remarks
 * This controller serves as the entry point for administrative operations, delegating
 * complex queries and data manipulation to the {@link AdminService}. Access is
 * strictly restricted to accounts verified by {@link AuthGuard} and {@link RolesGuard}.
 *
 * @group Administrative Controllers
 */
@ApiTags("Admin")
@Roles(UserRole.ADMIN)
@UseGuards(AuthGuard, RolesGuard)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Retrieves a paginated list of all users with optional filtering.
   * @param query - Pagination, search, and filter parameters via {@link GetUsersQueryDto}.
   * @returns A transformed success response containing the user list and metadata.
   */
  @ApiSwaggerResponse(GetUsersResponseDto)
  @Get("users")
  async getUsers(@Res() res: Response, @Query() query: GetUsersQueryDto) {
    const data = await this.adminService.getUsers(query);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_USERS_FETCHED },
      transformWith: GetUsersResponseDto,
    });
  }

  /**
   * Retrieves a single user by their unique identifier.
   * @param userId - The unique identifier of the user.
   * @returns A transformed success response containing the user details.
   */
  @ApiSwaggerResponse(GetUserByIdResponseDto)
  @Get("users/:id") // Logic: Swapped :id and users for standard REST convention
  async getUserById(@Res() res: Response, @Param("id") userId: string) {
    const data = await this.adminService.getUserById(userId);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.USER_FETCHED },
      transformWith: GetUserByIdResponseDto,
    });
  }
}
