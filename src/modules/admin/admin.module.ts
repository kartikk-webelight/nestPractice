import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/users.entity';
import { AuthGuard } from 'src/guards/auth-guard';
import { RolesGuard } from 'src/guards/role-guard';
import { AuthHelperModule } from '../auth/auth.module';

@Module({
  imports:[TypeOrmModule.forFeature([UserEntity]), AuthHelperModule],
  controllers: [AdminController],
  providers: [AdminService, AuthGuard, RolesGuard, ],
})
export class AdminModule {}
