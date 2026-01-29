# Blog Application – Backend Documentation

## 1. Overview
This document describes the backend system of the **Blog App**, a public blogging platform where authors can publish posts and readers can interact through comments and reactions. The backend is implemented as a **REST API** and follows a modular architecture using NestJS.

### Purpose
- Enable authors to create, manage, publish, and unpublish blog posts
- Allow all registered users to interact with content by commenting and reacting (like/dislike)
- Provide editorial oversight through editors who can publish or unpublish posts from any author
- Allow administrators to fully moderate platform content, including users, posts, comments, and categories
- Enforce secure role-based access control to ensure each user can perform only permitted actions


### User Roles
- **Reader**
  - Read published posts
  - Comment on posts
  - Like / Dislike posts
- **Author**
  - Create, update, delete own posts
  - Publish / unpublish own posts
  - All reader permissions
- **Editor**
  - Publish / unpublish posts of any author
- **Admin**
  - Full access to all resources and administrative actions

---

## 2. Tech Stack & Tools

### Framework & Language
- **NestJS** – A progressive Node.js framework used to build a modular, scalable, and maintainable REST API using well-defined architectural patterns.
- **TypeScript** – Provides static typing, better tooling, and improved code reliability across the application.

### Database & ORM
- **PostgreSQL** – Primary relational database used to store users, posts, comments, reactions, categories, and related data.
- **TypeORM** – Object Relational Mapper used for:
  - Entity and relationship management
  - Database migrations
  - Soft deletes and transactional operations

### Authentication & Authorization
- **JWT (JSON Web Tokens)** – Used for stateless authentication via access and refresh tokens.
- **HTTP-only Cookies** – Secure storage mechanism for access and refresh tokens to prevent XSS attacks.
- **NestJS Guards** – Enforces authentication and authorization at the route level.
- **Role-Based Access Control (RBAC)** – Ensures users can only perform actions permitted by their assigned role (reader, author, editor, admin).
- **bcrypt** – Used for secure password hashing.

### API Documentation
- **Swagger (@nestjs/swagger, swagger-ui-express)** – Automatically generates interactive API documentation for all exposed endpoints.

### Validation & Transformation
- **class-validator** – Validates incoming request payloads using declarative decorators.
- **class-transformer** – Transforms and serializes response objects to control API output.
- **Global ValidationPipe** – Ensures all incoming requests follow defined DTO schemas.

### File Uploads & Media Handling
- **Multer** – Handles multipart/form-data for file uploads.
- **Cloudinary** – Used for storing and managing uploaded media such as profile images and post attachments.

### Error Handling & Logging
- **Winston** – Centralized logging solution for application logs.
- **Sentry** – Error tracking and monitoring for runtime exceptions and failures.

### Utilities & Supporting Libraries
- **cookie-parser** – Parses cookies for authentication and session handling.
- **jsonwebtoken** – Generates and verifies JWT tokens.
- **@thi.ng/ksuid** – Generates unique, sortable identifiers (used in slug or ID generation).
- **http-status-codes** – Provides standardized HTTP status code constants.
- **dotenv** – Manages environment variables across environments.
- **ioredis** – Redis client (used for caching or future scalability).
- **rxjs** – Used internally by NestJS for reactive programming patterns.

### Code Quality & Tooling
- **ESLint** – Enforces consistent coding standards.
- **Prettier** – Automatically formats code for readability.
- **Husky & lint-staged** – Runs automated checks before commits.
- **Jest & Supertest** – Used for unit and integration testing.
- **SonarQube** – Static code analysis and code quality reporting.


---

## 3. Application Architecture

### Modules
- AuthModule
- UsersModule
- PostsModule
- CommentsModule
- ReactionsModule
- CategoryModule
- AttachmentsModule
- AdminModule

Each module encapsulates its own controllers, services, entities, and DTOs.

---

## 4. Authentication & Authorization

### Authentication Flow
1. User registers with name, email, and password
2. User logs in using email and password
3. Backend issues:
   - **Access Token** (1 hour expiry)
   - **Refresh Token** (24 hour expiry)
4. Tokens are stored in secure HTTP-only cookies
5. Access token is validated on protected routes
6. Refresh token endpoint issues a new access token

### Auth Endpoints
- `POST /auth/`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh-token`
- `GET /auth/`
- `PATCH /auth/`

### Cookie Configuration
- `accessToken`
- `refreshToken`
- `httpOnly: true`
- `secure: true (production only)`
- `sameSite: strict`

### Logout
- Clears both access and refresh tokens from cookies

---

## 5. Users Module

### User Entity
| Field | Description |
|------|------------|
| id | Unique identifier |
| name | User name |
| email | Unique email address |
| password | Hashed password |
| role | reader / author / editor / admin |
| createdAt | Creation timestamp |
| updatedAt | Update timestamp |
| deletedAt | Soft delete timestamp |

### Role Management
- Default role on signup: **reader**
- Role updates are allowed **only by admin**


### Permissions
- View any user: **admin**
- Delete user: **admin**
- Update another user’s data: **not allowed**
- Update own profile: **allowed**
- Upload profile image: **allowed**

---

## 6. Posts Module

### Post Entity
| Field | Description |
|------|------------|
| id | Unique identifier |
| title | Post title |
| content | Post body |
| slug | Auto-generated unique slug |
| status | draft / published |
| viewCount | Number of views |
| likes | Like count |
| dislikes | Dislike count |
| publishedAt | Publication timestamp |
| author | Author (User relation) |
| deletedAt | Soft delete timestamp |
| createdAt | Creation timestamp |
| updatedAt | Update timestamp |

### Slug Generation
- Automatically generated from title and a unique identifier
- Guaranteed to be unique

### Post Lifecycle
- Draft → Published
- Authors, editors, and admins can publish/unpublish posts

### Permissions
| Action | Reader | Author | Editor | Admin |
|------|--------|--------|--------|-------|
| Create post | ❌ | ✅ | ❌ | ✅ |
| Update own post | ❌ | ✅ | ❌ | ✅ |
| Delete own post | ❌ | ✅ | ❌ | ✅ |
| Publish own post | ❌ | ✅ | ❌ | ✅ |
| Publish any post | ❌ | ❌ | ✅ | ✅ |
| View drafts | ❌ | ❌ | ✅ | ✅ |

### Post APIs
- `POST /posts/`
- `PATCH /posts/:id`
- `DELETE /posts/:id`
- `GET /posts/:slug`
- `GET /posts/my`
- `PATCH /posts/:id/publish`
- `PATCH /posts/:id/unpublish`
- `GET /posts/search`

### Features
- Pagination
- Search by title or content
- Filter by category

---

## 7. Categories Module

### Category Entity
| Field | Description |
|------|------------|
| id | Unique identifier |
| name | Category name |
| description | Category description |
| createdAt | Creation timestamp |
| updatedAt | Update timestamp |

### Category Rules
- Only **admin** can create categories
- Posts can belong to **multiple categories**

---

## 8. Guards & Decorators

### Guards
- **AuthGuard** – Ensures user is authenticated
- **RolesGuard** – Enforces role-based access

### Decorators
- `@Roles()` – Defines required roles for a route

### Route Protection
- Guards handle authorization
- Interceptors are used for file uploads (Multer)
- Global validation via ValidationPipe

---

## Reactions Module

The ReactionsModule handles user interactions with posts and comments in the form of likes and dislikes.

### Reaction Entity
| Field       | Description |
|------------|-------------|
| id         | Unique identifier (with prefix `v`) |
| isLiked    | Boolean indicating a like (`true`) or dislike (`false`) |
| post       | Optional relation to the post being reacted to |
| comment    | Optional relation to the comment being reacted to |
| reactedBy  | User who performed the reaction |
| createdAt | Creation timestamp |
| updatedAt | Update timestamp |

> Notes:
> - Reactions can be linked to **posts or comments**.
> - Likes and dislikes are represented by the `isLiked` boolean field.

### Permissions
| Action | Reader | Author | Editor | Admin |
|--------|--------|--------|--------|-------|
| Add reaction | ✅ | ✅ | ✅ | ✅ |
| Remove own reaction | ✅ | ✅ | ✅ | ✅ |
| Moderate reactions | ❌ | ❌ | ❌ | ❌ |

- Users can react multiple times on the same post/comment:
  - Liking an already liked item **removes the like**
  - Disliking an already disliked item **removes the dislike**
  - Changing a reaction (like → dislike or vice versa) removes the previous reaction and creates the new one

### API Endpoints
- `POST /reactions/like-post` – Like a post  
- `POST /reactions/dislike-post` – Dislike a post  
- `POST /reactions/like-comment` – Like a comment  
- `POST /reactions/dislike-comment` – Dislike a comment  

> Bulk counts (total likes/dislikes per post) are tracked directly in the Post entity for performance.

### Behavior
- Supports toggling: liking/disliking the same post or comment will remove the previous reaction
- Changing reactions automatically updates the corresponding counts in the post entity
- Reactions are restricted to **one per user per post/comment** at a time


## Comments Module

The CommentsModule handles user comments on posts and supports nested (threaded) discussions.

### Comment Entity
| Field           | Description |
|-----------------|------------|
| id              | Unique identifier (prefix `c`) |
| content         | Text content of the comment |
| likes           | Number of likes (updated from ReactionsModule) |
| dislikes        | Number of dislikes (updated from ReactionsModule) |
| author          | User who created the comment |
| post            | Post to which the comment belongs |
| parentComment   | Optional parent comment for nested replies |
| child           | List of child comments (replies) |
| createdAt       | Timestamp when the comment was created |
| updatedAt       | Timestamp when the comment was last updated |
| deletedAt       | Timestamp when the comment was soft-deleted |

> Notes:
> - Supports **nested replies** using `parentComment` and `child` relations.
> - Soft deletes are implemented via the `deletedAt` field.

### Permissions
| Action | Reader | Author | Editor | Admin |
|--------|--------|--------|--------|-------|
| Create comment | ✅ | ✅ | ✅ | ✅ |
| Update own comment | ✅ | ✅ | ❌ | ✅ |
| Delete own comment | ✅ | ✅ | ❌ | ✅ |
| Delete any comment | ❌ | ❌ | ❌ | ✅ |

- Users can **reply to existing comments**, creating a nested structure.
- Only the **author of a comment** or an **admin** can update or delete it.

### API Endpoints
- `POST /comments/create` – Create a new comment on a post  
- `POST /comments/reply` – Reply to an existing comment (nested)  
- `GET /comments/:id` – Get comment by ID  
- `PATCH /comments/:id` – Update a comment (author only)  
- `DELETE /comments/:id` – Delete a comment (author or admin)  

### Behavior
- Comments are linked to **posts** and optionally to **other comments** (nested replies)
- Supports **soft deletion**, keeping deleted comments for audit/logging purposes
- Likes and dislikes on comments are tracked via the **ReactionsModule**
- Supports **pagination** when fetching comments for a post


## Attachments Module

The AttachmentsModule handles file uploads and media associated with users and posts.

### Attachment Entity
| Field         | Description |
|---------------|------------|
| id            | Unique identifier (prefix `a`) |
| path          | Public identifier or path of the file (Cloudinary publicId) |
| mimeType      | MIME type of the uploaded file |
| size          | File size in bytes |
| entityType    | Type of entity the attachment belongs to (`user` or `post`) |
| externalId    | ID of the associated entity (user or post) |
| originalName  | Optional original filename |
| createdAt     | Timestamp when the attachment was created |
| updatedAt     | Timestamp when the attachment was last updated |
| deletedAt     | Timestamp when the attachment was soft-deleted |

> Notes:
> - Attachments are linked to **users** and **posts** only (currently).  
> - The `externalId` field tracks which entity the attachment belongs to.  
> - Soft deletion is supported via the `deletedAt` field.

### File Handling
- **Allowed file types:** All (images, documents, etc.)  
- **Maximum file size:** 5 MB  
- **Storage:** Cloudinary (files are uploaded to the cloud)  
- **File naming:** No custom naming or folder conventions; files are stored using Cloudinary-generated identifiers  

### Permissions
| Action | Reader | Author | Editor | Admin |
|--------|--------|--------|--------|-------|
| Upload attachment | ✅ | ✅ | ✅ | ✅ |
| Delete attachment | ❌ | ✅ (own) | ❌ | ✅ (any) |
| Access attachment | ❌ | ❌ | ❌ | ❌ (must be authenticated) |

> Notes:
> - Everyone can upload attachments when creating a user or a post.  
> - Only the author of a post/user or an admin can delete associated attachments.  
> - Attachments are **not publicly accessible**; authentication is required.

### API Endpoints
- There are **no standalone endpoints** for attachments.  
- Attachments are returned as part of the **user or post entity** responses, including all metadata (path, size, mimeType, etc.).


## Admin Module

The AdminModule provides full access to manage all resources in the application and perform moderation tasks. Admin users have capabilities beyond other roles and can enforce platform rules.

### Scope
- Admins can manage **users, posts, comments, categories, and attachments**.
- Unique admin capabilities include:
  - Fetching any user by ID
  - Viewing all users
  - Updating user roles
  - Creating categories
  - Deleting users or comments
  - Publishing or unpublishing any post
  - Deleting attachments

### Permissions
| Action | Admin |
|--------|-------|
| Create, update, delete users | ✅ |
| Change roles of users | ✅ |
| Publish / unpublish any post | ✅ |
| Moderate comments | ✅ |
| Moderate reactions | ❌ (reactions cannot be moderated) |
| Delete attachments | ✅ |
| Create categories | ✅ |

> Notes:
> - Admins can **update or delete any entity**, including content created by other users.
> - Certain actions, like deleting themselves, may be restricted in practice to prevent accidental lockout.

### API Endpoints
- `GET /admin/users` – Fetch all users  
- `GET /admin/users/:id` – Fetch a user by ID  
- `PATCH /admin/users/:id/role` – Update the role of a user  
- `DELETE /admin/users/:id` – Delete a user  
- `PATCH /admin/posts/:id/publish` – Publish a post  
- `PATCH /admin/posts/:id/unpublish` – Unpublish a post  
- `DELETE /admin/comments/:id` – Delete any comment  
- `POST /admin/categories` – Create a new category  
- `DELETE /admin/attachments/:id` – Delete an attachment  

> Notes:
> - No bulk endpoints currently exist; all actions are performed on individual resources.

### Behavior
- Admin actions affect all users and content across the platform
- Only admin users can perform the above actions; other roles are restricted
- Standard auditing/logging is implemented via **createdAt/updatedAt/deletedAt** fields and application logging

## Global Error Handling & API Response Structure

The backend implements a **centralized exception filter** to handle errors consistently and return standardized responses to clients. This ensures predictable API behavior and integrates logging and monitoring.

### Implementation
- Uses NestJS **`ExceptionFilter`** (`MainExceptionFilter`) to catch all exceptions.
- Uses **`HttpAdapterHost`** to respond to HTTP requests from anywhere in the app.
- Integrates **Sentry (`captureException`)** for tracking unexpected server errors.
- Logs all exceptions using a **custom Winston logger**.

### Error Handling Logic
- **Handled status codes**:
  - `400 Bad Request` → validation failures
  - `401 Unauthorized` → authentication errors
  - `403 Forbidden` → authorization errors
  - `404 Not Found` → resource not found
- **Unhandled exceptions** (500 Internal Server Error) are:
  - Logged with stack trace
  - Sent to **Sentry** for monitoring
  - Returned to the client with a generic error message

### Standard API Response
#### Success Response
```json
{
  "success": true,
  "message": "Descriptive message",
  "data": { /* actual response payload */ }
}




