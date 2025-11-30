/**
 * 博客验收检查脚本
 *
 * 功能：
 * - 检查核心 issues 是否清零
 * - 检查中英文文件配对
 * - 检查图片可用性
 * - 运行构建验证
 *
 * 迁移说明：
 * - 校验通过后迁移到 scripts/blog-validate/
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import matter from 'gray-matter';
import { categoryStyles } from '../../config/category-map';

// ============================================================================
// 类型定义
// ============================================================================

export interface ValidationConfig {
  /** 博客内容目录 */
  contentDir: string;
  /** 图片目录 */
  imageDir: string;
  /** 是否运行构建验证 */
  runBuild: boolean;
}

export interface ValidationResult {
  /** 是否通过 */
  passed: boolean;
  /** 总检查数 */
  totalChecks: number;
  /** 通过数 */
  passedChecks: number;
  /** 失败数 */
  failedChecks: number;
  /** 检查详情 */
  checks: CheckResult[];
}

export interface CheckResult {
  /** 检查名称 */
  name: string;
  /** 是否通过 */
  passed: boolean;
  /** 详情 */
  details: string;
  /** 问题列表 */
  issues?: string[];
}

export const defaultValidationConfig: ValidationConfig = {
  contentDir: 'content/blog',
  imageDir: 'public/images/blog',
  runBuild: true,
};

// ============================================================================
// 核心 Issues 检查
// ============================================================================

/**
 * 检查核心 issues 是否清零
 */
export function checkCoreIssues(contentDir: string): CheckResult {
  const issues: string[] = [];
  let totalFiles = 0;
  let filesWithIssues = 0;

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

        totalFiles++;
        const fileIssues = checkFileIssues(fullPath);
        if (fileIssues.length > 0) {
          filesWithIssues++;
          issues.push(`${entry.name}: ${fileIssues.join(', ')}`);
        }
      }
    }
  };

  scanDir(contentDir);

  const passed = filesWithIssues === 0;
  return {
    name: '核心 Issues 检查',
    passed,
    details: passed
      ? `所有 ${totalFiles} 篇文章核心 issues 已清零`
      : `${filesWithIssues}/${totalFiles} 篇文章仍有核心 issues`,
    issues: issues.slice(0, 10),
  };
}

/**
 * 检查单个文件的核心 issues
 */
function checkFileIssues(filePath: string): string[] {
  const issues: string[] = [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(content);

    // 检查分类
    const categories = data.categories || [];
    const validSlugs = Object.keys(categoryStyles);
    if (
      categories.length === 0 ||
      !categories.every((c: string) => validSlugs.includes(c))
    ) {
      issues.push('wrong_category');
    }

    // 检查封面图
    const image = data.image || '';
    if (!image || image.includes('post-') || image.includes('placeholder')) {
      issues.push('no_cover');
    }

    // 检查标题
    if (!data.title || data.title.length < 10) {
      issues.push('short_title');
    }

    // 检查描述
    if (!data.description || data.description.length < 50) {
      issues.push('short_desc');
    }
  } catch (error) {
    issues.push('parse_error');
  }

  return issues;
}

// ============================================================================
// 文件配对检查
// ============================================================================

/**
 * 检查中英文文件配对
 */
export function checkFilePairing(contentDir: string): CheckResult {
  const issues: string[] = [];
  const zhFiles = new Set<string>();
  const enFiles = new Set<string>();

  const scanDir = (dir: string) => {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
        const ext = path.extname(entry.name);
        const basename = path.basename(entry.name, ext);

        if (basename.endsWith('.en')) {
          // 英文文件
          const slug = basename.replace(/\.en$/, '');
          enFiles.add(slug);
        } else if (basename.endsWith('.zh')) {
          // 中文文件（显式标记）
          const slug = basename.replace(/\.zh$/, '');
          zhFiles.add(slug);
        } else {
          // 默认中文文件
          zhFiles.add(basename);
        }
      }
    }
  };

  scanDir(contentDir);

  // 检查缺少英文版的文件
  for (const slug of zhFiles) {
    if (!enFiles.has(slug)) {
      issues.push(`缺少英文版: ${slug}`);
    }
  }

  // 检查缺少中文版的文件
  for (const slug of enFiles) {
    if (!zhFiles.has(slug)) {
      issues.push(`缺少中文版: ${slug}`);
    }
  }

  const passed = issues.length === 0;
  return {
    name: '中英文文件配对检查',
    passed,
    details: passed
      ? `所有 ${zhFiles.size} 篇文章都有中英文版本`
      : `${issues.length} 个配对问题`,
    issues: issues.slice(0, 10),
  };
}

// ============================================================================
// 图片可用性检查
// ============================================================================

/**
 * 检查图片可用性
 */
export function checkImageAvailability(
  contentDir: string,
  imageDir: string
): CheckResult {
  const issues: string[] = [];
  const existingImages = new Set<string>();

  // 获取所有已有图片
  if (fs.existsSync(imageDir)) {
    const files = fs.readdirSync(imageDir);
    for (const file of files) {
      existingImages.add(file.toLowerCase());
    }
  }

  // 扫描博客文件，检查引用的图片
  let totalRefs = 0;
  let missingRefs = 0;

  const scanDir = (dir: string) => {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf-8');

        // 提取图片引用
        const imageRefs =
          content.match(/!\[.*?\]\(\/images\/blog\/([^)]+)\)/g) || [];
        for (const ref of imageRefs) {
          totalRefs++;
          const match = ref.match(/\/images\/blog\/([^)]+)/);
          if (match) {
            const imageName = match[1].toLowerCase();
            if (!existingImages.has(imageName)) {
              missingRefs++;
              issues.push(`${entry.name}: 缺少图片 ${match[1]}`);
            }
          }
        }

        // 检查 frontmatter 中的封面图
        const { data } = matter(content);
        if (data.image && data.image.startsWith('/images/blog/')) {
          totalRefs++;
          const imageName = path.basename(data.image).toLowerCase();
          if (!existingImages.has(imageName)) {
            missingRefs++;
            issues.push(`${entry.name}: 缺少封面图 ${data.image}`);
          }
        }
      }
    }
  };

  scanDir(contentDir);

  const passed = missingRefs === 0;
  return {
    name: '图片可用性检查',
    passed,
    details: passed
      ? `所有 ${totalRefs} 个图片引用都有效`
      : `${missingRefs}/${totalRefs} 个图片引用无效`,
    issues: issues.slice(0, 10),
  };
}

// ============================================================================
// 分类映射检查
// ============================================================================

/**
 * 检查分类映射正确性
 */
export function checkCategoryMapping(contentDir: string): CheckResult {
  const issues: string[] = [];
  const validSlugs = Object.keys(categoryStyles);
  let totalFiles = 0;
  let invalidFiles = 0;

  const scanDir = (dir: string) => {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
        if (entry.name.includes('.en.')) continue;

        totalFiles++;
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const { data } = matter(content);
          const categories = data.categories || [];

          for (const cat of categories) {
            if (!validSlugs.includes(cat)) {
              invalidFiles++;
              issues.push(`${entry.name}: 无效分类 "${cat}"`);
              break;
            }
          }
        } catch (error) {
          issues.push(`${entry.name}: 解析错误`);
        }
      }
    }
  };

  scanDir(contentDir);

  const passed = invalidFiles === 0;
  return {
    name: '分类映射检查',
    passed,
    details: passed
      ? `所有 ${totalFiles} 篇文章分类映射正确`
      : `${invalidFiles}/${totalFiles} 篇文章分类映射错误`,
    issues: issues.slice(0, 10),
  };
}

// ============================================================================
// 构建验证
// ============================================================================

/**
 * 运行构建验证
 */
export function checkBuildValidation(): CheckResult {
  const issues: string[] = [];

  // 运行 pnpm content
  try {
    execSync('pnpm content', { encoding: 'utf-8', stdio: 'pipe' });
  } catch (error) {
    issues.push('pnpm content 失败');
  }

  // 运行 pnpm lint
  try {
    execSync('pnpm lint', { encoding: 'utf-8', stdio: 'pipe' });
  } catch (error) {
    issues.push('pnpm lint 失败');
  }

  const passed = issues.length === 0;
  return {
    name: '构建验证',
    passed,
    details: passed ? '构建验证通过' : '构建验证失败',
    issues,
  };
}

// ============================================================================
// 主验收函数
// ============================================================================

/**
 * 执行完整验收检查
 */
export function runAcceptanceValidation(
  config: Partial<ValidationConfig> = {}
): ValidationResult {
  const fullConfig: ValidationConfig = {
    ...defaultValidationConfig,
    ...config,
  };
  const checks: CheckResult[] = [];

  console.log('🔍 开始验收检查...\n');

  // 1. 核心 Issues 检查
  console.log('检查核心 Issues...');
  const coreIssuesCheck = checkCoreIssues(fullConfig.contentDir);
  checks.push(coreIssuesCheck);
  console.log(
    `  ${coreIssuesCheck.passed ? '✅' : '❌'} ${coreIssuesCheck.name}: ${coreIssuesCheck.details}`
  );

  // 2. 文件配对检查
  console.log('检查文件配对...');
  const pairingCheck = checkFilePairing(fullConfig.contentDir);
  checks.push(pairingCheck);
  console.log(
    `  ${pairingCheck.passed ? '✅' : '❌'} ${pairingCheck.name}: ${pairingCheck.details}`
  );

  // 3. 分类映射检查
  console.log('检查分类映射...');
  const categoryCheck = checkCategoryMapping(fullConfig.contentDir);
  checks.push(categoryCheck);
  console.log(
    `  ${categoryCheck.passed ? '✅' : '❌'} ${categoryCheck.name}: ${categoryCheck.details}`
  );

  // 4. 图片可用性检查
  console.log('检查图片可用性...');
  const imageCheck = checkImageAvailability(
    fullConfig.contentDir,
    fullConfig.imageDir
  );
  checks.push(imageCheck);
  console.log(
    `  ${imageCheck.passed ? '✅' : '❌'} ${imageCheck.name}: ${imageCheck.details}`
  );

  // 5. 构建验证（可选）
  if (fullConfig.runBuild) {
    console.log('运行构建验证...');
    const buildCheck = checkBuildValidation();
    checks.push(buildCheck);
    console.log(
      `  ${buildCheck.passed ? '✅' : '❌'} ${buildCheck.name}: ${buildCheck.details}`
    );
  }

  // 汇总结果
  const passedChecks = checks.filter((c) => c.passed).length;
  const failedChecks = checks.filter((c) => !c.passed).length;
  const passed = failedChecks === 0;

  return {
    passed,
    totalChecks: checks.length,
    passedChecks,
    failedChecks,
    checks,
  };
}

// ============================================================================
// 生成验收报告
// ============================================================================

/**
 * 生成 Markdown 格式的验收报告
 */
export function generateAcceptanceReport(result: ValidationResult): string {
  let md = `# 博客验收报告

> 生成时间: ${new Date().toISOString().split('T')[0]}
> 总体结果: ${result.passed ? '✅ 通过' : '❌ 未通过'}

## 检查摘要

| 检查项 | 结果 | 详情 |
|--------|------|------|
`;

  for (const check of result.checks) {
    md += `| ${check.name} | ${check.passed ? '✅' : '❌'} | ${check.details} |\n`;
  }

  md += `\n## 统计\n\n`;
  md += `- 总检查数: ${result.totalChecks}\n`;
  md += `- 通过: ${result.passedChecks}\n`;
  md += `- 失败: ${result.failedChecks}\n`;

  // 输出失败检查的详情
  const failedChecks = result.checks.filter((c) => !c.passed);
  if (failedChecks.length > 0) {
    md += `\n## 失败详情\n\n`;
    for (const check of failedChecks) {
      md += `### ${check.name}\n\n`;
      md += `${check.details}\n\n`;
      if (check.issues && check.issues.length > 0) {
        md += `问题列表:\n`;
        for (const issue of check.issues) {
          md += `- ${issue}\n`;
        }
        md += `\n`;
      }
    }
  }

  return md;
}

// ============================================================================
// CLI 入口
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const config: Partial<ValidationConfig> = {
    runBuild: !args.includes('--skip-build'),
  };

  // 解析目录参数
  const contentDirIndex = args.indexOf('--content-dir');
  if (contentDirIndex !== -1 && args[contentDirIndex + 1]) {
    config.contentDir = args[contentDirIndex + 1];
  }

  const imageDirIndex = args.indexOf('--image-dir');
  if (imageDirIndex !== -1 && args[imageDirIndex + 1]) {
    config.imageDir = args[imageDirIndex + 1];
  }

  console.log('✅ 博客验收检查脚本');
  console.log('配置:', JSON.stringify(config, null, 2));
  console.log('');

  const result = runAcceptanceValidation(config);

  console.log('\n📊 验收结果:');
  console.log(`  总体: ${result.passed ? '✅ 通过' : '❌ 未通过'}`);
  console.log(`  通过: ${result.passedChecks}/${result.totalChecks}`);
  console.log(`  失败: ${result.failedChecks}/${result.totalChecks}`);

  // 输出报告
  const reportDir = '深入细化调整/006-01-博客内容创作/流水线设计-博文生产';
  const mdPath = path.join(reportDir, 'acceptance-report.md');
  const jsonPath = path.join(reportDir, 'acceptance-report.json');

  fs.writeFileSync(mdPath, generateAcceptanceReport(result), 'utf-8');
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');

  console.log(`\n📄 报告已保存到:`);
  console.log(`  - ${mdPath}`);
  console.log(`  - ${jsonPath}`);

  // 返回退出码
  process.exit(result.passed ? 0 : 1);
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}
