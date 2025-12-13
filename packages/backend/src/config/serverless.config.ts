import { Injectable } from "@nestjs/common";

@Injectable()
export class ServerlessConfig {
  /**
   * Check if the application is running in a serverless environment
   * @returns {boolean} - Whether the application is running in a serverless environment
   */
  static isServerless(): boolean {
    // No longer using Vercel - always return false for serverless mode
    return false;
  }

  /**
   * Get the appropriate database URL for the environment
   * @returns {string} - The appropriate database URL for the environment
   */
  static getDatabaseUrl(): string {
    // Use DATABASE_URL for all environments
    return process.env.DATABASE_URL || "";
  }

  /**
   * Get database connection pool configuration
   * @returns {object} - Connection pool settings
   */
  static getConnectionPoolConfig() {
    const isServerlessEnv = this.isServerless();

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
    const isServerlessEnv = this.isServerless();

    return {
      isServerless: this.isServerless(),
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
