import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { appConfig } from "src/config/app.config";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const key = req.headers["x-api-key"];

    if (key !== appConfig.xApiKey) {
      throw new ForbiddenException();
    }

    return true;
  }
}
