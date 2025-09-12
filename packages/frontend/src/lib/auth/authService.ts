import { trpc } from "../trpc";

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

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private user: AuthUser | null = null;

  constructor() {
    // Load tokens from localStorage on initialization (client-side only)
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("accessToken");
      this.refreshToken = localStorage.getItem("refreshToken");
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          this.user = JSON.parse(userStr);
        } catch {
          this.user = null;
        }
      }
    }
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

      // Use the tRPC mutation directly
      const result = await trpc.auth.login.mutate({ email, password });

      if (result.success && result.accessToken && result.user) {
        this.accessToken = result.accessToken;
        this.refreshToken = result.refreshToken || null;
        this.user = result.user;

        // Store in localStorage (client-side only)
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", result.accessToken);
          if (result.refreshToken) {
            localStorage.setItem("refreshToken", result.refreshToken);
          }
          localStorage.setItem("user", JSON.stringify(result.user));
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
          error: result.error || "Login failed",
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
      const result = await trpc.auth.refresh.mutate({
        refreshToken: this.refreshToken,
      });

      if (result.success && result.accessToken) {
        this.accessToken = result.accessToken;
        if (result.refreshToken) {
          this.refreshToken = result.refreshToken;
        }

        // Update localStorage (client-side only)
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", result.accessToken);
          if (result.refreshToken) {
            localStorage.setItem("refreshToken", result.refreshToken);
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
          error: result.error || "Token refresh failed",
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
        await trpc.auth.logout.mutate({ accessToken: this.accessToken });
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
      const result = await trpc.auth.validate.mutate({
        accessToken: this.accessToken,
      });

      if (result.success && result.user) {
        this.user = result.user;
        // Update user in localStorage (client-side only)
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(result.user));
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
            error: result.error || "Token validation failed",
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
   * Clear all tokens and user data
   */
  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;

    if (typeof window !== "undefined") {
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
