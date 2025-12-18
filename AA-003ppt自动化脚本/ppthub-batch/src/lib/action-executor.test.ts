/**
 * Action Executor 测试
 *
 * Property 12: 导入器两路径字段兼容
 * Validates: Requirements 13.3, 13.4
 */

import { describe, expect, it } from 'vitest';
import {
  batchViaAction,
  generateActionExample,
  toCreatePPTInput,
} from './action-executor.js';
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

describe('Action Executor', () => {
  describe('Property 12: toCreatePPTInput 字段映射', () => {
    it('should map all required fields correctly', () => {
      const item = createNormalizedItem();
      const input = toCreatePPTInput(item);

      expect(input.title).toBe('测试模板');
      expect(input.description).toBe('测试描述');
      expect(input.category).toBe('business');
      expect(input.language).toBe('中文');
      expect(input.tags).toEqual(['商务', '报告']);
      expect(input.author).toBe('PPTHub');
      expect(input.status).toBe('published');
    });

    it('should map URL fields with camelCase', () => {
      const item = createNormalizedItem();
      const input = toCreatePPTInput(item);

      expect(input.fileUrl).toBe(
        'https://cdn.example.com/ppts/business/ppt_1001.pptx'
      );
      expect(input.thumbnailUrl).toBe(
        'https://cdn.example.com/ppts/business/ppt_1001_thumb.webp'
      );
    });

    it('Property 12 核心: previewUrl 应回退到 thumbnailUrl', () => {
      const item = createNormalizedItem();
      // preview_url 不存在时，应回退到 thumbnail_url
      const input = toCreatePPTInput(item);

      // 当 preview_url 不存在时，应使用 thumbnail_url
      expect(input.previewUrl).toBe(item.thumbnail_url);
    });

    it('should use preview_url when provided', () => {
      const item = createNormalizedItem();
      (item as any).preview_url = 'https://cdn.example.com/preview.jpg';
      const input = toCreatePPTInput(item);

      expect(input.previewUrl).toBe('https://cdn.example.com/preview.jpg');
    });

    it('should include downloadCount and viewCount when provided', () => {
      const item = createNormalizedItem({
        download_count: 100,
        view_count: 500,
      });
      const input = toCreatePPTInput(item);

      expect(input.downloadCount).toBe(100);
      expect(input.viewCount).toBe(500);
    });

    it('should exclude downloadCount/viewCount when undefined', () => {
      const item = createNormalizedItem({
        download_count: undefined,
        view_count: undefined,
      });
      const input = toCreatePPTInput(item);

      expect('downloadCount' in input).toBe(false);
      expect('viewCount' in input).toBe(false);
    });

    it('should include optional source fields when provided', () => {
      const item = createNormalizedItem();
      (item as any).source_url = 'https://source.example.com';
      (item as any).source_batch_id = 'batch-001';
      const input = toCreatePPTInput(item);

      expect(input.sourceUrl).toBe('https://source.example.com');
      expect(input.sourceBatchId).toBe('batch-001');
    });

    it('should map fileSize and slideCount', () => {
      const item = createNormalizedItem({
        file_size: 2048000,
        slides_count: 25,
      });
      const input = toCreatePPTInput(item);

      expect(input.fileSize).toBe(2048000);
      expect(input.slideCount).toBe(25);
    });
  });

  describe('batchViaAction', () => {
    it('dry run should return all items as inserted', async () => {
      const items = [
        createNormalizedItem({ id: 'ppt_1001' }),
        createNormalizedItem({ id: 'ppt_1002' }),
      ];

      const result = await batchViaAction(items, { dryRun: true }, async () => {
        throw new Error('Should not be called');
      });

      expect(result.inserted).toHaveLength(2);
      expect(result.updated).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
    });

    it('should handle executor success', async () => {
      const items = [createNormalizedItem({ id: 'ppt_1001' })];

      const result = await batchViaAction(
        items,
        { dryRun: false },
        async () => ({ success: true, id: 'ppt_1001' })
      );

      expect(result.inserted).toHaveLength(1);
      expect(result.inserted[0]).toBe('ppt_1001');
    });

    it('should handle executor failure response', async () => {
      const items = [createNormalizedItem({ id: 'ppt_1001' })];

      const result = await batchViaAction(
        items,
        { dryRun: false },
        async () => ({ success: false, error: 'Validation failed' })
      );

      expect(result.inserted).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toBe('Validation failed');
    });

    it('should handle executor throwing error', async () => {
      const items = [createNormalizedItem({ id: 'ppt_1001' })];

      const result = await batchViaAction(
        items,
        { dryRun: false },
        async () => {
          throw new Error('Network error');
        }
      );

      expect(result.inserted).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toContain('Network error');
    });

    it('should process items sequentially', async () => {
      const items = [
        createNormalizedItem({ id: 'ppt_1001' }),
        createNormalizedItem({ id: 'ppt_1002' }),
        createNormalizedItem({ id: 'ppt_1003' }),
      ];

      const callOrder: string[] = [];
      const result = await batchViaAction(
        items,
        { dryRun: false },
        async (input) => {
          callOrder.push(input.title as string);
          return { success: true, id: `ppt_${callOrder.length}` };
        }
      );

      expect(result.inserted).toHaveLength(3);
      expect(callOrder).toHaveLength(3);
    });
  });

  describe('generateActionExample', () => {
    it('should generate valid code example', () => {
      const item = createNormalizedItem();
      const example = generateActionExample(item);

      expect(example).toContain('createPPT');
      expect(example).toContain('import');
      expect(example).toContain('@/actions/ppt/ppt');
    });

    it('should include item data in example', () => {
      const item = createNormalizedItem({ title: '示例模板' });
      const example = generateActionExample(item);

      expect(example).toContain('示例模板');
    });
  });
});
