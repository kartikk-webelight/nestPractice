import { OrderBy, PostStatus, SortBy } from "enums";

export interface UpdatePost {
  title?: string;
  content?: string;
}

export interface CreatePost {
  title: string;
  content: string;
}

export interface GetPostsQuery {
  q?: string;
  status?: PostStatus;
  fromDate?: string;
  toDate?: string;
  sortBy?: SortBy;
  order?: OrderBy;
  page: number;
  limit: number;
}
