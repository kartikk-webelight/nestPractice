import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { getOsEnv } from "config/env.config";
import { appConfig } from "./app.config";
import { secretConfig } from "./secret.config";

const { isLocal } = appConfig;

export const databaseConfig: TypeOrmModuleOptions = {
  type: "postgres",
  host: getOsEnv("DATABASE_HOST"),
  port: +getOsEnv("DATABASE_PORT"),
  username: getOsEnv("DATABASE_USER"),
  password: getOsEnv("DATABASE_PASSWORD"),
  database: getOsEnv("DATABASE_NAME"),
  ssl: false,
  synchronize: true,
  migrations: isLocal ? ["src/migrations/*.ts"] : ["dist/migrations/*.js"],

  migrationsRun: !isLocal,
  logging: !isLocal,
  autoLoadEntities: true,
};
