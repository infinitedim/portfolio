import { useRef, useCallback, useState, useMemo } from "react";
import { useTimerManager, useMountRef } from "./utils/hookUtils";

/**
 * Configuration thresholds and delays for gesture recognition
 * @interface GestureConfig
 * @property {number} swipeThreshold - Minimum pixel distance to register a swipe
 * @property {number} longPressDelay - Duration in ms to register a long press
 * @property {number} doubleTapDelay - Maximum time between taps for double tap
 * @property {number} pinchThreshold - Minimum scale change to register pinch gesture
 */
export interface GestureConfig {
  swipeThreshold: number;
  longPressDelay: number;
  doubleTapDelay: number;
  pinchThreshold: number;
}

/**
 * Callback functions for various gesture events
 * @interface GestureCallbacks
 * @property {Function} [onSwipeLeft] - Called when user swipes left
 * @property {Function} [onSwipeRight] - Called when user swipes right
 * @property {Function} [onSwipeUp] - Called when user swipes up
 * @property {Function} [onSwipeDown] - Called when user swipes down
 * @property {Function} [onLongPress] - Called on long press
 * @property {Function} [onDoubleTap] - Called on double tap
 * @property {Function} [onPinchIn] - Called on pinch in with scale factor
 * @property {Function} [onPinchOut] - Called on pinch out with scale factor
 * @property {Function} [onPullToRefresh] - Called on pull-to-refresh gesture
 */
export interface GestureCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  onPinchIn?: (scale: number) => void;
  onPinchOut?: (scale: number) => void;
  onPullToRefresh?: () => void;
}

interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  isPressed: boolean;
  lastTapTime: number;
  tapCount: number;
  initialDistance: number;
  scale: number;
}

const DEFAULT_CONFIG: GestureConfig = {
  swipeThreshold: 50,
  longPressDelay: 500,
  doubleTapDelay: 300,
  pinchThreshold: 0.1,
};

/**
 * Custom hook for handling touch gestures with automatic memory cleanup
 *
 * Provides comprehensive touch gesture recognition including:
 * - Swipe detection (left, right, up, down)
 * - Long press
 * - Double tap
 * - Pinch zoom (in/out)
 * - Pull-to-refresh
 *
 * @param {GestureCallbacks} [callbacks={}] - Callback functions for gesture events
 * @param {Partial<GestureConfig>} [config={}] - Configuration for gesture thresholds
 *
 * @returns {object} Gesture handlers and state
 * @property {Function} getGestureHandlers - Returns touch event handlers for an element
 * @property {boolean} isPullRefreshing - Whether pull-to-refresh is active
 * @property {number} pullDistance - Current pull distance in pixels
 * @property {object} touchState - Current touch state data
 *
 * @example
 * ```tsx
 * const { getGestureHandlers, isPullRefreshing } = useGestures(
 *   {
 *     onSwipeLeft: () => console.log('Swiped left'),
 *     onLongPress: () => console.log('Long pressed'),
 *     onPullToRefresh: () => refreshData()
 *   },
 *   { swipeThreshold: 50, longPressDelay: 500 }
 * );
 *
 * return <div {...getGestureHandlers()}>Swipe me!</div>;
 * ```
 */
export function useGestures(
  callbacks: GestureCallbacks = {},
  config: Partial<GestureConfig> = {},
) {
  const isMountedRef = useMountRef();
  const { setTimer, clearTimer } = useTimerManager();

  const fullConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config],
  );

  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    isPressed: false,
    lastTapTime: 0,
    tapCount: 0,
    initialDistance: 0,
    scale: 1,
  });

  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const memoizedCallbacks = useMemo(() => callbacks, [callbacks]);

  const getDistance = (touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isMountedRef.current) return;

      const touch = e.touches[0];
      const now = Date.now();

      touchState.current = {
        ...touchState.current,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        startTime: now,
        isPressed: true,
      };

      if (e.touches.length === 2) {
        touchState.current.initialDistance = getDistance(
          e.touches[0],
          e.touches[1],
        );
        touchState.current.scale = 1;
      }

      setTimer(
        "longPress",
        () => {
          if (isMountedRef.current && touchState.current.isPressed) {
            memoizedCallbacks.onLongPress?.();
          }
        },
        fullConfig.longPressDelay,
      );

      if (now - touchState.current.lastTapTime < fullConfig.doubleTapDelay) {
        touchState.current.tapCount++;
      } else {
        touchState.current.tapCount = 1;
      }
      touchState.current.lastTapTime = now;
    },
    [
      isMountedRef,
      memoizedCallbacks,
      fullConfig.doubleTapDelay,
      fullConfig.longPressDelay,
      setTimer,
    ],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isMountedRef.current || !touchState.current.isPressed) return;

      const touch = e.touches[0];
      touchState.current.currentX = touch.clientX;
      touchState.current.currentY = touch.clientY;

      if (e.touches.length === 2) {
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / touchState.current.initialDistance;
        touchState.current.scale = scale;

        if (Math.abs(scale - 1) > fullConfig.pinchThreshold) {
          if (scale > 1) {
            memoizedCallbacks.onPinchOut?.(scale);
          } else {
            memoizedCallbacks.onPinchIn?.(scale);
          }
        }
        return;
      }

      const deltaY = touchState.current.currentY - touchState.current.startY;
      if (deltaY > 0 && touchState.current.startY < 100) {
        if (isMountedRef.current) {
          setPullDistance(Math.min(deltaY, 100));
          if (deltaY > 80 && !isPullRefreshing) {
            setIsPullRefreshing(true);
          }
        }
      }

      const deltaX = Math.abs(
        touchState.current.currentX - touchState.current.startX,
      );
      const deltaYAbs = Math.abs(deltaY);
      if (deltaX > 10 || deltaYAbs > 10) {
        clearTimer("longPress");
      }
    },
    [
      isMountedRef,
      memoizedCallbacks,
      fullConfig.pinchThreshold,
      isPullRefreshing,
      clearTimer,
    ],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isMountedRef.current || !touchState.current.isPressed) return;

    const deltaX = touchState.current.currentX - touchState.current.startX;
    const deltaY = touchState.current.currentY - touchState.current.startY;
    const duration = Date.now() - touchState.current.startTime;

    clearTimer("longPress");

    if (isPullRefreshing && pullDistance > 80) {
      memoizedCallbacks.onPullToRefresh?.();
      setTimer(
        "pullRefreshReset",
        () => {
          if (isMountedRef.current) {
            setIsPullRefreshing(false);
            setPullDistance(0);
          }
        },
        1000,
      );
    } else {
      if (isMountedRef.current) {
        setPullDistance(0);
        setIsPullRefreshing(false);
      }
    }

    if (duration < 300) {
      if (Math.abs(deltaX) > fullConfig.swipeThreshold) {
        if (deltaX > 0) {
          memoizedCallbacks.onSwipeRight?.();
        } else {
          memoizedCallbacks.onSwipeLeft?.();
        }
      } else if (Math.abs(deltaY) > fullConfig.swipeThreshold) {
        if (deltaY > 0) {
          memoizedCallbacks.onSwipeDown?.();
        } else {
          memoizedCallbacks.onSwipeUp?.();
        }
      }
    }

    if (
      touchState.current.tapCount === 2 &&
      duration < 200 &&
      Math.abs(deltaX) < 20 &&
      Math.abs(deltaY) < 20
    ) {
      memoizedCallbacks.onDoubleTap?.();
    }

    touchState.current.isPressed = false;
  }, [
    isMountedRef,
    memoizedCallbacks,
    fullConfig,
    isPullRefreshing,
    pullDistance,
    clearTimer,
    setTimer,
  ]);

  const getGestureHandlers = useCallback(
    () => ({
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
      style: {
        touchAction: "pan-y",
        userSelect: "none" as const,
        WebkitUserSelect: "none" as const,
        WebkitTouchCallout: "none" as const,
      },
    }),
    [handleTouchStart, handleTouchMove, handleTouchEnd],
  );

  return {
    getGestureHandlers,
    isPullRefreshing,
    pullDistance,
    touchState: touchState.current,
  };
}

/**
 * Specialized hook for terminal-specific gesture handling
 *
 * Provides terminal-optimized gestures for:
 * - Quick command menu (swipe left/right)
 * - Command history navigation (swipe up/down)
 * - Help command (double tap)
 * - Clear command (pull to refresh)
 *
 * @param {Function} onCommand - Callback to execute commands
 *
 * @returns {object} Terminal gesture handlers and state
 * @property {Function} getGestureHandlers - Touch event handlers
 * @property {boolean} isPullRefreshing - Pull-to-refresh state
 * @property {number} pullDistance - Pull distance
 * @property {boolean} showQuickCommands - Quick commands panel visibility
 * @property {Function} setShowQuickCommands - Toggle quick commands
 * @property {Function} addToHistory - Add command to gesture history
 * @property {string[]} commandHistory - Command history array
 *
 * @example
 * ```tsx
 * const {
 *   getGestureHandlers,
 *   showQuickCommands,
 *   addToHistory
 * } = useTerminalGestures((cmd) => executeCommand(cmd));
 *
 * // Add executed command to history
 * addToHistory("help");
 * ```
 */
export function useTerminalGestures(onCommand: (command: string) => void) {
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showQuickCommands, setShowQuickCommands] = useState(false);

  const gestureCallbacks: GestureCallbacks = {
    onSwipeLeft: () => {
      setShowQuickCommands(true);
    },

    onSwipeRight: () => {
      setShowQuickCommands(false);
    },

    onSwipeUp: () => {
      if (commandHistory.length > 0) {
        const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(newIndex);
        onCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    },

    onSwipeDown: () => {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        onCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        onCommand("");
      }
    },

    onDoubleTap: () => {
      onCommand("help");
    },

    onLongPress: () => {
      setShowQuickCommands(true);
    },

    onPullToRefresh: () => {
      onCommand("clear");
    },
  };

  const { getGestureHandlers, isPullRefreshing, pullDistance } = useGestures(
    gestureCallbacks,
    {
      swipeThreshold: 30,
      longPressDelay: 400,
    },
  );

  const addToHistory = useCallback(
    (command: string) => {
      if (command.trim() && !commandHistory.includes(command)) {
        setCommandHistory((prev) => [...prev.slice(-19), command]);
      }
      setHistoryIndex(-1);
    },
    [commandHistory],
  );

  return {
    getGestureHandlers,
    isPullRefreshing,
    pullDistance,
    showQuickCommands,
    setShowQuickCommands,
    addToHistory,
    commandHistory,
  };
}
