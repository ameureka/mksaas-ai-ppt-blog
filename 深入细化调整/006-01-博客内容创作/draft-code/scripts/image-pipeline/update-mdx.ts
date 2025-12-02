/**
 * 更新 MDX 文件中的图片路径
 *
 * 用法: npx tsx scripts/image-pipeline/update-mdx.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import matter from 'gray-matter';
import type { ImageTasksData } from './types';

const CONFIG = {
  dataDir: path.resolve(__dirname, '../../data'),
  mdxDir: path.resolve(__dirname, '../../../../广告-博文'),
  tasksFile: 'image-tasks.json',
  dryRun: process.argv.includes('--dry-run'),
};

function findMdxFile(slug: string, dir: string): string | null {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const found = findMdxFile(slug, fullPath);
      if (found) return found;
    } else if (entry.name.endsWith('.zh.mdx')) {
      const fileSlug = path
        .basename(entry.name, '.zh.mdx')
        .toLowerCase()
        .replace(/\s+/g, '-');
      if (fileSlug === slug) return fullPath;
    }
  }

  return null;
}

function updateMdxFile(
  filePath: string,
  coverFilename: string,
  inlineImages: Array<{ filename: string; scene: string }>
): { updated: boolean; changes: string[] } {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data, content: body } = matter(content);
  const changes: string[] = [];

  // 更新封面图
  const newCoverPath = `/images/blog/${coverFilename}`;
  if (data.image !== newCoverPath) {
    data.image = newCoverPath;
    changes.push(`封面: ${newCoverPath}`);
  }

  // 更新正文图片
  let newBody = body;

  // 替换占位符 ![placeholder-{n}]
  for (let i = 0; i < inlineImages.length; i++) {
    const img = inlineImages[i];
    const placeholder = new RegExp(
      `!\\[placeholder-${i + 1}\\]\\([^)]*\\)`,
      'g'
    );
    const replacement = `![${img.scene}](/images/blog/${img.filename})`;

    if (placeholder.test(newBody)) {
      newBody = newBody.replace(placeholder, replacement);
      changes.push(`内页 ${i + 1}: ${img.filename}`);
    }
  }

  // 替换通用占位图 post-*.png
  const postPlaceholder = /!\[([^\]]*)\]\(\/images\/blog\/post-\d+\.png\)/g;
  let match: RegExpExecArray | null;
  let imgIndex = 0;

  while (
    (match = postPlaceholder.exec(newBody)) !== null &&
    imgIndex < inlineImages.length
  ) {
    const img = inlineImages[imgIndex];
    const alt = match[1] || img.scene;
    const replacement = `![${alt}](/images/blog/${img.filename})`;
    newBody = newBody.replace(match[0], replacement);
    changes.push(`替换占位图: ${img.filename}`);
    imgIndex++;
  }

  if (changes.length === 0) {
    return { updated: false, changes: [] };
  }

  if (!CONFIG.dryRun) {
    const newContent = matter.stringify(newBody, data);
    fs.writeFileSync(filePath, newContent, 'utf-8');
  }

  return { updated: true, changes };
}

function main() {
  console.log('📝 更新 MDX 文件中的图片路径');
  console.log('============================');

  if (CONFIG.dryRun) {
    console.log('⚠️  DRY RUN 模式 - 不会实际修改文件');
  }
  console.log('');

  const tasksPath = path.join(CONFIG.dataDir, CONFIG.tasksFile);

  if (!fs.existsSync(tasksPath)) {
    console.error('❌ 任务文件不存在，请先运行 generate-prompts.ts');
    process.exit(1);
  }

  const data: ImageTasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));

  let updatedCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;

  for (const task of data.tasks) {
    // 只处理有图片的任务
    const hasImages =
      task.cover.status !== 'pending' ||
      task.inlineImages.some((img) => img.status !== 'pending');

    if (!hasImages) {
      skippedCount++;
      continue;
    }

    // 查找 MDX 文件
    const mdxPath = findMdxFile(task.slug, CONFIG.mdxDir);

    if (!mdxPath) {
      console.log(`⚠️  未找到 MDX: ${task.slug}`);
      notFoundCount++;
      continue;
    }

    // 更新文件
    const { updated, changes } = updateMdxFile(
      mdxPath,
      task.cover.filename,
      task.inlineImages.map((img) => ({
        filename: img.filename,
        scene: img.scene,
      }))
    );

    if (updated) {
      console.log(`✅ ${task.slug}`);
      for (const change of changes) {
        console.log(`   - ${change}`);
      }
      updatedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log('');
  console.log('📊 统计:');
  console.log(`   已更新: ${updatedCount}`);
  console.log(`   已跳过: ${skippedCount}`);
  console.log(`   未找到: ${notFoundCount}`);

  if (CONFIG.dryRun) {
    console.log('');
    console.log('💡 移除 --dry-run 参数以实际执行更新');
  }
}

main();
