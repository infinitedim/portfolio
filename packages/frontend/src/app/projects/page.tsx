import { Metadata } from "next";
import { Suspense, JSX } from "react";
import {
  getProjectsData,
  getFeaturedProjects,
  type Project,
} from "@portfolio/backend/src/ssr/dataFetching";
import { ProjectCard } from "@portfolio/frontend/src/components/projects/ProjectCard";
import { ProjectsLoading } from "@portfolio/frontend/src/components/projects/ProjectsLoading";

// Route segment config for optimization
export const revalidate = 3600; // Revalidate every hour
export const dynamic = "force-static"; // Generate statically at build time
export const fetchCache = "default-cache";

// Generate metadata dynamically
/**
 * Generate metadata for the projects page
 * @returns {Promise<Metadata>} The metadata
 */
export async function generateMetadata(): Promise<Metadata> {
  const projects = await getProjectsData();
  const featuredProjects = await getFeaturedProjects();

  return {
    title: "Projects | Terminal Portfolio",
    description: `Explore ${projects.length} web development projects including ${featuredProjects.map((p) => p.name).join(", ")}. Full-stack applications built with React, Next.js, and modern technologies.`,
    keywords: [
      "web development projects",
      "react projects",
      "nextjs portfolio",
      "full-stack applications",
      "javascript projects",
      "typescript projects",
      ...projects.flatMap((p) => p.technologies),
    ],
    openGraph: {
      title: "Projects | Terminal Portfolio",
      description: `${projects.length} innovative web development projects showcasing modern technologies`,
      type: "website",
      images: [
        {
          url: "/og-projects.png",
          width: 1200,
          height: 630,
          alt: "Projects Portfolio Overview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Projects | Terminal Portfolio",
      description: `${projects.length} innovative web development projects`,
      images: ["/og-projects.png"],
    },
    alternates: {
      canonical: "/projects",
    },
  };
}

// Server component for projects page
/**
 * Projects page
 * @returns {Promise<JSX.Element>} The projects page
 */
export default async function ProjectsPage(): Promise<JSX.Element> {
  // Pre-fetch data at build time / request time
  const [allProjects, featuredProjects] = await Promise.all([
    getProjectsData(),
    getFeaturedProjects(),
  ]);

  return (
    <main className="min-h-screen bg-terminal-bg text-terminal-text">
      {/* Hero Section with Server-Rendered Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold font-mono mb-6">
              <span className="text-terminal-accent">~/</span>projects
            </h1>
            <p className="text-xl md:text-2xl text-terminal-muted max-w-3xl mx-auto">
              A collection of {allProjects.length} web development projects
              showcasing modern technologies and creative solutions.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {Array.from(new Set(allProjects.flatMap((p) => p.technologies)))
                .slice(0, 8)
                .map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 text-sm bg-terminal-accent/10 text-terminal-accent rounded-full border border-terminal-accent/20"
                  >
                    {tech}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      {featuredProjects.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold font-mono mb-8 text-terminal-accent">
              📌 Featured Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  featured={true}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Projects Section with Streaming */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold font-mono mb-8 text-terminal-text">
            🚀 All Projects
          </h2>

          <Suspense fallback={<ProjectsLoading />}>
            <ProjectsList projects={allProjects} />
          </Suspense>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-terminal-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-terminal-accent font-mono">
                {allProjects.length}
              </div>
              <div className="text-terminal-muted">Total Projects</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-terminal-accent font-mono">
                {featuredProjects.length}
              </div>
              <div className="text-terminal-muted">Featured</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-terminal-accent font-mono">
                {
                  Array.from(
                    new Set(allProjects.flatMap((p) => p.technologies)),
                  ).length
                }
              </div>
              <div className="text-terminal-muted">Technologies</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-terminal-accent font-mono">
                {allProjects.filter((p) => p.status === "completed").length}
              </div>
              <div className="text-terminal-muted">Completed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Web Development Projects",
            description: "Portfolio of web development projects",
            numberOfItems: allProjects.length,
            itemListElement: allProjects.map((project, index) => ({
              "@type": "CreativeWork",
              position: index + 1,
              name: project.name,
              description: project.description,
              url: project.demoUrl || project.githubUrl,
              author: {
                "@type": "Person",
                name: "Developer Portfolio",
              },
              programmingLanguage: project.technologies,
              dateCreated: "2024-01-01", // You'd want actual dates
              creativeWorkStatus: project.status,
            })),
          }),
        }}
      />
    </main>
  );
}

// Server component for projects list
/**
 * Projects list
 * @param {Project[]} projects - The projects to display
 * @returns {Promise<JSX.Element>} The projects list
 */
async function ProjectsList({
  projects,
}: {
  projects: Project[];
}): Promise<JSX.Element> {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          featured={false}
        />
      ))}
    </div>
  );
}
