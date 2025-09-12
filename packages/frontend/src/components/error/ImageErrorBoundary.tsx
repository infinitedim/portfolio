"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ImageErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Image Error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 w-full h-full min-h-[200px]">
            <div className="text-center p-4">
              <span className="text-4xl">🖼️</span>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Failed to load image
              </p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
