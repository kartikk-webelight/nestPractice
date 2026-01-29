import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ERROR_MESSAGES } from "constants/messages";
import { OrderBy } from "enums";
import { SlugService } from "shared/slug.service";
import { calculateOffset, calculateTotalPages } from "utils/helper";
import { CategoryEntity } from "./category.entity";
import { CategoriesPaginationResponseDto, CategoryResponse } from "./dto/category-response.dto";
import { CreateCategoryDto, GetCategoriesQueryDto, UpdateCategoryDto } from "./dto/category.dto";

/**
 * Provides operations for managing content classifications and taxonomies.
 *
 * @remarks
 * This service handles the lifecycle of category entities, including automatic
 * slug generation via {@link SlugService} and complex filtered querying.
 *
 * @group Content Management Services
 */
@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly slugService: SlugService,
  ) {}

  /**
   * Creates a new category and generates a unique URL-friendly slug.
   *
   * @param body - The {@link CreateCategoryDto} data containing name and description.
   * @returns A promise resolving to the newly persisted {@link CategoryResponse}.
   */
  async createCategory(body: CreateCategoryDto): Promise<CategoryResponse> {
    const { name, description } = body;

    const slug = this.slugService.buildSlug(name);

    const category = this.categoryRepository.create({
      name,
      description,
      slug,
    });

    const savedCategory = await this.categoryRepository.save(category);

    return savedCategory;
  }

  /**
   * Updates an existing category's details and regenerates the slug if the name changes.
   *
   * @param body - The {@link UpdateCategoryDto} data.
   * @param categoryId - The unique identifier of the category to update.
   * @returns A promise resolving to the updated {@link CategoryResponse}.
   * @throws NotFoundException if no category exists with the provided ID.
   */
  async updateCategory(body: UpdateCategoryDto, categoryId: string): Promise<CategoryResponse> {
    const { name, description } = body;

    const category = await this.categoryRepository.findOne({ where: { id: categoryId } });

    if (!category) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }

    if (name) {
      const slug = this.slugService.buildSlug(name);
      category.name = name;
      category.slug = slug;
    }
    if (description) {
      category.description = description;
    }

    const updatedCategory = await this.categoryRepository.save(category);

    return updatedCategory;
  }

  /**
   * Retrieves a single category by its unique identifier.
   *
   * @param categoryId - The ID of the category to retrieve.
   * @returns A promise resolving to the {@link CategoryResponse}.
   * @throws NotFoundException if the category is not found.
   */
  async getCategoryById(categoryId: string): Promise<CategoryResponse> {
    const category = await this.categoryRepository.findOne({ where: { id: categoryId } });

    if (!category) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }

    return category;
  }

  /**
   * Performs a paginated search and filter operation to retrieve a collection of categories.
   *
   * @param query - The {@link GetCategoriesQueryDto} containing search terms and date filters.
   * @returns A promise resolving to a paginated object containing the data and metadata {@link CategoriesPaginationResponseDto}.
   */
  async getCategories(query: GetCategoriesQueryDto): Promise<CategoriesPaginationResponseDto> {
    const { page, limit, search, fromDate, order = OrderBy.DESC, toDate } = query;

    const qb = this.categoryRepository.createQueryBuilder("category");

    if (search) {
      qb.andWhere("(category.name ILIKE :search OR category.description ILIKE :search)", { search: `%${search}%` });
    }

    if (fromDate) {
      qb.andWhere("category.createdAt >= :fromDate", { fromDate });
    }

    if (toDate) {
      qb.andWhere("category.createdAt <= :toDate", { toDate });
    }

    qb.orderBy("category.createdAt", order);

    qb.skip(calculateOffset(page, limit)).take(limit);

    const [categories, total] = await qb.getManyAndCount();

    return {
      data: categories,
      total,
      page,
      limit,
      totalPages: calculateTotalPages(total, limit),
    };
  }

  /**
   * Performs a soft delete on a category resource.
   *
   * @param categoryId - The ID of the category to remove.
   * @returns void
   * @throws NotFoundException if the category does not exist.
   */
  async deleteCategory(categoryId: string): Promise<void> {
    const category = await this.categoryRepository.findOne({ where: { id: categoryId } });

    if (!category) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }
    await this.categoryRepository.softDelete(categoryId);
  }
}
