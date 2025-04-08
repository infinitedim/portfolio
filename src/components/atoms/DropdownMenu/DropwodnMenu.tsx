"use client";

import { memo } from "react";
import type { ComponentProps, JSX, ReactNode } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "@radix-ui/react-icons";

import { cn } from "@/utils";

/**
 * DropdownMenu component that wraps the Radix DropdownMenuPrimitive.Root.
 * @param {ComponentProps<typeof DropdownMenuPrimitive.Root>} root0 - Props passed to the DropdownMenu component.
 * @returns {JSX.Element} The rendered DropdownMenu component.
 */
function DropdownMenu({
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return (
    <DropdownMenuPrimitive.Root
      data-slot="dropdown-menu"
      {...props}
    />
  );
}

/**
 * DropdownMenuPortal component that wraps the Radix DropdownMenuPrimitive.Portal.
 * @param {ComponentProps<typeof DropdownMenuPrimitive.Portal>} root0 - Props passed to the DropdownMenuPortal component.
 * @returns {JSX.Element} The rendered DropdownMenuPortal component.
 */
function DropdownMenuPortal({
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal
      data-slot="dropdown-menu-portal"
      {...props}
    />
  );
}

/**
 * DropdownMenuTrigger component that wraps the Radix DropdownMenuPrimitive.Trigger.
 * @param {ComponentProps<typeof DropdownMenuPrimitive.Trigger>} root0 - Props passed to the DropdownMenuTrigger component.
 * @returns {JSX.Element} The rendered DropdownMenuTrigger component.
 */
function DropdownMenuTrigger({
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  );
}

/**
 * DropdownMenuContent component that wraps the Radix DropdownMenuPrimitive.Content.
 * @param {object} root0 - Props passed to the DropdownMenuContent component.
 * @param {string} [root0.className] - Additional class names for styling.
 * @param {number} [root0.sideOffset] - Offset for the dropdown menu content.
 * @returns {JSX.Element} The rendered DropdownMenuContent component.
 */
function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>): JSX.Element {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 max-h-(--radix-dropdown-menu-content-available-height) origin-(--radix-dropdown-menu-content-transform-origin) z-50 min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border p-1 shadow-md",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

/**
 * DropdownMenuGroup component that wraps the Radix DropdownMenuPrimitive.Group.
 * @param {ComponentProps<typeof DropdownMenuPrimitive.Group>} root0 - Props passed to the DropdownMenuGroup component.
 * @returns {JSX.Element} The rendered DropdownMenuGroup component.
 */
function DropdownMenuGroup({
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Group>): JSX.Element {
  return (
    <DropdownMenuPrimitive.Group
      data-slot="dropdown-menu-group"
      {...props}
    />
  );
}

/**
 * DropdownMenuItem component that wraps the Radix DropdownMenuPrimitive.Item.
 * @param {object} root0 - Props passed to the DropdownMenuItem component.
 * @param {string} [root0.className] - Additional class names for styling.
 * @param {boolean} [root0.inset] - Whether the item is inset.
 * @param {"default" | "destructive"} [root0.variant] - The variant of the item.
 * @returns {JSX.Element} The rendered DropdownMenuItem component.
 */
function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}): JSX.Element {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground outline-hidden relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm data-[disabled]:pointer-events-none data-[inset]:pl-8 data-[disabled]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

/**
 * DropdownMenuCheckboxItem component that wraps the Radix DropdownMenuPrimitive.CheckboxItem.
 * @param {object} root0 - Props passed to the DropdownMenuCheckboxItem component.
 * @param {string} [root0.className] - Additional class names for styling.
 * @param {ReactNode} [root0.children] - The content of the checkbox item.
 * @param {boolean} [root0.checked] - Whether the checkbox item is checked.
 * @returns {JSX.Element} The rendered DropdownMenuCheckboxItem component.
 */
function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>): JSX.Element {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground outline-hidden relative flex cursor-default select-none items-center gap-2 rounded-sm py-1.5 pl-8 pr-2 text-sm data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

/**
 * DropdownMenuRadioGroup component that wraps the Radix DropdownMenuPrimitive.RadioGroup.
 * @param {ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>} root0 - Props passed to the DropdownMenuRadioGroup component.
 * @returns {JSX.Element} The rendered DropdownMenuRadioGroup component.
 */
function DropdownMenuRadioGroup({
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>): JSX.Element {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

/**
 * DropdownMenuRadioItem component that wraps the Radix DropdownMenuPrimitive.RadioItem.
 * @param {object} root0 - Props passed to the DropdownMenuRadioItem component.
 * @param {string} [root0.className] - Additional class names for styling.
 * @param {ReactNode} [root0.children] - The content of the radio item.
 * @returns {JSX.Element} The rendered DropdownMenuRadioItem component.
 */
function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioItem>): JSX.Element {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground outline-hidden relative flex cursor-default select-none items-center gap-2 rounded-sm py-1.5 pl-8 pr-2 text-sm data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

/**
 * DropdownMenuLabel component that wraps the Radix DropdownMenuPrimitive.Label.
 * @param {object} root0 - Props passed to the DropdownMenuLabel component.
 * @param {string} [root0.className] - Additional class names for styling.
 * @param {boolean} [root0.inset] - Whether the label is inset.
 * @returns {JSX.Element} The rendered DropdownMenuLabel component.
 */
function DropdownMenuLabel({
  className,
  inset,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}): JSX.Element {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className,
      )}
      {...props}
    />
  );
}

/**
 * DropdownMenuSeparator component that wraps the Radix DropdownMenuPrimitive.Separator.
 * @param {object} root0 - Props passed to the DropdownMenuSeparator component.
 * @param {string} [root0.className] - Additional class names for styling.
 * @returns {JSX.Element} The rendered DropdownMenuSeparator component.
 */
function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>): JSX.Element {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

/**
 * DropdownMenuSubContent component that wraps the Radix DropdownMenuPrimitive.SubContent.
 * @param {object} root0 - Props passed to the DropdownMenuSubContent component.
 * @param {string} [root0.className] - Additional class names for styling.
 * @returns {JSX.Element} The rendered DropdownMenuSubContent component.
 */
function DropdownMenuShortcut({
  className,
  ...props
}: ComponentProps<"span">): JSX.Element {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...props}
    />
  );
}

/**
 * DropdownMenuSub component that wraps the Radix DropdownMenuPrimitive.Sub.
 * @param {ComponentProps<typeof DropdownMenuPrimitive.Sub>} root0 - Props passed to the DropdownMenuSub component.
 * @returns {JSX.Element} The rendered DropdownMenuSub component.
 */
function DropdownMenuSub({
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Sub>): JSX.Element {
  return (
    <DropdownMenuPrimitive.Sub
      data-slot="dropdown-menu-sub"
      {...props}
    />
  );
}

/**
 * DropdownMenuSubTrigger component that wraps the Radix DropdownMenuPrimitive.SubTrigger.
 * @param {object} root0 - Props passed to the DropdownMenuSubTrigger component.
 * @param {string} [root0.className] - Additional class names for styling.
 * @param {boolean} [root0.inset] - Whether the sub-trigger is inset.
 * @param {ReactNode} [root0.children] - The content of the sub-trigger.
 * @returns {JSX.Element} The rendered DropdownMenuSubTrigger component.
 */
function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}): JSX.Element {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground outline-hidden flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm data-[inset]:pl-8",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

/**
 * DropdownMenuSubContent component that wraps the Radix DropdownMenuPrimitive.SubContent.
 * @param {object} root0 - Props passed to the DropdownMenuSubContent component.
 * @param {string} [root0.className] - Additional class names for styling.
 * @returns {JSX.Element} The rendered DropdownMenuSubContent component.
 */
function DropdownMenuSubContent({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.SubContent>): JSX.Element {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin) z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-lg",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};

export default memo(DropdownMenu);
