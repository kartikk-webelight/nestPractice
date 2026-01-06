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
  entities: ["dist/modules/**/*.entity.{js,ts}"],
  migrations: ["dist/migrations/*.{js,ts}"],
  subscribers: [],
  migrationsRun: true,
  migrationsTableName: "migrations",
  synchronize: false,
  ...(process.env["NODE_ENV"] === "local" && { logger: new CustomQueryLogger() }),
});
