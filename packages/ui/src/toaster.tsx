"use client";

import { useToast, type ToasterToast } from "@/frontend/hooks/useToast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";
import type { JSX } from "react";

/**
 * A component that renders all the toasts that have been dispatched.
 * It should be placed at the root of your application to display any
 * active toasts.
 * @returns {JSX.Element} The Toaster component.
 * @example
 * // In your root layout (e.g., layout.tsx)
 * import { Toaster } from "@//ui/toaster";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="en">
 *       <body>{children}<Toaster /></body>
 *     </html>
 *   );
 * }
 */
export function Toaster(): JSX.Element {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        ...props
      }: ToasterToast) {
        return (
          <Toast
            key={id}
            {...props}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
