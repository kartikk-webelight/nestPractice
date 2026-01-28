import { CanActivate, ExecutionContext, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DecodedToken } from "modules/auth/auth.types";
import { UserEntity } from "modules/users/users.entity";
import { ERROR_MESSAGES } from "constants/messages.constants";
import { verifyAccessToken } from "utils/jwt";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = request.cookies?.accessToken || request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    let decodedToken: DecodedToken;
    try {
      decodedToken = verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (!decodedToken.id) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const user = await this.userRepo.findOne({
      where: { id: decodedToken.id },
      select: { password: false },
    });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    request.user = user;

    return true;
  }
}
