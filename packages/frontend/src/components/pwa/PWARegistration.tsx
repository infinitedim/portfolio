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
    // Register service worker
    registerServiceWorker();

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
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
      const isStandalone = window.matchMedia(
        "(display-mode: standalone)",
      ).matches;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isIOSInstalled =
        isIOS && (navigator as unknown as { standalone?: boolean }).standalone;

      if (isStandalone || isIOSInstalled) {
        setIsInstalled(true);
        console.log("PWA: App is running as installed PWA");
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    checkIfInstalled();

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const registerServiceWorker = async () => {
    if ("serviceWorker" in navigator) {
      try {
        console.log("PWA: Registering service worker...");

        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log(
          "PWA: Service worker registered successfully:",
          registration,
        );

        // Handle service worker updates
        registration.addEventListener("updatefound", () => {
          console.log("PWA: New service worker version found");
          const newWorker = registration.installing;

          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                console.log("PWA: New content available, refresh to update");
                // You could show a notification here to refresh
              }
            });
          }
        });

        // Handle service worker messages
        navigator.serviceWorker.addEventListener("message", (event) => {
          console.log("PWA: Message from service worker:", event.data);
        });
      } catch (error) {
        console.error("PWA: Service worker registration failed:", error);
      }
    } else {
      console.log("PWA: Service workers not supported");
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      console.log("PWA: Showing install prompt");
      await deferredPrompt.prompt();

      const choiceResult = await deferredPrompt.userChoice;
      console.log("PWA: User choice:", choiceResult.outcome);

      if (choiceResult.outcome === "accepted") {
        console.log("PWA: User accepted install prompt");
      } else {
        console.log("PWA: User dismissed install prompt");
      }

      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error("PWA: Install prompt failed:", error);
    }
  };

  // Don't render anything in the UI - this is just for PWA functionality
  // But we could add an install prompt if needed
  if (isInstallable && !isInstalled) {
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
