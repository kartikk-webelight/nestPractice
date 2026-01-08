import { DataSource } from "typeorm";
import { config } from "dotenv";
import { CustomQueryLogger } from "./database.custom-query-logger";

config();

export default new DataSource({
  type: "postgres",
  host: process.env["DATABASE_HOST"],
  port: +(process.env["DATABASE_PORT"] ?? 5432),
  username: process.env["DATABASE_USER"],
  password: process.env["DATABASE_PASSWORD"],
  database: process.env["DATABASE_NAME"],
  entities: ["src/modules/**/*.entity.ts", "dist/modules/**/*.entity.js"],
  migrations: ["dist/migrations/*.{js,ts}"],
  subscribers: [],
  migrationsRun: false,
  migrationsTableName: "migrations",
  synchronize: true,
  ...(process.env["NODE_ENV"] === "local" && { logger: new CustomQueryLogger() }),
});
