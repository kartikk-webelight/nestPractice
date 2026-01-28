import { getOsEnv } from "./env.config";

export const secretConfig = {
  jwtSecretKey: getOsEnv("JWT_SECRET_KEY"),
  accessSecretKey: getOsEnv("ACCESS_SECRET_KEY"),
  refreshSecretKey: getOsEnv("REFRESH_SECRET_KEY"),
  jwtExpirationTime: getOsEnv("JWT_EXPIRATION_TIME"),
  aesEncryptionKey: getOsEnv("AES_ENCRYPTION_KEY"),
  refreshTokenExpiry: getOsEnv("REFRESH_TOKEN_EXPIRY"),
  accessTokenExpiry: getOsEnv("ACCESS_TOKEN_EXPIRY"),
  cloudinaryCloudName: getOsEnv("CLOUDINARY_CLOUD_NAME"),
  cloudinaryApiKey: getOsEnv("CLOUDINARY_API_KEY"),
  cloudinaryApiSecret: getOsEnv("CLOUDINARY_API_SECRET"),
  geminiApiKey: getOsEnv("GEMINI_API_KEY"),
  senderEmail: getOsEnv("SENDER_EMAIL"),
  apiBaseUrl: getOsEnv("API_BASE_URL"),
  senderName: getOsEnv("SENDER_NAME"),
  emailVerificationSecretKey: getOsEnv("EMAIL_VERIFICATION_SECRET_KEY"),
  emailTokenExpiry: getOsEnv("EMAIL_TOKEN_EXPIRY"),

  // Mailtrap Configuration
  mailtrapConfigs: {
    apiKey: getOsEnv("MAILTRAP_API_KEY"),
    sandboxUsername: getOsEnv("MAILTRAP_SANDBOX_USERNAME"),
    sandboxPassword: getOsEnv("MAILTRAP_SANDBOX_PASSWORD"),
    host: getOsEnv("MAILTRAP_HOST"),
    port: getOsEnv("MAILTRAP_PORT"),
  },
};
