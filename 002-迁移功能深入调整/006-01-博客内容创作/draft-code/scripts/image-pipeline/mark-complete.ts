/**
 * 标记图片生成完成 - 更新任务状态
 *
 * 用法:
 *   npx tsx scripts/image-pipeline/mark-complete.ts --slug <slug> --type cover
 *   npx tsx scripts/image-pipeline/mark-complete.ts --slug <slug> --type inline --index 1
 *   npx tsx scripts/image-pipeline/mark-complete.ts --scan  # 扫描 generated-images 自动标记
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ImageTasksData, TaskStatus } from './types';
import { calculateMediaStatus } from './types';

const CONFIG = {
  dataDir: path.resolve(__dirname, '../../data'),
  generatedDir: path.resolve(__dirname, '../../generated-images'),
  tasksFile: 'image-tasks.json',
};

function loadTasks(): ImageTasksData {
  const tasksPath = path.join(CONFIG.dataDir, CONFIG.tasksFile);
  return JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
}

function saveTasks(data: ImageTasksData) {
  const tasksPath = path.join(CONFIG.dataDir, CONFIG.tasksFile);
  fs.writeFileSync(tasksPath, JSON.stringify(data, null, 2), 'utf-8');
}

function markCover(slug: string, status: TaskStatus = 'generated') {
  const data = loadTasks();
  const task = data.tasks.find((t) => t.slug === slug);

  if (!task) {
    console.error(`❌ 未找到任务: ${slug}`);
    return;
  }

  task.cover.status = status;
  task.cover.generatedAt = new Date().toISOString();
  task.updatedAt = new Date().toISOString();
  task.mediaStatus = calculateMediaStatus(task);

  saveTasks(data);
  console.log(`✅ 已标记封面: ${slug} -> ${status}`);
}

function markInline(
  slug: string,
  index: number,
  status: TaskStatus = 'generated'
) {
  const data = loadTasks();
  const task = data.tasks.find((t) => t.slug === slug);

  if (!task) {
    console.error(`❌ 未找到任务: ${slug}`);
    return;
  }

  if (index < 1 || index > task.inlineImages.length) {
    console.error(`❌ 无效的内页索引: ${index}`);
    return;
  }

  const img = task.inlineImages[index - 1];
  img.status = status;
  img.generatedAt = new Date().toISOString();
  task.updatedAt = new Date().toISOString();
  task.mediaStatus = calculateMediaStatus(task);

  saveTasks(data);
  console.log(`✅ 已标记内页: ${slug}-${index} -> ${status}`);
}

function scanAndMark() {
  console.log('🔍 扫描 generated-images 目录...');

  if (!fs.existsSync(CONFIG.generatedDir)) {
    console.error('❌ generated-images 目录不存在');
    return;
  }

  const files = fs.readdirSync(CONFIG.generatedDir);
  const data = loadTasks();
  let updated = 0;

  for (const file of files) {
    // 封面: {slug}-cover.jpg
    const coverMatch = file.match(/^(.+)-cover\.(jpg|jpeg|png)$/i);
    if (coverMatch) {
      const slug = coverMatch[1];
      const task = data.tasks.find((t) => t.slug === slug);
      if (task && task.cover.status === 'pending') {
        task.cover.status = 'generated';
        task.cover.generatedAt = new Date().toISOString();
        task.updatedAt = new Date().toISOString();
        task.mediaStatus = calculateMediaStatus(task);
        updated++;
        console.log(`✅ 封面: ${slug}`);
      }
      continue;
    }

    // 内页: {slug}-{n}.png
    const inlineMatch = file.match(/^(.+)-(\d+)\.(jpg|jpeg|png)$/i);
    if (inlineMatch) {
      const slug = inlineMatch[1];
      const index = Number.parseInt(inlineMatch[2], 10);
      const task = data.tasks.find((t) => t.slug === slug);
      if (task && task.inlineImages[index - 1]?.status === 'pending') {
        task.inlineImages[index - 1].status = 'generated';
        task.inlineImages[index - 1].generatedAt = new Date().toISOString();
        task.updatedAt = new Date().toISOString();
        task.mediaStatus = calculateMediaStatus(task);
        updated++;
        console.log(`✅ 内页: ${slug}-${index}`);
      }
    }
  }

  saveTasks(data);
  console.log(`\n📊 已更新 ${updated} 个任务状态`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--scan')) {
    scanAndMark();
    return;
  }

  const slugIndex = args.indexOf('--slug');
  const typeIndex = args.indexOf('--type');
  const indexIndex = args.indexOf('--index');

  if (slugIndex === -1 || typeIndex === -1) {
    console.log('用法:');
    console.log('  --scan                           扫描目录自动标记');
    console.log('  --slug <slug> --type cover       标记封面完成');
    console.log('  --slug <slug> --type inline --index <n>  标记内页完成');
    return;
  }

  const slug = args[slugIndex + 1];
  const type = args[typeIndex + 1];

  if (type === 'cover') {
    markCover(slug);
  } else if (type === 'inline') {
    const index =
      indexIndex !== -1 ? Number.parseInt(args[indexIndex + 1], 10) : 1;
    markInline(slug, index);
  } else {
    console.error('❌ 无效的类型，使用 cover 或 inline');
  }
}

main();
