import { getDb } from '@/db';
import { ppt as pptTable } from '@/db/schema';
import { generateAndPersist } from '@/lib/embedding-service';
import { and, asc, eq, isNull, not, or, sql } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  // 验证 Vercel Cron 请求
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, limitParam ? Number(limitParam) : DEFAULT_LIMIT)
  );

  try {
    const db = await getDb();
    const candidates = await db
      .select({
        id: pptTable.id,
        title: pptTable.title,
        description: pptTable.description,
        tags: pptTable.tags,
        embeddingStatus: pptTable.embeddingStatus,
        embeddingUpdatedAt: pptTable.embeddingUpdatedAt,
      })
      .from(pptTable)
      .where(
        and(
          eq(pptTable.status, 'published'),
          isNull(pptTable.deletedAt),
          or(
            sql`${pptTable.embedding} IS NULL`,
            not(eq(pptTable.embeddingStatus, 'success'))
          )
        )
      )
      .orderBy(asc(pptTable.embeddingUpdatedAt), asc(pptTable.createdAt))
      .limit(limit);

    let success = 0;
    let failed = 0;

    for (const ppt of candidates) {
      const result = await generateAndPersist(ppt.id, {
        title: ppt.title,
        description: ppt.description,
        tags: ppt.tags,
      });
      if (result.ok) {
        success++;
      } else {
        failed++;
      }
      // 简单限流，避免 embeddings API 触发速率限制
      await sleep(1000);
    }

    return Response.json({
      success: true,
      data: {
        processed: candidates.length,
        success,
        failed,
      },
    });
  } catch (error) {
    console.error('[Cron] Repair embeddings failed:', error);
    return Response.json({ error: 'Repair failed' }, { status: 500 });
  }
}

