/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

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
          this.toastTimeouts.forEach((timeout) => clearTimeout(timeout));
          this.toastTimeouts.clear();
          return {
            ...state,
            toasts: [],
          };
        }
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

let toastManager: ToastManager;

/**
 * Returns the singleton instance of the toast manager
 *
 * Ensures only one toast manager exists across the application,
 * preventing duplicate toast state management.
 *
 * @returns {ToastManager} The singleton toast manager instance
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
 * Dispatches an action to update the toast state
 *
 * Central hub for all toast state changes. Calls the reducer to compute
 * new state and notifies all active listeners (useToast instances).
 *
 * @param {Action} action - The action to dispatch (ADD, UPDATE, DISMISS, or REMOVE)
 */
function dispatch(action: Action) {
  getToastManager().dispatch(action);
}

type Toast = Omit<ToasterToast, "id">;

/**
 * Imperatively create and display a toast notification
 *
 * Can be called from anywhere in the application to show toasts.
 * Supports various variants (default, destructive, success, etc.)
 *
 * @param {Toast} props - Toast configuration
 * @param {string} [props.title] - Toast title
 * @param {string} [props.description] - Toast description
 * @param {"default" | "destructive"} [props.variant] - Toast variant
 * @param {number} [props.duration] - Display duration in ms
 * @param {ToastActionElement} [props.action] - Action button element
 *
 * @returns {object} Toast control methods
 * @property {string} id - Unique toast ID
 * @property {Function} dismiss - Dismiss this toast
 * @property {Function} update - Update this toast's properties
 *
 * @example
 * ```tsx
 * // Simple toast
 * toast({ title: "Success", description: "Operation completed" });
 *
 * // Toast with action
 * const { id, dismiss } = toast({
 *   title: "Confirm",
 *   description: "Are you sure?",
 *   action: <Button onClick={() => confirm()}>Yes</Button>
 * });
 *
 * // Manually dismiss
 * dismiss();
 * ```
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
 * React hook for toast state management and notifications
 *
 * Provides access to toast state and methods for managing toasts.
 * Automatically subscribes component to toast state changes with cleanup.
 * Handles visibility changes and beforeunload events for cleanup.
 *
 * @returns {object} Toast state and methods
 * @property {ToasterToast[]} toasts - Array of active toast notifications
 * @property {Function} toast - Function to create a new toast
 * @property {Function} dismiss - Function to dismiss toast(s) by ID
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { toasts, toast, dismiss } = useToast();
 *
 *   return (
 *     <div>
 *       <button onClick={() => toast({ title: "Hello!" })}>
 *         Show Toast
 *       </button>
 *
 *       {toasts.map(t => (
 *         <Toast key={t.id} {...t} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
function useToast() {
  const manager = getToastManager();
  const isMountedRef = useMountRef();
  const [state, setState] = React.useState<State>(() => manager.getState());

  React.useEffect(() => {
    if (!isMountedRef.current) return;

    const isMounted = isMountedRef.current;

    const unsubscribe = manager.subscribe((newState) => {
      if (isMountedRef.current) {
        setState(newState);
      }
    });

    setState(manager.getState());

    return () => {
      unsubscribe();
      if (!isMounted) {
        setTimeout(() => {
          if (manager.getState().toasts.length === 0) {
            manager.cleanup();
          }
        }, 100);
      }
    };
  }, [manager, isMountedRef]);

  React.useEffect(() => {
    const handleBeforeUnload = () => {
      manager.cleanup();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
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
