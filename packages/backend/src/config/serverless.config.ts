import { Injectable } from "@nestjs/common";

@Injectable()
export class ServerlessConfig {
  /**
   * Check if the application is running in a serverless environment
   * @returns {boolean} - Whether the application is running in a serverless environment
   */
  static isServerless(): boolean {
    return process.env.NODE_ENV === "production" && !!process.env.VERCEL_URL;
  }

  /**
   * Check if the application is running on Vercel
   * @returns {boolean} - Whether the application is running on Vercel
   */
  static isVercel(): boolean {
    return !!process.env.VERCEL_URL;
  }

  /**
   * Get the appropriate database URL for the environment
   * @returns {string} - The appropriate database URL for the environment
   */
  static getDatabaseUrl(): string {
    // In serverless/Vercel, prefer pooled connections for better performance
    if (this.isServerless() || this.isVercel()) {
      return (
        process.env.DATABASE_URL ||
        process.env.POSTGRES_PRISMA_URL ||
        process.env.DATABASE_URL_NON_POOLING ||
        ""
      );
    }
    // For local development, use non-pooling URL or regular URL
    return (
      process.env.DATABASE_URL_NON_POOLING || process.env.DATABASE_URL || ""
    );
  }

  /**
   * Get database connection pool configuration
   * @returns {object} - Connection pool settings
   */
  static getConnectionPoolConfig() {
    const isServerlessEnv = this.isServerless() || this.isVercel();

    // Default values based on environment
    const defaults = {
      connectionLimit: isServerlessEnv ? 5 : 10,
      idleTimeout: isServerlessEnv ? 30000 : 60000,
      maxLifetime: isServerlessEnv ? 300000 : 600000,
      pool: {
        min: isServerlessEnv ? 0 : 2,
        max: isServerlessEnv ? 5 : 10,
        acquireTimeoutMillis: 10000,
        createTimeoutMillis: 10000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: isServerlessEnv ? 30000 : 60000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
      },
    };

    // Override with environment variables if provided
    return {
      connectionLimit: defaults.connectionLimit,
      idleTimeout: defaults.idleTimeout,
      maxLifetime: defaults.maxLifetime,
      pool: {
        min: process.env.DB_POOL_MIN
          ? parseInt(process.env.DB_POOL_MIN)
          : defaults.pool.min,
        max: process.env.DB_POOL_MAX
          ? parseInt(process.env.DB_POOL_MAX)
          : defaults.pool.max,
        acquireTimeoutMillis: process.env.DB_POOL_ACQUIRE_TIMEOUT
          ? parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT)
          : defaults.pool.acquireTimeoutMillis,
        createTimeoutMillis: defaults.pool.createTimeoutMillis,
        destroyTimeoutMillis: defaults.pool.destroyTimeoutMillis,
        idleTimeoutMillis: process.env.DB_POOL_IDLE_TIMEOUT
          ? parseInt(process.env.DB_POOL_IDLE_TIMEOUT)
          : defaults.pool.idleTimeoutMillis,
        reapIntervalMillis: defaults.pool.reapIntervalMillis,
        createRetryIntervalMillis: defaults.pool.createRetryIntervalMillis,
      },
    };
  }

  /**
   * Get serverless-specific configuration
   * @returns {object} - The serverless-specific configuration
   */
  static getConfig() {
    const isServerlessEnv = this.isServerless() || this.isVercel();

    return {
      isServerless: this.isServerless(),
      isVercel: this.isVercel(),
      databaseUrl: this.getDatabaseUrl(),
      // Enable connection pooling for all environments, with different configs
      enableConnectionPooling: true,
      connectionPool: this.getConnectionPoolConfig(),
      // Reduce logging in production for better performance
      logLevel: isServerlessEnv ? "error" : process.env.LOG_LEVEL || "info",
      // Query timeout settings
      queryTimeout: process.env.DB_QUERY_TIMEOUT
        ? parseInt(process.env.DB_QUERY_TIMEOUT)
        : isServerlessEnv
          ? 10000
          : 30000, // 10s for serverless, 30s for regular
      // Transaction timeout
      transactionTimeout: process.env.DB_TRANSACTION_TIMEOUT
        ? parseInt(process.env.DB_TRANSACTION_TIMEOUT)
        : isServerlessEnv
          ? 15000
          : 45000, // 15s for serverless, 45s for regular
    };
  }
}
