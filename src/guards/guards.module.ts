import { Global, Module } from "@nestjs/common";
import { AuthHelperModule } from "../modules/auth/auth.module";
import { AuthGuard } from "./auth-guard";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersEntity } from "src/modules/users/users.entity";
import { RolesGuard } from "./role-guard";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UsersEntity]), AuthHelperModule],
  providers: [AuthGuard, RolesGuard],
  exports: [AuthGuard, RolesGuard],
})
export class GuardModule {}
