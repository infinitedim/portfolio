// "use client";

import type { ReactNode, JSX } from "react";
// import { useState, useEffect } from "react";
import { AuthProvider } from "../lib/auth/AuthContext";
import { AccessibilityProvider } from "../components/accessibility/AccessibilityProvider";
import { ScreenReaderAnnouncer } from "../components/accessibility/ScreenReaderAnnouncer";
// import { TRPCProvider } from "../components/provider/TrpcProvider";
// import { PWARegistration } from "../components/pwa/PWARegistration";

interface ClientLayoutProps {
  children: ReactNode;
}

/**
 * Client-only layout boundary that contains all providers / hooks requiring the browser.
 * Kept separate from the server `layout.tsx` to avoid mixing RSC and client logic.
 */
export default function ClientLayout({
  children,
}: ClientLayoutProps): JSX.Element {
  // const [isClient, setIsClient] = useState(false);

  // useEffect(() => {
  //   setIsClient(true);
  // }, []);

  // // Don't render client-only components during SSR
  // if (!isClient) {
  //   return <div>{children}</div>;
  // }

  return (
    <>
      {/* <PWARegistration /> */}
      {/* <TRPCProvider> */}
      <AuthProvider>
        <AccessibilityProvider>
          <ScreenReaderAnnouncer message="Terminal Portfolio" />
          {children}
        </AccessibilityProvider>
      </AuthProvider>
      {/* </TRPCProvider> */}
    </>
  );
}
