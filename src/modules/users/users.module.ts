import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { UsersEntity } from "./users.entity";
import { AuthHelperModule } from "../auth/auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([UsersEntity]), AuthHelperModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
