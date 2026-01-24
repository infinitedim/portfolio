import type {Command} from "@/types/terminal";
import {TOUR_STORAGE_KEY} from "@/components/organisms/onboarding/tour-steps";

/**
 * Tour command - starts or restarts the guided tour
 * This provides a way to re-experience the onboarding walkthrough
 */
export const tourCommand: Command = {
  name: "tour",
  description: "Start or restart the guided tour",
  category: "utility",
  usage: "tour [--reset]",
  execute: async (args: string[]) => {
    const hasResetFlag = args?.includes("--reset") || args?.includes("-r");

    if (hasResetFlag) {
      // Clear the tour completion status
      if (typeof window !== "undefined") {
        localStorage.removeItem(TOUR_STORAGE_KEY);
      }
    }

    // Return a special signal that the Terminal component will handle
    return {
      content: "START_GUIDED_TOUR",
      type: "success" as const,
      timestamp: new Date(),
      id: `tour-${Date.now()}`,
    };
  },
};

/**
 * Help text for the tour command
 */
export const tourHelpText = `
╭─────────────────────────────────────────────────────────────╮
│  📚 TOUR COMMAND                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Start or restart the interactive guided tour.              │
│                                                             │
│  USAGE:                                                     │
│    tour          Start the guided tour                      │
│    tour --reset  Reset tour progress and start fresh        │
│                                                             │
│  The tour covers:                                           │
│    • Command line basics                                    │
│    • Tab completion and history                             │
│    • Essential commands (about, skills, projects)           │
│    • Theme customization                                    │
│    • Keyboard shortcuts                                     │
│                                                             │
│  TIP: Great for showing visitors how to use the terminal!   │
│                                                             │
╰─────────────────────────────────────────────────────────────╯
`.trim();
