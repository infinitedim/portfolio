import { useState, useEffect, useCallback } from "react";

/**
 * Configuration options for secure cookie management
 * @property secure - Whether to require HTTPS for cookie transmission
 * @property sameSite - Cookie same-site policy for CSRF protection
 * @property maxAge - Cookie expiration time in seconds
 * @property path - Cookie path scope
 */
export interface AuthConfig {
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  maxAge?: number;
  path?: string;
}

/**
 * Utility class for secure authentication using httpOnly cookies and client-side cookie management
 *
 * This class provides methods for:
 * - Managing non-httpOnly cookies on the client side
 * - Verifying authentication via server requests (works with httpOnly cookies)
 * - Login and logout operations
 *
 * @remarks
 * httpOnly cookies should be managed server-side for maximum security.
 * This class provides client-side utilities that work alongside server-side cookie management.
 *
 * @example
 * ```ts
 * // Verify authentication
 * const { isValid, user } = await SecureAuth.verifyAuthentication();
 *
 * // Login
 * const result = await SecureAuth.login('user@example.com', 'password');
 * ```
 */
export class SecureAuth {
  private static readonly DEFAULT_CONFIG: Required<AuthConfig> = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60,
    path: "/",
  };

  /**
   * Retrieves a cookie value by name (for non-httpOnly cookies only)
   * @param name - Name of the cookie to retrieve
   * @returns Cookie value if found, null otherwise
   * @remarks Cannot access httpOnly cookies as they are not exposed to JavaScript
   * @example
   * ```ts
   * const theme = SecureAuth.getCookie('theme');
   * ```
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
   * Sets a cookie with specified name, value, and configuration (for non-httpOnly cookies only)
   * @param name - Name of the cookie
   * @param value - Value to store in the cookie
   * @param config - Optional cookie configuration (secure, sameSite, maxAge, path)
   * @example
   * ```ts
   * SecureAuth.setCookie('theme', 'dark', {
   *   maxAge: 30 * 24 * 60 * 60, // 30 days
   *   secure: true,
   *   sameSite: 'strict'
   * });
   * ```
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
      cookieString += "Secure";
    }

    document.cookie = cookieString;
  }

  /**
   * Removes a cookie by setting its expiration to the past
   * @param name - Name of the cookie to remove
   * @param path - Cookie path (default: "/")
   * @example
   * ```ts
   * SecureAuth.removeCookie('sessionId');
   * ```
   */
  static removeCookie(name: string, path: string = "/"): void {
    if (typeof document === "undefined") return;

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=Strict`;
  }

  /**
   * Verifies user authentication by making a request to the server
   * Works with httpOnly cookies automatically sent by the browser
   * @returns Promise resolving to an object with isValid boolean and optional user data
   * @example
   * ```ts
   * const { isValid, user } = await SecureAuth.verifyAuthentication();
   * if (isValid) {
   *   console.log('User is authenticated:', user);
   * }
   * ```
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
        credentials: "include",
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
   * Authenticates a user with email and password
   * Server sets httpOnly cookies on successful login
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to success status and optional error message
   * @example
   * ```ts
   * const result = await SecureAuth.login('user@example.com', 'password');
   * if (result.success) {
   *   console.log('Login successful');
   * } else {
   *   console.error('Login failed:', result.error);
   * }
   * ```
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
        credentials: "include",
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
   * Logs out the current user by clearing server-side httpOnly cookies
   * @returns Promise that resolves when logout is complete
   * @example
   * ```ts
   * await SecureAuth.logout();
   * console.log('User logged out');
   * ```
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
 * React hook for managing authentication state with httpOnly cookies
 *
 * Provides:
 * - Authentication status
 * - Current user data
 * - Login, logout, and auth check functions
 *
 * @returns Object containing authentication state and methods
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isAuthenticated, user, login, logout } = useSecureAuth();
 *
 *   if (isAuthenticated) {
 *     return <div>Welcome {user?.email}</div>;
 *   }
 *   return <LoginForm onSubmit={login} />;
 * }
 * ```
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
