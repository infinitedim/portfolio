/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * tRPC Client for backend testing dashboard
 * Handles communication with backend services via tRPC
 */
export class GrpcClient {
  private baseUrl: string;

  constructor() {
    // Use the tRPC endpoint directly
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/trpc`
      : "http://localhost:4000/trpc";
  }

  /**
   * Execute a request to the backend service via tRPC
   * @param service - The service name
   * @param method - The method name
   * @param type - The method type (query/mutation)
   * @param parameters - The parameters to send
   * @returns Promise with the response
   */
  async executeRequest(
    service: string,
    method: string,
    type: "query" | "mutation",
    parameters: Record<string, any> = {},
  ): Promise<any> {
    try {
      let url = `${this.baseUrl}/${service}.${method}`;

      const requestOptions: RequestInit = {
        method: type === "mutation" ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      };

      // Add parameters to request
      if (type === "mutation") {
        requestOptions.body = JSON.stringify({ input: parameters });
      } else if (Object.keys(parameters).length > 0) {
        // For queries, add parameters as URL search params
        const searchParams = new URLSearchParams();
        Object.entries(parameters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, String(value));
          }
        });
        const queryString = searchParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("tRPC request failed:", error);
      throw error;
    }
  }

  /**
   * Test the connection to the backend
   * @returns Promise with connection status
   */
  async testConnection(): Promise<{
    status: string;
    timestamp: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/health.health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        status: "connected",
        timestamp: new Date().toISOString(),
        ...data,
      };
    } catch (error) {
      console.error("Connection test failed:", error);
      return {
        status: "disconnected",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get available services and methods
   * @returns Promise with service definitions
   */
  async getServiceDefinitions(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/health.health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to get service definitions:", error);
      throw error;
    }
  }

  /**
   * Execute a health check
   * @returns Promise with health status
   */
  async healthCheck(): Promise<any> {
    return this.executeRequest("health", "health", "query");
  }

  /**
   * Execute a ping test
   * @returns Promise with ping response
   */
  async ping(): Promise<any> {
    return this.executeRequest("health", "ping", "query");
  }

  /**
   * Get detailed health information
   * @returns Promise with detailed health status
   */
  async getDetailedHealth(): Promise<any> {
    return this.executeRequest("health", "healthDetailed", "query");
  }

  /**
   * Check database health
   * @returns Promise with database health status
   */
  async checkDatabaseHealth(): Promise<any> {
    return this.executeRequest("health", "healthDatabase", "query");
  }

  /**
   * Check Redis health
   * @returns Promise with Redis health status
   */
  async checkRedisHealth(): Promise<any> {
    return this.executeRequest("health", "healthRedis", "query");
  }

  /**
   * Check memory health
   * @returns Promise with memory health status
   */
  async checkMemoryHealth(): Promise<any> {
    return this.executeRequest("health", "healthMemory", "query");
  }

  /**
   * Check system health
   * @returns Promise with system health status
   */
  async checkSystemHealth(): Promise<any> {
    return this.executeRequest("health", "healthSystem", "query");
  }

  /**
   * Check readiness probe
   * @returns Promise with readiness status
   */
  async checkReadiness(): Promise<any> {
    return this.executeRequest("health", "healthReady", "query");
  }

  /**
   * Check liveness probe
   * @returns Promise with liveness status
   */
  async checkLiveness(): Promise<any> {
    return this.executeRequest("health", "healthLive", "query");
  }
}
