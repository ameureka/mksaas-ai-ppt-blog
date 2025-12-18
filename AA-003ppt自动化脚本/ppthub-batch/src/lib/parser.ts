/**
 * 初始化输入解析器
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import * as fs from 'fs';
import { parse as csvParse } from 'csv-parse/sync';
import type { PpthubInitFile, PpthubInitItem, PpthubInitMeta } from './types.js';

const EXPECTED_SCHEMA_VERSION = 'ppt-import-v2';
const EXPECTED_NATURAL_KEY = 'file_url';

export class ParseError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ParseError';
  }
}

/**
 * 解析 ppthub-init.json
 * Requirements: 6.1, 6.2, 6.3
 */
export function parseInitJson(filePath: string): PpthubInitFile {
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);

  // 校验 meta
  if (!data.meta) {
    throw new ParseError('missing meta field', 'invalid_schema');
  }

  const meta = data.meta as PpthubInitMeta;

  // 校验 schema_version
  if (meta.schema_version !== EXPECTED_SCHEMA_VERSION) {
    throw new ParseError(
      `invalid schema_version: expected '${EXPECTED_SCHEMA_VERSION}', got '${meta.schema_version}'`,
      'invalid_schema_version'
    );
  }

  // 校验 natural_key
  if (meta.natural_key !== EXPECTED_NATURAL_KEY) {
    throw new ParseError(
      `invalid natural_key: expected '${EXPECTED_NATURAL_KEY}', got '${meta.natural_key}'`,
      'invalid_natural_key'
    );
  }

  // 校验 items
  if (!Array.isArray(data.items)) {
    throw new ParseError('items must be an array', 'invalid_items');
  }

  return {
    meta,
    items: data.items as PpthubInitItem[],
  };
}

/**
 * 解析 ppthub-init.csv
 * Requirements: 6.4, 6.5
 */
export function parseInitCsv(filePath: string): PpthubInitItem[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const records = csvParse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((row: Record<string, string>) => unflattenItem(row));
}

/**
 * 将 CSV 行转换为 PpthubInitItem
 * 处理 tags 的 | 或 , 分隔
 */
function unflattenItem(row: Record<string, string>): PpthubInitItem {
  return {
    id: row.id || '',
    title: row.title || '',
    category: row.category || '',
    tags: parseArrayField(row.tags),
    description: row.description || '',
    language: row.language || '',
    slides_count: parseInt(row.slides_count, 10) || 0,
    file_url: row.file_url || '',
    thumbnail_url: row.thumbnail_url || '',
    cover_image_url: row.cover_image_url || null,
    file_size: row.file_size ? parseInt(row.file_size, 10) : null,
    file_format: row.file_format || null,
    author: row.author || null,
    status: row.status || 'published',
    visibility: row.visibility || null,
    download_count: row.download_count ? parseInt(row.download_count, 10) : null,
    view_count: row.view_count ? parseInt(row.view_count, 10) : null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    ai_summary: row.ai_summary || null,
    ai_content_summary: row.ai_content_summary || null,
    ai_keywords: row.ai_keywords ? parseArrayField(row.ai_keywords) : null,
    ai_scenario: row.ai_scenario || null,
    ai_color_scheme: row.ai_color_scheme || null,
    ai_structure_features: row.ai_structure_features || null,
    ai_template_features: row.ai_template_features || null,
  };
}

/**
 * 解析数组字段（支持 | 或 , 分隔）
 */
function parseArrayField(value: string | undefined): string[] {
  if (!value) return [];
  // 支持 | 或 , 分隔
  const separator = value.includes('|') ? '|' : ',';
  return value
    .split(separator)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * 将 PpthubInitItem 转换为 CSV 行
 */
export function flattenItem(item: PpthubInitItem): Record<string, string> {
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    tags: item.tags.join('|'),
    description: item.description,
    language: item.language,
    slides_count: String(item.slides_count),
    file_url: item.file_url,
    thumbnail_url: item.thumbnail_url,
    cover_image_url: item.cover_image_url || '',
    file_size: item.file_size ? String(item.file_size) : '',
    file_format: item.file_format || '',
    author: item.author || '',
    status: item.status,
    visibility: item.visibility || '',
    download_count: item.download_count ? String(item.download_count) : '',
    view_count: item.view_count ? String(item.view_count) : '',
    created_at: item.created_at || '',
    updated_at: item.updated_at || '',
    ai_summary: item.ai_summary || '',
    ai_content_summary: item.ai_content_summary || '',
    ai_keywords: item.ai_keywords?.join('|') || '',
    ai_scenario: item.ai_scenario || '',
    ai_color_scheme: item.ai_color_scheme || '',
    ai_structure_features: item.ai_structure_features || '',
    ai_template_features: item.ai_template_features || '',
  };
}
