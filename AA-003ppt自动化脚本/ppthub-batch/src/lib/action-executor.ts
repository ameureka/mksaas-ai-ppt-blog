/**
 * Action Executor - 通过 createPPT action 写入
 *
 * Requirements: 13.3, 13.4
 */

import type { NormalizedItem } from './preflight.js';

export interface ActionExecutorResult {
  inserted: string[];
  updated: string[];
  failed: { id: string; error: string }[];
}

/**
 * 将 NormalizedItem 转换为 createPPT action 的输入格式
 */
export function toCreatePPTInput(
  item: NormalizedItem
): Record<string, unknown> {
  return {
    title: item.title,
    description: item.description,
    category: item.category,
    language: item.language,
    tags: item.tags,
    author: item.author,
    fileUrl: item.file_url,
    thumbnailUrl: item.thumbnail_url,
    previewUrl: (item as any).preview_url || item.thumbnail_url, // 映射 preview_url
    fileSize: item.file_size,
    slideCount: item.slides_count,
    status: item.status,
    // 可选字段
    ...(item.download_count !== undefined && {
      downloadCount: item.download_count,
    }),
    ...(item.view_count !== undefined && { viewCount: item.view_count }),
    ...((item as any).source_url && { sourceUrl: (item as any).source_url }),
    ...((item as any).source_batch_id && {
      sourceBatchId: (item as any).source_batch_id,
    }),
  };
}

/**
 * 批量通过 action 写入 (需要主项目提供 executor)
 */
export async function batchViaAction(
  items: NormalizedItem[],
  options: { dryRun?: boolean },
  executor: (
    input: Record<string, unknown>
  ) => Promise<{ success: boolean; id?: string; error?: string }>
): Promise<ActionExecutorResult> {
  const result: ActionExecutorResult = {
    inserted: [],
    updated: [],
    failed: [],
  };

  if (options.dryRun) {
    // Dry run 模式下模拟成功
    result.inserted = items.map((item) => item.id);
    return result;
  }

  for (const item of items) {
    try {
      const input = toCreatePPTInput(item);
      const response = await executor(input);

      if (response.success && response.id) {
        result.inserted.push(response.id);
      } else {
        result.failed.push({
          id: item.id,
          error: response.error || 'Unknown error',
        });
      }
    } catch (err) {
      result.failed.push({
        id: item.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
}

/**
 * 生成 action 调用示例代码
 */
export function generateActionExample(item: NormalizedItem): string {
  const input = toCreatePPTInput(item);
  return `
// 调用 createPPT action
import { createPPT } from '@/actions/ppt/ppt';

const result = await createPPT(${JSON.stringify(input, null, 2)});
`.trim();
}
