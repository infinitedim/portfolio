"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PWAInstallPrompt } from "@/components/molecules/pwa/pwa-install-prompt";

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
 * and provides install prompt functionality with comprehensive error handling
 *
 * Features:
 * - Service worker registration with update handling
 * - Install prompt management
 * - Cross-browser compatibility
 * - Comprehensive error handling
 * - Memory leak prevention
 */
export function PWARegistration() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);

  const mountedRef = useRef(true);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const handlersRef = useRef<{
    beforeInstallPrompt: ((e: Event) => void) | null;
    appInstalled: ((e: Event) => void) | null;
    updateFound: (() => void) | null;
    stateChange: (() => void) | null;
    message: ((e: Event) => void) | null;
  }>({
    beforeInstallPrompt: null,
    appInstalled: null,
    updateFound: null,
    stateChange: null,
    message: null,
  });

  const isEnvironmentSupported = useCallback((): boolean => {
    try {
      if (typeof window === "undefined" || !window) {
        return false;
      }

      if (typeof navigator === "undefined" || !navigator) {
        return false;
      }

      if (!("serviceWorker" in navigator) || !navigator.serviceWorker) {
        return false;
      }

      if (typeof navigator.serviceWorker.register !== "function") {
        return false;
      }

      if (!window.isSecureContext) {
        console.warn("PWA: Not in secure context (HTTPS required)");
        return false;
      }

      return true;
    } catch (err) {
      console.warn("PWA: Environment check failed:", err);
      return false;
    }
  }, []);

  const safeAddEventListener = useCallback(
    <K extends keyof WindowEventMap>(
      target: EventTarget | null,
      event: K | string,
      handler: EventListener | null,
      options?: AddEventListenerOptions,
    ): boolean => {
      if (!target || !handler || typeof handler !== "function") {
        return false;
      }

      try {
        target.addEventListener(event as string, handler, options);
        return true;
      } catch (err) {
        console.error(`PWA: Failed to add ${event} listener:`, err);
        return false;
      }
    },
    [],
  );

  const safeRemoveEventListener = useCallback(
    <K extends keyof WindowEventMap>(
      target: EventTarget | null,
      event: K | string,
      handler: EventListener | null,
      options?: EventListenerOptions,
    ): boolean => {
      if (!target || !handler || typeof handler !== "function") {
        return false;
      }

      try {
        target.removeEventListener(event as string, handler, options);
        return true;
      } catch (err) {
        console.error(`PWA: Failed to remove ${event} listener:`, err);
        return false;
      }
    },
    [],
  );

  const checkInstallationStatus = useCallback((): boolean => {
    try {
      if (typeof window === "undefined" || !window) return false;

      const isStandalone =
        window.matchMedia?.("(display-mode: standalone)")?.matches || false;
      const isIOSStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
      const isTWA = document.referrer.includes("android-app://");
      const isInstalledPWA = isStandalone || isIOSStandalone || isTWA;

      if (isInstalledPWA) {
        console.log("PWA: App is running as installed PWA");
      }

      return isInstalledPWA;
    } catch (err) {
      console.error("PWA: Error checking installation status:", err);
      return false;
    }
  }, []);

  const registerServiceWorker =
    useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
      if (!isEnvironmentSupported()) {
        console.log("PWA: Service workers not supported");
        return null;
      }

      try {
        console.log("PWA: Registering service worker...");

        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        if (!registration) {
          throw new Error("Registration returned null");
        }

        registrationRef.current = registration;
        console.log(
          "PWA: Service worker registered successfully:",
          registration,
        );

        registration.update().catch((err) => {
          console.warn("PWA: Update check failed:", err);
        });

        handlersRef.current.updateFound = () => {
          if (!mountedRef.current) return;

          const newWorker = registration.installing;
          if (!newWorker) return;

          console.log("PWA: New service worker found");

          handlersRef.current.stateChange = () => {
            if (!mountedRef.current) return;

            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log("PWA: New content available");
              setSwUpdateAvailable(true);

              window.dispatchEvent(new CustomEvent("sw-update-available"));
            }
          };

          safeAddEventListener(
            newWorker,
            "statechange",
            handlersRef.current.stateChange,
          );
        };

        safeAddEventListener(
          registration,
          "updatefound",
          handlersRef.current.updateFound,
        );

        handlersRef.current.message = (event: Event) => {
          if (!mountedRef.current) return;

          const messageEvent = event as MessageEvent;
          if (messageEvent.data?.type === "SKIP_WAITING_COMPLETE") {
            console.log("PWA: Reloading for update...");
            window.location.reload();
          }
        };

        safeAddEventListener(
          navigator.serviceWorker,
          "message",
          handlersRef.current.message,
        );

        return registration;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        if (!errorMessage.includes("404") && !errorMessage.includes("Failed to register")) {
          console.error("PWA: Service worker registration failed:", error);
        } else {
          console.warn("PWA: Service worker not available:", errorMessage);
        }

        if (!errorMessage.includes("404") && !errorMessage.includes("bad HTTP response code")) {
          setError(`Service worker registration failed: ${errorMessage}`);
        }
        return null;
      }
    }, [isEnvironmentSupported, safeAddEventListener]);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) {
      console.warn("PWA: No deferred prompt available");
      setIsInstallable(false);
      return;
    }

    try {
      console.log("PWA: Showing install prompt...");
      if (typeof deferredPrompt.prompt !== "function") {
        throw new Error("Prompt method not available");
      }

      await deferredPrompt.prompt();
      if (
        deferredPrompt.userChoice &&
        typeof deferredPrompt.userChoice.then === "function"
      ) {
        const choiceResult = await deferredPrompt.userChoice;

        console.log("PWA: User choice:", choiceResult?.outcome);

        if (choiceResult?.outcome === "accepted") {
          console.log("PWA: User accepted installation");
          setIsInstalled(true);

          window.dispatchEvent(new CustomEvent("pwa-installed"));
        } else {
          console.log("PWA: User dismissed installation");
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("PWA: Install prompt failed:", error);
      setError(`Install prompt failed: ${errorMessage}`);
    } finally {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    console.log("PWA: Install prompt dismissed");
    setIsInstallable(false);
    setDeferredPrompt(null);
    setError(null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    setError(null);

    if (!isEnvironmentSupported()) {
      console.log("PWA: Environment not supported");
      return;
    }

    if (checkInstallationStatus()) {
      setIsInstalled(true);
      setIsInstallable(false);
    }

    registerServiceWorker().catch((err) => {
      console.error("PWA: Registration failed in effect:", err);
    });

    handlersRef.current.beforeInstallPrompt = (e: Event) => {
      if (!mountedRef.current) return;

      const promptEvent = e as BeforeInstallPromptEvent;

      console.log("PWA: Install prompt available");
      e.preventDefault();

      if (
        promptEvent &&
        typeof promptEvent.prompt === "function" &&
        promptEvent.userChoice &&
        typeof promptEvent.userChoice.then === "function"
      ) {
        setDeferredPrompt(promptEvent);
        setIsInstallable(true);
        setError(null);
      } else {
        console.warn("PWA: Invalid install prompt event");
      }
    };

    handlersRef.current.appInstalled = (e: Event) => {
      if (!mountedRef.current) return;

      console.log("PWA: App was installed", e);
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setError(null);
    };

    safeAddEventListener(
      window,
      "beforeinstallprompt",
      handlersRef.current.beforeInstallPrompt,
    );
    safeAddEventListener(
      window,
      "appinstalled",
      handlersRef.current.appInstalled,
    );

    return () => {
      mountedRef.current = false;

      if (handlersRef.current.beforeInstallPrompt) {
        safeRemoveEventListener(
          window,
          "beforeinstallprompt",
          handlersRef.current.beforeInstallPrompt,
        );
      }

      if (handlersRef.current.appInstalled) {
        safeRemoveEventListener(
          window,
          "appinstalled",
          handlersRef.current.appInstalled,
        );
      }

      if (registrationRef.current && handlersRef.current.updateFound) {
        safeRemoveEventListener(
          registrationRef.current,
          "updatefound",
          handlersRef.current.updateFound,
        );
      }

      if (navigator.serviceWorker && handlersRef.current.message) {
        safeRemoveEventListener(
          navigator.serviceWorker,
          "message",
          handlersRef.current.message,
        );
      }

      registrationRef.current = null;
      handlersRef.current = {
        beforeInstallPrompt: null,
        appInstalled: null,
        updateFound: null,
        stateChange: null,
        message: null,
      };
    };
  }, [
    isEnvironmentSupported,
    checkInstallationStatus,
    registerServiceWorker,
    safeAddEventListener,
    safeRemoveEventListener,
  ]);

  useEffect(() => {
    if (swUpdateAvailable && mountedRef.current) {
      const shouldUpdate = window.confirm(
        "A new version is available! Would you like to update now?",
      );

      if (shouldUpdate) {
        if (registrationRef.current?.waiting) {
          registrationRef.current.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      }

      setSwUpdateAvailable(false);
    }
  }, [swUpdateAvailable]);

  useEffect(() => {
    if (error) {
      // Only log non-critical errors (404s are expected if service worker is optional)
      if (!error.includes("404") && !error.includes("bad HTTP response code")) {
        console.error("PWA Component Error:", error);
      } else {
        // Silently ignore 404 errors for service worker - it's optional
        console.debug("PWA: Service worker not available (expected in some environments)");
      }
    }
  }, [error]);

  if (!isInstallable || isInstalled) {
    return null;
  }

  try {
    return (
      <PWAInstallPrompt
        onInstall={handleInstallClick}
        onDismiss={handleDismiss}
        delay={5000}
        persistDismissal={true}
      />
    );
  } catch (err) {
    console.error("PWA: Error rendering install prompt:", err);
    return null;
  }
}

export default PWARegistration;
