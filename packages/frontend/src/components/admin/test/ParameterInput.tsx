/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import type { ThemeConfig } from "@/types/theme";

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface ParameterInputProps {
  parameters: Parameter[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  themeConfig: ThemeConfig;
}

/**
 *
 * @param root0
 * @param root0.parameters
 * @param root0.values
 * @param root0.onChange
 * @param root0.themeConfig
 */
export function ParameterInput({
  parameters,
  values,
  onChange,
  themeConfig,
}: ParameterInputProps) {
  const [expandedParams, setExpandedParams] = useState<Set<string>>(new Set());

  const toggleParam = (paramName: string) => {
    const newExpanded = new Set(expandedParams);
    if (newExpanded.has(paramName)) {
      newExpanded.delete(paramName);
    } else {
      newExpanded.add(paramName);
    }
    setExpandedParams(newExpanded);
  };

  const renderInput = (param: Parameter) => {
    const value = values[param.name] ?? "";

    switch (param.type) {
      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(param.name, Number(e.target.value))}
            className="w-full p-2 rounded border font-mono text-sm"
            style={{
              borderColor: themeConfig.colors.border,
              backgroundColor: themeConfig.colors.bg,
              color: themeConfig.colors.text,
            }}
            placeholder={`Enter ${param.name}...`}
          />
        );

      case "boolean":
        return (
          <select
            value={value.toString()}
            onChange={(e) => onChange(param.name, e.target.value === "true")}
            className="w-full p-2 rounded border font-mono text-sm"
            style={{
              borderColor: themeConfig.colors.border,
              backgroundColor: themeConfig.colors.bg,
              color: themeConfig.colors.text,
            }}
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );

      case "object":
        return (
          <textarea
            value={
              typeof value === "string" ? value : JSON.stringify(value, null, 2)
            }
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange(param.name, parsed);
              } catch {
                onChange(param.name, e.target.value);
              }
            }}
            className="w-full p-2 rounded border font-mono text-sm resize-none"
            style={{
              borderColor: themeConfig.colors.border,
              backgroundColor: themeConfig.colors.bg,
              color: themeConfig.colors.text,
            }}
            rows={4}
            placeholder={`Enter ${param.name} as JSON...`}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(param.name, e.target.value)}
            className="w-full p-2 rounded border font-mono text-sm"
            style={{
              borderColor: themeConfig.colors.border,
              backgroundColor: themeConfig.colors.bg,
              color: themeConfig.colors.text,
            }}
            placeholder={`Enter ${param.name}...`}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      {parameters.map((param) => (
        <div
          key={param.name}
          className="border rounded-lg p-3"
          style={{
            borderColor: themeConfig.colors.border,
            backgroundColor: themeConfig.colors.bg,
          }}
        >
          <button
            onClick={() => toggleParam(param.name)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center space-x-2">
              <span
                className="font-semibold text-sm"
                style={{ color: themeConfig.colors.accent }}
              >
                {param.name}
              </span>
              <span
                className="px-2 py-1 rounded text-xs font-bold"
                style={{
                  backgroundColor: param.required ? "#EF4444" : "#6B7280",
                  color: "#ffffff",
                }}
              >
                {param.required ? "REQUIRED" : "OPTIONAL"}
              </span>
              <span
                className="px-2 py-1 rounded text-xs font-bold"
                style={{
                  backgroundColor: themeConfig.colors.accent,
                  color: themeConfig.colors.bg,
                }}
              >
                {param.type.toUpperCase()}
              </span>
            </div>
            <span className="text-sm opacity-70">
              {expandedParams.has(param.name) ? "▼" : "▶"}
            </span>
          </button>

          {expandedParams.has(param.name) && (
            <div className="mt-3 space-y-2">
              <div className="text-xs opacity-70">{param.description}</div>
              {renderInput(param)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
