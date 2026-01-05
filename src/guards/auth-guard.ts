import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthHelperService } from "src/modules/auth/auth.helper.service";
import { InjectRepository } from "@nestjs/typeorm";
import { UsersEntity } from "src/modules/users/users.entity";
import { Repository } from "typeorm";

@Injectable()
export class AdminAuthGuard {
  private readonly authService = new AuthHelperService();

  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
  ) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const { authToken } = req.cookies;

    if (!authToken) {
      throw new UnauthorizedException("Unauthorized");
    }

    const { id } = this.authService.validateGuardRequest(authToken);

    try {
      const user = await this.usersRepository
        .createQueryBuilder("user")
        .leftJoin("user.media", "media")
        .select(["user.id", "user.email", "user.name"])
        .where("user.id = :id", { id })
        .getOne();

      if (!user) {
        throw new UnauthorizedException("Unauthorized");
      }

      req.user = user;

      return true;
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}
