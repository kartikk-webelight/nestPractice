import { PostStatus, SortBy } from "enums";
import { BaseQuery } from "types/types";

export interface UpdatePost {
  title?: string;
  content?: string;
}

export interface CreatePost {
  title: string;
  content: string;
  categoryIds: string[];
}

export interface GetPostsQuery extends BaseQuery {
  status?: PostStatus;
  sortBy?: SortBy;
}
