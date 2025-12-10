import { getDb } from '@/db';
import { ppt } from '@/db/schema';
import { PPT_CATEGORY_VALUES } from '@/lib/constants/ppt';
import { and, eq, isNull, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const db = await getDb();
    const counts = await db
      .select({
        category: ppt.category,
        count: sql<number>`count(*)::int`,
      })
      .from(ppt)
      .where(and(eq(ppt.status, 'published'), isNull(ppt.deletedAt)))
      .groupBy(ppt.category);

    const stats = Object.fromEntries(
      PPT_CATEGORY_VALUES.map((cat) => [cat, 0])
    );

    for (const { category, count } of counts) {
      if (category) stats[category] = count;
    }

    return Response.json(
      { success: true, data: stats },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[API] Failed to get category stats:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
