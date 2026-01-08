import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { UserEntity } from "./users.entity";
import { AuthHelperModule } from "../auth/auth.module";
import { AuthGuard } from "src/guards/auth-guard";
import { RolesGuard } from "src/guards/role-guard";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), AuthHelperModule],
  controllers: [UsersController],
  providers: [UsersService, AuthGuard, RolesGuard],
  exports: [UsersService],
})
export class UsersModule {}
