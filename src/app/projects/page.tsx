import { Metadata } from "next";
import { Suspense, JSX } from "react";
import {
  getProjectsData,
  getFeaturedProjects,
  type Project,
} from "@/lib/data/data-fetching";
import { ProjectCard } from "@/components/molecules/projects/project-card";
import { ProjectsLoading } from "@/components/organisms/projects/projects-loading";

export const revalidate = 3600;
export const dynamic = "force-static";
export const fetchCache = "default-cache";

/**
 * Generates dynamic metadata for the projects page
 * @returns Metadata object with SEO optimization
 * @remarks
 * Dynamically generates metadata including:
 * - Project count and featured project names in description
 * - Keywords extracted from all project technologies
 * - Open Graph and Twitter Card data
 * - Canonical URL for SEO
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

/**
 * Projects page component displaying portfolio projects
 * @returns Projects page with featured and all projects sections
 * @remarks
 * Server-side rendered page featuring:
 * - Static generation with revalidation every hour
 * - Featured projects showcase section
 * - Complete projects grid with filtering capabilities
 * - Project statistics (total, featured, technologies, completed)
 * - Structured data for SEO with ItemList schema
 * - Technology tags from all projects
 * - Suspense boundaries for progressive loading
 */
export default async function ProjectsPage(): Promise<JSX.Element> {
  const [allProjects, featuredProjects] = await Promise.all([
    getProjectsData(),
    getFeaturedProjects(),
  ]);

  return (
    <main className="min-h-screen bg-terminal-bg text-terminal-text">
      { }
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

      { }
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

      { }
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

      { }
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

      { }
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
              dateCreated: "2024-01-01",
              creativeWorkStatus: project.status,
            })),
          }),
        }}
      />
    </main>
  );
}

/**
 * Projects list component rendering project cards in a grid
 * @param props - Component props
 * @param props.projects - Array of projects to display
 * @returns Grid layout of project cards
 * @remarks
 * Renders projects in a responsive grid:
 * - 1 column on mobile
 * - 2 columns on tablet
 * - 3 columns on desktop
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
