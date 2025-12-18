/**
 * Postcheck 测试
 *
 * Property 13: 导入报告计数一致
 * Property 14: 可选字段映射完整性
 * Validates: Requirements 3.5, 3.6, 10.7, 13.5
 */

import { describe, expect, it } from 'vitest';
import { formatPostCheckResult, postCheck } from './postcheck.js';
import type { NormalizedItem } from './preflight.js';

// 创建测试用的 NormalizedItem
function createNormalizedItem(
  overrides: Partial<NormalizedItem> = {}
): NormalizedItem {
  return {
    id: 'ppt_1001',
    title: '测试模板',
    category: 'business',
    tags: ['商务', '报告'],
    description: '测试描述',
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
  } as NormalizedItem;
}

describe('Postcheck', () => {
  describe('postCheck', () => {
    it('should calculate category distribution correctly', () => {
      const items = [
        createNormalizedItem({ category: 'business' }),
        createNormalizedItem({ category: 'business' }),
        createNormalizedItem({ category: 'education' }),
        createNormalizedItem({ category: 'technology' }),
      ];

      const result = postCheck(items);

      expect(result.categoryDistribution.business).toBe(2);
      expect(result.categoryDistribution.education).toBe(1);
      expect(result.categoryDistribution.technology).toBe(1);
    });

    it('should calculate language distribution correctly', () => {
      const items = [
        createNormalizedItem({ language: '中文' }),
        createNormalizedItem({ language: '中文' }),
        createNormalizedItem({ language: 'English' }),
      ];

      const result = postCheck(items);

      expect(result.languageDistribution['中文']).toBe(2);
      expect(result.languageDistribution['English']).toBe(1);
    });

    it('should count empty description fields', () => {
      const items = [
        createNormalizedItem({ description: '有描述' }),
        createNormalizedItem({ description: '' }),
        createNormalizedItem({ description: '   ' }), // 只有空格也算空
      ];

      const result = postCheck(items);

      expect(result.emptyFields.description).toBe(2);
    });

    it('should count empty tags fields', () => {
      const items = [
        createNormalizedItem({ tags: ['标签1'] }),
        createNormalizedItem({ tags: [] }),
        createNormalizedItem({ tags: ['标签2', '标签3'] }),
      ];

      const result = postCheck(items);

      expect(result.emptyFields.tags).toBe(1);
    });

    it('should count default author as empty', () => {
      const items = [
        createNormalizedItem({ author: 'PPTHub' }), // 默认值算空
        createNormalizedItem({ author: '自定义作者' }),
        createNormalizedItem({ author: '' }), // 空字符串也算空
      ];

      const result = postCheck(items);

      expect(result.emptyFields.author).toBe(2);
    });

    it('should set all items as pending for embedding', () => {
      const items = [
        createNormalizedItem(),
        createNormalizedItem(),
        createNormalizedItem(),
      ];

      const result = postCheck(items);

      expect(result.embeddingCoverage.pending).toBe(3);
      expect(result.embeddingCoverage.success).toBe(0);
      expect(result.embeddingCoverage.failed).toBe(0);
    });

    it('should handle empty items array', () => {
      const result = postCheck([]);

      expect(result.embeddingCoverage.pending).toBe(0);
      expect(Object.values(result.languageDistribution).length).toBe(0);
    });
  });

  describe('Property 13: 导入报告计数一致', () => {
    it('sum of distributions should equal total items', () => {
      const items = [
        createNormalizedItem({ category: 'business', language: '中文' }),
        createNormalizedItem({ category: 'education', language: '中文' }),
        createNormalizedItem({ category: 'business', language: 'English' }),
        createNormalizedItem({ category: 'technology', language: '其他' }),
      ];

      const result = postCheck(items);

      // 分类计数之和应等于总数
      const categorySum = Object.values(result.categoryDistribution).reduce(
        (a, b) => a + b,
        0
      );
      expect(categorySum).toBe(items.length);

      // 语言计数之和应等于总数
      const languageSum = Object.values(result.languageDistribution).reduce(
        (a, b) => a + b,
        0
      );
      expect(languageSum).toBe(items.length);

      // embedding 状态总和应等于总数
      const embeddingSum =
        result.embeddingCoverage.pending +
        result.embeddingCoverage.success +
        result.embeddingCoverage.failed;
      expect(embeddingSum).toBe(items.length);
    });
  });

  describe('Property 14: 可选字段映射完整性', () => {
    it('should handle items with AI fields', () => {
      const items = [
        createNormalizedItem({
          ai_summary: 'AI 摘要',
          ai_content_summary: '内容摘要',
          ai_keywords: ['关键词1', '关键词2'],
          ai_scenario: '商务场景',
          ai_color_scheme: 'blue',
          ai_structure_features: '结构特征',
          ai_template_features: '模板特征',
        }),
      ];

      const result = postCheck(items);

      // 确保有 AI 字段时不算 empty
      expect(result.emptyFields.description).toBe(0);
    });

    it('should handle items with all null optional fields', () => {
      const items = [
        createNormalizedItem({
          cover_image_url: null,
          file_size: null,
          file_format: null,
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
        }),
      ];

      // 不应抛出错误
      const result = postCheck(items);
      expect(result).toBeDefined();
    });

    it('should correctly identify items with/without description', () => {
      const items = [
        createNormalizedItem({
          description: '有描述',
          ai_content_summary: null,
        }),
        createNormalizedItem({
          description: '',
          ai_content_summary: 'AI 摘要',
        }), // 这个 description 为空
        createNormalizedItem({ description: '', ai_content_summary: null }), // 这个也为空
      ];

      const result = postCheck(items);

      // 只检查 description 字段是否为空
      expect(result.emptyFields.description).toBe(2);
    });
  });

  describe('formatPostCheckResult', () => {
    it('should format result as readable string', () => {
      const items = [
        createNormalizedItem({ category: 'business', language: '中文' }),
        createNormalizedItem({ category: 'education', language: 'English' }),
      ];
      const result = postCheck(items);
      const formatted = formatPostCheckResult(result, items.length);

      expect(formatted).toContain('导入后校验报告');
      expect(formatted).toContain('分类分布');
      expect(formatted).toContain('语言分布');
      expect(formatted).toContain('空字段统计');
      expect(formatted).toContain('Embedding 状态');
    });

    it('should show percentages', () => {
      const items = [
        createNormalizedItem({ category: 'business' }),
        createNormalizedItem({ category: 'business' }),
      ];
      const result = postCheck(items);
      const formatted = formatPostCheckResult(result, items.length);

      expect(formatted).toContain('100.0%');
    });

    it('should only show non-zero categories', () => {
      const items = [createNormalizedItem({ category: 'business' })];
      const result = postCheck(items);
      const formatted = formatPostCheckResult(result, items.length);

      expect(formatted).toContain('business');
      // education 应该不出现，因为是 0
      expect(formatted.match(/education: 0/)).toBeNull();
    });
  });
});
