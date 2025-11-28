/* eslint-disable prettier/prettier */
"use client";

import { useState, useMemo } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useCommandHistory } from "@/hooks/useCommandHistory";

interface CommandNode {
  id: string;
  command: string;
  frequency: number;
  category: string;
  lastUsed: Date;
  successRate: number;
  avgExecutionTime: number;
}

interface CommandRelationship {
  from: string;
  to: string;
  strength: number;
  avgDelay: number;
  bidirectional: boolean;
}

interface CommandRelationshipVisualizerProps {
  isVisible: boolean;
  onClose: () => void;
  onCommandSelect?: (command: string) => void;
  maxNodes?: number;
}

export function CommandRelationshipVisualizer({
  isVisible,
  onClose,
  onCommandSelect,
  maxNodes = 20,
}: CommandRelationshipVisualizerProps) {
  const { themeConfig } = useTheme();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"network" | "clusters">("network");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const { history, categories } = useCommandHistory();

  const commandNodes = useMemo((): CommandNode[] => {
    const nodeMap = new Map<string, CommandNode>();

    history.forEach((entry) => {
      if (nodeMap.has(entry.command)) {
        const node = nodeMap.get(entry.command)!;
        node.frequency++;
        if (entry.timestamp > node.lastUsed) {
          node.lastUsed = entry.timestamp;
        }
        if (entry.success) {
          node.successRate =
            (node.successRate * (node.frequency - 1) + 100) / node.frequency;
        } else {
          node.successRate =
            (node.successRate * (node.frequency - 1)) / node.frequency;
        }
        if (entry.executionTime) {
          node.avgExecutionTime =
            (node.avgExecutionTime * (node.frequency - 1) +
              entry.executionTime) /
            node.frequency;
        }
      } else {
        nodeMap.set(entry.command, {
          id: entry.command,
          command: entry.command,
          frequency: 1,
          category: entry.category,
          lastUsed: entry.timestamp,
          successRate: entry.success ? 100 : 0,
          avgExecutionTime: entry.executionTime || 0,
        });
      }
    });

    return Array.from(nodeMap.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, maxNodes);
  }, [history, maxNodes]);

  const commandRelationships = useMemo((): CommandRelationship[] => {
    const relationships: Map<string, CommandRelationship> = new Map();

    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i];
      const next = history[i + 1];

      if (
        !commandNodes.find((n) => n.command === current.command) ||
        !commandNodes.find((n) => n.command === next.command)
      ) {
        continue;
      }

      const key = `${current.command}->${next.command}`;
      const reverseKey = `${next.command}->${current.command}`;
      const delay = next.timestamp.getTime() - current.timestamp.getTime();

      if (relationships.has(key)) {
        const rel = relationships.get(key)!;
        rel.strength += 1;
        rel.avgDelay = (rel.avgDelay + delay) / 2;
      } else if (relationships.has(reverseKey)) {
        const rel = relationships.get(reverseKey)!;
        rel.strength += 1;
        rel.bidirectional = true;
        rel.avgDelay = (rel.avgDelay + delay) / 2;
      } else {
        relationships.set(key, {
          from: current.command,
          to: next.command,
          strength: 1,
          avgDelay: delay,
          bidirectional: false,
        });
      }
    }

    const maxStrength = Math.max(
      ...Array.from(relationships.values()).map((r) => r.strength),
    );
    relationships.forEach((rel) => {
      rel.strength = rel.strength / maxStrength;
    });

    return Array.from(relationships.values())
      .filter((rel) => rel.strength > 0.1)
      .sort((a, b) => b.strength - a.strength);
  }, [history, commandNodes]);

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      info: themeConfig.colors.info || "#3B82F6",
      system: themeConfig.colors.error || "#EF4444",
      customization: themeConfig.colors.warning || "#F59E0B",
      development: themeConfig.colors.success || "#10B981",
      navigation: themeConfig.colors.accent || "#8B5CF6",
    };
    return colors[category] || themeConfig.colors.muted || "#6B7280";
  };

  const handleNodeClick = (command: string) => {
    setSelectedNode(selectedNode === command ? null : command);
  };

  const handleKeyDown = (event: React.KeyboardEvent, command: string) => {
    if (event.key === "Enter" || event.key === " ") {
      handleNodeClick(command);
    }
  };

  const filteredNodes =
    filterCategory === "all"
      ? commandNodes
      : commandNodes.filter((node) => node.category === filterCategory);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div
        className="w-full max-w-6xl mx-4 h-5/6 rounded-lg border shadow-2xl overflow-hidden"
        style={{
          backgroundColor: themeConfig.colors.bg,
          borderColor: themeConfig.colors.border,
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{
            backgroundColor: `${themeConfig.colors.accent}08`,
            borderColor: themeConfig.colors.border,
          }}
        >
          <div className="flex items-center gap-4">
            <h3
              className="text-xl font-bold"
              style={{ color: themeConfig.colors.text }}
            >
              🕸️ Command Relationships
            </h3>

            <div className="flex items-center gap-2">
              {["network", "clusters"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as typeof viewMode)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${viewMode === mode ? "ring-2" : ""
                    }`}
                  style={{
                    backgroundColor:
                      viewMode === mode
                        ? `${themeConfig.colors.accent}20`
                        : `${themeConfig.colors.accent}10`,
                    color: themeConfig.colors.accent,
                  }}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1 text-sm rounded border bg-transparent"
              style={{
                borderColor: themeConfig.colors.border,
                color: themeConfig.colors.text,
              }}
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-opacity-20 transition-colors"
              style={{ color: themeConfig.colors.muted }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-full">
          <div className="flex-1 overflow-hidden">
            {viewMode === "network" && (
              <div className="p-6 h-full overflow-y-auto">
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                  {filteredNodes.map((node) => {
                    const isSelected = selectedNode === node.command;
                    const relatedNodes = commandRelationships
                      .filter(
                        (rel) =>
                          rel.from === node.command || rel.to === node.command,
                      )
                      .map((rel) =>
                        rel.from === node.command ? rel.to : rel.from,
                      );

                    return (
                      <div
                        key={node.id}
                        role="button"
                        tabIndex={0}
                        className={`relative p-4 rounded-lg border cursor-pointer transition-all duration-200 ${isSelected ? "ring-2 scale-105" : "hover:scale-102"
                          }`}
                        style={{
                          backgroundColor: isSelected
                            ? `${getCategoryColor(node.category)}20`
                            : `${getCategoryColor(node.category)}10`,
                          borderColor: getCategoryColor(node.category),
                          borderWidth: isSelected ? 2 : 1,
                        }}
                        onClick={() => handleNodeClick(node.command)}
                        onKeyDown={(e) => handleKeyDown(e, node.command)}
                      >
                        <div className="text-center">
                          <div
                            className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold"
                            style={{
                              backgroundColor: getCategoryColor(node.category),
                              fontSize: "10px",
                            }}
                          >
                            {node.frequency}
                          </div>

                          <div
                            className="text-xs font-medium mb-1 truncate"
                            style={{ color: themeConfig.colors.text }}
                            title={node.command}
                          >
                            {node.command}
                          </div>

                          <div
                            className="text-xs opacity-75"
                            style={{ color: themeConfig.colors.muted }}
                          >
                            {Math.round(node.successRate)}% success
                          </div>
                        </div>

                        {relatedNodes.length > 0 && (
                          <div
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center text-white"
                            style={{
                              backgroundColor: themeConfig.colors.info,
                            }}
                          >
                            {relatedNodes.length}
                          </div>
                        )}

                        {isSelected && (
                          <div
                            className="absolute inset-0 rounded-lg pointer-events-none"
                            style={{
                              boxShadow: `0 0 20px ${getCategoryColor(
                                node.category,
                              )}50`,
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedNode && (
                  <div
                    className="mt-6 p-4 rounded-lg border"
                    style={{
                      backgroundColor: `${themeConfig.colors.accent}05`,
                      borderColor: themeConfig.colors.border,
                    }}
                  >
                    <h4
                      className="font-medium mb-3"
                      style={{ color: themeConfig.colors.text }}
                    >
                      {`Relationships for "${selectedNode}"`}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {commandRelationships
                        .filter(
                          (rel) =>
                            rel.from === selectedNode ||
                            rel.to === selectedNode,
                        )
                        .map((rel, index) => {
                          const otherCommand =
                            rel.from === selectedNode ? rel.to : rel.from;
                          const direction =
                            rel.from === selectedNode ? "outgoing" : "incoming";

                          return (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-3 rounded border"
                              style={{
                                backgroundColor: `${themeConfig.colors.accent}03`,
                                borderColor: themeConfig.colors.border,
                              }}
                            >
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    direction === "outgoing"
                                      ? themeConfig.colors.success
                                      : themeConfig.colors.info,
                                }}
                              />

                              <div className="flex-1">
                                <div
                                  className="text-sm font-medium"
                                  style={{ color: themeConfig.colors.text }}
                                >
                                  {direction === "outgoing" ? "→" : "←"}{" "}
                                  {otherCommand}
                                </div>

                                <div
                                  className="text-xs opacity-75"
                                  style={{ color: themeConfig.colors.muted }}
                                >
                                  Strength: {Math.round(rel.strength * 100)}%
                                  {rel.avgDelay && (
                                    <>
                                      {" • Avg delay: "}
                                      {Math.round(rel.avgDelay / 1000)}s
                                    </>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => onCommandSelect?.(otherCommand)}
                                className="px-2 py-1 text-xs rounded border"
                                style={{
                                  borderColor: themeConfig.colors.accent,
                                  color: themeConfig.colors.accent,
                                }}
                              >
                                Run
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {viewMode === "clusters" && (
              <div className="p-6 h-full overflow-y-auto">
                <div className="text-center py-8">
                  <div
                    className="text-lg font-medium mb-2"
                    style={{ color: themeConfig.colors.text }}
                  >
                    🚧 Cluster View Coming Soon
                  </div>
                  <div
                    className="text-sm"
                    style={{ color: themeConfig.colors.muted }}
                  >
                    Advanced clustering analysis is under development
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div
            className="w-80 border-l p-6 overflow-y-auto"
            style={{
              backgroundColor: `${themeConfig.colors.accent}05`,
              borderColor: themeConfig.colors.border,
            }}
          >
            <h4
              className="text-lg font-bold mb-4"
              style={{ color: themeConfig.colors.text }}
            >
              📊 Analysis
            </h4>

            <div className="space-y-4 mb-6">
              <div
                className="p-3 rounded border"
                style={{
                  backgroundColor: `${themeConfig.colors.success}10`,
                  borderColor: themeConfig.colors.border,
                }}
              >
                <div
                  className="text-sm font-medium"
                  style={{ color: themeConfig.colors.success }}
                >
                  Most Used Command
                </div>
                <div
                  className="text-lg font-mono"
                  style={{ color: themeConfig.colors.text }}
                >
                  {filteredNodes[0]?.command || "N/A"}
                </div>
                <div
                  className="text-xs"
                  style={{ color: themeConfig.colors.muted }}
                >
                  {filteredNodes[0]?.frequency || 0} times
                </div>
              </div>

              <div
                className="p-3 rounded border"
                style={{
                  backgroundColor: `${themeConfig.colors.info}10`,
                  borderColor: themeConfig.colors.border,
                }}
              >
                <div
                  className="text-sm font-medium"
                  style={{ color: themeConfig.colors.info }}
                >
                  Strongest Relationship
                </div>
                {commandRelationships[0] ? (
                  <>
                    <div
                      className="text-sm font-mono"
                      style={{ color: themeConfig.colors.text }}
                    >
                      {commandRelationships[0].from} →{" "}
                      {commandRelationships[0].to}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: themeConfig.colors.muted }}
                    >
                      {Math.round(commandRelationships[0].strength * 100)}%
                      correlation
                    </div>
                  </>
                ) : (
                  <div
                    className="text-sm"
                    style={{ color: themeConfig.colors.muted }}
                  >
                    No relationships found
                  </div>
                )}
              </div>

              <div
                className="p-3 rounded border"
                style={{
                  backgroundColor: `${themeConfig.colors.warning}10`,
                  borderColor: themeConfig.colors.border,
                }}
              >
                <div
                  className="text-sm font-medium"
                  style={{ color: themeConfig.colors.warning }}
                >
                  Total Relationships
                </div>
                <div
                  className="text-lg"
                  style={{ color: themeConfig.colors.text }}
                >
                  {commandRelationships.length}
                </div>
                <div
                  className="text-xs"
                  style={{ color: themeConfig.colors.muted }}
                >
                  Between {filteredNodes.length} commands
                </div>
              </div>
            </div>

            <div>
              <h5
                className="font-medium mb-3"
                style={{ color: themeConfig.colors.text }}
              >
                🎨 Category Legend
              </h5>

              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getCategoryColor(category) }}
                    />
                    <span
                      className="text-sm"
                      style={{ color: themeConfig.colors.text }}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                    <span
                      className="text-xs ml-auto"
                      style={{ color: themeConfig.colors.muted }}
                    >
                      {
                        commandNodes.filter((n) => n.category === category)
                          .length
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 border-t text-sm"
          style={{
            backgroundColor: `${themeConfig.colors.muted}05`,
            borderColor: themeConfig.colors.border,
            color: themeConfig.colors.muted,
          }}
        >
          <div className="flex items-center justify-between">
            <span>
              🕸️ Interactive relationship mapping • 🔍 Pattern analysis • 📊
              Usage insights
            </span>
            <span className="text-xs">
              Click nodes to explore relationships
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
