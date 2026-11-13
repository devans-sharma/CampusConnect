export interface MatchCandidate {
  item: any;
  confidenceScore: number;
  matchReasons: string[];
}

export class MatchingEngine {
  /**
   * Compares a target item against a list of candidate items of the opposite type.
   * If target is LOST, candidates are FOUND (and vice versa).
   */
  static findMatches(targetItem: any, candidates: any[]): MatchCandidate[] {
    const matches: MatchCandidate[] = [];

    const targetWords = this.tokenize(`${targetItem.itemName} ${targetItem.brand || ''} ${targetItem.colour || ''}`);
    const targetDate = new Date(targetItem.dateOccurred).getTime();

    for (const candidate of candidates) {
      let score = 0;
      const reasons: string[] = [];

      // 1. Category match (Weight: 40 points)
      if (candidate.categoryId === targetItem.categoryId) {
        score += 40;
        reasons.push(`Identical category: ${candidate.category?.name || 'Category match'}`);
      }

      // 2. Name & Brand token overlap (Weight: 25 points)
      const candidateWords = this.tokenize(`${candidate.itemName} ${candidate.brand || ''}`);
      const commonWords = targetWords.filter(word => candidateWords.includes(word));
      if (commonWords.length > 0) {
        const overlapRatio = Math.min(1, commonWords.length / Math.max(1, Math.min(targetWords.length, 3)));
        const tokenPoints = Math.round(overlapRatio * 25);
        score += tokenPoints;
        reasons.push(`Similar keywords: ${commonWords.slice(0, 3).join(', ')}`);
      }

      // 3. Colour match (Weight: 15 points)
      if (targetItem.colour && candidate.colour) {
        const targetColour = targetItem.colour.toLowerCase().trim();
        const candidateColour = candidate.colour.toLowerCase().trim();
        if (targetColour === candidateColour || candidateColour.includes(targetColour) || targetColour.includes(candidateColour)) {
          score += 15;
          reasons.push(`Matching color: ${candidate.colour}`);
        }
      }

      // 4. Location proximity (Weight: 10 points)
      if (targetItem.location && candidate.location) {
        const targetLocTokens = this.tokenize(targetItem.location);
        const candLocTokens = this.tokenize(candidate.location);
        const locCommon = targetLocTokens.filter(t => candLocTokens.includes(t));
        if (locCommon.length > 0) {
          score += 10;
          reasons.push(`Nearby location: ${locCommon.join(', ')}`);
        }
      }

      // 5. Date proximity (Weight: 10 points)
      if (targetItem.dateOccurred && candidate.dateOccurred) {
        const candDate = new Date(candidate.dateOccurred).getTime();
        const diffDays = Math.abs(targetDate - candDate) / (1000 * 60 * 60 * 24);
        if (diffDays <= 3) {
          score += 10;
          reasons.push('Reported within 3 days of occurrence');
        } else if (diffDays <= 7) {
          score += 7;
          reasons.push('Reported within 1 week');
        } else if (diffDays <= 14) {
          score += 4;
          reasons.push('Reported within 2 weeks');
        }
      }

      // Only consider if score is above threshold (e.g. 40 points)
      if (score >= 40) {
        // Guarantee private verification details are stripped
        const safeItem = { ...candidate };
        delete safeItem.privateVerificationDetails;

        matches.push({
          item: safeItem,
          confidenceScore: Math.min(100, score),
          matchReasons: reasons,
        });
      }
    }

    // Sort descending by score
    return matches.sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  private static tokenize(text: string): string[] {
    const stopWords = new Set(['the', 'and', 'with', 'for', 'a', 'an', 'in', 'on', 'at', 'to', 'of', 'near', 'from', 'left', 'found', 'lost']);
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
  }
}
