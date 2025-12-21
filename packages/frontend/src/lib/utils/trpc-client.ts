/**
 * tRPC Client for backend testing dashboard
 * Handles communication with backend services via tRPC
 */

/** Type for request parameters */
type RequestParameterValue =
  | string
  | number
  | boolean
  | object
  | null
  | undefined;

/** Generic response type from tRPC */
interface TRPCResponse {
  result?: {
    data: unknown;
  };
  error?: {
    message: string;
    code?: string;
  };
  [key: string]: unknown;
}

/** Health check response type */
interface HealthResponse {
  status?: string;
  healthy?: boolean;
  timestamp?: string;
  [key: string]: unknown;
}

/** Service definition response */
interface ServiceDefinitionsResponse {
  services?: string[];
  methods?: Record<string, string[]>;
  [key: string]: unknown;
}

/**
 * tRPC Client class for making requests to the backend
 * Provides methods for health checks, service calls, and connection testing
 */
export class TrpcClient {
  private baseUrl: string;

  constructor() {
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
    parameters: Record<string, RequestParameterValue> = {},
  ): Promise<TRPCResponse> {
    try {
      let url = `${this.baseUrl}/${service}.${method}`;

      const requestOptions: RequestInit = {
        method: type === "mutation" ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      };

      if (type === "mutation") {
        requestOptions.body = JSON.stringify({ input: parameters });
      } else if (Object.keys(parameters).length > 0) {
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
  async getServiceDefinitions(): Promise<ServiceDefinitionsResponse> {
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
  async healthCheck(): Promise<HealthResponse> {
    return this.executeRequest("health", "health", "query");
  }

  /**
   * Execute a ping test
   * @returns Promise with ping response
   */
  async ping(): Promise<HealthResponse> {
    return this.executeRequest("health", "ping", "query");
  }

  /**
   * Get detailed health information
   * @returns Promise with detailed health status
   */
  async getDetailedHealth(): Promise<HealthResponse> {
    return this.executeRequest("health", "healthDetailed", "query");
  }

  /**
   * Check database health
   * @returns Promise with database health status
   */
  async checkDatabaseHealth(): Promise<HealthResponse> {
    return this.executeRequest("health", "healthDatabase", "query");
  }

  /**
   * Check Redis health
   * @returns Promise with Redis health status
   */
  async checkRedisHealth(): Promise<HealthResponse> {
    return this.executeRequest("health", "healthRedis", "query");
  }

  /**
   * Check memory health
   * @returns Promise with memory health status
   */
  async checkMemoryHealth(): Promise<HealthResponse> {
    return this.executeRequest("health", "healthMemory", "query");
  }

  /**
   * Check system health
   * @returns Promise with system health status
   */
  async checkSystemHealth(): Promise<HealthResponse> {
    return this.executeRequest("health", "healthSystem", "query");
  }

  /**
   * Check readiness probe
   * @returns Promise with readiness status
   */
  async checkReadiness(): Promise<HealthResponse> {
    return this.executeRequest("health", "healthReady", "query");
  }

  /**
   * Check liveness probe
   * @returns Promise with liveness status
   */
  async checkLiveness(): Promise<HealthResponse> {
    return this.executeRequest("health", "healthLive", "query");
  }
}
