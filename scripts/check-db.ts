import { getDb } from '../src/db';
import { ppt } from '../src/db/schema';

async function check() {
  const db = await getDb();
  const results = await db
    .select({
      id: ppt.id,
      title: ppt.title,
      thumbnail_url: ppt.thumbnailUrl,
      cover_image_url: ppt.coverImageUrl,
      file_url: ppt.fileUrl,
      category: ppt.category,
      language: ppt.language,
      tags: ppt.tags,
    })
    .from(ppt)
    .limit(5);

  console.log('=== 数据库样本数据 ===');
  console.log(JSON.stringify(results, null, 2));

  // 检查图片链接
  console.log('\n=== 图片链接检查 ===');
  for (const r of results) {
    const imgUrl = r.thumbnail_url || r.cover_image_url;
    console.log(`${r.title}: ${imgUrl || '无图片'}`);
  }

  process.exit(0);
}

check().catch((e) => {
  console.error(e);
  process.exit(1);
});
