import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ERROR_MESSAGES } from "constants/messages";
import { ROLES_KEY } from "decorators/role";

/**
 * Enforces Role-Based Access Control (RBAC) by verifying the authenticated user's permissions.
 *
 * @remarks
 * This guard evaluates roles defined via the `@Roles()` decorator. It requires the
 * `request.user` object to be previously populated, usually by the {@link AuthGuard}.
 * @group Security / Guards
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Validates the user's role against the required permissions for the requested resource.
   *
   * @param context - The execution context of the current request.
   * @returns A boolean indicating if the user has the necessary authorization.
   * @throws ForbiddenException if the user is missing, unauthenticated, or lacks the required role.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are defined on the route/controller, allow access
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    // Ensure user exists to prevent runtime TypeErrors
    if (!user || !user.role) {
      throw new ForbiddenException(ERROR_MESSAGES.FORBIDDEN);
    }

    return requiredRoles.includes(user.role);
  }
}
