import { EventEmitter } from "events";

class CompilationTracker extends EventEmitter {
  private totalFiles: number = 0;
  private compiledFiles: string[] = [];
  private isCompiling: boolean = false;

  constructor() {
    super();
    this.watchCompilation();
  }

  private watchCompilation() {
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

export const compilationTracker = new CompilationTracker();
