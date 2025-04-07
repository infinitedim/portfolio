import { EventEmitter } from "events";

class CompilationTracker extends EventEmitter {
  private totalFiles: number = 0;
  private compiledFiles: string[] = [];
  private isCompiling: boolean = false;

  constructor() {
    super();
    // Initialize the tracker
    this.watchCompilation();
  }

  private watchCompilation() {
    // In a real implementation, this would hook into Next.js webpack hooks
    // or use the Next.js custom server API to track compilation events

    // For now, we just simulate the process
    console.log("Watching for Next.js compilation events...");
  }

  public getProgress(): {
    percentage: number;
    lastFile: string | null;
    isCompiling: boolean;
  } {
    const percentage =
      this.totalFiles === 0
        ? 0
        : Math.floor((this.compiledFiles.length / this.totalFiles) * 100);

    return {
      percentage,
      lastFile:
        this.compiledFiles.length > 0
          ? this.compiledFiles[this.compiledFiles.length - 1]
          : null,
      isCompiling: this.isCompiling,
    };
  }
}

// Singleton instance
export const compilationTracker = new CompilationTracker();
