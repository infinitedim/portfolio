"use client";

import {useState, useEffect, useCallback, useRef, useMemo} from "react";

interface MobileState {
  isMobile: boolean;
  isTablet: boolean;
  orientation: "portrait" | "landscape";
  isVirtualKeyboardOpen: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
} as const;

const KEYBOARD_THRESHOLD = 0.75;
const RESIZE_DEBOUNCE_MS = 100;

/**
 * A custom React hook to detect mobile device properties and state.
 *
 * Optimized for performance with:
 * - Lazy device detection (cached after first call)
 * - Debounced resize handling to prevent excessive updates
 * - RequestAnimationFrame throttling for smooth performance
 * - Consolidated state updates to reduce re-renders
 * - Proper cleanup of all event listeners
 *
 * @returns {MobileState} An object containing the current mobile device state.
 * @property {boolean} isMobile - True if screen width is less than or equal to 768px.
 * @property {boolean} isTablet - True if screen width is between 768px and 1024px.
 * @property {"portrait" | "landscape"} orientation - Current screen orientation.
 * @property {boolean} isVirtualKeyboardOpen - True if the virtual keyboard is likely open.
 * @property {boolean} isIOS - True if the device is iOS.
 * @property {boolean} isAndroid - True if the device is Android.
 *
 * @example
 * ```tsx
 * const { isMobile, isTablet, orientation, isVirtualKeyboardOpen } = useMobile();
 *
 * if (isMobile) {
 *   return <MobileLayout />;
 * }
 * ```
 */
export function useMobile(): MobileState {
  const isMountedRef = useRef(true);
  const rafIdRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const deviceInfo = useMemo(() => {
    if (typeof window === "undefined") {
      return {isIOS: false, isAndroid: false};
    }
    const userAgent = navigator.userAgent;
    return {
      isIOS: /iPad|iPhone|iPod/.test(userAgent),
      isAndroid: /Android/.test(userAgent),
    };
  }, []);

  const [mobileState, setMobileState] = useState<MobileState>(() => {
    if (typeof window === "undefined") {
      return {
        isMobile: false,
        isTablet: false,
        orientation: "portrait",
        isVirtualKeyboardOpen: false,
        isIOS: false,
        isAndroid: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    return {
      isMobile: width <= BREAKPOINTS.MOBILE,
      isTablet: width > BREAKPOINTS.MOBILE && width <= BREAKPOINTS.TABLET,
      orientation: height > width ? "portrait" : "landscape",
      isVirtualKeyboardOpen: false,
      ...deviceInfo,
    };
  });

  const updateState = useCallback(() => {
    if (!isMountedRef.current || typeof window === "undefined") return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const viewportHeight = window.visualViewport?.height || height;

    const newState: MobileState = {
      isMobile: width <= BREAKPOINTS.MOBILE,
      isTablet: width > BREAKPOINTS.MOBILE && width <= BREAKPOINTS.TABLET,
      orientation: height > width ? "portrait" : "landscape",
      isVirtualKeyboardOpen: viewportHeight < height * KEYBOARD_THRESHOLD,
      ...deviceInfo,
    };

    setMobileState((prev) => {
      if (
        prev.isMobile === newState.isMobile &&
        prev.isTablet === newState.isTablet &&
        prev.orientation === newState.orientation &&
        prev.isVirtualKeyboardOpen === newState.isVirtualKeyboardOpen
      ) {
        return prev;
      }
      return newState;
    });
  }, [deviceInfo]);

  const debouncedUpdate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(updateState);
    }, RESIZE_DEBOUNCE_MS);
  }, [updateState]);

  useEffect(() => {
    isMountedRef.current = true;

    if (typeof window === "undefined") return;

    updateState();

    window.addEventListener("resize", debouncedUpdate, {passive: true});
    window.addEventListener("orientationchange", debouncedUpdate, {
      passive: true,
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", debouncedUpdate, {
        passive: true,
      });
    }

    return () => {
      isMountedRef.current = false;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      window.removeEventListener("resize", debouncedUpdate);
      window.removeEventListener("orientationchange", debouncedUpdate);

      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", debouncedUpdate);
      }
    };
  }, [updateState, debouncedUpdate]);

  return mobileState;
}
