/**
 * Tour step configuration for the guided onboarding experience
 */

export interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for element to highlight
  position: "top" | "bottom" | "left" | "right" | "center";
  action?: "type" | "click" | "highlight";
  demoCommand?: string;
  icon: string;
  tips?: string[];
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Terminal Portfolio! 🚀",
    content:
      "This isn't your typical portfolio. Here, you explore by typing commands — just like a real developer would. Let me show you around!",
    position: "center",
    icon: "👋",
    tips: [
      "This tour takes about 1 minute",
      "You can skip anytime with ESC",
      "Type 'tour' anytime to restart",
    ],
  },
  {
    id: "command-input",
    title: "The Command Line ⌨️",
    content:
      "This is where the magic happens! Type commands here and press Enter to execute. Try typing 'help' to see all available commands.",
    target: "#command-input",
    position: "top",
    icon: "⌨️",
    action: "highlight",
    demoCommand: "help",
  },
  {
    id: "tab-completion",
    title: "Smart Auto-Complete 💡",
    content:
      "Start typing and press Tab — the terminal will suggest matching commands. Try typing 'sk' and hitting Tab!",
    target: "#command-input",
    position: "top",
    icon: "⚡",
    demoCommand: "sk",
    tips: ["Press Tab to auto-complete", "Works with partial matches"],
  },
  {
    id: "history",
    title: "Command History 📜",
    content:
      "Use ↑ and ↓ arrow keys to navigate through your previous commands. No need to retype!",
    target: "#command-input",
    position: "top",
    icon: "📜",
    tips: [
      "↑ = Previous command",
      "↓ = Next command",
      "Ctrl+R = Search history",
    ],
  },
  {
    id: "essential-commands",
    title: "Essential Commands 🎯",
    content:
      "Here are the commands you'll use most often. Each one reveals something different about me!",
    position: "center",
    icon: "🎯",
    tips: [
      "'about' — Learn who I am",
      "'skills' — See my tech stack",
      "'projects' — Explore my work",
      "'contact' — Get in touch",
    ],
  },
  {
    id: "keyboard-shortcuts",
    title: "Power User Shortcuts ⚡",
    content: "Master these shortcuts to navigate like a pro!",
    position: "center",
    icon: "⚡",
    tips: [
      "Ctrl+L — Clear screen",
      "Ctrl+C — Cancel input",
      "Ctrl+A — Jump to start",
      "Ctrl+E — Jump to end",
      "Tab — Auto-complete",
    ],
  },
  {
    id: "complete",
    title: "You're All Set! 🎉",
    content:
      "You now know the basics! Start exploring by typing 'help' to see all available commands. Have fun!",
    position: "center",
    icon: "🎉",
    tips: [
      "Type 'tour' to replay this guide",
      "Type 'help' for all commands",
      "Enjoy exploring! 🚀",
    ],
  },
];

export const TOUR_STORAGE_KEY = "terminal-tour-completed";
export const TOUR_VERSION = "1.0.0";
