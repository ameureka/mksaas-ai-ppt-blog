/**
 * 部署图片到 public 目录并更新 MDX 文件
 */

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

const sourceDir = '深入细化调整/006-blogs-seo-博文设计/广告-博文';
const imageSourceDir = '深入细化调整/006-01-博客内容创作/draft-code/generated-images';
const imageTargetDir = 'public/images/blog/ppt';

// 分类目录映射
const categoryDirs: Record<string, string> = {
  '产品营销与营销方案PPT': 'marketing',
  '商务汇报PPT': 'business',
  '年终总结PPT': 'year-end',
  '教育培训与课件PPT': 'education',
  '述职报告PPT': 'report',
  '项目提案PPT': 'proposal',
  '通用与混合场景': 'general',
  '付费模板搜索与产品视角': 'paid-search',
};

function scanMdxFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...scanMdxFiles(full));
    else if (entry.name.endsWith('.zh.mdx')) files.push(full);
  }
  return files;
}

function getCategory(filePath: string): string {
  for (const [dir, cat] of Object.entries(categoryDirs)) {
    if (filePath.includes(dir)) return cat;
  }
  return 'general';
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log('🖼️ 部署图片');
  console.log('配置:', { dryRun });

  // 创建目标目录
  if (!dryRun) {
    fs.mkdirSync(imageTargetDir, { recursive: true });
  }

  // 复制图片
  let imagesCopied = 0;
  const categoryImageDirs = ['marketing', 'business', 'year-end', 'education', 'report', 'proposal', 'general', 'paid-search'];
  
  for (const cat of categoryImageDirs) {
    const srcDir = path.join(imageSourceDir, cat);
    if (!fs.existsSync(srcDir)) continue;
    
    const targetCatDir = path.join(imageTargetDir, cat);
    if (!dryRun) {
      fs.mkdirSync(targetCatDir, { recursive: true });
    }
    
    for (const file of fs.readdirSync(srcDir)) {
      if (!file.endsWith('.png') && !file.endsWith('.jpg')) continue;
      const src = path.join(srcDir, file);
      const dest = path.join(targetCatDir, file);
      if (!dryRun) {
        fs.copyFileSync(src, dest);
      }
      imagesCopied++;
    }
  }
  
  console.log(`📁 复制了 ${imagesCopied} 张图片到 ${imageTargetDir}`);

  // 更新 MDX 文件中的图片路径
  const mdxFiles = scanMdxFiles(sourceDir);
  let mdxUpdated = 0;

  for (const file of mdxFiles) {
    const raw = fs.readFileSync(file, 'utf-8');
    const { data, content } = matter(raw);
    
    const category = getCategory(file);
    const slug = path.basename(file, '.zh.mdx');
    
    // 查找对应的封面图片
    const coverImageDir = path.join(imageSourceDir, category);
    let coverImage = '';
    
    if (fs.existsSync(coverImageDir)) {
      const images = fs.readdirSync(coverImageDir).filter(f => f.includes('cover') || f.includes(slug.slice(0, 20)));
      if (images.length > 0) {
        coverImage = `/images/blog/ppt/${category}/${images[0]}`;
      } else {
        // 使用第一张图片作为封面
        const allImages = fs.readdirSync(coverImageDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
        if (allImages.length > 0) {
          const idx = mdxUpdated % allImages.length;
          coverImage = `/images/blog/ppt/${category}/${allImages[idx]}`;
        }
      }
    }
    
    if (coverImage && data.image !== coverImage) {
      data.image = coverImage;
      if (!dryRun) {
        fs.writeFileSync(file, matter.stringify(content, data), 'utf-8');
      }
      mdxUpdated++;
    }
  }

  console.log(`📝 更新了 ${mdxUpdated} 个 MDX 文件的图片路径`);
}

main();
