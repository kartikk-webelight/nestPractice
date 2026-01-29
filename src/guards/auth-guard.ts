import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DecodedToken } from "modules/auth/auth.types";
import { UserEntity } from "modules/users/users.entity";
import { ERROR_MESSAGES } from "constants/messages";
import { verifyAccessToken } from "utils/jwt";

/**
 * Secures routes by validating JSON Web Tokens (JWT) and establishing the request identity.
 *
 * @remarks
 * This guard extracts credentials from either cookies or the Authorization header.
 * On successful validation, it hydrates the request object with the authenticated user entity.
 * @group Security / Guards
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  /**
   * Verifies the authenticity of the incoming request before allowing access to the route.
   *
   * @param context - The execution context providing access to the current request.
   * @returns A promise resolving to true if the session is valid and the user is authenticated.
   * @throws UnauthorizedException if the token is missing, expired, or the user no longer exists.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Look for token in Cookies first, then fallback to Authorization header
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
      select: { password: false }, // Security: ensure password is never leaked to the request object
    });

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Attach user to request for use in @GetUser() decorators or controllers
    request.user = user;

    return true;
  }
}
