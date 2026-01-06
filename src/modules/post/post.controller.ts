import { Body, Controller, Post, Req, Res, UseGuards } from "@nestjs/common";
import { createPostDto } from "./post.dto";
import type { Request, Response } from "express";
import { AuthGuard } from "src/guards/auth-guard";
import { PostService } from "./post.service";
import responseUtils from "src/utils/response.utils";
import { StatusCodes } from "http-status-codes";
import { RolesGuard } from "src/guards/role-guard";
import { Roles } from "src/guards/role-decorator";
import { UserRole } from "../users/users.entity";

@Controller("posts")
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post("create")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHOR)
  async createPost(@Req() req: Request, @Body() body: createPostDto, @Res() res: Response) {
    const result = await this.postService.create(body, req.user.id);
    return responseUtils.success(res, {
      data: { result, message: "post created" },
      status: StatusCodes.OK,
    });
  }
}
