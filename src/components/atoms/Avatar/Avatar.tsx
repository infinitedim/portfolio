"use client";

import { memo } from "react";
import type { ComponentProps, JSX } from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/utils";

/**
 * Avatar component for displaying user profile pictures.
 * @param {ComponentProps<typeof AvatarPrimitive.Root>} root0 - Props for the Avatar component.
 * @param {string} root0.className - Additional class names for styling.
 * @returns {JSX.Element} A styled Avatar component.
 */
function Avatar({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Root>): JSX.Element {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className,
      )}
      {...props}
    />
  );
}

/**
 * AvatarImage component for displaying the image inside an avatar.
 * @param {object} root0 - Props for the AvatarImage component.
 * @param {string} root0.className - Additional class names for styling.
 * @returns {JSX.Element} A styled AvatarImage component.
 */
function AvatarImage({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Image>): JSX.Element {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  );
}

/**
 * AvatarFallback component for displaying a fallback element when the image is not available.
 * @param {object} root0 - Props for the AvatarFallback component.
 * @param {string} root0.className - Additional class names for styling.
 * @returns {JSX.Element} A styled AvatarFallback component.
 */
function AvatarFallback({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Fallback>): JSX.Element {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className,
      )}
      {...props}
    />
  );
}

export { AvatarImage, AvatarFallback };

export default memo(Avatar);
