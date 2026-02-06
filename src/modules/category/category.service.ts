import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository } from "typeorm";
import { REDIS_PREFIX } from "constants/cache-prefixes";
import { DURATION_CONSTANTS } from "constants/duration";
import { ERROR_MESSAGES } from "constants/messages";
import { OrderBy } from "enums";
import { logger } from "services/logger.service";
import { RedisService } from "shared/redis/redis.service";
import { SlugService } from "shared/slug.service";
import { calculateOffset, calculateTotalPages } from "utils/helper";
import { getCachedJson, makeRedisKey } from "utils/redis-cache";
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
    private readonly redisService: RedisService,
  ) {}

  /**
   * Creates a new category and generates a unique URL-friendly slug.
   *
   * @param body - The {@link CreateCategoryDto} data containing name and description.
   * @returns A promise resolving to the newly persisted {@link CategoryResponse}.
   */
  async createCategory(body: CreateCategoryDto): Promise<CategoryResponse> {
    logger.info("Category creation initiated for name: %s", body.name);

    // Step 1: Validate category name uniqueness
    const { name, description } = body;

    const existingCategory = await this.categoryRepository.findOne({ where: { name } });

    if (existingCategory) {
      logger.warn("Category creation failed: Name '%s' already exists", body.name);

      throw new ConflictException(ERROR_MESSAGES.CATEGORY_ALREADY_EXISTS);
    }

    const slug = this.slugService.buildSlug(name);

    const category = this.categoryRepository.create({
      name,
      description,
      slug,
    });

    const savedCategory = await this.categoryRepository.save(category);

    await this.invalidateCategoryCaches(savedCategory.id);

    logger.info("Category created successfully with ID: %s", savedCategory.id);

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
    logger.info("Update request for Category ID: %s", categoryId);

    // Step 1: Validate existence of the category before processing updates

    const { name, description } = body;

    const category = await this.findCategoryOrThrow(categoryId);

    if (name) {
      const duplicateCategory = await this.categoryRepository.findOne({
        where: {
          name,
          id: Not(categoryId),
        },
      });

      if (duplicateCategory) {
        throw new ConflictException(ERROR_MESSAGES.CATEGORY_ALREADY_EXISTS);
      }

      category.name = name;
      category.slug = this.slugService.buildSlug(name);
    }
    if (description) {
      category.description = description;
    }

    const updatedCategory = await this.categoryRepository.save(category);

    await this.invalidateCategoryCaches(categoryId);

    logger.info("Category %s updated successfully", categoryId);

    return updatedCategory;
  }

  /**
   * Retrieves a single category by its unique identifier.
   *
   *
   * @param categoryId - The unique ID of the category to retrieve.
   * @returns A promise resolving to the {@link CategoryResponse}.
   * @throws NotFoundException if the category does not exist.
   */
  async getCategoryById(categoryId: string): Promise<CategoryResponse> {
    const category = await this.findCategoryOrThrow(categoryId);

    logger.info("Retrieving category details for ID: %s", categoryId);

    return category;
  }

  /**
   * Retrieves a paginated list of categories based on search terms and date filters.
   *
   * This method first checks Redis cache for the result. If not found, it queries the database,
   * applies filters and pagination, caches the response, and returns it.
   *
   * @param query - The {@link GetCategoriesQueryDto} containing search terms, filters, and pagination options.
   * @returns A promise resolving to a paginated object containing the categories and metadata {@link CategoriesPaginationResponseDto}.
   */
  async getCategories(query: GetCategoriesQueryDto): Promise<CategoriesPaginationResponseDto> {
    logger.info("Fetching categories list with query: %j", query);

    const categoriesCacheKey = makeRedisKey(REDIS_PREFIX.CATEGORIES, query);

    const cachedCategories = await getCachedJson<CategoriesPaginationResponseDto>(
      categoriesCacheKey,
      this.redisService,
    );

    if (cachedCategories) {
      logger.info("Cache hit for categories list (query: %j)", query);

      return cachedCategories;
    }
    // Step 1: Initialize QueryBuilder and apply search/date filters

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

    // Step 2: Apply sorting and pagination logic to the query

    qb.orderBy("category.createdAt", order);

    qb.skip(calculateOffset(page, limit)).take(limit);

    const [categories, total] = await qb.getManyAndCount();

    logger.info("Retrieved %d categories out of %d total", categories.length, total);

    const paginatedResponse = {
      data: categories,
      total,
      page,
      limit,
      totalPages: calculateTotalPages(total, limit),
    };

    await this.redisService.set(
      categoriesCacheKey,
      JSON.stringify(paginatedResponse),
      DURATION_CONSTANTS.TWO_MIN_IN_SEC,
    );

    return paginatedResponse;
  }

  /**
   * Performs a soft delete on a category resource.
   *
   * @param categoryId - The ID of the category to remove.
   * @returns void
   * @throws NotFoundException if the category does not exist.
   */
  async deleteCategory(categoryId: string): Promise<void> {
    logger.info("Soft-delete requested for Category ID: %s", categoryId);

    const category = await this.findCategoryOrThrow(categoryId);

    await this.categoryRepository.softDelete(category.id);

    await this.invalidateCategoryCaches(category.id);

    logger.info("Category %s soft-deleted successfully", categoryId);
  }

  /**
   * Clears Redis caches for a category and related category lists.
   * @param categoryId - ID of the category to invalidate
   */
  private async invalidateCategoryCaches(categoryId: string): Promise<void> {
    const categoryCacheKey = makeRedisKey(REDIS_PREFIX.CATEGORY, categoryId);
    const categoriesCacheKey = makeRedisKey(REDIS_PREFIX.CATEGORIES, "");

    // Delete single category cache
    await this.redisService.delete([categoryCacheKey]);

    // Delete all cached category lists
    await this.redisService.deleteByPattern(`${categoriesCacheKey}*`);
  }

  private async findCategoryOrThrow(categoryId: string): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }

    return category;
  }
}
