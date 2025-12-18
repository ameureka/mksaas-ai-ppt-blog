/**
 * Preflight Validator 测试
 *
 * Property 2: Preflight 对必填/分类/语言/URL 的拒绝与归因
 * Property 3: 语言映射确定性
 * Validates: Requirements 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 7.1, 7.2, 10.4, 13.1
 */

import { describe, expect, it } from 'vitest';
import { preflight } from './preflight.js';
import type { PpthubInitItem } from './types.js';

// 创建有效的基础 item
function createValidItem(
  overrides: Partial<PpthubInitItem> = {}
): PpthubInitItem {
  return {
    id: 'ppt_1001',
    title: '测试模板',
    category: 'business',
    tags: ['商务'],
    description: '描述',
    language: '中文',
    slides_count: 10,
    file_url: 'https://cdn.example.com/ppts/business/ppt_1001.pptx',
    thumbnail_url: 'https://cdn.example.com/ppts/business/ppt_1001_thumb.webp',
    cover_image_url: null,
    file_size: 1024,
    file_format: 'pptx',
    author: 'PPTHub',
    status: 'published',
    visibility: 'public',
    download_count: null,
    view_count: null,
    created_at: null,
    updated_at: null,
    ai_summary: null,
    ai_content_summary: null,
    ai_keywords: null,
    ai_scenario: null,
    ai_color_scheme: null,
    ai_structure_features: null,
    ai_template_features: null,
    ...overrides,
  };
}

describe('Preflight Validator', () => {
  describe('Property 2: 必填字段校验', () => {
    it('should reject item missing title', () => {
      const items = [createValidItem({ title: '' })];
      const result = preflight(items);

      expect(result.invalidItems).toHaveLength(1);
      expect(result.invalidItems[0].errors).toContain(
        'missing_required_field: title'
      );
    });

    it('should reject item missing file_url', () => {
      const items = [createValidItem({ file_url: '' })];
      const result = preflight(items);

      expect(result.invalidItems).toHaveLength(1);
      expect(result.invalidItems[0].errors).toContain(
        'missing_required_field: file_url'
      );
    });

    it('should reject item missing thumbnail_url', () => {
      const items = [createValidItem({ thumbnail_url: '' })];
      const result = preflight(items);

      expect(result.invalidItems).toHaveLength(1);
      expect(result.invalidItems[0].errors).toContain(
        'missing_required_field: thumbnail_url'
      );
    });

    it('should reject item missing category', () => {
      const items = [createValidItem({ category: '' })];
      const result = preflight(items);

      expect(result.invalidItems).toHaveLength(1);
      expect(result.invalidItems[0].errors).toContain(
        'missing_required_field: category'
      );
    });

    it('should accept item with all required fields', () => {
      const items = [createValidItem()];
      const result = preflight(items);

      expect(result.validItems).toHaveLength(1);
      expect(result.invalidItems).toHaveLength(0);
    });
  });

  describe('Property 2: 分类校验', () => {
    it('should accept valid categories', () => {
      const validCategories = [
        'business',
        'education',
        'technology',
        'design',
        'marketing',
      ];

      for (const category of validCategories) {
        const items = [createValidItem({ category })];
        const result = preflight(items);
        expect(result.validItems).toHaveLength(1);
      }
    });

    it('should reject invalid category', () => {
      const items = [createValidItem({ category: 'invalid_category' })];
      const result = preflight(items);

      expect(result.invalidItems).toHaveLength(1);
      expect(
        result.invalidItems[0].errors.some((e) =>
          e.includes('invalid_category')
        )
      ).toBe(true);
    });
  });

  describe('Property 3: 语言映射确定性', () => {
    it('should map "zh" to "中文"', () => {
      const items = [createValidItem({ language: 'zh' })];
      const result = preflight(items);

      expect(result.validItems).toHaveLength(1);
      expect(result.validItems[0].language).toBe('中文');
    });

    it('should map "en" to "English"', () => {
      const items = [createValidItem({ language: 'en' })];
      const result = preflight(items);

      expect(result.validItems).toHaveLength(1);
      expect(result.validItems[0].language).toBe('English');
    });

    it('should map "other" to "其他"', () => {
      const items = [createValidItem({ language: 'other' })];
      const result = preflight(items);

      expect(result.validItems).toHaveLength(1);
      expect(result.validItems[0].language).toBe('其他');
    });

    it('should keep valid language values unchanged', () => {
      const items = [createValidItem({ language: '中文' })];
      const result = preflight(items);

      expect(result.validItems).toHaveLength(1);
      expect(result.validItems[0].language).toBe('中文');
    });

    it('should default empty language to "其他"', () => {
      const items = [createValidItem({ language: '' })];
      const result = preflight(items);

      expect(result.validItems).toHaveLength(1);
      expect(result.validItems[0].language).toBe('其他');
    });
  });

  describe('Property 2: URL 格式校验', () => {
    it('should reject non-HTTPS URL', () => {
      const items = [
        createValidItem({
          file_url: 'http://cdn.example.com/ppts/business/ppt_1001.pptx',
        }),
      ];
      const result = preflight(items);

      expect(result.invalidItems).toHaveLength(1);
      expect(
        result.invalidItems[0].errors.some((e) => e.includes('invalid_url'))
      ).toBe(true);
    });

    it('should reject URL with signature parameters', () => {
      const items = [
        createValidItem({
          file_url:
            'https://cdn.example.com/ppts/business/ppt_1001.pptx?X-Amz-Signature=abc',
        }),
      ];
      const result = preflight(items);

      expect(result.invalidItems).toHaveLength(1);
      expect(
        result.invalidItems[0].errors.some((e) => e.includes('invalid_url'))
      ).toBe(true);
    });

    it('should accept valid HTTPS URL without parameters', () => {
      const items = [createValidItem()];
      const result = preflight(items);

      expect(result.validItems).toHaveLength(1);
    });
  });

  describe('Property 2 扩展: 自然键去重', () => {
    it('should deduplicate by file_url, keeping latest updated_at', () => {
      const items = [
        createValidItem({
          id: 'ppt_1001',
          title: '旧版本',
          file_url: 'https://cdn.example.com/same.pptx',
          updated_at: '2024-01-01T00:00:00Z',
        }),
        createValidItem({
          id: 'ppt_1002',
          title: '新版本',
          file_url: 'https://cdn.example.com/same.pptx',
          updated_at: '2024-01-02T00:00:00Z',
        }),
      ];
      const result = preflight(items);

      expect(result.validItems).toHaveLength(1);
      expect(result.validItems[0].title).toBe('新版本');
    });
  });

  describe('归一化: status 和 author', () => {
    it('should reject non-published status', () => {
      const items = [createValidItem({ status: 'draft' })];
      const result = preflight(items);

      expect(result.invalidItems).toHaveLength(1);
      expect(
        result.invalidItems[0].errors.some((e) => e.includes('invalid_status'))
      ).toBe(true);
    });

    it('should default empty author to PPTHub', () => {
      const items = [createValidItem({ author: null })];
      const result = preflight(items);

      expect(result.validItems).toHaveLength(1);
      expect(result.validItems[0].author).toBe('PPTHub');
    });
  });
});
