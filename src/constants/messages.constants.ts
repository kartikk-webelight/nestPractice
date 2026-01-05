export const SUCCESS_MESSAGES = {
  SUCCESS: "Success",
  CREATED: "The record has been successfully created.",
  REFRESHED: "Data refreshed successfully.",
  EMAIL_SENT: "Email sent successfully.",
  ACCOUNT_VERIFIED: "Account has been successfully verified.",
  UPDATED: "The record has been successfully updated.",
  DELETED: "Record deleted successfully.",
  FILE_UPLOADED: "File uploaded successfully.",
};

export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Access denied: You do not have the required permissions.",
  ALREADY_EXISTS_ACCOUNT: "Account Already Exists.",
  INVALID_EMAIL: "Invalid email address.",
  INVALID_CONTACT_NO: "Invalid contact number.",
  PASSWORD_WEAK:
    "Password must contain 8 characters, one uppercase, one lowercase, one number and one special case character.",
  INTERNAL_SERVER_ERROR: "Internal Server Error",
  // below messages should only be used for admin
  INTEGER_EXPECTED: "Validation failed. Integer is expected.",
  POSITIVE_INTEGER_EXPECTED: "Validation failed. Value must be a positive integer.",
  USER_ID_NOT_FOUND_IN_COOKIES_ERROR: "User ID not found in cookies.",
  REQUIRED_COOKIE_NOT_FOUND: "Required cookie/s not found.",
  DUPLICATE_VALUE_NOT_ALLOWED: "Duplicate value not allowed in imported file.",
  LINK_EXPIRED: "The link has expired or is invalid. Please try again.",
};
