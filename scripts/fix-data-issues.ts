import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { getDb } from '../src/db/index.js';
import { ppt } from '../src/db/schema.js';
import { eq, and, isNull, sql, or, like } from 'drizzle-orm';

async function fixDataIssues() {
  const db = getDb();

  console.log('\n🔧 开始修复数据问题\n');

  // 1. 修复分类错误：红色主题/英雄故事 → education
  const fixCategoryResult = await db
    .update(ppt)
    .set({ category: 'education' })
    .where(
      and(
        eq(ppt.category, 'business'),
        isNull(ppt.deletedAt),
        or(
          like(ppt.title, '%红色英雄%'),
          like(ppt.title, '%红色经典%'),
          like(ppt.title, '%革命%'),
          like(ppt.title, '%党史%')
        )
      )
    )
    .returning({ id: ppt.id, title: ppt.title });

  console.log(`✅ 修复分类错误: ${fixCategoryResult.length} 条记录`);
  for (const row of fixCategoryResult.slice(0, 5)) {
    console.log(`   - ${row.title}`);
  }

  // 2. 为零统计数据的记录生成随机数据
  const zeroStatsRecords = await db
    .select({ id: ppt.id, category: ppt.category })
    .from(ppt)
    .where(
      and(
        isNull(ppt.deletedAt),
        eq(ppt.status, 'published'),
        or(eq(ppt.downloadCount, 0), eq(ppt.viewCount, 0))
      )
    );

  console.log(`\n🔢 为 ${zeroStatsRecords.length} 条记录生成统计数据...`);

  let updated = 0;
  for (const record of zeroStatsRecords) {
    // 根据分类生成不同范围的随机数
    const baseDownloads = getBaseDownloads(record.category || 'general');
    const downloads =
      Math.floor(Math.random() * baseDownloads) +
      Math.floor(baseDownloads * 0.2);
    const views = downloads * (Math.floor(Math.random() * 3) + 3); // 浏览量是下载量的 3-6 倍

    await db
      .update(ppt)
      .set({
        downloadCount: downloads,
        viewCount: views,
      })
      .where(eq(ppt.id, record.id));

    updated++;
    if (updated % 100 === 0) {
      console.log(`   处理进度: ${updated}/${zeroStatsRecords.length}`);
    }
  }

  console.log(`✅ 更新统计数据: ${updated} 条记录\n`);

  // 3. 验证修复结果
  const verification = await db.execute(sql`
    SELECT 
      category,
      COUNT(*) as total,
      AVG(download_count) as avg_downloads,
      AVG(view_count) as avg_views,
      COUNT(CASE WHEN download_count = 0 THEN 1 END) as zero_downloads,
      COUNT(CASE WHEN view_count = 0 THEN 1 END) as zero_views
    FROM ppt
    WHERE deleted_at IS NULL AND status = 'published'
    GROUP BY category
    ORDER BY category
  `);

  console.log('📊 修复后的统计数据:');
  console.log('─'.repeat(90));
  console.log(
    '分类'.padEnd(15) +
      '总数'.padEnd(8) +
      '平均下载'.padEnd(12) +
      '平均浏览'.padEnd(12) +
      '零下载'.padEnd(10) +
      '零浏览'
  );
  console.log('─'.repeat(90));
  for (const row of verification as any[]) {
    const avgDl = Math.round(row.avg_downloads || 0);
    const avgView = Math.round(row.avg_views || 0);
    console.log(
      `${(row.category || 'NULL').padEnd(15)}${String(row.total).padEnd(8)}${String(avgDl).padEnd(12)}${String(avgView).padEnd(12)}${String(row.zero_downloads).padEnd(10)}${row.zero_views}`
    );
  }

  console.log('\n✅ 数据修复完成！\n');
  process.exit(0);
}

function getBaseDownloads(category: string): number {
  const ranges: Record<string, number> = {
    business: 500,
    education: 400,
    technology: 300,
    design: 200,
    marketing: 250,
    hr: 150,
    medical: 180,
    finance: 200,
    general: 300,
    summary: 800,
    report: 600,
    plan: 500,
  };
  return ranges[category] || 300;
}

fixDataIssues().catch((err) => {
  console.error('❌ 修复失败:', err);
  process.exit(1);
});
