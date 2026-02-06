# 🚀 Blog Engine – Core Backend Documentation

## 1. Executive Summary
The **Blog Engine** is a high-performance, enterprise-grade content management backend designed for scalable digital publishing. It facilitates a multi-tenant environment where authors can craft content, editors can curate quality, and readers can engage through a robust social interaction layer. 

The system is built on a **RESTful architecture** using **NestJS**, prioritizing modularity, data integrity, and strict **Role-Based Access Control (RBAC)**.



---

## 2. Platform Objectives

### 📝 Dynamic Content Orchestration
* **Author Empowerment**: Provide authors with a private workspace to manage the full lifecycle of their posts, from initial draft to final publication.
* **Taxonomy Management**: Organize content through a structured category system to enhance discoverability and SEO.

### 👥 Community Engagement & Social Layer
* **Interactive Threads**: Support nested, threaded discussions allowing users to engage deeply with specific content topics.
* **Sentiment Tracking**: Real-time interaction via an atomic reaction system (Likes/Dislikes) on both posts and comments.

### 🛡️ Governance & Moderation
* **Editorial Workflow**: Enable a "Review-and-Publish" pipeline where Editors can manage quality control across the entire platform.
* **Administrative Oversight**: Grant Admins full-spectrum visibility and control over users, assets, and system configurations to ensure platform safety.

---

## 3. Role-Based Access Control (RBAC)

The system enforces security at the controller and service levels through a hierarchical permission model:

| Role | Access Level | Responsibilities |
| :--- | :--- | :--- |
| **Admin** | **Full System** | User management, category definition, and global content moderation. |
| **Editor** | **Cross-Author** | Reviewing, publishing, and unpublishing content from any author. |
| **Author** | **Personal Workspace**| Creating, editing, and managing the status of their own posts. |
| **User** | **Social Access** | Creating profiles, commenting, and reacting to published content. |

---

## 4. Core Technical Capabilities

### ⚡ Performance & Scalability
* **Cache-Aside Pattern**: Utilizes **Redis** to cache high-frequency read operations (categories, post lists, comments), significantly reducing database overhead.
* **Pessimistic Locking**: Prevents race conditions during high-volume social interactions (likes/dislikes) using row-level database locks.

### 📁 Media & Asset Management
* **Cloud-Native Storage**: Integrated with **Cloudinary** for transactional media uploads with automatic cleanup rollbacks on database failures.
* **Relational Mapping**: Efficiently maps media attachments to users and posts using optimized batch-loading patterns.

### 🔍 Search & Discovery
* **Advanced Filtering**: Complex QueryBuilder implementation allowing for fuzzy text search, date-range filtering, and status-based content visibility.
* **SEO Optimization**: Automatic generation of unique, URL-friendly slugs for every post and category.


## 3. Role-Based Access Control (RBAC)

The platform implements a hierarchical permission system to ensure data security and operational integrity. Access is managed via a combination of `AuthGuard` for identity verification and `RolesGuard` for permission enforcement.



### 👥 Role Definitions

#### 📖 Reader (Standard User)
The default role for registered participants, focused on content consumption and community engagement.
* **Content Access**: View all posts with a `PUBLISHED` status.
* **Engagement**: Submit top-level comments and nested replies to active discussions.
* **Interactions**: Perform atomic reactions (Like/Dislike) on both posts and comments.

#### ✍️ Author
Designed for content creators. Authors have full autonomy over their intellectual property within their private workspace.
* **Lifecycle Management**: Create, update, and soft-delete personal posts.
* **Publishing**: Manually toggle the visibility of their own content (`Draft` ↔ `Published`).
* **Inheritance**: Includes all permissions assigned to the **Reader** role.

#### ⚖️ Editor
Acts as a quality assurance and moderation tier. Editors facilitate platform-wide content curation.
* **Global Visibility**: Review drafts and published content across all authors.
* **Content Control**: Empowered to `Publish` or `Unpublish` any post on the platform to maintain editorial standards.
* **Inheritance**: Includes all permissions assigned to the **Author** role.

#### 🔑 Administrator
The highest privilege tier, responsible for system health, user safety, and high-level oversight.
* **System Management**: Full CRUD access to all system resources, including Categories and Global Settings.
* **User Oversight**: Access to the Admin Dashboard to search, audit, and manage all user accounts and their associated media.
* **Moderation**: Final authority to delete any post, comment, or category to enforce platform policy.
* **Inheritance**: Includes all permissions assigned to the **Editor** role.

---

## 📦 Dependency Ecosystem & Infrastructure

The application leverages a curated selection of production-grade libraries to handle core logic, cloud integrations, and system security.

### 🚀 Core Framework & NestJS Suite
The backbone of the modular architecture, providing dependency injection, routing, and lifecycle management.

* **`@nestjs/common` & `@nestjs/core`**: The essential building blocks of the NestJS framework.
* **`@nestjs/platform-express`**: Configures Express as the underlying HTTP server.
* **`reflect-metadata`**: Enables the use of decorators for metadata reflection, crucial for NestJS dependency injection.
* **`rxjs`**: Handles asynchronous data streams and reactive programming patterns used throughout the framework.

### 🗄️ Database & Persistence
A "Database-First" approach is maintained using these tools to ensure data integrity and complex relational mapping.



* **`typeorm` & `@nestjs/typeorm`**: An advanced ORM that bridges TypeScript classes and SQL tables.
* **`pg`**: The non-blocking PostgreSQL client for Node.js, optimized for high-performance database interactions.
* **`slugify`**: Automatically transforms post and category titles into SEO-friendly, URL-safe strings.

### 🔐 Security, Identity & Authentication
Ensures that user data is protected and access is strictly controlled via stateless mechanisms.

* **`jsonwebtoken`**: Generates and verifies JWTs for secure, stateless session management.
* **`bcrypt`**: A robust library for high-entropy salting and hashing of user passwords.
* **`cookie-parser`**: Parses `Cookie` headers to enable the use of **Secure, HTTP-only** cookies, mitigating XSS risks.
* **`@nestjs/throttler`**: Protects endpoints from brute-force attacks via sophisticated rate-limiting.

### 📁 File Management & Cloud Services
Handles the complexities of multipart data and external cloud storage synchronization.

* **`cloudinary`**: The official SDK for interacting with Cloudinary’s media management platform for image hosting and optimization.
* **`multer`**: Middleware for handling `multipart/form-data`, essential for file upload processing.



### 🧪 Validation & Serialization
Ensures that all data entering and leaving the system is sanitized and follows strict schemas.

* **`class-validator`**: Provides decorator-based validation for DTOs (e.g., `@IsEmail`, `@IsNotEmpty`).
* **`class-transformer`**: Handles the transformation of plain objects to class instances, allowing for the exclusion of sensitive fields like passwords from API responses.

### ⚡ Performance, Tasks & Monitoring
Optimizes system performance and provides real-time visibility into application health.

* **`ioredis`**: A high-performance Redis client used for caching high-frequency read operations.
* **`bullmq` & `@nestjs/bullmq`**: Manages distributed message queues for background jobs (e.g., email dispatch).
* **`@sentry/node`**: Real-time error tracking and performance monitoring for production environments.
* **`winston`**: A multi-transport logging library for structured, searchable application logs.

### ✉️ Communication & AI Integration
* **`@nestjs-modules/mailer` & `nodemailer`**: A complete solution for sending transactional emails (Welcome, Password Reset).
* **`@google/genai`**: Integration for Google’s Generative AI (Gemini) models to support automated content assistance features.

### 🛠️ Utilities
* **`@thi.ng/ksuid`**: Generates K-Sortable Unique Identifiers—collision-resistant IDs that remain naturally sorted by timestamp.
* **`http-status-codes`**: Provides human-readable constants for HTTP response codes to ensure code clarity.
* **`dotenv`**: Manages environment variables across different deployment stages.

---

## 3. Application Architecture

The system follows a **Modular Monolith** pattern, where each domain is encapsulated within its own NestJS module. This ensures high cohesion and low coupling, making the codebase easier to scale and test.



### 🏗️ Domain Modules
* **AuthModule**: Orchestrates identity verification, JWT issuance, and secure session management.
* **UsersModule**: Manages user profiles, account metadata, and role assignments.
* **PostsModule**: The core content engine handling the lifecycle of blog posts (Draft/Published) and SEO slug generation.
* **CommentsModule**: Manages hierarchical discussion threads and nested replies using an adjacency list model.
* **ReactionsModule**: Handles atomic sentiment tracking (Likes/Dislikes) with pessimistic locking for data integrity.
* **CategoryModule**: Provides a structured taxonomy for content organization and discovery.
* **AttachmentsModule**: Manages cloud-native file uploads and metadata persistence for media assets.
* **AdminModule**: A privileged layer providing real-time system oversight and moderation tools.

---

## 4. Identity & Access Management (IAM)

The platform utilizes a **Stateless JWT Authentication** strategy, shifting session state from the server memory to the client while maintaining a high security posture through a **Sliding Session** window.



### 🔐 Security & Session Strategy

#### 1. Dual-Token System
* **Access Token**: Short-lived JWT used for immediate authorization.
* **Refresh Token**: Long-lived token used to generate new access tokens without requiring user re-authentication, enabling a seamless "sliding session."

#### 2. Production-Grade Cookie Policy
To mitigate **XSS (Cross-Site Scripting)** and **CSRF (Cross-Site Request Forgery)**, tokens are never stored in `localStorage`. Instead, they are delivered via:
* **`HttpOnly`**: Prevents JavaScript from accessing the cookie.
* **`Secure`**: Ensures the cookie is only transmitted over encrypted (HTTPS) connections.
* **`SameSite: Strict`**: Restricts the cookie to the site's own context, blocking cross-site leakage.

#### 3. Role-Based Access Control (RBAC)
Authorization is enforced via NestJS **Guards**. Every request is evaluated against the user's role metadata stored in the JWT payload:
* **Identity Verification**: Handled by `AuthGuard`.
* **Permission Enforcement**: Handled by `RolesGuard`, which compares the user's role against the `@Roles()` decorator on the target endpoint.

#### 4. Cryptographic Integrity
* **Passwords**: Hashed using **Bcrypt** with a high cost-factor salt to protect against brute-force and rainbow table attacks.
* **Payloads**: JWTs are digitally signed using a `HS256` or `RS256` algorithm, ensuring the token payload cannot be tampered with by the client.



### 🏗️ Authentication Architecture
1.  **Identity Creation**: Users register via the `POST /auth/register` endpoint. A database transaction ensures user creation and profile image attachment are atomic.
2.  **Verification**: An automated email is dispatched via a Redis-backed queue. Users must verify their email before gaining system access to ensure high-quality data.
3.  **Token Issuance**: Upon login, the server issues two distinct JSON Web Tokens:
    * **Access Token**: Short-lived (1h) for authorizing immediate requests.
    * **Refresh Token**: Long-lived (24h) stored with a restricted path for enhanced security.
4.  **Session Security**: Both tokens are delivered via `Set-Cookie` headers with `HttpOnly`, `Secure`, and `SameSite: Strict` flags.

---

### 🔑 Auth Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | **Account Creation**: Validates credentials and processes profile image uploads. Triggers the email verification workflow via `EmailQueue`. |
| `POST` | `/auth/login` | **Session Initiation**: Validates credentials and injects secure JWT cookies into the browser. |
| `POST` | `/auth/refresh` | **Token Rotation**: Exchanges a valid Refresh Token for a new Access Token without requiring user re-login. |
| `GET` | `/auth/me` | **Profile Retrieval**: Fetches the authenticated user's details. Utilizes a **Redis Cache-Aside** pattern for sub-millisecond response times. |
| `PATCH` | `/auth/` | **Profile Update**: Allows modification of name or email. If the email is changed, the account status is reset to "Unverified" and a new token is sent. |
| `GET` | `/auth/verify-email` | **Identity Verification**: Finalizes the registration process via a unique token-based link sent to the user's inbox. |
| `POST` | `/auth/resend-verification` | **Verification Recovery**: Re-queues a verification email for users who did not receive their initial token. |
| `POST` | `/auth/logout` | **Session Termination**: Flushes all authentication cookies and effectively destroys the client-side session. |

---

### 🛡️ Security & Cookie Strategy

We utilize a hardened cookie configuration to prevent common web vulnerabilities.

// Production-Grade Cookie Policy
{
  httpOnly: true,     // Prevents JavaScript access (Mitigates XSS)
  secure: true,       // Restricts cookies to HTTPS-only (Production)
  sameSite: "strict", // Prevents cookies from being sent on cross-site requests (Mitigates CSRF)
  path: "/",          // Scope of the cookie
}


---

## 5. Users Module

The Users module serves as the core identity provider for the system. It leverages **TypeORM** for data persistence and **Bcrypt** for secure credential hashing, ensuring that sensitive data is never exposed or compromised.



### 🏗️ User Entity Schema
The entity is designed with performance and security in mind, featuring database-level indexing and automated exclusion of sensitive fields.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier prefixed with `u_`. |
| `name` | `string` | User's full name (Indexed for search performance). |
| `email` | `string` | Unique, indexed email address used for authentication. |
| `password` | `string` | **Bcrypt** hashed credential. Decorated with `@Exclude()` to prevent accidental API exposure. |
| `role` | `enum` | Determines system permissions: `READER`, `AUTHOR`, `EDITOR`, `ADMIN`. |
| `isEmailVerified`| `boolean` | Flag indicating if the user has completed the email verification flow. |
| `emailVerifiedAt`| `Date` | Precision timestamp for when the account was activated. |
| `createdAt` | `Date` | Immutable timestamp of account registration. |

---

### 🛡️ Security & Privacy
* **Password Hashing**: We utilize a salt factor of `10` with Bcrypt. Hashing is performed via the `setPassword` method before the entity is persisted to the database.
* **Data Masking**: The `password` field is automatically stripped from all JSON responses using the `class-transformer` library, ensuring that even if a developer forgets to filter data, the hash remains hidden.
* **Indexing**: Critical lookup fields (`email`, `name`) are indexed at the database level to ensure $O(1)$ or $O(\log n)$ lookup times, even as the user base grows.

---

### 🚦 Role Management & Permissions
We follow the **Principle of Least Privilege (PoLP)**. Users are granted the minimum level of access required for their role.

#### Hierarchy & Defaults
* **Default Role**: Every new registration is assigned the `READER` role by default.
* **Role Escalation**: Role updates are strictly restricted. Only a verified `ADMIN` can modify a user's role via a protected administrative endpoint.

#### Permission Matrix
| Action | Reader | Author | Editor | Admin |
| :--- | :---: | :---: | :---: | :---: |
| View Own Profile | ✅ | ✅ | ✅ | ✅ |
| Update Own Profile | ✅ | ✅ | ✅ | ✅ |
| Upload Profile Image | ✅ | ✅ | ✅ | ✅ |
| View Other Users | ❌ | ❌ | ❌ | ✅ |
| Delete Users | ❌ | ❌ | ❌ | ✅ |
| Change User Roles | ❌ | ❌ | ❌ | ✅ |

---

### ⚙️ Logic Hooks
The `UserEntity` includes built-in methods to encapsulate business logic:
* `setPassword()`: Handles the asynchronous hashing of plain-text passwords.
* `isPasswordCorrect()`: A secure utility to compare incoming login credentials against the stored hash.

---
## 6. Posts & Content Management

The Posts module is a high-performance content engine featuring a multi-stage publishing workflow, automated URL slug generation, and a sophisticated role-based visibility layer.



### 📝 Post Entity Schema
Built for discovery and engagement, the Post entity tracks metrics and supports rich-media attachments.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier prefixed with `p_`. |
| `title` | `string` | The headline of the post (Indexed). |
| `slug` | `string` | URL-friendly unique identifier generated from the title. |
| `content` | `string` | The main body text/markdown of the post. |
| `status` | `enum` | `DRAFT` or `PUBLISHED`. Defaults to `DRAFT`. |
| `authorId` | `string` | Relation to the `UserEntity` (Cascade on delete). |
| `viewCount` | `number` | Total unique views accumulated. |
| `publishedAt`| `Date` | Precision timestamp set only when status transitions to `PUBLISHED`. |

---

### 🔑 Post Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/posts` | **Create Content**: Saves a new draft and processes multiple media attachments (Images/PDFs). Restricted to `ADMIN` and `AUTHOR`. |
| `GET` | `/posts` | **Discovery Engine**: Fetches a paginated list of posts. Visibility is automatically filtered based on the requester's role. |
| `GET` | `/posts/my` | **Author Workspace**: Returns a paginated list of posts owned by the authenticated user. |
| `GET` | `/posts/:id` | **Direct Lookup**: Retrieves a full post object including attachments and categories by its ID. |
| `GET` | `/posts/slug/:slug` | **Public Fetch**: Retrieves a post via its URL-friendly slug. Optimized with Redis caching. |
| `PATCH` | `/posts/:id` | **Update**: Modifies content or categories. Regenerates slugs if the title changes. |
| `PATCH` | `/posts/:id/publish`| **Go Live**: Transitions status to `PUBLISHED` and sets the timestamp. |
| `DELETE` | `/posts/:id` | **Soft Removal**: Marks a post as deleted without removing it from the database immediately. |

---

### 🚦 Advanced Visibility Logic
The `PostService` implements a complex filtering matrix within the `applyPostVisibilityFilters` method to ensure content privacy:

* **Readers**: Can *only* see posts where `status = PUBLISHED`.
* **Authors**: Can see all `PUBLISHED` content + their own `DRAFT` posts.
* **Editors / Admins**: Have "God-mode" visibility; can see all content regardless of author or status.



---

### 🛠️ Technical Highlights

#### 1. Transactional Integrity
Post creation is wrapped in a **Database Transaction**. This ensures that if the Category assignment or the S3/File attachment upload fails, the Post record is never created, preventing "ghost" data.

#### 2. Performance: Cache-Aside Pattern
We utilize **Redis** to store query results.
* **Key Generation**: Cache keys are dynamically generated based on query parameters (search, page, limit, status).
* **Smart Invalidation**: Whenever a post is updated, published, or deleted, the system automatically purges the specific post cache and all related list caches using pattern matching (`posts:*`).

#### 3. SEO-Optimized Slugs
Utilizes a dedicated `SlugService` to transform titles (e.g., "Hello World!") into URL-friendly strings (`hello-world`). This is critical for SEO and user-friendly sharing.

#### 4. Media Interceptors
Leverages NestJS `FilesInterceptor` with custom `multerMemoryOptions` to handle multi-file uploads directly in the creation flow, mapping them to the `AttachmentEntity`.

---
---

## 7. Categories & Taxonomy

The Categories module provides a structured classification system for content. It is designed as an administrative-first tool, ensuring that taxonomies remain clean, unique, and optimized for SEO.

### 🏷️ Category Entity Schema
Categories use a lightweight schema optimized for high-frequency lookups during post-filtering.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier prefixed with `c_`. |
| `name` | `string` | Human-readable name (Unique & Indexed). |
| `slug` | `string` | URL-friendly identifier for clean routing (Unique & Indexed). |
| `description`| `string` | Contextual information about the classification. |
| `createdAt` | `Date` | Timestamp of category initialization. |

## 7. Categories & Taxonomy

The Categories module provides a structured classification system for content. It is designed as an administrative-first tool, ensuring that taxonomies remain clean, unique, and optimized for SEO.

### 🏷️ Category Entity Schema
Categories use a lightweight schema optimized for high-frequency lookups during post-filtering.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier prefixed with `c_`. |
| `name` | `string` | Human-readable name (Unique & Indexed). |
| `slug` | `string` | URL-friendly identifier for clean routing (Unique & Indexed). |
| `description`| `string` | Contextual information about the classification. |
| `createdAt` | `Date` | Timestamp of category initialization. |

---

### 🔑 Category Endpoints

> **Access Control**: All write operations (`POST`, `PATCH`, `DELETE`) are strictly restricted to users with the **ADMIN** role.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/categories` | **Define Taxonomy**: Creates a new category. Automatically generates a slug and validates name uniqueness. |
| `GET` | `/categories` | **List All**: Retrieves a paginated list of categories. Supports `ILIKE` search and date-range filtering. |
| `GET` | `/categories/:id` | **Specific Lookup**: Fetches detailed metadata for a single category via its unique ID. |
| `PATCH` | `/categories/:id` | **Modify**: Updates description or name. Regenerating the slug if the name is modified. |
| `DELETE` | `/categories/:id` | **Soft Delete**: Removes the category from active use while preserving relational integrity. |

---

### 🛠️ Technical Implementation Details

#### 1. Smart Slug Generation
The module utilizes the `SlugService` to ensure that every category has a URL-safe representative. 
* **Collision Prevention**: The service validates uniqueness before saving.
* **Auto-Update**: If an admin updates a category name, the slug is automatically recalculated to maintain SEO consistency.

#### 2. Advanced Redis Invalidation Pattern
To ensure the high performance of public-facing post feeds, categories are heavily cached.
* **Granular Cache**: Specific categories are cached by ID (`cat:u_...`).
* **Pattern Purging**: When any category is modified or deleted, the system uses `redisService.deleteByPattern` to flush all paginated category lists. This ensures that stale search results or pagination counts never persist.



#### 3. Administrative Protection
This module serves as a primary example of our **RBAC (Role-Based Access Control)** implementation. 
* Uses `@Roles(UserRole.ADMIN)` at the controller level.
* Combines `AuthGuard` and `RolesGuard` to ensure that identity is verified before permissions are checked.

#### 4. Filterable Search Engine
The `getCategories` method utilizes a TypeORM `QueryBuilder` to allow for:
* **Fuzzy Search**: `ILIKE` filtering on both the name and description fields.
* **Temporal Filtering**: `fromDate` and `toDate` parameters to track taxonomy growth over time.

---

---

## 8. Social Interactions & Reactions

The Reactions module manages user engagement through a sophisticated, transactional Like/Dislike system. It is engineered to maintain 100% data integrity in high-traffic environments where multiple users may react to the same content simultaneously.



### 📊 Reaction Entity Schema
The system utilizes a polymorphic-style approach to handle reactions for both Posts and Comments within a single table, enforced by strict database-level unique constraints.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier prefixed with `r_`. |
| `isLiked` | `boolean` | `true` for Like, `false` for Dislike. |
| `post` | `relation` | Reference to the `PostEntity` (nullable, Cascade Delete). |
| `comment` | `relation` | Reference to the `CommentEntity` (nullable, Cascade Delete). |
| `reactedBy` | `relation` | Reference to the `UserEntity` who performed the action. |

---

### 🔑 Interaction Endpoints

All interaction endpoints function as **Toggles**. The service intelligently detects the current state and determines whether to create, remove, or switch the reaction.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/reaction/:id/like-post` | **Toggle Like**: Increments post like-count and manages the reaction record. |
| `POST` | `/reaction/:id/dislike-post`| **Toggle Dislike**: Decrements post sentiment and manages the reaction state. |
| `POST` | `/reaction/:id/like-comment`| **Comment Engagement**: Apply/Toggle a Like on a specific comment. |
| `POST` | `/reaction/:id/dislike-comment`| **Comment Engagement**: Apply/Toggle a Dislike on a specific comment. |
| `GET` | `/reaction/liked-posts` | **User Activity**: Paginated list of all published posts liked by the current user. |
| `GET` | `/reaction/disliked-posts` | **User Activity**: Paginated list of all published posts disliked by the current user. |

---

### 🛠️ Technical Implementation Details

#### 1. Concurrency Control (Pessimistic Locking)
To prevent the "Lost Update" problem (where simultaneous clicks result in incorrect counts), the service utilizes `pessimistic_write` locks during the transaction:
* The database locks the specific row of the `Post` or `Comment` being reacted to.
* Subsequent requests for that same ID are queued until the first transaction commits, ensuring aggregate counters are always accurate.



#### 2. Atomic State Transitions
The logic handles three distinct transition states within a single ACID transaction:
* **Creation**: New reaction record added → Global Counter `+1`.
* **Removal (Un-reacting)**: Existing reaction soft-deleted → Global Counter `-1`.
* **Switching**: Reaction updated (Like ↔ Dislike) → Previous Counter `-1` AND New Counter `+1`.

#### 3. Data Integrity & Constraints
We enforce integrity at the hardware level using composite unique keys:
* `uq_reaction_user_post`: Ensures a user can only have one active reaction per post.
* `uq_reaction_user_comment`: Ensures a user can only have one active reaction per comment.

#### 4. Smart Content Filtering
The retrieval methods (`getLikedPosts`) perform a join with the `PostEntity` to verify `PostStatus.PUBLISHED`. This prevents draft or private content from appearing in a user's public-facing "Liked" list.

---


## 9. Comments & Discussion Threads

The Comments module enables community engagement through a robust, hierarchical discussion system. It supports top-level commentary and nested replies using a self-referencing adjacency list model.



### 💬 Comment Entity Schema
Designed for deep conversations, the entity tracks its position within a thread and maintains independent engagement metrics.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier prefixed with `c_`. |
| `content` | `string` | The text content of the comment. |
| `likes` | `number` | Aggregate count of positive reactions. |
| `dislikes` | `number` | Aggregate count of negative reactions. |
| `author` | `relation` | Reference to the `UserEntity` (Author). |
| `post` | `relation` | The `PostEntity` the comment belongs to. |
| `parentComment`| `relation` | Self-reference to a parent `CommentEntity` for nested replies. |

---

### 🔑 Comment Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/comments` | **New Discussion**: Creates a top-level comment on a specific post. |
| `POST` | `/comments/reply` | **Threaded Reply**: Creates a nested comment linked to a parent comment. |
| `GET` | `/comments/post/:id`| **Feed Fetch**: Retrieves a paginated list of comments for a post. Uses Redis caching. |
| `GET` | `/comments/:id` | **Detail View**: Fetches a single comment with author and post relations. |
| `PATCH` | `/comments/:id` | **Edit**: Allows authors to modify their content. |
| `DELETE` | `/comments/:id` | **Remove**: Soft-deletes a comment. Accessible by author, Editor, or Admin. |

---

### 🛠️ Technical Implementation Details

#### 1. Hierarchical Data Modeling (Adjacency List)
The system implements threading via a self-referencing `ManyToOne` relationship within the `CommentEntity`.
* **Root Comments**: Have a `parentComment` set to `null`.
* **Replies**: Store the ID of the comment they are responding to.
* **Integrity**: Deleting a post or a parent comment triggers a `CASCADE` delete to maintain database hygiene.

#### 2. Authoritative Security
Ownership is strictly enforced in the `updateComment` and `deleteComment` methods:
* **Update**: Only the original author can modify a comment's content.
* **Delete**: A "Hierarchical Permission" model is used. The author can delete their own comment, but **Admins** and **Editors** also have the authority to moderate and remove any content.

#### 3. High-Frequency Cache Strategy
Because comment sections often receive the most traffic, we implement a **Short-TTL Cache-Aside** pattern:
* **TTL**: Results are cached in Redis for 2 minutes (`TWO_MIN_IN_SEC`).
* **Key Scoping**: Cache keys are specific to the `postId`, `page`, and `limit`.
* **Invalidation**: Any new comment or reply triggers a `deleteByPattern` on the Redis store, flushing all paginated lists associated with that content to ensure real-time visibility for users.

#### 4. Post-Target Validation
Before a comment or reply is persisted, the `CommentsService` invokes the `PostService` to verify the target post exists and is active. This prevents "orphan" comments from being submitted to non-existent or deleted content.

---

## 10. Media & Attachment System

The Attachment module provides a centralized service for managing cloud-hosted assets. It acts as a bridge between the application's relational data and **Cloudinary** storage, ensuring that file metadata is persisted only when the physical upload is successful.



### 📁 Attachment Entity Schema
The system stores metadata and references (Public IDs) rather than raw binary data, keeping the database lightweight and performant.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier prefixed with `a_`. |
| `path` | `string` | The Cloudinary `public_id` used to generate delivery URLs. |
| `mimeType` | `string` | The file format (e.g., `image/jpeg`, `video/mp4`). |
| `size` | `number` | File size in bytes. |
| `entityType`| `enum` | Categorizes the owner: `USER`, `POST`, or `COMMENT`. |
| `externalId`| `string` | The UUID of the parent entity this file belongs to. |
| `originalName`| `string` | The original filename for user reference. |

---

### 🛠️ Technical Implementation Details

#### 1. Atomic Transaction Handling
To prevent "Orphan Files" (files that exist in the cloud but have no database record), the `AttachmentService` implements a strict try-catch rollback logic:
* **The Flow**: Upload to Cloudinary → Attempt DB Save.
* **The Rollback**: If the database save fails (e.g., due to a constraint error), the service immediately triggers a `deleteFromCloudinary` call for the `public_id` it just created.
* **Batch Support**: In `createAttachments`, if any single file in a batch fails to sync with the database, the entire batch of uploaded files is purged from the cloud to maintain 1:1 consistency.



#### 2. Optimized Batch Retrieval (The Map Pattern)
Instead of executing $N$ queries for $N$ posts (the $N+1$ problem), the `getAttachmentsByEntityIds` method:
1. Collects all relevant `externalIds`.
2. Performs a single `IN` query to fetch all attachments.
3. Groups the results into a `Record<string, AttachmentEntity[]>` for $O(1)$ lookup speed during the response transformation phase.

#### 3. Transaction Manager Integration
The service is designed to be "Transaction Aware." It can accept an optional `EntityManager`. This allows other services (like `PostService`) to wrap both the Post creation and the File metadata creation into a single database transaction while the `AttachmentService` handles the external cloud logic.

#### 4. Cloudinary Integration
Leverages the `CloudinaryService` for:
* **Storage**: Securely storing raw files.
* **Cleanup**: Deleting assets when parent entities are removed.
* **Resource Management**: Tracking `bytes` and `resource_type` returned by the provider for accurate metadata.

---

### 🚦 Usage Example

// Example: Attaching multiple files to a post within a transaction
await this.attachmentService.createAttachments(
  files, 
  post.id, 
  EntityType.POST, 
  manager // TypeORM Transaction Manager
);


## 11. Administrative Oversight

The Admin module provides a privileged interface for system-level management and user auditing. It is architected to bypass standard application-tier caching, providing administrators with "Source of Truth" data retrieval for critical decision-making and moderation.

### 🔑 Administrative Endpoints

> **Access Control**: These endpoints are strictly protected. Requests must pass through `AuthGuard` for identity verification and `RolesGuard` to confirm the user possesses the `UserRole.ADMIN` role.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/admin/users` | **User Directory**: A real-time, paginated list of all users. Supports fuzzy search (Name/Email), Role filtering, and Date-range auditing. |
| `GET` | `/admin/users/:id` | **Full Profile Audit**: Retrieves detailed user information including metadata and all associated cloud attachments. |

---

### 🛠️ Technical Implementation Details

#### 1. Real-Time Data Integrity (Cache Bypass)
Unlike public-facing services (e.g., Categories or Posts), the `AdminService` queries the database directly using TypeORM's `QueryBuilder`. 

* **Zero Latency on State**: Ensures that if a user’s status or role is modified, administrators see the change immediately.
* **Security Auditing**: Eliminates the risk of viewing stale or cached data during a moderation task or security sweep.



#### 2. Advanced Query Orchestration
The `getUsers` method handles complex multi-dimensional filtering to help manage large user bases effectively:

* **Fuzzy Search**: Implements `ILIKE` logic across both `user.name` and `user.email` simultaneously.
* **Temporal Filtering**: Allows for precise auditing of user registration growth using `fromDate` and `toDate` parameters.
* **Role-Based Isolation**: Enables administrators to quickly isolate specific user tiers (e.g., viewing only accounts with the `EDITOR` role).

#### 3. Optimized Batch Attachment Mapping
Administrators often need to see user-associated media (e.g., profile avatars or verification files). To prevent the **N+1 query problem**, the service uses a Batch-Mapping pattern:

1. A single query retrieves the requested page of `UserEntities`.
2. All `userIds` are extracted and passed to the `AttachmentService`.
3. A single batch query fetches all attachments for those IDs in one go.
4. The service maps these attachments into a local object map for $O(1)$ lookup speed when assembling the final response.



#### 4. Data Privacy & REST Standards
* **Sensitive Field Exclusion**: The `getUserById` method explicitly uses TypeORM selection to ensure the `password` hash is excluded (via `{ password: false }`), preventing credential leaks in admin views.
* **RESTful Routing**: The controller implements standard REST conventions, ensuring predictable URL structures for administrative frontends (e.g., `GET /admin/users/:id`).

## 12. Global Error Handling & Monitoring

The system implements a centralized exception handling strategy using NestJS Filters. This ensures that the API remains resilient, leaks no sensitive stack traces, and provides real-time alerts for critical failures.



### 🛡️ Main Exception Filter
The `MainExceptionFilter` acts as the final safety net for every request. It categorizes errors into two distinct flows: **Safe Client Errors** and **Critical Internal Errors**.

| Error Type | Status Codes | Action Taken |
| :--- | :--- | :--- |
| **Safe (Client)** | 400, 401, 403, 404, 409, 429 | Direct pass-through of the error message to the client. |
| **Critical (Server)**| 500, 503, etc. | Logged via Winston, reported to Sentry, and sanitized for the user. |

---

### 🛠️ Technical Implementation Details

#### 1. Security & Data Sanitization
To prevent **Information Exposure**, any error that falls outside the "Safe" list (like database connection strings or raw TypeORM errors) is intercepted. 
* The filter suppresses the original error.
* It returns a generic `ERROR_MESSAGES.INTERNAL_SERVER_ERROR`.
* The full stack trace is preserved only in secure logs and Sentry.

#### 2. Sentry Integration
The filter integrates with **Sentry** using `@sentry/node`. 
* **Selective Reporting**: To avoid "noise," client-side errors (like a user entering the wrong password) are ignored by Sentry.
* **Contextual Data**: Critical errors are uploaded with the status code and original message to assist in rapid debugging.



#### 3. Standardized API Response Structure
The backend utilizes `responseUtils` and `HttpAdapterHost` to ensure that whether a request succeeds or fails, the JSON structure remains predictable:

**Success Response Example:**
```json
{
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... }
}




