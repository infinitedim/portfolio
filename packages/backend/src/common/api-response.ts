import type { Response } from "express";

export interface ApiResponseData<T> {
  data: T;
  message?: string;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
    requestId?: string;
    version?: string;
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
    requestId?: string;
  };
  meta?: {
    category: string;
    severity: string;
    retryable: boolean;
  };
}

export class ApiResponse<T = unknown> {
  constructor(
    public success: boolean,
    public data?: T,
    public message?: string,
    public errors?: string[],
  ) {}

  /**
   * Create a successful response
   * @param {T} data - The data to be returned
   * @param {string} message - The message to be returned
   * @param {Omit<ApiResponseData<T>["meta"], "timestamp">} meta - The meta data to be returned
   * @returns {ApiResponseData<T>} - The response data
   */
  static success<T>(
    data: T,
    message?: string,
    meta?: Omit<ApiResponseData<T>["meta"], "timestamp">,
  ): ApiResponseData<T> {
    return {
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
  }

  /**
   * Create an error response
   * @param {string} message - The message to be returned
   * @param {string} code - The code to be returned
   * @param {Record<string, unknown>} details - The details to be returned
   * @param {string} category - The category to be returned
   * @param {string} severity - The severity to be returned
   * @param {boolean} retryable - Whether the error is retryable
   * @returns {ApiErrorResponse} - The error response
   */
  static error(
    message: string,
    code: string = "ERROR",
    details?: Record<string, unknown>,
    category: string = "GENERAL",
    severity: string = "MEDIUM",
    retryable: boolean = false,
  ): ApiErrorResponse {
    return {
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
      meta: {
        category,
        severity,
        retryable,
      },
    };
  }

  /**
   * Create a paginated response
   * @param {T[]} data - The data to be returned
   * @param {number} page - The page number
   * @param {number} limit - The limit
   * @param {number} total - The total
   * @param {string} message - The message to be returned
   * @returns {ApiResponseData<T[]>} - The response data
   */
  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string,
  ): ApiResponseData<T[]> {
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      message,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Create a list response with metadata
   * @param {T[]} data - The data to be returned
   * @param {string} message - The message to be returned
   * @param {Omit<ApiResponseData<T[]>["meta"], "timestamp">} meta - The meta data to be returned
   * @returns {ApiResponseData<T[]>} - The response data
   */
  static list<T>(
    data: T[],
    message?: string,
    meta?: Omit<ApiResponseData<T[]>["meta"], "timestamp">,
  ): ApiResponseData<T[]> {
    return {
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
  }

  /**
   * Create a simple message response
   * @param {string} message - The message to be returned
   * @param {Omit<ApiResponseData<null>["meta"], "timestamp">} meta - The meta data to be returned
   * @returns {ApiResponseData<null>} - The response data
   */
  static message(
    message: string,
    meta?: Omit<ApiResponseData<null>["meta"], "timestamp">,
  ): ApiResponseData<null> {
    return {
      data: null,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
  }
}

/**
 * Response helper for Express
 */
export class ResponseHelper {
  /**
   * Send success response
   * @param {Response} res - The response object
   * @param {T} data - The data to be returned
   * @param {number} status - The status code
   * @param {string} message - The message to be returned
   * @param {Omit<ApiResponseData<T>["meta"], "timestamp">} meta - The meta data to be returned
   * @returns {Response} - The response object
   */
  static success<T>(
    res: Response,
    data: T,
    status: number = 200,
    message?: string,
    meta?: Omit<ApiResponseData<T>["meta"], "timestamp">,
  ): Response {
    const response = ApiResponse.success(data, message, meta);

    // Add request ID if available
    if (res.locals.requestId) {
      response.meta!.requestId = res.locals.requestId;
    }

    return res.status(status).json(response);
  }

  /**
   * Send error response
   * @param {Response} res - The response object
   * @param {string} message - The message to be returned
   * @param {number} status - The status code
   * @param {string} code - The code to be returned
   * @param {Record<string, unknown>} details - The details to be returned
   * @param {string} category - The category to be returned
   * @param {string} severity - The severity to be returned
   * @param {boolean} retryable - Whether the error is retryable
   * @returns {Response} - The response object
   */
  static error(
    res: Response,
    message: string,
    status: number = 400,
    code?: string,
    details?: Record<string, unknown>,
    category?: string,
    severity?: string,
    retryable?: boolean,
  ): Response {
    const response = ApiResponse.error(
      message,
      code,
      details,
      category,
      severity,
      retryable,
    );

    // Add request ID if available
    if (res.locals.requestId) {
      response.error.requestId = res.locals.requestId;
    }

    return res.status(status).json(response);
  }

  /**
   * Send paginated response
   * @param {Response} res - The response object
   * @param {T[]} data - The data to be returned
   * @param {number} page - The page number
   * @param {number} limit - The limit
   * @param {number} total - The total
   * @param {number} status - The status code
   * @param {string} message - The message to be returned
   * @returns {Response} - The response object
   */
  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    status: number = 200,
    message?: string,
  ): Response {
    const response = ApiResponse.paginated(data, page, limit, total, message);

    // Add request ID if available
    if (res.locals.requestId) {
      response.meta!.requestId = res.locals.requestId;
    }

    return res.status(status).json(response);
  }

  /**
   * Send list response
   * @param {Response} res - The response object
   * @param {T[]} data - The data to be returned
   * @param {number} status - The status code
   * @param {string} message - The message to be returned
   * @param {Omit<ApiResponseData<T[]>["meta"], "timestamp">} meta - The meta data to be returned
   * @returns {Response} - The response object
   */
  static list<T>(
    res: Response,
    data: T[],
    status: number = 200,
    message?: string,
    meta?: Omit<ApiResponseData<T[]>["meta"], "timestamp">,
  ): Response {
    const response = ApiResponse.list(data, message, meta);

    // Add request ID if available
    if (res.locals.requestId) {
      response.meta!.requestId = res.locals.requestId;
    }

    return res.status(status).json(response);
  }

  /**
   * Send message response
   * @param {Response} res - The response object
   * @param {string} message - The message to be returned
   * @param {number} status - The status code
   * @param {Omit<ApiResponseData<null>["meta"], "timestamp">} meta - The meta data to be returned
   * @returns {Response} - The response object
   */
  static message(
    res: Response,
    message: string,
    status: number = 200,
    meta?: Omit<ApiResponseData<null>["meta"], "timestamp">,
  ): Response {
    const response = ApiResponse.message(message, meta);

    // Add request ID if available
    if (res.locals.requestId) {
      response.meta!.requestId = res.locals.requestId;
    }

    return res.status(status).json(response);
  }

  /**
   * Send created response
   * @param {Response} res - The response object
   * @param {T} data - The data to be returned
   * @param {string} message - The message to be returned
   * @param {Omit<ApiResponseData<T>["meta"], "timestamp">} meta - The meta data to be returned
   * @returns {Response} - The response object
   */
  static created<T>(
    res: Response,
    data: T,
    message?: string,
    meta?: Omit<ApiResponseData<T>["meta"], "timestamp">,
  ): Response {
    return this.success(res, data, 201, message, meta);
  }

  /**
   * Send no content response
   * @param {Response} res - The response object
   * @returns {Response} - The response object
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  /**
   * Send unauthorized response
   * @param {Response} res - The response object
   * @param {string} message - The message to be returned
   * @param {Record<string, unknown>} details - The details to be returned
   * @returns {Response} - The response object
   */
  static unauthorized(
    res: Response,
    message: string = "Authentication required",
    details?: Record<string, unknown>,
  ): Response {
    return this.error(
      res,
      message,
      401,
      "UNAUTHORIZED",
      details,
      "AUTHENTICATION",
      "MEDIUM",
      false,
    );
  }

  /**
   * Send forbidden response
   * @param {Response} res - The response object
   * @param {string} message - The message to be returned
   * @param {Record<string, unknown>} details - The details to be returned
   * @returns {Response} - The response object
   */
  static forbidden(
    res: Response,
    message: string = "Access denied",
    details?: Record<string, unknown>,
  ): Response {
    return this.error(
      res,
      message,
      403,
      "FORBIDDEN",
      details,
      "AUTHORIZATION",
      "MEDIUM",
      false,
    );
  }

  /**
   * Send not found response
   * @param {Response} res - The response object
   * @param {string} message - The message to be returned
   * @param {Record<string, unknown>} details - The details to be returned
   * @returns {Response} - The response object
   */
  static notFound(
    res: Response,
    message: string = "Resource not found",
    details?: Record<string, unknown>,
  ): Response {
    return this.error(
      res,
      message,
      404,
      "NOT_FOUND",
      details,
      "NOT_FOUND",
      "LOW",
      false,
    );
  }

  /**
   * Send validation error response
   * @param {Response} res - The response object
   * @param {string} message - The message to be returned
   * @param {Record<string, unknown>} details - The details to be returned
   * @returns {Response} - The response object
   */
  static validationError(
    res: Response,
    message: string = "Validation failed",
    details?: Record<string, unknown>,
  ): Response {
    return this.error(
      res,
      message,
      422,
      "VALIDATION_ERROR",
      details,
      "VALIDATION",
      "LOW",
      false,
    );
  }

  /**
   * Send rate limit response
   * @param {Response} res - The response object
   * @param {string} message - The message to be returned
   * @param {number} retryAfter - The retry after
   * @returns {Response} - The response object
   */
  static rateLimit(
    res: Response,
    message: string = "Too many requests",
    retryAfter?: number,
  ): Response {
    const details = retryAfter ? { retryAfter } : undefined;

    if (retryAfter) {
      res.setHeader("Retry-After", retryAfter.toString());
    }

    return this.error(
      res,
      message,
      429,
      "RATE_LIMIT",
      details,
      "RATE_LIMIT",
      "LOW",
      true,
    );
  }

  /**
   * Send internal server error response
   * @param {Response} res - The response object
   * @param {string} message - The message to be returned
   * @param {Record<string, unknown>} details - The details to be returned
   * @returns {Response} - The response object
   */
  static internalError(
    res: Response,
    message: string = "Internal server error",
    details?: Record<string, unknown>,
  ): Response {
    return this.error(
      res,
      message,
      500,
      "INTERNAL_ERROR",
      details,
      "INTERNAL",
      "HIGH",
      false,
    );
  }
}
