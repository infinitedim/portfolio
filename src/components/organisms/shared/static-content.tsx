import { JSX } from "react";

/**
 * Static content that can be fully server-rendered for better SSR performance
 * This includes ASCII banner, SEO content, and other static elements
 * @returns {JSX.Element} The StaticContent component
 */
export function StaticContent(): JSX.Element {
  return (
    <div className="static-content">
      {}
      <div className="sr-only">
        <h1>Terminal Portfolio - Interactive Developer Portfolio</h1>
        <p>
          Welcome to an interactive terminal-themed developer portfolio
          showcasing full-stack development skills with React, Next.js,
          TypeScript, and modern web technologies.
        </p>

        <h2>Available Commands</h2>
        <ul>
          <li>help - Show available commands and usage information</li>
          <li>about - Learn more about the developer</li>
          <li>skills - View technical skills and roadmap progress</li>
          <li>projects - Browse portfolio projects and work examples</li>
          <li>contact - Get contact information and social links</li>
          <li>theme - Customize the terminal appearance</li>
          <li>clear - Clear the terminal screen</li>
        </ul>

        <h2>Skills & Technologies</h2>
        <ul>
          <li>Frontend: React, Next.js, TypeScript, Tailwind CSS</li>
          <li>Backend: Node.js, Express, API Development</li>
          <li>Database: PostgreSQL, MongoDB, Redis</li>
          <li>DevOps: Docker, CI/CD, Performance Optimization</li>
          <li>Tools: Git, VS Code, Linux Terminal</li>
        </ul>

        <h2>Features</h2>
        <ul>
          <li>Interactive command-line interface</li>
          <li>Multiple color themes (Matrix, Cyberpunk, Dracula, Nord)</li>
          <li>Responsive design for mobile and desktop</li>
          <li>Accessibility features and keyboard navigation</li>
          <li>Service worker for offline functionality</li>
          <li>Progressive Web App capabilities</li>
        </ul>
      </div>

      {}
      <div
        className="hidden ascii-preload"
        aria-hidden="true"
      >
        <pre className="font-mono text-xs leading-tight">
          {`╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║  ████████ ████████ ██████  ██   ██ ██ ██   ██  █████  ██                    ║
║     ██    ██       ██   ██ ██   ██ ██ ██   ██ ██   ██ ██                    ║
║     ██    ██████   ██████  ███████ ██ ███████ ███████ ██                    ║
║     ██    ██       ██   ██ ██   ██ ██ ██   ██ ██   ██ ██                    ║
║     ██    ████████ ██   ██ ██   ██ ██ ██   ██ ██   ██ ███████               ║
║                                                                               ║
║              ██████   ██████  ██████  ████████ ███████  ██████  ██      ██   ║
║              ██   ██ ██    ██ ██   ██    ██    ██      ██    ██ ██      ██   ║
║              ██████  ██    ██ ██████     ██    █████   ██    ██ ██      ██   ║
║              ██      ██    ██ ██   ██    ██    ██      ██    ██ ██      ██   ║
║              ██       ██████  ██   ██    ██    ██       ██████  ███████ ██   ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝`}
        </pre>
      </div>

      {}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Terminal Portfolio",
            applicationCategory: "Portfolio",
            operatingSystem: "Web Browser",
            description: "Interactive terminal-themed developer portfolio",
            author: {
              "@type": "Person",
              name: "Developer Portfolio",
              jobTitle: "Full-Stack Developer",
            },
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            featureList: [
              "Interactive command-line interface",
              "Multiple color themes",
              "Responsive design",
              "Accessibility features",
              "Progressive Web App",
            ],
          }),
        }}
      />
    </div>
  );
}
