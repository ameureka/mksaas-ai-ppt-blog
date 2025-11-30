/**
 * MDX 解析器
 *
 * 提供 Frontmatter 解析和正文内容分析功能。
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  authorityKeywords,
  faqKeywords,
  statsPatterns,
} from '../../config/audit-rules';
import type { AuditStats, BlogFrontmatter, ParsedMDX } from './types';

// ============================================================================
// Frontmatter 解析
// ============================================================================

/**
 * 解析 MDX 文件的 Frontmatter 和正文
 */
export function parseMDX(filePath: string): ParsedMDX {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // 匹配 Frontmatter（--- 包围的 YAML）
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

    if (!frontmatterMatch) {
      return {
        frontmatter: {},
        content: content,
        success: false,
        error: 'No frontmatter found',
      };
    }

    const frontmatterStr = frontmatterMatch[1];
    const bodyContent = content.slice(frontmatterMatch[0].length).trim();

    // 简单的 YAML 解析（不依赖外部库）
    const frontmatter = parseSimpleYAML(frontmatterStr);

    return {
      frontmatter,
      content: bodyContent,
      success: true,
    };
  } catch (error) {
    return {
      frontmatter: {},
      content: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 简单的 YAML 解析器
 */
function parseSimpleYAML(yamlStr: string): BlogFrontmatter {
  const result: BlogFrontmatter = {};
  const lines = yamlStr.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    let value = trimmed.slice(colonIndex + 1).trim();

    // 处理引号
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // 处理数组
    if (value.startsWith('[') && value.endsWith(']')) {
      const arrayContent = value.slice(1, -1);
      const items = arrayContent
        .split(',')
        .map((item) => {
          let trimmedItem = item.trim();
          if (
            (trimmedItem.startsWith('"') && trimmedItem.endsWith('"')) ||
            (trimmedItem.startsWith("'") && trimmedItem.endsWith("'"))
          ) {
            trimmedItem = trimmedItem.slice(1, -1);
          }
          return trimmedItem;
        })
        .filter(Boolean);
      (result as any)[key] = items;
    }
    // 处理布尔值
    else if (value === 'true') {
      (result as any)[key] = true;
    } else if (value === 'false') {
      (result as any)[key] = false;
    }
    // 处理字符串
    else {
      (result as any)[key] = value;
    }
  }

  return result;
}

// ============================================================================
// 内容分析
// ============================================================================

/**
 * 计算中文字符数（包括中文标点）
 */
export function countChineseChars(text: string): number {
  // 匹配中文字符、中文标点
  const chineseChars = text.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g);
  return chineseChars ? chineseChars.length : 0;
}

/**
 * 计算字数（中文按字符，英文按单词）
 */
export function countWords(text: string): number {
  // 中文字符数
  const chineseCount = countChineseChars(text);

  // 英文单词数（移除中文后计算）
  const textWithoutChinese = text.replace(
    /[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g,
    ' '
  );
  const englishWords = textWithoutChinese
    .split(/\s+/)
    .filter((word) => word.length > 0);

  return chineseCount + englishWords.length;
}

/**
 * 统计 H2 标题数量
 */
export function countH2(content: string): number {
  const matches = content.match(/^##\s+[^#]/gm);
  return matches ? matches.length : 0;
}

/**
 * 统计 H3 标题数量
 */
export function countH3(content: string): number {
  const matches = content.match(/^###\s+[^#]/gm);
  return matches ? matches.length : 0;
}

/**
 * 提取所有链接
 */
export function extractLinks(content: string): {
  internal: string[];
  external: string[];
} {
  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  const internal: string[] = [];
  const external: string[] = [];

  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const url = match[2];

    // 跳过图片链接
    if (match[0].startsWith('!')) continue;

    // 内部链接：以 / 开头或相对路径
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      internal.push(url);
    }
    // 外部链接：http/https
    else if (url.startsWith('http://') || url.startsWith('https://')) {
      // 排除本站域名
      if (!url.includes('mksaas.me') && !url.includes('localhost')) {
        external.push(url);
      } else {
        internal.push(url);
      }
    }
  }

  return { internal, external };
}

/**
 * 提取所有图片
 */
export function extractImages(content: string): { src: string; alt: string }[] {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images: { src: string; alt: string }[] = [];

  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    images.push({
      alt: match[1],
      src: match[2],
    });
  }

  return images;
}

/**
 * 统计权威引用数量
 */
export function countAuthorityQuotes(content: string): number {
  let count = 0;

  for (const keyword of authorityKeywords) {
    const regex = new RegExp(keyword, 'gi');
    const matches = content.match(regex);
    if (matches) {
      count += matches.length;
    }
  }

  // 去重：同一段落中的多个关键词只算一次
  // 简化处理：返回关键词匹配数的一半（粗略估计）
  return Math.ceil(count / 2);
}

/**
 * 统计统计数据数量
 */
export function countStats(content: string): number {
  let count = 0;

  for (const pattern of statsPatterns) {
    const matches = content.match(new RegExp(pattern, 'g'));
    if (matches) {
      count += matches.length;
    }
  }

  // 去重
  return Math.min(count, 10); // 最多算 10 条
}

/**
 * 检测是否有 FAQ 段落
 */
export function hasFAQ(content: string): boolean {
  for (const keyword of faqKeywords) {
    if (content.includes(keyword)) {
      return true;
    }
  }
  return false;
}

/**
 * 分析正文内容，生成统计数据
 */
export function analyzeContent(
  content: string,
  frontmatter: BlogFrontmatter
): AuditStats {
  const links = extractLinks(content);
  const images = extractImages(content);

  return {
    wordCount: countWords(content),
    h2Count: countH2(content),
    h3Count: countH3(content),
    internalLinks: links.internal.length,
    externalLinks: links.external.length,
    images: images.length,
    imagesWithAlt: images.filter((img) => img.alt.trim().length > 0).length,
    titleLen: frontmatter.title
      ? countChineseChars(frontmatter.title) || frontmatter.title.length
      : 0,
    descLen: frontmatter.description
      ? countChineseChars(frontmatter.description) ||
        frontmatter.description.length
      : 0,
    authorityQuotes: countAuthorityQuotes(content),
    statsCount: countStats(content),
    hasFAQ: hasFAQ(content),
  };
}

// ============================================================================
// 文件扫描
// ============================================================================

/**
 * 递归扫描目录中的 MDX 文件
 */
export function scanMDXFiles(dir: string): string[] {
  const files: string[] = [];

  function scan(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

/**
 * 从文件路径提取 slug
 */
export function extractSlug(filePath: string): string {
  const basename = path.basename(filePath, '.mdx');
  // 移除 .zh 后缀
  return basename.replace(/\.zh$/, '');
}

/**
 * 从文件路径判断语言
 */
export function extractLocale(filePath: string): 'zh' | 'en' {
  return filePath.endsWith('.zh.mdx') ? 'zh' : 'en';
}
