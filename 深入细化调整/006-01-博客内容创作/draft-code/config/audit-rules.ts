/**
 * 博客审计规则配置
 *
 * 本文件定义了 SEO/GEO 审计的所有规则和阈值。
 */

// ============================================================================
// 审计规则接口定义
// ============================================================================

export interface AuditRules {
  /** 标题长度范围（中文字符） */
  titleLength: { min: number; max: number };
  /** 描述长度范围（中文字符） */
  descLength: { min: number; max: number };
  /** 最小 H2 标题数量 */
  minH2: number;
  /** 最小 H3 标题数量 */
  minH3: number;
  /** 最小内部链接数量 */
  minInternalLinks: number;
  /** 最小外部链接数量 */
  minExternalLinks: number;
  /** 最小权威引用数量 */
  minAuthorityQuotes: number;
  /** 最小统计数据数量 */
  minStats: number;
  /** 最小图片数量 */
  minImages: number;
  /** 是否要求 FAQ 段落 */
  requireFAQ: boolean;
  /** 最小字数 */
  minWordCount: number;
}

// ============================================================================
// 默认审计规则
// ============================================================================

export const defaultAuditRules: AuditRules = {
  // 标题：25-35 中文字符（≈50-60 英文字符）
  titleLength: { min: 25, max: 35 },

  // 描述：70-100 中文字符（≈140-160 英文字符）
  descLength: { min: 70, max: 100 },

  // 结构要求
  minH2: 5,
  minH3: 5,

  // 链接要求
  minInternalLinks: 3,
  minExternalLinks: 1,

  // GEO 优化要求
  minAuthorityQuotes: 2,
  minStats: 2,

  // 图片要求
  minImages: 3,

  // FAQ 要求
  requireFAQ: true,

  // 字数要求
  minWordCount: 1200,
};

// ============================================================================
// Issue 类型定义
// ============================================================================

export type IssueType =
  | 'missing_title'
  | 'missing_description'
  | 'short_title'
  | 'long_title'
  | 'short_desc'
  | 'long_desc'
  | 'no_cover'
  | 'few_images'
  | 'no_image_alt'
  | 'no_internal_links'
  | 'few_internal_links'
  | 'no_external_links'
  | 'no_authoritative_quote'
  | 'few_authoritative_quotes'
  | 'no_stats'
  | 'few_stats'
  | 'few_h2'
  | 'few_h3'
  | 'no_faq'
  | 'missing_en'
  | 'bad_date'
  | 'missing_category'
  | 'wrong_category'
  | 'missing_author'
  | 'missing_frontmatter'
  | 'parse_error'
  | 'low_word_count';

// ============================================================================
// Issue 描述映射
// ============================================================================

export const issueDescriptions: Record<IssueType, string> = {
  missing_title: '缺少标题',
  missing_description: '缺少描述',
  short_title: '标题过短（<25字符）',
  long_title: '标题过长（>35字符）',
  short_desc: '描述过短（<70字符）',
  long_desc: '描述过长（>100字符）',
  no_cover: '缺少封面图',
  few_images: '图片数量不足（<3张）',
  no_image_alt: '图片缺少 alt 文本',
  no_internal_links: '无内部链接',
  few_internal_links: '内部链接不足（<3个）',
  no_external_links: '无外部链接',
  no_authoritative_quote: '无权威引用',
  few_authoritative_quotes: '权威引用不足（<2条）',
  no_stats: '无统计数据',
  few_stats: '统计数据不足（<2条）',
  few_h2: 'H2 标题不足（<5个）',
  few_h3: 'H3 标题不足（<5个）',
  no_faq: '缺少 FAQ 段落',
  missing_en: '缺少英文版本',
  bad_date: '日期格式错误',
  missing_category: '缺少分类',
  wrong_category: '分类不在映射表中',
  missing_author: '缺少作者',
  missing_frontmatter: '缺少 Frontmatter',
  parse_error: '解析错误',
  low_word_count: '字数不足（<1200字）',
};

// ============================================================================
// 权威来源关键词
// ============================================================================

export const authorityKeywords = [
  // 机构名称
  '麦肯锡',
  'McKinsey',
  '哈佛',
  'Harvard',
  'Statista',
  '德勤',
  'Deloitte',
  '普华永道',
  'PwC',
  '埃森哲',
  'Accenture',
  '高德纳',
  'Gartner',
  'IDC',
  'Forrester',
  '艾瑞',
  '易观',
  '中国信通院',
  '工信部',
  '国家统计局',

  // 报告类型
  '报告',
  '研究',
  '调查',
  '白皮书',
  '蓝皮书',
  'report',
  'research',
  'study',
  'survey',
  'whitepaper',
];

// ============================================================================
// 统计数据匹配模式
// ============================================================================

export const statsPatterns = [
  // 百分比
  /\d+(\.\d+)?%/,
  // 数字 + 报告/调查/研究
  /\d+.*(报告|调查|研究|数据|统计)/,
  // 年份 + 数据
  /20\d{2}年.*(数据|报告|调查)/,
  // 增长/下降 + 百分比
  /(增长|下降|提升|降低).?\d+(\.\d+)?%/,
  // 超过/约/近 + 数字
  /(超过|约|近|达到)\s?\d+/,
];

// ============================================================================
// FAQ 检测关键词
// ============================================================================

export const faqKeywords = [
  'FAQ',
  'faq',
  '常见问题',
  '问答',
  'Q&A',
  'Q：',
  'A：',
  '问：',
  '答：',
];
