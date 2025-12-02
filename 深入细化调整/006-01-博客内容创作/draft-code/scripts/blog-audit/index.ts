/**
 * 博客审计脚本主入口
 *
 * 用法：
 * npx tsx 深入细化调整/006-01-博客内容创作/draft-code/scripts/blog-audit/index.ts
 *
 * 迁移说明：
 * - 校验通过后迁移到 scripts/blog-audit/index.ts
 * - 在 package.json 中添加 "blog:audit": "tsx scripts/blog-audit/index.ts"
 */

import * as fs from 'fs';
import * as path from 'path';
import type { IssueType } from '../../config/audit-rules';
import { defaultAuditRules } from '../../config/audit-rules';
import { categoryMapping } from '../../config/category-map';
import {
  analyzeContent,
  extractLocale,
  extractSlug,
  parseMDX,
  scanMDXFiles,
} from './parsers';
import type {
  AuditConfig,
  AuditStats,
  BlogAuditReport,
  BlogAuditResult,
  BlogFrontmatter,
} from './types';

// ============================================================================
// 默认配置
// ============================================================================

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../../..');

const defaultConfig: AuditConfig = {
  sourceDir: path.join(
    PROJECT_ROOT,
    '深入细化调整/006-blogs-seo-博文设计/广告-博文'
  ),
  outputPath: path.join(__dirname, '../../reports/blog-audit-report.json'),
  checkEnglish: true,
  verbose: true,
};

// ============================================================================
// 审计逻辑
// ============================================================================

/**
 * 检查 Frontmatter 问题
 */
function checkFrontmatter(
  frontmatter: BlogFrontmatter,
  stats: AuditStats
): IssueType[] {
  const issues: IssueType[] = [];
  const rules = defaultAuditRules;

  // 标题检查
  if (!frontmatter.title) {
    issues.push('missing_title');
  } else {
    if (stats.titleLen < rules.titleLength.min) {
      issues.push('short_title');
    } else if (stats.titleLen > rules.titleLength.max) {
      issues.push('long_title');
    }
  }

  // 描述检查
  if (!frontmatter.description) {
    issues.push('missing_description');
  } else {
    if (stats.descLen < rules.descLength.min) {
      issues.push('short_desc');
    } else if (stats.descLen > rules.descLength.max) {
      issues.push('long_desc');
    }
  }

  // 封面图检查
  if (!frontmatter.image || frontmatter.image.includes('post-')) {
    issues.push('no_cover');
  }

  // 日期检查
  if (frontmatter.date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(frontmatter.date)) {
      issues.push('bad_date');
    }
  }

  // 分类检查
  if (!frontmatter.categories || frontmatter.categories.length === 0) {
    issues.push('missing_category');
  } else {
    // 检查分类是否在映射表中
    const validCategories = [
      ...Object.keys(categoryMapping),
      ...Object.values(categoryMapping),
    ];
    const hasValidCategory = frontmatter.categories.some((cat) =>
      validCategories.includes(cat)
    );
    if (!hasValidCategory) {
      issues.push('wrong_category');
    }
  }

  // 作者检查
  if (!frontmatter.author) {
    issues.push('missing_author');
  }

  return issues;
}

/**
 * 检查正文内容问题
 */
function checkContent(stats: AuditStats): IssueType[] {
  const issues: IssueType[] = [];
  const rules = defaultAuditRules;

  // H2 检查
  if (stats.h2Count < rules.minH2) {
    issues.push('few_h2');
  }

  // H3 检查
  if (stats.h3Count < rules.minH3) {
    issues.push('few_h3');
  }

  // 内部链接检查
  if (stats.internalLinks === 0) {
    issues.push('no_internal_links');
  } else if (stats.internalLinks < rules.minInternalLinks) {
    issues.push('few_internal_links');
  }

  // 外部链接检查
  if (stats.externalLinks < rules.minExternalLinks) {
    issues.push('no_external_links');
  }

  // 权威引用检查
  if (stats.authorityQuotes === 0) {
    issues.push('no_authoritative_quote');
  } else if (stats.authorityQuotes < rules.minAuthorityQuotes) {
    issues.push('few_authoritative_quotes');
  }

  // 统计数据检查
  if (stats.statsCount === 0) {
    issues.push('no_stats');
  } else if (stats.statsCount < rules.minStats) {
    issues.push('few_stats');
  }

  // 图片检查
  if (stats.images < rules.minImages) {
    issues.push('few_images');
  }

  // 图片 alt 检查
  if (stats.images > 0 && stats.imagesWithAlt < stats.images) {
    issues.push('no_image_alt');
  }

  // FAQ 检查
  if (rules.requireFAQ && !stats.hasFAQ) {
    issues.push('no_faq');
  }

  // 字数检查
  if (stats.wordCount < rules.minWordCount) {
    issues.push('low_word_count');
  }

  return issues;
}

/**
 * 审计单个文件
 */
function auditFile(filePath: string, allFiles: string[]): BlogAuditResult {
  const slug = extractSlug(filePath);
  const locale = extractLocale(filePath);

  // 解析 MDX
  const parsed = parseMDX(filePath);

  if (!parsed.success) {
    return {
      slug,
      locale,
      filePath,
      issues: ['parse_error'],
      stats: {
        wordCount: 0,
        h2Count: 0,
        h3Count: 0,
        internalLinks: 0,
        externalLinks: 0,
        images: 0,
        imagesWithAlt: 0,
        titleLen: 0,
        descLen: 0,
        authorityQuotes: 0,
        statsCount: 0,
        hasFAQ: false,
      },
      frontmatter: {},
      status: 'parse_error',
      mediaStatus: 'missing',
      hasEnglish: false,
    };
  }

  // 分析内容
  const stats = analyzeContent(parsed.content, parsed.frontmatter);

  // 检查问题
  const frontmatterIssues = checkFrontmatter(parsed.frontmatter, stats);
  const contentIssues = checkContent(stats);
  const issues = [...frontmatterIssues, ...contentIssues];

  // 检查是否有英文版本
  let hasEnglish = false;
  if (locale === 'zh') {
    const enFilePath = filePath.replace('.zh.mdx', '.mdx');
    hasEnglish = allFiles.includes(enFilePath);
    if (!hasEnglish) {
      issues.push('missing_en');
    }
  } else {
    hasEnglish = true;
  }

  // 确定媒体状态
  let mediaStatus: 'missing' | 'partial' | 'done' = 'missing';
  if (parsed.frontmatter.image && !parsed.frontmatter.image.includes('post-')) {
    if (stats.images >= 3) {
      mediaStatus = 'done';
    } else {
      mediaStatus = 'partial';
    }
  }

  return {
    slug,
    locale,
    filePath,
    issues,
    stats,
    frontmatter: parsed.frontmatter,
    status: issues.length === 0 ? 'ok' : 'needs_fix',
    mediaStatus,
    hasEnglish,
  };
}

/**
 * 执行审计
 */
async function auditBlogs(config: AuditConfig): Promise<BlogAuditReport> {
  console.log('🔍 开始博客审计...');
  console.log(`📁 源目录: ${config.sourceDir}`);

  // 扫描文件
  const files = scanMDXFiles(config.sourceDir);
  console.log(`📄 找到 ${files.length} 个 MDX 文件`);

  // 只审计中文文件
  const zhFiles = files.filter((f) => f.endsWith('.zh.mdx'));
  console.log(`🇨🇳 中文文件: ${zhFiles.length} 个`);

  // 审计每个文件
  const results: BlogAuditResult[] = [];
  for (const file of zhFiles) {
    if (config.verbose) {
      console.log(`  审计: ${path.basename(file)}`);
    }
    const result = auditFile(file, files);
    results.push(result);
  }

  // 统计 issues
  const issueStats: Partial<Record<IssueType, number>> = {};
  for (const result of results) {
    for (const issue of result.issues) {
      issueStats[issue] = (issueStats[issue] || 0) + 1;
    }
  }

  // 生成报告
  const report: BlogAuditReport = {
    generatedAt: new Date().toISOString(),
    totalFiles: zhFiles.length,
    summary: {
      ok: results.filter((r) => r.status === 'ok').length,
      needsFix: results.filter((r) => r.status === 'needs_fix').length,
      parseError: results.filter((r) => r.status === 'parse_error').length,
      missingEn: results.filter((r) => r.issues.includes('missing_en')).length,
      missingMedia: results.filter((r) => r.mediaStatus === 'missing').length,
    },
    issueStats,
    items: results,
  };

  // 输出报告
  const outputDir = path.dirname(config.outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(config.outputPath, JSON.stringify(report, null, 2), 'utf-8');

  // 打印摘要
  console.log('\n📊 审计摘要:');
  console.log(`  ✅ 通过: ${report.summary.ok}`);
  console.log(`  ⚠️  需修复: ${report.summary.needsFix}`);
  console.log(`  ❌ 解析错误: ${report.summary.parseError}`);
  console.log(`  🌐 缺少英文: ${report.summary.missingEn}`);
  console.log(`  🖼️  缺少媒体: ${report.summary.missingMedia}`);

  console.log('\n📋 Top Issues:');
  const sortedIssues = Object.entries(issueStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [issue, count] of sortedIssues) {
    console.log(`  ${issue}: ${count}`);
  }

  console.log(`\n📄 报告已保存到: ${config.outputPath}`);

  return report;
}

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  const config = { ...defaultConfig };

  // 解析命令行参数
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source' && args[i + 1]) {
      config.sourceDir = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      config.outputPath = args[i + 1];
      i++;
    } else if (args[i] === '--quiet') {
      config.verbose = false;
    }
  }

  try {
    await auditBlogs(config);
  } catch (error) {
    console.error('❌ 审计失败:', error);
    process.exit(1);
  }
}

main();

// 导出供测试使用
export { auditBlogs, auditFile, checkFrontmatter, checkContent };
