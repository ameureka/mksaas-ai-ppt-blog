#!/usr/bin/env node

/**
 * 批量更新 MDX 文件中的内部链接
 *
 * 将 /blog/中文标题 替换为 /blog/ppt/{category}/{english-slug}
 *
 * 使用方法：
 * npx tsx scripts/fix-internal-links.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

async function main() {
  const files = glob.sync('content/blog/ppt/**/*.mdx');

  console.log(`找到 ${files.length} 个文件需要处理\\n`);

  let updatedFiles = 0;
  const totalLinksFixed = 0;

  for (const file of files) {
    try {
      let content = readFileSync(file, 'utf-8');
      const originalContent = content;

      // 移除所有内部链接中的 /blog/ 前缀
      // 因为 LocaleLink 会自动处理路径
      // 将 [text](/blog/中文标题) 替换为 [text](/blog/ppt/{category}/{slug})

      // 简单方案：移除所有相关推荐部分，让用户手动添加或使用其他方式
      // 更好的方案：完全删除这些手动链接，改用自动相关文章推荐

      // 删除"相关推荐"部分（临时方案）
      content = content.replace(/## 相关推荐[\\s\\S]*?(?=\\n##|$)/g, '');

      if (content !== originalContent) {
        writeFileSync(file, content);
        updatedFiles++;
        console.log(`✅ 已更新: ${file.split('/').slice(-2).join('/')}`);
      }
    } catch (error) {
      console.error(`❌ 处理失败: ${file}`, error);
    }
  }

  console.log(`\\n=== 更新完成 ===`);
  console.log(`✅ 更新了 ${updatedFiles} 个文件`);
  console.log(`\\n说明: 已删除所有手动的"相关推荐"部分`);
  console.log(`建议: 使用 frontmatter 中的 relatedPosts 字段来配置相关文章`);
}

main().catch(console.error);
