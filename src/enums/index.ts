export enum UserRole {
  ADMIN = "admin",
  AUTHOR = "author",
  EDITOR = "editor",
  READER = "reader",
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
  VIEWS = "viewCount",
}

export enum OrderBy {
  ASC = "ASC",
  DESC = "DESC",
}
