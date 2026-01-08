import { Module } from "@nestjs/common";
import { AuthHelperService } from "./auth.helper.service";
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "../users/users.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [AuthHelperService, AuthService,],
  exports: [AuthHelperService],
  controllers: [AuthController],
})
export class AuthHelperModule {}
