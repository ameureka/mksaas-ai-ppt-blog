import { config } from 'dotenv';
config({ path: '.env.local' });

import { sql } from 'drizzle-orm';
import { getDb } from '../src/db';
import { ppt } from '../src/db/schema';

async function checkCategories() {
  const db = await getDb();

  // 查询所有不同的 category 值及其数量
  const categories = await db
    .select({
      category: ppt.category,
      count: sql<number>`count(*)::int`,
    })
    .from(ppt)
    .groupBy(ppt.category)
    .orderBy(sql`count(*) desc`);

  console.log('=== 数据库中的 PPT 分类统计 ===\n');
  console.log('分类值\t\t\t数量');
  console.log('─'.repeat(40));

  let total = 0;
  for (const row of categories) {
    const cat = row.category || '(null)';
    const padded = cat.padEnd(20);
    console.log(`${padded}\t${row.count}`);
    total += row.count;
  }

  console.log('─'.repeat(40));
  console.log(`总计: ${categories.length} 个分类, ${total} 条记录`);

  // 查询一些样本数据
  console.log('\n=== 各分类样本数据 ===\n');
  for (const row of categories.slice(0, 5)) {
    if (!row.category) continue;
    const samples = await db
      .select({ id: ppt.id, title: ppt.title })
      .from(ppt)
      .where(sql`${ppt.category} = ${row.category}`)
      .limit(2);

    console.log(`[${row.category}]`);
    for (const s of samples) {
      console.log(`  - ${s.title}`);
    }
    console.log('');
  }

  process.exit(0);
}

checkCategories().catch((e) => {
  console.error('查询失败:', e);
  process.exit(1);
});
