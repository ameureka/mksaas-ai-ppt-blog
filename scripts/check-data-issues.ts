import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { getDb } from '../src/db/index.js';
import { sql } from 'drizzle-orm';

async function checkDataIssues() {
  const db = getDb();

  console.log('\n📊 数据质量检查\n');

  // 1. 检查下载/浏览量为 0 的记录
  const zeroStats = await db.execute(sql`
    SELECT 
      id, title, category,
      download_count, view_count,
      created_at
    FROM ppt
    WHERE (download_count = 0 OR view_count = 0)
      AND deleted_at IS NULL
      AND status = 'published'
    ORDER BY created_at DESC
    LIMIT 10
  `);

  console.log('⚠️  下载/浏览量为 0 的记录 (前10条):');
  console.log('─'.repeat(80));
  for (const row of zeroStats as any[]) {
    console.log(
      `${row.title.slice(0, 30).padEnd(32)} | ${row.category?.padEnd(12)} | ↓${row.download_count} 👁${row.view_count}`
    );
  }

  // 2. 检查可能的分类错误
  const suspiciousCategories = await db.execute(sql`
    SELECT 
      id, title, category, tags
    FROM ppt
    WHERE deleted_at IS NULL
      AND status = 'published'
      AND (
        (title LIKE '%教育%' AND category != 'education')
        OR (title LIKE '%红色%' AND category = 'business')
        OR (title LIKE '%英雄%' AND category = 'business')
        OR (title LIKE '%党%' AND category = 'business')
      )
    LIMIT 10
  `);

  console.log('\n⚠️  可能的分类错误:');
  console.log('─'.repeat(80));
  for (const row of suspiciousCategories as any[]) {
    console.log(
      `${row.title.slice(0, 40).padEnd(42)} | 当前: ${row.category?.padEnd(12)} | 标签: ${row.tags?.join(', ')}`
    );
  }

  // 3. 统计各分类的平均下载/浏览量
  const categoryStats = await db.execute(sql`
    SELECT 
      category,
      COUNT(*) as total,
      AVG(download_count) as avg_downloads,
      AVG(view_count) as avg_views,
      COUNT(CASE WHEN download_count = 0 THEN 1 END) as zero_downloads
    FROM ppt
    WHERE deleted_at IS NULL AND status = 'published'
    GROUP BY category
    ORDER BY category
  `);

  console.log('\n📈 各分类统计数据:');
  console.log('─'.repeat(80));
  console.log(
    '分类'.padEnd(15) +
      '总数'.padEnd(8) +
      '平均下载'.padEnd(12) +
      '平均浏览'.padEnd(12) +
      '零下载数'
  );
  console.log('─'.repeat(80));
  for (const row of categoryStats as any[]) {
    const avgDl = Math.round(row.avg_downloads || 0);
    const avgView = Math.round(row.avg_views || 0);
    console.log(
      `${(row.category || 'NULL').padEnd(15)}${String(row.total).padEnd(8)}${String(avgDl).padEnd(12)}${String(avgView).padEnd(12)}${row.zero_downloads}`
    );
  }

  process.exit(0);
}

checkDataIssues().catch((err) => {
  console.error('❌ 检查失败:', err);
  process.exit(1);
});
