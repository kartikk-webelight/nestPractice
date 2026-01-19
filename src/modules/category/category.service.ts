import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { ERROR_MESSAGES } from "constants/messages.constants";
import { SlugService } from "shared/slug.service";
import { CategoryEntity } from "./category.entity";
import { CreateCategory, GetCategoriesQuery, updateCategory } from "./category.types";

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly slugService: SlugService,
    private readonly dataSource: DataSource,
  ) {}

  async createCategory(body: CreateCategory) {
    const { name, description } = body;

    const slug = await this.slugService.buildSlug(name);

    const category = this.categoryRepository.create({
      name,
      description,
      slug,
    });

    const savedCategory = await this.categoryRepository.save(category);

    return savedCategory;
  }

  async updateCategory(body: updateCategory, categoryId: string) {
    const { name, description } = body;

    const category = await this.categoryRepository.findOne({ where: { id: categoryId } });

    if (!category) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }

    if (name && name != undefined) {
      const slug = await this.slugService.buildSlug(name);
      category.name = name;
      category.slug = slug;
    }
    if (description && description != undefined) {
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
    const { page, limit, q, fromDate, sortBy, order } = query;

    const [categories, total] = await this.categoryRepository.findAndCount({ skip: (page - 1) * limit, take: limit });

    return {
      data: categories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteCategory(categoryId: string) {
    const category = await this.categoryRepository.findOne({ where: { id: categoryId } });

    if (!category) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }
    await this.categoryRepository.softDelete(categoryId);

    return {};
  }
}
