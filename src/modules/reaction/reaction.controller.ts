import { Controller, Get, Param, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { StatusCodes } from "http-status-codes";
import { CommentResponseDto } from "modules/comments/dto/comment-response.dto";
import { PaginatedPostResponseDto, PostResponseDto } from "modules/post/dto/posts-response.dto";
import { SUCCESS_MESSAGES } from "constants/messages.constants";
import { PaginationQueryDto } from "dto/common-request.dto";
import { AuthGuard } from "guards/auth-guard";
import { ApiSwaggerResponse } from "swagger/swagger.decorator";
import responseUtils from "utils/response.utils";
import { ReactionService } from "./reaction.service";
import type { Request, Response } from "express";

@ApiTags("Votes")
@UseGuards(AuthGuard)
@Controller("reaction")
export class ReactionController {
  constructor(private readonly reactionService: ReactionService) {}

  @Get("liked-post")
  @ApiSwaggerResponse(PaginatedPostResponseDto)
  async getLikedPost(@Req() req: Request, @Query() query: PaginationQueryDto, @Res() res: Response) {
    const { page, limit } = query;
    const data = await this.reactionService.getLikedPosts(page, limit, req.user.id);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_POSTS_FETCHED },
      status: StatusCodes.OK,
      transformWith: PaginatedPostResponseDto,
    });
  }

  @Get("disliked-post")
  @ApiSwaggerResponse(PaginatedPostResponseDto)
  async getDislikedPost(@Req() req: Request, @Query() query: PaginationQueryDto, @Res() res: Response) {
    const { page, limit } = query;
    const data = await this.reactionService.getDislikedPosts(page, limit, req.user.id);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_POSTS_FETCHED },
      status: StatusCodes.OK,
      transformWith: PaginatedPostResponseDto,
    });
  }

  @Post("like-post/:id")
  @ApiSwaggerResponse(PostResponseDto)
  async likePost(@Req() req: Request, @Param("id") postId: string, @Res() res: Response) {
    const data = await this.reactionService.likePost(postId, req.user.id);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.CREATED },
      status: StatusCodes.OK,
      transformWith: PostResponseDto,
    });
  }

  @Post("dislike-post/:id")
  @ApiSwaggerResponse(PostResponseDto)
  async dislikePost(@Req() req: Request, @Param("id") postId: string, @Res() res: Response) {
    const data = await this.reactionService.dislikePost(postId, req.user.id);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.CREATED },
      status: StatusCodes.OK,
      transformWith: PostResponseDto,
    });
  }

  @Post("like-comment/:id")
  @ApiSwaggerResponse(CommentResponseDto)
  async likeComment(@Req() req: Request, @Param("id") commentId: string, @Res() res: Response) {
    const data = await this.reactionService.likeComment(commentId, req.user.id);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.CREATED },
      status: StatusCodes.OK,
      transformWith: CommentResponseDto,
    });
  }

  @Post("like-comment/:id")
  @ApiSwaggerResponse(CommentResponseDto)
  async dislikeComment(@Req() req: Request, @Param("id") commentId: string, @Res() res: Response) {
    const data = await this.reactionService.dislikeComment(commentId, req.user.id);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.CREATED },
      status: StatusCodes.OK,
      transformWith: CommentResponseDto,
    });
  }
}
