"use client";

import { useState } from "react";
import type { ThemeConfig } from "@portfolio/frontend/src/types/theme";

interface RequestResponsePanelProps {
  requestLog: string;
  responseLog: string;
  isLoading: boolean;
  themeConfig: ThemeConfig;
}

/**
 *
 * @param root0
 * @param root0.requestLog
 * @param root0.responseLog
 * @param root0.isLoading
 * @param root0.themeConfig
 */
export function RequestResponsePanel({
  requestLog,
  responseLog,
  isLoading,
  themeConfig,
}: RequestResponsePanelProps) {
  const [activeTab, setActiveTab] = useState<"request" | "response">("request");

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const className = `{flex-1 p-3 text-sm font-mono transition-all duration-200 ${activeTab === "request" ? "scale-105" : "hover:opacity-80"}`;

  return (
    <div
      className="border rounded-lg"
      style={{
        borderColor: themeConfig.colors.border,
        backgroundColor: themeConfig.colors.bg,
      }}
    >
      {/* Tab Headers */}
      <div
        className="flex border-b"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <button
          onClick={() => setActiveTab("request")}
          className={className}
          style={{
            borderBottom:
              activeTab === "request"
                ? `2px solid ${themeConfig.colors.accent}`
                : "none",
            color:
              activeTab === "request"
                ? themeConfig.colors.accent
                : themeConfig.colors.text,
            backgroundColor:
              activeTab === "request"
                ? `${themeConfig.colors.accent}10`
                : "transparent",
          }}
        >
          📤 Request Log
        </button>
        <button
          onClick={() => setActiveTab("response")}
          className={className}
          style={{
            borderBottom:
              activeTab === "response"
                ? `2px solid ${themeConfig.colors.accent}`
                : "none",
            color:
              activeTab === "response"
                ? themeConfig.colors.accent
                : themeConfig.colors.text,
            backgroundColor:
              activeTab === "response"
                ? `${themeConfig.colors.accent}10`
                : "transparent",
          }}
        >
          📥 Response Log
        </button>
      </div>

      {/* Content Area */}
      <div className="p-4">
        {activeTab === "request" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3
                className="text-sm font-semibold"
                style={{ color: themeConfig.colors.accent }}
              >
                Request Details
              </h3>
              {requestLog && (
                <button
                  onClick={() => copyToClipboard(requestLog)}
                  className="px-3 py-1 rounded text-xs font-mono transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: themeConfig.colors.accent,
                    color: themeConfig.colors.bg,
                  }}
                >
                  📋 Copy
                </button>
              )}
            </div>
            <div className="relative">
              <textarea
                value={requestLog || "No request data available"}
                readOnly
                className="w-full h-64 p-3 rounded border font-mono text-xs resize-none"
                style={{
                  borderColor: themeConfig.colors.border,
                  backgroundColor: themeConfig.colors.bg,
                  color: requestLog
                    ? themeConfig.colors.text
                    : themeConfig.colors.muted,
                }}
                placeholder="Request data will appear here..."
              />
              {!requestLog && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📤</div>
                    <div className="text-sm opacity-50">
                      Select a service and method to see request data
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3
                className="text-sm font-semibold"
                style={{ color: themeConfig.colors.accent }}
              >
                Response Details
              </h3>
              {responseLog && (
                <button
                  onClick={() => copyToClipboard(responseLog)}
                  className="px-3 py-1 rounded text-xs font-mono transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: themeConfig.colors.accent,
                    color: themeConfig.colors.bg,
                  }}
                >
                  📋 Copy
                </button>
              )}
            </div>
            <div className="relative">
              <textarea
                value={responseLog || "No response data available"}
                readOnly
                className="w-full h-64 p-3 rounded border font-mono text-xs resize-none"
                style={{
                  borderColor: themeConfig.colors.border,
                  backgroundColor: themeConfig.colors.bg,
                  color: responseLog
                    ? themeConfig.colors.text
                    : themeConfig.colors.muted,
                }}
                placeholder="Response data will appear here..."
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <div className="text-sm">Executing request...</div>
                  </div>
                </div>
              )}
              {!responseLog && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📥</div>
                    <div className="text-sm opacity-50">
                      Execute a request to see response data
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
