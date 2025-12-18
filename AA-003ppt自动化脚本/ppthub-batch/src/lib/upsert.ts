/**
 * Upsert Engine - 批量写库
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 10.5, 13.2
 */

import type { NormalizedItem } from './preflight.js';

export interface UpsertOptions {
  forceStats: boolean;
  dryRun: boolean;
}

export interface UpsertResult {
  inserted: string[];
  updated: string[];
  failed: Array<{ id: string; error: string }>;
}

/**
 * 将 NormalizedItem 转换为数据库记录格式 (camelCase)
 */
export function toDbRecord(item: NormalizedItem, forceStats: boolean) {
  const now = new Date();

  return {
    id: item.id,
    title: item.title,
    category: item.category,
    tags: item.tags,
    description: item.description || item.ai_content_summary || '',
    language: item.language,
    slidesCount: item.slides_count,
    fileUrl: item.file_url,
    thumbnailUrl: item.thumbnail_url,
    coverImageUrl: item.cover_image_url || item.thumbnail_url,
    fileSize: item.file_size,
    fileFormat: item.file_format || 'pptx',
    author: item.author,
    status: item.status,
    visibility: item.visibility || 'public',
    // 统计字段：forceStats=false 时不覆盖
    ...(forceStats
      ? {
          downloadCount: item.download_count ?? 0,
          viewCount: item.view_count ?? 0,
        }
      : {}),
    // 时间戳
    createdAt: item.created_at ? new Date(item.created_at) : now,
    updatedAt: now,
    // embedding 状态初始化
    embeddingStatus: 'pending',
    embeddingError: null,
    embeddingUpdatedAt: now,
    // 软删除
    deletedAt: null,
  };
}

/**
 * 生成 Upsert SQL (PostgreSQL)
 * 使用 file_url 作为自然键
 */
export function generateUpsertSql(
  items: NormalizedItem[],
  forceStats: boolean
): string {
  if (items.length === 0) return '';

  const records = items.map((item) => toDbRecord(item, forceStats));

  // 构建 VALUES
  const values = records
    .map((r) => {
      const tags = `ARRAY[${r.tags.map((t) => `'${escapeSql(t)}'`).join(',')}]::text[]`;
      return `(
      '${escapeSql(r.id)}',
      '${escapeSql(r.title)}',
      '${escapeSql(r.category)}',
      ${tags},
      '${escapeSql(r.description)}',
      '${escapeSql(r.language)}',
      ${r.slidesCount},
      '${escapeSql(r.fileUrl)}',
      '${escapeSql(r.thumbnailUrl)}',
      ${r.coverImageUrl ? `'${escapeSql(r.coverImageUrl)}'` : 'NULL'},
      ${r.fileSize ?? 'NULL'},
      '${escapeSql(r.fileFormat)}',
      '${escapeSql(r.author)}',
      '${escapeSql(r.status)}',
      '${escapeSql(r.visibility)}',
      '${r.embeddingStatus}',
      '${r.createdAt.toISOString()}',
      '${r.updatedAt.toISOString()}'
    )`;
    })
    .join(',\n');

  // ON CONFLICT 更新策略
  const updateSet = [
    'title = EXCLUDED.title',
    'category = EXCLUDED.category',
    'tags = EXCLUDED.tags',
    'description = EXCLUDED.description',
    'language = EXCLUDED.language',
    'slides_count = EXCLUDED.slides_count',
    'thumbnail_url = EXCLUDED.thumbnail_url',
    'cover_image_url = EXCLUDED.cover_image_url',
    'file_size = EXCLUDED.file_size',
    'file_format = EXCLUDED.file_format',
    'author = EXCLUDED.author',
    'status = EXCLUDED.status',
    'visibility = EXCLUDED.visibility',
    "embedding_status = CASE WHEN ppt.title != EXCLUDED.title OR ppt.description != EXCLUDED.description OR ppt.tags != EXCLUDED.tags THEN 'pending' ELSE ppt.embedding_status END",
    'embedding_updated_at = CASE WHEN ppt.title != EXCLUDED.title OR ppt.description != EXCLUDED.description OR ppt.tags != EXCLUDED.tags THEN NOW() ELSE ppt.embedding_updated_at END',
    'updated_at = NOW()',
    'deleted_at = NULL',
  ];

  // forceStats=false 时保留原统计
  if (!forceStats) {
    // 不更新 download_count 和 view_count
  } else {
    updateSet.push('download_count = EXCLUDED.download_count');
    updateSet.push('view_count = EXCLUDED.view_count');
  }

  return `
INSERT INTO ppt (
  id, title, category, tags, description, language, slides_count,
  file_url, thumbnail_url, cover_image_url, file_size, file_format,
  author, status, visibility, embedding_status, created_at, updated_at
)
VALUES ${values}
ON CONFLICT (id) DO UPDATE SET
  ${updateSet.join(',\n  ')}
RETURNING id, (xmax = 0) AS inserted;
  `.trim();
}

/**
 * 转义 SQL 字符串
 */
function escapeSql(str: string): string {
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

/**
 * 批量 Upsert (分批执行)
 */
export async function batchUpsert(
  items: NormalizedItem[],
  options: UpsertOptions,
  executor: (sql: string) => Promise<Array<{ id: string; inserted: boolean }>>
): Promise<UpsertResult> {
  const result: UpsertResult = {
    inserted: [],
    updated: [],
    failed: [],
  };

  if (options.dryRun) {
    // Dry run: 模拟全部成功
    for (const item of items) {
      result.inserted.push(item.id);
    }
    return result;
  }

  // 分批执行 (每批最多 100 条)
  const batchSize = 100;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const sql = generateUpsertSql(batch, options.forceStats);

    try {
      const rows = await executor(sql);
      for (const row of rows) {
        if (row.inserted) {
          result.inserted.push(row.id);
        } else {
          result.updated.push(row.id);
        }
      }
    } catch (err) {
      // 批次失败，记录所有项
      for (const item of batch) {
        result.failed.push({
          id: item.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  return result;
}
