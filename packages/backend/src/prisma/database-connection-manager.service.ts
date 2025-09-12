import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ServerlessConfig } from "../config/serverless.config";

export interface ConnectionPoolStats {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  waitingClients: number;
  maxConnections: number;
}

export interface ConnectionHealthStatus {
  isHealthy: boolean;
  latency?: number;
  error?: string;
  timestamp: Date;
}

@Injectable()
export class DatabaseConnectionManager {
  private readonly logger = new Logger(DatabaseConnectionManager.name);
  private readonly config = ServerlessConfig.getConfig();
  private connections: Map<string, PrismaService> = new Map();
  private connectionPool: PrismaService[] = [];
  private isInitialized = false;

  // Connection pool configuration
  private readonly poolConfig = {
    min: this.config.connectionPool.pool.min,
    max: this.config.connectionPool.pool.max,
    acquireTimeoutMs: this.config.connectionPool.pool.acquireTimeoutMillis,
    idleTimeoutMs: this.config.connectionPool.pool.idleTimeoutMillis,
  };

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Initialize the connection pool
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.logger.log("Initializing database connection pool...");

    try {
      // Create minimum number of connections
      for (let i = 0; i < this.poolConfig.min; i++) {
        const connection = await this.createConnection();
        this.connectionPool.push(connection);
      }

      this.isInitialized = true;
      this.logger.log(
        `Database connection pool initialized with ${this.poolConfig.min} connections`,
      );

      // Start connection health monitoring
      this.startHealthMonitoring();
    } catch (error) {
      this.logger.error("Failed to initialize connection pool:", error);
      throw error;
    }
  }

  /**
   * Get a connection from the pool
   */
  async getConnection(): Promise<PrismaService> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // For serverless environments, return the main connection
    if (this.config.isServerless || this.config.isVercel) {
      return this.prismaService;
    }

    // Try to get an idle connection from the pool
    if (this.connectionPool.length > 0) {
      return this.connectionPool.pop()!;
    }

    // If pool is empty and we haven't reached max, create a new connection
    if (this.connections.size < this.poolConfig.max) {
      this.logger.debug("Creating new connection for pool");
      return await this.createConnection();
    }

    // Wait for a connection to become available
    return await this.waitForConnection();
  }

  /**
   * Release a connection back to the pool with enhanced cleanup
   * @param connection
   */
  async releaseConnection(connection: PrismaService): Promise<void> {
    // For serverless environments, don't pool connections
    if (this.config.isServerless || this.config.isVercel) {
      return;
    }

    try {
      // Check if connection is still healthy
      const healthStatus = await this.checkConnectionHealth(connection);

      if (
        healthStatus.isHealthy &&
        this.connectionPool.length < this.poolConfig.max
      ) {
        this.connectionPool.push(connection);
        this.logger.debug("Connection returned to pool");
      } else {
        // Close unhealthy or excess connections
        await this.closeConnection(connection);
        this.logger.debug("Connection closed (unhealthy or excess)");
      }
    } catch (error) {
      this.logger.error("Error releasing connection:", error);
      // Ensure connection is cleaned up even if there's an error
      await this.closeConnection(connection);
    }
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats(): ConnectionPoolStats {
    return {
      activeConnections: this.connections.size - this.connectionPool.length,
      idleConnections: this.connectionPool.length,
      totalConnections: this.connections.size,
      waitingClients: 0, // This would require more complex tracking
      maxConnections: this.poolConfig.max,
    };
  }

  /**
   * Check overall database health
   */
  async checkDatabaseHealth(): Promise<ConnectionHealthStatus> {
    try {
      const start = Date.now();
      await this.prismaService.$queryRaw`SELECT 1 as health_check`;
      const latency = Date.now() - start;

      return {
        isHealthy: true,
        latency,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error("Database health check failed:", error);
      return {
        isHealthy: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };
    }
  }

  /**
   * Gracefully shutdown all connections
   */
  async shutdown(): Promise<void> {
    this.logger.log("Shutting down database connection pool...");

    // Close all pooled connections
    await Promise.all(
      this.connectionPool.map((connection) => this.closeConnection(connection)),
    );

    // Close all tracked connections
    await Promise.all(
      Array.from(this.connections.values()).map((connection) =>
        this.closeConnection(connection),
      ),
    );

    this.connectionPool = [];
    this.connections.clear();
    this.isInitialized = false;

    this.logger.log("Database connection pool shutdown complete");
  }

  /**
   * Execute a database operation with automatic connection management
   * @param operation
   */
  async executeWithConnection<T>(
    operation: (prisma: PrismaService) => Promise<T>,
  ): Promise<T> {
    const connection = await this.getConnection();

    try {
      return await connection.executeWithRetry(() => operation(connection));
    } finally {
      await this.releaseConnection(connection);
    }
  }

  // Private methods

  private async createConnection(): Promise<PrismaService> {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Note: In a real implementation, you might want to create separate PrismaClient instances
    // For now, we'll reuse the main service but track it
    this.connections.set(connectionId, this.prismaService);

    return this.prismaService;
  }

  private async closeConnection(connection: PrismaService): Promise<void> {
    try {
      // Remove from connections map
      for (const [id, conn] of this.connections.entries()) {
        if (conn === connection) {
          this.connections.delete(id);
          break;
        }
      }

      // Note: Don't actually disconnect the main service
      // In a real pool implementation, you'd have separate instances
    } catch (error) {
      this.logger.error("Error closing connection:", error);
    }
  }

  private async waitForConnection(): Promise<PrismaService> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection acquisition timeout"));
      }, this.poolConfig.acquireTimeoutMs);

      // Simple retry mechanism
      const checkForConnection = () => {
        if (this.connectionPool.length > 0) {
          clearTimeout(timeout);
          resolve(this.connectionPool.pop()!);
        } else {
          setTimeout(checkForConnection, 100);
        }
      };

      checkForConnection();
    });
  }

  private async checkConnectionHealth(
    connection: PrismaService,
  ): Promise<ConnectionHealthStatus> {
    try {
      const start = Date.now();
      await connection.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return {
        isHealthy: true,
        latency,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        isHealthy: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };
    }
  }

  private startHealthMonitoring(): void {
    // Don't start monitoring in serverless environments
    if (this.config.isServerless || this.config.isVercel) {
      return;
    }

    // Run health checks every 30 seconds
    setInterval(async () => {
      try {
        const healthStatus = await this.checkDatabaseHealth();
        if (!healthStatus.isHealthy) {
          this.logger.warn("Database health check failed:", healthStatus.error);
          // Trigger connection pool cleanup on health failure
          await this.cleanupUnhealthyConnections();
        }
      } catch (error) {
        this.logger.error("Health monitoring error:", error);
      }
    }, 30000);

    // Clean up idle connections every 60 seconds
    setInterval(() => {
      this.cleanupIdleConnections();
    }, 60000);
  }

  private cleanupIdleConnections(): void {
    const stats = this.getPoolStats();

    // If we have too many idle connections, close some
    if (stats.idleConnections > this.poolConfig.min) {
      const connectionsToClose = stats.idleConnections - this.poolConfig.min;

      for (let i = 0; i < connectionsToClose; i++) {
        const connection = this.connectionPool.pop();
        if (connection) {
          this.closeConnection(connection);
        }
      }

      this.logger.debug(`Cleaned up ${connectionsToClose} idle connections`);
    }
  }

  /**
   * Clean up connections that are no longer healthy
   */
  private async cleanupUnhealthyConnections(): Promise<void> {
    const connectionsToRemove: PrismaService[] = [];

    // Check each connection in the pool
    for (const connection of this.connectionPool) {
      const health = await this.checkConnectionHealth(connection);
      if (!health.isHealthy) {
        connectionsToRemove.push(connection);
      }
    }

    // Remove unhealthy connections
    for (const connection of connectionsToRemove) {
      const index = this.connectionPool.indexOf(connection);
      if (index > -1) {
        this.connectionPool.splice(index, 1);
        await this.closeConnection(connection);
      }
    }

    if (connectionsToRemove.length > 0) {
      this.logger.debug(
        `Cleaned up ${connectionsToRemove.length} unhealthy connections`,
      );
    }
  }

  /**
   * Cleanup all connections and resources
   */
  async cleanup(): Promise<void> {
    this.logger.log("Starting database connection manager cleanup...");

    try {
      // Close all pooled connections
      const poolConnections = [...this.connectionPool];
      this.connectionPool.length = 0;

      for (const connection of poolConnections) {
        await this.closeConnection(connection);
      }

      // Clear all connection tracking
      this.connections.clear();

      this.logger.log(
        `Cleaned up ${poolConnections.length} pooled connections`,
      );
    } catch (error) {
      this.logger.error("Error during connection manager cleanup:", error);
    }
  }

  /**
   * Get detailed connection information for debugging
   */
  getConnectionInfo(): {
    poolStats: ConnectionPoolStats;
    config: {
      min: number;
      max: number;
      acquireTimeoutMs: number;
      idleTimeoutMs: number;
    };
    isInitialized: boolean;
  } {
    return {
      poolStats: this.getPoolStats(),
      config: {
        min: this.poolConfig.min,
        max: this.poolConfig.max,
        acquireTimeoutMs: this.poolConfig.acquireTimeoutMs,
        idleTimeoutMs: this.poolConfig.idleTimeoutMs,
      },
      isInitialized: this.isInitialized,
    };
  }
}
