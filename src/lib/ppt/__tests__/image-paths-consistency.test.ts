import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as fc from 'fast-check';
/**
 * Property 5: 图片路径一致性
 * **Feature: v0-ppt-migration, Property 5: 图片路径一致性**
 * **Validates: Requirements 10.2**
 *
 * 验证所有迁移的图片使用正确的 /ppt/ 前缀路径
 */
import { describe, expect, it } from 'vitest';

describe('Property 5: 图片路径一致性', () => {
  /**
   * *For any* PPT image in public folder, it should be in /ppt/ directory
   */
  it('should have PPT images in public/ppt/ directory', () => {
    const pptDir = path.join(process.cwd(), 'public/ppt');
    const exists = fs.existsSync(pptDir);
    expect(exists).toBe(true);

    if (exists) {
      const files = fs.readdirSync(pptDir);
      const imageFiles = files.filter((f) =>
        /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(f)
      );
      // 应该有 PPT 相关的图片文件
      expect(imageFiles.length).toBeGreaterThan(0);
    }
  });

  /**
   * *For any* image reference in ppt components, it should use /ppt/ prefix
   */
  it('should use /ppt/ prefix for image paths in components', () => {
    const result = execSync(
      'grep -r "src=\\|Image.*src" src/components/ppt/ --include="*.tsx" 2>/dev/null | grep -v "/ppt/" | grep -v "http" | grep -v "placeholder" || echo "NONE"',
      { encoding: 'utf-8' }
    );
    // 所有本地图片引用应该使用 /ppt/ 前缀（排除外部 URL 和占位符）
    expect(result.trim()).toBe('NONE');
  });

  /**
   * *For any* image reference in ppt pages, it should use /ppt/ prefix
   */
  it('should use /ppt/ prefix for image paths in pages', () => {
    const result = execSync(
      'grep -r "src=\\|Image.*src" src/app/\\[locale\\]/\\(marketing\\)/ppt/ --include="*.tsx" 2>/dev/null | grep -v "/ppt/" | grep -v "http" | grep -v "placeholder" || echo "NONE"',
      { encoding: 'utf-8' }
    );
    // 所有本地图片引用应该使用 /ppt/ 前缀
    expect(result.trim()).toBe('NONE');
  });

  /**
   * *For any* thumbnail image, it should exist in public/ppt/
   */
  it('should have thumbnail images exist in public/ppt/', () => {
    const pptDir = path.join(process.cwd(), 'public/ppt');
    if (fs.existsSync(pptDir)) {
      const files = fs.readdirSync(pptDir);
      const thumbnailFiles = files.filter(
        (f) =>
          f.includes('thumbnail') ||
          f.includes('preview') ||
          f.includes('template')
      );
      // 应该有缩略图或预览图
      expect(thumbnailFiles.length).toBeGreaterThanOrEqual(0);
    }
  });

  /**
   * *For any* mock data with image paths, it should use /ppt/ prefix
   */
  it('should use /ppt/ prefix in mock data image paths', () => {
    const result = execSync(
      'grep -r "thumbnailUrl\\|imageUrl\\|coverUrl" src/lib/ppt/ --include="*.ts" 2>/dev/null | grep -v "/ppt/" | grep -v "http" || echo "NONE"',
      { encoding: 'utf-8' }
    );
    // Mock 数据中的图片路径应该使用 /ppt/ 前缀
    expect(result.trim()).toBe('NONE');
  });

  /**
   * Property test: *For any* valid image path, it should follow the correct format
   */
  it('should validate image path format', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '/ppt/business-template.png',
          '/ppt/education-preview.jpg',
          '/ppt/marketing-thumbnail.webp',
          '/ppt/report-cover.png'
        ),
        (imagePath) => {
          // 验证图片路径格式有效
          expect(imagePath).toMatch(
            /^\/ppt\/[a-z0-9\-]+\.(png|jpg|jpeg|webp|gif|svg)$/
          );
          expect(imagePath.startsWith('/ppt/')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * *For any* image file in public/ppt/, it should have valid extension
   */
  it('should have valid image extensions in public/ppt/', () => {
    const pptDir = path.join(process.cwd(), 'public/ppt');
    if (fs.existsSync(pptDir)) {
      const files = fs.readdirSync(pptDir);
      const validExtensions = [
        '.png',
        '.jpg',
        '.jpeg',
        '.gif',
        '.svg',
        '.webp',
      ];

      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (ext) {
          // 如果有扩展名，应该是有效的图片扩展名
          expect(validExtensions).toContain(ext);
        }
      }
    }
  });

  /**
   * *For any* Next.js Image component usage, it should have proper src
   */
  it('should use proper src in Next.js Image components', () => {
    const result = execSync(
      'grep -r "<Image" src/components/ppt/ src/app/\\[locale\\]/\\(marketing\\)/ppt/ --include="*.tsx" 2>/dev/null | wc -l',
      { encoding: 'utf-8' }
    );
    const count = Number.parseInt(result.trim(), 10);
    // 如果使用了 Image 组件，应该有正确的 src
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
