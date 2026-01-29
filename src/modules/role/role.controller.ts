import { Body, Controller, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { StatusCodes } from "http-status-codes";
import { SUCCESS_MESSAGES } from "constants/messages";
import { Roles } from "decorators/role";
import { MessageResponseDto } from "dto/common-response.dto";
import { UserRole } from "enums";
import { AuthGuard } from "guards/auth-guard";
import { RolesGuard } from "guards/role-guard";
import { ApiSwaggerResponse } from "swagger/swagger.decorator";
import responseUtils from "utils/response.utils";
import { GetRequestedRoleStatusResponseDto, GetRoleRequestsResponseDto } from "./dto/role-response.dto";
import { CreateRoleRequestDto, GetRoleRequestsQueryDto, UpdateRoleRequestDto } from "./dto/role.dto";
import { RoleService } from "./role.service";
import type { Request, Response } from "express";

/**
 * Handles HTTP requests for managing user role elevation workflows and administrative reviews.
 *
 * @remarks
 * This controller provides endpoints for users to request role changes and for
 * administrators to manage those requests. Access is controlled via {@link AuthGuard}
 * and {@link RolesGuard} to ensure secure permission handling.
 *
 * @group Identity & Access Controllers
 */
@ApiTags("Roles")
@Controller("roles")
@UseGuards(AuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /**
   * Processes a new request from an authenticated user to change their system role.
   *
   * @param req - The {@link Request} object containing the identity established by {@link AuthGuard}.
   * @param body - The {@link CreateRoleRequestDto} specifying the target {@link UserRole}.
   * @param res - The Express response object.
   * @returns A success message confirming the request has been submitted.
   */
  @Post()
  @ApiSwaggerResponse(MessageResponseDto)
  async createRoleRequest(@Req() req: Request, @Body() body: CreateRoleRequestDto, @Res() res: Response) {
    await this.roleService.createRoleRequest(req.user, body.requestedRole);

    return responseUtils.success(res, {
      data: { message: SUCCESS_MESSAGES.ROLE_REQUESTED },
      status: StatusCodes.CREATED,
      transformWith: MessageResponseDto,
    });
  }

  /**
   * Updates the status of a role request (Approve/Reject) after administrative review.
   *
   * @param req - The request object containing the admin's established identity.
   * @param requestId - The unique ID of the request being reviewed.
   * @param body - The {@link UpdateRoleRequestDto} containing the review action.
   * @param res - The Express response object.
   * @returns A success message confirming the role request update.
   */
  @Patch(":id")
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiSwaggerResponse(MessageResponseDto)
  async updateRoleRequest(
    @Req() req: Request,
    @Param("id") requestId: string,
    @Body() body: UpdateRoleRequestDto,
    @Res() res: Response,
  ) {
    await this.roleService.updateRoleRequest(req.user.id, requestId, body.action);

    return responseUtils.success(res, {
      data: { message: SUCCESS_MESSAGES.ROLE_UPDATED },
      transformWith: MessageResponseDto,
    });
  }

  /**
   * Retrieves the current status of the authenticated user's most recent role request.
   *
   * @param req - The request object containing the user's established identity.
   * @param res - The Express response object.
   * @returns A success response containing the {@link GetRequestedRoleStatusResponseDto}.
   */
  @Get("my")
  @ApiSwaggerResponse(GetRequestedRoleStatusResponseDto)
  async getRequestedRoleStatus(@Req() req: Request, @Res() res: Response) {
    const data = await this.roleService.getRequestedRoleStatus(req.user.id);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.REQUEST_STATUS_FETCHED },
      transformWith: GetRequestedRoleStatusResponseDto,
    });
  }

  /**
   * Retrieves a filtered, paginated list of all role requests for administrative oversight.
   *
   * @param query - The {@link GetRoleRequestsQueryDto} for filtering and pagination.
   * @param res - The Express response object.
   * @returns A success response containing the {@link GetRoleRequestsResponseDto}.
   */
  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiSwaggerResponse(GetRoleRequestsResponseDto)
  async getRoleRequests(@Query() query: GetRoleRequestsQueryDto, @Res() res: Response) {
    const data = await this.roleService.getRoleRequests(query);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.REQUESTS_FETCHED },
      transformWith: GetRoleRequestsResponseDto,
    });
  }
}
