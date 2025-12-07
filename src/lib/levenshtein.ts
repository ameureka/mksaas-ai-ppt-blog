/**
 * 计算两个字符串的编辑距离 (Levenshtein Distance)
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= a.length; i++) matrix[i] = [i];
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

/**
 * 查找相似词（编辑距离 ≤ threshold）
 */
export function findSimilarWords(
  query: string,
  candidates: string[],
  threshold = 2
): { word: string; distance: number }[] {
  return candidates
    .map((candidate) => ({
      word: candidate,
      distance: levenshteinDistance(query, candidate),
    }))
    .filter((r) => r.distance <= threshold && r.distance > 0)
    .sort((a, b) => a.distance - b.distance);
}
