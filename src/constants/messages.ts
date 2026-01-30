export const SUCCESS_MESSAGES = {
  // --- General & CRUD ---
  SUCCESS: "Success",
  CREATED: "The record has been successfully created.",
  UPDATED: "The record has been successfully updated.",
  DELETED: "Record deleted successfully.",
  REFRESHED: "Data refreshed successfully.",

  // --- Authentication & Account ---
  USER_LOGGED_IN: "User logged in successfully",
  USER_LOGGED_OUT: "User logged out",
  TOKEN_REFRESHED: "Token refreshed successfully",
  ACCOUNT_VERIFIED: "Account has been successfully verified.",
  EMAIL_SENT: "Email sent successfully.",

  // --- Users Domain ---
  USER_FETCHED: "Users fetched successfully",
  ALL_USERS_FETCHED: "All users fetched successfully",

  // --- Posts Domain ---
  POST_FETCHED: "Post fetched successfully",
  ALL_POSTS_FETCHED: "All posts fetched successfully",

  // --- Comments Domain ---
  COMMENT_FETCHED: "Comment fetched successfully",
  ALL_COMMENTS_FETCHED: "All comments fetched successfully",

  // --- Categories Domain ---
  CATEGORY_FETCHED: "Category fetched successfully",
  ALL_CATEGORIES_FETCHED: "All Categories fetched successfully",

  // --- Role Requests ---
  ROLE_REQUESTED: "Role requested",
  ROLE_UPDATED: "Role updated",
  REQUEST_STATUS_FETCHED: "Request status fetched successfully",
  REQUESTS_FETCHED: "Requests fetched successfully",

  // --- File Storage ---
  FILE_UPLOADED: "File uploaded successfully.",
};

export const ERROR_MESSAGES = {
  // --- Global / System Errors ---
  INTERNAL_SERVER_ERROR: "Internal Server Error",
  NOT_FOUND: "Document not found",
  DUPLICATE_VALUE_NOT_ALLOWED: "Duplicate value not allowed in imported file.",

  // --- Authentication & Authorization ---
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Access denied: You do not have the required permissions.",
  INVALID_CREDENTIAL: "Invalid credentials",
  INVALID_ACCESS_TOKEN: "Invalid access token",
  INVALID_REFRESH_TOKEN: "Invalid refresh token",
  LINK_EXPIRED: "The link has expired or is invalid. Please try again.",

  // --- Email & Verification ---
  VERIFY_YOUR_EMAIL: "Please verify your email.",
  EMAIL_ALREADY_VERIFIED: "Email is already verified.",
  EMAIL_VERIFICATION_LINK_INVALID: "Email verification link invalid or expired.",
  EMAIL_VERIFICATION_FAILED: "Error occured while sending verification email.",
  INVALID_EMAIL: "Invalid email address.",

  // --- User Registration & Validation ---
  USER_ALREADY_EXISTS: "User with same email alrady exists.",
  ALREADY_EXISTS_ACCOUNT: "Account Already Exists.",
  USER_NOT_FOUND: "User not found.",
  PASSWORD_WEAK:
    "Password must contain 8 characters, one uppercase, one lowercase, one number and one special case character.",
  INVALID_CONTACT_NO: "Invalid contact number.",

  // --- Post & Comment Domain ---
  POST_NOT_FOUND: "Post not found.",
  COMMENT_NOT_FOUND: "Comment not found.",
  PREFIX_REQUIRED: "Prefix is required to create a slug.",

  // --- Category Domain ---
  INVALID_CATEGORY_ID: "Category id is invalid.",

  // --- Role Request Domain ---
  ROLE_ALREADY_ASSIGNED: "You already have this role.",
  ADMIN_ROLE_FORBIDDEN: "You cannot request admin role",
  PENDING_REQUEST_EXISTS: "You already have a pending role request.",
  REQUEST_ALREADY_REVIEWED: "Role request already reviewed.",
  SELF_APPROVE_FORBIDDEN: "You cannot approve your own request.",

  // --- Uploads & External Services ---
  CLOUDINARY_UPLOAD_FAILED: "cloudinary upload failed.",
  UPLOAD_FAILED_RETRY: "We encountered an issue saving your files. Please try again.",

  // --- Validation & Sorting ---
  INTEGER_EXPECTED: "Validation failed. Integer is expected.",
  POSITIVE_INTEGER_EXPECTED: "Validation failed. Value must be a positive integer.",
  INVALID_SORTING_FIELD: "Invalid sorting field",

  // --- Cookie & Session Errors ---
  USER_ID_NOT_FOUND_IN_COOKIES_ERROR: "User ID not found in cookies.",
  REQUIRED_COOKIE_NOT_FOUND: "Required cookie/s not found.",
  CATEGORY_ALREADY_EXISTS: "Category with same name already exists",
};
