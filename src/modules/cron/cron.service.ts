import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, LessThan, ObjectLiteral, Repository, DataSource } from "typeorm";
import { AttachmentEntity } from "modules/attachment/attachment.entity";
import { CategoryEntity } from "modules/category/category.entity";
import { CommentEntity } from "modules/comments/comment.entity";
import { PostEntity } from "modules/post/post.entity";
import { ReactionEntity } from "modules/reaction/reaction.entity";
import { RoleEntity } from "modules/role/role.entity";
import { UserEntity } from "modules/users/users.entity";
import { logger } from "services/logger.service";
import { CloudinaryService } from "shared/cloudinary/cloudinary.service";
import { thirtyDaysAgo } from "utils/helper";

@Injectable()
export class CronService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectRepository(ReactionEntity)
    private readonly reactionRepository: Repository<ReactionEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,

    private readonly cloudinaryService: CloudinaryService,

    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_WEEK)
  async handleGlobalCleanup(): Promise<void> {
    logger.info("Starting weekly database purge...");

    try {
      const cutoffDate = thirtyDaysAgo();
      // 1. Children first: Attachments, Reactions, Comments
      // These usually don't depend on each other, so we can run them together
      await Promise.all([
        this.handleAttachmentCleanup(cutoffDate),
        this.handleEntityCleanup(this.reactionRepository, cutoffDate),
        this.handleEntityCleanup(this.commentRepository, cutoffDate),
      ]);

      // 2. Mid-level: Posts
      // Posts can only be deleted once Comments and Reactions are gone
      await this.handleEntityCleanup(this.postRepository, cutoffDate);

      // 3. Parents last: Users, Roles, Categories
      // Users can only be deleted once their Posts are gone
      await Promise.all([
        this.handleEntityCleanup(this.categoryRepository, cutoffDate),
        this.handleEntityCleanup(this.roleRepository, cutoffDate),
        this.handleEntityCleanup(this.userRepository, cutoffDate),
      ]);

      logger.info("Weekly database purge completed successfully.");
    } catch (error) {
      logger.error("Global cleanup failed: %s", error.message);
    }
  }

  async handleEntityCleanup<T extends ObjectLiteral>(repository: Repository<T>, cutoffDate: Date): Promise<void> {
    await repository.createQueryBuilder().delete().where("deletedAt < :cutoffDate", { cutoffDate }).execute();
  }

  async handleAttachmentCleanup(cutoffDate: Date): Promise<void> {
    await this.dataSource.transaction(async (manager: EntityManager) => {
      const attachmentRepository = manager.getRepository(AttachmentEntity);

      // Note: We use find with { withDeleted: true } to see soft-deleted rows
      const attachments = await attachmentRepository.find({
        where: { deletedAt: LessThan(cutoffDate) },
        withDeleted: true,
      });

      if (attachments.length === 0) return;

      // Hard delete from DB
      await attachmentRepository.delete({ deletedAt: LessThan(cutoffDate) });

      // Clean up Cloudinary
      await Promise.allSettled(attachments.map((a) => this.cloudinaryService.deleteFromCloudinary(a.path)));
    });
  }
}
