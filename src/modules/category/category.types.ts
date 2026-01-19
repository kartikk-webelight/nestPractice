import { OrderBy, SortBy } from "enums";

export interface CreateCategory {
  name: string;
  description: string;
}

export interface updateCategory {
  name?: string;
  description?: string;
}

export class GetCategoriesQuery {
  q?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: SortBy;
  order?: OrderBy;
  page: number;
  limit: number;
}
