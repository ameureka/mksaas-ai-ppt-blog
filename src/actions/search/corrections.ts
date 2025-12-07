'use server';

import { getDb } from '@/db';
import { hotKeywords } from '@/db/schema';
import { findSimilarWords } from '@/lib/levenshtein';

/**
 * 获取搜索纠错建议
 */
export async function getSearchCorrections(query: string): Promise<string[]> {
  const db = await getDb();

  // 获取所有热词
  const hotWords = await db
    .select({ keyword: hotKeywords.keyword })
    .from(hotKeywords);
  const candidates = hotWords.map((h) => h.keyword);

  // 编辑距离匹配
  const similar = findSimilarWords(query, candidates, 2);

  // 去重并取 Top 3
  const seen = new Set<string>();
  return similar
    .filter((r) => {
      const lower = r.word.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    })
    .slice(0, 3)
    .map((r) => r.word);
}
