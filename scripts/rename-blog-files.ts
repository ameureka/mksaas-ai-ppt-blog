#!/usr/bin/env node

/**
 * 批量重命名博客文件为英文 slug
 *
 * 使用方法：
 * npx tsx scripts/rename-blog-files.ts
 */

import { existsSync, readFileSync, renameSync } from 'fs';
import { basename, dirname, join } from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';

// 简单的中文转英文规则（基于常见关键词）
const titleToSlugRules: Record<string, string> = {
  // PPT 类型
  商务汇报: 'business-report',
  教育培训: 'education-training',
  产品营销: 'product-marketing',
  年终总结: 'year-end-summary',
  项目提案: 'project-proposal',
  述职报告: 'job-report',
  营销方案: 'marketing-plan',
  培训课件: 'training-courseware',

  // 动作词
  怎么: 'how-to',
  如何: 'how-to',
  什么: 'what',
  为什么: 'why',
  一般: 'general',
  推荐: 'recommended',
  包含: 'includes',
  设计: 'design',
  选择: 'choose',
  制作: 'create',
  下载: 'download',
  使用: 'use',
  修改: 'modify',
  优化: 'optimize',

  // 描述词
  专业: 'professional',
  实战: 'practical',
  完整: 'complete',
  快速: 'quick',
  简单: 'simple',
  高效: 'efficient',
  清晰: 'clear',
  模板: 'template',
  页数: 'pages',
  字体: 'fonts',
  配色: 'colors',
  风格: 'style',
  结构: 'structure',
  内容: 'content',
  案例: 'case',
  指南: 'guide',
  技巧: 'tips',
  建议: 'suggestions',
  策略: 'strategy',
  方法: 'methods',
  流程: 'process',
  标准: 'standards',

  // 其他
  PPT: 'ppt',
  AI: 'ai',
  免费: 'free',
  付费: 'paid',
  vs: 'vs',
};

function generateSlug(title: string): string {
  // 移除标点符号
  let slug = title
    .replace(/[？！。，、：；""''（）《》【】…—]/g, ' ')
    .replace(/[?!.,;:"""'''()\[\]…—]/g, ' ')
    .trim();

  // 应用替换规则
  Object.entries(titleToSlugRules).forEach(([zh, en]) => {
    slug = slug.replace(new RegExp(zh, 'g'), en);
  });

  // 处理剩余的中文（使用拼音或保持简短）
  // 这里简化处理：移除所有非英文字符
  slug = slug
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '');

  // 限制长度
  const parts = slug.split('-').filter((p) => p.length > 0);
  if (parts.length > 8) {
    slug = parts.slice(0, 8).join('-');
  }

  return slug || 'untitled';
}

async function main() {
  const files = glob.sync('content/blog/ppt/**/*.mdx');

  console.log(`找到 ${files.length} 个文件需要处理\\n`);

  let renamed = 0;
  let skipped = 0;
  let errors = 0;

  const renameMap: Array<{ old: string; new: string; slug: string }> = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const { data } = matter(content);

      const oldBasename = basename(file);

      // 跳过已经是英文的文件
      if (!/[\u4e00-\u9fa5]/.test(oldBasename)) {
        skipped++;
        continue;
      }

      // 生成 slug
      const slug = generateSlug(data.title || oldBasename);
      const dir = dirname(file);
      const ext = oldBasename.endsWith('.zh.mdx') ? '.zh.mdx' : '.mdx';
      const newBasename = `${slug}${ext}`;
      const newFile = join(dir, newBasename);

      // 检查文件是否已存在
      if (existsSync(newFile) && newFile !== file) {
        console.warn(`⚠️  冲突: ${newBasename} 已存在，跳过 ${oldBasename}`);
        errors++;
        continue;
      }

      renameMap.push({
        old: file,
        new: newFile,
        slug,
      });

      // 执行重命名
      renameSync(file, newFile);
      renamed++;

      if (renamed % 20 === 0) {
        console.log(`✅ 已处理 ${renamed} 个文件...`);
      }
    } catch (error) {
      console.error(`❌ 处理失败: ${file}`, error);
      errors++;
    }
  }

  console.log('\\n=== 重命名完成 ===');
  console.log(`✅ 成功重命名: ${renamed} 个文件`);
  console.log(`⏭️  跳过（已是英文）: ${skipped} 个文件`);
  console.log(`❌ 错误: ${errors} 个文件`);

  // 保存映射表
  const mapContent = renameMap
    .map(
      ({ old, new: newPath, slug }) =>
        `${basename(old)} -> ${basename(newPath)} (${slug})`
    )
    .join('\\n');

  const { writeFileSync } = await import('fs');
  writeFileSync('rename-map.txt', mapContent);
  console.log('\\n📝 重命名映射已保存到 rename-map.txt');
}

main().catch(console.error);
