"use client";

import { memo, JSX, Suspense } from "react";
import { Project } from "@portfolio/backend/src/ssr/dataFetching";
import { OptimizedImage } from "@portfolio/frontend/src/components/ui/OptimizedImage";
import { ImageErrorBoundary } from "@portfolio/frontend/src/components/error/ImageErrorBoundary";

interface ProjectCardProps {
  project: Project;
  featured?: boolean;
}

const ProjectImageLoader = () => (
  <div className="h-48 bg-terminal-muted/10 animate-pulse" />
);

/**
 * Optimized ProjectCard component with lazy loading and performance optimizations
 */
export const ProjectCard = memo(function ProjectCard({
  project,
  featured = false,
}: ProjectCardProps): JSX.Element {
  const statusConfig = {
    completed: { color: "text-green-400", icon: "✅", label: "Completed" },
    "in-progress": {
      color: "text-yellow-400",
      icon: "🔄",
      label: "In Progress",
    },
    planned: { color: "text-blue-400", icon: "📋", label: "Planned" },
  };

  const status = statusConfig[project.status];

  return (
    <article
      className={`
        group relative bg-terminal-bg border border-terminal-border rounded-lg overflow-hidden
        transition-all duration-300 hover:border-terminal-accent hover:shadow-lg
        ${featured ? "ring-2 ring-terminal-accent ring-opacity-20" : ""}
      `}
      itemScope
      itemType="https://schema.org/CreativeWork"
    >
      {/* Featured Badge */}
      {featured && (
        <div className="absolute top-4 right-4 z-10">
          <span className="bg-terminal-accent text-terminal-bg px-2 py-1 text-xs font-bold rounded">
            ⭐ FEATURED
          </span>
        </div>
      )}

      {/* Project Image */}
      <div className="relative h-48 bg-terminal-muted/10 overflow-hidden">
        <Suspense fallback={<ProjectImageLoader />}>
          <ImageErrorBoundary>
            {project.imageUrl ? (
              <OptimizedImage
                src={project.imageUrl}
                alt={`Screenshot of ${project.name}`}
                fill
                priority={featured}
                className="w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-terminal-muted">
                <div className="text-center">
                  <div className="text-4xl mb-2">🚀</div>
                  <div className="text-sm">Project Preview</div>
                </div>
              </div>
            )}
          </ImageErrorBoundary>
        </Suspense>

        {/* Status Overlay */}
        <div className="absolute bottom-2 right-2 bg-terminal-bg/80 backdrop-blur-sm px-2 py-1 rounded">
          <span
            className={`${status.color} text-sm font-mono flex items-center gap-1`}
          >
            <span>{status.icon}</span>
            <span>{status.label}</span>
          </span>
        </div>
      </div>

      {/* Project Content */}
      <div className="p-6">
        {/* Title and Description */}
        <div className="mb-4">
          <h3
            className="text-xl font-bold text-terminal-text group-hover:text-terminal-accent transition-colors mb-2"
            itemProp="name"
          >
            {project.name}
          </h3>
          <p
            className="text-terminal-muted text-sm leading-relaxed"
            itemProp="description"
          >
            {project.description}
          </p>
        </div>

        {/* Technologies */}
        <div className="mb-4">
          <div className="text-xs text-terminal-muted mb-2 font-mono">
            TECH STACK:
          </div>
          <div className="flex flex-wrap gap-2">
            {project.technologies.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="px-2 py-1 text-xs bg-terminal-accent/10 text-terminal-accent rounded border border-terminal-accent/20 font-mono"
                itemProp="programmingLanguage"
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 4 && (
              <span className="px-2 py-1 text-xs text-terminal-muted border border-terminal-border rounded">
                +{project.technologies.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-terminal-accent text-terminal-bg px-4 py-2 rounded text-sm font-medium text-center hover:bg-terminal-accent/90 transition-colors"
              aria-label={`View live demo of ${project.name}`}
            >
              🌐 Live Demo
            </a>
          )}
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 border border-terminal-border text-terminal-text px-4 py-2 rounded text-sm font-medium text-center hover:border-terminal-accent hover:text-terminal-accent transition-colors"
              aria-label={`View source code of ${project.name}`}
            >
              💻 Code
            </a>
          )}
        </div>

        {/* Metadata for SEO */}
        <meta
          itemProp="url"
          content={project.demoUrl || project.githubUrl}
        />
        <meta
          itemProp="creativeWorkStatus"
          content={project.status}
        />
        <div
          itemProp="author"
          itemScope
          itemType="https://schema.org/Person"
          className="hidden"
        >
          <meta
            itemProp="name"
            content="Developer Portfolio"
          />
        </div>
      </div>
    </article>
  );
});
