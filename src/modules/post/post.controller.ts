import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ApiTags } from "@nestjs/swagger";
import { SUCCESS_MESSAGES } from "constants/messages.constants";
import { Roles } from "decorators/role";
import { UserRole } from "enums/index";
import type { Request, Response } from "express";
import { AuthGuard } from "guards/auth-guard";
import { RolesGuard } from "guards/role-guard";
import { StatusCodes } from "http-status-codes";
import { multerMemoryOptions } from "shared/multer/multer.service";
import { ApiSwaggerResponse } from "swagger/swagger.decorator";
import responseUtils from "utils/response.utils";

import {
  CreatePostDto,
  GetAllPostsDto,
  GetMyPostsDto,
  GetPublishedPostsDto,
  SearchPostsQueryDto,
  UpdatePostDto,
} from "./dto/post.dto";
import { PaginatedPostResonseDto, PostResonseDto } from "./dto/posts-response.dto";
import { PostService } from "./post.service";

@ApiTags("Posts")
@Controller("posts")
@UseGuards(AuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post("create")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHOR)
  @UseInterceptors(FilesInterceptor("files", 5, multerMemoryOptions))
  @ApiSwaggerResponse(PostResonseDto, { status: StatusCodes.CREATED })
  async createPost(
    @Req() req: Request,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: CreatePostDto,
    @Res() res: Response,
  ) {
    const data = await this.postService.createPost(body, req.user.id, files);
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
    const data = await this.postService.getAllPosts(page, limit);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_POSTS_FETCHED },
      status: StatusCodes.CREATED,
      transformWith: PaginatedPostResonseDto,
    });
  }

  @Get("my")
  @ApiSwaggerResponse(PaginatedPostResonseDto)
  async getMyPosts(@Req() req: Request, @Query() query: GetMyPostsDto, @Res() res: Response) {
    const { page, limit } = query;
    const data = await this.postService.getMyposts(req.user.id, page, limit);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_POSTS_FETCHED },
      status: StatusCodes.OK,
      transformWith: PaginatedPostResonseDto,
    });
  }

  @Get("published")
  @ApiSwaggerResponse(PaginatedPostResonseDto)
  async getPublishedPosts(@Query() query: GetPublishedPostsDto, @Res() res: Response) {
    const { page, limit } = query;
    const data = await this.postService.getPublishedPosts(page, limit);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_POSTS_FETCHED },
      status: StatusCodes.OK,
      transformWith: PaginatedPostResonseDto,
    });
  }

  @Roles(UserRole.ADMIN, UserRole.AUTHOR, UserRole.EDITOR)
  @UseGuards(RolesGuard)
  @ApiSwaggerResponse(PostResonseDto)
  @Patch("update/:id")
  async updatePost(
    @Req() req: Request,
    @Param("id") postId: string,
    @Body() body: UpdatePostDto,
    @Res() res: Response,
  ) {
    const data = await this.postService.updatePost(body, req.user.id, postId);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_POSTS_FETCHED },
      status: StatusCodes.OK,
      transformWith: PostResonseDto,
    });
  }

  @Roles(UserRole.ADMIN, UserRole.AUTHOR, UserRole.EDITOR)
  @UseGuards(RolesGuard)
  @Delete(":id")
  async deletePost(@Req() req: Request, @Res() res: Response, @Param("id") postId: string) {
    const data = await this.postService.deletePost(postId, req.user);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.UPDATED },
      status: StatusCodes.OK,
    });
  }

  @Roles(UserRole.ADMIN, UserRole.AUTHOR, UserRole.EDITOR)
  @UseGuards(RolesGuard)
  @ApiSwaggerResponse(PostResonseDto)
  @Patch("publish/:id")
  async publishPost(@Req() req: Request, @Param("id") postId: string, @Res() res: Response) {
    const data = await this.postService.publishPost(postId, req.user);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.UPDATED },
      status: StatusCodes.OK,
      transformWith: PostResonseDto,
    });
  }

  @Roles(UserRole.ADMIN, UserRole.AUTHOR, UserRole.EDITOR)
  @UseGuards(RolesGuard)
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

  @Get(":slug")
  @ApiSwaggerResponse(PostResonseDto)
  async getPostBySlug(@Param("slug") slug: string, @Res() res: Response) {
    const data = await this.postService.getPostBySlug(slug);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.POST_FETCHED },
      status: StatusCodes.OK,
      transformWith: PostResonseDto,
    });
  }

  @Get("search")
  @UseGuards(AuthGuard)
  @ApiSwaggerResponse(PaginatedPostResonseDto)
  async searchPosts(@Query() query: SearchPostsQueryDto, @Res() res: Response) {
    const data = await this.postService.searchPosts(query);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_POSTS_FETCHED },
    });
  }
}
