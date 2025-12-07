'use server';

import { getDb } from '@/db';
import { ppt as pptTable } from '@/db/schema';
import { desc, isNull } from 'drizzle-orm';

/**
 * 获取热门推荐 PPT
 */
export async function getHotPPTs(limit = 15) {
  const db = await getDb();

  return db
    .select({
      id: pptTable.id,
      title: pptTable.title,
      description: pptTable.description,
      author: pptTable.author,
      category: pptTable.category,
      tags: pptTable.tags,
      fileUrl: pptTable.fileUrl,
      thumbnailUrl: pptTable.thumbnailUrl,
      downloadCount: pptTable.downloadCount,
      viewCount: pptTable.viewCount,
      createdAt: pptTable.createdAt,
    })
    .from(pptTable)
    .where(isNull(pptTable.deletedAt))
    .orderBy(desc(pptTable.downloadCount))
    .limit(limit);
}
