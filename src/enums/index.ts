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

export enum PostAction {
  PUBLISH = "publish",
  UNPUBLISH = "unpublish",
}

export enum EntityType {
  POST = "post",
  USER = "user",
}

export enum SortBy {
  CREATED_AT = "createdAt",
  LIKES = "likes",
  VIEWCOUNT = "viewCount",
}

export enum OrderBy {
  ASC = "ASC",
  DESC = "DESC",
}

export enum RoleStatus {
  APPROVED = "approved",
  PENDING = "pending",
  REJECTED = "rejected",
}

export enum RoleRequestAction {
  APPROVE = "approve",
  REJECT = "reject",
}

export enum ReactionCounter {
  DISLIKE = "dislikes",
  LIKE = "likes",
}

export enum ReactionRelation {
  COMMENT = "comment",
  POST = "post",
}
