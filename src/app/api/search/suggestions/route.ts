import { getDb } from '@/db';
import { hotKeywords, ppt as pptTable, searchLog } from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, desc, eq, ilike, isNull } from 'drizzle-orm';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

interface SuggestionItem {
  text: string;
  source: 'history' | 'hot' | 'title';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query || query.length < 1) {
    return Response.json({ suggestions: [] });
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const suggestions = await getSuggestions(query, userId);
  return Response.json({ suggestions });
}

async function getSuggestions(
  query: string,
  userId?: string
): Promise<SuggestionItem[]> {
  const db = await getDb();
  const results: {
    text: string;
    source: 'history' | 'hot' | 'title';
    priority: number;
  }[] = [];

  // 1. 用户搜索历史 (优先级 100)
  if (userId) {
    const history = await db
      .selectDistinct({ keyword: searchLog.keyword })
      .from(searchLog)
      .where(
        and(eq(searchLog.userId, userId), ilike(searchLog.keyword, `${query}%`))
      )
      .orderBy(desc(searchLog.createdAt))
      .limit(5);

    for (const h of history) {
      results.push({ text: h.keyword, source: 'history', priority: 100 });
    }
  }

  // 2. 热门关键词 (优先级 50)
  const hotWords = await db
    .select({ keyword: hotKeywords.keyword })
    .from(hotKeywords)
    .where(ilike(hotKeywords.keyword, `%${query}%`))
    .limit(3);

  for (const h of hotWords) {
    results.push({ text: h.keyword, source: 'hot', priority: 50 });
  }

  // 3. PPT 标题匹配 (优先级 10)
  const titles = await db
    .selectDistinct({ title: pptTable.title })
    .from(pptTable)
    .where(and(isNull(pptTable.deletedAt), ilike(pptTable.title, `%${query}%`)))
    .limit(5);

  for (const t of titles) {
    results.push({ text: t.title, source: 'title', priority: 10 });
  }

  // 去重 + 排序 + 取 Top 8
  const seen = new Set<string>();
  return results
    .filter((r) => {
      const lower = r.text.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 8)
    .map((r) => ({ text: r.text, source: r.source }));
}
