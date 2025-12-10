import { getDb } from '@/db';
import { ppt } from '@/db/schema';
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limitRaw = Number(searchParams.get('limit') || 8);
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(50, limitRaw))
    : 8;

  try {
    const db = await getDb();
    const results = await db
      .select({
        id: ppt.id,
        title: ppt.title,
        category: ppt.category,
        tags: ppt.tags,
        language: ppt.language,
        thumbnailUrl: ppt.thumbnailUrl,
        coverImageUrl: ppt.coverImageUrl,
        downloadCount: ppt.downloadCount,
        viewCount: ppt.viewCount,
        slidesCount: ppt.slidesCount,
      })
      .from(ppt)
      .where(
        and(eq(ppt.status, 'published'), isNull(ppt.deletedAt))
      )
      .orderBy(
        desc(ppt.downloadCount),
        desc(ppt.viewCount),
        desc(ppt.id)
      )
      .limit(limit);

    return Response.json({
      success: true,
      data: { items: results, total: results.length },
    });
  } catch (error) {
    console.error('[API] Failed to get featured PPTs:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch featured PPTs' },
      { status: 500 }
    );
  }
}
