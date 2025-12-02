/**
 * 博客修复脚本
 *
 * 功能：
 * - 修复 Frontmatter（分类、日期、封面图路径）
 * - 自动生成 tags 和 seoKeywords
 * - 自动推荐 relatedPosts
 * - 修复正文内容（内部链接、权威引用、FAQ、CTA）
 *
 * 迁移说明：
 * - 校验通过后迁移到 scripts/blog-fix/
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import {
  type CategoryStyle,
  categoryMapping,
  categoryStyles,
  pptCategoryToSlug,
} from '../../config/category-map';

// 路径配置
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../../..');
const DRAFT_CODE_ROOT = path.resolve(__dirname, '../..');

// 加载 image-tasks.json 获取 slug 映射
let slugMapping: Record<string, string> = {};
try {
  const tasksPath = path.join(DRAFT_CODE_ROOT, 'data/image-tasks.json');
  if (fs.existsSync(tasksPath)) {
    const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
    for (const task of tasksData.tasks) {
      // 从文件名提取中文标题作为 key
      slugMapping[task.title] = task.slug;
    }
  }
} catch (e) {
  console.warn('⚠️ 无法加载 image-tasks.json，将使用文件名作为 slug');
}

// ============================================================================
// 类型定义
// ============================================================================

export type FixType =
  | 'fix-category'
  | 'fix-date'
  | 'fix-image'
  | 'fix-tags'
  | 'fix-keywords'
  | 'fix-related'
  | 'fix-internal-links'
  | 'fix-authority'
  | 'fix-faq'
  | 'fix-cta'
  | 'fix-all';

export interface FixConfig {
  /** 博客内容目录 */
  contentDir: string;
  /** 输出目录（修复后的文件） */
  outputDir: string;
  /** 修复类型 */
  fixTypes: FixType[];
  /** 是否覆盖原文件 */
  overwrite: boolean;
  /** 是否生成备份 */
  backup: boolean;
  /** 是否 dry-run（只输出不写入） */
  dryRun: boolean;
}

export interface FixResult {
  /** 文件路径 */
  filePath: string;
  /** 文件 slug */
  slug: string;
  /** 是否成功 */
  success: boolean;
  /** 应用的修复 */
  appliedFixes: AppliedFix[];
  /** 错误信息 */
  error?: string;
}

export interface AppliedFix {
  /** 修复类型 */
  type: FixType;
  /** 修复前的值 */
  before: string | string[] | undefined;
  /** 修复后的值 */
  after: string | string[];
  /** 修复说明 */
  description: string;
}

export interface BlogFrontmatter {
  title: string;
  description: string;
  date: string;
  image?: string;
  categories?: string[];
  tags?: string[];
  seoKeywords?: string[];
  relatedPosts?: string[];
  published?: boolean;
  author?: string;
}

export interface BlogFile {
  filePath: string;
  slug: string;
  frontmatter: BlogFrontmatter;
  content: string;
  rawContent: string;
}

// ============================================================================
// 默认配置
// ============================================================================

export const defaultFixConfig: FixConfig = {
  contentDir: path.join(PROJECT_ROOT, '深入细化调整/006-blogs-seo-博文设计/广告-博文'),
  outputDir: path.join(PROJECT_ROOT, '深入细化调整/006-blogs-seo-博文设计/广告-博文'),
  fixTypes: ['fix-all'],
  overwrite: true,
  backup: true,
  dryRun: false,
};

// ============================================================================
// 文件读写工具
// ============================================================================

/**
 * 扫描目录下的所有 MDX 文件
 */
export function scanMdxFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanMdxFiles(fullPath));
    } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * 解析 MDX 文件
 */
export function parseMdxFile(filePath: string): BlogFile | null {
  try {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(rawContent);
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // 优先使用 image-tasks.json 中的英文 slug
    const title = (data as BlogFrontmatter).title || '';
    let slug = slugMapping[title];
    
    // 如果没有映射，使用文件名（去掉 .zh 后缀）
    if (!slug) {
      slug = fileName.replace(/\.zh$/, '');
    }

    return {
      filePath,
      slug,
      frontmatter: data as BlogFrontmatter,
      content,
      rawContent,
    };
  } catch (error) {
    console.error(`解析文件失败: ${filePath}`, error);
    return null;
  }
}

/**
 * 序列化并写入 MDX 文件
 */
export function writeMdxFile(
  filePath: string,
  frontmatter: BlogFrontmatter,
  content: string,
  backup = true
): boolean {
  try {
    if (backup && fs.existsSync(filePath)) {
      const backupPath = `${filePath}.bak`;
      fs.copyFileSync(filePath, backupPath);
    }
    const output = matter.stringify(content, frontmatter);
    fs.writeFileSync(filePath, output, 'utf-8');
    return true;
  } catch (error) {
    console.error(`写入文件失败: ${filePath}`, error);
    return false;
  }
}

// ============================================================================
// 分类修复
// ============================================================================

// 目录名到分类 slug 的映射
const dirToCategorySlug: Record<string, string> = {
  '产品营销与营销方案PPT': 'marketing',
  '商务汇报PPT': 'business',
  '年终总结PPT': 'year-end',
  '教育培训与课件PPT': 'education',
  '述职报告PPT': 'report',
  '项目提案PPT': 'proposal',
  '通用与混合场景': 'general',
  '付费模板搜索与产品视角': 'paid-search',
};

/**
 * 从文件路径推断分类
 */
function inferCategoryFromPath(filePath: string): string | null {
  for (const [dirName, slug] of Object.entries(dirToCategorySlug)) {
    if (filePath.includes(dirName)) {
      return slug;
    }
  }
  return null;
}

/**
 * 修复分类：将中文分类或错误分类转换为正确的英文 slug
 */
export function fixCategory(
  frontmatter: BlogFrontmatter,
  slug: string,
  filePath: string = ''
): AppliedFix | null {
  const currentCategories = frontmatter.categories || [];
  const validSlugs = Object.keys(categoryStyles);

  // 首先尝试从文件路径推断分类
  const inferredCategory = inferCategoryFromPath(filePath);
  
  // 检查是否需要修复
  const needsFix = currentCategories.some((cat) => !validSlugs.includes(cat)) || currentCategories.length === 0;
  if (!needsFix && currentCategories.length > 0) return null;

  // 如果能从路径推断，优先使用
  if (inferredCategory) {
    frontmatter.categories = [inferredCategory];
    return {
      type: 'fix-category',
      before: currentCategories,
      after: [inferredCategory],
      description: `分类从 [${currentCategories.join(', ')}] 修复为 [${inferredCategory}]（根据目录推断）`,
    };
  }

  // 尝试从中文映射
  const fixedCategories: string[] = [];
  for (const cat of currentCategories) {
    if (validSlugs.includes(cat)) {
      fixedCategories.push(cat);
    } else if (categoryMapping[cat]) {
      fixedCategories.push(categoryMapping[cat]);
    } else if (pptCategoryToSlug[cat]) {
      fixedCategories.push(pptCategoryToSlug[cat]);
    } else {
      // 默认使用 general
      fixedCategories.push('general');
    }
  }

  // 如果没有分类，默认 general
  if (fixedCategories.length === 0) {
    fixedCategories.push('general');
  }

  frontmatter.categories = fixedCategories;

  return {
    type: 'fix-category',
    before: currentCategories,
    after: fixedCategories,
    description: `分类从 [${currentCategories.join(', ')}] 修复为 [${fixedCategories.join(', ')}]`,
  };
}

// ============================================================================
// 日期修复
// ============================================================================

/**
 * 修复日期格式为 YYYY-MM-DD
 */
export function fixDate(frontmatter: BlogFrontmatter): AppliedFix | null {
  const currentDate = frontmatter.date;
  if (!currentDate) {
    const today = new Date().toISOString().split('T')[0];
    frontmatter.date = today;
    return {
      type: 'fix-date',
      before: undefined,
      after: today,
      description: `日期从空设置为 ${today}`,
    };
  }

  // 检查格式是否正确
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateRegex.test(currentDate)) return null;

  // 尝试解析并格式化
  try {
    const parsed = new Date(currentDate);
    if (Number.isNaN(parsed.getTime())) {
      const today = new Date().toISOString().split('T')[0];
      frontmatter.date = today;
      return {
        type: 'fix-date',
        before: currentDate,
        after: today,
        description: `无效日期 ${currentDate} 修复为 ${today}`,
      };
    }
    const fixed = parsed.toISOString().split('T')[0];
    frontmatter.date = fixed;
    return {
      type: 'fix-date',
      before: currentDate,
      after: fixed,
      description: `日期格式从 ${currentDate} 修复为 ${fixed}`,
    };
  } catch {
    const today = new Date().toISOString().split('T')[0];
    frontmatter.date = today;
    return {
      type: 'fix-date',
      before: currentDate,
      after: today,
      description: `日期解析失败，设置为 ${today}`,
    };
  }
}

// ============================================================================
// 封面图路径修复
// ============================================================================

/**
 * 修复封面图路径为 /images/blog/{slug}-cover.jpg
 */
export function fixImagePath(
  frontmatter: BlogFrontmatter,
  slug: string
): AppliedFix | null {
  const currentImage = frontmatter.image;
  const expectedImage = `/images/blog/${slug}-cover.jpg`;

  // 检查是否是占位图或空
  const isPlaceholder =
    !currentImage ||
    currentImage.includes('post-') ||
    currentImage.includes('placeholder');

  if (!isPlaceholder && currentImage === expectedImage) return null;

  frontmatter.image = expectedImage;

  return {
    type: 'fix-image',
    before: currentImage,
    after: expectedImage,
    description: `封面图从 ${currentImage || '空'} 修复为 ${expectedImage}`,
  };
}

// ============================================================================
// Tags 自动生成
// ============================================================================

/**
 * 根据标题和分类自动生成 tags
 */
export function fixTags(
  frontmatter: BlogFrontmatter,
  content: string
): AppliedFix | null {
  const currentTags = frontmatter.tags || [];
  if (currentTags.length >= 2) return null;

  const title = frontmatter.title || '';
  const categories = frontmatter.categories || [];

  // 从标题提取关键词
  const keywords: string[] = [];

  // PPT 相关关键词
  const pptKeywords = [
    'PPT',
    '模板',
    '设计',
    '制作',
    '技巧',
    '汇报',
    '总结',
    '述职',
    '培训',
    '营销',
    '提案',
    '方案',
  ];
  for (const kw of pptKeywords) {
    if (title.includes(kw) && !keywords.includes(kw)) {
      keywords.push(kw);
    }
  }

  // 从分类添加
  for (const cat of categories) {
    const style = categoryStyles[cat];
    if (style && !keywords.includes(style.name)) {
      keywords.push(style.name);
    }
  }

  // 限制 2-5 个
  const newTags = [...new Set([...currentTags, ...keywords])].slice(0, 5);
  if (newTags.length === currentTags.length) return null;

  frontmatter.tags = newTags;

  return {
    type: 'fix-tags',
    before: currentTags,
    after: newTags,
    description: `tags 从 [${currentTags.join(', ')}] 扩展为 [${newTags.join(', ')}]`,
  };
}

// ============================================================================
// SEO Keywords 自动生成
// ============================================================================

/**
 * 根据标题和内容提取 SEO 关键词
 */
export function fixSeoKeywords(
  frontmatter: BlogFrontmatter,
  content: string
): AppliedFix | null {
  const currentKeywords = frontmatter.seoKeywords || [];
  if (currentKeywords.length >= 3) return null;

  const title = frontmatter.title || '';

  // SEO 关键词提取
  const seoKeywords: string[] = [];

  // 从标题提取长尾关键词
  if (title.includes('PPT')) seoKeywords.push('PPT模板');
  if (title.includes('汇报')) seoKeywords.push('工作汇报PPT');
  if (title.includes('总结')) seoKeywords.push('年终总结PPT');
  if (title.includes('述职')) seoKeywords.push('述职报告PPT');
  if (title.includes('培训')) seoKeywords.push('培训课件PPT');
  if (title.includes('营销')) seoKeywords.push('营销方案PPT');
  if (title.includes('提案')) seoKeywords.push('项目提案PPT');
  if (title.includes('设计')) seoKeywords.push('PPT设计技巧');
  if (title.includes('制作')) seoKeywords.push('PPT制作教程');

  const newKeywords = [...new Set([...currentKeywords, ...seoKeywords])].slice(
    0,
    5
  );
  if (newKeywords.length === currentKeywords.length) return null;

  frontmatter.seoKeywords = newKeywords;

  return {
    type: 'fix-keywords',
    before: currentKeywords,
    after: newKeywords,
    description: `seoKeywords 从 [${currentKeywords.join(', ')}] 扩展为 [${newKeywords.join(', ')}]`,
  };
}

// ============================================================================
// Related Posts 自动推荐
// ============================================================================

/**
 * 根据同分类文章推荐相关文章
 */
export function fixRelatedPosts(
  frontmatter: BlogFrontmatter,
  slug: string,
  allFiles: BlogFile[]
): AppliedFix | null {
  const currentRelated = frontmatter.relatedPosts || [];
  if (currentRelated.length >= 2) return null;

  const categories = frontmatter.categories || [];

  // 找同分类的文章
  const sameCategoryFiles = allFiles.filter(
    (f) =>
      f.slug !== slug &&
      f.frontmatter.categories?.some((c) => categories.includes(c))
  );

  // 随机选择 2-3 篇
  const shuffled = sameCategoryFiles.sort(() => Math.random() - 0.5);
  const recommended = shuffled.slice(0, 3).map((f) => f.slug);

  const newRelated = [...new Set([...currentRelated, ...recommended])].slice(
    0,
    3
  );
  if (newRelated.length === currentRelated.length) return null;

  frontmatter.relatedPosts = newRelated;

  return {
    type: 'fix-related',
    before: currentRelated,
    after: newRelated,
    description: `relatedPosts 从 [${currentRelated.join(', ')}] 扩展为 [${newRelated.join(', ')}]`,
  };
}

// ============================================================================
// 主修复函数
// ============================================================================

/**
 * 修复单个文件
 */
export function fixBlogFile(
  file: BlogFile,
  config: FixConfig,
  allFiles: BlogFile[]
): FixResult {
  const appliedFixes: AppliedFix[] = [];
  const { frontmatter, content, slug } = file;
  const fixTypes = config.fixTypes.includes('fix-all')
    ? [
        'fix-category',
        'fix-date',
        'fix-image',
        'fix-tags',
        'fix-keywords',
        'fix-related',
      ]
    : config.fixTypes;

  try {
    // 应用各种修复
    if (fixTypes.includes('fix-category')) {
      const fix = fixCategory(frontmatter, slug, file.filePath);
      if (fix) appliedFixes.push(fix);
    }

    if (fixTypes.includes('fix-date')) {
      const fix = fixDate(frontmatter);
      if (fix) appliedFixes.push(fix);
    }

    if (fixTypes.includes('fix-image')) {
      const fix = fixImagePath(frontmatter, slug);
      if (fix) appliedFixes.push(fix);
    }

    if (fixTypes.includes('fix-tags')) {
      const fix = fixTags(frontmatter, content);
      if (fix) appliedFixes.push(fix);
    }

    if (fixTypes.includes('fix-keywords')) {
      const fix = fixSeoKeywords(frontmatter, content);
      if (fix) appliedFixes.push(fix);
    }

    if (fixTypes.includes('fix-related')) {
      const fix = fixRelatedPosts(frontmatter, slug, allFiles);
      if (fix) appliedFixes.push(fix);
    }

    // 写入文件（如果不是 dry-run）
    if (!config.dryRun && appliedFixes.length > 0) {
      const outputPath = config.overwrite
        ? file.filePath
        : path.join(config.outputDir, path.basename(file.filePath));

      writeMdxFile(outputPath, frontmatter, content, config.backup);
    }

    return {
      filePath: file.filePath,
      slug,
      success: true,
      appliedFixes,
    };
  } catch (error) {
    return {
      filePath: file.filePath,
      slug,
      success: false,
      appliedFixes,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// 批量修复
// ============================================================================

export interface BatchFixResult {
  totalFiles: number;
  fixedFiles: number;
  failedFiles: number;
  totalFixes: number;
  fixesByType: Record<string, number>;
  results: FixResult[];
}

/**
 * 批量修复所有博客文件
 */
export function batchFixBlogFiles(
  config: Partial<FixConfig> = {}
): BatchFixResult {
  const fullConfig: FixConfig = { ...defaultFixConfig, ...config };

  // 扫描所有文件
  const filePaths = scanMdxFiles(fullConfig.contentDir);
  const allFiles: BlogFile[] = [];

  for (const filePath of filePaths) {
    const file = parseMdxFile(filePath);
    if (file) allFiles.push(file);
  }

  // 修复每个文件
  const results: FixResult[] = [];
  for (const file of allFiles) {
    const result = fixBlogFile(file, fullConfig, allFiles);
    results.push(result);
  }

  // 统计
  const fixesByType: Record<string, number> = {};
  let totalFixes = 0;

  for (const result of results) {
    for (const fix of result.appliedFixes) {
      fixesByType[fix.type] = (fixesByType[fix.type] || 0) + 1;
      totalFixes++;
    }
  }

  return {
    totalFiles: allFiles.length,
    fixedFiles: results.filter((r) => r.appliedFixes.length > 0).length,
    failedFiles: results.filter((r) => !r.success).length,
    totalFixes,
    fixesByType,
    results,
  };
}

// ============================================================================
// CLI 入口
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const config: Partial<FixConfig> = {
    dryRun: args.includes('--dry-run'),
    overwrite: args.includes('--overwrite'),
    backup: !args.includes('--no-backup'),
  };

  // 解析 --type 参数
  const typeIndex = args.indexOf('--type');
  if (typeIndex !== -1 && args[typeIndex + 1]) {
    config.fixTypes = [args[typeIndex + 1] as FixType];
  }

  // 解析 --content-dir 参数
  const contentDirIndex = args.indexOf('--content-dir');
  if (contentDirIndex !== -1 && args[contentDirIndex + 1]) {
    config.contentDir = args[contentDirIndex + 1];
  }

  console.log('🔧 博客修复脚本');
  console.log('配置:', JSON.stringify(config, null, 2));
  console.log('');

  const result = batchFixBlogFiles(config);

  console.log('📊 修复结果:');
  console.log(`  总文件数: ${result.totalFiles}`);
  console.log(`  已修复: ${result.fixedFiles}`);
  console.log(`  失败: ${result.failedFiles}`);
  console.log(`  总修复数: ${result.totalFixes}`);
  console.log('');
  console.log('按类型统计:');
  for (const [type, count] of Object.entries(result.fixesByType)) {
    console.log(`  ${type}: ${count}`);
  }

  // 输出详细结果到 JSON
  const reportPath = path.join(DRAFT_CODE_ROOT, 'reports/blog-fix-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\n📄 详细报告已保存到: ${reportPath}`);
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}
