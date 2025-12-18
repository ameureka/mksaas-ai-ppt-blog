/**
 * Post Validation - 导入后校验
 * 
 * Requirements: 10.7
 */

import type { NormalizedItem } from './preflight.js';
import { VALID_CATEGORIES } from './types.js';

export interface PostCheckResult {
  categoryDistribution: Record<string, number>;
  languageDistribution: Record<string, number>;
  emptyFields: {
    description: number;
    tags: number;
    author: number;
  };
  embeddingCoverage: {
    pending: number;
    success: number;
    failed: number;
  };
  urlAccessibility: {
    checked: number;
    accessible: number;
    failed: string[];
  };
}

/**
 * 执行导入后校验 (基于导入的 items)
 */
export function postCheck(items: NormalizedItem[]): PostCheckResult {
  const result: PostCheckResult = {
    categoryDistribution: {},
    languageDistribution: {},
    emptyFields: {
      description: 0,
      tags: 0,
      author: 0,
    },
    embeddingCoverage: {
      pending: items.length, // 导入后全部为 pending
      success: 0,
      failed: 0,
    },
    urlAccessibility: {
      checked: 0,
      accessible: 0,
      failed: [],
    },
  };

  // 初始化分类分布
  for (const cat of VALID_CATEGORIES) {
    result.categoryDistribution[cat] = 0;
  }

  for (const item of items) {
    // 分类分布
    if (item.category in result.categoryDistribution) {
      result.categoryDistribution[item.category]++;
    }

    // 语言分布
    result.languageDistribution[item.language] = 
      (result.languageDistribution[item.language] || 0) + 1;

    // 空字段统计
    if (!item.description?.trim()) {
      result.emptyFields.description++;
    }
    if (!item.tags || item.tags.length === 0) {
      result.emptyFields.tags++;
    }
    if (!item.author || item.author === 'PPTHub') {
      result.emptyFields.author++;
    }
  }

  return result;
}

/**
 * 格式化 PostCheck 结果为可读字符串
 */
export function formatPostCheckResult(result: PostCheckResult, total: number): string {
  const lines: string[] = [];

  lines.push('📊 导入后校验报告');
  lines.push('==================');
  lines.push('');

  // 分类分布
  lines.push('📁 分类分布:');
  const sortedCategories = Object.entries(result.categoryDistribution)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
  
  for (const [cat, count] of sortedCategories) {
    const pct = ((count / total) * 100).toFixed(1);
    lines.push(`   ${cat}: ${count} (${pct}%)`);
  }
  lines.push('');

  // 语言分布
  lines.push('🌐 语言分布:');
  for (const [lang, count] of Object.entries(result.languageDistribution)) {
    const pct = ((count / total) * 100).toFixed(1);
    lines.push(`   ${lang}: ${count} (${pct}%)`);
  }
  lines.push('');

  // 空字段统计
  lines.push('⚠️  空字段统计:');
  lines.push(`   description 为空: ${result.emptyFields.description}`);
  lines.push(`   tags 为空: ${result.emptyFields.tags}`);
  lines.push(`   author 为默认值: ${result.emptyFields.author}`);
  lines.push('');

  // Embedding 覆盖率
  lines.push('🧠 Embedding 状态:');
  lines.push(`   pending: ${result.embeddingCoverage.pending}`);
  lines.push(`   success: ${result.embeddingCoverage.success}`);
  lines.push(`   failed: ${result.embeddingCoverage.failed}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * 检查 URL 可访问性 (可选，耗时操作)
 */
export async function checkUrlsAccessibility(
  items: NormalizedItem[],
  options: { maxConcurrent?: number; timeout?: number } = {}
): Promise<{ accessible: string[]; failed: string[] }> {
  const { maxConcurrent = 5, timeout = 5000 } = options;
  const accessible: string[] = [];
  const failed: string[] = [];

  // 简单的并发控制
  for (let i = 0; i < items.length; i += maxConcurrent) {
    const batch = items.slice(i, i + maxConcurrent);
    const results = await Promise.all(
      batch.map(async (item) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          const response = await fetch(item.file_url, {
            method: 'HEAD',
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          return { id: item.id, ok: response.ok };
        } catch {
          return { id: item.id, ok: false };
        }
      })
    );

    for (const { id, ok } of results) {
      if (ok) {
        accessible.push(id);
      } else {
        failed.push(id);
      }
    }
  }

  return { accessible, failed };
}
