import { getOsEnv } from "./env.config";

export const appConfig = {
  port: +(process.env.PORT || 3000),
  environment: getOsEnv("ENVIRONMENT"),
  sentryDsn: getOsEnv("SENTRY_DSN"),
  allowedOrigins: getOsEnv("ALLOWED_ORIGINS"),

  isLocal: getOsEnv("ENVIRONMENT") === "local",

  xApiKey: getOsEnv("X_API_KEY"),
};
