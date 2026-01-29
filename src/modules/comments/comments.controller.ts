import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { StatusCodes } from "http-status-codes";
import { SUCCESS_MESSAGES } from "constants/messages";
import { PaginationQueryDto } from "dto/common-request.dto";
import { MessageResponseDto } from "dto/common-response.dto";
import { AuthGuard } from "guards/auth-guard";
import { ApiSwaggerResponse } from "swagger/swagger.decorator";
import responseUtils from "utils/response.utils";
import { CommentsService } from "./comments.service";
import {
  CreateCommentResponseDto,
  GetAllCommentsResponseDto,
  GetCommentByIdResponseDto,
  GetCommentByPostIdResponseDto,
  ReplyCommentResponseDto,
  UpdateCommentResponseDto,
} from "./dto/comment-response.dto";
import { CreateCommentDto, ReplyCommentDto, UpdateCommentDto } from "./dto/comment.dto";
import type { Request, Response } from "express";

/**
 * Handles incoming HTTP requests for managing user comments and discussion threads.
 *
 * @remarks
 * This controller serves as the entry point for social interactions, coordinating
 * with the {@link CommentsService} to handle top-level comments, nested replies,
 * and ownership-based modifications.
 *
 * @group Social & Interaction Controllers
 */
@ApiTags("Comments")
@Controller("comments")
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * Processes the creation of a new top-level comment on a post.
   *
   * @param body - The {@link CreateCommentDto} containing post ID and content.
   * @param req - The {@link Request} object containing the identity established by {@link AuthGuard}.
   * @param res - The Express response object.
   * @returns A success response containing the created {@link CreateCommentResponseDto}.
   */
  @UseGuards(AuthGuard)
  @ApiSwaggerResponse(CreateCommentResponseDto, { status: StatusCodes.CREATED })
  @Post()
  async createComment(@Body() body: CreateCommentDto, @Req() req: Request, @Res() res: Response) {
    const data = await this.commentsService.createComment(body, req.user.id);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.CREATED },
      status: StatusCodes.CREATED,
      transformWith: CreateCommentResponseDto,
    });
  }

  /**
   * Processes a new reply to an existing comment to create a threaded discussion.
   *
   * @param body - The {@link ReplyCommentDto} containing parent comment and post context.
   * @param req - The request object populated by {@link AuthGuard}.
   * @param res - The Express response object.
   * @returns A success response containing the {@link ReplyCommentResponseDto}.
   */
  @UseGuards(AuthGuard)
  @ApiSwaggerResponse(ReplyCommentResponseDto, { status: StatusCodes.CREATED })
  @Post("reply")
  async replyComment(@Body() body: ReplyCommentDto, @Req() req: Request, @Res() res: Response) {
    const data = await this.commentsService.replyComment(body, req.user.id);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.CREATED },
      status: StatusCodes.CREATED,
      transformWith: ReplyCommentResponseDto,
    });
  }

  /**
   * Retrieves a paginated list of all comments across the entire system.
   *
   * @param query - The {@link PaginationQueryDto} for controlling data offsets.
   * @param res - The Express response object.
   * @returns A success response containing {@link GetAllCommentsResponseDto}.
   */
  @Get()
  @ApiSwaggerResponse(GetAllCommentsResponseDto)
  async getComments(@Query() query: PaginationQueryDto, @Res() res: Response) {
    const { page, limit } = query;
    const data = await this.commentsService.getComments(page, limit);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_COMMENTS_FETCHED },
      transformWith: GetAllCommentsResponseDto,
    });
  }

  /**
   * Retrieves a paginated list of comments specifically linked to a single post.
   *
   * @param postId - The unique identifier of the target post.
   * @param query - The {@link PaginationQueryDto} for page and limit control.
   * @param res - The Express response object.
   * @returns A success response containing {@link GetCommentByPostIdResponseDto}.
   */
  @Get("post/:id")
  @ApiSwaggerResponse(GetCommentByPostIdResponseDto)
  async getCommentByPostId(@Param("id") postId: string, @Query() query: PaginationQueryDto, @Res() res: Response) {
    const { page, limit } = query;
    const data = await this.commentsService.getCommentByPostId(page, limit, postId);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_COMMENTS_FETCHED },
      transformWith: GetCommentByPostIdResponseDto,
    });
  }

  /**
   * Retrieves the comprehensive details of a specific comment by its identifier.
   *
   * @param commentId - The ID of the comment to fetch.
   * @param res - The Express response object.
   * @returns A success response containing the {@link GetCommentByIdResponseDto}.
   */
  @Get(":id")
  @ApiSwaggerResponse(GetCommentByIdResponseDto)
  async getCommentById(@Param("id") commentId: string, @Res() res: Response) {
    const data = await this.commentsService.getCommentById(commentId);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.COMMENT_FETCHED },
      transformWith: GetCommentByIdResponseDto,
    });
  }

  /**
   * Updates the content of a specific comment if the user is the authorized author.
   *
   * @param req - The request object containing user identity from {@link AuthGuard}.
   * @param commentId - The ID of the comment to update.
   * @param body - The {@link UpdateCommentDto} with the new content.
   * @param res - The Express response object.
   * @returns A success response containing the {@link UpdateCommentResponseDto}.
   */
  @UseGuards(AuthGuard)
  @Patch(":id")
  @ApiSwaggerResponse(UpdateCommentResponseDto)
  async updateComment(
    @Req() req: Request,
    @Param("id") commentId: string,
    @Body() body: UpdateCommentDto,
    @Res() res: Response,
  ) {
    const data = await this.commentsService.updateComment(commentId, body, req.user.id);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.UPDATED },
      transformWith: UpdateCommentResponseDto,
    });
  }

  /**
   * Executes a soft delete for a comment based on authorship or administrative roles.
   *
   * @param req - The request object containing user identity and role data.
   * @param commentId - The unique ID of the comment to remove.
   * @param res - The Express response object.
   * @returns A success message confirming the removal.
   */
  @UseGuards(AuthGuard)
  @ApiSwaggerResponse(MessageResponseDto)
  @Delete(":id")
  async deleteComment(@Req() req: Request, @Param("id") commentId: string, @Res() res: Response) {
    await this.commentsService.deleteComment(commentId, req.user);

    return responseUtils.success(res, {
      data: { message: SUCCESS_MESSAGES.DELETED },
      transformWith: MessageResponseDto,
    });
  }
}
