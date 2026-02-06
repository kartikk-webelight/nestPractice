import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DecodedToken } from "modules/auth/auth.types";
import { UserEntity } from "modules/users/users.entity";
import { CACHE_PREFIX } from "constants/cache-prefixes";
import { DURATION_CONSTANTS } from "constants/duration";
import { ERROR_MESSAGES } from "constants/messages";
import { UserResponse } from "dto/common-response.dto";
import { CacheService } from "shared/cache/cache.service";
import { getCachedJson, getCacheKey } from "utils/cache";
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

    private readonly cacheService: CacheService,
  ) {}

  /**
   * AuthGuard: Validates the incoming request by verifying the JWT and loading the authenticated user.
   *
   * The guard checks Redis cache for the user and attaches it to the request if found.
   * If the user is not cached, it fetches from the database, attaches to the request, and caches it in Redis.
   *
   * @param context - Execution context providing access to the current request.
   * @returns A promise resolving to true if the request is authenticated.
   * @throws UnauthorizedException if the token is missing, invalid, or the user does not exist.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Step 1: Extract token from cookies or Authorization header and verify JWT
    const token = request.cookies?.accessToken || request.headers.authorization?.replace("Bearer ", "");
    if (!token) throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);

    let decodedToken: DecodedToken;
    try {
      decodedToken = verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (!decodedToken.id) throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);

    const authCacheKey = getCacheKey(CACHE_PREFIX.AUTH, decodedToken.id);

    // Step 2: Return user from cache if available
    const cachedUser = await getCachedJson<UserResponse>(authCacheKey, this.cacheService);
    if (cachedUser !== null) {
      request.user = cachedUser;

      return true;
    }

    // Step 3: Fetch user from DB attach it to request and cache it
    const user = await this.userRepo.findOne({
      where: { id: decodedToken.id },
      select: { password: false },
    });
    if (!user) throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);

    request.user = user;
    await this.cacheService.set(authCacheKey, JSON.stringify(user), DURATION_CONSTANTS.ONE_HOUR_IN_SEC);

    return true;
  }
}
