export enum UserRole {
  ADMIN = "admin",
  READER = "reader",
  EDITOR = "editor",
  AUTHOR = "author",
}

export enum PostStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
}

export enum EntityType {
  POST = "post",
  USER = "user",
}

export enum SortBy {
  CREATED_AT = "createdAt",
  LIKES = "likes",
  VIEWS = "views",
}

export enum OrderBy {
  ASC = "ASC",
  DESC = "DESC",
}
