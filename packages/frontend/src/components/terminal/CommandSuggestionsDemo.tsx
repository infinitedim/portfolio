"use client";

import { useState, type JSX } from "react";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";
import { CommandInput } from "./CommandInput";

const DEMO_COMMANDS = [
  "help",
  "about",
  "skills",
  "projects",
  "contact",
  "experience",
  "education",
  "clear",
  "theme",
  "font",
  "customize",
  "themes",
  "fonts",
  "status",
  "alias",
  "roadmap",
  "progress",
];

interface TestScenario {
  input: string;
  description: string;
  expectedSuggestions: string[];
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    input: "hel",
    description: "Prefix match - should suggest 'help'",
    expectedSuggestions: ["help"],
  },
  {
    input: "them",
    description: "Prefix match - should suggest 'theme', 'themes'",
    expectedSuggestions: ["theme", "themes"],
  },
  {
    input: "proj",
    description: "Prefix match - should suggest 'projects', 'progress'",
    expectedSuggestions: ["projects", "progress"],
  },
  {
    input: "skill",
    description: "Exact/prefix match - should suggest 'skills'",
    expectedSuggestions: ["skills"],
  },
  {
    input: "halp",
    description: "Typo tolerance - should suggest 'help' (h-a-l-p vs h-e-l-p)",
    expectedSuggestions: ["help"],
  },
  {
    input: "teme",
    description:
      "Typo tolerance - should suggest 'theme' (t-e-m-e vs t-h-e-m-e)",
    expectedSuggestions: ["theme"],
  },
  {
    input: "cleer",
    description:
      "Typo tolerance - should suggest 'clear' (c-l-e-e-r vs c-l-e-a-r)",
    expectedSuggestions: ["clear"],
  },
  {
    input: "exp",
    description: "Prefix match - should suggest 'experience'",
    expectedSuggestions: ["experience"],
  },
  {
    input: "cust",
    description: "Prefix match - should suggest 'customize'",
    expectedSuggestions: ["customize"],
  },
  {
    input: "xyz",
    description: "No matches - should show no suggestions",
    expectedSuggestions: [],
  },
];

/**
 * Demo component for testing CommandSuggestions system
 * @returns {JSX.Element} The CommandSuggestionsDemo component
 */
export function CommandSuggestionsDemo(): JSX.Element {
  const { themeConfig, theme } = useTheme();
  const [currentInput, setCurrentInput] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(
    null,
  );
  const [demoMode, setDemoMode] = useState<"manual" | "scenarios">("manual");

  const handleScenarioTest = (scenario: TestScenario) => {
    setSelectedScenario(scenario);
    setCurrentInput(scenario.input);
  };

  const handleInputChange = (value: string) => {
    setCurrentInput(value);
    if (selectedScenario && value !== selectedScenario.input) {
      setSelectedScenario(null);
    }
  };

  const handleSubmit = (command: string) => {
    // Just for demo - don't actually execute
    console.log(`Demo command: ${command}`);
    setCurrentInput("");
    setSelectedScenario(null);
  };

  const navigateHistory = () => "";

  if (!themeConfig?.colors) {
    return <div />;
  }

  return (
    <div
      key={`command-suggestions-demo-${theme}`}
      className="space-y-6"
    >
      {/* Demo Header */}
      <div
        className="p-4 rounded border"
        style={{
          borderColor: themeConfig.colors.border,
          backgroundColor: `${themeConfig.colors.bg}80`,
        }}
      >
        <h3
          className="text-lg font-bold mb-4"
          style={{ color: themeConfig.colors.accent }}
        >
          🔍 Command Suggestions Demo
        </h3>

        <div className="flex gap-2 mb-4">
          {["manual", "scenarios"].map((mode) => (
            <button
              key={mode}
              onClick={() => setDemoMode(mode as typeof demoMode)}
              className={`px-3 py-1 rounded text-sm font-mono transition-all duration-200 ${
                demoMode === mode
                  ? "opacity-100"
                  : "opacity-60 hover:opacity-80"
              }`}
              style={{
                backgroundColor:
                  demoMode === mode
                    ? themeConfig.colors.accent
                    : `${themeConfig.colors.accent}40`,
                color:
                  demoMode === mode
                    ? themeConfig.colors.bg
                    : themeConfig.colors.text,
                border: `1px solid ${themeConfig.colors.accent}`,
              }}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
            </button>
          ))}
        </div>

        <p
          className="text-sm font-mono"
          style={{ color: themeConfig.colors.muted }}
        >
          {demoMode === "manual"
            ? "💡 Type in the terminal below to see live suggestions with typo tolerance"
            : "🧪 Click test scenarios to see how suggestions work with different inputs"}
        </p>
      </div>

      {/* Test Scenarios */}
      {demoMode === "scenarios" && (
        <div
          className="p-4 rounded border"
          style={{
            borderColor: themeConfig.colors.border,
            backgroundColor: `${themeConfig.colors.muted}05`,
          }}
        >
          <h4
            className="font-bold mb-3"
            style={{ color: themeConfig.colors.text }}
          >
            🧪 Test Scenarios
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {TEST_SCENARIOS.map((scenario, index) => (
              <button
                key={index}
                onClick={() => handleScenarioTest(scenario)}
                className={`p-3 rounded border text-left transition-all duration-200 hover:opacity-80 ${
                  selectedScenario === scenario ? "opacity-100" : "opacity-70"
                }`}
                style={{
                  borderColor:
                    selectedScenario === scenario
                      ? themeConfig.colors.accent
                      : themeConfig.colors.border,
                  backgroundColor:
                    selectedScenario === scenario
                      ? `${themeConfig.colors.accent}10`
                      : "transparent",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <code
                    className="text-sm px-2 py-1 rounded"
                    style={{
                      backgroundColor: `${themeConfig.colors.accent}20`,
                      color: themeConfig.colors.accent,
                    }}
                  >
                    "{scenario.input}"
                  </code>
                  {scenario.expectedSuggestions.length === 0 && (
                    <span
                      className="text-xs px-1 rounded"
                      style={{
                        backgroundColor: `${themeConfig.colors.error || themeConfig.colors.muted}20`,
                        color:
                          themeConfig.colors.error || themeConfig.colors.muted,
                      }}
                    >
                      NO MATCH
                    </span>
                  )}
                </div>
                <p
                  className="text-xs"
                  style={{ color: themeConfig.colors.muted }}
                >
                  {scenario.description}
                </p>
                {scenario.expectedSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {scenario.expectedSuggestions.map((suggestion) => (
                      <span
                        key={suggestion}
                        className="text-xs px-1 rounded"
                        style={{
                          backgroundColor: `${themeConfig.colors.success || themeConfig.colors.accent}20`,
                          color:
                            themeConfig.colors.success ||
                            themeConfig.colors.accent,
                        }}
                      >
                        {suggestion}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live Demo Terminal */}
      <div
        className="p-6 rounded border min-h-32"
        style={{
          borderColor: themeConfig.colors.border,
          backgroundColor: themeConfig.colors.bg,
        }}
      >
        <div
          className="mb-4 text-sm"
          style={{ color: themeConfig.colors.muted }}
        >
          🖥️ Demo Terminal{" "}
          {selectedScenario && `(Testing: "${selectedScenario.input}")`}
        </div>

        <div className="relative">
          <CommandInput
            value={currentInput}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            onHistoryNavigate={navigateHistory}
            isProcessing={false}
            availableCommands={DEMO_COMMANDS}
            prompt="demo$"
          />
        </div>
      </div>

      {/* Info Panel */}
      <div
        className="p-4 rounded border text-sm space-y-3"
        style={{
          borderColor: themeConfig.colors.border,
          backgroundColor: `${themeConfig.colors.muted}05`,
          color: themeConfig.colors.text,
        }}
      >
        <div>
          <h5 className="font-bold mb-2">🎯 Suggestion Types:</h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              ⚡ <strong>Exact:</strong> Perfect match
            </div>
            <div>
              🔍 <strong>Prefix:</strong> Starts with input
            </div>
            <div>
              📝 <strong>Fuzzy:</strong> Contains input
            </div>
            <div>
              🔧 <strong>Typo:</strong> Similar with tolerance
            </div>
          </div>
        </div>

        <div>
          <h5 className="font-bold mb-2">⌨️ Keyboard Controls:</h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <code>↑↓</code> Navigate suggestions
            </div>
            <div>
              <code>Enter/Tab</code> Select suggestion
            </div>
            <div>
              <code>Esc</code> Close suggestions
            </div>
            <div>
              <code>Type</code> Live filtering
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
