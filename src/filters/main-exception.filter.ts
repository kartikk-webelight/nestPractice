import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { captureException } from "@sentry/node";
import { ERROR_MESSAGES } from "constants/messages";
import { logger } from "services/logger.service";
import { AnyType } from "types/types";

/**
 * Global Exception Filter that intercepts all {@link HttpException} instances.
 * * @remarks
 * This filter performs three main tasks:
 * 1. Passes through "Safe" errors (400-404, 429) directly to the client.
 * 2. Logs critical internal errors (500) to the local {@link logger}.
 * 3. Reports unhandled exceptions to **Sentry** for real-time monitoring.
 * * @group Core / Filters
 */
@Catch(HttpException)
export class MainExceptionFilter implements ExceptionFilter {
  /**
   * @param httpAdapterHost - Injected host to access the underlying HTTP server (Fastify or Express).
   */
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  /**
   * Implementation of the {@link ExceptionFilter.catch} method.
   * * @param exception - The caught exception object.
   * @param host - The arguments host providing access to the request/response context.
   * @returns A formatted HTTP response via the underlying adapter.
   */
  catch(exception: Error, host: ArgumentsHost) {
    const { message, stack, response } = exception as AnyType;
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    // Determine the status code, defaulting to 500 if not an official HttpException
    const statusCode = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    /**
     * White-listed "Client-Side" status codes.
     * These are returned to the user without being treated as system failures/Sentry events.
     */
    const safeStatusCodes = [
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
      HttpStatus.BAD_REQUEST,
      HttpStatus.NOT_FOUND,
      HttpStatus.TOO_MANY_REQUESTS,
      HttpStatus.CONFLICT,
      HttpStatus.SERVICE_UNAVAILABLE,
    ];

    if (safeStatusCodes.includes(statusCode)) {
      return httpAdapter.reply(ctx.getResponse(), response, statusCode);
    }

    // --- CRITICAL ERROR HANDLING ---

    // 1. Log to local filesystem/console
    logger.error(`EXCEPTION FILTER:: Exception: ${message}, stack: ${stack}`);

    // 2. Capture in Sentry for alerting
    captureException(exception, {
      extra: {
        statusCode,
        originalMessage: message,
      },
    });

    /**
     * Sanitized response body for internal errors.
     * Prevents leaking sensitive stack traces or DB errors to the end user.
     */
    const responseBody = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    };

    return httpAdapter.reply(ctx.getResponse(), responseBody, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
