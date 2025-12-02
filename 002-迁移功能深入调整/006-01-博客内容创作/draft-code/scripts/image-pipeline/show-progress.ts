/**
 * 显示图片生成进度
 *
 * 用法: npx tsx scripts/image-pipeline/show-progress.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ImageTasksData } from './types';
import { calculateProgress } from './types';

const CONFIG = {
  dataDir: path.resolve(__dirname, '../../data'),
  tasksFile: 'image-tasks.json',
};

function main() {
  const tasksPath = path.join(CONFIG.dataDir, CONFIG.tasksFile);

  if (!fs.existsSync(tasksPath)) {
    console.error('❌ 任务文件不存在，请先运行 generate-prompts.ts');
    process.exit(1);
  }

  const data: ImageTasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
  const progress = calculateProgress(data.tasks);

  console.log('📊 图片生成进度');
  console.log('================');
  console.log('');

  // 封面进度
  const coverDone = progress.coverApproved + progress.coverUploaded;
  const coverPercent = Math.round((coverDone / progress.total) * 100);
  console.log('🖼️  封面图:');
  console.log(`   待处理: ${progress.coverPending}`);
  console.log(`   已生成: ${progress.coverGenerated}`);
  console.log(`   已审核: ${progress.coverApproved}`);
  console.log(`   已上传: ${progress.coverUploaded}`);
  console.log(`   完成率: ${coverDone}/${progress.total} (${coverPercent}%)`);
  console.log('');

  // 内页进度
  const totalInline =
    progress.inlinePending +
    progress.inlineGenerated +
    progress.inlineApproved +
    progress.inlineUploaded;
  const inlineDone = progress.inlineApproved + progress.inlineUploaded;
  const inlinePercent =
    totalInline > 0 ? Math.round((inlineDone / totalInline) * 100) : 0;
  console.log('📄 内页图:');
  console.log(`   待处理: ${progress.inlinePending}`);
  console.log(`   已生成: ${progress.inlineGenerated}`);
  console.log(`   已审核: ${progress.inlineApproved}`);
  console.log(`   已上传: ${progress.inlineUploaded}`);
  console.log(`   完成率: ${inlineDone}/${totalInline} (${inlinePercent}%)`);
  console.log('');

  // 整体状态
  console.log('📦 整体状态:');
  console.log(`   未开始: ${progress.mediaStatusNone}`);
  console.log(`   进行中: ${progress.mediaStatusPartial}`);
  console.log(`   已完成: ${progress.mediaStatusDone}`);
  console.log('');

  // 进度条
  const barWidth = 30;
  const coverBar =
    '█'.repeat(Math.round((coverPercent / 100) * barWidth)) +
    '░'.repeat(barWidth - Math.round((coverPercent / 100) * barWidth));
  const inlineBar =
    '█'.repeat(Math.round((inlinePercent / 100) * barWidth)) +
    '░'.repeat(barWidth - Math.round((inlinePercent / 100) * barWidth));

  console.log('📈 进度条:');
  console.log(`   封面: [${coverBar}] ${coverPercent}%`);
  console.log(`   内页: [${inlineBar}] ${inlinePercent}%`);
  console.log('');

  // 按分类统计
  const byCategory = new Map<string, { total: number; done: number }>();
  for (const task of data.tasks) {
    const cat = task.category;
    if (!byCategory.has(cat)) byCategory.set(cat, { total: 0, done: 0 });
    const stats = byCategory.get(cat)!;
    stats.total++;
    if (task.mediaStatus === 'done') stats.done++;
  }

  console.log('📁 分类统计:');
  for (const [cat, stats] of byCategory) {
    const percent = Math.round((stats.done / stats.total) * 100);
    console.log(`   ${cat}: ${stats.done}/${stats.total} (${percent}%)`);
  }
}

main();
