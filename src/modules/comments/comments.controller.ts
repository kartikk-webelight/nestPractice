import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Res, UseGuards, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto, ReplyCommentDto, UpdateCommentDto } from './dto/comment.dto';
import type { Request, Response } from 'express';
import { AuthGuard } from 'src/guards/auth-guard';
import responseUtils from 'src/utils/response.utils';
import { SUCCESS_MESSAGES } from 'src/constants/messages.constants';
import { StatusCodes } from 'http-status-codes';
import { ApiSwaggerResponse } from 'src/swagger/swagger.decorator';
import { CreateCommentResponseDto, GetCommentByIdResponseDto, PaginatedCommentResonseDto, ReplyCommentResponseDto, UpdateCommentResponseDto } from './dto/comment-response.dto';
import { ApiTags } from '@nestjs/swagger';
import { PaginationDto } from 'src/dto/common.dto';
import { RolesGuard } from 'src/guards/role-guard';
import { Roles } from 'src/decorators/role';

@ApiTags("Comments")
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(AuthGuard)
  @ApiSwaggerResponse(CreateCommentResponseDto,{status:StatusCodes.CREATED})
  @Post('create')
  async createComment(
    @Body() body: CreateCommentDto,
    @Req() req: Request,
    @Res() res:Response
  ) {
    const data=await this.commentsService.createComment(body,req.user.id,);

    return responseUtils.success(res, {
      data:{data, message:SUCCESS_MESSAGES.CREATED},
      status:StatusCodes.CREATED,
      transformWith:CreateCommentResponseDto
    })
  }

    @UseGuards(AuthGuard)
  @ApiSwaggerResponse(ReplyCommentResponseDto,{status:StatusCodes.CREATED})
  @Post('reply')
  async replyComment(
    @Body() body: ReplyCommentDto,
    @Req() req: Request,
    @Res() res:Response
  ) {
    const data=await this.commentsService.replyComment(body,req.user.id);

    return responseUtils.success(res, {
      data:{data, message:SUCCESS_MESSAGES.CREATED},
      status:StatusCodes.CREATED,
      transformWith:ReplyCommentResponseDto
    })
  }

  @Get()
  @ApiSwaggerResponse(PaginatedCommentResonseDto)
  async getAllComment(
    @Query() query:PaginationDto,
    @Res() res:Response
  ) {
    const {page, limit}=query
    const {data, meta}= await this.commentsService.getAllComments(page, limit);

    return responseUtils.success(res, {
      data:{data, meta, message:SUCCESS_MESSAGES.ALL_COMMENTS_FETCHED},
      status:StatusCodes.OK,
      transformWith:PaginatedCommentResonseDto

    })
  }

  @Get(':id')
  @ApiSwaggerResponse(GetCommentByIdResponseDto)
  async getCommentById(
    @Param('id') commentId: string,
    @Res() res:Response
  ) {
    const data=await this.commentsService.getCommentById(commentId)

    return responseUtils.success(res, {
      data:{data, message:SUCCESS_MESSAGES.COMMENT_FETCHED},
      status:StatusCodes.OK,
      transformWith:GetCommentByIdResponseDto
    })
  }

 @UseGuards(AuthGuard)
 @Patch(':id')
 @ApiSwaggerResponse(UpdateCommentResponseDto)
 async updateComment(
  @Req() req:Request,
  @Param('id') commentId: string,
  @Body() body : UpdateCommentDto,
  @Res() res:Response
) {
    const data=await this.commentsService.updateComment(commentId,body, req.user.id)

    return responseUtils.success(res,{
      data:{data, message:SUCCESS_MESSAGES.UPDATED},
      status:StatusCodes.OK,
      transformWith:UpdateCommentResponseDto
    })
  }

  


  @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteComment(
    @Req() req:Request,
    @Param('id') commentId: string,
    @Res() res:Response
  ) {
    const data=await this.commentsService.deleteComment(commentId, req.user);

    return responseUtils.success(res, {
      data:{data, message:SUCCESS_MESSAGES.DELETED},
      status:StatusCodes.OK
    })
  }
}
