import { count, sql } from 'drizzle-orm';
import { getDb } from '../src/db';
import { ppt } from '../src/db/schema';

async function check() {
  const db = await getDb();

  // 1. 总数统计
  const totalResult = await db.select({ count: count() }).from(ppt);
  console.log(`\n=== 数据总量: ${totalResult[0].count} 条 ===\n`);

  // 2. 图片字段统计
  const withThumbnail = await db
    .select({ count: count() })
    .from(ppt)
    .where(sql`thumbnail_url IS NOT NULL AND thumbnail_url != ''`);
  const withCover = await db
    .select({ count: count() })
    .from(ppt)
    .where(sql`cover_image_url IS NOT NULL AND cover_image_url != ''`);
  const withAnyImage = await db
    .select({ count: count() })
    .from(ppt)
    .where(
      sql`(thumbnail_url IS NOT NULL AND thumbnail_url != '') OR (cover_image_url IS NOT NULL AND cover_image_url != '')`
    );

  console.log('=== 图片字段统计 ===');
  console.log(`有 thumbnail_url: ${withThumbnail[0].count}`);
  console.log(`有 cover_image_url: ${withCover[0].count}`);
  console.log(`有任意图片: ${withAnyImage[0].count}`);
  console.log(`无图片: ${totalResult[0].count - withAnyImage[0].count}`);

  // 3. 文件链接检查
  const withFileUrl = await db
    .select({ count: count() })
    .from(ppt)
    .where(sql`file_url IS NOT NULL AND file_url != ''`);
  console.log('\n=== 文件链接统计 ===');
  console.log(`有 file_url: ${withFileUrl[0].count}`);

  // 4. 分类分布
  const categories = await db
    .select({
      category: ppt.category,
      count: count(),
    })
    .from(ppt)
    .groupBy(ppt.category);
  console.log('\n=== 分类分布 ===');
  categories.forEach((c) => console.log(`${c.category || 'null'}: ${c.count}`));

  // 5. 语言分布
  const languages = await db
    .select({
      language: ppt.language,
      count: count(),
    })
    .from(ppt)
    .groupBy(ppt.language);
  console.log('\n=== 语言分布 ===');
  languages.forEach((l) => console.log(`${l.language || 'null'}: ${l.count}`));

  // 6. 检查一个文件链接是否可访问
  const sample = await db.select({ file_url: ppt.fileUrl }).from(ppt).limit(1);
  if (sample[0]?.file_url) {
    console.log('\n=== 文件链接样本 ===');
    console.log(sample[0].file_url);
  }

  process.exit(0);
}

check().catch((e) => {
  console.error(e);
  process.exit(1);
});
