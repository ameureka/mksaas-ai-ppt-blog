'use server';

import { randomUUID } from 'crypto';
import { getDb } from '@/db';
import { searchLog } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface SearchLogInput {
  keyword: string;
  userId?: string;
  resultCount: number;
  source?: 'search' | 'hot_keyword' | 'suggestion';
  fromSuggestion?: boolean;
  searchType: 'vector' | 'sql' | 'hybrid';
  durationMs: number;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * 记录搜索日志
 */
export async function logSearch(input: SearchLogInput): Promise<string> {
  const id = `sl_${randomUUID()}`;

  try {
    const db = await getDb();
    await db.insert(searchLog).values({
      id,
      keyword: input.keyword,
      userId: input.userId,
      resultCount: input.resultCount,
      source: input.source || 'search',
      fromSuggestion: input.fromSuggestion || false,
      searchType: input.searchType,
      durationMs: input.durationMs,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('[SearchLog] Failed to log:', error);
  }

  return id;
}

/**
 * 记录搜索结果点击
 */
export async function logSearchClick(
  searchLogId: string,
  pptId: string
): Promise<void> {
  try {
    const db = await getDb();
    await db
      .update(searchLog)
      .set({ clickedPptId: pptId })
      .where(eq(searchLog.id, searchLogId));
  } catch (error) {
    console.error('[SearchLog] Failed to log click:', error);
  }
}
