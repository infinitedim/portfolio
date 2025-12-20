"use client";

import type { ThemeConfig } from "@/types/theme";
import type { ServiceMethod } from "../BackendTestingDashboard";

interface MethodSelectorProps {
  methods: ServiceMethod[];
  selectedMethod: ServiceMethod | null;
  onMethodSelect: (method: ServiceMethod) => void;
  themeConfig: ThemeConfig;
}

/**
 *
 * @param root0
 * @param root0.methods
 * @param root0.selectedMethod
 * @param root0.onMethodSelect
 * @param root0.themeConfig
 */
export function MethodSelector({
  methods,
  selectedMethod,
  onMethodSelect,
  themeConfig,
}: MethodSelectorProps) {
  const getMethodIcon = (type: string, _httpMethod: string) => {
    if (type === "query") return "🔍";
    if (type === "mutation") return "✏️";
    return "⚡";
  };

  const getMethodColor = (httpMethod: string) => {
    switch (httpMethod) {
      case "GET":
        return "#10B981";
      case "POST":
        return "#3B82F6";
      case "PUT":
        return "#F59E0B";
      case "DELETE":
        return "#EF4444";
      case "PATCH":
        return "#8B5CF6";
      default:
        return themeConfig.colors.accent;
    }
  };

  return (
    <div className="space-y-3">
      {methods.map((method) => (
        <button
          key={method.name}
          onClick={() => onMethodSelect(method)}
          className={`w-full p-4 text-left border rounded-lg transition-all duration-200 font-mono text-sm ${selectedMethod?.name === method.name
            ? "scale-105"
            : "hover:scale-102 hover:opacity-80"
            }`}
          style={{
            borderColor:
              selectedMethod?.name === method.name
                ? themeConfig.colors.accent
                : themeConfig.colors.border,
            backgroundColor:
              selectedMethod?.name === method.name
                ? `${themeConfig.colors.accent}20`
                : themeConfig.colors.bg,
            color:
              selectedMethod?.name === method.name
                ? themeConfig.colors.accent
                : themeConfig.colors.text,
          }}
        >
          <div className="flex items-start space-x-3">
            <div
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: getMethodColor(method.httpMethod),
                color: "#ffffff",
              }}
            >
              {getMethodIcon(method.type, method.httpMethod)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <div className="font-semibold text-base">{method.name}</div>
                <span
                  className="px-2 py-1 rounded text-xs font-bold"
                  style={{
                    backgroundColor: getMethodColor(method.httpMethod),
                    color: "#ffffff",
                  }}
                >
                  {method.httpMethod}
                </span>
                <span
                  className="px-2 py-1 rounded text-xs font-bold"
                  style={{
                    backgroundColor:
                      method.type === "query" ? "#10B981" : "#3B82F6",
                    color: "#ffffff",
                  }}
                >
                  {method.type.toUpperCase()}
                </span>
              </div>
              <div className="text-xs opacity-70 mt-1">
                {method.description}
              </div>
              {method.parameters && method.parameters.length > 0 && (
                <div className="text-xs opacity-50 mt-1">
                  {method.parameters.length} parameter
                  {method.parameters.length !== 1 ? "s" : ""} required
                </div>
              )}
            </div>
            {selectedMethod?.name === method.name && (
              <span className="text-xs opacity-50">▶</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
