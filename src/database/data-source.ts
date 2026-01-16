import { DataSource } from "typeorm";

import { CustomQueryLogger } from "./database.custom-query-logger";
import { getOsEnv } from "config/env.config";

export default new DataSource({
  type: "postgres",
  host: getOsEnv("DATABASE_HOST"),
  port: +getOsEnv("DATABASE_PORT"),
  username: getOsEnv("DATABASE_USER"),
  password: getOsEnv("DATABASE_PASSWORD"),
  database: getOsEnv("DATABASE_NAME"),
  entities: ["src/modules/**/*.entity.ts", "dist/modules/**/*.entity.js"],
  migrations: ["dist/migrations/*.{js,ts}"],
  subscribers: [],
  migrationsRun: false,
  migrationsTableName: "migrations",
  synchronize: true,
  ...(getOsEnv('ENVIRONMENT') === "local" && { logger: new CustomQueryLogger() }),
});
