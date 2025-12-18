/**
 * Embedding 测试
 *
 * Property 8: embedding 状态三态流转
 * Property 9: embedding 补漏候选选择不遗漏
 * Validates: Requirements 2.2, 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { describe, expect, it } from 'vitest';
import {
  generateEmbeddingInput,
  generateEmbeddingTriggerSql,
  getRepairCronInstructions,
  triggerEmbeddings,
} from './embedding.js';
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

describe('Embedding', () => {
  describe('generateEmbeddingInput', () => {
    it('should combine title, description, and tags', () => {
      const input = generateEmbeddingInput({
        title: '商务报告模板',
        description: '专业的商务报告设计',
        tags: ['商务', '报告', '专业'],
      });

      expect(input).toContain('商务报告模板');
      expect(input).toContain('专业的商务报告设计');
      expect(input).toContain('商务 报告 专业');
    });

    it('should handle null description', () => {
      const input = generateEmbeddingInput({
        title: '测试模板',
        description: null,
        tags: ['标签1'],
      });

      expect(input).toContain('测试模板');
      expect(input).toContain('标签1');
      expect(input).not.toContain('null');
    });

    it('should handle empty tags', () => {
      const input = generateEmbeddingInput({
        title: '测试模板',
        description: '描述',
        tags: [],
      });

      expect(input).toBe('测试模板 描述');
    });

    it('should handle null tags', () => {
      const input = generateEmbeddingInput({
        title: '测试模板',
        description: '描述',
        tags: null,
      });

      expect(input).toBe('测试模板 描述');
    });

    it('should trim result', () => {
      const input = generateEmbeddingInput({
        title: '测试模板',
        description: '',
        tags: [],
      });

      expect(input).toBe('测试模板');
      expect(input.startsWith(' ')).toBe(false);
      expect(input.endsWith(' ')).toBe(false);
    });
  });

  describe('generateEmbeddingTriggerSql', () => {
    it('should return empty string for empty ids', () => {
      const sql = generateEmbeddingTriggerSql([]);
      expect(sql).toBe('');
    });

    it('Property 9: should include correct WHERE condition for pending candidates', () => {
      const sql = generateEmbeddingTriggerSql(['ppt_1001', 'ppt_1002']);

      // 应该选择 embedding IS NULL 或 status != success 的记录
      expect(sql).toContain(
        "embedding_status IS NULL OR embedding_status != 'success'"
      );
    });

    it('should set embedding_status to pending', () => {
      const sql = generateEmbeddingTriggerSql(['ppt_1001']);

      expect(sql).toContain("embedding_status = 'pending'");
    });

    it('should clear embedding_error', () => {
      const sql = generateEmbeddingTriggerSql(['ppt_1001']);

      expect(sql).toContain('embedding_error = NULL');
    });

    it('should update embedding_updated_at', () => {
      const sql = generateEmbeddingTriggerSql(['ppt_1001']);

      expect(sql).toContain('embedding_updated_at = NOW()');
    });

    it('should include RETURNING id', () => {
      const sql = generateEmbeddingTriggerSql(['ppt_1001']);

      expect(sql).toContain('RETURNING id');
    });

    it('should properly format multiple ids', () => {
      const sql = generateEmbeddingTriggerSql([
        'ppt_1001',
        'ppt_1002',
        'ppt_1003',
      ]);

      expect(sql).toContain("'ppt_1001'");
      expect(sql).toContain("'ppt_1002'");
      expect(sql).toContain("'ppt_1003'");
    });
  });

  describe('Property 8: embedding 状态三态流转', () => {
    it('dry run should mark all items as triggered', async () => {
      const items = [
        createNormalizedItem({ id: 'ppt_1001' }),
        createNormalizedItem({ id: 'ppt_1002' }),
      ];

      const result = await triggerEmbeddings(items, { dryRun: true });

      expect(result.triggered).toHaveLength(2);
      expect(result.skipped).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
    });

    it('should skip all items when no executor provided', async () => {
      const items = [createNormalizedItem({ id: 'ppt_1001' })];

      const result = await triggerEmbeddings(items, { dryRun: false });

      expect(result.triggered).toHaveLength(0);
      expect(result.skipped).toHaveLength(1);
      expect(result.failed).toHaveLength(0);
    });

    it('should handle executor success - pending → triggered', async () => {
      const items = [
        createNormalizedItem({ id: 'ppt_1001' }),
        createNormalizedItem({ id: 'ppt_1002' }),
      ];

      const result = await triggerEmbeddings(
        items,
        { dryRun: false },
        async () => ['ppt_1001', 'ppt_1002'] // 全部成功触发
      );

      expect(result.triggered).toHaveLength(2);
      expect(result.skipped).toHaveLength(0);
    });

    it('should mark items as skipped when already success', async () => {
      const items = [
        createNormalizedItem({ id: 'ppt_1001' }),
        createNormalizedItem({ id: 'ppt_1002' }),
      ];

      const result = await triggerEmbeddings(
        items,
        { dryRun: false },
        async () => ['ppt_1001'] // 只有 1001 触发，1002 已经 success 状态
      );

      expect(result.triggered).toHaveLength(1);
      expect(result.triggered).toContain('ppt_1001');
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped).toContain('ppt_1002');
    });

    it('should handle executor failure', async () => {
      const items = [createNormalizedItem({ id: 'ppt_1001' })];

      const result = await triggerEmbeddings(
        items,
        { dryRun: false },
        async () => {
          throw new Error('Database error');
        }
      );

      expect(result.triggered).toHaveLength(0);
      expect(result.skipped).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toContain('Database error');
    });
  });

  describe('getRepairCronInstructions', () => {
    it('should return non-empty instructions', () => {
      const instructions = getRepairCronInstructions();

      expect(instructions).toBeTruthy();
      expect(instructions.length).toBeGreaterThan(100);
    });

    it('should mention repair cron endpoint', () => {
      const instructions = getRepairCronInstructions();

      expect(instructions).toContain('/api/cron/repair-embeddings');
    });

    it('should mention alternative script method', () => {
      const instructions = getRepairCronInstructions();

      expect(instructions).toContain('generate-embeddings');
    });
  });
});
