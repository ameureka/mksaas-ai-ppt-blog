/**
 * URL Validator 测试
 *
 * Property 4: 远程命名与 URL 前缀不变量
 * Validates: Requirements 7.1, 7.2, 7.3
 */

import { describe, expect, it } from 'vitest';
import {
  buildRemotePaths,
  isShortPublicUrl,
  validatePptUrlPath,
  validateThumbnailUrlPath,
  validateUrlConsistency,
} from './url-validator.js';

describe('URL Validator', () => {
  describe('isShortPublicUrl', () => {
    it('should accept valid HTTPS URL without parameters', () => {
      const result = isShortPublicUrl(
        'https://cdn.example.com/ppts/business/ppt_1001.pptx'
      );
      expect(result.valid).toBe(true);
    });

    it('should reject HTTP URL', () => {
      const result = isShortPublicUrl(
        'http://cdn.example.com/ppts/business/ppt_1001.pptx'
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('HTTPS');
    });

    it('should reject URL with X-Amz-Signature parameter', () => {
      const result = isShortPublicUrl(
        'https://cdn.example.com/ppts/business/ppt_1001.pptx?X-Amz-Signature=abc123'
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('signature parameter');
    });

    it('should reject URL with X-Amz-Credential parameter', () => {
      const result = isShortPublicUrl(
        'https://cdn.example.com/file.pptx?X-Amz-Credential=test'
      );
      expect(result.valid).toBe(false);
    });

    it('should reject URL with token parameter', () => {
      const result = isShortPublicUrl(
        'https://cdn.example.com/file.pptx?token=secret'
      );
      expect(result.valid).toBe(false);
    });

    it('should reject URL with any query parameters', () => {
      const result = isShortPublicUrl(
        'https://cdn.example.com/file.pptx?version=1'
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('query parameters');
    });

    it('should reject invalid URL format', () => {
      const result = isShortPublicUrl('not-a-valid-url');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid URL');
    });
  });

  describe('validatePptUrlPath', () => {
    it('should accept valid PPT path format', () => {
      const result = validatePptUrlPath(
        'https://cdn.example.com/ppts/business/ppt_1001.pptx'
      );
      expect(result.valid).toBe(true);
      expect(result.category).toBe('business');
      expect(result.aid).toBe('1001');
    });

    it('should accept different valid categories', () => {
      const categories = [
        'business',
        'education',
        'technology',
        'design',
        'marketing',
      ];

      for (const cat of categories) {
        const result = validatePptUrlPath(
          `https://cdn.example.com/ppts/${cat}/ppt_2001.pptx`
        );
        expect(result.valid).toBe(true);
        expect(result.category).toBe(cat);
      }
    });

    it('should reject invalid path format', () => {
      const result = validatePptUrlPath(
        'https://cdn.example.com/files/template.pptx'
      );
      expect(result.valid).toBe(false);
    });

    it('should reject invalid category in path', () => {
      const result = validatePptUrlPath(
        'https://cdn.example.com/ppts/invalid_cat/ppt_1001.pptx'
      );
      expect(result.valid).toBe(false);
    });
  });

  describe('validateThumbnailUrlPath', () => {
    it('should accept valid thumbnail path with webp extension', () => {
      const result = validateThumbnailUrlPath(
        'https://cdn.example.com/ppts/business/ppt_1001_thumb.webp'
      );
      expect(result.valid).toBe(true);
      expect(result.category).toBe('business');
      expect(result.aid).toBe('1001');
    });

    it('should accept thumbnail path with jpg extension', () => {
      const result = validateThumbnailUrlPath(
        'https://cdn.example.com/ppts/education/ppt_2001_thumb.jpg'
      );
      expect(result.valid).toBe(true);
    });

    it('should accept thumbnail path with png extension', () => {
      const result = validateThumbnailUrlPath(
        'https://cdn.example.com/ppts/technology/ppt_3001_thumb.png'
      );
      expect(result.valid).toBe(true);
    });

    it('should reject invalid thumbnail path', () => {
      const result = validateThumbnailUrlPath(
        'https://cdn.example.com/images/thumb.jpg'
      );
      expect(result.valid).toBe(false);
    });
  });

  describe('Property 4: buildRemotePaths 远程命名不变量', () => {
    it('should generate correct PPT path format', () => {
      const { pptPath, thumbPath } = buildRemotePaths(1001, 'business');

      expect(pptPath).toBe('ppts/business/ppt_1001.pptx');
      expect(thumbPath).toBe('ppts/business/ppt_1001_thumb.webp');
    });

    it('should work with string aid', () => {
      const { pptPath, thumbPath } = buildRemotePaths('2001', 'education');

      expect(pptPath).toBe('ppts/education/ppt_2001.pptx');
      expect(thumbPath).toBe('ppts/education/ppt_2001_thumb.webp');
    });

    it('should maintain consistent category in both paths', () => {
      const categories = [
        'business',
        'education',
        'technology',
        'design',
        'marketing',
        'hr',
        'medical',
        'finance',
      ] as const;

      for (const category of categories) {
        const { pptPath, thumbPath } = buildRemotePaths(9999, category);

        expect(pptPath).toContain(`/${category}/`);
        expect(thumbPath).toContain(`/${category}/`);
      }
    });
  });

  describe('validateUrlConsistency', () => {
    it('should pass when file_url and thumbnail_url have same category and aid', () => {
      const result = validateUrlConsistency(
        'https://cdn.example.com/ppts/business/ppt_1001.pptx',
        'https://cdn.example.com/ppts/business/ppt_1001_thumb.webp'
      );
      expect(result.valid).toBe(true);
    });

    it('should fail when categories mismatch', () => {
      const result = validateUrlConsistency(
        'https://cdn.example.com/ppts/business/ppt_1001.pptx',
        'https://cdn.example.com/ppts/education/ppt_1001_thumb.webp'
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Category mismatch');
    });

    it('should fail when aids mismatch', () => {
      const result = validateUrlConsistency(
        'https://cdn.example.com/ppts/business/ppt_1001.pptx',
        'https://cdn.example.com/ppts/business/ppt_2001_thumb.webp'
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('AID mismatch');
    });

    it('should skip check for non-standard URL formats', () => {
      // 非标准格式时跳过检查，返回 valid
      const result = validateUrlConsistency(
        'https://cdn.example.com/files/template.pptx',
        'https://cdn.example.com/images/thumb.jpg'
      );
      expect(result.valid).toBe(true);
    });
  });
});
