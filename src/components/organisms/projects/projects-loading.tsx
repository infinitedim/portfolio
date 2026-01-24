import { JSX } from "react";

/**
 * Optimized loading skeleton for projects page
 * @returns {JSX.Element} The ProjectsLoading component
 */
export function ProjectsLoading(): JSX.Element {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: 6 }).map((_, index) => (
        <ProjectCardSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * Project card skeleton
 * @returns {JSX.Element} The ProjectCardSkeleton component
 */
function ProjectCardSkeleton(): JSX.Element {
  return (
    <div className="bg-terminal-bg border border-terminal-border rounded-lg overflow-hidden animate-pulse">
      {}
      <div className="h-48 bg-terminal-muted/10">
        <div className="w-full h-full bg-gradient-to-r from-terminal-muted/5 via-terminal-muted/10 to-terminal-muted/5 bg-[length:200%_100%] animate-shimmer" />
      </div>

      {}
      <div className="p-6 space-y-4">
        {}
        <div className="space-y-2">
          <div className="h-6 bg-terminal-muted/20 rounded w-3/4" />
          <div className="h-4 bg-terminal-muted/10 rounded w-full" />
          <div className="h-4 bg-terminal-muted/10 rounded w-2/3" />
        </div>

        {}
        <div className="space-y-2">
          <div className="h-3 bg-terminal-muted/15 rounded w-24" />
          <div className="flex gap-2">
            <div className="h-6 bg-terminal-accent/20 rounded w-16" />
            <div className="h-6 bg-terminal-accent/20 rounded w-20" />
            <div className="h-6 bg-terminal-accent/20 rounded w-14" />
          </div>
        </div>

        {}
        <div className="flex gap-3">
          <div className="flex-1 h-10 bg-terminal-accent/30 rounded" />
          <div className="flex-1 h-10 bg-terminal-border rounded" />
        </div>
      </div>
    </div>
  );
}
