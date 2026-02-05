import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { UserEntity } from "modules/users/users.entity";
import { REDIS_PREFIX } from "constants/cache-prefixes";
import { ERROR_MESSAGES } from "constants/messages";
import { OrderBy, RoleRequestAction, RoleStatus, UserRole } from "enums";
import { logger } from "services/logger.service";
import { RedisService } from "shared/redis/redis.service";
import { User } from "types/types";
import { calculateOffset, calculateTotalPages } from "utils/helper";
import { makeRedisKey } from "utils/redis-cache";
import { RoleRequestPaginationDataDto, RoleRequestResponse } from "./dto/role-response.dto";
import { GetRoleRequestsQueryDto } from "./dto/role.dto";
import { RoleEntity } from "./role.entity";

/**
 * Manages the lifecycle of user role elevation requests and administrative reviews.
 *
 * @remarks
 * This service handles the business logic for users requesting higher privileges and
 * provides administrators with the tools to approve or reject these requests. It uses
 * {@link DataSource} transactions to ensure that user role updates and request status
 * changes occur atomically.
 *
 * @group Identity & Access Services
 */
@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,

    private readonly redisService: RedisService,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates a new role elevation request for an authenticated user.
   *
   * @param user - The {@link User} object initiating the request.
   * @param requestedRole - The {@link UserRole} the user is seeking to obtain.
   * @returns A promise that resolves when the request is successfully persisted.
   * @throws BadRequestException if the user already has the role or has a pending request.
   * @throws ForbiddenException if a user attempts to request the Admin role directly.
   */
  async createRoleRequest(user: User, requestedRole: UserRole): Promise<void> {
    logger.info("User %s requested role elevation to: %s", user.id, requestedRole);

    // Step 1: Validate request eligibility and prevent duplicate pending requests

    if (user.role === requestedRole) {
      throw new BadRequestException(ERROR_MESSAGES.ROLE_ALREADY_ASSIGNED);
    }

    if (requestedRole === UserRole.ADMIN) {
      throw new ForbiddenException(ERROR_MESSAGES.ADMIN_ROLE_FORBIDDEN);
    }

    const existingRequest = await this.roleRepository.findOne({
      where: {
        user: { id: user.id },
        status: RoleStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException(ERROR_MESSAGES.PENDING_REQUEST_EXISTS);
    }

    const roleRequest = this.roleRepository.create({
      user: { id: user.id },
      requestedRole,
      status: RoleStatus.PENDING,
    });

    logger.debug("Persisting new pending role request for user %s", user.id);

    await this.roleRepository.save(roleRequest);
  }

  /**
   * Processes an administrator's decision on a pending role request within a transaction.
   *
   * @param adminId - The identifier of the administrator reviewing the request.
   * @param requestId - The unique ID of the role request to be updated.
   * @param action - The {@link RoleRequestAction} (Approve or Reject) to be taken.
   * @returns A promise that resolves when both the request and user records are updated.
   * @throws NotFoundException if the request ID does not exist.
   * @throws BadRequestException if the request has already been reviewed.
   * @throws ForbiddenException if an administrator attempts to approve their own request.
   */
  async updateRoleRequest(adminId: string, requestId: string, action: RoleRequestAction): Promise<void> {
    logger.info("Admin %s is processing request %s with action: %s", adminId, requestId, action);

    // Step 1: Verify request existence, pending status, and prevent self-approval

    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(UserEntity);
      const roleRepository = manager.getRepository(RoleEntity);

      const roleRequest = await roleRepository.findOne({
        where: { id: requestId },
        relations: ["user"],
      });

      if (!roleRequest) {
        throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
      }

      // 1. Only pending requests can be reviewed
      if (roleRequest.status !== RoleStatus.PENDING) {
        throw new BadRequestException(ERROR_MESSAGES.REQUEST_ALREADY_REVIEWED);
      }

      const isSelfApproval = roleRequest.user.id === adminId;

      if (isSelfApproval) {
        throw new ForbiddenException(ERROR_MESSAGES.SELF_APPROVE_FORBIDDEN);
      }

      const isApproved = action === RoleRequestAction.APPROVE;

      // 3. If approved → update user role
      if (isApproved) {
        await userRepository.update(roleRequest.user.id, { role: roleRequest.requestedRole });
        await this.invalidateUserAndRoleRequestCaches(roleRequest.user.id);
      }

      await roleRepository.update(requestId, {
        status: isApproved ? RoleStatus.APPROVED : RoleStatus.REJECTED,
        reviewedBy: { id: adminId },
      });

      logger.info("Role request %s finalized as %s by admin %s", requestId, action, adminId);
    });
  }

  /**
   * Retrieves the most recent role request status for a specific user.
   *
   * @param userId - The identifier of the user.
   * @returns A promise resolving to the user's latest {@link RoleRequestResponse}.
   * @throws NotFoundException if no requests are found for the user.
   */
  async getRequestedRoleStatus(userId: string): Promise<RoleRequestResponse> {
    logger.info("Fetching latest role request status for user: %s", userId);

    // Step 1: Retrieve the most recent request record for the user profile

    const roleRequest = await this.roleRepository.findOne({
      where: { user: { id: userId } },
      order: { createdAt: OrderBy.DESC },
    });
    if (!roleRequest) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }

    return roleRequest;
  }

  /**
   * Retrieves a filtered and paginated list of all role requests for administrative oversight.
   *
   * @param query - The {@link GetRoleRequestsQueryDto} containing search and filter parameters.
   * @returns A promise resolving to a paginated collection of role requests {@link RoleRequestPaginationDataDto}.
   */
  async getRoleRequests(query: GetRoleRequestsQueryDto): Promise<RoleRequestPaginationDataDto> {
    logger.info("Admin role request lookup: %j", query);

    // Step 1: Build dynamic query with user relations and status/date filters

    const { page = 1, limit = 10, search, status, order = OrderBy.DESC, fromDate, toDate } = query;

    const qb = this.roleRepository.createQueryBuilder("role").leftJoinAndSelect("role.user", "user");

    if (search) {
      qb.andWhere("(user.name ILIKE :search OR user.email ILIKE :search)", { search: `%${search}%` });
    }

    if (status) {
      qb.andWhere("role.status=:status", { status });
    }

    if (fromDate) {
      qb.andWhere("role.createdAt >= :fromDate", { fromDate });
    }

    if (toDate) {
      qb.andWhere("role.createdAt <= :toDate", { toDate });
    }

    // Step 2: Apply pagination and sorting before executing administrative fetch

    qb.orderBy("role.createdAt", order);

    qb.skip(calculateOffset(page, limit)).take(limit);

    const [roleRequests, total] = await qb.getManyAndCount();

    const paginatedResponse = {
      data: roleRequests,
      page,
      limit,
      total,
      totalPages: calculateTotalPages(total, limit),
    };

    logger.info("Retrieved %d role requests for review", roleRequests.length);

    return paginatedResponse;
  }

  /**
   * Clears Redis caches for a user and their role requests to prevent stale data.
   * @param userId - ID of the user whose caches should be invalidated
   */

  private async invalidateUserAndRoleRequestCaches(userId: string): Promise<void> {
    const userCacheKey = makeRedisKey(REDIS_PREFIX.USER, userId);
    const authCacheKey = makeRedisKey(REDIS_PREFIX.AUTH, userId);
    const usersCacheKey = makeRedisKey(REDIS_PREFIX.USERS, "");
    const roleRequestCacheKey = makeRedisKey(REDIS_PREFIX.ROLE_REQUEST, userId);
    const roleRequestsCacheKey = makeRedisKey(REDIS_PREFIX.ROLE_REQUESTS, "");

    await this.redisService.delete([userCacheKey, authCacheKey, roleRequestCacheKey]);
    await this.redisService.deleteByPattern(`${usersCacheKey}*`);
    await this.redisService.deleteByPattern(`${roleRequestsCacheKey}*`);
  }
}
