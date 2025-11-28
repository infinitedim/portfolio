import { getTRPCClient } from "../trpc";

export interface AuthUser {
  userId: string;
  email: string;
  role: "admin";
}

export interface LoginResponse {
  success: boolean;
  user?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

export interface RefreshResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

export interface ValidateResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Secure token storage using sessionStorage (cleared on browser close)
 * and in-memory storage for sensitive tokens.
 *
 * Security improvements:
 * 1. Access tokens kept in memory only (not persisted to storage)
 * 2. Refresh tokens use sessionStorage (cleared on browser close)
 * 3. User data uses sessionStorage instead of localStorage
 *
 * Note: For maximum security, consider implementing httpOnly cookies
 * on the backend for token storage.
 */
class AuthService {
  // Access token kept in memory only - not persisted to any storage
  // This prevents XSS attacks from stealing the access token
  private accessToken: string | null = null;

  // Refresh token - stored in sessionStorage (more secure than localStorage)
  private refreshToken: string | null = null;

  // User info (non-sensitive)
  private user: AuthUser | null = null;

  // Storage keys with prefix to avoid conflicts
  private readonly STORAGE_PREFIX = "__auth_";
  private readonly REFRESH_TOKEN_KEY = `${this.STORAGE_PREFIX}rt`;
  private readonly USER_KEY = `${this.STORAGE_PREFIX}user`;

  constructor() {
    // Load tokens from sessionStorage on initialization (client-side only)
    // Note: Access token is NOT loaded from storage - it must be refreshed
    if (typeof window !== "undefined") {
      // Only load refresh token and user from sessionStorage
      this.refreshToken = sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
      const userStr = sessionStorage.getItem(this.USER_KEY);
      if (userStr) {
        try {
          this.user = JSON.parse(userStr);
        } catch {
          this.user = null;
          sessionStorage.removeItem(this.USER_KEY);
        }
      }

      // Migrate from old localStorage if exists (one-time cleanup)
      this.migrateFromLocalStorage();
    }
  }

  /**
   * One-time migration from localStorage to sessionStorage
   * Clears old insecure storage
   */
  private migrateFromLocalStorage(): void {
    if (typeof window === "undefined") return;

    // Remove old localStorage items (security cleanup)
    const oldKeys = ["accessToken", "refreshToken", "user"];
    oldKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Login with email and password
   * @param email
   * @param password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // Check if we're on the client side and tRPC is available
      if (typeof window === "undefined") {
        return {
          success: false,
          error: "Login is only available on the client side",
        };
      }

      // Use the tRPC client directly (guarded for SSR and missing client)
      let trpcClient;
      try {
        trpcClient = getTRPCClient();
      } catch {
        trpcClient = null;
      }

      if (!trpcClient?.auth?.login?.mutate) {
        return { success: false, error: "tRPC client unavailable" };
      }

      const result = await trpcClient.auth.login.mutate({ email, password });

      if (result.success && result.accessToken && result.user) {
        // Store access token in memory only (not persisted - security best practice)
        this.accessToken = result.accessToken;
        this.refreshToken = result.refreshToken || null;
        this.user = result.user;

        // Store refresh token and user in sessionStorage (more secure than localStorage)
        // sessionStorage is cleared when browser closes and is not accessible via XSS as easily
        if (typeof window !== "undefined") {
          // Note: Access token is NOT stored - kept in memory only
          if (result.refreshToken) {
            sessionStorage.setItem(this.REFRESH_TOKEN_KEY, result.refreshToken);
          }
          // User info is non-sensitive, can be stored
          sessionStorage.setItem(this.USER_KEY, JSON.stringify(result.user));
        }

        return {
          success: true,
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        };
      } else {
        return {
          success: false,
          error: !result.success ? result.error : "Login failed",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  }

  /**
   * Refresh the access token using refresh token
   */
  async refresh(): Promise<RefreshResponse> {
    if (!this.refreshToken) {
      return {
        success: false,
        error: "No refresh token available",
      };
    }

    // Check if we're on the client side
    if (typeof window === "undefined") {
      return {
        success: false,
        error: "Token refresh is only available on the client side",
      };
    }

    try {
      let trpcClient;
      try {
        trpcClient = getTRPCClient();
      } catch {
        trpcClient = null;
      }

      if (!trpcClient?.auth?.refresh?.mutate) {
        return { success: false, error: "tRPC client unavailable" };
      }

      const result = await trpcClient.auth.refresh.mutate({
        refreshToken: this.refreshToken,
      });

      if (result.success && result.accessToken) {
        // Store new access token in memory only
        this.accessToken = result.accessToken;
        if (result.refreshToken) {
          this.refreshToken = result.refreshToken;
        }

        // Update sessionStorage (client-side only)
        if (typeof window !== "undefined") {
          // Note: Access token is NOT stored - kept in memory only
          if (result.refreshToken) {
            sessionStorage.setItem(this.REFRESH_TOKEN_KEY, result.refreshToken);
          }
        }

        return {
          success: true,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        };
      } else {
        // Clear invalid tokens
        this.clearTokens();
        return {
          success: false,
          error: !result.success ? result.error : "Token refresh failed",
        };
      }
    } catch (error) {
      this.clearTokens();
      return {
        success: false,
        error: error instanceof Error ? error.message : "Token refresh failed",
      };
    }
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<boolean> {
    if (this.accessToken && typeof window !== "undefined") {
      try {
        let trpcClient;
        try {
          trpcClient = getTRPCClient();
        } catch {
          trpcClient = null;
        }

        if (trpcClient?.auth?.logout?.mutate) {
          await trpcClient.auth.logout.mutate({
            accessToken: this.accessToken,
          });
        }
      } catch {
        // Ignore logout errors
      }
    }

    this.clearTokens();
    return true;
  }

  /**
   * Validate the current access token
   */
  async validate(): Promise<ValidateResponse> {
    if (!this.accessToken) {
      return {
        success: false,
        error: "No access token available",
      };
    }

    // Check if we're on the client side
    if (typeof window === "undefined") {
      return {
        success: false,
        error: "Token validation is only available on the client side",
      };
    }

    try {
      let trpcClient;
      try {
        trpcClient = getTRPCClient();
      } catch {
        trpcClient = null;
      }

      if (!trpcClient?.auth?.validate?.mutate) {
        return { success: false, error: "tRPC client unavailable" };
      }

      const result = await trpcClient.auth.validate.mutate({
        accessToken: this.accessToken,
      });

      if (result.success && result.user) {
        this.user = result.user;
        // Update user in sessionStorage (client-side only)
        if (typeof window !== "undefined") {
          sessionStorage.setItem(this.USER_KEY, JSON.stringify(result.user));
        }

        return {
          success: true,
          user: result.user,
        };
      } else {
        // Token is invalid, try to refresh
        const refreshResult = await this.refresh();
        if (refreshResult.success) {
          // Retry validation with new token
          return this.validate();
        } else {
          this.clearTokens();
          return {
            success: false,
            error: !result.success ? result.error : "Token validation failed",
          };
        }
      }
    } catch (error) {
      // Try to refresh token on error
      const refreshResult = await this.refresh();
      if (refreshResult.success) {
        return this.validate();
      } else {
        this.clearTokens();
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Token validation failed",
        };
      }
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.user;
  }

  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    return this.user;
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Clear all tokens and user data securely
   */
  private clearTokens(): void {
    // Clear in-memory tokens
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;

    if (typeof window !== "undefined") {
      // Clear sessionStorage
      sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(this.USER_KEY);

      // Also clear any legacy localStorage items (security cleanup)
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  }

  /**
   * Initialize authentication state
   */
  async initialize(): Promise<boolean> {
    if (this.accessToken && this.user) {
      // Validate existing token
      const validation = await this.validate();
      return validation.success;
    }
    return false;
  }
}

// Export singleton instance
export const authService = new AuthService();
