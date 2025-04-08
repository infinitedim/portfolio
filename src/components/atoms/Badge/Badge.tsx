import { memo } from "react";
import type { JSX } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils";

const badgeVariants = cva(
  "focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/80 border-transparent",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/80 border-transparent",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge component for displaying a styled badge.
 * @param {BadgeProps} root0 - Props for the Badge component.
 * @param {string} root0.className - Additional class names for the badge.
 * @param {keyof typeof badgeVariants.variants.variant} root0.variant - Variant of the badge for styling.
 * @returns {JSX.Element} A memoized Badge component.
 */
function Badge({ className, variant, ...props }: BadgeProps): JSX.Element {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
export { badgeVariants };

export default memo(Badge);
