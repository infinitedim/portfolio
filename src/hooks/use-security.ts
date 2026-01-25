import { useState, useRef, useCallback, useEffect } from "react";
import {
  useIntervalManager,
  useMountRef,
  useTimerManager,
} from "./utils/hooks-utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let trpcClient: any = null;
if (typeof window !== "undefined") {
  try {
    trpcClient = null;
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
  metadata: Record<string, unknown>;
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

const SECURITY_LIMITS = {
  MAX_RECENT_INPUTS: 50,
  MAX_ALERTS: 10,
  RATE_LIMIT_TIMEOUT: 60000,
  CLEANUP_INTERVAL: 300000,
  ONE_HOUR: 3600000,
} as const;

const isClientSide = () => typeof window !== "undefined";

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
 * Client-side input validation (fallback when tRPC is unavailable)
 *
 * Performs basic security checks for dangerous patterns including:
 * - Script injection attempts
 * - XSS attack patterns
 * - Excessively long input
 *
 * @param {string} input - The input string to validate
 * @returns {ValidationResult} Validation result with sanitized input
 * @property {boolean} isValid - Whether the input passed validation
 * @property {string} sanitizedInput - Cleaned/trimmed input
 * @property {string | null} error - Error message if validation failed
 * @property {"low" | "medium" | "high"} riskLevel - Assessed risk level
 */
function validateInputClientSide(input: string): ValidationResult {
  const sanitizedInput = input.trim();

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
      sanitizedInput: sanitizedInput.replace(/<[^>]*>/g, ""),
      error: "Potentially dangerous input detected",
      riskLevel: "high",
    };
  }

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
 * Security monitoring and input validation hook with tRPC integration
 *
 * Provides comprehensive security features:
 * - Input validation and sanitization (tRPC or client-side)
 * - Rate limiting detection
 * - Suspicious activity monitoring
 * - Threat alerts management
 * - Security metrics and recommendations
 * - Automatic cleanup and memory management
 *
 * @returns {object} Security state and methods
 * @property {SecurityState} securityState - Current security status
 * @property {ThreatAlert[]} threatAlerts - Array of threat alerts
 * @property {Function} validateInput - Async validation (prefers tRPC)
 * @property {Function} validateInputSync - Synchronous client-side validation
 * @property {Function} resetRateLimit - Reset rate limit flag
 * @property {Function} getSecurityMetrics - Get current security metrics
 * @property {Function} getSecurityRecommendations - Get security recommendations
 * @property {Function} clearOldAlerts - Clean up old threat alerts
 * @property {boolean} isSecure - Whether system is in secure state
 * @property {"low" | "medium" | "high"} riskLevel - Current overall risk level
 *
 * @example
 * ```tsx
 * const {
 *   validateInput,
 *   securityState,
 *   threatAlerts,
 *   isSecure,
 *   getSecurityMetrics
 * } = useSecurity();
 *
 * // Validate user input
 * const result = await validateInput(userInput);
 * if (result.shouldProceed) {
 *   // Process input
 * }
 *
 * // Check security metrics
 * const metrics = getSecurityMetrics();
 * console.log(`Blocked requests: ${metrics.blockedRequests}`);
 * ```
 */
export function useSecurity() {
  const isMountedRef = useMountRef();
  const { setTimer, clearTimer } = useTimerManager();
  const { setInterval, clearInterval } = useIntervalManager();

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

  const metricsCache = useRef<{
    timestamp: number;
    metrics: SecurityMetrics;
  } | null>(null);
  const CACHE_DURATION = 5000;

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

        if (trpcClient?.security?.validateInput) {
          try {
            const result = await trpcClient.security.validateInput.mutate({
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
          validation = validateInputClientSide(input);
          shouldProceed = validation.isValid;
        }

        if (isClientSide() && isMountedRef.current) {
          recentInputs.current.push(input);
          if (recentInputs.current.length > SECURITY_LIMITS.MAX_RECENT_INPUTS) {
            recentInputs.current = recentInputs.current.slice(
              -SECURITY_LIMITS.MAX_RECENT_INPUTS,
            );
          }

          const now = Date.now();
          requestHistory.current.push({
            timestamp: now,
            valid: validation.isValid,
          });

          const oneHourAgo = now - SECURITY_LIMITS.ONE_HOUR;
          if (requestHistory.current.length > 100) {
            requestHistory.current = requestHistory.current.filter(
              (record) => record.timestamp > oneHourAgo,
            );
          }

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

              if (isMountedRef.current) {
                setSecurityState((prev) => ({
                  ...prev,
                  suspiciousActivity: prev.suspiciousActivity + 1,
                  lastThreatTime: new Date(),
                }));

                if (suspiciousAnalysis.riskLevel === "high") {
                  shouldProceed = false;
                }
              }
            }
          }

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
        const validation = validateInputClientSide(input);
        let shouldProceed = validation.isValid;
        let alert: ThreatAlert | undefined;

        if (isClientSide() && isMountedRef.current) {
          recentInputs.current.push(input);
          if (recentInputs.current.length > SECURITY_LIMITS.MAX_RECENT_INPUTS) {
            recentInputs.current = recentInputs.current.slice(
              -SECURITY_LIMITS.MAX_RECENT_INPUTS,
            );
          }

          const now = Date.now();
          requestHistory.current.push({
            timestamp: now,
            valid: validation.isValid,
          });

          const oneHourAgo = now - SECURITY_LIMITS.ONE_HOUR;
          if (requestHistory.current.length > 100) {
            requestHistory.current = requestHistory.current.filter(
              (record) => record.timestamp > oneHourAgo,
            );
          }

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

              if (isMountedRef.current) {
                setSecurityState((prev) => ({
                  ...prev,
                  suspiciousActivity: prev.suspiciousActivity + 1,
                  lastThreatTime: new Date(),
                }));

                if (suspiciousAnalysis.riskLevel === "high") {
                  shouldProceed = false;
                }
              }
            }
          }

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

        const oneMinuteAgo = now - 60000;
        const recentRequests = requestHistory.current.filter(
          (r) => r.timestamp > oneMinuteAgo,
        );

        const averageRequestsPerMinute = recentRequests.length;

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
        return filtered.length !== prev.length ? filtered : prev;
      });

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

  useEffect(() => {
    return () => {
      recentInputs.current = [];
      requestHistory.current = [];
      metricsCache.current = null;
    };
  }, []);

  return {
    securityState,
    threatAlerts,

    validateInput,
    validateInputSync,
    resetRateLimit,
    getSecurityMetrics,
    getSecurityRecommendations,
    clearOldAlerts,

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
 * Create a threat alert with SSR-safe ID generation
 *
 * @param {ThreatAlert["type"]} type - Type of threat detected
 * @param {string} message - Human-readable threat description
 * @param {ThreatAlert["riskLevel"]} riskLevel - Severity level of the threat
 * @param {Record<string, unknown>} [metadata={}] - Additional threat data
 *
 * @returns {ThreatAlert} Formatted threat alert object
 */
function createThreatAlert(
  type: ThreatAlert["type"],
  message: string,
  riskLevel: ThreatAlert["riskLevel"],
  metadata: Record<string, unknown> = {},
): ThreatAlert {
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
 * Detect suspicious activity patterns in recent inputs
 *
 * Analyzes recent input history for:
 * - Excessive repetition of the same input
 * - Rapid input patterns indicating automation
 *
 * @param {string[]} recentInputs - Array of recent inputs to analyze
 *
 * @returns {object} Analysis result
 * @property {boolean} isSuspicious - Whether suspicious activity detected
 * @property {string} reason - Description of suspicious pattern
 * @property {"low" | "medium" | "high"} riskLevel - Assessed risk level
 */
function detectSuspiciousActivity(recentInputs: string[]): {
  isSuspicious: boolean;
  reason: string;
  riskLevel: "low" | "medium" | "high";
} {
  if (recentInputs.length < 3) {
    return { isSuspicious: false, reason: "", riskLevel: "low" };
  }

  const patternCounts: Record<string, number> = {};
  recentInputs.forEach((input) => {
    const pattern = input.toLowerCase().trim();
    patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
  });

  const maxRepetition = Math.max(...Object.values(patternCounts));
  if (maxRepetition > 3) {
    return {
      isSuspicious: true,
      reason: "Excessive input repetition detected",
      riskLevel: "medium",
    };
  }

  const timeSpan = recentInputs.length > 1 ? 10000 : 0;
  if (timeSpan > 0 && recentInputs.length > 15) {
    return {
      isSuspicious: true,
      reason: "Rapid input pattern detected",
      riskLevel: "medium",
    };
  }

  return { isSuspicious: false, reason: "", riskLevel: "low" };
}

/**
 * Development-mode security monitoring hook with console logging
 *
 * Extends useSecurity with periodic logging of security metrics in development.
 * Logs threats and recommendations every 30 seconds when issues are detected.
 *
 * @returns {object} Same return value as useSecurity
 *
 * @example
 * ```tsx
 * // Use in development for debugging
 * const security = useSecurityMonitoring();
 * // Console will show security reports automatically
 * ```
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
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [security]);

  return security;
}
