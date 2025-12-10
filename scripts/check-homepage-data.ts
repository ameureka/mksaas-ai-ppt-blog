import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { getDb } from '../src/db/index.js';
import { sql } from 'drizzle-orm';

async function checkHomepageData() {
  const db = getDb();

  // 1. 总体统计
  const stats = await db.execute(sql`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
      COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' AND deleted_at IS NULL THEN 1 END) as this_week
    FROM ppt
  `);

  console.log('\n📊 PPT 总体统计:');
  console.log(stats[0]);

  // 2. 本周新品 (最近7天)
  const thisWeek = await db.execute(sql`
    SELECT id, title, category, status, created_at::text
    FROM ppt
    WHERE deleted_at IS NULL 
      AND created_at >= NOW() - INTERVAL '7 days'
    ORDER BY created_at DESC
    LIMIT 10
  `);

  console.log('\n📅 本周新品 (最近7天创建):');
  if ((thisWeek as any[]).length === 0) {
    console.log('  ⚠️ 无本周数据');
  } else {
    (thisWeek as any[]).forEach((r: any, i: number) => {
      console.log(`  ${i + 1}. ${r.title} [${r.category}] - ${r.created_at}`);
    });
  }

  // 3. 当前"本周新品"实际返回的数据 (按 created_at DESC)
  const currentNew = await db.execute(sql`
    SELECT id, title, category, status, created_at::text
    FROM ppt
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 12
  `);

  console.log('\n📋 当前"本周新品"API 返回 (created_at DESC, 无时间限制):');
  (currentNew as any[]).forEach((r: any, i: number) => {
    console.log(`  ${i + 1}. ${r.title} [${r.category}] - ${r.created_at}`);
  });

  // 4. 编辑精选 (随机)
  const featured = await db.execute(sql`
    SELECT id, title, category, download_count, view_count
    FROM ppt
    WHERE status = 'published'
    ORDER BY RANDOM()
    LIMIT 8
  `);

  console.log('\n⭐ 编辑精选 (随机 published):');
  (featured as any[]).forEach((r: any, i: number) => {
    console.log(
      `  ${i + 1}. ${r.title} [${r.category}] - 下载:${r.download_count} 浏览:${r.view_count}`
    );
  });

  // 5. 检查编辑精选是否过滤了软删除
  const featuredWithDeleted = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM ppt
    WHERE status = 'published' AND deleted_at IS NOT NULL
  `);

  console.log(
    '\n⚠️ 已发布但已软删除的记录数:',
    (featuredWithDeleted as any[])[0]?.count || 0
  );

  process.exit(0);
}

checkHomepageData().catch((err) => {
  console.error('❌ 检查失败:', err);
  process.exit(1);
});
