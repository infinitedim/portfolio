import { useState, useEffect, useCallback } from "react";

/**
 * Secure authentication utilities for managing tokens via httpOnly cookies
 */

export interface AuthConfig {
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  maxAge?: number; // in seconds
  path?: string;
}

/**
 * Client-side cookie management utilities
 * Note: These work with regular cookies, not httpOnly cookies
 * httpOnly cookies should be managed server-side
 */
export class SecureAuth {
  private static readonly DEFAULT_CONFIG: Required<AuthConfig> = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60, // 15 minutes
    path: "/",
  };

  /**
   * Get cookie value (for non-httpOnly cookies only)
   * @param name
   */
  static getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(";").shift();
      return cookieValue || null;
    }

    return null;
  }

  /**
   * Set cookie (for non-httpOnly cookies only)
   * @param name
   * @param value
   * @param config
   */
  static setCookie(
    name: string,
    value: string,
    config?: Partial<AuthConfig>,
  ): void {
    if (typeof document === "undefined") return;

    const options = { ...this.DEFAULT_CONFIG, ...config };
    const expires = new Date(Date.now() + options.maxAge * 1000).toUTCString();

    let cookieString = `${name}=${value}; expires=${expires}; path=${options.path}; SameSite=${options.sameSite}`;

    if (options.secure) {
      cookieString += "; Secure";
    }

    document.cookie = cookieString;
  }

  /**
   * Remove cookie
   * @param name
   * @param path
   */
  static removeCookie(name: string, path: string = "/"): void {
    if (typeof document === "undefined") return;

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=Strict`;
  }

  /**
   * Check if user is authenticated by making request to server
   * This works with httpOnly cookies automatically sent by browser
   */
  static async verifyAuthentication(): Promise<{
    isValid: boolean;
    user?: Record<string, unknown>;
  }> {
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include httpOnly cookies
      });

      if (response.ok) {
        const data = await response.json();
        return { isValid: true, user: data.user };
      } else {
        return { isValid: false };
      }
    } catch (error) {
      console.error("Auth verification failed:", error);
      return { isValid: false };
    }
  }

  /**
   * Login with credentials
   * @param email
   * @param password
   */
  static async login(
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Allow setting httpOnly cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error" };
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  }
}

/**
 * React hook for authentication state management
 */
export function useSecureAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<unknown>(null);

  const checkAuth = useCallback(async () => {
    const result = await SecureAuth.verifyAuthentication();
    setIsAuthenticated(result.isValid);
    setUser(result.user || null);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await SecureAuth.login(email, password);
      if (result.success) {
        await checkAuth();
      }
      return result;
    },
    [checkAuth],
  );

  const logout = useCallback(async () => {
    await SecureAuth.logout();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    isAuthenticated,
    user,
    login,
    logout,
    checkAuth,
  };
}
