import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AttachmentService } from "modules/attachment/attachment.service";
import { UserEntity } from "modules/users/users.entity";
import { REDIS_PREFIX } from "constants/cache-prefixes";
import { DURATION_CONSTANTS } from "constants/duration";
import { ERROR_MESSAGES } from "constants/messages";
import { UserResponse, UsersPaginationResponseDto } from "dto/common-response.dto";
import { EntityType, OrderBy } from "enums";
import { logger } from "services/logger.service";
import { RedisService } from "shared/redis/redis.service";
import { calculateOffset, calculateTotalPages } from "utils/helper";
import { getCachedJson, makeRedisKey } from "utils/redis-cache";
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
    private readonly redisService: RedisService,
  ) {}

  /**
   * Retrieves a paginated list of system users based on search and filter criteria.
   *
   * This method first attempts to fetch the results from Redis cache. If not cached,
   * it queries the database, fetches related attachments for each user,
   * and caches the final result.
   *
   * @param query - The {@link GetUsersQueryDto} containing search terms, filters, sorting, and pagination settings.
   * @returns A promise resolving to the {@link UsersPaginationResponseDto} containing the users and pagination metadata.
   */
  async getUsers(query: GetUsersQueryDto): Promise<UsersPaginationResponseDto> {
    logger.info("Fetching users with query: %j", query);

    const usersCacheKey = makeRedisKey(REDIS_PREFIX.USERS, query);

    // Step 1: Try fetching paginated users from cache
    const cachedUsers = await getCachedJson<UsersPaginationResponseDto>(usersCacheKey, this.redisService);

    if (cachedUsers) {
      logger.info("Cache hit for users list (query: %j)", query);

      return cachedUsers;
    }

    const { page, limit, search, role, fromDate, toDate, order = OrderBy.DESC } = query;
    const qb = this.userRepository.createQueryBuilder("user");

    if (search) qb.andWhere("user.name ILIKE :search OR user.email ILIKE :search", { search: `%${search}%` });
    if (fromDate) qb.andWhere("user.createdAt >= :fromDate", { fromDate });
    if (toDate) qb.andWhere("user.createdAt <= :toDate", { toDate });
    if (role) qb.andWhere("user.role = :role", { role });

    qb.orderBy("user.createdAt", order).skip(calculateOffset(page, limit)).take(limit);

    const [users, total] = await qb.getManyAndCount();
    logger.debug("Found %d total users matching criteria", total);

    // Step 2: Fetch attachments and assemble final paginated response
    const userIds = users.map((u) => u.id);
    const attachmentMap = await this.attachmentService.getAttachmentsByEntityIds(userIds, EntityType.USER);

    const usersWithAttachments = users.map((user) => ({
      ...user,
      attachment: attachmentMap[user.id] || [],
    }));

    const paginatedResponse: UsersPaginationResponseDto = {
      data: usersWithAttachments,
      total,
      page,
      limit,
      totalPages: calculateTotalPages(total, limit),
    };

    await this.redisService.set(usersCacheKey, JSON.stringify(paginatedResponse), DURATION_CONSTANTS.TWO_MIN_IN_SEC);

    logger.info("Successfully retrieved page %d of users (limit: %d)", page, limit);

    return paginatedResponse;
  }

  /**
   * Retrieves a user's details by their unique identifier, including any associated attachments.
   *
   * This method first attempts to fetch the user from Redis cache. If the user is not cached
   * or the cached data is invalid, it retrieves the user from the database and caches the result.
   *
   * @param userId - The unique ID of the user to retrieve.
   * @returns A promise resolving to the {@link UserResponse}, including an `attachment` array.
   * @throws NotFoundException if no user exists with the provided ID.
   */
  async getUserById(userId: string): Promise<UserResponse> {
    logger.info("Fetching user details for ID: %s", userId);

    const userCacheKey = makeRedisKey(REDIS_PREFIX.USER, userId);

    // Step 1: Return cached user if available
    const cachedUser = await getCachedJson<UserResponse>(userCacheKey, this.redisService);
    if (cachedUser) {
      logger.info("Cache hit for user with ID %s", userId);

      return cachedUser;
    }

    // Step 2: Fetch user from DB
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: { password: false },
    });

    if (!user) {
      logger.warn("User fetch failed: User with ID %s not found", userId);
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Step 3: Fetch attachments and assemble final object
    const attachmentMap = await this.attachmentService.getAttachmentsByEntityIds([user.id], EntityType.USER);

    const userWithAttachments: UserResponse = {
      ...user,
      attachment: attachmentMap[user.id] || [],
    };

    // Step 4: Cache the final object
    await this.redisService.set(userCacheKey, JSON.stringify(userWithAttachments), DURATION_CONSTANTS.TWO_MIN_IN_SEC);

    logger.debug("Successfully mapped attachments for user: %s", user.email);

    return userWithAttachments;
  }
}
