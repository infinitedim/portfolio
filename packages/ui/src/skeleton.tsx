import { cn } from "./utils";
import * as React from "react";

/**
 * A placeholder component to be displayed while content is loading.
 * It renders a pulsing, dim background to signify that something is loading.
 * @param {React.HTMLAttributes<HTMLDivElement>} props - The properties for the Skeleton component.
 * @param {string} [props.className] - Additional class names for the skeleton div.
 * @example
 * ```tsx
 * <div className="flex items-center space-x-4">
 *   <Skeleton className="h-12 w-12 rounded-full" />
 *   <div className="space-y-2">
 *     <Skeleton className="h-4 w-[250px]" />
 *     <Skeleton className="h-4 w-[200px]" />
 *   </div>
 * </div>
 * ```
 * @returns {React.JSX.Element} return skeleton
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
