"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { debounce, throttle, useMountRef } from "./utils/hookUtils";

interface MobileState {
  isMobile: boolean;
  isTablet: boolean;
  orientation: "portrait" | "landscape";
  isVirtualKeyboardOpen: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

// Constants
const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
} as const;

const KEYBOARD_THRESHOLD = 0.75;

/**
 * A custom React hook to detect mobile device properties and state.
 *
 * This hook provides information about whether the user is on a mobile or tablet device,
 * the screen orientation, and whether the virtual keyboard is currently open.
 * @returns {object} An object containing the current mobile device state, conforming to the `MobileState` interface.
 * @property {boolean} isMobile True if the screen width is less than or equal to 768px.
 * @property {boolean} isTablet True if the screen width is between 768px and 1024px.
 * @property {"portrait" | "landscape"} orientation The current screen orientation.
 * @property {boolean} isVirtualKeyboardOpen True if the virtual keyboard is likely open.
 * @property {boolean} isIOS True if the device is iOS.
 * @property {boolean} isAndroid True if the device is Android.
 */
export function useMobile() {
  const isMountedRef = useMountRef();

  // MODIFICATION: Initialize with SSR-safe defaults to prevent hydration issues
  const [mobileState, setMobileState] = useState<MobileState>({
    isMobile: false,
    isTablet: false,
    orientation: "portrait",
    isVirtualKeyboardOpen: false,
    isIOS: false,
    isAndroid: false,
  });

  // Cached device info to avoid redundant calculations
  const deviceInfoRef = useRef<{ isIOS: boolean; isAndroid: boolean } | null>(
    null,
  );

  const getDeviceInfo = useCallback(() => {
    if (deviceInfoRef.current) return deviceInfoRef.current;

    if (typeof window === "undefined") {
      return { isIOS: false, isAndroid: false };
    }

    const userAgent = navigator.userAgent;
    const info = {
      isIOS: /iPad|iPhone|iPod/.test(userAgent),
      isAndroid: /Android/.test(userAgent),
    };

    deviceInfoRef.current = info;
    return info;
  }, []);

  const checkDevice = useCallback(() => {
    if (!isMountedRef.current || typeof window === "undefined") return;

    try {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width <= BREAKPOINTS.MOBILE;
      const isTablet =
        width > BREAKPOINTS.MOBILE && width <= BREAKPOINTS.TABLET;
      const orientation = height > width ? "portrait" : "landscape";
      const { isIOS, isAndroid } = getDeviceInfo();

      setMobileState((prev) => {
        // Only update if values have actually changed
        if (
          prev.isMobile === isMobile &&
          prev.isTablet === isTablet &&
          prev.orientation === orientation &&
          prev.isIOS === isIOS &&
          prev.isAndroid === isAndroid
        ) {
          return prev;
        }

        return {
          ...prev,
          isMobile,
          isTablet,
          orientation,
          isIOS,
          isAndroid,
        };
      });
    } catch (error) {
      console.warn("Error checking device state:", error);
    }
  }, [isMountedRef, getDeviceInfo]);

  const checkKeyboard = useCallback(() => {
    if (!isMountedRef.current || typeof window === "undefined") return;

    try {
      const viewportHeight =
        window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const isVirtualKeyboardOpen =
        viewportHeight < windowHeight * KEYBOARD_THRESHOLD;

      setMobileState((prev) => {
        if (prev.isVirtualKeyboardOpen === isVirtualKeyboardOpen) {
          return prev;
        }
        return {
          ...prev,
          isVirtualKeyboardOpen,
        };
      });
    } catch (error) {
      console.warn("Error checking keyboard state:", error);
    }
  }, [isMountedRef]);

  // Create debounced versions with proper cleanup
  const debouncedCheckDevice = useRef(debounce(checkDevice, 100));
  const throttledCheckKeyboard = useRef(throttle(checkKeyboard, 100));

  // Update debounced functions when dependencies change
  useEffect(() => {
    debouncedCheckDevice.current = debounce(checkDevice, 100);
    throttledCheckKeyboard.current = throttle(checkKeyboard, 100);
  }, [checkDevice, checkKeyboard]);

  useEffect(() => {
    // Only run on client side to avoid hydration mismatch
    if (typeof window === "undefined" || !isMountedRef.current) return;

    // Initial check
    checkDevice();
    checkKeyboard();

    // Event listeners with optimized handlers
    const handleResize = debouncedCheckDevice.current;
    const handleOrientationChange = () => {
      // Small delay to ensure viewport has updated
      setTimeout(checkDevice, 100);
    };
    const handleKeyboardResize = throttledCheckKeyboard.current;

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleOrientationChange);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleKeyboardResize);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener(
          "resize",
          handleKeyboardResize,
        );
      }
    };
  }, [checkDevice, checkKeyboard, isMountedRef]);

  return mobileState;
}
