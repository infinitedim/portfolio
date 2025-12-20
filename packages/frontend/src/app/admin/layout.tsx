"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SecureAuth } from "../../lib/auth/secureAuth";

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Admin layout component that provides authentication protection
 * @param {AdminLayoutProps} props - The layout props
 * @returns {React.JSX.Element} - Admin layout component
 */
export default function AdminLayout({
  children,
}: AdminLayoutProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setIsAuthenticated(true);
      return;
    }

    const verifyAuth = async (): Promise<void> => {
      try {
        const result = await SecureAuth.verifyAuthentication();
        if (result.isValid) {
          setIsAuthenticated(true);
        } else {
          router.push("/admin/login");
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        router.push("/admin/login");
      }
    };

    verifyAuth();
  }, [router, pathname]);

  if (isAuthenticated === null && pathname !== "/admin/login") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated || pathname === "/admin/login") {
    return <>{children}</>;
  }

  return <></>;
}
