import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { StatusCodes } from "http-status-codes";
import { SUCCESS_MESSAGES } from "constants/messages";
import { Roles } from "decorators/role";
import { MessageResponseDto } from "dto/common-response.dto";
import { UserRole } from "enums";
import { AuthGuard } from "guards/auth-guard";
import { RolesGuard } from "guards/role-guard";
import { ApiSwaggerResponse } from "swagger/swagger.decorator";
import responseUtils from "utils/response.utils";
import { CategoryService } from "./category.service";
import {
  CreateCategoryResponseDto,
  GetCategoriesResponseDto,
  GetCategoryByIdResponseDto,
  UpdateCategoryResponseDto,
} from "./dto/category-response.dto";
import { CreateCategoryDto, GetCategoriesQueryDto, UpdateCategoryDto } from "./dto/category.dto";
import type { Response } from "express";

@ApiTags("Categories")
@Roles(UserRole.ADMIN)
@UseGuards(AuthGuard, RolesGuard)
@Controller("categories")
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiSwaggerResponse(CreateCategoryResponseDto)
  async createCategory(@Body() body: CreateCategoryDto, @Res() res: Response) {
    const data = await this.categoryService.createCategory(body);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.CREATED },
      status: StatusCodes.CREATED,
      transformWith: CreateCategoryResponseDto,
    });
  }

  @Get()
  @ApiSwaggerResponse(GetCategoriesResponseDto)
  async getCategories(@Query() query: GetCategoriesQueryDto, @Res() res: Response) {
    const data = await this.categoryService.getCategories(query);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_CATEGORIES_FETCHED },
      transformWith: GetCategoriesResponseDto,
    });
  }

  @Patch(":id")
  @ApiSwaggerResponse(UpdateCategoryResponseDto)
  async updateCategory(@Param("id") categoryId: string, @Body() body: UpdateCategoryDto, @Res() res: Response) {
    const data = await this.categoryService.updateCategory(body, categoryId);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.UPDATED },
      transformWith: UpdateCategoryResponseDto,
    });
  }

  @Get(":id")
  @ApiSwaggerResponse(GetCategoryByIdResponseDto)
  async getCategoryById(@Param("id") categoryId: string, @Res() res: Response) {
    const data = await this.categoryService.getCategoryById(categoryId);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.CATEGORY_FETCHED },
      transformWith: GetCategoryByIdResponseDto,
    });
  }

  @Delete(":id")
  @ApiSwaggerResponse(MessageResponseDto)
  async deleteCategory(@Param("id") categoryId: string, @Res() res: Response) {
    await this.categoryService.deleteCategory(categoryId);

    return responseUtils.success(res, {
      data: { message: SUCCESS_MESSAGES.DELETED },
      transformWith: MessageResponseDto,
    });
  }
}
