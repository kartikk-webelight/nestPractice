import { appConfig } from "src/config/app.config";

export const swaggerInfo = {
  title: "NEST Boilerplate Api Documentation",
  description: "Boilerplate of NEST project Api Documentation to test and review APIs",
};
export const globalPrefix = "api";
export const allowedOrigins = JSON.parse(appConfig.allowedOrigins);
