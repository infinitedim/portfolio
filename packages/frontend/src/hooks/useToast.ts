/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

// Inspired by react-hot-toast library
import * as React from "react";
import { generateId, useTimerManager, useMountRef } from "./utils/hookUtils";

import type { ToastActionElement, ToastProps } from "@/ui/toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

// Toast manager class to handle state and cleanup properly
class ToastManager {
  private listeners = new Set<(state: State) => void>();
  private state: State = { toasts: [] };
  private toastTimeouts = new Map<string, NodeJS.Timeout>();
  private idCounter = 0;

  genId(): string {
    this.idCounter = (this.idCounter + 1) % Number.MAX_SAFE_INTEGER;
    return this.idCounter.toString();
  }

  addToRemoveQueue(toastId: string) {
    if (this.toastTimeouts.has(toastId)) {
      return;
    }

    const timeout = setTimeout(() => {
      this.toastTimeouts.delete(toastId);
      this.dispatch({
        type: "REMOVE_TOAST",
        toastId: toastId,
      });
    }, TOAST_REMOVE_DELAY);

    this.toastTimeouts.set(toastId, timeout);
  }

  // Enhanced cleanup method to prevent memory leaks
  removeFromQueue(toastId: string) {
    const timeout = this.toastTimeouts.get(toastId);
    if (timeout) {
      clearTimeout(timeout);
      this.toastTimeouts.delete(toastId);
    }
  }

  reducer(state: State, action: Action): State {
    switch (action.type) {
      case "ADD_TOAST":
        return {
          ...state,
          toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
        };

      case "UPDATE_TOAST":
        return {
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === action.toast.id ? { ...t, ...action.toast } : t,
          ),
        };

      case "DISMISS_TOAST": {
        const { toastId } = action;

        // Clear timeout immediately when dismissing
        if (toastId) {
          this.removeFromQueue(toastId);
          this.addToRemoveQueue(toastId);
        } else {
          state.toasts.forEach((toast) => {
            this.removeFromQueue(toast.id);
            this.addToRemoveQueue(toast.id);
          });
        }

        return {
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === toastId || toastId === undefined
              ? {
                  ...t,
                  open: false,
                }
              : t,
          ),
        };
      }
      case "REMOVE_TOAST":
        if (action.toastId === undefined) {
          // Clear all timeouts when removing all toasts
          this.toastTimeouts.forEach((timeout) => clearTimeout(timeout));
          this.toastTimeouts.clear();
          return {
            ...state,
            toasts: [],
          };
        }
        // Clear specific timeout when removing specific toast
        this.removeFromQueue(action.toastId);
        return {
          ...state,
          toasts: state.toasts.filter((t) => t.id !== action.toastId),
        };
    }
  }

  dispatch(action: Action) {
    this.state = this.reducer(this.state, action);
    this.listeners.forEach((listener) => {
      listener(this.state);
    });
  }

  subscribe(listener: (state: State) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState() {
    return this.state;
  }

  cleanup() {
    this.toastTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.toastTimeouts.clear();
    this.listeners.clear();
  }
}

// Create a singleton instance
let toastManager: ToastManager;

/**
 * Returns the singleton instance of the toast manager.
 * @returns {ToastManager} The singleton instance of the toast manager.
 */
function getToastManager(): ToastManager {
  if (!toastManager) {
    toastManager = new ToastManager();
  }
  return toastManager;
}

export const reducer = (state: State, action: Action): State => {
  return getToastManager().reducer(state, action);
};

/**
 * Dispatches an action to update the toast state.
 * This function is the central hub for all state changes. It calls the reducer
 * to compute the new state and then notifies all active listeners (instances of useToast)
 * of the change.
 * @param {Action} action The action to dispatch.
 */
function dispatch(action: Action) {
  getToastManager().dispatch(action);
}

type Toast = Omit<ToasterToast, "id">;

/**
 * Imperatively creates and displays a toast notification.
 * This function can be called from anywhere in the application.
 * @param {Toast} props The properties for the toast, such as title, description, and variant.
 * @returns {{ id: string, dismiss: () => void, update: (props: ToasterToast) => void }} An object with methods to control the toast.
 */
function toast(props: Toast) {
  const manager = getToastManager();
  const id = manager.genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

/**
 * A React hook that provides access to the toast state and methods for managing toasts.
 * It subscribes the component to toast state changes with proper cleanup.
 * @returns {{ toasts: ToasterToast[], toast: (props: Toast) => { id: string, dismiss: () => void, update: (props: ToasterToast) => void; }, dismiss: (toastId?: string) => void }} An object containing the list of toasts and functions to create or dismiss them.
 */
function useToast() {
  const manager = getToastManager();
  const isMountedRef = useMountRef();
  const [state, setState] = React.useState<State>(() => manager.getState());

  React.useEffect(() => {
    if (!isMountedRef.current) return;

    // Capture the current state for cleanup
    const isMounted = isMountedRef.current;

    // Subscribe to toast manager updates
    const unsubscribe = manager.subscribe((newState) => {
      if (isMountedRef.current) {
        setState(newState);
      }
    });

    // Set initial state
    setState(manager.getState());

    // Enhanced cleanup for component unmount
    return () => {
      unsubscribe();
      // If this component was mounted, cleanup manager if no toasts remain
      if (!isMounted) {
        // Small delay to allow other components to re-subscribe if needed
        setTimeout(() => {
          if (manager.getState().toasts.length === 0) {
            manager.cleanup();
          }
        }, 100);
      }
    };
  }, [manager, isMountedRef]);

  // Cleanup on page/app unload to prevent memory leaks
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      manager.cleanup();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Clear pending timeouts when page becomes hidden
        const currentToasts = manager.getState().toasts;
        if (currentToasts.length === 0) {
          manager.cleanup();
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleBeforeUnload);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      };
    }

    return undefined;
  }, [manager]);

  // Memoized return object to prevent unnecessary re-renders
  return React.useMemo(
    () => ({
      ...state,
      toast,
      dismiss: (toastId?: string) =>
        dispatch({ type: "DISMISS_TOAST", toastId }),
    }),
    [state],
  );
}

export { useToast, toast };
