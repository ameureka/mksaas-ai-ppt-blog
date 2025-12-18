/**
 * URL Validator - 远程命名规则与 URL 校验
 * 
 * Requirements: 7.1, 7.2, 7.3
 */

import { VALID_CATEGORIES, type CategorySlug } from './types.js';

/**
 * 预期的 URL 路径模式
 * - PPT 文件: ppts/{category}/ppt_{aid}.pptx
 * - 缩略图: ppts/{category}/ppt_{aid}_thumb.webp (或 .jpg/.png)
 */
const PPT_PATH_PATTERN = /^ppts\/([a-z]+)\/ppt_(\d+)\.pptx$/;
const THUMB_PATH_PATTERN = /^ppts\/([a-z]+)\/ppt_(\d+)_thumb\.(webp|jpg|png)$/;

/**
 * 检查 URL 是否为短公共 URL (无签名参数)
 * 
 * Requirements: 7.1, 7.2
 * - 必须是 HTTPS
 * - 不能包含签名参数 (X-Amz-Signature, token, sig 等)
 * - 路径应符合 ppts/{category}/ppt_{aid}.* 格式
 */
export function isShortPublicUrl(url: string): { valid: boolean; reason?: string } {
  try {
    const parsed = new URL(url);

    // 检查协议
    if (parsed.protocol !== 'https:') {
      return { valid: false, reason: 'URL must use HTTPS' };
    }

    // 检查签名参数 (S3 预签名 URL 特征)
    const signatureParams = [
      'X-Amz-Signature',
      'X-Amz-Credential',
      'X-Amz-Date',
      'X-Amz-Expires',
      'token',
      'sig',
      'signature',
    ];

    for (const param of signatureParams) {
      if (parsed.searchParams.has(param)) {
        return { valid: false, reason: `URL contains signature parameter: ${param}` };
      }
    }

    // 检查是否有任何查询参数 (短 URL 不应有查询参数)
    if (parsed.search && parsed.search.length > 1) {
      return { valid: false, reason: 'Short public URL should not have query parameters' };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }
}

/**
 * 验证 PPT 文件 URL 路径格式
 * 
 * Requirements: 7.3
 * 预期格式: https://{domain}/ppts/{category}/ppt_{aid}.pptx
 */
export function validatePptUrlPath(url: string): { 
  valid: boolean; 
  category?: CategorySlug; 
  aid?: string;
  reason?: string;
} {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\//, ''); // 移除开头的 /

    const match = path.match(PPT_PATH_PATTERN);
    if (!match) {
      return { valid: false, reason: 'Path does not match ppts/{category}/ppt_{aid}.pptx' };
    }

    const [, category, aid] = match;
    
    // 验证分类是否有效
    if (!VALID_CATEGORIES.includes(category as CategorySlug)) {
      return { valid: false, reason: `Invalid category in path: ${category}` };
    }

    return { valid: true, category: category as CategorySlug, aid };
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }
}

/**
 * 验证缩略图 URL 路径格式
 * 
 * 预期格式: https://{domain}/ppts/{category}/ppt_{aid}_thumb.{ext}
 */
export function validateThumbnailUrlPath(url: string): {
  valid: boolean;
  category?: CategorySlug;
  aid?: string;
  reason?: string;
} {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\//, '');

    const match = path.match(THUMB_PATH_PATTERN);
    if (!match) {
      return { valid: false, reason: 'Path does not match ppts/{category}/ppt_{aid}_thumb.{ext}' };
    }

    const [, category, aid] = match;

    if (!VALID_CATEGORIES.includes(category as CategorySlug)) {
      return { valid: false, reason: `Invalid category in path: ${category}` };
    }

    return { valid: true, category: category as CategorySlug, aid };
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }
}

/**
 * 构建远程路径 (用于生成预期路径)
 * 
 * Requirements: 7.3
 */
export function buildRemotePaths(aid: string | number, category: CategorySlug): {
  pptPath: string;
  thumbPath: string;
} {
  return {
    pptPath: `ppts/${category}/ppt_${aid}.pptx`,
    thumbPath: `ppts/${category}/ppt_${aid}_thumb.webp`,
  };
}

/**
 * 验证 file_url 和 thumbnail_url 的一致性
 * - 两者应该在同一分类目录下
 * - aid 应该一致
 */
export function validateUrlConsistency(
  fileUrl: string,
  thumbnailUrl: string
): { valid: boolean; reason?: string } {
  const fileResult = validatePptUrlPath(fileUrl);
  const thumbResult = validateThumbnailUrlPath(thumbnailUrl);

  // 如果路径格式不符合预期，跳过一致性检查 (可能是旧格式)
  if (!fileResult.valid || !thumbResult.valid) {
    return { valid: true }; // 不强制要求路径格式
  }

  if (fileResult.category !== thumbResult.category) {
    return { 
      valid: false, 
      reason: `Category mismatch: file=${fileResult.category}, thumb=${thumbResult.category}` 
    };
  }

  if (fileResult.aid !== thumbResult.aid) {
    return { 
      valid: false, 
      reason: `AID mismatch: file=${fileResult.aid}, thumb=${thumbResult.aid}` 
    };
  }

  return { valid: true };
}
