 
"use client";

import { useState, useEffect, useCallback } from "react";
import type { ThemeConfig } from "@/types/theme";

interface ErrorHandlerProps {
  themeConfig: ThemeConfig;
  onError: (error: Error) => void;
  onRecovery: () => void;
}

interface ServiceStatus {
  backend: "connected" | "disconnected" | "checking";
  tRPC: "connected" | "disconnected" | "checking";
  database: "connected" | "disconnected" | "checking";
  redis: "connected" | "disconnected" | "checking";
}

/**
 *
 * @param root0
 * @param root0.themeConfig
 * @param root0.onError
 * @param root0.onRecovery
 */
export function ErrorHandler({
  themeConfig,
  onError,
  onRecovery,
}: ErrorHandlerProps) {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    backend: "checking",
    tRPC: "checking",
    database: "checking",
    redis: "checking",
  });
  const [lastError, setLastError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkServiceHealth = useCallback(async () => {
    setIsChecking(true);
    setLastError(null);

    try {
      const backendResponse = await fetch("http://localhost:4000/health", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      setServiceStatus((prev) => ({
        ...prev,
        backend: backendResponse.ok ? "connected" : "disconnected",
      }));

      const trpcResponse = await fetch(
        "http://localhost:4000/trpc/health.health",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      setServiceStatus((prev) => ({
        ...prev,
        tRPC: trpcResponse.ok ? "connected" : "disconnected",
      }));

      const dbResponse = await fetch(
        "http://localhost:4000/trpc/health.healthDatabase",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        setServiceStatus((prev) => ({
          ...prev,
          database: dbData.status === "healthy" ? "connected" : "disconnected",
        }));
      } else {
        setServiceStatus((prev) => ({ ...prev, database: "disconnected" }));
      }

      const redisResponse = await fetch(
        "http://localhost:4000/trpc/health.healthRedis",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (redisResponse.ok) {
        const redisData = await redisResponse.json();
        setServiceStatus((prev) => ({
          ...prev,
          redis: redisData.status === "healthy" ? "connected" : "disconnected",
        }));
      } else {
        setServiceStatus((prev) => ({ ...prev, redis: "disconnected" }));
      }

      const allConnected = Object.values(serviceStatus).every(
        (status) => status === "connected",
      );
      if (allConnected) {
        onRecovery();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setLastError(errorMessage);
      onError(new Error(`Service health check failed: ${errorMessage}`));
    } finally {
      setIsChecking(false);
    }
  }, [onError, onRecovery, serviceStatus]);

  useEffect(() => {
    checkServiceHealth();
  }, [checkServiceHealth]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "text-green-500";
      case "disconnected":
        return "text-red-500";
      case "checking":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return "🟢";
      case "disconnected":
        return "🔴";
      case "checking":
        return "🟡";
      default:
        return "⚪";
    }
  };

  const hasErrors =
    Object.values(serviceStatus).some((status) => status === "disconnected") ||
    lastError;

  if (!hasErrors) {
    return null;
  }

  return (
    <div
      className="border rounded-lg p-4 mb-6"
      style={{
        borderColor: themeConfig.colors.border,
        backgroundColor: themeConfig.colors.bg,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-lg font-semibold"
          style={{ color: themeConfig.colors.accent }}
        >
          🔧 Service Status Monitor
        </h3>
        <button
          onClick={checkServiceHealth}
          disabled={isChecking}
          className={`px-3 py-1 rounded text-sm font-mono transition-all duration-200 ${isChecking ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
            }`}
          style={{
            backgroundColor: themeConfig.colors.accent,
            color: themeConfig.colors.bg,
          }}
        >
          {isChecking ? "🔄 Checking..." : "🔄 Refresh"}
        </button>
      </div>

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {Object.entries(serviceStatus).map(([service, status]) => (
          <div
            key={service}
            className="flex items-center space-x-2 p-2 rounded border"
            style={{ borderColor: themeConfig.colors.border }}
          >
            <span className="text-sm">{getStatusIcon(status)}</span>
            <div>
              <div className="text-xs font-mono capitalize">{service}</div>
              <div className={`text-xs ${getStatusColor(status)}`}>
                {status}
              </div>
            </div>
          </div>
        ))}
      </div>

      {}
      {lastError && (
        <div className="mb-4 p-3 rounded border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
          <div className="text-sm font-mono text-red-700 dark:text-red-300">
            <strong>Error:</strong> {lastError}
          </div>
        </div>
      )}

      {}
      <div className="space-y-2">
        <h4
          className="text-sm font-semibold"
          style={{ color: themeConfig.colors.accent }}
        >
          🔍 Troubleshooting Guide
        </h4>
        <div className="text-xs space-y-1 opacity-80">
          {serviceStatus.backend === "disconnected" && (
            <div>
              • Backend server is not running. Start with:{" "}
              <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                bun run dev
              </code>
            </div>
          )}
          {serviceStatus.tRPC === "disconnected" && (
            <div>
              • tRPC endpoint is not accessible. Check backend configuration and
              CORS settings.
            </div>
          )}
          {serviceStatus.database === "disconnected" && (
            <div>
              • Database connection failed. Verify DATABASE_URL and Prisma
              configuration.
            </div>
          )}
          {serviceStatus.redis === "disconnected" && (
            <div>
              • Redis connection failed. Check UPSTASH_REDIS_REST_URL and
              UPSTASH_REDIS_REST_TOKEN.
            </div>
          )}
          <div>
            • Ensure all environment variables are properly set in{" "}
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
              .env
            </code>
          </div>
          <div>• Check browser console for detailed error messages</div>
          <div>• Verify network connectivity and firewall settings</div>
        </div>
      </div>

      {}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => window.open("http://localhost:4000/health", "_blank")}
          className="px-3 py-1 rounded text-xs font-mono border transition-all duration-200 hover:scale-105"
          style={{
            borderColor: themeConfig.colors.border,
            color: themeConfig.colors.accent,
          }}
        >
          📊 Health Dashboard
        </button>
        <button
          onClick={() =>
            window.open(
              "http://localhost:4000/trpc/health.healthDetailed",
              "_blank",
            )
          }
          className="px-3 py-1 rounded text-xs font-mono border transition-all duration-200 hover:scale-105"
          style={{
            borderColor: themeConfig.colors.border,
            color: themeConfig.colors.accent,
          }}
        >
          🔍 Detailed Health
        </button>
        <button
          onClick={() =>
            window.open(
              "http://localhost:4000/trpc/health.healthReady",
              "_blank",
            )
          }
          className="px-3 py-1 rounded text-xs font-mono border transition-all duration-200 hover:scale-105"
          style={{
            borderColor: themeConfig.colors.border,
            color: themeConfig.colors.accent,
          }}
        >
          ✅ Readiness Check
        </button>
      </div>
    </div>
  );
}
