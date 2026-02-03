// src/constants/cache-prefixes.ts

export const REDIS_PREFIX = {
  // Auth
  AUTH: "auth", // auth-related cache (e.g., auth guard)

  // Users
  USER: "user", // single user cache
  USERS: "users", // list of users cache
  USER_LISTS: "userLists", // tracking which lists a user appears in

  // Categories
  CATEGORY: "category", // single category cache
  CATEGORIES: "categories", // list of categories cache

  // Posts
  POST: "post", // single post cache
  POSTS: "posts", // list of posts cache
  LIKED_POSTS: "liked_posts", // posts liked by a user
  DISLIKED_POSTS: "disliked_posts", // posts disliked by a user

  // Comments
  COMMENT: "comment", // single comment cache
  COMMENTS: "comments", // list of comments cache

  // Roles
  ROLE_REQUEST: "role_request", // single role request cache
  ROLE_REQUESTS: "role_requests", // list of role requests cache
};
