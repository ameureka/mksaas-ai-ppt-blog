import { eq, sql } from 'drizzle-orm';
import { getDb } from '../src/db';
import { ppt } from '../src/db/schema';

async function initPPTStats() {
  console.log('开始初始化 PPT 统计数据...');

  const db = getDb();

  // 获取需要更新的记录
  const records = await db
    .select({
      id: ppt.id,
      downloadCount: ppt.downloadCount,
      viewCount: ppt.viewCount,
    })
    .from(ppt);

  let downloadUpdated = 0;
  let viewUpdated = 0;

  for (const record of records) {
    const updates: { downloadCount?: number; viewCount?: number } = {};

    if (!record.downloadCount || record.downloadCount === 0) {
      updates.downloadCount = Math.floor(Math.random() * 450 + 50);
      downloadUpdated++;
    }

    if (!record.viewCount || record.viewCount === 0) {
      updates.viewCount = Math.floor(Math.random() * 1900 + 100);
      viewUpdated++;
    }

    if (Object.keys(updates).length > 0) {
      await db.update(ppt).set(updates).where(eq(ppt.id, record.id));
    }
  }

  console.log(
    `✅ 更新完成: ${downloadUpdated} 条下载量, ${viewUpdated} 条浏览量`
  );

  // 验证结果
  const stats = await db
    .select({
      total: sql<number>`count(*)`,
      minDownloads: sql<number>`min(download_count)`,
      maxDownloads: sql<number>`max(download_count)`,
      avgDownloads: sql<number>`avg(download_count)::int`,
      minViews: sql<number>`min(view_count)`,
      maxViews: sql<number>`max(view_count)`,
      avgViews: sql<number>`avg(view_count)::int`,
    })
    .from(ppt);

  console.log('统计结果:', stats[0]);
  process.exit(0);
}

initPPTStats().catch((err) => {
  console.error('初始化失败:', err);
  process.exit(1);
});
