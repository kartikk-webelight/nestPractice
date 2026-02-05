import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AttachmentService } from "modules/attachment/attachment.service";
import { UserEntity } from "modules/users/users.entity";
import { ERROR_MESSAGES } from "constants/messages";
import { UserResponse, UsersPaginationResponseDto } from "dto/common-response.dto";
import { EntityType, OrderBy } from "enums";
import { logger } from "services/logger.service";
import { calculateOffset, calculateTotalPages } from "utils/helper";
import { GetUsersQueryDto } from "./dto/admin.dto";

/**
 * Provides administrative operations for user management.
 *
 * @remarks
 * This service enables specialized administrative views by supporting complex
 * operations like full-text search, date-range filtering, and role-based data retrieval.
 * @group Administrative Services
 */
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly attachmentService: AttachmentService,
  ) {}

  /**
   * Retrieves a paginated search and filter operation to retrieve a collection of system users.
   *
   * @param query - The {@link GetUsersQueryDto} containing search terms, filters, and pagination settings.
   * @returns A promise resolving to the {@link UsersPaginationResponseDto} containing the user list and metadata.
   */
  async getUsers(query: GetUsersQueryDto): Promise<UsersPaginationResponseDto> {
    logger.info("Fetching users with query: %j", query);

    const { page, limit, search, role, fromDate, toDate, order = OrderBy.DESC } = query;

    const qb = this.userRepository.createQueryBuilder("user");

    // Step 1: Build the base user query with optional admin search and filter criteria

    if (search) {
      qb.andWhere("user.name ILIKE :search OR user.email ILIKE :search", { search: `%${search}%` });
    }

    if (fromDate) {
      qb.andWhere("user.createdAt >= :fromDate", { fromDate });
    }

    if (toDate) {
      qb.andWhere("user.createdAt <= :toDate", { toDate });
    }

    if (role) {
      qb.andWhere("user.role = :role", { role });
    }

    qb.orderBy("user.createdAt", order);

    // Step 2: Apply sorting and pagination, then execute the query to retrieve users with the total count

    qb.skip(calculateOffset(page, limit)).take(limit);

    const [users, total] = await qb.getManyAndCount();

    logger.debug("Found %d total users matching criteria", total);

    // Step 4: Fetch related attachments in bulk to avoid N+1 queries

    const userIds = users.map((user) => user.id);
    const attachmentMap = await this.attachmentService.getAttachmentsByEntityIds(userIds, EntityType.USER);

    const usersWithAttachment = users.map((user) => {
      return {
        ...user,
        attachment: attachmentMap[user.id] || [],
      };
    });

    logger.info("Successfully retrieved page %d of users (limit: %d)", page, limit);

    return {
      data: usersWithAttachment,
      total,
      page,
      limit,
      totalPages: calculateTotalPages(total, limit),
    };
  }

  /**
   * Retrieves a specific user's details and associated metadata by their unique identifier.
   *
   * @param userId - The KSUID of the user to retrieve.
   * @returns A promise resolving to the {@link UserResponse} object.
   * @throws NotFoundException if no user exists with the provided ID.
   */
  async getUserById(userId: string): Promise<UserResponse> {
    logger.info("Fetching user details for ID: %s", userId);

    // Step 1: Retrieve user while excluding sensitive fields

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: { password: false },
    });

    if (!user) {
      logger.warn("User fetch failed: User with ID %s not found", userId);

      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Step 2: Fetch and map related attachments for the user

    const attachmentMap = await this.attachmentService.getAttachmentsByEntityIds([user.id], EntityType.USER);

    logger.debug("Successfully mapped attachments for user: %s", user.email);

    return {
      ...user,
      attachment: attachmentMap[user.id] || [],
    };
  }
}
