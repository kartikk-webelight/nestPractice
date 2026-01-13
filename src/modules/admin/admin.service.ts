import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ERROR_MESSAGES } from "constants/messages.constants";
import { Repository } from "typeorm";

import { UserEntity } from "modules/users/users.entity";
import { AttachmentService } from "modules/attachment/attachment.service";
import { EntityType } from "enums";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly attachmentService: AttachmentService,
  ) {}

  async getAllUsers(page: number, limit: number) {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    const userIds = users.map((user) => user.id);
    const attachmentMap = await this.attachmentService.getAttachmentsByEntityIds(userIds, EntityType.USER);
    const usersWithAttachment = users.map((user) => {
      return {
        ...user,
        attachment: attachmentMap[user.id] || [],
      };
    });

    return {
      data: usersWithAttachment,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const attachmentMap = await this.attachmentService.getAttachmentsByEntityIds([user.id], EntityType.USER);

    return {
      ...user,
      attachment: attachmentMap[user.id] || [],
    };
  }
}
