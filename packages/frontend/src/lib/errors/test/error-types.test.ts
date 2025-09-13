/**
 * Test Suite for Enhanced Error Types
 */

import { describe, it, expect } from "vitest";
import {
  EnhancedError,
  ErrorCategory,
  ErrorSeverity,
  ErrorRecoveryStrategy,
  NetworkError,
  APIError,
  ValidationError,
  AuthenticationError,
  PerformanceError,
  UIError,
  BusinessLogicError,
  ErrorUtils,
} from "../error-types";

describe("Enhanced Error Types", () => {
  describe("EnhancedError", () => {
    it("should create an enhanced error with default values", () => {
      const error = new EnhancedError("Test error");

      expect(error.message).toBe("Test error");
      expect(error.category).toBe(ErrorCategory.UNKNOWN);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.isRetryable).toBe(false);
      expect(error.maxRetries).toBe(3);
      expect(error.retryDelay).toBe(1000);
      expect(error.recoveryStrategy).toBe(ErrorRecoveryStrategy.USER_ACTION);
      expect(error.retryCount).toBe(0);
      expect(error.suggestions).toEqual([]);
      expect(error.id).toBeDefined();
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it("should create an enhanced error with custom options", () => {
      const customOptions = {
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.HIGH,
        isRetryable: true,
        maxRetries: 5,
        retryDelay: 2000,
        recoveryStrategy: ErrorRecoveryStrategy.RETRY,
        suggestions: ["Check connection", "Try again"],
      };

      const error = new EnhancedError("Network error", customOptions);

      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.isRetryable).toBe(true);
      expect(error.maxRetries).toBe(5);
      expect(error.retryDelay).toBe(2000);
      expect(error.recoveryStrategy).toBe(ErrorRecoveryStrategy.RETRY);
      expect(error.suggestions).toEqual(["Check connection", "Try again"]);
    });

    it("should handle error chaining with cause", () => {
      const originalError = new Error("Original error");
      const enhancedError = new EnhancedError("Enhanced error", {
        cause: originalError,
      });

      expect(enhancedError.cause).toBe(originalError);
    });

    it("should serialize to JSON correctly", () => {
      const error = new EnhancedError("Test error", {
        category: ErrorCategory.API,
        severity: ErrorSeverity.HIGH,
      });

      const json = error.toJSON();

      expect(json.id).toBe(error.id);
      expect(json.message).toBe("Test error");
      expect(json.category).toBe(ErrorCategory.API);
      expect(json.severity).toBe(ErrorSeverity.HIGH);
      expect(json.timestamp).toBeDefined();
    });
  });

  describe("NetworkError", () => {
    it("should create a network error with correct defaults", () => {
      const error = new NetworkError("Connection failed");

      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.isRetryable).toBe(true);
      expect(error.maxRetries).toBe(3);
      expect(error.retryDelay).toBe(2000);
      expect(error.recoveryStrategy).toBe(ErrorRecoveryStrategy.RETRY);
      expect(error.suggestions).toContain("Check your internet connection");
    });
  });

  describe("APIError", () => {
    it("should create an API error with status code", () => {
      const error = new APIError("API call failed", 500, "/api/users");

      expect(error.category).toBe(ErrorCategory.API);
      expect(error.statusCode).toBe(500);
      expect(error.endpoint).toBe("/api/users");
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.isRetryable).toBe(true);
    });

    it("should handle rate limiting correctly", () => {
      const error = new APIError("Rate limited", 429);

      expect(error.retryDelay).toBe(5000);
      expect(error.suggestions).toContain(
        "Please wait a moment before trying again",
      );
    });

    it("should handle client errors correctly", () => {
      const error = new APIError("Bad request", 400);

      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.isRetryable).toBe(false);
    });
  });

  describe("ValidationError", () => {
    it("should create a validation error with field information", () => {
      const error = new ValidationError(
        "Invalid email",
        "email",
        "invalid-email",
      );

      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.isRetryable).toBe(false);
      expect(error.field).toBe("email");
      expect(error.value).toBe("invalid-email");
      expect(error.recoveryStrategy).toBe(ErrorRecoveryStrategy.USER_ACTION);
    });
  });

  describe("AuthenticationError", () => {
    it("should create an authentication error", () => {
      const error = new AuthenticationError("Invalid credentials");

      expect(error.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.isRetryable).toBe(false);
      expect(error.recoveryStrategy).toBe(ErrorRecoveryStrategy.REDIRECT);
      expect(error.suggestions).toContain("Please log in again");
    });
  });

  describe("PerformanceError", () => {
    it("should create a performance error with metrics", () => {
      const error = new PerformanceError(
        "Page load too slow",
        "loadTime",
        1000,
        2500,
      );

      expect(error.category).toBe(ErrorCategory.PERFORMANCE);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.metric).toBe("loadTime");
      expect(error.threshold).toBe(1000);
      expect(error.actual).toBe(2500);
      expect(error.isRetryable).toBe(true);
    });
  });

  describe("UIError", () => {
    it("should create a UI error with component information", () => {
      const props = { userId: 123, theme: "dark" };
      const error = new UIError(
        "Component render failed",
        "UserProfile",
        props,
      );

      expect(error.category).toBe(ErrorCategory.UI);
      expect(error.componentName).toBe("UserProfile");
      expect(error.props).toEqual(props);
      expect(error.recoveryStrategy).toBe(ErrorRecoveryStrategy.FALLBACK);
    });
  });

  describe("BusinessLogicError", () => {
    it("should create a business logic error with rule information", () => {
      const context = { userId: 123, action: "transfer" };
      const error = new BusinessLogicError(
        "Insufficient funds",
        "balance-check",
        context,
      );

      expect(error.category).toBe(ErrorCategory.BUSINESS_LOGIC);
      expect(error.rule).toBe("balance-check");
      expect(error.businessContext).toEqual(context);
      expect(error.isRetryable).toBe(false);
    });
  });

  describe("ErrorUtils", () => {
    describe("enhance", () => {
      it("should enhance a standard error", () => {
        const standardError = new Error("Standard error");
        const enhanced = ErrorUtils.enhance(standardError);

        expect(enhanced).toBeInstanceOf(EnhancedError);
        expect(enhanced.message).toBe("Standard error");
        expect(enhanced.cause).toBe(standardError);
      });

      it("should return existing enhanced error unchanged", () => {
        const enhancedError = new EnhancedError("Already enhanced");
        const result = ErrorUtils.enhance(enhancedError);

        expect(result).toBe(enhancedError);
      });
    });

    describe("isRetryable", () => {
      it("should detect retryable enhanced errors", () => {
        const retryableError = new NetworkError("Connection failed");
        const nonRetryableError = new ValidationError("Invalid input");

        expect(ErrorUtils.isRetryable(retryableError)).toBe(true);
        expect(ErrorUtils.isRetryable(nonRetryableError)).toBe(false);
      });

      it("should detect retryable standard errors by message", () => {
        const networkError = new Error("Network timeout");
        const validationError = new Error("Invalid format");

        expect(ErrorUtils.isRetryable(networkError)).toBe(true);
        expect(ErrorUtils.isRetryable(validationError)).toBe(false);
      });
    });

    describe("getSeverity", () => {
      it("should get severity from enhanced errors", () => {
        const criticalError = new EnhancedError("Critical issue", {
          severity: ErrorSeverity.CRITICAL,
        });

        expect(ErrorUtils.getSeverity(criticalError)).toBe(
          ErrorSeverity.CRITICAL,
        );
      });

      it("should determine severity from standard error message", () => {
        const criticalError = new Error("Critical system failure");
        const normalError = new Error("Normal error");

        expect(ErrorUtils.getSeverity(criticalError)).toBe(
          ErrorSeverity.CRITICAL,
        );
        expect(ErrorUtils.getSeverity(normalError)).toBe(ErrorSeverity.MEDIUM);
      });
    });

    describe("getCategory", () => {
      it("should get category from enhanced errors", () => {
        const networkError = new NetworkError("Connection failed");

        expect(ErrorUtils.getCategory(networkError)).toBe(
          ErrorCategory.NETWORK,
        );
      });

      it("should determine category from standard error message", () => {
        const networkError = new Error("Network connection failed");
        const validationError = new Error("Validation failed");
        const unknownError = new Error("Something went wrong");

        expect(ErrorUtils.getCategory(networkError)).toBe(
          ErrorCategory.NETWORK,
        );
        expect(ErrorUtils.getCategory(validationError)).toBe(
          ErrorCategory.VALIDATION,
        );
        expect(ErrorUtils.getCategory(unknownError)).toBe(
          ErrorCategory.UNKNOWN,
        );
      });
    });

    describe("getSuggestions", () => {
      it("should get suggestions from enhanced errors", () => {
        const error = new NetworkError("Connection failed");

        const suggestions = ErrorUtils.getSuggestions(error);
        expect(suggestions).toContain("Check your internet connection");
      });

      it("should provide default suggestions for standard errors", () => {
        const networkError = new Error("Network failed");
        const validationError = new Error("Invalid input");

        const networkSuggestions = ErrorUtils.getSuggestions(networkError);
        const validationSuggestions =
          ErrorUtils.getSuggestions(validationError);

        expect(networkSuggestions).toContain("Check your internet connection");
        expect(validationSuggestions).toContain(
          "Please check your input and try again",
        );
      });
    });
  });
});
