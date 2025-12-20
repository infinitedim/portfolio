/**
 * Utility class for handling command typos and fuzzy matching
 * Uses Levenshtein distance algorithm for command suggestions
 *
 * @example
 * ```ts
 * const suggestion = TypoTolerance.findSimilarCommand('hlep', ['help', 'clear', 'exit']);
 * console.log(suggestion); // 'help'
 * ```
 */
export class TypoTolerance {
  /**
   * Calculates the Levenshtein distance between two strings
   * Measures the minimum number of single-character edits needed to change one string into another
   * @param a - First string to compare
   * @param b - Second string to compare
   * @returns Number of edits required (lower is more similar)
   * @example
   * ```ts
   * const distance = TypoTolerance.levenshteinDistance('kitten', 'sitting');
   * console.log(distance); // 3
   * ```
   */
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

  /**
   * Finds the most similar command to the input within a distance threshold
   * @param input - The user's input string
   * @param availableCommands - List of valid command names
   * @param threshold - Maximum edit distance to consider (default: 2)
   * @returns Best matching command name, or null if none found within threshold
   * @example
   * ```ts
   * const match = TypoTolerance.findSimilarCommand('hlep', ['help', 'clear'], 2);
   * console.log(match); // 'help'
   * ```
   */
  static findSimilarCommand(
    input: string,
    availableCommands: string[],
    threshold = 2,
  ): string | null {
    let bestMatch: string | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const command of availableCommands) {
      const distance = this.levenshteinDistance(
        input.toLowerCase(),
        command.toLowerCase(),
      );
      if (distance <= threshold && distance < bestDistance) {
        bestDistance = distance;
        bestMatch = command;
      }
    }

    return bestMatch;
  }

  /**
   * Performs fuzzy matching to find all commands similar to the input
   * Returns matches sorted by similarity (closest first)
   * @param input - The user's input string
   * @param commands - List of command names to match against
   * @returns Array of matching commands, sorted by similarity
   * @example
   * ```ts
   * const matches = TypoTolerance.fuzzyMatch('the', ['theme', 'help', 'then']);
   * console.log(matches); // ['theme', 'then']
   * ```
   */
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

  /**
   * Calculates a similarity score between input and command (0-100)
   * Higher scores indicate better matches
   * @param input - The user's input string
   * @param command - Command name to score against
   * @returns Similarity score (100 = exact match, 0 = no match)
   * @example
   * ```ts
   * const score = TypoTolerance.getSuggestionScore('hel', 'help');
   * console.log(score); // ~80 (prefix match)
   * ```
   */
  static getSuggestionScore(input: string, command: string): number {
    const lowerInput = input.toLowerCase();
    const lowerCommand = command.toLowerCase();

    if (lowerCommand === lowerInput) {
      return 100;
    }

    if (lowerCommand.startsWith(lowerInput)) {
      return 80 + (lowerInput.length / lowerCommand.length) * 15;
    }

    if (lowerCommand.includes(lowerInput)) {
      const position = lowerCommand.indexOf(lowerInput);
      return Math.max(
        60 - position * 2 + (lowerInput.length / lowerCommand.length) * 10,
        30,
      );
    }

    const distance = this.levenshteinDistance(lowerInput, lowerCommand);
    const maxDistance = Math.max(2, Math.floor(lowerCommand.length * 0.4));

    if (distance <= maxDistance) {
      return Math.max(50 - distance * 8, 10);
    }

    return 0;
  }

  /**
   * Determines the type of match between input and command
   * @param input - The user's input string
   * @param command - Command name to match against
   * @returns Match type: "exact", "prefix", "fuzzy", or "typo"
   * @example
   * ```ts
   * const type = TypoTolerance.getSuggestionType('hel', 'help');
   * console.log(type); // 'prefix'
   * ```
   */
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
