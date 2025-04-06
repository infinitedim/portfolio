"use client";

import * as SheetPrimitive from "@radix-ui/react-dialog";

import { cn } from "@/utils";
import { XIcon } from "@/components/atoms/Icons";
import { memo } from "react";
import type { ComponentProps, JSX, ReactNode } from "react";

/**
 * A component that renders a sheet using Radix UI's Dialog primitive.
 * @param {ComponentProps<typeof SheetPrimitive.Root>} props - The props for the Sheet component.
 * @returns {Element} The rendered Sheet component.
 */
function Sheet({
  ...props
}: ComponentProps<typeof SheetPrimitive.Root>): JSX.Element {
  return (
    <SheetPrimitive.Root
      data-slot="sheet"
      {...props}
    />
  );
}

/**
 * A component that renders a trigger for the sheet.
 * @param {ComponentProps<typeof SheetPrimitive.Trigger>} props - The props for the SheetTrigger component.
 * @returns {JSX.Element} The rendered SheetTrigger component.
 */
function SheetTrigger({
  ...props
}: ComponentProps<typeof SheetPrimitive.Trigger>): JSX.Element {
  return (
    <SheetPrimitive.Trigger
      data-slot="sheet-trigger"
      {...props}
    />
  );
}

/**
 * A component that renders a close button for the sheet.
 * @param {ComponentProps<typeof SheetPrimitive.Close>} props - The props for the SheetClose component.
 * @returns {JSX.Element} The rendered SheetClose component.
 */
function SheetClose({
  ...props
}: ComponentProps<typeof SheetPrimitive.Close>): JSX.Element {
  return (
    <SheetPrimitive.Close
      data-slot="sheet-close"
      {...props}
    />
  );
}

/**
 * A component that renders a portal for the sheet.
 * @param {ComponentProps<typeof SheetPrimitive.Portal>} root0 - The props for the SheetPortal component.
 * @returns {JSX.Element} The rendered SheetPortal component.
 */
function SheetPortal({
  ...props
}: ComponentProps<typeof SheetPrimitive.Portal>): JSX.Element {
  return (
    <SheetPrimitive.Portal
      data-slot="sheet-portal"
      {...props}
    />
  );
}

/**
 * A component that renders the footer section of the sheet.
 * @param {object} root0 - The props for the SheetFooter component.
 * @param {string} root0.className - Additional class names for styling.
 * @returns {JSX.Element} The rendered SheetFooter component.
 */
function SheetOverlay({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...props}
    />
  );
}

/**
 * A component that renders the content of the sheet.
 * @param {object} root0 - The props for the SheetContent component.
 * @param {string} [root0.className] - Additional class names for styling.
 * @param {ReactNode} [root0.children] - The children elements to render inside the sheet content.
 * @param {"top" | "right" | "bottom" | "left"} [root0.side] - The side of the screen where the sheet appears.
 * @returns {JSX.Element} The rendered SheetContent component.
 */
function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left";
}): JSX.Element {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" &&
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "left" &&
          "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "top" &&
          "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" &&
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

/**
 * A component that renders the header section of the sheet.
 * @param {object} root0 - The props for the SheetHeader component.
 * @param {string} root0.className - Additional class names for styling.
 * @returns {JSX.Element} The rendered SheetHeader component.
 */
function SheetHeader({
  className,
  ...props
}: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  );
}

/**
 * A component that renders the footer section of the sheet.
 * @param {object} root0 - The props for the SheetFooter component.
 * @param {string} [root0.className] - Additional class names for styling.
 * @returns {JSX.Element} The rendered SheetFooter component.
 */
function SheetFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

/**
 * A component that renders the title of the sheet.
 * @param {object} root0 - The props for the SheetTitle component.
 * @param {string} [root0.className] - Additional class names for styling.
 * @returns {JSX.Element} The rendered SheetTitle component.
 */
function SheetTitle({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  );
}

/**
 * A component that renders the description of the sheet.
 * @param {object} root0 - The props for the SheetDescription component.
 * @param {string} [root0.className] - Additional class names for styling.
 * @returns {JSX.Element} The rendered SheetDescription component.
 */
function SheetDescription({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};

export default memo(Sheet);
