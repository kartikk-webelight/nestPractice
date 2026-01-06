import { CanActivate, ExecutionContext, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { AuthHelperService } from "src/modules/auth/auth.helper.service";
import { Observable } from "rxjs";
import { InjectRepository } from "@nestjs/typeorm";
import { UsersEntity } from "src/modules/users/users.entity";
import { Repository } from "typeorm";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly userRepo: Repository<UsersEntity>,
    private readonly authHelperService: AuthHelperService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = request.cookies?.accessToken || request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new UnauthorizedException("token is required");
    }

    console.log(token);

    let decodedToken;
    try {
      decodedToken = this.authHelperService.verifyAccessToken(token);
    } catch (error) {
      throw new UnauthorizedException("invalid token");
    }
    console.log(decodedToken);

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
    console.log("user.name", user.name);

    return true;
  }
}
