import { CanActivate, ExecutionContext, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { AuthHelperService } from "src/modules/auth/auth.helper.service";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "src/modules/users/users.entity";
import { Repository } from "typeorm";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly authHelperService: AuthHelperService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = request.cookies?.accessToken || request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new UnauthorizedException("token is required");
    }

    

    let decodedToken;
    try {
      decodedToken = this.authHelperService.verifyAccessToken(token);
    } catch (error) {
      throw new UnauthorizedException("invalid token");
    }

    if (!decodedToken.payload) {
      throw new UnauthorizedException("invalid token");
    }

    const user = await this.userRepo.findOne({
      where: { id: decodedToken.payload },
      select: { password: false, refreshToken: false },
    });
    if (!user) {
      throw new NotFoundException("user not found");
    }

    request.user = user;

    return true;
  }
}
