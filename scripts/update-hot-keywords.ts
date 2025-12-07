/**
 * 更新热门关键词缓存
 * 运行: pnpm update-hot-keywords
 */
import { getDb } from '@/db';
import { hotKeywords, ppt as pptTable, searchLog } from '@/db/schema';
import { desc, gte, sql } from 'drizzle-orm';

interface KeywordStat {
  keyword: string;
  searchCount: number;
  downloadScore: number;
  finalScore: number;
}

export async function updateHotKeywords(): Promise<void> {
  const db = await getDb();
  console.log('[HotKeywords] Starting update...');

  // 1. 统计最近7天搜索词频率
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const searchStats = await db
    .select({
      keyword: searchLog.keyword,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(searchLog)
    .where(gte(searchLog.createdAt, sevenDaysAgo))
    .groupBy(searchLog.keyword)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(50);

  // 2. 统计下载量 Top PPT 的关键词 (从 tags 提取)
  const downloadStats = (await db.execute(sql`
    SELECT unnest(tags) as keyword, SUM(download_count)::int as score
    FROM ppt
    WHERE deleted_at IS NULL AND tags IS NOT NULL AND array_length(tags, 1) > 0
    GROUP BY unnest(tags)
    ORDER BY score DESC
    LIMIT 50
  `)) as unknown as { keyword: string; score: number }[];

  // 3. 合并计算 (搜索 60% + 下载 40%)
  const merged = mergeAndScore(
    searchStats as { keyword: string; count: number }[],
    Array.isArray(downloadStats) ? downloadStats : [],
    { searchWeight: 0.6, downloadWeight: 0.4 }
  );

  // 4. 取 Top 8 写入缓存表
  const top8 = merged.slice(0, 8);

  await db.delete(hotKeywords);

  if (top8.length > 0) {
    await db.insert(hotKeywords).values(
      top8.map((item, index) => ({
        id: `hot_${index + 1}`,
        keyword: item.keyword,
        searchCount: item.searchCount,
        downloadScore: String(item.downloadScore),
        finalScore: String(item.finalScore),
        rank: index + 1,
        updatedAt: new Date(),
      }))
    );
  }

  console.log(`[HotKeywords] Updated ${top8.length} keywords`);
}

function mergeAndScore(
  searchStats: { keyword: string; count: number }[],
  downloadStats: { keyword: string; score: number }[],
  weights: { searchWeight: number; downloadWeight: number }
): KeywordStat[] {
  const map = new Map<string, { searchCount: number; downloadScore: number }>();

  for (const s of searchStats) {
    map.set(s.keyword, { searchCount: s.count, downloadScore: 0 });
  }

  for (const d of downloadStats) {
    const existing = map.get(d.keyword) || { searchCount: 0, downloadScore: 0 };
    existing.downloadScore = d.score;
    map.set(d.keyword, existing);
  }

  const maxSearch = Math.max(
    ...Array.from(map.values()).map((v) => v.searchCount),
    1
  );
  const maxDownload = Math.max(
    ...Array.from(map.values()).map((v) => v.downloadScore),
    1
  );

  return Array.from(map.entries())
    .map(([keyword, data]) => ({
      keyword,
      searchCount: data.searchCount,
      downloadScore: data.downloadScore,
      finalScore:
        (data.searchCount / maxSearch) * weights.searchWeight +
        (data.downloadScore / maxDownload) * weights.downloadWeight,
    }))
    .sort((a, b) => b.finalScore - a.finalScore);
}

if (require.main === module) {
  updateHotKeywords()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('[HotKeywords] Failed:', error);
      process.exit(1);
    });
}
