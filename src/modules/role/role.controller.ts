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

@ApiTags("Roles")
@Controller("roles")
@UseGuards(AuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @ApiSwaggerResponse(MessageResponseDto, { status: StatusCodes.CREATED })
  async createRoleRequest(@Req() req: Request, @Body() body: CreateRoleRequestDto, @Res() res: Response) {
    await this.roleService.createRoleRequest(req.user, body.requestedRole);

    return responseUtils.success(res, {
      data: { message: SUCCESS_MESSAGES.ROLE_REQUESTED },
      status: StatusCodes.CREATED,
      transformWith: MessageResponseDto,
    });
  }

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

  @Get("my")
  @ApiSwaggerResponse(GetRequestedRoleStatusResponseDto)
  async getRequestedRoleStatus(@Req() req: Request, @Res() res: Response) {
    const data = await this.roleService.getRequestedRoleStatus(req.user.id);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.REQUEST_STATUS_FETCHED },
      transformWith: GetRequestedRoleStatusResponseDto,
    });
  }

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
