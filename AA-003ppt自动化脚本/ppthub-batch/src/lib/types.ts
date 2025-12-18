/**
 * PPTHub Batch Import 类型定义
 */

// 初始化文件 Meta
export interface PpthubInitMeta {
  schema_version: 'ppt-import-v2';
  exported_at: string;
  natural_key: 'file_url';
  source: string;
  source_batch_id: string;
}

// 初始化文件 Item (snake_case，与 Piliang 导出一致)
export interface PpthubInitItem {
  id: string;
  title: string;
  category: string;
  tags: string[];
  description: string;
  language: string;
  slides_count: number;
  file_url: string;
  thumbnail_url: string;
  cover_image_url: string | null;
  file_size: number | null;
  file_format: string | null;
  author: string | null;
  status: string;
  visibility: string | null;
  download_count: number | null;
  view_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  // AI 丰富字段
  ai_summary: string | null;
  ai_content_summary: string | null;
  ai_keywords: string[] | null;
  ai_scenario: string | null;
  ai_color_scheme: string | null;
  ai_structure_features: string | null;
  ai_template_features: string | null;
}

// 初始化文件结构
export interface PpthubInitFile {
  meta: PpthubInitMeta;
  items: PpthubInitItem[];
}

// 导入选项
export interface BatchImportOptions {
  inputPath: string;
  format: 'json' | 'csv' | 'auto';
  naturalKey: 'file_url';
  batchSize: number;
  forceStats: boolean;
  dryRun: boolean;
}

// 导入报告
export interface ImportReport {
  batch_id: string;
  imported_at: string;
  input_path: string;
  options: Omit<BatchImportOptions, 'inputPath'>;
  summary: {
    total: number;
    inserted: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  failed_items: Array<{
    id: string;
    errors: string[];
  }>;
}

// 有效分类 slug
export const VALID_CATEGORIES = [
  'business', 'education', 'technology', 'design', 'marketing',
  'hr', 'medical', 'finance', 'general', 'summary', 'report', 'plan'
] as const;

export type CategorySlug = typeof VALID_CATEGORIES[number];

// 有效语言值
export const VALID_LANGUAGES = ['中文', 'English', '其他'] as const;
export type LanguageValue = typeof VALID_LANGUAGES[number];

// 语言映射
export const LANGUAGE_MAP: Record<string, LanguageValue> = {
  'zh': '中文',
  'en': 'English',
  'other': '其他',
  '中文': '中文',
  'English': 'English',
  '其他': '其他',
};
