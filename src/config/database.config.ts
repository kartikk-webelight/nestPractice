import { TypeOrmModuleOptions } from "@nestjs/typeorm";

import { appConfig } from "./app.config";
import { getOsEnv } from "../config/env.config";

export const databaseConfig: TypeOrmModuleOptions = {
  type: "postgres",
  host: getOsEnv("DATABASE_HOST"),
  port: +getOsEnv("DATABASE_PORT"),
  username: getOsEnv("DATABASE_USER"),
  password: getOsEnv("DATABASE_PASSWORD"),
  database: getOsEnv("DATABASE_NAME"),
  ssl: false,
  synchronize: true,
  logging: appConfig.isLocal,
  autoLoadEntities: true,
};
