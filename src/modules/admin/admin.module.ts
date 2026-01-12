import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthGuard } from "guards/auth-guard";
import { RolesGuard } from "guards/role-guard";

import { AuthModule } from "../auth/auth.module";
import { UserEntity } from "../users/users.entity";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), AuthModule],
  controllers: [AdminController],
  providers: [AdminService, AuthGuard, RolesGuard],
})
export class AdminModule {}
