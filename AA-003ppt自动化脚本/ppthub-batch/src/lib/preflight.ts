/**
 * Preflight Validator - 导入前校验
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.1, 5.2, 7.1, 7.2, 10.4, 13.1
 */

import type { PpthubInitItem } from './types.js';
import { VALID_CATEGORIES, VALID_LANGUAGES, LANGUAGE_MAP, type CategorySlug, type LanguageValue } from './types.js';
import { isShortPublicUrl, validateUrlConsistency } from './url-validator.js';

export interface PreflightResult {
  validItems: NormalizedItem[];
  invalidItems: Array<{ item: PpthubInitItem; errors: string[] }>;
}

export interface NormalizedItem extends PpthubInitItem {
  // 归一化后的字段
  language: LanguageValue;
  category: CategorySlug;
  author: string;
  status: 'published';
}

/**
 * 执行 Preflight 校验
 */
export function preflight(
  items: PpthubInitItem[],
  options: { storagePublicUrl?: string } = {}
): PreflightResult {
  const validItems: NormalizedItem[] = [];
  const invalidItems: Array<{ item: PpthubInitItem; errors: string[] }> = [];
  const seenKeys = new Map<string, { item: PpthubInitItem; index: number }>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const errors: string[] = [];

    // 3.1 必填校验: title
    if (!item.title?.trim()) {
      errors.push('missing_required_field: title');
    }

    // 3.2 必填校验: file_url
    if (!item.file_url?.trim()) {
      errors.push('missing_required_field: file_url');
    }

    // 必填校验: thumbnail_url
    if (!item.thumbnail_url?.trim()) {
      errors.push('missing_required_field: thumbnail_url');
    }

    // 必填校验: category
    if (!item.category?.trim()) {
      errors.push('missing_required_field: category');
    }

    // 4.1, 4.2 分类校验
    if (item.category && !VALID_CATEGORIES.includes(item.category as CategorySlug)) {
      errors.push(`invalid_category: ${item.category}`);
    }

    // 5.1, 5.2 语言校验与映射
    let normalizedLanguage: LanguageValue = '其他';
    if (item.language) {
      const mapped = LANGUAGE_MAP[item.language];
      if (mapped) {
        normalizedLanguage = mapped;
      } else if (!VALID_LANGUAGES.includes(item.language as LanguageValue)) {
        errors.push(`invalid_language: ${item.language}`);
      } else {
        normalizedLanguage = item.language as LanguageValue;
      }
    }

    // 7.1, 7.2 URL 校验（短公共 URL，无签名参数）
    if (item.file_url) {
      const fileUrlCheck = isShortPublicUrl(item.file_url);
      if (!fileUrlCheck.valid) {
        errors.push(`invalid_url: file_url - ${fileUrlCheck.reason}`);
      }
      // 可选：检查 URL 前缀
      if (options.storagePublicUrl && !item.file_url.startsWith(options.storagePublicUrl)) {
        errors.push(`invalid_url: file_url must start with ${options.storagePublicUrl}`);
      }
    }

    if (item.thumbnail_url) {
      const thumbUrlCheck = isShortPublicUrl(item.thumbnail_url);
      if (!thumbUrlCheck.valid) {
        errors.push(`invalid_url: thumbnail_url - ${thumbUrlCheck.reason}`);
      }
      if (options.storagePublicUrl && !item.thumbnail_url.startsWith(options.storagePublicUrl)) {
        errors.push(`invalid_url: thumbnail_url must start with ${options.storagePublicUrl}`);
      }
    }

    // 7.3 URL 一致性校验 (file_url 和 thumbnail_url 的 category/aid 应一致)
    if (item.file_url && item.thumbnail_url) {
      const consistency = validateUrlConsistency(item.file_url, item.thumbnail_url);
      if (!consistency.valid) {
        errors.push(`url_consistency: ${consistency.reason}`);
      }
    }

    // 3.3 status 强制为 published
    if (item.status && item.status !== 'published') {
      errors.push(`invalid_status: must be 'published', got '${item.status}'`);
    }

    // 自然键去重 (file_url)
    const naturalKey = item.file_url;
    if (naturalKey) {
      const existing = seenKeys.get(naturalKey);
      if (existing) {
        // 保留最新的 (按 updated_at 或后出现的)
        const existingTime = existing.item.updated_at ? new Date(existing.item.updated_at).getTime() : 0;
        const currentTime = item.updated_at ? new Date(item.updated_at).getTime() : 0;
        if (currentTime >= existingTime) {
          // 当前更新，移除旧的
          const oldIndex = validItems.findIndex(v => v.file_url === naturalKey);
          if (oldIndex >= 0) {
            validItems.splice(oldIndex, 1);
          }
          seenKeys.set(naturalKey, { item, index: i });
        } else {
          // 跳过当前
          errors.push(`duplicate_natural_key: ${naturalKey}`);
        }
      } else {
        seenKeys.set(naturalKey, { item, index: i });
      }
    }

    if (errors.length > 0) {
      invalidItems.push({ item, errors });
    } else {
      // 归一化
      const normalized: NormalizedItem = {
        ...item,
        language: normalizedLanguage,
        category: item.category as CategorySlug,
        author: item.author || 'PPTHub',
        status: 'published',
      };
      validItems.push(normalized);
    }
  }

  return { validItems, invalidItems };
}

/**
 * 检查 URL 是否可访问 (可选)
 */
export async function checkUrlAccessible(url: string, timeout = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}
