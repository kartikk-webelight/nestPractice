import { Controller, Get, Param, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PaginatedPostResponseDto } from "modules/post/dto/posts-response.dto";
import { SUCCESS_MESSAGES } from "constants/messages.constants";
import { PaginationQueryDto } from "dto/common-request.dto";
import { MessageResponseDto } from "dto/common-response.dto";
import { AuthGuard } from "guards/auth-guard";
import { ApiSwaggerResponse } from "swagger/swagger.decorator";
import responseUtils from "utils/response.utils";
import { ReactionService } from "./reaction.service";
import type { Request, Response } from "express";

@ApiTags("Reaction")
@UseGuards(AuthGuard)
@Controller("reaction")
export class ReactionController {
  constructor(private readonly reactionService: ReactionService) {}

  @Get("liked-post")
  @ApiSwaggerResponse(PaginatedPostResponseDto)
  async getLikedPosts(@Req() req: Request, @Query() query: PaginationQueryDto, @Res() res: Response) {
    const { page, limit } = query;
    const data = await this.reactionService.getLikedPosts(page, limit, req.user.id);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_POSTS_FETCHED },
      transformWith: PaginatedPostResponseDto,
    });
  }

  @Get("disliked-post")
  @ApiSwaggerResponse(PaginatedPostResponseDto)
  async getDislikedPosts(@Req() req: Request, @Query() query: PaginationQueryDto, @Res() res: Response) {
    const { page, limit } = query;
    const data = await this.reactionService.getDislikedPosts(page, limit, req.user.id);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_POSTS_FETCHED },
      transformWith: PaginatedPostResponseDto,
    });
  }

  @Post(":id/like-post")
  @ApiSwaggerResponse(MessageResponseDto)
  async likePost(@Req() req: Request, @Param("id") postId: string, @Res() res: Response) {
    await this.reactionService.likePost(postId, req.user.id);

    return responseUtils.success(res, {
      data: { message: SUCCESS_MESSAGES.CREATED },
      transformWith: MessageResponseDto,
    });
  }

  @Post(":id/dislike-post")
  @ApiSwaggerResponse(MessageResponseDto)
  async dislikePost(@Req() req: Request, @Param("id") postId: string, @Res() res: Response) {
    await this.reactionService.dislikePost(postId, req.user.id);

    return responseUtils.success(res, {
      data: { message: SUCCESS_MESSAGES.CREATED },
      transformWith: MessageResponseDto,
    });
  }

  @Post(":id/like-comment")
  @ApiSwaggerResponse(MessageResponseDto)
  async likeComment(@Req() req: Request, @Param("id") commentId: string, @Res() res: Response) {
    await this.reactionService.likeComment(commentId, req.user.id);

    return responseUtils.success(res, {
      data: { message: SUCCESS_MESSAGES.CREATED },
      transformWith: MessageResponseDto,
    });
  }

  @Post(":id/like-comment")
  @ApiSwaggerResponse(MessageResponseDto)
  async dislikeComment(@Req() req: Request, @Param("id") commentId: string, @Res() res: Response) {
    await this.reactionService.dislikeComment(commentId, req.user.id);

    return responseUtils.success(res, {
      data: { message: SUCCESS_MESSAGES.CREATED },
      transformWith: MessageResponseDto,
    });
  }
}
