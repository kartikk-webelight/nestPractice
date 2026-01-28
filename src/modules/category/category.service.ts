import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ERROR_MESSAGES } from "constants/messages";
import { OrderBy } from "enums";
import { SlugService } from "shared/slug.service";
import { calculateOffset, calculateTotalPages } from "utils/helper";
import { CategoryEntity } from "./category.entity";
import { CreateCategory, GetCategoriesQuery, UpdateCategory } from "./category.types";

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly slugService: SlugService,
  ) {}

  async createCategory(body: CreateCategory) {
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

  async updateCategory(body: UpdateCategory, categoryId: string) {
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

  async getCategoryById(categoryId: string) {
    const category = await this.categoryRepository.findOne({ where: { id: categoryId } });

    if (!category) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }

    return category;
  }
  async getCategoryBySlug(categorySlug: string) {
    const category = await this.categoryRepository.findOne({ where: { slug: categorySlug } });

    if (!category) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }

    return category;
  }

  async getCategories(query: GetCategoriesQuery) {
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

  async deleteCategory(categoryId: string) {
    const category = await this.categoryRepository.findOne({ where: { id: categoryId } });

    if (!category) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }
    await this.categoryRepository.softDelete(categoryId);
  }
}
