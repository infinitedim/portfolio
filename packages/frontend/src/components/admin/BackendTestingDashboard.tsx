/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, JSX } from "react";
import type { ThemeConfig } from "@portfolio/frontend/src/types/theme";
import { ServiceSelector } from "./testing/ServiceSelector";
import { MethodSelector } from "./testing/MethodSelector";
import { ParameterInput } from "./testing/ParameterInput";
import { RequestResponsePanel } from "./testing/RequestResponsePanel";
import { GrpcClient } from "./testing/GrpcClient";
import { ErrorHandler } from "./testing/ErrorHandler";
import { ValidationUtils } from "./testing/ValidationUtils";

interface BackendTestingDashboardProps {
  themeConfig: ThemeConfig;
}

// Define the available services and their methods
export interface ServiceMethod {
  name: string;
  type: "query" | "mutation";
  httpMethod: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  description: string;
}

export interface Service {
  name: string;
  displayName: string;
  description: string;
  methods: ServiceMethod[];
}

const availableServices: Service[] = [
  {
    name: "health",
    displayName: "Health Check",
    description: "System health and status endpoints",
    methods: [
      {
        name: "health",
        type: "query",
        httpMethod: "GET",
        description: "Basic health check for load balancers",
      },
      {
        name: "healthDetailed",
        type: "query",
        httpMethod: "GET",
        description: "Comprehensive health check with all system details",
      },
      {
        name: "healthDatabase",
        type: "query",
        httpMethod: "GET",
        description: "Database-specific health check",
      },
      {
        name: "healthRedis",
        type: "query",
        httpMethod: "GET",
        description: "Redis-specific health check",
      },
      {
        name: "healthMemory",
        type: "query",
        httpMethod: "GET",
        description: "Memory usage health check",
      },
      {
        name: "healthSystem",
        type: "query",
        httpMethod: "GET",
        description: "System information health check",
      },
      {
        name: "healthReady",
        type: "query",
        httpMethod: "GET",
        description: "Readiness probe for Kubernetes",
      },
      {
        name: "healthLive",
        type: "query",
        httpMethod: "GET",
        description: "Liveness probe for Kubernetes",
      },
      {
        name: "ping",
        type: "query",
        httpMethod: "GET",
        description: "Simple ping endpoint",
      },
    ],
  },
  {
    name: "auth",
    displayName: "Authentication",
    description: "User authentication and authorization",
    methods: [
      {
        name: "login",
        type: "mutation",
        httpMethod: "POST",
        parameters: [
          {
            name: "email",
            type: "string",
            required: true,
            description: "User email",
          },
          {
            name: "password",
            type: "string",
            required: true,
            description: "User password",
          },
        ],
        description: "Authenticate user with email and password",
      },
      {
        name: "spotifyLogin",
        type: "mutation",
        httpMethod: "POST",
        parameters: [
          {
            name: "code",
            type: "string",
            required: true,
            description: "Spotify authorization code",
          },
        ],
        description: "Authenticate user with Spotify OAuth",
      },
    ],
  },
  {
    name: "projects",
    displayName: "Projects",
    description: "Project management and data",
    methods: [
      {
        name: "get",
        type: "query",
        httpMethod: "GET",
        parameters: [
          {
            name: "section",
            type: "string",
            required: false,
            description: "Section to retrieve",
          },
          {
            name: "limit",
            type: "number",
            required: false,
            description: "Number of items to return",
          },
        ],
        description: "Get projects data",
      },
      {
        name: "update",
        type: "mutation",
        httpMethod: "POST",
        parameters: [
          {
            name: "section",
            type: "string",
            required: true,
            description: "Section to update",
          },
          {
            name: "data",
            type: "object",
            required: true,
            description: "Data to update",
          },
        ],
        description: "Update projects data",
      },
    ],
  },
  {
    name: "spotify",
    displayName: "Spotify Integration",
    description: "Spotify API integration services",
    methods: [
      {
        name: "getCurrentTrack",
        type: "query",
        httpMethod: "GET",
        description: "Get currently playing track",
      },
      {
        name: "getRecentlyPlayed",
        type: "query",
        httpMethod: "GET",
        parameters: [
          {
            name: "limit",
            type: "number",
            required: false,
            description: "Number of tracks to return",
          },
        ],
        description: "Get recently played tracks",
      },
    ],
  },
  {
    name: "security",
    displayName: "Security",
    description: "Security and audit logging",
    methods: [
      {
        name: "getAuditLogs",
        type: "query",
        httpMethod: "GET",
        parameters: [
          {
            name: "limit",
            type: "number",
            required: false,
            description: "Number of logs to return",
          },
          {
            name: "level",
            type: "string",
            required: false,
            description: "Log level filter",
          },
        ],
        description: "Get security audit logs",
      },
    ],
  },
];

/**
 *
 * @param {ThemeConfig} themeConfig - Theme configuration for styling
 * @returns {JSX.Element} - The BackendTestingDashboard component
 * @description Admin dashboard for testing backend services and methods via gRPC
 */
export function BackendTestingDashboard({
  themeConfig,
}: BackendTestingDashboardProps): JSX.Element {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<ServiceMethod | null>(
    null,
  );
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [requestLog, setRequestLog] = useState<string>("");
  const [responseLog, setResponseLog] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [grpcClient, setGrpcClient] = useState<GrpcClient | null>(null);
  const [_hasErrors, setHasErrors] = useState(false);

  useEffect(() => {
    // Initialize gRPC client
    const client = new GrpcClient();
    setGrpcClient(client);
  }, []);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedMethod(null);
    setParameters({});
  };

  const handleMethodSelect = (method: ServiceMethod) => {
    setSelectedMethod(method);
    // Initialize parameters with default values
    const defaultParams: Record<string, any> = {};
    method.parameters?.forEach((param) => {
      if (param.type === "number") {
        defaultParams[param.name] = 0;
      } else if (param.type === "boolean") {
        defaultParams[param.name] = false;
      } else {
        defaultParams[param.name] = "";
      }
    });
    setParameters(defaultParams);
  };

  const handleParameterChange = (name: string, value: any) => {
    setParameters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const executeRequest = async () => {
    if (!selectedService || !selectedMethod || !grpcClient) return;

    setIsLoading(true);
    setRequestLog("");
    setResponseLog("");

    try {
      // Validate service and method
      const serviceValidation = ValidationUtils.validateServiceMethod(
        selectedService.name,
        selectedMethod.name,
      );

      if (!serviceValidation.isValid) {
        setResponseLog(
          JSON.stringify(
            {
              error: true,
              message: "Service validation failed",
              validationErrors: serviceValidation.errors,
              validationWarnings: serviceValidation.warnings,
              timestamp: new Date().toISOString(),
            },
            null,
            2,
          ),
        );
        return;
      }

      // Initialize parameters for the request
      let requestParameters = parameters;

      // Validate parameters if they exist
      if (selectedMethod.parameters && selectedMethod.parameters.length > 0) {
        const parameterValidations = ValidationUtils.validateParameters(
          selectedMethod.parameters,
          parameters,
        );

        const invalidParameters = parameterValidations.filter(
          (p) => !p.isValid,
        );
        if (invalidParameters.length > 0) {
          setResponseLog(
            JSON.stringify(
              {
                error: true,
                message: "Parameter validation failed",
                invalidParameters: invalidParameters.map((p) => ({
                  name: p.name,
                  error: p.error,
                  expectedType: p.type,
                  receivedValue: p.value,
                })),
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            ),
          );
          return;
        }

        // Sanitize parameters
        const sanitizedParameters: Record<string, any> = {};
        selectedMethod.parameters.forEach((param) => {
          const value = parameters[param.name];
          sanitizedParameters[param.name] = ValidationUtils.sanitizeValue(
            value,
            param.type,
          );
        });

        // Validate payload size
        const payloadValidation =
          ValidationUtils.validatePayloadSize(sanitizedParameters);
        if (!payloadValidation.isValid) {
          setResponseLog(
            JSON.stringify(
              {
                error: true,
                message: "Payload validation failed",
                validationErrors: payloadValidation.errors,
                validationWarnings: payloadValidation.warnings,
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            ),
          );
          return;
        }

        // Use sanitized parameters for the request
        requestParameters = sanitizedParameters;
      }

      // Log the request
      const requestData = {
        service: selectedService.name,
        method: selectedMethod.name,
        type: selectedMethod.type,
        httpMethod: selectedMethod.httpMethod,
        parameters: requestParameters,
        timestamp: new Date().toISOString(),
      };

      setRequestLog(JSON.stringify(requestData, null, 2));

      // Execute the request via tRPC
      const response = await grpcClient.executeRequest(
        selectedService.name,
        selectedMethod.name,
        selectedMethod.type,
        requestParameters,
      );

      setResponseLog(JSON.stringify(response, null, 2));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Enhanced error handling with suggestions
      let suggestions: string[] = [];
      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError")
      ) {
        suggestions = [
          "Check if the backend server is running on http://localhost:4000",
          "Verify the API endpoint configuration",
          "Check network connectivity",
          "Ensure CORS is properly configured",
        ];
      } else if (
        errorMessage.includes("404") ||
        errorMessage.includes("Not Found")
      ) {
        suggestions = [
          "The requested endpoint does not exist",
          "Check if the service and method names are correct",
          "Verify the tRPC router configuration",
        ];
      } else if (
        errorMessage.includes("500") ||
        errorMessage.includes("Internal Server Error")
      ) {
        suggestions = [
          "Backend server encountered an error",
          "Check backend logs for detailed error information",
          "Verify database and Redis connections",
        ];
      }

      setResponseLog(
        JSON.stringify(
          {
            error: true,
            message: errorMessage,
            suggestions,
            timestamp: new Date().toISOString(),
          },
          null,
          2,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (_error: Error) => {
    // Log error through proper logging system
    setHasErrors(true);
  };

  const handleRecovery = () => {
    // Services recovered - reset error state
    setHasErrors(false);
  };

  return (
    <div className="space-y-6">
      {/* Error Handler */}
      <ErrorHandler
        themeConfig={themeConfig}
        onError={handleError}
        onRecovery={handleRecovery}
      />

      {/* Header */}
      <div
        className="border-b pb-4"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <div className="flex items-center space-x-3 mb-2">
          <span
            className="text-sm font-mono"
            style={{ color: themeConfig.colors.accent }}
          >
            admin@portfolio:~$
          </span>
          <span className="text-sm opacity-70">./testing.sh</span>
        </div>
        <h1
          className="text-2xl font-bold"
          style={{ color: themeConfig.colors.accent }}
        >
          Backend Testing Dashboard
        </h1>
        <p className="text-sm opacity-70 mt-1">
          Test backend services and methods with real-time gRPC communication
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Service and Method Selection */}
        <div className="lg:col-span-1 space-y-6">
          {/* Service Selector */}
          <div
            className="border rounded-lg p-4"
            style={{
              borderColor: themeConfig.colors.border,
              backgroundColor: themeConfig.colors.bg,
            }}
          >
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: themeConfig.colors.accent }}
            >
              🏗️ Service Selection
            </h2>
            <ServiceSelector
              services={availableServices}
              selectedService={selectedService}
              onServiceSelect={handleServiceSelect}
              themeConfig={themeConfig}
            />
          </div>

          {/* Method Selector */}
          {selectedService && (
            <div
              className="border rounded-lg p-4"
              style={{
                borderColor: themeConfig.colors.border,
                backgroundColor: themeConfig.colors.bg,
              }}
            >
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: themeConfig.colors.accent }}
              >
                ⚙️ Method Selection
              </h2>
              <MethodSelector
                methods={selectedService.methods}
                selectedMethod={selectedMethod}
                onMethodSelect={handleMethodSelect}
                themeConfig={themeConfig}
              />
            </div>
          )}

          {/* Parameter Input */}
          {selectedMethod &&
            selectedMethod.parameters &&
            selectedMethod.parameters.length > 0 && (
              <div
                className="border rounded-lg p-4"
                style={{
                  borderColor: themeConfig.colors.border,
                  backgroundColor: themeConfig.colors.bg,
                }}
              >
                <h2
                  className="text-lg font-semibold mb-4"
                  style={{ color: themeConfig.colors.accent }}
                >
                  📝 Parameters
                </h2>
                <ParameterInput
                  parameters={selectedMethod.parameters}
                  values={parameters}
                  onChange={handleParameterChange}
                  themeConfig={themeConfig}
                />
              </div>
            )}

          {/* Execute Button */}
          {selectedService && selectedMethod && (
            <div
              className="border rounded-lg p-4"
              style={{
                borderColor: themeConfig.colors.border,
                backgroundColor: themeConfig.colors.bg,
              }}
            >
              <button
                onClick={executeRequest}
                disabled={isLoading}
                className={`w-full p-3 rounded font-mono text-sm transition-all duration-200 ${
                  isLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-105"
                }`}
                style={{
                  backgroundColor: themeConfig.colors.accent,
                  color: themeConfig.colors.bg,
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Executing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>🚀</span>
                    <span>Execute Request</span>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Panel - Request/Response Logs */}
        <div className="lg:col-span-2">
          <RequestResponsePanel
            requestLog={requestLog}
            responseLog={responseLog}
            isLoading={isLoading}
            themeConfig={themeConfig}
          />
        </div>
      </div>
    </div>
  );
}
