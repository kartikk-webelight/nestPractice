import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { CreatePostDto, GetAllPostsDto, GetMyPostsDto, GetPublishedPostsDto, UpdatePostDto } from "./dto/post.dto";
import type { Request, Response } from "express";
import { AuthGuard } from "src/guards/auth-guard";
import { PostService } from "./post.service";
import responseUtils from "src/utils/response.utils";
import { StatusCodes } from "http-status-codes";
import { RolesGuard } from "src/guards/role-guard";
import { Roles } from "src/decorators/role";
import { UserRole } from "src/enums/index";
import { ApiTags } from "@nestjs/swagger";
import { ApiSwaggerResponse } from "src/swagger/swagger.decorator";
import {
  PaginatedPostResonseDto,
  PostResonseDto,
} from "./dto/posts-response.dto";
import { SUCCESS_MESSAGES } from "src/constants/messages.constants";

@ApiTags("Posts")
@Controller("posts")
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post("create")
  @UseGuards(AuthGuard, RolesGuard)
  @ApiSwaggerResponse(PostResonseDto, {status:StatusCodes.CREATED})
  @Roles(UserRole.ADMIN, UserRole.AUTHOR)
  async createPost(@Req() req: Request, @Body() body: CreatePostDto, @Res() res: Response) {
    const data = await this.postService.createPost(body, req.user.id);
    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.CREATED },
      status: StatusCodes.CREATED,
      transformWith: PostResonseDto,
    });
  }

  @Get()
  @ApiSwaggerResponse(PaginatedPostResonseDto)
  async getAllPosts(@Res() res: Response, @Query() query: GetAllPostsDto) {
    const { page, limit } = query;
    const { data, meta } = await this.postService.getAllPosts(page, limit);

    return responseUtils.success(res, {
      data: { data, meta, message: SUCCESS_MESSAGES.ALL_POSTS_FETCHED},
      status: StatusCodes.CREATED,
      transformWith: PaginatedPostResonseDto,
    });
  }

  @UseGuards(AuthGuard)
  @Get("my")
  @ApiSwaggerResponse(PaginatedPostResonseDto)
  async getMyPosts(@Req() req: Request, @Query() query: GetMyPostsDto, @Res() res: Response) {
    const { page, limit } = query;
    const { data, meta } = await this.postService.getMyposts(req.user.id, page, limit);

    return responseUtils.success(res, {
      data: { data, meta, message: SUCCESS_MESSAGES.ALL_POSTS_FETCHED },
      status: StatusCodes.OK,
      transformWith: PaginatedPostResonseDto,
    });
  }

  @Get("published")
  @ApiSwaggerResponse(PaginatedPostResonseDto)
  async getPublishedPosts(@Query() query: GetPublishedPostsDto, @Res() res: Response) {
    const { page, limit } = query;
    const { data, meta } = await this.postService.getPublishedPosts(page, limit);

    return responseUtils.success(res, {
      data: { data, meta, message:SUCCESS_MESSAGES.ALL_POSTS_FETCHED },
      status: StatusCodes.OK,
      transformWith: PaginatedPostResonseDto,
    });
  }

  @Roles(UserRole.ADMIN, UserRole.AUTHOR, UserRole.EDITOR)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiSwaggerResponse(PostResonseDto)
  @Patch("update")
  async updatePost(@Req() req: Request, @Body() body: UpdatePostDto, @Res() res: Response) {
    const data = await this.postService.updatePost(body, req.user.id);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_POSTS_FETCHED },
      status: StatusCodes.OK,
      transformWith: PostResonseDto,
    });
  }

  @Roles(UserRole.ADMIN, UserRole.AUTHOR, UserRole.EDITOR)
  @UseGuards(AuthGuard, RolesGuard)
  @Delete(":id")
  async deletePost(@Req() req: Request, @Res() res: Response, @Param("id") postId: string) {
    const data = await this.postService.deletePost(postId, req.user);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.UPDATED },
      status: StatusCodes.OK,
    });
  }

  @Roles(UserRole.ADMIN, UserRole.AUTHOR, UserRole.EDITOR)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiSwaggerResponse(PostResonseDto)
  @Patch("publish/:id")
  async publishPost(@Req() req: Request, @Param("id") postId: string, @Res() res: Response) {
    const data = await this.postService.publishPost(postId, req.user);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.UPDATED},
      status: StatusCodes.OK,
      transformWith: PostResonseDto,
    });
  }

  @Roles(UserRole.ADMIN, UserRole.AUTHOR, UserRole.EDITOR)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiSwaggerResponse(PostResonseDto)
  @Patch("unpublish/:id")
  async unPublishPost(@Req() req: Request, @Param("id") postId: string, @Res() res: Response) {
    const data = await this.postService.unPublishPost(postId, req.user);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.UPDATED },
      status: StatusCodes.OK,
      transformWith: PostResonseDto,
    });
  }

  @Get(":id")
  @ApiSwaggerResponse(PostResonseDto)
  async getPostById(@Param("id") postId: string, @Res() res: Response) {
    const data = await this.postService.getPostById(postId);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.POST_FETCHED },
      status: StatusCodes.OK,
      transformWith: PostResonseDto,
    });
  }
}
