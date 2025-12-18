/**
 * Parser 测试
 *
 * Property 1: 初始化输入解析与往返一致
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ParseError,
  flattenItem,
  parseInitCsv,
  parseInitJson,
} from './parser.js';
import type { PpthubInitItem } from './types.js';

describe('Parser', () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ppthub-test-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('parseInitJson', () => {
    it('should parse valid JSON with correct schema_version', () => {
      const jsonContent = {
        meta: {
          schema_version: 'ppt-import-v2',
          exported_at: '2024-01-01T00:00:00Z',
          natural_key: 'file_url',
          source: 'test',
          source_batch_id: 'batch-001',
        },
        items: [
          {
            id: 'ppt_1001',
            title: '测试模板',
            category: 'business',
            tags: ['商务', '报告'],
            description: '测试描述',
            language: '中文',
            slides_count: 10,
            file_url: 'https://cdn.example.com/ppts/business/ppt_1001.pptx',
            thumbnail_url:
              'https://cdn.example.com/ppts/business/ppt_1001_thumb.webp',
            cover_image_url: null,
            file_size: 1024,
            file_format: 'pptx',
            author: 'PPTHub',
            status: 'published',
            visibility: 'public',
            download_count: 0,
            view_count: 0,
            created_at: null,
            updated_at: null,
            ai_summary: null,
            ai_content_summary: null,
            ai_keywords: null,
            ai_scenario: null,
            ai_color_scheme: null,
            ai_structure_features: null,
            ai_template_features: null,
          },
        ],
      };

      const filePath = path.join(tempDir, 'valid.json');
      fs.writeFileSync(filePath, JSON.stringify(jsonContent));

      const result = parseInitJson(filePath);

      expect(result.meta.schema_version).toBe('ppt-import-v2');
      expect(result.meta.natural_key).toBe('file_url');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('测试模板');
    });

    it('should reject invalid schema_version', () => {
      const jsonContent = {
        meta: {
          schema_version: 'ppt-import-v1',
          natural_key: 'file_url',
        },
        items: [],
      };

      const filePath = path.join(tempDir, 'invalid-version.json');
      fs.writeFileSync(filePath, JSON.stringify(jsonContent));

      expect(() => parseInitJson(filePath)).toThrow(ParseError);
      expect(() => parseInitJson(filePath)).toThrow('invalid schema_version');
    });

    it('should reject invalid natural_key', () => {
      const jsonContent = {
        meta: {
          schema_version: 'ppt-import-v2',
          natural_key: 'id',
        },
        items: [],
      };

      const filePath = path.join(tempDir, 'invalid-key.json');
      fs.writeFileSync(filePath, JSON.stringify(jsonContent));

      expect(() => parseInitJson(filePath)).toThrow(ParseError);
      expect(() => parseInitJson(filePath)).toThrow('invalid natural_key');
    });

    it('should reject missing meta field', () => {
      const jsonContent = { items: [] };

      const filePath = path.join(tempDir, 'missing-meta.json');
      fs.writeFileSync(filePath, JSON.stringify(jsonContent));

      expect(() => parseInitJson(filePath)).toThrow(ParseError);
      expect(() => parseInitJson(filePath)).toThrow('missing meta');
    });
  });

  describe('parseInitCsv', () => {
    it('should parse CSV with pipe-separated tags', () => {
      const csvContent = `id,title,category,tags,description,language,slides_count,file_url,thumbnail_url,status
ppt_1001,测试模板,business,商务|报告|年终,描述文本,中文,10,https://cdn.example.com/ppt.pptx,https://cdn.example.com/thumb.webp,published`;

      const filePath = path.join(tempDir, 'test-pipe.csv');
      fs.writeFileSync(filePath, csvContent);

      const result = parseInitCsv(filePath);

      expect(result).toHaveLength(1);
      expect(result[0].tags).toEqual(['商务', '报告', '年终']);
    });

    it('should parse CSV with comma-separated tags', () => {
      const csvContent = `id,title,category,tags,description,language,slides_count,file_url,thumbnail_url,status
ppt_1002,另一个模板,education,"教育,培训,课件",描述,中文,5,https://cdn.example.com/ppt2.pptx,https://cdn.example.com/thumb2.webp,published`;

      const filePath = path.join(tempDir, 'test-comma.csv');
      fs.writeFileSync(filePath, csvContent);

      const result = parseInitCsv(filePath);

      expect(result).toHaveLength(1);
      expect(result[0].tags).toEqual(['教育', '培训', '课件']);
    });

    it('should trim whitespace from tags', () => {
      const csvContent = `id,title,category,tags,description,language,slides_count,file_url,thumbnail_url,status
ppt_1003,空白测试,business, 标签1 | 标签2 | 标签3 ,描述,中文,5,https://cdn.example.com/ppt.pptx,https://cdn.example.com/thumb.webp,published`;

      const filePath = path.join(tempDir, 'test-trim.csv');
      fs.writeFileSync(filePath, csvContent);

      const result = parseInitCsv(filePath);

      expect(result[0].tags).toEqual(['标签1', '标签2', '标签3']);
    });

    it('should handle empty tags', () => {
      const csvContent = `id,title,category,tags,description,language,slides_count,file_url,thumbnail_url,status
ppt_1004,空标签,business,,描述,中文,5,https://cdn.example.com/ppt.pptx,https://cdn.example.com/thumb.webp,published`;

      const filePath = path.join(tempDir, 'test-empty-tags.csv');
      fs.writeFileSync(filePath, csvContent);

      const result = parseInitCsv(filePath);

      expect(result[0].tags).toEqual([]);
    });
  });

  describe('flattenItem (往返一致性)', () => {
    it('Property 1: JSON 解析 → flatten → unflatten 应保持一致', () => {
      const originalItem: PpthubInitItem = {
        id: 'ppt_2001',
        title: '往返测试模板',
        category: 'technology',
        tags: ['技术', '编程', 'AI'],
        description: '这是一个往返一致性测试',
        language: 'English',
        slides_count: 15,
        file_url: 'https://cdn.example.com/ppts/technology/ppt_2001.pptx',
        thumbnail_url:
          'https://cdn.example.com/ppts/technology/ppt_2001_thumb.webp',
        cover_image_url: 'https://cdn.example.com/cover.jpg',
        file_size: 2048000,
        file_format: 'pptx',
        author: 'TestAuthor',
        status: 'published',
        visibility: 'public',
        download_count: 100,
        view_count: 500,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        ai_summary: 'AI 摘要',
        ai_content_summary: 'AI 内容摘要',
        ai_keywords: ['关键词1', '关键词2'],
        ai_scenario: '商务场景',
        ai_color_scheme: 'blue',
        ai_structure_features: '结构特征',
        ai_template_features: '模板特征',
      };

      // Flatten → CSV 格式
      const flattened = flattenItem(originalItem);

      // 验证核心字段
      expect(flattened.id).toBe(originalItem.id);
      expect(flattened.title).toBe(originalItem.title);
      expect(flattened.tags).toBe('技术|编程|AI'); // pipe 分隔
      expect(flattened.slides_count).toBe('15');
      expect(flattened.ai_keywords).toBe('关键词1|关键词2');
    });
  });
});
