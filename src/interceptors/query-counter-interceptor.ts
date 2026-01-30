import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { logger } from "services/logger.service";
import { AnyType } from "types/types";

@Injectable()
export class QueryCountInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<AnyType> {
    // Reset counter before request
    Reflect.defineMetadata("queryCount", 0, globalThis);

    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const count = Reflect.getMetadata("queryCount", globalThis) || 0;
        const time = Date.now() - now;
        logger.info(
          `Request to ${context.switchToHttp().getRequest().url} took ${time}ms and made ${count} database queries.`,
        );
      }),
    );
  }
}
