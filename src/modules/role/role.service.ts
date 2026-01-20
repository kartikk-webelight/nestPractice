import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "modules/users/users.entity";
import { ERROR_MESSAGES } from "constants/messages.constants";
import { OrderBy, RoleStatus, UserRole } from "enums";
import { User } from "types/types";
import { RoleEntity } from "./role.entity";
import { GetRoleRequestsQuery } from "./role.types";

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
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

    return;
  }

  async updateRole(adminId: string, requestId: string, action: RoleStatus) {
    const roleRequest = await this.roleRepository.findOne({
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

    // 2. Update request metadata
    roleRequest.status = action;
    roleRequest.reviewedBy = this.userRepository.create({
      id: adminId,
    });

    // 3. If approved → update user role
    if (action === RoleStatus.APPROVED) {
      roleRequest.user.role = roleRequest.requestedRole;
      await this.userRepository.save(roleRequest.user);
    }

    await this.roleRepository.save(roleRequest);

    return;
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
    const { page = 1, limit = 10, name, status, order = OrderBy.DESC, fromDate, toDate } = query;

    const qb = this.roleRepository.createQueryBuilder("role").leftJoinAndSelect("role.user", "user");

    if (name) {
      qb.andWhere("user.name ILIKE :name", { name: `%${name}%` });
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

    qb.skip((page - 1) * limit).take(limit);

    const [roleRequests, total] = await qb.getManyAndCount();

    return {
      data: roleRequests,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
