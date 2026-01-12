import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserEntity } from "../users/users.entity";
import { AuthController } from "./auth.controller";
import { AuthHelperService } from "./auth.helper.service";
import { AuthService } from "./auth.service";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [AuthHelperService, AuthService],
  exports: [AuthHelperService],
  controllers: [AuthController],
})
export class AuthModule {}
