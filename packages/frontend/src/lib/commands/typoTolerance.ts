export class TypoTolerance {
  public static levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1)
      .fill(null)
      .map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator,
        );
      }
    }

    return matrix[b.length][a.length];
  }

  static findSimilarCommand(
    input: string,
    availableCommands: string[],
    threshold = 2,
  ): string | null {
    let bestMatch: string | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const command of availableCommands) {
      // Iterate through available commands
      const distance = this.levenshteinDistance(
        input.toLowerCase(),
        command.toLowerCase(),
      );
      if (distance <= threshold && distance < bestDistance) {
        bestDistance = distance; // Update best distance
        bestMatch = command; // Update best match
      }
    }

    return bestMatch;
  }

  static fuzzyMatch(input: string, commands: string[]): string[] {
    const matches = commands.filter((command) => {
      const distance = this.levenshteinDistance(
        input.toLowerCase(),
        command.toLowerCase(),
      );
      return distance <= Math.max(1, Math.floor(command.length * 0.3));
    });

    return matches.sort((a, b) => {
      const distanceA = this.levenshteinDistance(
        input.toLowerCase(),
        a.toLowerCase(),
      );
      const distanceB = this.levenshteinDistance(
        input.toLowerCase(),
        b.toLowerCase(),
      );
      return distanceA - distanceB;
    });
  }

  static getSuggestionScore(input: string, command: string): number {
    const lowerInput = input.toLowerCase();
    const lowerCommand = command.toLowerCase();

    // Exact match
    if (lowerCommand === lowerInput) {
      return 100;
    }

    // Prefix match
    if (lowerCommand.startsWith(lowerInput)) {
      return 80 + (lowerInput.length / lowerCommand.length) * 15;
    }

    // Contains match
    if (lowerCommand.includes(lowerInput)) {
      const position = lowerCommand.indexOf(lowerInput);
      return Math.max(
        60 - position * 2 + (lowerInput.length / lowerCommand.length) * 10,
        30,
      );
    }

    // Typo tolerance match
    const distance = this.levenshteinDistance(lowerInput, lowerCommand);
    const maxDistance = Math.max(2, Math.floor(lowerCommand.length * 0.4));

    if (distance <= maxDistance) {
      return Math.max(50 - distance * 8, 10);
    }

    return 0;
  }

  static getSuggestionType(
    input: string,
    command: string,
  ): "exact" | "prefix" | "fuzzy" | "typo" {
    const lowerInput = input.toLowerCase();
    const lowerCommand = command.toLowerCase();

    if (lowerCommand === lowerInput) {
      return "exact";
    }

    if (lowerCommand.startsWith(lowerInput)) {
      return "prefix";
    }

    if (lowerCommand.includes(lowerInput)) {
      return "fuzzy";
    }

    return "typo";
  }
}
