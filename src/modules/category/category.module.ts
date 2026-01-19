import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthHelperService } from "modules/auth/auth.helper.service";
import { UserEntity } from "modules/users/users.entity";
import { AuthGuard } from "guards/auth-guard";
import { RolesGuard } from "guards/role-guard";
import { SlugService } from "shared/slug.service";
import { CategoryController } from "./category.controller";
import { CategoryEntity } from "./category.entity";
import { CategoryService } from "./category.service";

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity, UserEntity])],
  controllers: [CategoryController],
  providers: [CategoryService, SlugService, AuthGuard, RolesGuard, AuthHelperService],
})
export class CategoryModule {}
