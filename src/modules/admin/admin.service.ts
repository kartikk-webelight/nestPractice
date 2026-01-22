import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AttachmentService } from "modules/attachment/attachment.service";
import { UserEntity } from "modules/users/users.entity";
import { ERROR_MESSAGES } from "constants/messages.constants";
import { EntityType, OrderBy } from "enums";
import { calculateOffset, calculateTotalPages } from "utils/helper";
import { GetUsersQuery } from "./admin.types";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly attachmentService: AttachmentService,
  ) {}

  async getUsers(query: GetUsersQuery) {
    const { page, limit, search, role, fromDate, toDate, order = OrderBy.DESC } = query;

    const qb = this.userRepository.createQueryBuilder("user");

    if (search) {
      qb.andWhere("user.name ILIKE :search OR user.email ILIKE :search", { search: `%${search}%` });
    }

    if (fromDate) {
      qb.andWhere("user.createdAt >=:fromDate", { fromDate });
    }

    if (toDate) {
      qb.andWhere("user.createdAt <=:toDate", { toDate });
    }

    if (role) {
      qb.andWhere("user.role = :role", { role });
    }

    qb.orderBy("user.createdAt", order);

    qb.skip(calculateOffset(page, limit)).take(limit);

    const [users, total] = await qb.getManyAndCount();

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
      totalPages: calculateTotalPages(total, limit),
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
