import { BaseQuery } from "types/types";

export interface CreateCategory {
  name: string;
  description: string;
}

export interface UpdateCategory {
  name?: string;
  description?: string;
}

export type GetCategoriesQuery = BaseQuery;
