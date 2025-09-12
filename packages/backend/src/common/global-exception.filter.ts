import {
  type ExceptionFilter,
  Catch,
  type ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { GlobalErrorHandler } from "./error-handler";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly errorHandler: GlobalErrorHandler) {}

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Generate request ID if not present
    if (!request.headers["x-request-id"]) {
      request.headers["x-request-id"] = this.generateRequestId();
    }

    let error: Error | HttpException;
    let status: number;

    // Convert unknown exceptions to proper error types
    if (exception instanceof HttpException) {
      error = exception;
      status = exception.getStatus();
    } else if (exception instanceof Error) {
      error = exception;
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    } else {
      error = new Error("Unknown error occurred");
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    // Handle error through our global error handler
    const structuredError = await this.errorHandler.handleError(error, request);

    // Set response headers
    response.setHeader("X-Request-ID", request.headers["x-request-id"]);
    response.setHeader("Content-Type", "application/json");

    // Send structured error response
    response.status(status).json(structuredError);

    // Log the error for debugging
    this.logger.error(`Request failed: ${request.method} ${request.url}`, {
      status,
      error: structuredError.error,
      requestId: request.headers["x-request-id"],
      userAgent: request.headers["user-agent"],
      ip: request.ip,
    });
  }

  /**
   * Generate unique request ID for tracking
   * @returns {string} - The generated request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
