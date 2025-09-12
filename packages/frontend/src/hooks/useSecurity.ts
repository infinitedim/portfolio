/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useCallback, useEffect } from "react";
import {
  useIntervalManager,
  useMountRef,
  useTimerManager,
} from "./utils/hookUtils";

// Import tRPC conditionally to avoid SSR issues
let trpc: any = null;
if (typeof window !== "undefined") {
  try {
    // Use dynamic import instead of require
    import("@portfolio/frontend/src/lib/trpc")
      .then((module) => {
        trpc = module.trpc;
        return module;
      })
      .catch((error) => {
        console.warn("Failed to load tRPC for security:", error);
        return null;
      });
  } catch (error) {
    console.warn("Failed to load tRPC for security:", error);
  }
}

interface SecurityState {
  isRateLimited: boolean;
  suspiciousActivity: number;
  blockedAttempts: number;
  lastThreatTime: Date | null;
}

interface ThreatAlert {
  id: string;
  type:
    | "rate_limit"
    | "suspicious_input"
    | "repeated_attempts"
    | "dangerous_pattern";
  message: string;
  timestamp: Date;
  riskLevel: "low" | "medium" | "high";
  metadata: Record<string, any>;
}

interface SecurityMetrics {
  totalRequests: number;
  validRequests: number;
  blockedRequests: number;
  averageRequestsPerMinute: number;
  topThreats: Array<{ type: string; count: number }>;
}

interface ValidationResult {
  isValid: boolean;
  sanitizedInput: string;
  error: string | null;
  riskLevel: "low" | "medium" | "high";
}

// Constants
const SECURITY_LIMITS = {
  MAX_RECENT_INPUTS: 50,
  MAX_ALERTS: 10,
  RATE_LIMIT_TIMEOUT: 60000, // 1 minute
  CLEANUP_INTERVAL: 300000, // 5 minutes
  ONE_HOUR: 3600000,
} as const;

// Helper function to check if we're on client side
const isClientSide = () => typeof window !== "undefined";

// Helper function for error handling
const withErrorHandling = <T>(fn: () => T, fallback: T): (() => T) => {
  return () => {
    try {
      return fn();
    } catch (error) {
      console.error("Security operation failed:", error);
      return fallback;
    }
  };
};

/**
 * Basic client-side input validation (fallback when tRPC is not available)
 * @param {string} input - The input to validate
 * @returns {ValidationResult} - The validation result
 */
function validateInputClientSide(input: string): ValidationResult {
  const sanitizedInput = input.trim();

  // Basic validation rules
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\(/i,
    /document\.cookie/i,
    /window\./i,
  ];

  const hasDangerousPattern = dangerousPatterns.some((pattern) =>
    pattern.test(sanitizedInput),
  );

  if (hasDangerousPattern) {
    return {
      isValid: false,
      sanitizedInput: sanitizedInput.replace(/<[^>]*>/g, ""), // Strip HTML
      error: "Potentially dangerous input detected",
      riskLevel: "high",
    };
  }

  // Check for excessively long input
  if (sanitizedInput.length > 10000) {
    return {
      isValid: false,
      sanitizedInput: sanitizedInput.substring(0, 1000),
      error: "Input too long",
      riskLevel: "medium",
    };
  }

  return {
    isValid: true,
    sanitizedInput,
    error: null,
    riskLevel: "low",
  };
}

/**
 * Hook for security monitoring and input validation using backend SecurityService via tRPC
 * @returns {object} - The security state and methods
 */
export function useSecurity() {
  const isMountedRef = useMountRef();
  const { setTimer, clearTimer } = useTimerManager();
  const { setInterval, clearInterval } = useIntervalManager();

  // Initialize with SSR-safe defaults to prevent hydration issues
  const [securityState, setSecurityState] = useState<SecurityState>({
    isRateLimited: false,
    suspiciousActivity: 0,
    blockedAttempts: 0,
    lastThreatTime: null,
  });

  const [threatAlerts, setThreatAlerts] = useState<ThreatAlert[]>([]);
  const recentInputs = useRef<string[]>([]);
  const requestHistory = useRef<Array<{ timestamp: number; valid: boolean }>>(
    [],
  );

  // Cache expensive calculations
  const metricsCache = useRef<{
    timestamp: number;
    metrics: SecurityMetrics;
  } | null>(null);
  const CACHE_DURATION = 5000; // 5 seconds

  /**
   * Validate and sanitize user input using backend SecurityService or fallback to client-side validation
   */
  const validateInput = useCallback(
    async (
      input: string,
    ): Promise<
      ValidationResult & {
        shouldProceed: boolean;
        alert?: ThreatAlert;
      }
    > => {
      try {
        let validation: ValidationResult;
        let shouldProceed = false;
        let alert: ThreatAlert | undefined;

        // Try to use tRPC validation if available
        if (trpc?.security?.validateInput?.mutateAsync) {
          try {
            const result = await trpc.security.validateInput.mutateAsync({
              input,
            });
            validation = {
              isValid: result.isValid,
              sanitizedInput: result.sanitizedInput,
              error: result.error,
              riskLevel: result.riskLevel,
            };
            shouldProceed = result.isValid;
          } catch (error) {
            console.warn(
              "Backend validation failed, using client-side fallback:",
              error,
            );
            validation = validateInputClientSide(input);
            shouldProceed = validation.isValid;
          }
        } else {
          // Use client-side validation as fallback
          validation = validateInputClientSide(input);
          shouldProceed = validation.isValid;
        }

        // Only perform tracking on client side when component is mounted
        if (isClientSide() && isMountedRef.current) {
          // Track input for pattern analysis with size limit
          recentInputs.current.push(input);
          if (recentInputs.current.length > SECURITY_LIMITS.MAX_RECENT_INPUTS) {
            recentInputs.current = recentInputs.current.slice(
              -SECURITY_LIMITS.MAX_RECENT_INPUTS,
            );
          }

          // Record request with timestamp
          const now = Date.now();
          requestHistory.current.push({
            timestamp: now,
            valid: validation.isValid,
          });

          // Clean old records efficiently (keep last hour)
          const oneHourAgo = now - SECURITY_LIMITS.ONE_HOUR;
          if (requestHistory.current.length > 100) {
            // Only clean when necessary
            requestHistory.current = requestHistory.current.filter(
              (record) => record.timestamp > oneHourAgo,
            );
          }

          // Check for suspicious patterns with minimum threshold
          if (recentInputs.current.length >= 5) {
            const suspiciousAnalysis = detectSuspiciousActivity(
              recentInputs.current.slice(-10),
            );

            if (suspiciousAnalysis.isSuspicious) {
              alert = createThreatAlert(
                "suspicious_input",
                suspiciousAnalysis.reason,
                suspiciousAnalysis.riskLevel,
                {
                  pattern: suspiciousAnalysis.reason,
                  recentInputs: recentInputs.current.slice(-5),
                },
              );

              // Update security state only if component is mounted
              if (isMountedRef.current) {
                setSecurityState((prev) => ({
                  ...prev,
                  suspiciousActivity: prev.suspiciousActivity + 1,
                  lastThreatTime: new Date(),
                }));

                // Reduce rate limit for high-risk activity
                if (suspiciousAnalysis.riskLevel === "high") {
                  shouldProceed = false;
                }
              }
            }
          }

          // Add alert if created and component is mounted
          if (alert && isMountedRef.current) {
            setThreatAlerts((prev) => [
              ...prev.slice(-SECURITY_LIMITS.MAX_ALERTS + 1),
              alert!,
            ]);
          }
        }

        return {
          ...validation,
          shouldProceed,
          alert,
        };
      } catch (error) {
        console.error("Security validation failed:", error);
        return {
          shouldProceed: false,
          isValid: false,
          sanitizedInput: "",
          error: "Security validation failed",
          riskLevel: "high" as const,
        };
      }
    },
    [isMountedRef],
  );

  /**
   * Synchronous validation for cases where async is not suitable
   */
  const validateInputSync = useCallback(
    (
      input: string,
    ): ValidationResult & {
      shouldProceed: boolean;
      alert?: ThreatAlert;
    } => {
      try {
        // Use client-side validation for synchronous calls
        const validation = validateInputClientSide(input);
        let shouldProceed = validation.isValid;
        let alert: ThreatAlert | undefined;

        // Only perform tracking on client side when component is mounted
        if (isClientSide() && isMountedRef.current) {
          // Track input for pattern analysis with size limit
          recentInputs.current.push(input);
          if (recentInputs.current.length > SECURITY_LIMITS.MAX_RECENT_INPUTS) {
            recentInputs.current = recentInputs.current.slice(
              -SECURITY_LIMITS.MAX_RECENT_INPUTS,
            );
          }

          // Record request with timestamp
          const now = Date.now();
          requestHistory.current.push({
            timestamp: now,
            valid: validation.isValid,
          });

          // Clean old records efficiently (keep last hour)
          const oneHourAgo = now - SECURITY_LIMITS.ONE_HOUR;
          if (requestHistory.current.length > 100) {
            requestHistory.current = requestHistory.current.filter(
              (record) => record.timestamp > oneHourAgo,
            );
          }

          // Check for suspicious patterns with minimum threshold
          if (recentInputs.current.length >= 5) {
            const suspiciousAnalysis = detectSuspiciousActivity(
              recentInputs.current.slice(-10),
            );

            if (suspiciousAnalysis.isSuspicious) {
              alert = createThreatAlert(
                "suspicious_input",
                suspiciousAnalysis.reason,
                suspiciousAnalysis.riskLevel,
                {
                  pattern: suspiciousAnalysis.reason,
                  recentInputs: recentInputs.current.slice(-5),
                },
              );

              // Update security state only if component is mounted
              if (isMountedRef.current) {
                setSecurityState((prev) => ({
                  ...prev,
                  suspiciousActivity: prev.suspiciousActivity + 1,
                  lastThreatTime: new Date(),
                }));

                // Reduce rate limit for high-risk activity
                if (suspiciousAnalysis.riskLevel === "high") {
                  shouldProceed = false;
                }
              }
            }
          }

          // Add alert if created and component is mounted
          if (alert && isMountedRef.current) {
            setThreatAlerts((prev) => [
              ...prev.slice(-SECURITY_LIMITS.MAX_ALERTS + 1),
              alert!,
            ]);
          }
        }

        return {
          ...validation,
          shouldProceed,
          alert,
        };
      } catch (error) {
        console.error("Security validation sync failed:", error);
        return {
          shouldProceed: false,
          isValid: false,
          sanitizedInput: "",
          error: "Security validation failed",
          riskLevel: "high" as const,
        };
      }
    },
    [isMountedRef],
  );

  /**
   * Reset rate limiting (for testing or admin override)
   */
  const resetRateLimit = useCallback(() => {
    if (!isMountedRef.current) return;

    setSecurityState((prev) => ({
      ...prev,
      isRateLimited: false,
    }));
  }, [isMountedRef]);

  /**
   * Get current security metrics with improved caching
   */
  const getSecurityMetrics = useCallback((): SecurityMetrics => {
    if (!isClientSide()) {
      return {
        totalRequests: 0,
        validRequests: 0,
        blockedRequests: 0,
        averageRequestsPerMinute: 0,
        topThreats: [],
      };
    }

    // Return cached metrics if still valid
    const now = Date.now();
    if (
      metricsCache.current &&
      now - metricsCache.current.timestamp < CACHE_DURATION
    ) {
      return metricsCache.current.metrics;
    }

    return withErrorHandling(
      () => {
        const totalRequests = requestHistory.current.length;
        const validRequests = requestHistory.current.filter(
          (r) => r.valid,
        ).length;
        const blockedRequests = totalRequests - validRequests;

        // Calculate requests per minute efficiently
        const oneMinuteAgo = now - 60000;
        const recentRequests = requestHistory.current.filter(
          (r) => r.timestamp > oneMinuteAgo,
        );

        const averageRequestsPerMinute = recentRequests.length;

        // Analyze threat types with performance optimization
        const threatTypes = threatAlerts.reduce(
          (counts, alert) => {
            counts[alert.type] = (counts[alert.type] || 0) + 1;
            return counts;
          },
          {} as Record<string, number>,
        );

        const topThreats = Object.entries(threatTypes)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        const metrics = {
          totalRequests,
          validRequests,
          blockedRequests,
          averageRequestsPerMinute,
          topThreats,
        };

        // Cache the calculated metrics
        metricsCache.current = {
          timestamp: now,
          metrics,
        };

        return metrics;
      },
      {
        totalRequests: 0,
        validRequests: 0,
        blockedRequests: 0,
        averageRequestsPerMinute: 0,
        topThreats: [],
      },
    )();
  }, [threatAlerts]);

  /**
   * Clear old threat alerts with improved performance
   */
  const clearOldAlerts = useCallback(() => {
    if (!isClientSide() || !isMountedRef.current) return;

    withErrorHandling(() => {
      const oneHourAgo = Date.now() - SECURITY_LIMITS.ONE_HOUR;
      setThreatAlerts((prev) => {
        const filtered = prev.filter(
          (alert) => alert.timestamp.getTime() > oneHourAgo,
        );
        // Only update state if there are alerts to remove
        return filtered.length !== prev.length ? filtered : prev;
      });

      // Clear metrics cache when alerts are cleared
      if (metricsCache.current) {
        metricsCache.current = null;
      }
    }, undefined)();
  }, [isMountedRef]);

  /**
   * Get security recommendations based on current state
   */
  const getSecurityRecommendations = useCallback((): string[] => {
    return withErrorHandling(() => {
      const recommendations: string[] = [];
      const metrics = getSecurityMetrics();

      if (securityState.isRateLimited) {
        recommendations.push(
          "Rate limiting is active. Wait a moment before trying again.",
        );
      }

      if (securityState.suspiciousActivity > 5) {
        recommendations.push(
          "High suspicious activity detected. Consider clearing session.",
        );
      }

      if (metrics.blockedRequests > metrics.validRequests) {
        recommendations.push(
          "Many requests are being blocked. Check your input format.",
        );
      }

      if (metrics.averageRequestsPerMinute > 20) {
        recommendations.push(
          "High request frequency detected. Consider slowing down.",
        );
      }

      return recommendations;
    }, [])();
  }, [securityState, getSecurityMetrics]);

  // Auto-reset rate limiting after timeout using timer manager
  useEffect(() => {
    if (!isClientSide() || !isMountedRef.current) return;

    if (securityState.isRateLimited) {
      setTimer(
        "rateLimitReset",
        () => {
          if (isMountedRef.current) {
            resetRateLimit();
          }
        },
        SECURITY_LIMITS.RATE_LIMIT_TIMEOUT,
      );
    } else {
      clearTimer("rateLimitReset");
    }
  }, [
    securityState.isRateLimited,
    resetRateLimit,
    isMountedRef,
    setTimer,
    clearTimer,
  ]);

  // Auto-cleanup old alerts using interval manager
  useEffect(() => {
    if (!isClientSide() || !isMountedRef.current) return;

    setInterval(
      "alertCleanup",
      () => {
        if (isMountedRef.current) {
          clearOldAlerts();
        }
      },
      SECURITY_LIMITS.CLEANUP_INTERVAL,
    );

    return () => clearInterval("alertCleanup");
  }, [clearOldAlerts, isMountedRef, setInterval, clearInterval]);

  // Cleanup on unmount (automatic with timer manager)
  useEffect(() => {
    return () => {
      recentInputs.current = [];
      requestHistory.current = [];
      metricsCache.current = null;
    };
  }, []);

  return {
    // State
    securityState,
    threatAlerts,

    // Methods
    validateInput, // Async version
    validateInputSync, // Sync version for immediate use
    resetRateLimit,
    getSecurityMetrics,
    getSecurityRecommendations,
    clearOldAlerts,

    // Computed values
    isSecure:
      securityState.suspiciousActivity < 3 && !securityState.isRateLimited,
    riskLevel:
      securityState.suspiciousActivity > 10
        ? "high"
        : securityState.suspiciousActivity > 5
          ? "medium"
          : "low",
  };
}

/**
 * Create a threat alert with SSR-safe defaults
 * @param {ThreatAlert["type"]} type - The type of threat
 * @param {string} message - The message of the threat
 * @param {ThreatAlert["riskLevel"]} riskLevel - The risk level of the threat
 * @param {Record<string, any>} metadata - The metadata of the threat
 * @returns {ThreatAlert} - The threat alert
 */
function createThreatAlert(
  type: ThreatAlert["type"],
  message: string,
  riskLevel: ThreatAlert["riskLevel"],
  metadata: Record<string, any> = {},
): ThreatAlert {
  // MODIFICATION: Generate consistent IDs for SSR
  const id =
    typeof window !== "undefined"
      ? `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : `alert_${type}_${Date.now()}`;

  const timestamp = new Date();

  return {
    id,
    type,
    message,
    timestamp,
    riskLevel,
    metadata,
  };
}

/**
 * Detect suspicious activity patterns
 * @param {string[]} recentInputs - Array of recent inputs to analyze
 * @returns {object} - Analysis result
 */
function detectSuspiciousActivity(recentInputs: string[]): {
  isSuspicious: boolean;
  reason: string;
  riskLevel: "low" | "medium" | "high";
} {
  if (recentInputs.length < 3) {
    return { isSuspicious: false, reason: "", riskLevel: "low" };
  }

  // Check for repeated patterns
  const patternCounts: Record<string, number> = {};
  recentInputs.forEach((input) => {
    const pattern = input.toLowerCase().trim();
    patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
  });

  // Check for excessive repetition
  const maxRepetition = Math.max(...Object.values(patternCounts));
  if (maxRepetition > 3) {
    return {
      isSuspicious: true,
      reason: "Excessive input repetition detected",
      riskLevel: "medium",
    };
  }

  // Check for rapid input (basic check)
  const timeSpan = recentInputs.length > 1 ? 10000 : 0; // 10 seconds
  if (timeSpan > 0 && recentInputs.length > 5) {
    return {
      isSuspicious: true,
      reason: "Rapid input pattern detected",
      riskLevel: "medium",
    };
  }

  return { isSuspicious: false, reason: "", riskLevel: "low" };
}

/**
 * Hook for monitoring security in development
 * @returns {object} - The security state and methods
 */
export function useSecurityMonitoring() {
  const security = useSecurity();

  useEffect(() => {
    if (
      process.env.NODE_ENV === "development" &&
      typeof window !== "undefined"
    ) {
      const interval = setInterval(() => {
        try {
          const metrics = security.getSecurityMetrics();
          if (metrics.blockedRequests > 0 || security.threatAlerts.length > 0) {
            console.group("🔒 Security Monitoring");
            console.log("Metrics:", metrics);
            console.log("Recent Threats:", security.threatAlerts.slice(-3));
            console.log(
              "Recommendations:",
              security.getSecurityRecommendations(),
            );
            console.groupEnd();
          }
        } catch (error) {
          console.warn("Security monitoring error:", error);
        }
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [security]);

  return security;
}
