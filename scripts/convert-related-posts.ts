#!/usr/bin/env node

/**
 * 将 MDX 文件中的"相关推荐"链接转换为 frontmatter 的 relatedPosts 字段
 *
 * 功能：
 * 1. 读取 rename-map.txt 建立中文文件名→英文 slug 的映射
 * 2. 提取"相关推荐"部分的链接
 * 3. 将链接转换为 relatedPosts 数组添加到 frontmatter
 * 4. 删除原有的"相关推荐"部分（因为会用组件自动渲染）
 *
 * 使用方法：
 * npx tsx scripts/convert-related-posts.ts
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'fs';
import { basename, dirname, join } from 'path';

// 简单的递归查找 mdx 文件
function findMdxFiles(dir: string, suffix: string): string[] {
  const results: string[] = [];

  function walk(currentDir: string) {
    const files = readdirSync(currentDir);
    for (const file of files) {
      const filePath = join(currentDir, file);
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        walk(filePath);
      } else if (file.endsWith(suffix)) {
        results.push(filePath);
      }
    }
  }

  walk(dir);
  return results;
}

// 从 rename-map.txt 构建映射表
function buildRenameMap(): Map<string, string> {
  const map = new Map<string, string>();

  if (!existsSync('rename-map.txt')) {
    console.error('❌ rename-map.txt 不存在');
    return map;
  }

  const content = readFileSync('rename-map.txt', 'utf-8');
  // 文件中的换行符可能是 \n 字面字符串，需要处理
  const lines = content.split(/\\n|\n/).filter((line) => line.includes(' -> '));

  for (const line of lines) {
    // 格式: 中文文件名.mdx -> english-slug.mdx (slug)
    const match = line.match(/^(.+?)\.(zh\.)?mdx\s+->\s+(.+?)\.(?:zh\.)?mdx/);
    if (match) {
      const chineseName = match[1];
      const englishSlug = match[3];
      // 存储中文名到英文 slug 的映射
      map.set(chineseName, englishSlug);
    }
  }

  console.log(`📚 已加载 ${map.size} 条重命名映射\n`);
  return map;
}

// 从链接路径中提取中文文件名
function extractChineseNameFromLink(link: string): string | null {
  // 链接格式: /blog/中文标题 或 /zh/blog/中文标题
  const match = link.match(/\/blog\/(.+?)(?:\)|$)/);
  if (match) {
    return decodeURIComponent(match[1].trim());
  }
  return null;
}

// 提取相关推荐部分的链接
function extractRelatedLinks(
  content: string
): { title: string; link: string }[] {
  const links: { title: string; link: string }[] = [];

  // 匹配 ## 相关推荐 部分
  const relatedMatch = content.match(
    /## 相关推荐[\s\S]*?(?=\n## |## 延伸阅读|$)/
  );
  if (!relatedMatch) return links;

  const relatedSection = relatedMatch[0];

  // 匹配 markdown 链接 [title](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match = linkRegex.exec(relatedSection);

  while (match !== null) {
    const title = match[1].trim();
    const link = match[2].trim();

    // 只处理内部博客链接
    if (link.includes('/blog/')) {
      links.push({ title, link });
    }
    match = linkRegex.exec(relatedSection);
  }

  return links;
}

// 更新 frontmatter 中的 relatedPosts
function updateFrontmatter(content: string, slugs: string[]): string {
  if (slugs.length === 0) return content;

  // 检查是否已有 frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return content;

  const frontmatter = frontmatterMatch[1];
  const afterFrontmatter = content.slice(frontmatterMatch[0].length);

  // 检查是否已有 relatedPosts
  if (frontmatter.includes('relatedPosts:')) {
    // 已有 relatedPosts，追加新的（去重）
    const existingMatch = frontmatter.match(
      /relatedPosts:\n((?:\s+-\s+.+\n?)*)/
    );
    if (existingMatch) {
      const existingSlugs = existingMatch[1]
        .split('\n')
        .map((line) => line.replace(/^\s+-\s+/, '').trim())
        .filter(Boolean);

      const allSlugs = [...new Set([...existingSlugs, ...slugs])];
      const newRelatedPosts = `relatedPosts:\n${allSlugs.map((s) => `  - ${s}`).join('\n')}`;

      const updatedFrontmatter = frontmatter.replace(
        /relatedPosts:\n(?:\s+-\s+.+\n?)*/,
        newRelatedPosts + '\n'
      );

      return `---\n${updatedFrontmatter}\n---${afterFrontmatter}`;
    }
  }

  // 没有 relatedPosts，添加新的
  const relatedPostsYaml = `relatedPosts:\n${slugs.map((s) => `  - ${s}`).join('\n')}`;
  const updatedFrontmatter = `${frontmatter}\n${relatedPostsYaml}`;

  return `---\n${updatedFrontmatter}\n---${afterFrontmatter}`;
}

// 删除相关推荐部分
function removeRelatedSection(content: string): string {
  // 删除 ## 相关推荐 到下一个 ## 或文件结尾
  return content.replace(/\n## 相关推荐[\s\S]*?(?=\n## |$)/, '');
}

// 根据文件路径获取分类
function getCategoryFromPath(filePath: string): string {
  // content/blog/ppt/business/xxx.mdx -> business
  const parts = filePath.split('/');
  const pptIndex = parts.indexOf('ppt');
  if (pptIndex !== -1 && parts[pptIndex + 1]) {
    return parts[pptIndex + 1];
  }
  return 'general';
}

async function main() {
  const renameMap = buildRenameMap();

  if (renameMap.size === 0) {
    console.error('❌ 无法加载重命名映射，请确保 rename-map.txt 存在');
    process.exit(1);
  }

  const files = findMdxFiles('content/blog/ppt', '.zh.mdx');
  console.log(`找到 ${files.length} 个中文文件需要处理\n`);

  let updatedFiles = 0;
  let totalLinksConverted = 0;
  const errors: string[] = [];

  for (const file of files) {
    try {
      let content = readFileSync(file, 'utf-8');
      const originalContent = content;

      // 提取相关推荐链接
      const relatedLinks = extractRelatedLinks(content);

      if (relatedLinks.length === 0) {
        continue;
      }

      // 将中文链接转换为英文 slug
      const slugs: string[] = [];

      for (const { link } of relatedLinks) {
        const chineseName = extractChineseNameFromLink(link);
        if (chineseName) {
          const englishSlug = renameMap.get(chineseName);
          if (englishSlug) {
            slugs.push(englishSlug);
            totalLinksConverted++;
          } else {
            // 尝试模糊匹配（去除空格等）
            const normalizedName = chineseName.replace(/\s+/g, '');
            for (const [key, value] of renameMap.entries()) {
              if (key.replace(/\s+/g, '') === normalizedName) {
                slugs.push(value);
                totalLinksConverted++;
                break;
              }
            }
          }
        }
      }

      if (slugs.length > 0) {
        // 更新 frontmatter
        content = updateFrontmatter(content, slugs);

        // 删除相关推荐部分
        content = removeRelatedSection(content);

        if (content !== originalContent) {
          writeFileSync(file, content);
          updatedFiles++;

          const shortPath = file.split('/').slice(-2).join('/');
          console.log(
            `✅ ${shortPath}: 转换了 ${slugs.length} 个链接 -> relatedPosts`
          );
        }
      }
    } catch (error) {
      errors.push(`${file}: ${error}`);
    }
  }

  console.log('\n=== 转换完成 ===');
  console.log(`✅ 更新了 ${updatedFiles} 个文件`);
  console.log(`🔗 转换了 ${totalLinksConverted} 个链接`);

  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} 个错误:`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }

  console.log(
    '\n📝 说明: 相关推荐链接已转换为 frontmatter 的 relatedPosts 字段'
  );
  console.log('💡 提示: 需要在博客模板中添加 RelatedPosts 组件来渲染这些链接');
}

main().catch(console.error);
