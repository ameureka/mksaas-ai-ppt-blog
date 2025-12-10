import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { getDb } from '../src/db/index.js';
import { ppt as pptTable } from '../src/db/schema.js';
import { count, eq, isNull, sql } from 'drizzle-orm';

const EXPECTED_CATEGORIES = [
  { value: 'business', label: '商务汇报' },
  { value: 'education', label: '教育培训' },
  { value: 'technology', label: '科技互联网' },
  { value: 'design', label: '设计创意' },
  { value: 'marketing', label: '产品营销' },
  { value: 'hr', label: '人力资源' },
  { value: 'medical', label: '医疗健康' },
  { value: 'finance', label: '金融财务' },
  { value: 'general', label: '通用模板' },
  { value: 'summary', label: '年终总结' },
  { value: 'report', label: '述职报告' },
  { value: 'plan', label: '工作计划' },
];

async function checkCategories() {
  const db = getDb();

  // 查询每个分类的统计
  const results = await db.execute(sql`
    SELECT 
      category,
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
      COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active
    FROM ppt
    GROUP BY category
    ORDER BY category
  `);

  const categoryMap = new Map(
    (results as any[]).map((r: any) => [r.category, r])
  );

  console.log('\n📊 分类数据统计:\n');
  console.log(
    '分类'.padEnd(20) + '总数'.padEnd(10) + '已发布'.padEnd(10) + '活跃'
  );
  console.log('─'.repeat(50));

  let emptyCategories: string[] = [];

  for (const cat of EXPECTED_CATEGORIES) {
    const stats = categoryMap.get(cat.value);
    const total = stats?.total || 0;
    const published = stats?.published || 0;
    const active = stats?.active || 0;

    const status = total === 0 ? '❌' : '✅';
    console.log(
      `${status} ${cat.label.padEnd(15)} ${String(total).padEnd(10)} ${String(published).padEnd(10)} ${active}`
    );

    if (total === 0) {
      emptyCategories.push(cat.label);
    }
  }

  console.log('─'.repeat(50));

  if (emptyCategories.length > 0) {
    console.log(
      `\n⚠️  发现 ${emptyCategories.length} 个空分类: ${emptyCategories.join(', ')}`
    );
    console.log('\n💡 运行 pnpm seed-all 添加测试数据\n');
  } else {
    console.log('\n✅ 所有分类都有数据！\n');
  }

  process.exit(0);
}

checkCategories().catch((err) => {
  console.error('❌ 检查失败:', err);
  process.exit(1);
});
