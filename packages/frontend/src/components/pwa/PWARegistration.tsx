/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { PWAInstallPrompt } from "./PWAInstallPrompt";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

/**
 * PWA Registration component that handles service worker registration
 * and provides install prompt functionality with enhanced error handling
 */
export function PWARegistration() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enhanced feature detection
  const isEnvironmentSupported = useCallback(() => {
    try {
      return (
        typeof window !== "undefined" &&
        window !== null &&
        typeof navigator !== "undefined" &&
        navigator !== null &&
        "serviceWorker" in navigator &&
        navigator.serviceWorker !== null &&
        typeof navigator.serviceWorker.register === "function"
      );
    } catch (err) {
      console.warn("PWA: Environment check failed:", err);
      return false;
    }
  }, []);

  // Safe event listener helper
  const safeAddEventListener = useCallback(
    (
      target: any,
      event: string,
      handler: EventListener,
      options?: AddEventListenerOptions,
    ): boolean => {
      try {
        if (
          target &&
          typeof target.addEventListener === "function" &&
          typeof handler === "function"
        ) {
          target.addEventListener(event, handler, options);
          return true;
        }
        console.warn(
          `PWA: Cannot attach ${event} listener - invalid target or handler`,
        );
        return false;
      } catch (err) {
        console.error(`PWA: Failed to attach ${event} listener:`, err);
        return false;
      }
    },
    [],
  );

  // Safe event listener removal helper
  const safeRemoveEventListener = useCallback(
    (
      target: any,
      event: string,
      handler: EventListener,
      options?: EventListenerOptions,
    ): boolean => {
      try {
        if (
          target &&
          typeof target.removeEventListener === "function" &&
          typeof handler === "function"
        ) {
          target.removeEventListener(event, handler, options);
          return true;
        }
        return false;
      } catch (err) {
        console.error(`PWA: Failed to remove ${event} listener:`, err);
        return false;
      }
    },
    [],
  );

  // Enhanced service worker registration with comprehensive error handling
  const registerServiceWorker = useCallback(async () => {
    if (!isEnvironmentSupported()) {
      console.log("PWA: Service workers not supported in this environment");
      return;
    }

    try {
      console.log("PWA: Attempting service worker registration...");

      // Additional safety check
      if (typeof navigator.serviceWorker.register !== "function") {
        throw new Error("Service worker register method is not available");
      }

      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      // Validate registration object
      if (!registration || typeof registration !== "object") {
        throw new Error("Service worker registration returned invalid object");
      }

      console.log("PWA: Service worker registered successfully:", registration);

      // Handle service worker updates with enhanced safety
      if (typeof registration.addEventListener === "function") {
        const handleUpdateFound = () => {
          try {
            console.log("PWA: New service worker version found");
            const newWorker = registration.installing;

            if (newWorker && typeof newWorker.addEventListener === "function") {
              const handleStateChange = () => {
                try {
                  if (
                    newWorker.state === "installed" &&
                    navigator?.serviceWorker?.controller
                  ) {
                    console.log(
                      "PWA: New content available, refresh to update",
                    );
                    // You could dispatch a custom event here for UI updates
                    window.dispatchEvent(
                      new CustomEvent("sw-update-available"),
                    );
                  }
                } catch (err) {
                  console.error("PWA: State change handler error:", err);
                }
              };

              safeAddEventListener(newWorker, "statechange", handleStateChange);
            }
          } catch (err) {
            console.error("PWA: Update found handler error:", err);
          }
        };

        safeAddEventListener(registration, "updatefound", handleUpdateFound);
      }

      // Handle service worker messages with enhanced safety
      if (
        navigator.serviceWorker &&
        typeof navigator.serviceWorker.addEventListener === "function"
      ) {
        const handleMessage = (event: Event) => {
          try {
            const messageEvent = event as MessageEvent;
            if (messageEvent?.data) {
              console.log(
                "PWA: Message from service worker:",
                messageEvent.data,
              );
              // Handle specific message types here if needed
            }
          } catch (err) {
            console.error("PWA: Message handler error:", err);
          }
        };

        safeAddEventListener(navigator.serviceWorker, "message", handleMessage);
      }

      return registration;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("PWA: Service worker registration failed:", error);
      setError(`Service worker registration failed: ${errorMessage}`);
      throw error;
    }
  }, [isEnvironmentSupported, safeAddEventListener]);

  // Enhanced install click handler with comprehensive error handling
  const handleInstallClick = useCallback(async () => {
    try {
      // Comprehensive validation of deferred prompt
      if (
        !deferredPrompt ||
        typeof deferredPrompt !== "object" ||
        typeof deferredPrompt.prompt !== "function"
      ) {
        console.warn("PWA: Invalid or missing install prompt object");
        setIsInstallable(false);
        setDeferredPrompt(null);
        return;
      }

      console.log("PWA: Showing install prompt");

      // Call prompt method with additional safety
      await deferredPrompt.prompt();

      // Validate userChoice availability
      if (
        !deferredPrompt.userChoice ||
        typeof deferredPrompt.userChoice.then !== "function"
      ) {
        console.warn("PWA: User choice promise not available");
        setDeferredPrompt(null);
        setIsInstallable(false);
        return;
      }

      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult && typeof choiceResult === "object") {
        console.log("PWA: User choice:", choiceResult.outcome);

        if (choiceResult.outcome === "accepted") {
          console.log("PWA: User accepted install prompt");
          setIsInstalled(true);
        } else {
          console.log("PWA: User dismissed install prompt");
        }
      }

      // Clean up prompt state
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("PWA: Install prompt failed:", error);
      setError(`Install prompt failed: ${errorMessage}`);

      // Clean up state on error
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  }, [deferredPrompt]);

  // Enhanced dismiss handler
  const handleDismiss = useCallback(() => {
    try {
      console.log("PWA: Install prompt dismissed by user");
      setIsInstallable(false);
      setDeferredPrompt(null);
      setError(null);
    } catch (err) {
      console.error("PWA: Error in dismiss handler:", err);
    }
  }, []);

  useEffect(() => {
    // Clear any previous errors
    setError(null);

    // Enhanced environment check
    if (!isEnvironmentSupported()) {
      console.log("PWA: Environment not supported, skipping PWA setup");
      return;
    }

    // Register service worker with error handling
    registerServiceWorker().catch((err) => {
      console.error("PWA: Service worker registration failed in effect:", err);
    });

    // Enhanced install prompt handler
    const handleBeforeInstallPrompt = (e: Event) => {
      try {
        const promptEvent = e as BeforeInstallPromptEvent;
        if (!promptEvent || typeof promptEvent !== "object") {
          console.warn("PWA: Invalid install prompt event");
          return;
        }

        console.log("PWA: Install prompt available");
        promptEvent.preventDefault();

        // Additional validation of prompt object
        if (
          typeof promptEvent.prompt === "function" &&
          promptEvent.userChoice &&
          typeof promptEvent.userChoice.then === "function"
        ) {
          setDeferredPrompt(promptEvent);
          setIsInstallable(true);
          setError(null);
        } else {
          console.warn("PWA: Install prompt event missing required methods");
        }
      } catch (err) {
        console.error("PWA: Error handling install prompt event:", err);
        setError("Failed to handle install prompt");
      }
    };

    // Enhanced app installed handler
    const handleAppInstalled = (e: Event) => {
      try {
        console.log("PWA: App was installed", e);
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        setError(null);
      } catch (err) {
        console.error("PWA: Error handling app installed event:", err);
      }
    };

    // Enhanced installation check
    const checkIfInstalled = () => {
      try {
        if (typeof window === "undefined" || !window) return;

        // Check for standalone display mode
        let isStandalone = false;
        if (window.matchMedia && typeof window.matchMedia === "function") {
          const mediaQuery = window.matchMedia("(display-mode: standalone)");
          isStandalone = mediaQuery ? (mediaQuery.matches ?? false) : false;
        }

        // Check for iOS standalone mode
        let isIOSInstalled = false;
        if (navigator && navigator.userAgent) {
          const userAgent = navigator.userAgent;
          const isIOS = /iPad|iPhone|iPod/.test(userAgent);
          if (isIOS && navigator && (navigator as any).standalone === true) {
            isIOSInstalled = true;
          }
        }

        if (isStandalone || isIOSInstalled) {
          setIsInstalled(true);
          console.log("PWA: App is running as installed PWA");
        }
      } catch (err) {
        console.error("PWA: Error checking install status:", err);
      }
    };

    // Attach event listeners with enhanced error handling
    const listenersAttached = {
      beforeinstallprompt: false,
      appinstalled: false,
    };

    try {
      if (window && typeof window.addEventListener === "function") {
        listenersAttached.beforeinstallprompt = safeAddEventListener(
          window,
          "beforeinstallprompt",
          handleBeforeInstallPrompt,
        );
        listenersAttached.appinstalled = safeAddEventListener(
          window,
          "appinstalled",
          handleAppInstalled,
        );
      }
    } catch (err) {
      console.error("PWA: Failed to attach install listeners:", err);
      setError("Failed to initialize PWA listeners");
    }

    // Check installation status
    checkIfInstalled();

    // Cleanup function
    return () => {
      try {
        if (window && typeof window.removeEventListener === "function") {
          if (listenersAttached.beforeinstallprompt) {
            safeRemoveEventListener(
              window,
              "beforeinstallprompt",
              handleBeforeInstallPrompt,
            );
          }
          if (listenersAttached.appinstalled) {
            safeRemoveEventListener(window, "appinstalled", handleAppInstalled);
          }
        }
      } catch (err) {
        console.error("PWA: Error during cleanup:", err);
      }
    };
  }, [
    isEnvironmentSupported,
    registerServiceWorker,
    safeAddEventListener,
    safeRemoveEventListener,
  ]);

  // Error state rendering
  if (error) {
    console.error("PWA: Component error state:", error);
    // You might want to render an error UI here or report to error tracking
    return null;
  }

  // Enhanced conditional rendering with additional safety checks
  if (
    isInstallable &&
    !isInstalled &&
    PWAInstallPrompt &&
    typeof PWAInstallPrompt === "function"
  ) {
    try {
      return (
        <PWAInstallPrompt
          onInstall={handleInstallClick}
          onDismiss={handleDismiss}
        />
      );
    } catch (err) {
      console.error("PWA: Error rendering install prompt:", err);
      setError("Failed to render install prompt");
      return null;
    }
  }

  return null;
}
