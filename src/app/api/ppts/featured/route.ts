import { getDb } from '@/db';
import { ppt } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') || 8);

  try {
    const db = await getDb();
    const results = await db
      .select()
      .from(ppt)
      .where(eq(ppt.status, 'published'))
      .orderBy(sql`RANDOM()`)
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
