import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { databaseConfig } from "src/config/database.config";

@Module({
  imports: [TypeOrmModule.forRoot(databaseConfig)],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
