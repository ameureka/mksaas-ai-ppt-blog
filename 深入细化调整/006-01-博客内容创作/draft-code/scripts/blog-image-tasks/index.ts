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
import {
  generateCoverPrompt as buildCoverPrompt,
  generateInlinePrompt as buildInlinePrompt,
  detectSceneType,
  getSceneElements,
  type TextStrategy,
  type InlinePromptParams,
} from '../../config/prompt-templates';
import { getCategoryStyle } from '../../config/category-styles';

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
  /** 封面文字策略 */
  textStrategy: TextStrategy;
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
  /** 封面文字策略 */
  textStrategy: TextStrategy;
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
  /** 场景类型 */
  sceneType: InlinePromptParams['sceneType'];
  /** 场景推荐元素 */
  elements: string[];
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
  textStrategy: 'short-zh',
};

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
 * 从文章内容解析场景并匹配画面元素
 */
export function extractScenes(
  content: string,
  count: number
): Array<Pick<InlineImageTask, 'scene' | 'sceneType' | 'elements'>> {
  const scenes: Array<Pick<InlineImageTask, 'scene' | 'sceneType' | 'elements'>> = [];

  const sectionRegex = /^##\s+(.+)\n([\s\S]*?)(?=^##\s+|\Z)/gm;
  let match: RegExpExecArray | null = null;

  while ((match = sectionRegex.exec(content)) !== null && scenes.length < count) {
    const heading = match[1].trim();
    if (!heading || heading.includes('常见问题') || heading.includes('FAQ')) continue;

    const paragraph = (match[2] || '')
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0);

    const sceneType = detectSceneType(heading, paragraph ?? '');
    const elements = getSceneElements(sceneType, heading);

    scenes.push({
      scene: heading,
      sceneType,
      elements,
    });
  }

  while (scenes.length < count) {
    const fallbackScene = `概念图 ${scenes.length + 1}`;
    scenes.push({
      scene: fallbackScene,
      sceneType: 'concept',
      elements: getSceneElements('concept', fallbackScene),
    });
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
    const shortTitle: string = data.shortTitle || title;
    const categories = data.categories || ['general'];
    const category = categories[0];
    const style = getCategoryStyle(category);
    const textStrategy = config.textStrategy || 'short-zh';

    const coverKeywords = Array.from(
      new Set([...(style.coverKeywords || []), ...extractKeywords(title)])
    );

    const coverPrompt = buildCoverPrompt({
      title,
      shortTitle,
      keywords: coverKeywords,
      style,
      textStrategy,
      textToRender: shortTitle,
    });

    // 生成封面图任务
    const cover: CoverImageTask = {
      filename: `${slug}-cover.jpg`,
      size: '1200x630',
      prompt: coverPrompt,
      done: false,
    };

    // 提取场景并生成内页图任务
    const scenes = extractScenes(content, config.inlineCount);
    const inlineImages: InlineImageTask[] = scenes.map((sceneMeta, index) => {
      const prompt = buildInlinePrompt({
        scene: sceneMeta.scene,
        sceneType: sceneMeta.sceneType,
        elements: sceneMeta.elements,
        style,
      });

      return {
        filename: `${slug}-${index + 1}.png`,
        size: '1000x600',
        prompt,
        scene: sceneMeta.scene,
        sceneType: sceneMeta.sceneType,
        elements: sceneMeta.elements,
        done: false,
      };
    });

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
      textStrategy,
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
export function generateMarkdownTaskList(
  tasks: ImageTask[],
  options: Pick<ImageTaskConfig, 'coverCount' | 'inlineCount' | 'textStrategy'>
): string {
  const totalImages =
    tasks.length * (options.coverCount + options.inlineCount);

  let md = `# 博客图片任务清单

> 生成时间: ${new Date().toISOString().split('T')[0]}
> 总文章数: ${tasks.length}
> 总图片数: ${totalImages} (封面 ${tasks.length * options.coverCount} + 内页 ${tasks.length * options.inlineCount})
> 封面文字策略: ${options.textStrategy}

## 状态说明

- ⬜ 待生成
- 🔄 生成中
- ✅ 已完成
- 📤 已上传

---

## 任务列表

`;

  const inlineHeaders = Array.from(
    { length: options.inlineCount },
    (_, index) => `内页${index + 1}`
  );

  md += `| # | Slug | 标题 | 分类 | 封面 | ${inlineHeaders.join(' | ')} | 上传 |\n`;
  md += `|---|------|------|------|------|${inlineHeaders
    .map(() => '-------')
    .join('|')}|------|\n`;

  tasks.forEach((task, index) => {
    const coverStatus = task.status.coverDone ? '✅' : '⬜';
    const inlineStatuses = Array.from({ length: options.inlineCount }, (_, i) =>
      task.inlineImages[i]?.done ? '✅' : '⬜'
    );
    const uploadStatus = task.status.uploaded ? '📤' : '⬜';

    md += `| ${index + 1} | ${task.slug} | ${task.title.slice(0, 20)}... | ${task.category} | ${coverStatus} | ${inlineStatuses.join(' | ')} | ${uploadStatus} |\n`;
  });

  md += `\n---\n\n## 详细 Prompt\n\n`;

  for (const task of tasks) {
    md += `### ${task.slug}\n\n`;
    md += `**标题**: ${task.title}\n`;
    md += `**分类**: ${task.category}\n\n`;
    md += `**封面文字策略**: ${task.textStrategy}\n\n`;

    md += `#### 封面图 (${task.cover.filename})\n\n`;
    md += `\`\`\`\n${task.cover.prompt}\n\`\`\`\n\n`;

    for (let i = 0; i < task.inlineImages.length; i++) {
      const img = task.inlineImages[i];
      md += `#### 内页图 ${i + 1} (${img.filename})\n\n`;
      md += `**场景**: ${img.scene}\n\n`;
      md += `**类型**: ${img.sceneType}\n\n`;
      md += `**元素**: ${img.elements.join(' / ')}\n\n`;
      md += `\`\`\`\n${img.prompt}\n\`\`\`\n\n`;
    }

    md += `---\n\n`;
  }

  return md;
}

/**
 * 生成 JSON 格式的任务数据
 */
export function generateJsonTaskData(
  tasks: ImageTask[],
  options: Pick<ImageTaskConfig, 'coverCount' | 'inlineCount' | 'textStrategy'>
): string {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      totalArticles: tasks.length,
      totalImages: tasks.length * (options.coverCount + options.inlineCount),
      coverCount: options.coverCount,
      inlineCount: options.inlineCount,
      textStrategy: options.textStrategy,
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

  // 解析 --text-strategy 参数
  const textStrategyIndex = args.indexOf('--text-strategy');
  if (textStrategyIndex !== -1 && args[textStrategyIndex + 1]) {
    const strategy = args[textStrategyIndex + 1];
    if (['short-zh', 'english', 'blank'].includes(strategy)) {
      config.textStrategy = strategy as TextStrategy;
    } else {
      console.warn(
        `⚠️ 无效的 --text-strategy 值 "${strategy}"，将使用默认配置。`
      );
    }
  }

  const fullConfig: ImageTaskConfig = { ...defaultImageTaskConfig, ...config };

  console.log('🖼️ 博客图片任务生成脚本');
  console.log('配置:', JSON.stringify(fullConfig, null, 2));
  console.log('');

  // 生成任务
  const tasks = generateAllImageTasks(fullConfig);

  console.log(`📊 生成结果:`);
  console.log(`  总文章数: ${tasks.length}`);
  console.log(
    `  总图片数: ${tasks.length * (fullConfig.coverCount + fullConfig.inlineCount)}`
  );

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
  const outputDir = fullConfig.outputDir;
  fs.mkdirSync(outputDir, { recursive: true });
  const mdPath = path.join(outputDir, 'image-tasks.md');
  const mdContent = generateMarkdownTaskList(tasks, {
    coverCount: fullConfig.coverCount,
    inlineCount: fullConfig.inlineCount,
    textStrategy: fullConfig.textStrategy,
  });
  fs.writeFileSync(mdPath, mdContent, 'utf-8');
  console.log(`\n📄 Markdown 任务清单已保存到: ${mdPath}`);

  // 输出 JSON 数据
  const jsonPath = path.join(outputDir, 'image-tasks.json');
  const jsonContent = generateJsonTaskData(tasks, {
    coverCount: fullConfig.coverCount,
    inlineCount: fullConfig.inlineCount,
    textStrategy: fullConfig.textStrategy,
  });
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
  buildCoverPrompt as generateCoverPrompt,
  buildInlinePrompt as generateInlinePrompt,
  detectSceneType,
  getSceneElements,
  extractKeywords,
  extractScenes,
  generateImageTaskForFile,
  generateAllImageTasks,
  generateMarkdownTaskList,
  generateJsonTaskData,
};
