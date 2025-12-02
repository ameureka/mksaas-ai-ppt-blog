/**
 * 截断过长的描述（目标 70-100 字符）
 */

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

const sourceDir = '深入细化调整/006-blogs-seo-博文设计/广告-博文';
const maxDescLength = 100;

function scanFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...scanFiles(full));
    else if (entry.name.endsWith('.zh.mdx')) files.push(full);
  }
  return files;
}

function trimDescription(desc: string): string {
  if (desc.length <= maxDescLength) return desc;
  
  // 尝试在句号、逗号或空格处截断
  let trimmed = desc.slice(0, maxDescLength);
  
  // 找最后一个合适的截断点
  const lastPeriod = trimmed.lastIndexOf('。');
  const lastComma = trimmed.lastIndexOf('，');
  const lastSpace = trimmed.lastIndexOf(' ');
  
  const cutPoint = Math.max(lastPeriod, lastComma, lastSpace);
  
  if (cutPoint > 60) {
    trimmed = desc.slice(0, cutPoint + 1);
  } else {
    trimmed = desc.slice(0, 97) + '...';
  }
  
  return trimmed;
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log('✂️ 截断过长描述');
  console.log('配置:', { dryRun, maxDescLength });

  const files = scanFiles(sourceDir);
  let trimmed = 0;

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf-8');
    const { data, content } = matter(raw);

    const desc = String(data.description || '');
    if (desc.length <= maxDescLength) continue;

    data.description = trimDescription(desc);
    
    if (!dryRun) {
      fs.writeFileSync(file, matter.stringify(content, data), 'utf-8');
    }
    trimmed++;
  }

  console.log(`\n📊 结果: 截断了 ${trimmed} 个文件的描述`);
}

main();
