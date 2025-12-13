'use server';

import { getDb } from '@/db';
import { ppt as pptTable, searchLog } from '@/db/schema';
import { generateEmbedding } from '@/lib/embedding';
import { and, desc, ilike, isNull, or, sql, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const DEFAULT_SIMILARITY_THRESHOLD = 0.3;

function getSimilarityThreshold(): number {
  const raw = process.env.VECTOR_SIMILARITY_THRESHOLD;
  const parsed = raw ? Number.parseFloat(raw) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return DEFAULT_SIMILARITY_THRESHOLD;
  }
  return parsed;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  category: string | null;
  tags: string[] | null;
  fileUrl: string;
  thumbnailUrl: string | null;
  downloadCount: number | null;
  viewCount: number | null;
  createdAt: Date | null;
  similarity?: number;
}

/**
 * 向量搜索
 */
export async function vectorSearch(
  query: string,
  limit = 20
): Promise<SearchResult[]> {
  const queryEmbedding = await generateEmbedding(query);
  if (!queryEmbedding) return [];

  const db = await getDb();
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  const results = await db.execute(sql`
    SELECT 
      id, title, description, author, category, tags,
      file_url as "fileUrl", thumbnail_url as "thumbnailUrl",
      download_count as "downloadCount", view_count as "viewCount",
      created_at as "createdAt",
      1 - (embedding <=> ${embeddingStr}::vector) as similarity
    FROM ppt
    WHERE deleted_at IS NULL AND status = 'published' AND embedding IS NOT NULL
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `);

  return results as unknown as SearchResult[];
}

/**
 * SQL 降级搜索
 */
export async function sqlSearch(
  query: string,
  limit = 20
): Promise<SearchResult[]> {
  const db = await getDb();
  const keyword = `%${query.trim()}%`;

  const results = await db
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
    .where(
      and(
        eq(pptTable.status, 'published'),
        isNull(pptTable.deletedAt),
        or(
          ilike(pptTable.title, keyword),
          ilike(pptTable.description, keyword),
          ilike(pptTable.author, keyword),
          sql`coalesce(array_to_string(${pptTable.tags}, ','), '') ILIKE ${keyword}`
        )
      )
    )
    .orderBy(desc(pptTable.downloadCount))
    .limit(limit);

  return Array.isArray(results) ? results : [];
}

/**
 * 混合搜索 (向量优先，SQL 降级)
 */
export async function hybridSearch(
  query: string,
  limit = 20
): Promise<{
  results: SearchResult[];
  searchType: 'vector' | 'sql' | 'hybrid';
}> {
  try {
    // 1. 尝试向量搜索
    const vectorResults = await vectorSearch(query, limit);
    const similarityThreshold = getSimilarityThreshold();
    const filteredVectorResults = vectorResults.filter(
      (r) => (r.similarity ?? 0) >= similarityThreshold
    );

    // 2. 向量搜索成功且结果充足（按 similarity 阈值过滤后）
    const sufficientVectorCount = Math.min(5, limit);
    if (filteredVectorResults.length >= sufficientVectorCount) {
      return {
        results: filteredVectorResults.slice(0, limit),
        searchType: 'vector',
      };
    }

    // 3. 向量搜索结果不足，SQL 补充
    if (filteredVectorResults.length > 0) {
      const existingIds = new Set(filteredVectorResults.map((r) => r.id));
      const remaining = limit - filteredVectorResults.length;
      const sqlResults =
        remaining > 0 ? await sqlSearch(query, remaining) : [];
      const additional = sqlResults.filter((r) => !existingIds.has(r.id));
      return {
        results: [...filteredVectorResults, ...additional].slice(0, limit),
        searchType: 'hybrid',
      };
    }

    // 4. 向量搜索完全失败或阈值过滤后无结果，降级到 SQL
    const sqlResults = await sqlSearch(query, limit);
    return { results: sqlResults, searchType: 'sql' };
  } catch (error) {
    const sqlResults = await sqlSearch(query, limit);
    return { results: sqlResults, searchType: 'sql' };
  }
}

export async function recordSearchLog(params: {
  keyword: string;
  resultCount: number;
  searchType: 'vector' | 'sql' | 'hybrid';
  durationMs?: number;
  ipAddress?: string | null;
  userAgent?: string | null;
  source?: string;
}) {
  try {
    const db = await getDb();
    await db.insert(searchLog).values({
      id: randomUUID(),
      keyword: params.keyword,
      resultCount: params.resultCount ?? 0,
      searchType: params.searchType,
      durationMs: params.durationMs ?? null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      source: params.source ?? 'search',
    });
  } catch (error) {
    console.error('[search] failed to record search log', error);
  }
}
