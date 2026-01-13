import { PostOrderBy, PostSortBy } from "enums";

export interface UpdatePost {
  title?: string;
  content?: string;
}

export interface CreatePost {
  title: string;
  content: string;
}

export interface SearchPostsQuery {
  q?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: PostSortBy;
  order?: PostOrderBy;
  page: number;
  limit: number;
}
