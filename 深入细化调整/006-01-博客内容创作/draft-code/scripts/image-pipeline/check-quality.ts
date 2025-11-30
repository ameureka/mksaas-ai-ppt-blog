/**
 * 图片质量检查脚本
 * 
 * 用法: npx tsx scripts/image-pipeline/check-quality.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import type { ImageTasksData } from './types';

const CONFIG = {
  dataDir: path.resolve(__dirname, '../../data'),
  publicDir: path.resolve(__dirname, '../../../../public/images/blog'),
  compressedDir: path.resolve(__dirname, '../../compressed'),
  generatedDir: path.resolve(__dirname, '../../generated-images'),
  tasksFile: 'image-tasks.json',
  // 质量标准
  coverMaxSize: 200 * 1024, // 200KB
  coverWidth: 1200,
  coverHeight: 630,
  inlineMaxSize: 150 * 1024, // 150KB
  inlineWidth: 1000,
  inlineHeight: 600,
};

interface QualityIssue {
  file: string;
  issues: string[];
}

function getImageDimensions(filePath: string): { width: number; height: number } | null {
  try {
    // 尝试使用 sips (macOS)
    const output = execSync(`sips -g pixelWidth -g pixelHeight "${filePath}" 2>/dev/null`, {
      encoding: 'utf-8',
    });
    const widthMatch = output.match(/pixelWidth:\s*(\d+)/);
    const heightMatch = output.match(/pixelHeight:\s*(\d+)/);
    if (widthMatch && heightMatch) {
      return {
        width: parseInt(widthMatch[1], 10),
        height: parseInt(heightMatch[1], 10),
      };
    }
  } catch {
    // sips 不可用，跳过尺寸检查
  }
  return null;
}

function findImageFile(filename: string): string | null {
  const dirs = [CONFIG.publicDir, CONFIG.compressedDir, CONFIG.generatedDir];
  for (const dir of dirs) {
    const filePath = path.join(dir, filename);
    if (fs.existsSync(filePath)) return filePath;
  }
  return null;
}

function checkImage(
  filename: string,
  isCover: boolean
): { exists: boolean; issues: string[] } {
  const issues: string[] = [];
  const filePath = findImageFile(filename);

  if (!filePath) {
    return { exists: false, issues: ['文件不存在'] };
  }

  // 检查文件大小
  const stats = fs.statSync(filePath);
  const maxSize = isCover ? CONFIG.coverMaxSize : CONFIG.inlineMaxSize;
  if (stats.size > maxSize) {
    issues.push(`文件过大: ${Math.round(stats.size / 1024)}KB > ${Math.round(maxSize / 1024)}KB`);
  }

  // 检查尺寸
  const dimensions = getImageDimensions(filePath);
  if (dimensions) {
    const expectedWidth = isCover ? CONFIG.coverWidth : CONFIG.inlineWidth;
    const expectedHeight = isCover ? CONFIG.coverHeight : CONFIG.inlineHeight;

    // 允许 10% 误差
    const widthOk = Math.abs(dimensions.width - expectedWidth) / expectedWidth < 0.1;
    const heightOk = Math.abs(dimensions.height - expectedHeight) / expectedHeight < 0.1;

    if (!widthOk || !heightOk) {
      issues.push(`尺寸不符: ${dimensions.width}x${dimensions.height} (期望 ${expectedWidth}x${expectedHeight})`);
    }
  }

  return { exists: true, issues };
}

function main() {
  console.log('🔍 图片质量检查');
  console.log('================');
  console.log('');

  const tasksPath = path.join(CONFIG.dataDir, CONFIG.tasksFile);

  if (!fs.existsSync(tasksPath)) {
    console.error('❌ 任务文件不存在，请先运行 generate-prompts.ts');
    process.exit(1);
  }

  const data: ImageTasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));

  const allIssues: QualityIssue[] = [];
  let totalFiles = 0;
  let existingFiles = 0;
  let passedFiles = 0;

  for (const task of data.tasks) {
    // 检查封面
    totalFiles++;
    const coverResult = checkImage(task.cover.filename, true);
    if (coverResult.exists) {
      existingFiles++;
      if (coverResult.issues.length === 0) {
        passedFiles++;
      } else {
        allIssues.push({ file: task.cover.filename, issues: coverResult.issues });
      }
    } else {
      allIssues.push({ file: task.cover.filename, issues: coverResult.issues });
    }

    // 检查内页
    for (const img of task.inlineImages) {
      totalFiles++;
      const inlineResult = checkImage(img.filename, false);
      if (inlineResult.exists) {
        existingFiles++;
        if (inlineResult.issues.length === 0) {
          passedFiles++;
        } else {
          allIssues.push({ file: img.filename, issues: inlineResult.issues });
        }
      } else {
        allIssues.push({ file: img.filename, issues: inlineResult.issues });
      }
    }
  }

  // 输出结果
  console.log('📊 检查结果:');
  console.log(`   总文件数: ${totalFiles}`);
  console.log(`   已存在: ${existingFiles}`);
  console.log(`   通过检查: ${passedFiles}`);
  console.log(`   存在问题: ${allIssues.length}`);
  console.log('');

  if (allIssues.length > 0) {
    console.log('❌ 问题列表:');
    console.log('');

    // 按问题类型分组
    const missingFiles = allIssues.filter((i) => i.issues.includes('文件不存在'));
    const sizeIssues = allIssues.filter((i) => i.issues.some((issue) => issue.includes('文件过大')));
    const dimensionIssues = allIssues.filter((i) => i.issues.some((issue) => issue.includes('尺寸不符')));

    if (missingFiles.length > 0) {
      console.log(`📁 缺失文件 (${missingFiles.length}):`);
      for (const item of missingFiles.slice(0, 10)) {
        console.log(`   - ${item.file}`);
      }
      if (missingFiles.length > 10) {
        console.log(`   ... 还有 ${missingFiles.length - 10} 个`);
      }
      console.log('');
    }

    if (sizeIssues.length > 0) {
      console.log(`📦 文件过大 (${sizeIssues.length}):`);
      for (const item of sizeIssues.slice(0, 10)) {
        const sizeIssue = item.issues.find((i) => i.includes('文件过大'));
        console.log(`   - ${item.file}: ${sizeIssue}`);
      }
      if (sizeIssues.length > 10) {
        console.log(`   ... 还有 ${sizeIssues.length - 10} 个`);
      }
      console.log('');
    }

    if (dimensionIssues.length > 0) {
      console.log(`📐 尺寸不符 (${dimensionIssues.length}):`);
      for (const item of dimensionIssues.slice(0, 10)) {
        const dimIssue = item.issues.find((i) => i.includes('尺寸不符'));
        console.log(`   - ${item.file}: ${dimIssue}`);
      }
      if (dimensionIssues.length > 10) {
        console.log(`   ... 还有 ${dimensionIssues.length - 10} 个`);
      }
      console.log('');
    }
  } else {
    console.log('✅ 所有图片通过质量检查！');
  }

  // 完整性检查
  console.log('');
  console.log('📋 完整性检查:');

  let completeCount = 0;
  let incompleteCount = 0;

  for (const task of data.tasks) {
    const coverExists = findImageFile(task.cover.filename) !== null;
    const inlineCount = task.inlineImages.filter(
      (img) => findImageFile(img.filename) !== null
    ).length;

    if (coverExists && inlineCount >= 3) {
      completeCount++;
    } else {
      incompleteCount++;
      if (incompleteCount <= 5) {
        console.log(`   ⚠️ ${task.slug}: 封面=${coverExists ? '✓' : '✗'}, 内页=${inlineCount}/3`);
      }
    }
  }

  if (incompleteCount > 5) {
    console.log(`   ... 还有 ${incompleteCount - 5} 篇不完整`);
  }

  console.log('');
  console.log(`   完整: ${completeCount}/${data.tasks.length}`);
  console.log(`   不完整: ${incompleteCount}/${data.tasks.length}`);
}

main();
