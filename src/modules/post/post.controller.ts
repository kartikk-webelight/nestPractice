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
import { FILE_CONSTANTS } from "constants/file";
import { SUCCESS_MESSAGES } from "constants/messages";
import { Roles } from "decorators/role";
import { MessageResponseDto } from "dto/common-response.dto";
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

/**
 * Handles HTTP requests for content creation, publication workflows, and public post retrieval.
 *
 * @remarks
 * This controller serves as the entry point for post-related operations, coordinating
 * with the {@link PostService} to manage media uploads, role-based visibility,
 * and state transitions (Draft/Published).
 *
 * @group Content Management Controllers
 */
@ApiTags("Posts")
@Controller("posts")
@UseGuards(AuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  /**
   * Processes the creation of a new post along with multiple file attachments.
   *
   * @param req - The {@link Request} object containing the identity established by {@link AuthGuard}.
   * @param files - An array of uploaded media files processed by {@link FilesInterceptor}.
   * @param body - The {@link CreatePostDto} containing post content and metadata.
   * @param res - The Express response object.
   * @returns A success response containing the created {@link CreatePostResponseDto}.
   */
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

  /**
   * Retrieves a paginated collection of posts authored by the currently authenticated user.
   *
   * @param req - The request object containing the user's established identity.
   * @param query - The {@link GetMyPostsQueryDto} for pagination control.
   * @param res - The Express response object.
   * @returns A success response containing {@link GetMyPostsResponseDto}.
   */
  @Get("my")
  @ApiSwaggerResponse(GetMyPostsResponseDto)
  async getMyPosts(@Req() req: Request, @Query() query: GetMyPostsQueryDto, @Res() res: Response) {
    const { page, limit } = query;
    const data = await this.postService.getMyPosts(req.user.id, page, limit);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_POSTS_FETCHED },
      transformWith: GetMyPostsResponseDto,
    });
  }

  /**
   * Updates an existing post's content and metadata based on authorization rules.
   *
   * @param req - The request object containing the authorized user's details.
   * @param postId - The unique identifier of the post to update.
   * @param body - The {@link UpdatePostDto} with modified fields.
   * @param res - The Express response object.
   * @returns A success response containing {@link UpdatePostResponseDto}.
   */
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
      transformWith: UpdatePostResponseDto,
    });
  }

  /**
   * Executes a soft delete for a specific post after verifying authorship or administrative rights.
   *
   * @param req - The request object containing the user's role and identity.
   * @param res - The Express response object.
   * @param postId - The unique identifier of the post to remove.
   * @returns A confirmation message indicating successful deletion.
   */
  @Roles(UserRole.ADMIN, UserRole.AUTHOR, UserRole.EDITOR)
  @ApiSwaggerResponse(MessageResponseDto)
  @UseGuards(RolesGuard)
  @Delete(":id")
  async deletePost(@Req() req: Request, @Res() res: Response, @Param("id") postId: string) {
    await this.postService.deletePost(postId, req.user);

    return responseUtils.success(res, {
      data: { message: SUCCESS_MESSAGES.DELETED },
      transformWith: MessageResponseDto,
    });
  }

  /**
   * Transitions a post's status to published, making it visible to the public.
   *
   * @param req - The request object containing the author or editor's identity.
   * @param postId - The unique ID of the post to publish.
   * @param res - The Express response object.
   * @returns A success response containing the {@link PublishPostResponseDto}.
   */
  @Roles(UserRole.ADMIN, UserRole.AUTHOR, UserRole.EDITOR)
  @UseGuards(RolesGuard)
  @ApiSwaggerResponse(PublishPostResponseDto)
  @Patch(":id/publish")
  async publishPost(@Req() req: Request, @Param("id") postId: string, @Res() res: Response) {
    const data = await this.postService.publishPost(postId, req.user);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.UPDATED },
      transformWith: PublishPostResponseDto,
    });
  }

  /**
   * Reverts a published post back to a draft state.
   *
   * @param req - The request object containing the user's identity.
   * @param postId - The unique ID of the post to unpublish.
   * @param res - The Express response object.
   * @returns A success response containing the {@link UnpublishPostResponseDto}.
   */
  @Roles(UserRole.ADMIN, UserRole.AUTHOR, UserRole.EDITOR)
  @UseGuards(RolesGuard)
  @ApiSwaggerResponse(UnpublishPostResponseDto)
  @Patch(":id/unpublish")
  async unPublishPost(@Req() req: Request, @Param("id") postId: string, @Res() res: Response) {
    const data = await this.postService.unPublishPost(postId, req.user);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.UPDATED },
      transformWith: UnpublishPostResponseDto,
    });
  }

  /**
   * Retrieves a specific post's details using its URL-friendly slug.
   *
   * @param slug - The unique slug associated with the post.
   * @param res - The Express response object.
   * @returns A success response containing {@link GetPostBySlugResponseDto}.
   */
  @Get("slug/:slug")
  @ApiSwaggerResponse(GetPostBySlugResponseDto)
  async getPostBySlug(@Param("slug") slug: string, @Res() res: Response) {
    const data = await this.postService.getPostBySlug(slug);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.POST_FETCHED },
      transformWith: GetPostBySlugResponseDto,
    });
  }

  /**
   * Retrieves a specific post's details by its unique database identifier.
   *
   * @param postId - The ID of the post to fetch.
   * @param res - The Express response object.
   * @returns A success response containing {@link GetPostByIdResponseDto}.
   */
  @Get(":id")
  @ApiSwaggerResponse(GetPostByIdResponseDto)
  async getPostById(@Param("id") postId: string, @Res() res: Response) {
    const data = await this.postService.getPostById(postId);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.POST_FETCHED },
      transformWith: GetPostByIdResponseDto,
    });
  }

  /**
   * Performs a filtered search of all posts with visibility limited by the requester's role.
   *
   * @param req - The request object containing the user's identity from {@link AuthGuard}.
   * @param query - The {@link GetPostsQueryDto} containing filter and sort parameters.
   * @param res - The Express response object.
   * @returns A paginated success response containing {@link PaginatedPostResponseDto}.
   */
  @Get()
  @ApiSwaggerResponse(PaginatedPostResponseDto)
  async getPosts(@Req() req: Request, @Query() query: GetPostsQueryDto, @Res() res: Response) {
    const data = await this.postService.getPosts(query, req.user);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_POSTS_FETCHED },
      transformWith: PaginatedPostResponseDto,
    });
  }
}
