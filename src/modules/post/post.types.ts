import { PostStatus, SortBy } from "enums";
import { BaseQuery } from "types/types";

export interface CreatePost {
  title: string;
  content: string;
  categoryIds: string[];
}

export type UpdatePost = Partial<CreatePost>;

export interface GetPostsQuery extends BaseQuery {
  status?: PostStatus;
  sortBy?: SortBy;
}
