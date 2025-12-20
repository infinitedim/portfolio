"use client";

import { useEffect, useState, ReactNode } from "react";

/**
 * Props for the NoSSR component
 * @interface NoSSRProps
 * @property {ReactNode} children - Content to render only on client side
 * @property {ReactNode} [fallback] - Optional fallback during SSR
 */
interface NoSSRProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Client-side only rendering component to prevent hydration mismatches
 * Ensures children are only rendered after component mounts on the client
 * @param {NoSSRProps} props - Component props
 * @param {ReactNode} props.children - Content to render client-side
 * @param {ReactNode} [props.fallback=null] - Fallback during SSR
 * @returns {JSX.Element} The client-rendered content or fallback
 * @example
 * ```tsx
 * <NoSSR fallback={<div>Loading...</div>}>
 *   <ClientOnlyComponent />
 * </NoSSR>
 * ```
 */
export function NoSSR({ children, fallback = null }: NoSSRProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
