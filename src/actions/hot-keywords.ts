'use server';

import { getDb } from '@/db';
import { hotKeywords, pinnedKeywords } from '@/db/schema';
import { asc } from 'drizzle-orm';

const DEFAULT_HOT_KEYWORDS = [
  '年终总结',
  '工作汇报',
  '项目提案',
  '商业计划书',
  '述职报告',
  '培训课件',
  '产品介绍',
  '数据分析',
];

/**
 * 获取热门关键词
 */
export async function getHotKeywords(): Promise<string[]> {
  try {
    const db = await getDb();
    const pinned = await db
      .select({ keyword: pinnedKeywords.keyword })
      .from(pinnedKeywords)
      .orderBy(asc(pinnedKeywords.rank))
      .limit(8);

    const auto = await db
      .select({ keyword: hotKeywords.keyword })
      .from(hotKeywords)
      .orderBy(asc(hotKeywords.rank))
      .limit(8);

    const seen = new Set<string>();
    const result: string[] = [];

    for (const row of [...pinned, ...auto]) {
      if (result.length >= 8) break;
      if (seen.has(row.keyword)) continue;
      seen.add(row.keyword);
      result.push(row.keyword);
    }

    return result.length > 0 ? result : DEFAULT_HOT_KEYWORDS;
  } catch (error) {
    console.error('[HotKeywords] Failed to fetch:', error);
    return DEFAULT_HOT_KEYWORDS;
  }
}
