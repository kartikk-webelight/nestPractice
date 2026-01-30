import { getOsEnv } from "./env.config";

export const secretConfig = {
  // Prefix: AUTH_
  authConfigs: {
    jwtSecretKey: getOsEnv("AUTH_JWT_SECRET_KEY"),
    accessSecretKey: getOsEnv("AUTH_ACCESS_SECRET_KEY"),
    refreshSecretKey: getOsEnv("AUTH_REFRESH_SECRET_KEY"),
    jwtExpirationTime: getOsEnv("AUTH_JWT_EXPIRATION_TIME"),
    refreshTokenExpiry: getOsEnv("AUTH_REFRESH_TOKEN_EXPIRY"),
    accessTokenExpiry: getOsEnv("AUTH_ACCESS_TOKEN_EXPIRY"),
    emailVerificationSecretKey: getOsEnv("AUTH_EMAIL_VERIFICATION_SECRET_KEY"),
    emailTokenExpiry: getOsEnv("AUTH_EMAIL_TOKEN_EXPIRY"),
    aesEncryptionKey: getOsEnv("AUTH_AES_ENCRYPTION_KEY"),
  },

  // SERVER
  serverConfigs: {
    baseUrl: getOsEnv("SERVER_BASE_URL"),
  },

  // Prefix: CLOUDINARY_
  cloudinaryConfigs: {
    cloudName: getOsEnv("CLOUDINARY_CLOUD_NAME"),
    apiKey: getOsEnv("CLOUDINARY_API_KEY"),
    apiSecret: getOsEnv("CLOUDINARY_API_SECRET"),
  },

  // Prefix: GEMINI_
  geminiConfigs: {
    apiKey: getOsEnv("GEMINI_API_KEY"),
  },

  // Prefix: EMAIL_
  emailConfigs: {
    senderEmail: getOsEnv("EMAIL_SENDER_EMAIL"),
    senderName: getOsEnv("EMAIL_SENDER_NAME"),
  },

  // Prefix: MAILTRAP_
  mailtrapConfigs: {
    apiKey: getOsEnv("MAILTRAP_API_KEY"),
    sandboxUsername: getOsEnv("MAILTRAP_SANDBOX_USERNAME"),
    sandboxPassword: getOsEnv("MAILTRAP_SANDBOX_PASSWORD"),
    host: getOsEnv("MAILTRAP_HOST"),
    port: getOsEnv("MAILTRAP_PORT"),
  },

  sonarConfigs: {
    token: getOsEnv("SONAR_TOKEN"),
  },
};
