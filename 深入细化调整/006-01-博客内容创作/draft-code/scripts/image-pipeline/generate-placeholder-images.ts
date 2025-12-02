/**
 * 批量生成占位图片脚本
 * 使用示例图片复制生成所有需要的图片，避免阻塞后续流程
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '../..');
const TASKS_FILE = path.join(ROOT, 'data/image-tasks.json');
const SAMPLE_DIR = path.join(ROOT, 'generated-images');
const OUTPUT_DIR = path.join(ROOT, 'generated-images');

// 读取示例图片
function getSampleImages(): { covers: string[]; inlines: string[] } {
  const files = fs.readdirSync(SAMPLE_DIR).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
  return {
    covers: files.filter(f => f.startsWith('generated_')).slice(0, 1),
    inlines: files.filter(f => f.startsWith('generated_')).slice(0, 3),
  };
}

// 读取任务数据
function loadTasks(): any {
  const content = fs.readFileSync(TASKS_FILE, 'utf-8');
  return JSON.parse(content);
}

// 确保目录存在
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 复制文件
function copyFile(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
    return true;
  }
  return false;
}

async function main() {
  console.log('🚀 开始生成占位图片...\n');

  const samples = getSampleImages();
  if (samples.covers.length === 0 || samples.inlines.length === 0) {
    console.error('❌ 未找到示例图片，请先在 generated-images/ 放入示例图片');
    process.exit(1);
  }

  console.log(`📁 示例图片: ${samples.covers.length} 封面, ${samples.inlines.length} 内页\n`);

  const data = loadTasks();
  const tasks = data.tasks;

  let coverCount = 0;
  let inlineCount = 0;
  const categoryStats: Record<string, number> = {};

  for (const task of tasks) {
    const categoryDir = path.join(OUTPUT_DIR, task.categoryEn);
    ensureDir(categoryDir);

    // 生成封面
    const coverSrc = path.join(SAMPLE_DIR, samples.covers[0]);
    const coverDest = path.join(categoryDir, task.cover.filename);
    if (copyFile(coverSrc, coverDest)) {
      coverCount++;
    }

    // 生成内页
    for (let i = 0; i < task.inlineImages.length; i++) {
      const inline = task.inlineImages[i];
      const sampleIdx = i % samples.inlines.length;
      const inlineSrc = path.join(SAMPLE_DIR, samples.inlines[sampleIdx]);
      const inlineDest = path.join(categoryDir, inline.filename);
      if (copyFile(inlineSrc, inlineDest)) {
        inlineCount++;
      }
    }

    // 统计分类
    categoryStats[task.categoryEn] = (categoryStats[task.categoryEn] || 0) + 1;
  }

  console.log('📊 分类统计:');
  for (const [cat, count] of Object.entries(categoryStats)) {
    console.log(`   ${cat}: ${count} 篇`);
  }

  console.log(`\n✅ 生成完成`);
  console.log(`   封面图: ${coverCount} 张`);
  console.log(`   内页图: ${inlineCount} 张`);
  console.log(`   总计: ${coverCount + inlineCount} 张`);
  console.log(`\n📁 输出目录: ${OUTPUT_DIR}`);
}

main().catch(console.error);
