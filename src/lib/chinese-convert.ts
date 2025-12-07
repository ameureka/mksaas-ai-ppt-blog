// @ts-expect-error - opencc-js 没有类型定义
import * as OpenCC from 'opencc-js';

// 繁体 → 简体 转换器
const converterT2S = OpenCC.Converter({ from: 'tw', to: 'cn' });
// 简体 → 繁体 转换器
const converterS2T = OpenCC.Converter({ from: 'cn', to: 'tw' });

/**
 * 繁体转简体
 */
export function traditionalToSimplified(text: string): string {
  if (!text) return text;
  return converterT2S(text);
}

/**
 * 简体转繁体
 */
export function simplifiedToTraditional(text: string): string {
  if (!text) return text;
  return converterS2T(text);
}

/**
 * 获取搜索词的繁简变体（去重）
 */
export function getChineseVariants(text: string): string[] {
  if (!text) return [];

  const simplified = traditionalToSimplified(text);
  const traditional = simplifiedToTraditional(text);

  const variants = new Set([text, simplified, traditional]);
  return Array.from(variants);
}
