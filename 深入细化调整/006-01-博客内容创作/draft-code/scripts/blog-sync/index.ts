/**
 * 博客内容同步脚本
 *
 * 功能：
 * - 同步 MDX 文件到 content/blog/
 * - 同步图片到 public/images/blog/
 * - 运行 schema 验证
 * - 更新索引文件
 *
 * 迁移说明：
 * - 校验通过后迁移到 scripts/blog-sync/
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ============================================================================
// 类型定义
// ============================================================================

export interface SyncConfig {
  /** 源 MDX 目录 */
  sourceDir: string;
  /** 目标 MDX 目录 */
  targetDir: string;
  /** 源图片目录 */
  sourceImageDir: string;
  /** 目标图片目录 */
  targetImageDir: string;
  /** 是否创建备份 */
  backup: boolean;
  /** 备份目录 */
  backupDir: string;
  /** 是否 dry-run */
  dryRun: boolean;
  /** 是否运行验证 */
  runValidation: boolean;
}

export interface SyncResult {
  /** 同步的 MDX 文件数 */
  mdxSynced: number;
  /** 同步的图片数 */
  imagesSynced: number;
  /** 跳过的文件数 */
  skipped: number;
  /** 错误数 */
  errors: number;
  /** 验证结果 */
  validationPassed: boolean;
  /** 详细日志 */
  logs: string[];
}

export const defaultSyncConfig: SyncConfig = {
  sourceDir: '深入细化调整/006-01-博客内容创作/流水线设计-博文生产/output',
  targetDir: 'content/blog',
  sourceImageDir: '深入细化调整/006-01-博客内容创作/流水线设计-博文生产/images',
  targetImageDir: 'public/images/blog',
  backup: true,
  backupDir: '深入细化调整/006-01-博客内容创作/流水线设计-博文生产/backup',
  dryRun: false,
  runValidation: true,
};

// ============================================================================
// 备份功能
// ============================================================================

/**
 * 创建备份
 */
export function createBackup(
  sourceDir: string,
  backupDir: string,
  dryRun: boolean
): { success: boolean; backupPath: string } {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup-${timestamp}`);

  if (dryRun) {
    console.log(`[DRY-RUN] 将创建备份: ${backupPath}`);
    return { success: true, backupPath };
  }

  try {
    // 确保备份目录存在
    fs.mkdirSync(backupPath, { recursive: true });

    // 复制文件
    if (fs.existsSync(sourceDir)) {
      copyDirRecursive(sourceDir, backupPath);
    }

    return { success: true, backupPath };
  } catch (error) {
    console.error('创建备份失败:', error);
    return { success: false, backupPath };
  }
}

/**
 * 递归复制目录
 */
function copyDirRecursive(src: string, dest: string): void {
  if (!fs.existsSync(src)) return;

  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ============================================================================
// 同步功能
// ============================================================================

/**
 * 同步 MDX 文件
 */
export function syncMdxFiles(
  sourceDir: string,
  targetDir: string,
  dryRun: boolean
): { synced: number; skipped: number; errors: number; logs: string[] } {
  const logs: string[] = [];
  let synced = 0;
  let skipped = 0;
  let errors = 0;

  if (!fs.existsSync(sourceDir)) {
    logs.push(`源目录不存在: ${sourceDir}`);
    return { synced, skipped, errors: 1, logs };
  }

  // 确保目标目录存在
  if (!dryRun) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 扫描源目录
  const scanDir = (dir: string, relativePath = '') => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(dir, entry.name);
      const relPath = path.join(relativePath, entry.name);
      const destPath = path.join(targetDir, relPath);

      if (entry.isDirectory()) {
        if (!dryRun) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        scanDir(srcPath, relPath);
      } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
        try {
          if (dryRun) {
            logs.push(`[DRY-RUN] 将同步: ${relPath}`);
          } else {
            fs.copyFileSync(srcPath, destPath);
            logs.push(`已同步: ${relPath}`);
          }
          synced++;
        } catch (error) {
          logs.push(`同步失败: ${relPath} - ${error}`);
          errors++;
        }
      } else {
        skipped++;
      }
    }
  };

  scanDir(sourceDir);
  return { synced, skipped, errors, logs };
}

/**
 * 同步图片文件
 */
export function syncImageFiles(
  sourceDir: string,
  targetDir: string,
  dryRun: boolean
): { synced: number; skipped: number; errors: number; logs: string[] } {
  const logs: string[] = [];
  let synced = 0;
  let skipped = 0;
  let errors = 0;

  if (!fs.existsSync(sourceDir)) {
    logs.push(`图片源目录不存在: ${sourceDir}`);
    return { synced, skipped, errors: 0, logs };
  }

  // 确保目标目录存在
  if (!dryRun) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 扫描图片
  const files = fs.readdirSync(sourceDir);
  for (const file of files) {
    if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(file)) {
      skipped++;
      continue;
    }

    const srcPath = path.join(sourceDir, file);
    const destPath = path.join(targetDir, file);

    try {
      if (dryRun) {
        logs.push(`[DRY-RUN] 将同步图片: ${file}`);
      } else {
        fs.copyFileSync(srcPath, destPath);
        logs.push(`已同步图片: ${file}`);
      }
      synced++;
    } catch (error) {
      logs.push(`同步图片失败: ${file} - ${error}`);
      errors++;
    }
  }

  return { synced, skipped, errors, logs };
}

// ============================================================================
// 验证功能
// ============================================================================

/**
 * 运行 schema 验证
 */
export function runSchemaValidation(dryRun: boolean): {
  success: boolean;
  output: string;
} {
  if (dryRun) {
    return { success: true, output: '[DRY-RUN] 将运行 pnpm content' };
  }

  try {
    const output = execSync('pnpm content', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return { success: true, output };
  } catch (error) {
    const errorOutput = error instanceof Error ? error.message : String(error);
    return { success: false, output: errorOutput };
  }
}

/**
 * 运行 lint 检查
 */
export function runLintCheck(dryRun: boolean): {
  success: boolean;
  output: string;
} {
  if (dryRun) {
    return { success: true, output: '[DRY-RUN] 将运行 pnpm lint' };
  }

  try {
    const output = execSync('pnpm lint', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return { success: true, output };
  } catch (error) {
    const errorOutput = error instanceof Error ? error.message : String(error);
    return { success: false, output: errorOutput };
  }
}

// ============================================================================
// 索引更新
// ============================================================================

/**
 * 更新博客索引
 */
export function updateBlogIndex(
  targetDir: string,
  dryRun: boolean
): { success: boolean; count: number } {
  if (dryRun) {
    console.log('[DRY-RUN] 将更新博客索引');
    return { success: true, count: 0 };
  }

  try {
    // 扫描所有博客文件
    const blogs: Array<{ slug: string; title: string; date: string }> = [];

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
          // 简单解析 frontmatter
          const content = fs.readFileSync(fullPath, 'utf-8');
          const titleMatch = content.match(/title:\s*["']?(.+?)["']?\s*$/m);
          const dateMatch = content.match(/date:\s*["']?(.+?)["']?\s*$/m);

          blogs.push({
            slug,
            title: titleMatch?.[1] || slug,
            date: dateMatch?.[1] || new Date().toISOString().split('T')[0],
          });
        }
      }
    };

    scanDir(targetDir);

    // 按日期排序
    blogs.sort((a, b) => b.date.localeCompare(a.date));

    return { success: true, count: blogs.length };
  } catch (error) {
    console.error('更新索引失败:', error);
    return { success: false, count: 0 };
  }
}

// ============================================================================
// 主同步函数
// ============================================================================

/**
 * 执行完整同步
 */
export function syncAll(config: Partial<SyncConfig> = {}): SyncResult {
  const fullConfig: SyncConfig = { ...defaultSyncConfig, ...config };
  const logs: string[] = [];

  console.log('🔄 开始同步...');
  logs.push(`同步配置: ${JSON.stringify(fullConfig, null, 2)}`);

  // 1. 创建备份
  if (fullConfig.backup) {
    console.log('📦 创建备份...');
    const backupResult = createBackup(
      fullConfig.targetDir,
      fullConfig.backupDir,
      fullConfig.dryRun
    );
    logs.push(`备份结果: ${backupResult.success ? '成功' : '失败'}`);
    if (backupResult.success) {
      logs.push(`备份路径: ${backupResult.backupPath}`);
    }
  }

  // 2. 同步 MDX 文件
  console.log('📄 同步 MDX 文件...');
  const mdxResult = syncMdxFiles(
    fullConfig.sourceDir,
    fullConfig.targetDir,
    fullConfig.dryRun
  );
  logs.push(...mdxResult.logs);

  // 3. 同步图片
  console.log('🖼️ 同步图片...');
  const imageResult = syncImageFiles(
    fullConfig.sourceImageDir,
    fullConfig.targetImageDir,
    fullConfig.dryRun
  );
  logs.push(...imageResult.logs);

  // 4. 运行验证
  let validationPassed = true;
  if (fullConfig.runValidation) {
    console.log('✅ 运行验证...');

    const schemaResult = runSchemaValidation(fullConfig.dryRun);
    logs.push(`Schema 验证: ${schemaResult.success ? '通过' : '失败'}`);
    if (!schemaResult.success) {
      logs.push(schemaResult.output);
      validationPassed = false;
    }

    const lintResult = runLintCheck(fullConfig.dryRun);
    logs.push(`Lint 检查: ${lintResult.success ? '通过' : '失败'}`);
    if (!lintResult.success) {
      logs.push(lintResult.output);
      validationPassed = false;
    }
  }

  // 5. 更新索引
  console.log('📋 更新索引...');
  const indexResult = updateBlogIndex(fullConfig.targetDir, fullConfig.dryRun);
  logs.push(`索引更新: ${indexResult.count} 篇文章`);

  return {
    mdxSynced: mdxResult.synced,
    imagesSynced: imageResult.synced,
    skipped: mdxResult.skipped + imageResult.skipped,
    errors: mdxResult.errors + imageResult.errors,
    validationPassed,
    logs,
  };
}

// ============================================================================
// CLI 入口
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const config: Partial<SyncConfig> = {
    dryRun: args.includes('--dry-run'),
    backup: !args.includes('--no-backup'),
    runValidation: !args.includes('--skip-validation'),
  };

  // 解析目录参数
  const sourceDirIndex = args.indexOf('--source-dir');
  if (sourceDirIndex !== -1 && args[sourceDirIndex + 1]) {
    config.sourceDir = args[sourceDirIndex + 1];
  }

  const targetDirIndex = args.indexOf('--target-dir');
  if (targetDirIndex !== -1 && args[targetDirIndex + 1]) {
    config.targetDir = args[targetDirIndex + 1];
  }

  console.log('🔄 博客内容同步脚本');
  console.log('配置:', JSON.stringify(config, null, 2));
  console.log('');

  const result = syncAll(config);

  console.log('\n📊 同步结果:');
  console.log(`  MDX 文件: ${result.mdxSynced}`);
  console.log(`  图片: ${result.imagesSynced}`);
  console.log(`  跳过: ${result.skipped}`);
  console.log(`  错误: ${result.errors}`);
  console.log(`  验证: ${result.validationPassed ? '✅ 通过' : '❌ 失败'}`);

  // 输出详细日志
  const reportPath =
    '深入细化调整/006-01-博客内容创作/流水线设计-博文生产/sync-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\n📄 详细报告已保存到: ${reportPath}`);
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}
