import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { StatusCodes } from "http-status-codes";
import { SUCCESS_MESSAGES } from "constants/messages.constants";
import { PaginationQueryDto } from "dto/common-request.dto";
import { AuthGuard } from "guards/auth-guard";
import { ApiSwaggerResponse } from "swagger/swagger.decorator";
import responseUtils from "utils/response.utils";
import { CommentsService } from "./comments.service";
import {
  CreateCommentResponseDto,
  GetAllCommentsResponseDto,
  GetCommentByIdResponseDto,
  getCommentByPostIdResponseDto,
  ReplyCommentResponseDto,
  UpdateCommentResponseDto,
} from "./dto/comment-response.dto";
import { CreateCommentDto, ReplyCommentDto, UpdateCommentDto } from "./dto/comment.dto";
import type { Request, Response } from "express";

@ApiTags("Comments")
@Controller("comments")
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

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

  @Get()
  @ApiSwaggerResponse(GetAllCommentsResponseDto)
  async getComments(@Query() query: PaginationQueryDto, @Res() res: Response) {
    const { page, limit } = query;
    const data = await this.commentsService.getComments(page, limit);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_COMMENTS_FETCHED },
      status: StatusCodes.OK,
      transformWith: GetAllCommentsResponseDto,
    });
  }
  @Get("post/:id")
  @ApiSwaggerResponse(getCommentByPostIdResponseDto)
  async getCommentByPostId(@Param("id") postId: string, @Query() query: PaginationQueryDto, @Res() res: Response) {
    const { page, limit } = query;
    const data = await this.commentsService.getCommentByPostId(page, limit, postId);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_COMMENTS_FETCHED },
      status: StatusCodes.OK,
      transformWith: getCommentByPostIdResponseDto,
    });
  }

  @Get(":id")
  @ApiSwaggerResponse(GetCommentByIdResponseDto)
  async getCommentById(@Param("id") commentId: string, @Res() res: Response) {
    const data = await this.commentsService.getCommentById(commentId);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.COMMENT_FETCHED },
      status: StatusCodes.OK,
      transformWith: GetCommentByIdResponseDto,
    });
  }

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
      status: StatusCodes.OK,
      transformWith: UpdateCommentResponseDto,
    });
  }

  @UseGuards(AuthGuard)
  @Delete(":id")
  async deleteComment(@Req() req: Request, @Param("id") commentId: string, @Res() res: Response) {
    const data = await this.commentsService.deleteComment(commentId, req.user);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.DELETED },
      status: StatusCodes.OK,
    });
  }
}
