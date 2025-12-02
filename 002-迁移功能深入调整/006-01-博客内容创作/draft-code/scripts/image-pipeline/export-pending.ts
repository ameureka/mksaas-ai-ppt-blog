/**
 * 导出待处理 Prompt 清单 - 供网页手工生成使用
 *
 * 用法: npx tsx scripts/image-pipeline/export-pending.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ImageTasksData } from './types';

const CONFIG = {
  dataDir: path.resolve(__dirname, '../../data'),
  tasksFile: 'image-tasks.json',
  outputFile: 'pending-prompts.md',
};

function main() {
  const tasksPath = path.join(CONFIG.dataDir, CONFIG.tasksFile);

  if (!fs.existsSync(tasksPath)) {
    console.error('❌ 任务文件不存在，请先运行 generate-prompts.ts');
    process.exit(1);
  }

  const data: ImageTasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
  const lines: string[] = [
    '# 待处理图片 Prompt 清单',
    '',
    `> 导出时间: ${new Date().toISOString()}`,
    '',
    '## 使用说明',
    '',
    '1. 复制下方 Prompt 到 Gemini 网页',
    '2. 生成图片后下载，按指定文件名保存',
    '3. 保存到 `generated-images/` 目录',
    '4. 运行 `mark-complete.ts` 更新状态',
    '',
    '## 文件命名规范',
    '',
    '- 封面: `{slug}-cover.jpg` (1200x630)',
    '- 内页: `{slug}-{n}.png` (1000x600)',
    '',
    '---',
    '',
  ];

  let pendingCovers = 0;
  let pendingInlines = 0;

  // 按分类分组
  const byCategory = new Map<string, typeof data.tasks>();
  for (const task of data.tasks) {
    const cat = task.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(task);
  }

  for (const [category, tasks] of byCategory) {
    const pendingTasks = tasks.filter(
      (t) =>
        t.cover.status === 'pending' ||
        t.inlineImages.some((i) => i.status === 'pending')
    );

    if (pendingTasks.length === 0) continue;

    lines.push(`## ${category}`);
    lines.push('');

    for (const task of pendingTasks) {
      // 封面
      if (task.cover.status === 'pending') {
        pendingCovers++;
        lines.push(`### 🖼️ 封面: ${task.title}`);
        lines.push('');
        lines.push(`**文件名**: \`${task.cover.filename}\``);
        lines.push('**尺寸**: 1200x630');
        lines.push(`**文字**: ${task.cover.textToRender}`);
        lines.push('');
        lines.push('**Prompt**:');
        lines.push('```');
        lines.push(task.cover.prompt);
        lines.push('```');
        lines.push('');
      }

      // 内页
      const pendingInlineImages = task.inlineImages.filter(
        (i) => i.status === 'pending'
      );
      for (const img of pendingInlineImages) {
        pendingInlines++;
        lines.push(`### 📄 内页: ${img.scene}`);
        lines.push('');
        lines.push(`**文件名**: \`${img.filename}\``);
        lines.push('**尺寸**: 1000x600');
        lines.push('');
        lines.push('**Prompt**:');
        lines.push('```');
        lines.push(img.prompt);
        lines.push('```');
        lines.push('');
      }
    }

    lines.push('---');
    lines.push('');
  }

  // 写入文件
  const outputPath = path.join(CONFIG.dataDir, CONFIG.outputFile);
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');

  console.log('✅ 导出完成');
  console.log(`📄 输出文件: ${outputPath}`);
  console.log(`📊 待处理: 封面 ${pendingCovers} 张, 内页 ${pendingInlines} 张`);
}

main();
