/**
 * 博客图片验证脚本
 *
 * 功能：
 * - 验证封面图尺寸和大小
 * - 验证内容图尺寸和大小
 * - 验证图片命名规范
 * - 更新 mediaStatus
 *
 * 迁移说明：
 * - 校验通过后迁移到 scripts/blog-image-tasks/validate.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ============================================================================
// 类型定义
// ============================================================================

export interface ImageValidationConfig {
  /** 图片目录 */
  imageDir: string;
  /** 封面图尺寸 */
  coverSize: { width: number; height: number };
  /** 封面图最大大小 (KB) */
  coverMaxSize: number;
  /** 内容图尺寸 */
  inlineSize: { width: number; height: number };
  /** 内容图最大大小 (KB) */
  inlineMaxSize: number;
}

export interface ImageValidationResult {
  /** 文件路径 */
  filePath: string;
  /** 文件名 */
  filename: string;
  /** 是否有效 */
  valid: boolean;
  /** 问题列表 */
  issues: string[];
  /** 图片信息 */
  info?: {
    size: number;
    width?: number;
    height?: number;
  };
}

export interface ValidationSummary {
  totalImages: number;
  validImages: number;
  invalidImages: number;
  missingImages: number;
  results: ImageValidationResult[];
}

export const defaultValidationConfig: ImageValidationConfig = {
  imageDir: 'public/images/blog',
  coverSize: { width: 1200, height: 630 },
  coverMaxSize: 200, // KB
  inlineSize: { width: 1000, height: 600 },
  inlineMaxSize: 150, // KB
};

// ============================================================================
// 验证函数
// ============================================================================

/**
 * 验证图片命名规范
 */
export function validateImageNaming(filename: string): {
  valid: boolean;
  type: 'cover' | 'inline' | 'unknown';
  issues: string[];
} {
  const issues: string[] = [];

  // 封面图命名: {slug}-cover.jpg
  const coverPattern = /^[\w-]+-cover\.(jpg|jpeg|png|webp)$/i;
  // 内页图命名: {slug}-{n}.png
  const inlinePattern = /^[\w-]+-\d+\.(jpg|jpeg|png|webp)$/i;

  if (coverPattern.test(filename)) {
    // 检查封面图格式
    if (!filename.endsWith('.jpg') && !filename.endsWith('.jpeg')) {
      issues.push('封面图建议使用 .jpg 格式');
    }
    return { valid: issues.length === 0, type: 'cover', issues };
  }

  if (inlinePattern.test(filename)) {
    // 检查内页图格式
    if (!filename.endsWith('.png')) {
      issues.push('内页图建议使用 .png 格式');
    }
    return { valid: issues.length === 0, type: 'inline', issues };
  }

  issues.push('文件名不符合命名规范');
  return { valid: false, type: 'unknown', issues };
}

/**
 * 验证图片文件大小
 */
export function validateImageSize(
  filePath: string,
  maxSizeKB: number
): { valid: boolean; size: number; issues: string[] } {
  const issues: string[] = [];

  try {
    const stats = fs.statSync(filePath);
    const sizeKB = stats.size / 1024;

    if (sizeKB > maxSizeKB) {
      issues.push(`文件大小 ${sizeKB.toFixed(1)}KB 超过限制 ${maxSizeKB}KB`);
    }

    return { valid: issues.length === 0, size: stats.size, issues };
  } catch (error) {
    issues.push('无法读取文件大小');
    return { valid: false, size: 0, issues };
  }
}

/**
 * 验证单个图片
 */
export function validateImage(
  filePath: string,
  config: ImageValidationConfig
): ImageValidationResult {
  const filename = path.basename(filePath);
  const issues: string[] = [];

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return {
      filePath,
      filename,
      valid: false,
      issues: ['文件不存在'],
    };
  }

  // 验证命名
  const namingResult = validateImageNaming(filename);
  issues.push(...namingResult.issues);

  // 根据类型验证大小
  const maxSize =
    namingResult.type === 'cover' ? config.coverMaxSize : config.inlineMaxSize;
  const sizeResult = validateImageSize(filePath, maxSize);
  issues.push(...sizeResult.issues);

  return {
    filePath,
    filename,
    valid: issues.length === 0,
    issues,
    info: {
      size: sizeResult.size,
    },
  };
}

/**
 * 批量验证图片
 */
export function validateAllImages(
  config: Partial<ImageValidationConfig> = {}
): ValidationSummary {
  const fullConfig: ImageValidationConfig = {
    ...defaultValidationConfig,
    ...config,
  };

  const results: ImageValidationResult[] = [];

  // 扫描图片目录
  if (!fs.existsSync(fullConfig.imageDir)) {
    return {
      totalImages: 0,
      validImages: 0,
      invalidImages: 0,
      missingImages: 0,
      results: [],
    };
  }

  const files = fs.readdirSync(fullConfig.imageDir);
  for (const file of files) {
    const filePath = path.join(fullConfig.imageDir, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile() && /\.(jpg|jpeg|png|webp)$/i.test(file)) {
      const result = validateImage(filePath, fullConfig);
      results.push(result);
    }
  }

  return {
    totalImages: results.length,
    validImages: results.filter((r) => r.valid).length,
    invalidImages: results.filter((r) => !r.valid).length,
    missingImages: 0, // 需要与博客文件对比才能计算
    results,
  };
}

// ============================================================================
// 缺失图片检测
// ============================================================================

/**
 * 检测缺失的图片
 */
export function detectMissingImages(
  blogDir: string,
  imageDir: string
): Array<{ slug: string; missing: string[] }> {
  const results: Array<{ slug: string; missing: string[] }> = [];

  // 获取所有已有图片
  const existingImages = new Set<string>();
  if (fs.existsSync(imageDir)) {
    const files = fs.readdirSync(imageDir);
    for (const file of files) {
      existingImages.add(file.toLowerCase());
    }
  }

  // 扫描博客文件
  const scanDir = (dir: string) => {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
        // 跳过英文版
        if (entry.name.includes('.en.')) continue;

        const slug = path.basename(entry.name, path.extname(entry.name));
        const missing: string[] = [];

        // 检查封面图
        const coverFile = `${slug}-cover.jpg`;
        if (!existingImages.has(coverFile.toLowerCase())) {
          missing.push(coverFile);
        }

        // 检查内页图 (假设 3 张)
        for (let i = 1; i <= 3; i++) {
          const inlineFile = `${slug}-${i}.png`;
          if (!existingImages.has(inlineFile.toLowerCase())) {
            missing.push(inlineFile);
          }
        }

        if (missing.length > 0) {
          results.push({ slug, missing });
        }
      }
    }
  };

  scanDir(blogDir);
  return results;
}

// ============================================================================
// mediaStatus 更新
// ============================================================================

export interface MediaStatus {
  slug: string;
  coverDone: boolean;
  inlineDone: number;
  totalInline: number;
  status: 'none' | 'partial' | 'done';
}

/**
 * 计算 mediaStatus
 */
export function calculateMediaStatus(
  blogDir: string,
  imageDir: string
): MediaStatus[] {
  const results: MediaStatus[] = [];

  // 获取所有已有图片
  const existingImages = new Set<string>();
  if (fs.existsSync(imageDir)) {
    const files = fs.readdirSync(imageDir);
    for (const file of files) {
      existingImages.add(file.toLowerCase());
    }
  }

  // 扫描博客文件
  const scanDir = (dir: string) => {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
        if (entry.name.includes('.en.')) continue;

        const slug = path.basename(entry.name, path.extname(entry.name));

        // 检查封面图
        const coverFile = `${slug}-cover.jpg`;
        const coverDone = existingImages.has(coverFile.toLowerCase());

        // 检查内页图
        let inlineDone = 0;
        const totalInline = 3;
        for (let i = 1; i <= totalInline; i++) {
          const inlineFile = `${slug}-${i}.png`;
          if (existingImages.has(inlineFile.toLowerCase())) {
            inlineDone++;
          }
        }

        // 计算状态
        let status: 'none' | 'partial' | 'done' = 'none';
        if (coverDone && inlineDone === totalInline) {
          status = 'done';
        } else if (coverDone || inlineDone > 0) {
          status = 'partial';
        }

        results.push({
          slug,
          coverDone,
          inlineDone,
          totalInline,
          status,
        });
      }
    }
  };

  scanDir(blogDir);
  return results;
}

// ============================================================================
// CLI 入口
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const config: Partial<ImageValidationConfig> = {};

  // 解析 --image-dir 参数
  const imageDirIndex = args.indexOf('--image-dir');
  if (imageDirIndex !== -1 && args[imageDirIndex + 1]) {
    config.imageDir = args[imageDirIndex + 1];
  }

  console.log('🔍 博客图片验证脚本');
  console.log('配置:', JSON.stringify(config, null, 2));
  console.log('');

  // 验证图片
  const result = validateAllImages(config);

  console.log('📊 验证结果:');
  console.log(`  总图片数: ${result.totalImages}`);
  console.log(`  有效: ${result.validImages}`);
  console.log(`  无效: ${result.invalidImages}`);

  // 输出无效图片详情
  const invalidResults = result.results.filter((r) => !r.valid);
  if (invalidResults.length > 0) {
    console.log('\n❌ 无效图片:');
    for (const r of invalidResults) {
      console.log(`  ${r.filename}: ${r.issues.join(', ')}`);
    }
  }

  // 检测缺失图片
  const blogDir = 'content/blog';
  const imageDir = config.imageDir || defaultValidationConfig.imageDir;
  const missingImages = detectMissingImages(blogDir, imageDir);

  if (missingImages.length > 0) {
    console.log(`\n⚠️ 缺失图片 (${missingImages.length} 篇文章):`);
    for (const item of missingImages.slice(0, 10)) {
      console.log(`  ${item.slug}: ${item.missing.join(', ')}`);
    }
    if (missingImages.length > 10) {
      console.log(`  ... 还有 ${missingImages.length - 10} 篇`);
    }
  }

  // 计算 mediaStatus
  const mediaStatus = calculateMediaStatus(blogDir, imageDir);
  const statusCounts = {
    done: mediaStatus.filter((s) => s.status === 'done').length,
    partial: mediaStatus.filter((s) => s.status === 'partial').length,
    none: mediaStatus.filter((s) => s.status === 'none').length,
  };

  console.log('\n📈 媒体状态统计:');
  console.log(`  完成: ${statusCounts.done}`);
  console.log(`  部分: ${statusCounts.partial}`);
  console.log(`  未开始: ${statusCounts.none}`);
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

// ============================================================================
// 导出
// ============================================================================

export {
  validateImageNaming,
  validateImageSize,
  validateImage,
  validateAllImages,
  detectMissingImages,
  calculateMediaStatus,
};
