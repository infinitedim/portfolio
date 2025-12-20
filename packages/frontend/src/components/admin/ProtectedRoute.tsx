"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

/**
 * Props for the ProtectedRoute component
 * @interface ProtectedRouteProps
 * @property {React.ReactNode} children - The content to display when authenticated
 * @property {React.ReactNode} [fallback] - Optional loading fallback component
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Protected route wrapper that requires authentication
 * Redirects to login page if user is not authenticated
 * @param {ProtectedRouteProps} props - Component props
 * @param {React.ReactNode} props.children - The content to display when authenticated
 * @param {React.ReactNode} [props.fallback] - Optional loading fallback component
 * @returns {JSX.Element | null} The protected content or null if not authenticated
 * @example
 * ```tsx
 * <ProtectedRoute>
 *   <AdminDashboard />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Checking authentication...</p>
          </div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
