import { memo } from "react";
import type { ComponentProps, JSX } from "react";

import { cn } from "@/utils";

/**
 * Renders a Card component.
 * @param {object} root0 - The props for the Card component.
 * @param {string} [root0.className] - Additional class names for styling.
 * @returns {JSX.Element} The rendered Card component.
 */
function Card({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders the CardHeader component.
 * @param {object} root0 - The props for the CardHeader component.
 * @param {string} [root0.className] - Additional class names for styling.
 * @returns {JSX.Element} The rendered CardHeader component.
 */
function CardHeader({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders the CardTitle component.
 * @param {object} root0 - The props for the CardTitle component.
 * @param {string} [root0.className] - Additional class names for styling.
 * @returns {JSX.Element} The rendered CardTitle component.
 */
function CardTitle({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="card-title"
      className={cn("font-semibold leading-none", className)}
      {...props}
    />
  );
}

/**
 * Renders the CardDescription component.
 * @param {object} root0 - The props for the CardDescription component.
 * @param {string} [root0.className] - Additional class names for styling.
 * @returns {JSX.Element} The rendered CardDescription component.
 */
function CardDescription({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

/**
 * Renders the CardAction component.
 * @param {object} root0 - The props for the CardAction component.
 * @param {string} [root0.className] - Additional class names for styling.
 * @returns {JSX.Element} The rendered CardAction component.
 */
function CardAction({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders the CardContent component.
 * @param {object} root0 - The props for the CardContent component.
 * @param {string} [root0.className] - Additional class names for styling.
 * @returns {JSX.Element} The rendered CardContent component.
 */
function CardContent({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  );
}

/**
 * Renders the CardFooter component.
 * @param {object} root0 - The props for the CardFooter component.
 * @param {string} [root0.className] - Additional class names for styling.
 * @returns {JSX.Element} The rendered CardFooter component.
 */
function CardFooter({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="card-footer"
      className={cn("[.border-t]:pt-6 flex items-center px-6", className)}
      {...props}
    />
  );
}

export {
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};

export default memo(Card);
