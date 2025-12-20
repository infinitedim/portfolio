/**
 * Custom Error Classes for consistent error handling
 * Provides a hierarchy of error types for different scenarios
 */

/**
 * Base error class for all application errors
 */
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  readonly timestamp: Date;
  readonly context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for logging/API responses
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: process.env.NODE_ENV === "development" ? this.stack : undefined,
    };
  }

  /**
   * Create a sanitized version safe for client responses
   */
  toClientError(): { code: string; message: string; statusCode: number } {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Validation errors - invalid input data
 */
export class ValidationError extends AppError {
  readonly code = "VALIDATION_ERROR";
  readonly statusCode = 400;
  readonly field?: string;
  readonly constraints?: Record<string, string>;

  constructor(
    message: string,
    options?: {
      field?: string;
      constraints?: Record<string, string>;
      context?: Record<string, unknown>;
    },
  ) {
    super(message, options?.context);
    this.field = options?.field;
    this.constraints = options?.constraints;
  }

  static fromField(field: string, message: string): ValidationError {
    return new ValidationError(message, { field });
  }

  static fromConstraints(constraints: Record<string, string>): ValidationError {
    const messages = Object.values(constraints);
    return new ValidationError(messages.join(", "), { constraints });
  }
}

/**
 * Authentication errors - user not authenticated
 */
export class AuthenticationError extends AppError {
  readonly code = "AUTHENTICATION_ERROR";
  readonly statusCode = 401;

  constructor(
    message: string = "Authentication required",
    context?: Record<string, unknown>,
  ) {
    super(message, context);
  }

  static invalidCredentials(): AuthenticationError {
    return new AuthenticationError("Invalid email or password");
  }

  static tokenExpired(): AuthenticationError {
    return new AuthenticationError("Token has expired");
  }

  static tokenInvalid(): AuthenticationError {
    return new AuthenticationError("Invalid token");
  }

  static sessionExpired(): AuthenticationError {
    return new AuthenticationError("Session has expired");
  }
}

/**
 * Authorization errors - user not permitted
 */
export class AuthorizationError extends AppError {
  readonly code = "AUTHORIZATION_ERROR";
  readonly statusCode = 403;
  readonly requiredPermission?: string;

  constructor(
    message: string = "You do not have permission to perform this action",
    requiredPermission?: string,
    context?: Record<string, unknown>,
  ) {
    super(message, context);
    this.requiredPermission = requiredPermission;
  }

  static insufficientPermissions(permission: string): AuthorizationError {
    return new AuthorizationError(
      `Insufficient permissions: ${permission} required`,
      permission,
    );
  }

  static adminRequired(): AuthorizationError {
    return new AuthorizationError("Admin access required", "admin");
  }
}

/**
 * Not found errors - resource doesn't exist
 */
export class NotFoundError extends AppError {
  readonly code = "NOT_FOUND";
  readonly statusCode = 404;
  readonly resource?: string;
  readonly identifier?: string;

  constructor(
    message: string = "Resource not found",
    options?: {
      resource?: string;
      identifier?: string;
      context?: Record<string, unknown>;
    },
  ) {
    super(message, options?.context);
    this.resource = options?.resource;
    this.identifier = options?.identifier;
  }

  static forResource(resource: string, identifier?: string): NotFoundError {
    const msg = identifier
      ? `${resource} with id '${identifier}' not found`
      : `${resource} not found`;
    return new NotFoundError(msg, { resource, identifier });
  }
}

/**
 * Conflict errors - resource state conflict
 */
export class ConflictError extends AppError {
  readonly code = "CONFLICT";
  readonly statusCode = 409;

  constructor(
    message: string = "Resource conflict",
    context?: Record<string, unknown>,
  ) {
    super(message, context);
  }

  static alreadyExists(resource: string, field?: string): ConflictError {
    const msg = field
      ? `${resource} with this ${field} already exists`
      : `${resource} already exists`;
    return new ConflictError(msg);
  }
}

/**
 * Rate limit errors
 */
export class RateLimitError extends AppError {
  readonly code = "RATE_LIMIT_EXCEEDED";
  readonly statusCode = 429;
  readonly retryAfter?: number;

  constructor(
    message: string = "Too many requests",
    retryAfter?: number,
    context?: Record<string, unknown>,
  ) {
    super(message, context);
    this.retryAfter = retryAfter;
  }

  static withRetry(retryAfter: number): RateLimitError {
    return new RateLimitError(
      `Too many requests. Please try again in ${retryAfter} seconds`,
      retryAfter,
    );
  }
}

/**
 * Network/External service errors
 */
export class NetworkError extends AppError {
  readonly code = "NETWORK_ERROR";
  readonly statusCode = 502;
  readonly service?: string;
  readonly originalError?: Error;

  constructor(
    message: string = "Network error occurred",
    options?: {
      service?: string;
      originalError?: Error;
      context?: Record<string, unknown>;
    },
  ) {
    super(message, options?.context);
    this.service = options?.service;
    this.originalError = options?.originalError;
  }

  static fromService(service: string, originalError?: Error): NetworkError {
    return new NetworkError(`Failed to connect to ${service}`, {
      service,
      originalError,
    });
  }

  static timeout(service?: string): NetworkError {
    const msg = service
      ? `Request to ${service} timed out`
      : "Request timed out";
    return new NetworkError(msg, { service });
  }
}

/**
 * Database errors
 */
export class DatabaseError extends AppError {
  readonly code = "DATABASE_ERROR";
  readonly statusCode = 500;
  readonly operation?: string;

  constructor(
    message: string = "Database operation failed",
    operation?: string,
    context?: Record<string, unknown>,
  ) {
    super(message, context);
    this.operation = operation;
  }

  static queryFailed(operation: string): DatabaseError {
    return new DatabaseError(`Database ${operation} failed`, operation);
  }

  static connectionFailed(): DatabaseError {
    return new DatabaseError("Failed to connect to database", "connect");
  }
}

/**
 * Internal server errors - unexpected errors
 */
export class InternalError extends AppError {
  readonly code = "INTERNAL_ERROR";
  readonly statusCode = 500;
  readonly originalError?: Error;

  constructor(
    message: string = "An unexpected error occurred",
    originalError?: Error,
    context?: Record<string, unknown>,
  ) {
    super(message, context);
    this.originalError = originalError;
  }

  static fromError(error: unknown): InternalError {
    if (error instanceof Error) {
      return new InternalError(error.message, error);
    }
    return new InternalError(String(error));
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Convert any error to AppError
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }
  return InternalError.fromError(error);
}

/**
 * Error codes enum for type safety
 */
export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  NETWORK_ERROR: "NETWORK_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
