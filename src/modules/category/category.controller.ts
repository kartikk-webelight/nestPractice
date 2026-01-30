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

/**
 * Provides administrative endpoints for managing content categories and taxonomies.
 *
 * @remarks
 * Access is restricted to users with the {@link UserRole.ADMIN} role. This controller
 * coordinates with the {@link CategoryService} to perform CRUD operations and
 * filtered data retrieval.
 *
 * @group Content Management Controllers
 */
@ApiTags("Categories")
@Roles(UserRole.ADMIN)
@UseGuards(AuthGuard, RolesGuard)
@Controller("categories")
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * Processes the creation of a new category and returns the persisted record.
   *
   * @param body - The {@link CreateCategoryDto} containing the category details.
   * @param res - The Express response object.
   * @returns A success response containing the created {@link CreateCategoryResponseDto}.
   */
  @Post()
  @ApiSwaggerResponse(CreateCategoryResponseDto, { status: StatusCodes.CREATED })
  async createCategory(@Body() body: CreateCategoryDto, @Res() res: Response) {
    const data = await this.categoryService.createCategory(body);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.CREATED },
      status: StatusCodes.CREATED,
      transformWith: CreateCategoryResponseDto,
    });
  }

  /**
   * Retrieves a filtered and paginated collection of all categories.
   *
   * @param query - The {@link GetCategoriesQueryDto} containing filter and pagination parameters.
   * @param res - The Express response object.
   * @returns A success response containing the paginated {@link GetCategoriesResponseDto}.
   */
  @Get()
  @ApiSwaggerResponse(GetCategoriesResponseDto)
  async getCategories(@Query() query: GetCategoriesQueryDto, @Res() res: Response) {
    const data = await this.categoryService.getCategories(query);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.ALL_CATEGORIES_FETCHED },
      transformWith: GetCategoriesResponseDto,
    });
  }

  /**
   * Updates an existing category's information based on the provided identifier.
   *
   * @param categoryId - The unique ID of the category to modify.
   * @param body - The {@link UpdateCategoryDto} containing updated fields.
   * @param res - The Express response object.
   * @returns A success response containing the updated {@link UpdateCategoryResponseDto}.
   */
  @Patch(":id")
  @ApiSwaggerResponse(UpdateCategoryResponseDto)
  async updateCategory(@Param("id") categoryId: string, @Body() body: UpdateCategoryDto, @Res() res: Response) {
    const data = await this.categoryService.updateCategory(body, categoryId);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.UPDATED },
      transformWith: UpdateCategoryResponseDto,
    });
  }

  /**
   * Retrieves a specific category's details by its unique identifier.
   *
   * @param categoryId - The ID of the category to retrieve.
   * @param res - The Express response object.
   * @returns A success response containing the {@link GetCategoryByIdResponseDto}.
   */
  @Get(":id")
  @ApiSwaggerResponse(GetCategoryByIdResponseDto)
  async getCategoryById(@Param("id") categoryId: string, @Res() res: Response) {
    const data = await this.categoryService.getCategoryById(categoryId);

    return responseUtils.success(res, {
      data: { data, message: SUCCESS_MESSAGES.CATEGORY_FETCHED },
      transformWith: GetCategoryByIdResponseDto,
    });
  }

  /**
   * Executes a soft delete for a specific category resource.
   *
   * @param categoryId - The ID of the category to remove.
   * @param res - The Express response object.
   * @returns A {@link MessageResponseDto} confirming the deletion.
   */
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
