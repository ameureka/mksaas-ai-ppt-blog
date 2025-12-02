/**
 * 博客审计类型定义
 */

import type { IssueType } from '../../config/audit-rules';

// ============================================================================
// 配置接口
// ============================================================================

export interface AuditConfig {
  /** 源目录路径 */
  sourceDir: string;
  /** 报告输出路径 */
  outputPath: string;
  /** 是否检查英文版本 */
  checkEnglish: boolean;
  /** 是否详细输出 */
  verbose: boolean;
}

// ============================================================================
// Frontmatter 接口
// ============================================================================

export interface BlogFrontmatter {
  title?: string;
  description?: string;
  image?: string;
  date?: string;
  published?: boolean;
  premium?: boolean;
  categories?: string[];
  tags?: string[];
  seoKeywords?: string[];
  relatedPosts?: string[];
  author?: string;
}

// ============================================================================
// 审计统计接口
// ============================================================================

export interface AuditStats {
  /** 字数 */
  wordCount: number;
  /** H2 标题数量 */
  h2Count: number;
  /** H3 标题数量 */
  h3Count: number;
  /** 内部链接数量 */
  internalLinks: number;
  /** 外部链接数量 */
  externalLinks: number;
  /** 图片数量 */
  images: number;
  /** 有 alt 的图片数量 */
  imagesWithAlt: number;
  /** 标题长度（字符） */
  titleLen: number;
  /** 描述长度（字符） */
  descLen: number;
  /** 权威引用数量 */
  authorityQuotes: number;
  /** 统计数据数量 */
  statsCount: number;
  /** 是否有 FAQ */
  hasFAQ: boolean;
}

// ============================================================================
// 审计结果接口
// ============================================================================

export interface BlogAuditResult {
  /** 文章 slug */
  slug: string;
  /** 语言 */
  locale: 'zh' | 'en';
  /** 文件路径 */
  filePath: string;
  /** 问题列表 */
  issues: IssueType[];
  /** 统计数据 */
  stats: AuditStats;
  /** Frontmatter 数据 */
  frontmatter: BlogFrontmatter;
  /** 状态 */
  status: 'ok' | 'needs_fix' | 'parse_error';
  /** 媒体状态 */
  mediaStatus: 'missing' | 'partial' | 'done';
  /** 是否有英文版本 */
  hasEnglish: boolean;
}

// ============================================================================
// 审计报告接口
// ============================================================================

export interface BlogAuditReport {
  /** 生成时间 */
  generatedAt: string;
  /** 总文件数 */
  totalFiles: number;
  /** 汇总统计 */
  summary: {
    ok: number;
    needsFix: number;
    parseError: number;
    missingEn: number;
    missingMedia: number;
  };
  /** Issue 统计 */
  issueStats: Partial<Record<IssueType, number>>;
  /** 详细结果 */
  items: BlogAuditResult[];
}

// ============================================================================
// 解析结果接口
// ============================================================================

export interface ParsedMDX {
  /** Frontmatter 数据 */
  frontmatter: BlogFrontmatter;
  /** 正文内容 */
  content: string;
  /** 是否解析成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
}
