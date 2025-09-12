/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Validation utilities for the backend testing dashboard
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ParameterValidation {
  name: string;
  type: string;
  required: boolean;
  value: any;
  isValid: boolean;
  error?: string;
}

export class ValidationUtils {
  /**
   * Validate service and method names
   * @param service
   * @param method
   */
  static validateServiceMethod(
    service: string,
    method: string,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!service || typeof service !== "string") {
      errors.push("Service name is required and must be a string");
    }

    if (!method || typeof method !== "string") {
      errors.push("Method name is required and must be a string");
    }

    // Check for valid service names
    const validServices = ["health", "auth", "projects", "spotify", "security"];
    if (service && !validServices.includes(service)) {
      warnings.push(
        `Unknown service: ${service}. Valid services: ${validServices.join(", ")}`,
      );
    }

    // Check for common method patterns
    if (method && !/^[a-zA-Z][a-zA-Z0-9]*$/.test(method)) {
      warnings.push(
        "Method name should start with a letter and contain only alphanumeric characters",
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate parameters based on their type
   * @param parameters
   * @param values
   */
  static validateParameters(
    parameters: Array<{
      name: string;
      type: string;
      required: boolean;
      description: string;
    }>,
    values: Record<string, any>,
  ): ParameterValidation[] {
    return parameters.map((param) => {
      const value = values[param.name];
      const validation: ParameterValidation = {
        name: param.name,
        type: param.type,
        required: param.required,
        value,
        isValid: true,
      };

      // Check required parameters
      if (
        param.required &&
        (value === undefined || value === null || value === "")
      ) {
        validation.isValid = false;
        validation.error = `${param.name} is required`;
        return validation;
      }

      // Skip validation for optional empty values
      if (
        !param.required &&
        (value === undefined || value === null || value === "")
      ) {
        return validation;
      }

      // Type-specific validation
      switch (param.type) {
        case "string":
          if (typeof value !== "string") {
            validation.isValid = false;
            validation.error = `${param.name} must be a string`;
          }
          break;

        case "number":
          if (typeof value !== "number" || isNaN(value)) {
            validation.isValid = false;
            validation.error = `${param.name} must be a valid number`;
          }
          break;

        case "boolean":
          if (typeof value !== "boolean") {
            validation.isValid = false;
            validation.error = `${param.name} must be a boolean`;
          }
          break;

        case "object":
          try {
            if (typeof value === "string") {
              JSON.parse(value);
            } else if (typeof value !== "object" || value === null) {
              validation.isValid = false;
              validation.error = `${param.name} must be a valid object or JSON string`;
            }
          } catch {
            validation.isValid = false;
            validation.error = `${param.name} must be a valid JSON object`;
          }
          break;

        case "email": {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (typeof value !== "string" || !emailRegex.test(value)) {
            validation.isValid = false;
            validation.error = `${param.name} must be a valid email address`;
          }
          break;
        }

        case "url":
          try {
            new URL(value);
          } catch {
            validation.isValid = false;
            validation.error = `${param.name} must be a valid URL`;
          }
          break;

        default:
          // For unknown types, just check if value exists
          if (value === undefined || value === null) {
            validation.isValid = false;
            validation.error = `${param.name} is required`;
          }
      }

      return validation;
    });
  }

  /**
   * Validate HTTP method compatibility
   * @param method
   * @param type
   */
  static validateHttpMethod(
    method: string,
    type: "query" | "mutation",
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
    if (!validMethods.includes(method)) {
      errors.push(
        `Invalid HTTP method: ${method}. Valid methods: ${validMethods.join(", ")}`,
      );
    }

    // Check method-type compatibility
    if (type === "query" && method !== "GET") {
      warnings.push("Query procedures typically use GET method");
    }

    if (type === "mutation" && method === "GET") {
      warnings.push("Mutation procedures should not use GET method");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Sanitize input values
   * @param value
   * @param type
   */
  static sanitizeValue(value: any, type: string): any {
    if (value === undefined || value === null) {
      return value;
    }

    switch (type) {
      case "string":
        return String(value).trim();

      case "number": {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      }

      case "boolean":
        if (typeof value === "string") {
          return value.toLowerCase() === "true" || value === "1";
        }
        return Boolean(value);

      case "object":
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch {
            return {};
          }
        }
        return value;

      default:
        return value;
    }
  }

  /**
   * Validate URL format
   * @param url
   */
  static validateUrl(url: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const parsed = new URL(url);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        warnings.push("URL should use HTTP or HTTPS protocol");
      }

      if (!parsed.hostname) {
        errors.push("URL must have a valid hostname");
      }
    } catch {
      errors.push("Invalid URL format");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate environment configuration
   */
  static validateEnvironment(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for required environment variables
    const requiredEnvVars = ["NEXT_PUBLIC_API_URL"];

    const optionalEnvVars = ["NEXT_PUBLIC_BASE_URL"];

    requiredEnvVars.forEach((envVar) => {
      if (!process.env[envVar]) {
        errors.push(`Missing required environment variable: ${envVar}`);
      }
    });

    optionalEnvVars.forEach((envVar) => {
      if (!process.env[envVar]) {
        warnings.push(`Missing optional environment variable: ${envVar}`);
      }
    });

    // Validate API URL if present
    if (process.env.NEXT_PUBLIC_API_URL) {
      const urlValidation = this.validateUrl(process.env.NEXT_PUBLIC_API_URL);
      errors.push(...urlValidation.errors);
      warnings.push(...urlValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Format validation errors for display
   * @param validation
   */
  static formatValidationErrors(validation: ValidationResult): string {
    if (validation.isValid) {
      return "";
    }

    const parts: string[] = [];

    if (validation.errors.length > 0) {
      parts.push("Errors:");
      validation.errors.forEach((error) => parts.push(`• ${error}`));
    }

    if (validation.warnings.length > 0) {
      parts.push("Warnings:");
      validation.warnings.forEach((warning) => parts.push(`• ${warning}`));
    }

    return parts.join("\n");
  }

  /**
   * Check if a value is empty or null
   * @param value
   */
  static isEmpty(value: any): boolean {
    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value === "string") {
      return value.trim() === "";
    }

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    if (typeof value === "object") {
      return Object.keys(value).length === 0;
    }

    return false;
  }

  /**
   * Validate request payload size
   * @param payload
   * @param maxSizeKB
   */
  static validatePayloadSize(
    payload: any,
    maxSizeKB: number = 1024,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const payloadString = JSON.stringify(payload);
      const sizeInBytes = new Blob([payloadString]).size;
      const sizeInKB = sizeInBytes / 1024;

      if (sizeInKB > maxSizeKB) {
        errors.push(
          `Payload size (${sizeInKB.toFixed(2)}KB) exceeds maximum allowed size (${maxSizeKB}KB)`,
        );
      } else if (sizeInKB > maxSizeKB * 0.8) {
        warnings.push(
          `Payload size (${sizeInKB.toFixed(2)}KB) is approaching the limit (${maxSizeKB}KB)`,
        );
      }
    } catch {
      errors.push("Unable to calculate payload size");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
