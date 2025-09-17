"use client";

import { useEffect, useState } from "react";
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
 * and provides install prompt functionality
 */
export function PWARegistration() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Register service worker (guarded for dev/HMR environments)
    try {
      if (
        typeof window !== "undefined" &&
        window != null &&
        navigator != null &&
        "serviceWorker" in navigator
      ) {
        registerServiceWorker();
      }
    } catch (err) {
      console.warn("PWA: serviceWorker registration skipped:", err);
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      if (e == null) return;
      console.log("PWA: Install prompt available");
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Handle app installed
    const handleAppInstalled = () => {
      console.log("PWA: App was installed");
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Check if already installed
    const checkIfInstalled = () => {
      if (typeof window === "undefined" || window == null) return;

      const mediaQuery = window.matchMedia?.("(display-mode: standalone)");
      const isStandalone = mediaQuery?.matches ?? false;

      const userAgent = navigator?.userAgent ?? "";
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isIOSInstalled =
        isIOS &&
        navigator != null &&
        (navigator as unknown as { standalone?: boolean }).standalone === true;

      if (isStandalone || isIOSInstalled) {
        setIsInstalled(true);
        console.log("PWA: App is running as installed PWA");
      }
    };

    try {
      if (
        typeof window !== "undefined" &&
        window != null &&
        window.addEventListener != null
      ) {
        window.addEventListener(
          "beforeinstallprompt",
          handleBeforeInstallPrompt,
        );
        window.addEventListener("appinstalled", handleAppInstalled);
      }
    } catch (err) {
      console.warn("PWA: failed to attach install listeners:", err);
    }

    checkIfInstalled();

    return () => {
      try {
        if (
          typeof window !== "undefined" &&
          window != null &&
          window.removeEventListener != null
        ) {
          window.removeEventListener(
            "beforeinstallprompt",
            handleBeforeInstallPrompt,
          );
          window.removeEventListener("appinstalled", handleAppInstalled);
        }
      } catch (err) {
        console.warn("PWA: failed to remove install listeners:", err);
      }
    };
  }, []);

  const registerServiceWorker = async () => {
    if (
      typeof navigator === "undefined" ||
      navigator == null ||
      !("serviceWorker" in navigator) ||
      navigator.serviceWorker == null
    ) {
      console.log("PWA: Service workers not supported");
      return;
    }

    try {
      console.log("PWA: Registering service worker...");

      const registration = await navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
        })
        .catch((e) => {
          console.warn("PWA: serviceWorker.register rejected:", e);
          return null;
        });

      if (registration == null) {
        console.log("PWA: Service worker registration returned null");
        return;
      }

      console.log("PWA: Service worker registered successfully:", registration);

      // Handle service worker updates
      try {
        if (registration.addEventListener != null) {
          registration.addEventListener("updatefound", () => {
            console.log("PWA: New service worker version found");
            const newWorker = registration.installing;

            if (newWorker != null && newWorker.addEventListener != null) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator?.serviceWorker?.controller != null
                ) {
                  console.log("PWA: New content available, refresh to update");
                }
              });
            }
          });
        }
      } catch (err) {
        console.warn("PWA: failed to attach updatefound listener:", err);
      }

      // Handle service worker messages
      try {
        if (
          navigator.serviceWorker != null &&
          navigator.serviceWorker.addEventListener != null
        ) {
          navigator.serviceWorker.addEventListener("message", (event) => {
            if (event?.data != null) {
              console.log("PWA: Message from service worker:", event.data);
            }
          });
        }
      } catch (err) {
        console.warn("PWA: failed to attach message listener:", err);
      }
    } catch (error) {
      console.error("PWA: Service worker registration failed:", error);
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt == null || deferredPrompt.prompt == null) {
      console.warn("PWA: No deferred prompt available");
      return;
    }

    try {
      console.log("PWA: Showing install prompt");
      await deferredPrompt.prompt();

      if (deferredPrompt.userChoice == null) {
        console.warn("PWA: User choice not available");
        setDeferredPrompt(null);
        setIsInstallable(false);
        return;
      }

      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult != null) {
        console.log("PWA: User choice:", choiceResult.outcome);

        if (choiceResult.outcome === "accepted") {
          console.log("PWA: User accepted install prompt");
        } else {
          console.log("PWA: User dismissed install prompt");
        }
      }

      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error("PWA: Install prompt failed:", error);
    }
  };

  // Don't render anything in the UI - this is just for PWA functionality
  // But we could add an install prompt if needed
  if (isInstallable && !isInstalled && PWAInstallPrompt != null) {
    return (
      <PWAInstallPrompt
        onInstall={handleInstallClick}
        onDismiss={() => {
          setIsInstallable(false);
          setDeferredPrompt(null);
        }}
      />
    );
  }

  return null;
}
