#!/usr/bin/env npx tsx
/**
 * 阶段 2.2: 批量更新博客文章的 author 字段
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';

const OLD_AUTHORS = ['fox', 'mksaas', 'haitang', 'mkdirs', 'pptx-team'];
const NEW_AUTHOR = 'official';

function updateAuthors(dir: string): number {
  let count = 0;

  try {
    const files = readdirSync(dir);

    for (const file of files) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        count += updateAuthors(fullPath);
      } else if (file.endsWith('.mdx')) {
        const content = readFileSync(fullPath, 'utf-8');

        // 检查是否包含旧作者
        let updated = false;
        let newContent = content;

        for (const oldAuthor of OLD_AUTHORS) {
          const regex = new RegExp(`author:\\s*${oldAuthor}\\b`, 'g');
          if (regex.test(newContent)) {
            newContent = newContent.replace(regex, `author: ${NEW_AUTHOR}`);
            updated = true;
          }
        }

        if (updated) {
          writeFileSync(fullPath, newContent);
          count++;
          console.log(`✅ Updated: ${fullPath}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing ${dir}:`, error);
  }

  return count;
}

console.log('🔄 开始更新博客文章作者...\n');

const totalUpdated = updateAuthors('content/blog');

console.log(`\n📊 总计更新: ${totalUpdated} 篇文章`);
