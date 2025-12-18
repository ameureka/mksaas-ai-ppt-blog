/**
 * Embedding Trigger - 向量化触发
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 10.6
 */

import type { NormalizedItem } from './preflight.js';

export interface EmbeddingTriggerResult {
  triggered: string[];
  skipped: string[];
  failed: Array<{ id: string; error: string }>;
}

/**
 * 生成 embedding 输入文本
 * 与主项目 src/lib/embedding.ts 的 generateEmbeddingInput 保持一致
 */
export function generateEmbeddingInput(item: {
  title: string;
  description?: string | null;
  tags?: string[] | null;
}): string {
  return [
    item.title,
    item.description || '',
    (item.tags || []).join(' ')
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
}

/**
 * 生成触发 embedding 的 SQL
 * 将 embedding_status 设为 pending，由 Repair Cron 或 EmbeddingService 处理
 */
export function generateEmbeddingTriggerSql(ids: string[]): string {
  if (ids.length === 0) return '';
  
  const idList = ids.map(id => `'${id}'`).join(',');
  
  return `
UPDATE ppt
SET 
  embedding_status = 'pending',
  embedding_error = NULL,
  embedding_updated_at = NOW(),
  updated_at = NOW()
WHERE id IN (${idList})
  AND (embedding_status IS NULL OR embedding_status != 'success')
RETURNING id;
  `.trim();
}

/**
 * 批量触发 embedding 生成
 * 
 * 策略：
 * 1. 新插入的记录：embedding_status 已在 upsert 时设为 pending
 * 2. 更新的记录：如果 title/description/tags 变化，embedding_status 已重置为 pending
 * 3. 这里只是确保所有 pending 记录都会被处理
 */
export async function triggerEmbeddings(
  items: NormalizedItem[],
  options: { dryRun: boolean },
  executor?: (sql: string) => Promise<string[]>
): Promise<EmbeddingTriggerResult> {
  const result: EmbeddingTriggerResult = {
    triggered: [],
    skipped: [],
    failed: [],
  };

  if (options.dryRun) {
    // Dry run: 模拟全部触发
    for (const item of items) {
      result.triggered.push(item.id);
    }
    return result;
  }

  if (!executor) {
    // 无执行器，跳过
    for (const item of items) {
      result.skipped.push(item.id);
    }
    return result;
  }

  const ids = items.map(item => item.id);
  const sql = generateEmbeddingTriggerSql(ids);

  try {
    const triggeredIds = await executor(sql);
    result.triggered = triggeredIds;
    
    // 未触发的视为已有 success 状态，跳过
    const triggeredSet = new Set(triggeredIds);
    for (const id of ids) {
      if (!triggeredSet.has(id)) {
        result.skipped.push(id);
      }
    }
  } catch (err) {
    for (const id of ids) {
      result.failed.push({
        id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
}

/**
 * 生成调用 Repair Cron 的说明
 */
export function getRepairCronInstructions(): string {
  return `
📋 Embedding 生成说明:
   
   导入完成后，embedding 状态为 'pending'。
   有两种方式生成向量：

   1. 自动方式 - Repair Cron (推荐)
      调用: GET /api/cron/repair-embeddings?limit=50
      Header: Authorization: Bearer \${CRON_SECRET}
      
   2. 手动方式 - 运行脚本
      cd /path/to/ppthub
      pnpm tsx scripts/generate-embeddings.ts

   向量生成后，embedding_status 会更新为 'success'。
  `.trim();
}
