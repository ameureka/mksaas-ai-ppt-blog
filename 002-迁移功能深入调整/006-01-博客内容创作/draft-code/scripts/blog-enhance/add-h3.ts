/**
 * H3 标题增强脚本 - 在 H2 下添加 H3 子标题
 */

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

const sourceDir = '深入细化调整/006-blogs-seo-博文设计/广告-博文';
const minH3Count = 5;

function countH3(content: string): number {
  return (content.match(/^### /gm) || []).length;
}

function addH3ToSection(content: string): string {
  // 在每个 H2 段落中，找到列表项并转换为 H3
  return content.replace(
    /(^## .+$\n\n(?:(?!^##).)*?)^([•\-\*] .+)$/gm,
    (match, section, listItem) => {
      // 将列表项转为 H3
      const h3 = listItem.replace(/^[•\-\*] /, '### ');
      return section + h3;
    }
  );
}

function enhanceH3(content: string): string {
  let result = content;

  // 策略 1: 将加粗文本转为 H3
  result = result.replace(
    /(^## .+$\n\n(?:(?!^##).)*?)\*\*(.{5,30})\*\*(?=\n\n)/gm,
    '$1### $2\n'
  );

  // 策略 2: 将编号列表转为 H3
  result = result.replace(
    /(^## .+$\n\n(?:(?!^##).)*?)^\d+\.\s+(.{5,30})$/gm,
    '$1### $2'
  );

  return result;
}

function processFile(filePath: string): boolean {
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(rawContent);

  const h3Count = countH3(content);
  if (h3Count >= minH3Count) {
    return false;
  }

  const enhanced = enhanceH3(content);
  const newH3Count = countH3(enhanced);

  if (newH3Count <= h3Count) {
    return false;
  }

  const newContent = matter.stringify(enhanced, data);
  fs.writeFileSync(filePath, newContent, 'utf-8');

  console.log(
    `✅ ${path.basename(filePath)}: ${h3Count} → ${newH3Count} 个 H3`
  );
  return true;
}

function main() {
  console.log('📝 H3 标题增强脚本');
  console.log(`最小 H3 数量: ${minH3Count}\n`);

  const files = fs
    .readdirSync(sourceDir, { recursive: true, withFileTypes: true })
    .filter((f) => f.isFile() && f.name.endsWith('.zh.mdx'))
    .map((f) => path.join(f.path || f.parentPath, f.name));

  let count = 0;
  for (const file of files) {
    if (processFile(file)) {
      count++;
    }
  }

  console.log(`\n📊 增强了 ${count} 个文件`);
}

main();
