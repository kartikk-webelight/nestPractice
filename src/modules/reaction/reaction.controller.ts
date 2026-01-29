import { Controller, Get, Param, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PaginatedPostResponseDto } from "modules/post/dto/posts-response.dto";
import { SUCCESS_MESSAGES } from "constants/messages";
import { PaginationQueryDto } from "dto/common-request.dto";
import { MessageResponseDto } from "dto/common-response.dto";
import { AuthGuard } from "guards/auth-guard";
import { ApiSwaggerResponse } from "swagger/swagger.decorator";
import responseUtils from "utils/response.utils";
import { ReactionService } from "./reaction.service";
import type { Request, Response } from "express";

/**
 * Handles HTTP requests for managing user engagement through likes and dislikes.
 *
 * @remarks
 * This controller coordinates with the {@link ReactionService} to perform transactional
 * state updates on posts and comments. All endpoints require an identity established
 * by {@link AuthGuard}.
 *
 * @group Social & Interaction Controllers
 */
@ApiTags("Reaction")
@UseGuards(AuthGuard)
@Controller("reaction")
export class ReactionController {
  constructor(private readonly reactionService: ReactionService) {}

  /**
   * Retrieves a paginated list of posts the authenticated user has reacted to with a like.
   *
   * @param req - The {@link Request} object containing the identity established by {@link AuthGuard}.
   * @param query - The {@link PaginationQueryDto} for page and limit control.
   * @param res - The Express response object.
   * @returns A success response containing {@link PaginatedPostResponseDto}.
   */
  @Get("liked-posts")
  @ApiSwaggerResponse(PaginatedPostResponseDto)
  async getLikedPosts(@Req() req: Request, @Query() query: PaginationQueryDto, @Res() res: Response) {
    const { page, limit } = query;
    const data = await this.reactionService.getLikedPosts(page, limit, req.user.id);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_POSTS_FETCHED },
      transformWith: PaginatedPostResponseDto,
    });
  }

  /**
   * Retrieves a paginated list of posts the authenticated user has reacted to with a dislike.
   *
   * @param req - The request object populated by {@link AuthGuard}.
   * @param query - The {@link PaginationQueryDto} for pagination.
   * @param res - The Express response object.
   * @returns A success response containing {@link PaginatedPostResponseDto}.
   */
  @Get("disliked-posts")
  @ApiSwaggerResponse(PaginatedPostResponseDto)
  async getDislikedPosts(@Req() req: Request, @Query() query: PaginationQueryDto, @Res() res: Response) {
    const { page, limit } = query;
    const data = await this.reactionService.getDislikedPosts(page, limit, req.user.id);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_POSTS_FETCHED },
      transformWith: PaginatedPostResponseDto,
    });
  }

  /**
   * Processes a request to toggle or switch the 'Like' state on a post.
   *
   * @param req - The request object containing the user's established identity.
   * @param postId - The unique ID of the post.
   * @param res - The Express response object.
   * @returns A success message confirming the transaction completed.
   */
  @Post(":id/like-post")
  @ApiSwaggerResponse(MessageResponseDto)
  async likePost(@Req() req: Request, @Param("id") postId: string, @Res() res: Response) {
    await this.reactionService.likePost(postId, req.user.id);

    return responseUtils.success(res, {
      data: { message: SUCCESS_MESSAGES.CREATED },
      transformWith: MessageResponseDto,
    });
  }

  /**
   * Processes a request to toggle or switch the 'Dislike' state on a post.
   *
   * @param req - The request object containing user identity data.
   * @param postId - The unique ID of the post.
   * @param res - The Express response object.
   * @returns A success message confirming the state update.
   */
  @Post(":id/dislike-post")
  @ApiSwaggerResponse(MessageResponseDto)
  async dislikePost(@Req() req: Request, @Param("id") postId: string, @Res() res: Response) {
    await this.reactionService.dislikePost(postId, req.user.id);

    return responseUtils.success(res, {
      data: { message: SUCCESS_MESSAGES.CREATED },
      transformWith: MessageResponseDto,
    });
  }

  /**
   * Processes a request to toggle or switch the 'Like' state on a comment.
   *
   * @param req - The request object containing the user's identity.
   * @param commentId - The unique ID of the comment.
   * @param res - The Express response object.
   * @returns A success message confirming the update.
   */
  @Post(":id/like-comment")
  @ApiSwaggerResponse(MessageResponseDto)
  async likeComment(@Req() req: Request, @Param("id") commentId: string, @Res() res: Response) {
    await this.reactionService.likeComment(commentId, req.user.id);

    return responseUtils.success(res, {
      data: { message: SUCCESS_MESSAGES.CREATED },
      transformWith: MessageResponseDto,
    });
  }

  /**
   * Processes a request to toggle or switch the 'Dislike' state on a comment.
   *
   * @param req - The request object containing the user's identity.
   * @param commentId - The unique ID of the comment.
   * @param res - The Express response object.
   * @returns A success message confirming the update.
   */
  @Post(":id/dislike-comment")
  @ApiSwaggerResponse(MessageResponseDto)
  async dislikeComment(@Req() req: Request, @Param("id") commentId: string, @Res() res: Response) {
    await this.reactionService.dislikeComment(commentId, req.user.id);

    return responseUtils.success(res, {
      data: { message: SUCCESS_MESSAGES.CREATED },
      transformWith: MessageResponseDto,
    });
  }
}
