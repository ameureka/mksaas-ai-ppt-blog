import { sql } from 'drizzle-orm';
import { getDb } from '../src/db';
import { ppt } from '../src/db/schema';

async function check() {
  const db = await getDb();

  // 获取有图片的记录
  const withImages = await db
    .select({
      id: ppt.id,
      title: ppt.title,
      thumbnail_url: ppt.thumbnailUrl,
      cover_image_url: ppt.coverImageUrl,
    })
    .from(ppt)
    .where(
      sql`(thumbnail_url IS NOT NULL AND thumbnail_url != '') OR (cover_image_url IS NOT NULL AND cover_image_url != '')`
    );

  console.log(`\n=== 有图片的记录 (${withImages.length}条) ===\n`);

  for (const r of withImages) {
    console.log(`ID: ${r.id}`);
    console.log(`  Title: ${r.title}`);
    console.log(`  Thumbnail: ${r.thumbnail_url || '无'}`);
    console.log(`  Cover: ${r.cover_image_url || '无'}`);
    console.log('');
  }

  process.exit(0);
}

check().catch((e) => {
  console.error(e);
  process.exit(1);
});
