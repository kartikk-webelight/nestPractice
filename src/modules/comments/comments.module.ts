import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { UsersModule } from '../users/users.module';
import { PostModule } from '../post/post.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentEntity } from './comment.entity';
import { AuthGuard } from 'src/guards/auth-guard';
import { AuthHelperService } from '../auth/auth.helper.service';
import { RolesGuard } from 'src/guards/role-guard';

@Module({
  imports:[TypeOrmModule.forFeature([CommentEntity]),UsersModule, PostModule],
  controllers: [CommentsController],
  providers: [CommentsService, AuthGuard, AuthHelperService, RolesGuard],
})
export class CommentsModule {}
