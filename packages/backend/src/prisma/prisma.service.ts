import type {
  INestApplication,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { Injectable, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { ServerlessConfig } from "../config/serverless.config";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly config = ServerlessConfig.getConfig();
  private connectionAttempts = 0;
  private readonly maxConnectionAttempts = 3;
  private isConnected = false;
  private isConnecting = false;
  private disconnectTimeout: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastConnectionTime: Date | null = null;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    const config = ServerlessConfig.getConfig();

    super({
      // Optimize for serverless environments with connection pooling
      datasources: {
        db: {
          url: config.databaseUrl,
        },
      },
      // Enhanced logging configuration
      log: config.logLevel === "debug" ? ["query", "error", "warn"] : ["error"],
      // Error handling configuration
      errorFormat: "pretty",
    });

    // Set up error handling for connection issues
    this.$on("error", (e: unknown) => {
      this.logger.error("Prisma Client Error:", e);
      this.isConnected = false;
      this.handleConnectionError(e instanceof Error ? e : new Error(String(e)));
    });

    // Set up info logging for connection events in development
    if (config.logLevel === "debug") {
      this.$on("info", (e: unknown) => {
        this.logger.debug("Prisma Client Info:", e);
      });
    }
  }

  async onModuleInit(): Promise<void> {
    await this.connectWithRetry();
    this.startPeriodicHealthCheck();
  }

  async onModuleDestroy(): Promise<void> {
    await this.cleanupAndDisconnect();
  }

  /**
   * Connect to database with retry logic and proper cleanup
   */
  private async connectWithRetry(): Promise<void> {
    // If already connecting, wait for existing connection attempt
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    // If already connected, return immediately
    if (this.isConnected) {
      return;
    }

    this.isConnecting = true;
    this.resetConnectionAttempts();

    this.connectionPromise = this.performConnection();

    try {
      await this.connectionPromise;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  /**
   * Perform the actual connection with retry logic
   */
  private async performConnection(): Promise<void> {
    while (this.connectionAttempts < this.maxConnectionAttempts) {
      try {
        await this.$connect();
        this.isConnected = true;
        this.lastConnectionTime = new Date();
        this.logger.log("Successfully connected to database");
        this.resetConnectionAttempts();
        return;
      } catch (error) {
        this.connectionAttempts++;
        this.isConnected = false;
        this.logger.error(
          `Database connection attempt ${this.connectionAttempts} failed:`,
          error,
        );

        if (this.connectionAttempts >= this.maxConnectionAttempts) {
          this.resetConnectionAttempts();
          throw new Error(
            `Failed to connect to database after ${this.maxConnectionAttempts} attempts: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

        // Exponential backoff with jitter
        const baseDelay = 1000 * Math.pow(2, this.connectionAttempts - 1);
        const jitter = Math.random() * 1000;
        const delay = Math.min(baseDelay + jitter, 5000);

        this.logger.warn(`Retrying connection in ${Math.round(delay)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Reset connection attempts counter
   */
  private resetConnectionAttempts(): void {
    this.connectionAttempts = 0;
  }

  /**
   * Comprehensive cleanup and disconnect with proper resource management
   */
  private async cleanupAndDisconnect(): Promise<void> {
    this.logger.log("Starting comprehensive database cleanup...");

    // Clear all timers first
    this.clearAllTimers();

    // Mark as disconnected to prevent new operations
    this.isConnected = false;

    try {
      // Wait for any pending queries to complete (with timeout)
      const disconnectPromise = this.performGracefulDisconnect();
      const timeoutPromise = new Promise<void>((_resolve, reject) =>
        setTimeout(
          () => reject(new Error("Disconnect timeout after 10s")),
          10000,
        ),
      );

      await Promise.race([disconnectPromise, timeoutPromise]);
      this.logger.log("Successfully disconnected from database");
    } catch (error) {
      this.logger.error("Error during database disconnect:", error);
      // Force disconnect if graceful disconnect fails
      await this.performForceDisconnect();
    } finally {
      // Reset all connection state
      this.resetConnectionState();
    }
  }

  /**
   * Perform graceful disconnect
   */
  private async performGracefulDisconnect(): Promise<void> {
    if (this.isConnected) {
      await this.$disconnect();
    }
  }

  /**
   * Force disconnect when graceful disconnect fails
   */
  private async performForceDisconnect(): Promise<void> {
    try {
      this.logger.warn("Attempting force disconnect...");
      await this.$disconnect();
      this.logger.log("Force disconnect successful");
    } catch (forceError) {
      this.logger.error("Force disconnect also failed:", forceError);
      // At this point, we've done everything we can
    }
  }

  /**
   * Clear all active timers and prevent memory leaks
   */
  private clearAllTimers(): void {
    if (this.disconnectTimeout) {
      clearTimeout(this.disconnectTimeout);
      this.disconnectTimeout = null;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Clear any pending reconnection timers
    this.clearReconnectionTimer();
  }

  /**
   * Clear reconnection timer to prevent memory leaks
   */
  private clearReconnectionTimer(): void {
    if (this.disconnectTimeout) {
      clearTimeout(this.disconnectTimeout);
      this.disconnectTimeout = null;
    }
  }

  /**
   * Enhanced connection state reset with memory cleanup
   */
  private resetConnectionState(): void {
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.lastConnectionTime = null;
    this.resetConnectionAttempts();

    // Clear any cached queries or transactions
    this.clearQueryCache();
  }

  /**
   * Clear query cache to prevent memory accumulation
   */
  private clearQueryCache(): void {
    // Force garbage collection of any cached queries
    if (typeof global.gc === "function") {
      try {
        global.gc();
      } catch (_error) {
        // GC not available, that's fine
      }
    }
  }

  /**
   * Handle connection errors with proper cleanup
   */
  private handleConnectionError(error: Error): void {
    this.logger.error("Connection error detected, initiating cleanup:", error);
    this.isConnected = false;

    // Attempt reconnection after a delay if not shutting down
    if (!this.disconnectTimeout) {
      this.scheduleReconnection();
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnection(): void {
    this.disconnectTimeout = setTimeout(async () => {
      if (!this.isConnected && !this.isConnecting) {
        this.logger.log("Attempting automatic reconnection...");
        try {
          await this.connectWithRetry();
        } catch (error) {
          this.logger.error("Automatic reconnection failed:", error);
        }
      }
      this.disconnectTimeout = null;
    }, 5000);
  }

  /**
   * Start periodic health check
   */
  private startPeriodicHealthCheck(): void {
    // Only enable health checks in long-running environments
    if (this.config.isServerless || this.config.isVercel) {
      return;
    }

    this.healthCheckInterval = setInterval(async () => {
      const health = await this.healthCheck();
      if (!health.isHealthy) {
        this.logger.warn(
          "Database health check failed, attempting reconnection",
        );
        this.isConnected = false;
        this.scheduleReconnection();
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Enhanced health check for database connection
   */
  async healthCheck(): Promise<{
    isHealthy: boolean;
    status: string;
    latency?: number;
    error?: string;
    lastConnection?: Date;
  }> {
    try {
      const start = Date.now();
      await this.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return {
        isHealthy: true,
        status: "healthy",
        latency,
        lastConnection: this.lastConnectionTime || undefined,
      };
    } catch (error) {
      this.logger.error("Database health check failed:", error);
      this.isConnected = false;

      return {
        isHealthy: false,
        status: "unhealthy",
        error: error instanceof Error ? error.message : String(error),
        lastConnection: this.lastConnectionTime || undefined,
      };
    }
  }

  /**
   * Execute query with automatic retry for transient failures and connection management
   * @param operation
   * @param maxRetries
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 2,
  ): Promise<T> {
    // Ensure we're connected before attempting operation
    if (!this.isConnected && !this.isConnecting) {
      await this.connectWithRetry();
    }

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable (connection issues, timeouts, etc.)
        const isRetryable = this.isRetryableError(error as Error);

        if (!isRetryable || attempt === maxRetries) {
          // If it's a connection error, mark as disconnected
          if (this.isConnectionError(error as Error)) {
            this.isConnected = false;
            this.handleConnectionError(error as Error);
          }
          throw error;
        }

        // For connection errors, attempt to reconnect
        if (this.isConnectionError(error as Error)) {
          this.isConnected = false;
          this.logger.warn(
            "Connection error detected, attempting reconnection",
          );

          try {
            await this.connectWithRetry();
          } catch (reconnectError) {
            this.logger.error("Reconnection failed:", reconnectError);
            // Continue with retry logic
          }
        }

        // Exponential backoff for retries with jitter
        const baseDelay = 500 * Math.pow(2, attempt);
        const jitter = Math.random() * 500;
        const delay = Math.min(baseDelay + jitter, 3000);

        await new Promise((resolve) => setTimeout(resolve, delay));

        this.logger.warn(
          `Retrying database operation (attempt ${attempt + 1}/${maxRetries + 1})`,
        );
      }
    }

    throw lastError!;
  }

  /**
   * Check if an error is retryable
   * @param error
   */
  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      "connection",
      "timeout",
      "network",
      "ECONNRESET",
      "ENOTFOUND",
      "ETIMEDOUT",
      "ECONNREFUSED",
      "connection terminated unexpectedly",
      "server closed the connection unexpectedly",
      "connection timeout",
      "query timeout",
      "connection lost",
      "connection dropped",
    ];

    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some((keyword) => errorMessage.includes(keyword));
  }

  /**
   * Check if an error is specifically a connection error
   * @param error
   */
  private isConnectionError(error: Error): boolean {
    const connectionErrors = [
      "connection",
      "ECONNRESET",
      "ENOTFOUND",
      "ETIMEDOUT",
      "ECONNREFUSED",
      "connection terminated unexpectedly",
      "server closed the connection unexpectedly",
      "connection lost",
      "connection dropped",
    ];

    const errorMessage = error.message.toLowerCase();
    return connectionErrors.some((keyword) => errorMessage.includes(keyword));
  }

  /**
   * Get connection status information
   */
  getConnectionStatus(): {
    isConnected: boolean;
    isConnecting: boolean;
    lastConnectionTime: Date | null;
    connectionAttempts: number;
  } {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      lastConnectionTime: this.lastConnectionTime,
      connectionAttempts: this.connectionAttempts,
    };
  }

  /**
   * Enable shutdown hooks with comprehensive cleanup
   */
  async enableShutdownHooks(app: INestApplication): Promise<void> {
    this.$("beforeExit" as never, async (): Promise<void> => {
      this.logger.log("Received beforeExit event, closing application...");
      await this.cleanupAndDisconnect();
      await app.close();
    });

    // Handle process termination signals with proper cleanup
    const gracefulShutdown = async (signal: string) => {
      this.logger.log(`Received ${signal}, gracefully shutting down...`);

      try {
        await this.cleanupAndDisconnect();
        this.logger.log("Database cleanup completed successfully");
      } catch (error) {
        this.logger.error("Error during database cleanup:", error);
      } finally {
        process.exit(0);
      }
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

    // Handle uncaught exceptions and unhandled rejections
    process.on("uncaughtException", async (error) => {
      this.logger.error(
        "Uncaught exception, performing emergency cleanup:",
        error,
      );
      try {
        await this.performForceDisconnect();
      } catch (cleanupError) {
        this.logger.error("Emergency cleanup failed:", cleanupError);
      }
      process.exit(1);
    });

    process.on("unhandledRejection", async (reason) => {
      this.logger.error(
        "Unhandled rejection, performing emergency cleanup:",
        reason,
      );
      try {
        await this.performForceDisconnect();
      } catch (cleanupError) {
        this.logger.error("Emergency cleanup failed:", cleanupError);
      }
      process.exit(1);
    });
  }

  /**
   * Force cleanup - emergency disconnect for critical errors
   */
  async emergencyCleanup(): Promise<void> {
    this.logger.warn("Performing emergency database cleanup...");

    this.clearAllTimers();
    this.resetConnectionState();

    try {
      await this.performForceDisconnect();
    } catch (error) {
      this.logger.error("Emergency cleanup failed:", error);
    }
  }
}
