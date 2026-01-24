"use client";

import type { JSX } from "react";

interface CommandErrorHandlerProps {
  error: Error;
  command: string;
  onRetry: () => void;
  onReport: () => void;
}

/**
 * A component to display an error message when a command fails.
 * It provides options to retry the command or report the issue.
 * @param {CommandErrorHandlerProps} props - The properties for the CommandErrorHandler component.
 * @param {Error} props.error - The error object that was thrown.
 * @param {string} props.command - The command that caused the error.
 * @param {() => void} props.onRetry - A callback function to execute when the retry button is clicked.
 * @param {() => void} props.onReport - A callback function to execute when the report issue button is clicked.
 * @returns {JSX.Element} - A component that displays the command error.
 */
export function CommandErrorHandler({
  error,
  command,
  onRetry,
  onReport,
}: CommandErrorHandlerProps): JSX.Element {
  return (
    <div className="p-4 rounded border border-red-500/30 bg-red-900/10 font-mono">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-red-400">❌</span>
        <span className="font-bold text-red-400">Command Error</span>
      </div>

      <div className="mb-3">
        <div className="text-sm opacity-75">
          Command: <code className="bg-gray-800 px-1 rounded">{command}</code>
        </div>
        <div className="text-sm text-red-400">{error.message}</div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onRetry}
          className="px-3 py-1 text-xs rounded border border-green-500/30 bg-green-900/20 text-green-400 hover:bg-green-900/30 transition-colors"
        >
          Retry
        </button>

        <button
          onClick={onReport}
          className="px-3 py-1 text-xs rounded border border-blue-500/30 bg-blue-900/20 text-blue-400 hover:bg-blue-900/30 transition-colors"
        >
          Report Issue
        </button>
      </div>

      <div className="mt-3 text-xs opacity-75">
        💡 Try typing 'help' to see available commands or 'clear' to reset the
        terminal.
      </div>
    </div>
  );
}
