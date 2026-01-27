import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { UserEntity } from "modules/users/users.entity";
import { ERROR_MESSAGES } from "constants/messages.constants";
import { OrderBy, RoleRequestAction, RoleStatus, UserRole } from "enums";
import { User } from "types/types";
import { calculateOffset, calculateTotalPages } from "utils/helper";
import { RoleEntity } from "./role.entity";
import { GetRoleRequestsQuery } from "./role.types";

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,

    private readonly dataSource: DataSource,
  ) {}

  async createRoleRequest(user: User, requestedRole: UserRole) {
    if (user.role === requestedRole) {
      throw new BadRequestException("You already have this role");
    }

    if (requestedRole === UserRole.ADMIN) {
      throw new ForbiddenException("You cannot request admin role");
    }

    const existingRequest = await this.roleRepository.findOne({
      where: {
        user: { id: user.id },
        status: RoleStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException("You already have a pending role request");
    }

    const roleRequest = this.roleRepository.create({
      user: { id: user.id },
      requestedRole,
      status: RoleStatus.PENDING,
    });

    await this.roleRepository.save(roleRequest);
  }

  async updateRoleRequest(adminId: string, requestId: string, action: RoleRequestAction) {
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
        throw new BadRequestException("Role request already reviewed");
      }

      if (roleRequest.user.id === adminId) {
        throw new ForbiddenException("You cannot approve your own request");
      }

      const isApproved = action === RoleRequestAction.APPROVE;

      // 3. If approved → update user role
      if (action === RoleRequestAction.APPROVE) {
        await userRepository.update(roleRequest.user.id, { role: roleRequest.requestedRole });
      }

      await roleRepository.update(requestId, {
        status: isApproved ? RoleStatus.APPROVED : RoleStatus.REJECTED,
        reviewedBy: { id: adminId },
      });

      return;
    });
  }

  async getRequestedRoleStatus(userId: string) {
    const roleRequest = await this.roleRepository.findOne({
      where: { user: { id: userId } },
      order: { createdAt: OrderBy.DESC },
    });
    if (!roleRequest) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }

    return roleRequest;
  }

  async getRoleRequests(query: GetRoleRequestsQuery) {
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

    qb.orderBy("role.createdAt", order);

    qb.skip(calculateOffset(page, limit)).take(limit);

    const [roleRequests, total] = await qb.getManyAndCount();

    return {
      data: roleRequests,
      page,
      limit,
      total,
      totalPages: calculateTotalPages(total, limit),
    };
  }
}
