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
import { StatusCodes } from "http-status-codes";
import { FILE_CONSTANTS } from "constants/file.constants";
import { SUCCESS_MESSAGES } from "constants/messages.constants";
import { Roles } from "decorators/role";
import { UserRole } from "enums/index";
import { AuthGuard } from "guards/auth-guard";
import { RolesGuard } from "guards/role-guard";
import { multerMemoryOptions } from "shared/multer/multer.service";
import { ApiSwaggerResponse } from "swagger/swagger.decorator";
import responseUtils from "utils/response.utils";
import { CreatePostDto, GetMyPostsQueryDto, GetPostsQueryDto, UpdatePostDto } from "./dto/post.dto";
import {
  CreatePostResponseDto,
  GetMyPostsResponseDto,
  GetPostByIdResponseDto,
  GetPostBySlugResponseDto,
  PaginatedPostResponseDto,
  PublishPostResponseDto,
  UnpublishPostResponseDto,
  UpdatePostResponseDto,
} from "./dto/posts-response.dto";
import { PostService } from "./post.service";
import type { Request, Response } from "express";

@ApiTags("Posts")
@Controller("posts")
@UseGuards(AuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHOR)
  @UseInterceptors(FilesInterceptor("files", FILE_CONSTANTS.MAX_FILE_COUNT, multerMemoryOptions))
  @ApiSwaggerResponse(CreatePostResponseDto, { status: StatusCodes.CREATED })
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
      transformWith: CreatePostResponseDto,
    });
  }

  @Get("my")
  @ApiSwaggerResponse(GetMyPostsResponseDto)
  async getMyPosts(@Req() req: Request, @Query() query: GetMyPostsQueryDto, @Res() res: Response) {
    const { page, limit } = query;
    const data = await this.postService.getMyPosts(req.user.id, page, limit);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_POSTS_FETCHED },
      status: StatusCodes.OK,
      transformWith: GetMyPostsResponseDto,
    });
  }

  @Roles(UserRole.ADMIN, UserRole.AUTHOR, UserRole.EDITOR)
  @UseGuards(RolesGuard)
  @ApiSwaggerResponse(UpdatePostResponseDto)
  @Patch(":id")
  async updatePost(
    @Req() req: Request,
    @Param("id") postId: string,
    @Body() body: UpdatePostDto,
    @Res() res: Response,
  ) {
    const data = await this.postService.updatePost(body, req.user.id, postId);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.UPDATED },
      status: StatusCodes.OK,
      transformWith: UpdatePostResponseDto,
    });
  }

  @Roles(UserRole.ADMIN, UserRole.AUTHOR, UserRole.EDITOR)
  @UseGuards(RolesGuard)
  @Delete(":id")
  async deletePost(@Req() req: Request, @Res() res: Response, @Param("id") postId: string) {
    const data = await this.postService.deletePost(postId, req.user);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.DELETED },
      status: StatusCodes.OK,
    });
  }

  @Roles(UserRole.ADMIN, UserRole.AUTHOR, UserRole.EDITOR)
  @UseGuards(RolesGuard)
  @ApiSwaggerResponse(PublishPostResponseDto)
  @Patch(":id/publish")
  async publishPost(@Req() req: Request, @Param("id") postId: string, @Res() res: Response) {
    const data = await this.postService.publishPost(postId, req.user);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.UPDATED },
      status: StatusCodes.OK,
      transformWith: PublishPostResponseDto,
    });
  }

  @Roles(UserRole.ADMIN, UserRole.AUTHOR, UserRole.EDITOR)
  @UseGuards(RolesGuard)
  @ApiSwaggerResponse(UnpublishPostResponseDto)
  @Patch(":id/unpublish")
  async unPublishPost(@Req() req: Request, @Param("id") postId: string, @Res() res: Response) {
    const data = await this.postService.unPublishPost(postId, req.user);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.UPDATED },
      status: StatusCodes.OK,
      transformWith: UnpublishPostResponseDto,
    });
  }

  @Get(":slug/slug")
  @ApiSwaggerResponse(GetPostBySlugResponseDto)
  async getPostBySlug(@Param("slug") slug: string, @Res() res: Response) {
    const data = await this.postService.getPostBySlug(slug);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.POST_FETCHED },
      status: StatusCodes.OK,
      transformWith: GetPostBySlugResponseDto,
    });
  }

  @Get(":id")
  @ApiSwaggerResponse(GetPostByIdResponseDto)
  async getPostById(@Param("id") postId: string, @Res() res: Response) {
    const data = await this.postService.getPostById(postId);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.POST_FETCHED },
      status: StatusCodes.OK,
      transformWith: GetPostByIdResponseDto,
    });
  }

  @Get()
  @ApiSwaggerResponse(PaginatedPostResponseDto)
  async getPosts(@Req() req: Request, @Query() query: GetPostsQueryDto, @Res() res: Response) {
    const data = await this.postService.getPosts(query, req.user);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_POSTS_FETCHED },
      status: StatusCodes.OK,
      transformWith: PaginatedPostResponseDto,
    });
  }
}
