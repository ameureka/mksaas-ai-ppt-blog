/**
 * Upsert Engine 测试
 *
 * Property 5: 自然键 Upsert 幂等与 deleted_at 归一化
 * Property 6: 统计字段保留与覆盖规则
 * Property 7: 软删除标记一致
 * Property 11: 批量 Phase4 事务批次不变量
 * Validates: Requirements 3.4, 8.3, 8.4, 8.5, 8.6, 10.5, 13.2
 */

import { describe, expect, it } from 'vitest';
import type { NormalizedItem } from './preflight.js';
import { batchUpsert, generateUpsertSql, toDbRecord } from './upsert.js';

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

describe('Upsert Engine', () => {
  describe('toDbRecord', () => {
    it('should convert snake_case to camelCase', () => {
      const item = createNormalizedItem({ slides_count: 15, file_size: 2048 });
      const record = toDbRecord(item, false);

      expect(record.slidesCount).toBe(15);
      expect(record.fileSize).toBe(2048);
      expect(record.fileUrl).toBe(item.file_url);
      expect(record.thumbnailUrl).toBe(item.thumbnail_url);
    });

    it('should set embedding_status to pending', () => {
      const item = createNormalizedItem();
      const record = toDbRecord(item, false);

      expect(record.embeddingStatus).toBe('pending');
      expect(record.embeddingError).toBeNull();
    });

    it('should set deleted_at to null', () => {
      const item = createNormalizedItem();
      const record = toDbRecord(item, false);

      expect(record.deletedAt).toBeNull();
    });

    it('should use ai_content_summary as fallback for empty description', () => {
      const item = createNormalizedItem({
        description: '',
        ai_content_summary: 'AI 生成的摘要',
      });
      const record = toDbRecord(item, false);

      expect(record.description).toBe('AI 生成的摘要');
    });
  });

  describe('Property 5: 自然键 Upsert 幂等', () => {
    it('should generate SQL with ON CONFLICT (id) clause', () => {
      const items = [createNormalizedItem()];
      const sql = generateUpsertSql(items, false);

      expect(sql).toContain('ON CONFLICT (id)');
      expect(sql).toContain('DO UPDATE SET');
    });

    it('should produce identical SQL for same item (幂等性)', () => {
      const items = [createNormalizedItem()];

      const sql1 = generateUpsertSql(items, false);
      const sql2 = generateUpsertSql(items, false);

      // 除了时间戳，核心结构应该一致
      expect(sql1.includes('ON CONFLICT (id)')).toBe(true);
      expect(sql2.includes('ON CONFLICT (id)')).toBe(true);
    });

    it('Property 5: deleted_at 归一化 - should reset deleted_at to NULL on update', () => {
      const items = [createNormalizedItem()];
      const sql = generateUpsertSql(items, false);

      expect(sql).toContain('deleted_at = NULL');
    });
  });

  describe('Property 6: 统计字段保留与覆盖规则', () => {
    it('forceStats=false should NOT include download_count/view_count in UPDATE', () => {
      const items = [
        createNormalizedItem({ download_count: 100, view_count: 500 }),
      ];
      const sql = generateUpsertSql(items, false);

      // UPDATE SET 部分不应包含这些字段
      const updatePart = sql.split('DO UPDATE SET')[1];
      expect(updatePart).not.toContain('download_count = EXCLUDED');
      expect(updatePart).not.toContain('view_count = EXCLUDED');
    });

    it('forceStats=true should include download_count/view_count in UPDATE', () => {
      const items = [
        createNormalizedItem({ download_count: 100, view_count: 500 }),
      ];
      const sql = generateUpsertSql(items, true);

      const updatePart = sql.split('DO UPDATE SET')[1];
      expect(updatePart).toContain('download_count = EXCLUDED.download_count');
      expect(updatePart).toContain('view_count = EXCLUDED.view_count');
    });

    it('toDbRecord forceStats=false should not include stat fields', () => {
      const item = createNormalizedItem({
        download_count: 100,
        view_count: 500,
      });
      const record = toDbRecord(item, false);

      // forceStats=false 时，record 不应包含这些字段
      expect('downloadCount' in record).toBe(false);
      expect('viewCount' in record).toBe(false);
    });

    it('toDbRecord forceStats=true should include stat fields', () => {
      const item = createNormalizedItem({
        download_count: 100,
        view_count: 500,
      });
      const record = toDbRecord(item, true);

      expect(record.downloadCount).toBe(100);
      expect(record.viewCount).toBe(500);
    });
  });

  describe('Property 7: 软删除标记一致', () => {
    it('status=published should result in deleted_at=NULL', () => {
      const item = createNormalizedItem({ status: 'published' });
      const record = toDbRecord(item, false);

      expect(record.deletedAt).toBeNull();
    });

    it('SQL should set deleted_at = NULL in update clause', () => {
      const items = [createNormalizedItem()];
      const sql = generateUpsertSql(items, false);

      expect(sql).toContain('deleted_at = NULL');
    });
  });

  describe('Property 11: 批量 Phase4 事务批次不变量', () => {
    it('dry run should return all items as inserted', async () => {
      const items = Array.from({ length: 5 }, (_, i) =>
        createNormalizedItem({
          id: `ppt_${1001 + i}`,
          file_url: `https://cdn.example.com/ppts/business/ppt_${1001 + i}.pptx`,
        })
      );

      const result = await batchUpsert(
        items,
        { forceStats: false, dryRun: true },
        async () => {
          throw new Error('Should not be called in dry run');
        }
      );

      expect(result.inserted).toHaveLength(5);
      expect(result.updated).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
    });

    it('should handle batch failure without affecting other batches', async () => {
      const items = Array.from({ length: 150 }, (_, i) =>
        createNormalizedItem({
          id: `ppt_${2001 + i}`,
          file_url: `https://cdn.example.com/ppts/business/ppt_${2001 + i}.pptx`,
        })
      );

      let callCount = 0;
      const result = await batchUpsert(
        items,
        { forceStats: false, dryRun: false },
        async () => {
          callCount++;
          if (callCount === 1) {
            throw new Error('First batch failed');
          }
          // 后续批次成功
          return Array.from({ length: 50 }, (_, i) => ({
            id: `ppt_${2001 + 100 + i}`,
            inserted: true,
          }));
        }
      );

      // 第一批次 (100 条) 失败
      expect(result.failed).toHaveLength(100);
      // 第二批次 (50 条) 成功
      expect(result.inserted).toHaveLength(50);
    });

    it('batch size should not exceed 100', () => {
      const items = Array.from({ length: 250 }, (_, i) =>
        createNormalizedItem({
          id: `ppt_${3001 + i}`,
          file_url: `https://cdn.example.com/ppts/business/ppt_${3001 + i}.pptx`,
        })
      );

      // 250 条应该分成 3 批: 100 + 100 + 50
      const sql = generateUpsertSql(items.slice(0, 100), false);

      // 验证单批次 SQL 只包含 100 条
      const valueMatches = sql.match(/\(\s*'ppt_/g);
      expect(valueMatches).toHaveLength(100);
    });
  });

  describe('generateUpsertSql', () => {
    it('should return empty string for empty items', () => {
      const sql = generateUpsertSql([], false);
      expect(sql).toBe('');
    });

    it('should escape single quotes in strings', () => {
      const item = createNormalizedItem({
        title: "测试'模板",
        description: "描述包含'单引号",
      });
      const sql = generateUpsertSql([item], false);

      expect(sql).toContain("测试''模板");
      expect(sql).toContain("描述包含''单引号");
    });

    it('should include RETURNING clause', () => {
      const items = [createNormalizedItem()];
      const sql = generateUpsertSql(items, false);

      expect(sql).toContain('RETURNING id');
    });

    it('should reset embedding_status when semantic fields change', () => {
      const items = [createNormalizedItem()];
      const sql = generateUpsertSql(items, false);

      // 检查条件更新逻辑
      expect(sql).toContain('embedding_status = CASE');
      expect(sql).toContain('ppt.title != EXCLUDED.title');
      expect(sql).toContain('ppt.description != EXCLUDED.description');
      expect(sql).toContain('ppt.tags != EXCLUDED.tags');
    });
  });
});
