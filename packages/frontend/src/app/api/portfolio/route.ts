/**
 * Portfolio API Route Handler
 * Provides data for the portfolio application
 */

import { NextRequest, NextResponse } from "next/server";

// Sample data structure
interface PortfolioData {
  skills: SkillCategory[];
  projects: Project[];
  experience: Experience[];
  about: AboutInfo;
  lastUpdated: string;
}

interface SkillCategory {
  name: string;
  skills: Skill[];
  progress: number;
}

interface Skill {
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  yearsOfExperience: number;
  projects: string[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  demoUrl?: string;
  githubUrl?: string;
  imageUrl?: string;
  status: "completed" | "in-progress" | "planned";
  featured: boolean;
}

interface Experience {
  company: string;
  position: string;
  duration: string;
  description: string[];
  technologies: string[];
}

interface AboutInfo {
  name: string;
  title: string;
  bio: string;
  location: string;
  contact: {
    email: string;
    github: string;
    linkedin: string;
    twitter?: string;
  };
}

// Static fallback data
const PORTFOLIO_DATA: PortfolioData = {
  skills: [
    {
      name: "Frontend Development",
      progress: 90,
      skills: [
        {
          name: "React",
          level: "expert",
          yearsOfExperience: 4,
          projects: ["terminal-portfolio", "task-management"],
        },
        {
          name: "Next.js",
          level: "expert",
          yearsOfExperience: 3,
          projects: ["terminal-portfolio"],
        },
        {
          name: "TypeScript",
          level: "advanced",
          yearsOfExperience: 3,
          projects: ["terminal-portfolio", "task-management"],
        },
      ],
    },
    {
      name: "Backend Development",
      progress: 85,
      skills: [
        {
          name: "Node.js",
          level: "advanced",
          yearsOfExperience: 4,
          projects: ["ecommerce-platform", "task-management"],
        },
        {
          name: "PostgreSQL",
          level: "intermediate",
          yearsOfExperience: 2,
          projects: ["ecommerce-platform"],
        },
      ],
    },
  ],
  projects: [
    {
      id: "terminal-portfolio",
      name: "Terminal Portfolio",
      description:
        "Interactive terminal-themed developer portfolio with command-line interface",
      technologies: ["Next.js", "TypeScript", "Tailwind CSS", "React"],
      demoUrl: "https://your-domain.com",
      githubUrl: "https://github.com/yourusername/terminal-portfolio",
      status: "completed",
      featured: true,
    },
    {
      id: "ecommerce-platform",
      name: "E-Commerce Platform",
      description:
        "Full-stack online store with payment integration and real-time inventory",
      technologies: ["React", "Node.js", "PostgreSQL", "Stripe", "JWT"],
      githubUrl: "https://github.com/yourusername/ecommerce",
      status: "completed",
      featured: true,
    },
    {
      id: "task-management",
      name: "Task Management App",
      description:
        "Collaborative project management tool with real-time features",
      technologies: ["React", "Firebase", "Material-UI", "WebSocket"],
      demoUrl: "https://taskapp-demo.com",
      status: "completed",
      featured: false,
    },
  ],
  experience: [
    {
      company: "Tech Company",
      position: "Full Stack Developer",
      duration: "2021 - Present",
      description: [
        "Developed and maintained React applications",
        "Built scalable Node.js backends",
        "Implemented CI/CD pipelines",
      ],
      technologies: ["React", "Node.js", "AWS", "Docker"],
    },
    {
      company: "Startup Inc",
      position: "Frontend Developer",
      duration: "2020 - 2021",
      description: [
        "Created responsive web applications",
        "Collaborated with design team",
        "Optimized application performance",
      ],
      technologies: ["Vue.js", "JavaScript", "CSS3"],
    },
  ],
  about: {
    name: "Your Name",
    title: "Full Stack Developer",
    bio: "Passionate developer with expertise in modern web technologies",
    location: "Your Location",
    contact: {
      email: "your.email@example.com",
      github: "https://github.com/yourusername",
      linkedin: "https://linkedin.com/in/yourusername",
      twitter: "https://twitter.com/yourusername",
    },
  },
  lastUpdated: new Date().toISOString(),
};

/**
 * GET handler for portfolio data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section");
    const limit = searchParams.get("limit");

    // Basic CORS and security headers
    const responseHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "public, max-age=3600, s-maxage=7200", // Cache for 1 hour
      "Content-Type": "application/json",
    };

    let data: unknown;

    switch (section) {
      case "skills":
        data = PORTFOLIO_DATA.skills;
        break;
      case "projects":
        data = limit
          ? PORTFOLIO_DATA.projects.slice(0, parseInt(limit, 10))
          : PORTFOLIO_DATA.projects;
        break;
      case "experience":
        data = PORTFOLIO_DATA.experience;
        break;
      case "about":
        data = PORTFOLIO_DATA.about;
        break;
      default:
        data = PORTFOLIO_DATA;
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: responseHeaders,
      },
    );
  } catch (error) {
    console.error("Portfolio API error:", error);

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
