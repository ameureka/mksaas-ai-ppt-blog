/**
 * 博客图片任务生成脚本
 *
 * 功能：
 * - 为每篇博客生成封面图 Prompt
 * - 为每篇博客生成内页图 Prompt
 * - 输出 Markdown 格式的任务清单
 *
 * 迁移说明：
 * - 校验通过后迁移到 scripts/blog-image-tasks/
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import matter from 'gray-matter';
import { type CategoryStyle, categoryStyles } from '../../config/category-map';

// ============================================================================
// 类型定义
// ============================================================================

export interface ImageTaskConfig {
  /** 博客内容目录 */
  contentDir: string;
  /** 输出目录 */
  outputDir: string;
  /** 封面图数量 */
  coverCount: number;
  /** 内页图数量 */
  inlineCount: number;
}

export interface ImageTask {
  /** 文件 slug */
  slug: string;
  /** 文章标题 */
  title: string;
  /** 分类 */
  category: string;
  /** 封面图任务 */
  cover: CoverImageTask;
  /** 内页图任务 */
  inlineImages: InlineImageTask[];
  /** 状态 */
  status: ImageTaskStatus;
}

export interface CoverImageTask {
  /** 文件名 */
  filename: string;
  /** 尺寸 */
  size: string;
  /** Prompt */
  prompt: string;
  /** 是否完成 */
  done: boolean;
}

export interface InlineImageTask {
  /** 文件名 */
  filename: string;
  /** 尺寸 */
  size: string;
  /** Prompt */
  prompt: string;
  /** 场景描述 */
  scene: string;
  /** 是否完成 */
  done: boolean;
}

export interface ImageTaskStatus {
  /** 封面图完成 */
  coverDone: boolean;
  /** 内页图完成数 */
  inlineDone: number;
  /** 已上传 */
  uploaded: boolean;
}

export const defaultImageTaskConfig: ImageTaskConfig = {
  contentDir: 'content/blog',
  outputDir: '深入细化调整/006-01-博客内容创作/流水线设计-博文生产',
  coverCount: 1,
  inlineCount: 3,
};

// ============================================================================
// Prompt 生成
// ============================================================================

/**
 * 生成封面图 Prompt
 */
export function generateCoverPrompt(
  title: string,
  category: string,
  style: CategoryStyle
): string {
  const keywords = extractKeywords(title);

  return `Create a professional blog cover image for a PPT/presentation article.

Theme: ${title}
Category: ${style.name}
Style: ${style.style}
Color Palette: ${style.colors.join(', ')}

Visual Elements:
${style.elements.map((e) => `- ${e}`).join('\n')}

Keywords to incorporate: ${keywords.join(', ')}

Requirements:
- Size: 1200x630 pixels (OG image ratio)
- Modern, clean design
- Professional business style
- No text overlay (title will be added separately)
- High contrast, visually appealing
- Suitable for social media sharing`;
}

/**
 * 生成内页图 Prompt
 */
export function generateInlinePrompt(
  title: string,
  scene: string,
  category: string,
  style: CategoryStyle,
  index: number
): string {
  return `Create an inline illustration for a PPT/presentation blog article.

Article: ${title}
Scene: ${scene}
Category: ${style.name}
Style: ${style.style}
Color Palette: ${style.colors.join(', ')}

Requirements:
- Size: 1000x600 pixels
- Clean, informative illustration
- Match the article's professional tone
- Can include simple diagrams, icons, or conceptual visuals
- No text (captions will be added in markdown)
- Image ${index + 1} of the article`;
}

/**
 * 从标题提取关键词
 */
export function extractKeywords(title: string): string[] {
  const keywords: string[] = [];

  // PPT 相关关键词
  const pptKeywords = [
    'PPT',
    '模板',
    '设计',
    '制作',
    '技巧',
    '汇报',
    '总结',
    '述职',
    '培训',
    '营销',
    '提案',
    '方案',
    '课件',
    '演示',
  ];

  for (const kw of pptKeywords) {
    if (title.includes(kw)) {
      keywords.push(kw);
    }
  }

  return keywords.length > 0 ? keywords : ['PPT', '演示', '专业'];
}

/**
 * 从文章内容提取场景
 */
export function extractScenes(content: string, count: number): string[] {
  const scenes: string[] = [];

  // 提取 H2 标题作为场景
  const h2Matches = content.match(/^## .+$/gm) || [];
  for (const match of h2Matches.slice(0, count)) {
    const scene = match.replace(/^## /, '').trim();
    if (scene && !scene.includes('常见问题') && !scene.includes('FAQ')) {
      scenes.push(scene);
    }
  }

  // 如果场景不够，添加通用场景
  const defaultScenes = [
    '核心概念展示',
    '步骤流程图解',
    '案例效果对比',
    '工具使用演示',
  ];

  while (scenes.length < count) {
    const defaultScene = defaultScenes[scenes.length % defaultScenes.length];
    scenes.push(defaultScene);
  }

  return scenes.slice(0, count);
}

// ============================================================================
// 任务生成
// ============================================================================

/**
 * 为单个文件生成图片任务
 */
export function generateImageTaskForFile(
  filePath: string,
  config: ImageTaskConfig
): ImageTask | null {
  try {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(rawContent);
    const slug = path.basename(filePath, path.extname(filePath));

    const title = data.title || slug;
    const categories = data.categories || ['general'];
    const category = categories[0];
    const style = categoryStyles[category] || categoryStyles.general;

    // 生成封面图任务
    const cover: CoverImageTask = {
      filename: `${slug}-cover.jpg`,
      size: '1200x630',
      prompt: generateCoverPrompt(title, category, style),
      done: false,
    };

    // 提取场景并生成内页图任务
    const scenes = extractScenes(content, config.inlineCount);
    const inlineImages: InlineImageTask[] = scenes.map((scene, index) => ({
      filename: `${slug}-${index + 1}.png`,
      size: '1000x600',
      prompt: generateInlinePrompt(title, scene, category, style, index),
      scene,
      done: false,
    }));

    return {
      slug,
      title,
      category,
      cover,
      inlineImages,
      status: {
        coverDone: false,
        inlineDone: 0,
        uploaded: false,
      },
    };
  } catch (error) {
    console.error(`生成图片任务失败: ${filePath}`, error);
    return null;
  }
}

/**
 * 批量生成图片任务
 */
export function generateAllImageTasks(
  config: Partial<ImageTaskConfig> = {}
): ImageTask[] {
  const fullConfig: ImageTaskConfig = { ...defaultImageTaskConfig, ...config };
  const tasks: ImageTask[] = [];

  // 扫描所有 MDX 文件
  const scanDir = (dir: string) => {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
        // 跳过英文版文件
        if (entry.name.includes('.en.')) continue;

        const task = generateImageTaskForFile(fullPath, fullConfig);
        if (task) tasks.push(task);
      }
    }
  };

  scanDir(fullConfig.contentDir);
  return tasks;
}

// ============================================================================
// 输出格式化
// ============================================================================

/**
 * 生成 Markdown 格式的任务清单
 */
export function generateMarkdownTaskList(tasks: ImageTask[]): string {
  let md = `# 博客图片任务清单

> 生成时间: ${new Date().toISOString().split('T')[0]}
> 总文章数: ${tasks.length}
> 总图片数: ${tasks.length * 4} (封面 ${tasks.length} + 内页 ${tasks.length * 3})

## 状态说明

- ⬜ 待生成
- 🔄 生成中
- ✅ 已完成
- 📤 已上传

---

## 任务列表

| # | Slug | 标题 | 分类 | 封面 | 内页1 | 内页2 | 内页3 | 上传 |
|---|------|------|------|------|-------|-------|-------|------|
`;

  tasks.forEach((task, index) => {
    const coverStatus = task.status.coverDone ? '✅' : '⬜';
    const inline1 = task.inlineImages[0]?.done ? '✅' : '⬜';
    const inline2 = task.inlineImages[1]?.done ? '✅' : '⬜';
    const inline3 = task.inlineImages[2]?.done ? '✅' : '⬜';
    const uploadStatus = task.status.uploaded ? '📤' : '⬜';

    md += `| ${index + 1} | ${task.slug} | ${task.title.slice(0, 20)}... | ${task.category} | ${coverStatus} | ${inline1} | ${inline2} | ${inline3} | ${uploadStatus} |\n`;
  });

  md += `\n---\n\n## 详细 Prompt\n\n`;

  for (const task of tasks) {
    md += `### ${task.slug}\n\n`;
    md += `**标题**: ${task.title}\n`;
    md += `**分类**: ${task.category}\n\n`;

    md += `#### 封面图 (${task.cover.filename})\n\n`;
    md += `\`\`\`\n${task.cover.prompt}\n\`\`\`\n\n`;

    for (let i = 0; i < task.inlineImages.length; i++) {
      const img = task.inlineImages[i];
      md += `#### 内页图 ${i + 1} (${img.filename})\n\n`;
      md += `**场景**: ${img.scene}\n\n`;
      md += `\`\`\`\n${img.prompt}\n\`\`\`\n\n`;
    }

    md += `---\n\n`;
  }

  return md;
}

/**
 * 生成 JSON 格式的任务数据
 */
export function generateJsonTaskData(tasks: ImageTask[]): string {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      totalArticles: tasks.length,
      totalImages: tasks.length * 4,
      tasks,
    },
    null,
    2
  );
}

// ============================================================================
// CLI 入口
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const config: Partial<ImageTaskConfig> = {};

  // 解析 --content-dir 参数
  const contentDirIndex = args.indexOf('--content-dir');
  if (contentDirIndex !== -1 && args[contentDirIndex + 1]) {
    config.contentDir = args[contentDirIndex + 1];
  }

  // 解析 --output-dir 参数
  const outputDirIndex = args.indexOf('--output-dir');
  if (outputDirIndex !== -1 && args[outputDirIndex + 1]) {
    config.outputDir = args[outputDirIndex + 1];
  }

  console.log('🖼️ 博客图片任务生成脚本');
  console.log('配置:', JSON.stringify(config, null, 2));
  console.log('');

  // 生成任务
  const tasks = generateAllImageTasks(config);

  console.log(`📊 生成结果:`);
  console.log(`  总文章数: ${tasks.length}`);
  console.log(`  总图片数: ${tasks.length * 4}`);

  // 按分类统计
  const categoryStats: Record<string, number> = {};
  for (const task of tasks) {
    categoryStats[task.category] = (categoryStats[task.category] || 0) + 1;
  }
  console.log('\n按分类统计:');
  for (const [cat, count] of Object.entries(categoryStats)) {
    console.log(`  ${cat}: ${count} 篇`);
  }

  // 输出 Markdown 任务清单
  const outputDir = config.outputDir || defaultImageTaskConfig.outputDir;
  const mdPath = path.join(outputDir, 'image-tasks.md');
  const mdContent = generateMarkdownTaskList(tasks);
  fs.writeFileSync(mdPath, mdContent, 'utf-8');
  console.log(`\n📄 Markdown 任务清单已保存到: ${mdPath}`);

  // 输出 JSON 数据
  const jsonPath = path.join(outputDir, 'image-tasks.json');
  const jsonContent = generateJsonTaskData(tasks);
  fs.writeFileSync(jsonPath, jsonContent, 'utf-8');
  console.log(`📄 JSON 任务数据已保存到: ${jsonPath}`);
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

// ============================================================================
// 导出
// ============================================================================

export {
  generateCoverPrompt,
  generateInlinePrompt,
  extractKeywords,
  extractScenes,
  generateImageTaskForFile,
  generateAllImageTasks,
  generateMarkdownTaskList,
  generateJsonTaskData,
};
