/**
 * Prompt 生成脚本 - 从 MDX 文件提取内容并生成图片 Prompt
 *
 * 功能：
 * 1. 根据文件所在目录自动映射分类
 * 2. 将中文标题转换为英文 slug
 * 3. 生成封面和内页 Prompt
 *
 * 用法: npx tsx scripts/image-pipeline/generate-prompts.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCategoryStyleBySlug } from '../../config/category-styles.ts';
import {
  type TextStrategy,
  extractArticleKeywords,
  generateCoverPrompt,
} from '../../config/prompt-templates.ts';
import type { ImageTask, ImageTasksData } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
type Mode = 'cover-only' | 'cover-and-inline';

// 命令行模式：--mode=cover-only / cover-and-inline
const argvMode = process.argv
  .find((arg) => arg.startsWith('--mode='))
  ?.split('=')[1] as Mode | undefined;

const CONFIG = {
  // 使用实际内容目录，仅中文
  mdxDir: path.resolve(__dirname, '../../../../../content/blog'),
  outputDir: path.resolve(__dirname, '../../data'),
  outputJson: 'image-tasks.json',
  outputMd: 'image-tasks.md',
  mode: (argvMode || 'cover-only') as Mode,
  maxInline: 3, // cover-and-inline 时的内页上限
};

// 目录名 -> 分类 slug 映射
const DIR_TO_CATEGORY: Record<string, string> = {
  business: 'business',
  'year-end': 'year-end',
  education: 'education',
  marketing: 'marketing',
  proposal: 'proposal',
  report: 'report',
  general: 'general',
  'paid-search': 'paid-search',
};

/**
 * 从文件路径获取分类 slug
 */
function getCategoryFromPath(filePath: string): string {
  for (const [dirName, slug] of Object.entries(DIR_TO_CATEGORY)) {
    if (filePath.includes(dirName)) {
      return slug;
    }
  }
  return 'general';
}

/**
 * 简单的 frontmatter 解析
 */
function parseFrontmatter(content: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, content };

  const frontmatterStr = match[1];
  const body = match[2];
  const data: Record<string, unknown> = {};

  for (const line of frontmatterStr.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }

    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else if (value === 'true') {
      data[key] = true;
    } else if (value === 'false') {
      data[key] = false;
    } else {
      data[key] = value;
    }
  }

  return { data, content: body };
}

/**
 * 提取核心关键词（2-6 字）
 */
function extractCoreKeywords(title: string): string {
  const cleaned = title
    .replace(/[？?！!。，,：:]/g, '')
    .replace(/一般包含哪些内容$/, '')
    .replace(/怎么做$/, '')
    .replace(/如何制作$/, '')
    .replace(/完整指南$/, '')
    .trim();

  const matches = cleaned.match(/[\u4e00-\u9fa5]{2,6}PPT/);
  if (matches) return matches[0];

  const shortMatches = cleaned.match(/[\u4e00-\u9fa5]{2,6}/g);
  if (shortMatches && shortMatches.length > 0) {
    return shortMatches[0] + 'PPT';
  }
  return cleaned.slice(0, 6);
}

/**
 * 提取 H2 标题后的段落内容
 */
function extractParagraphAfterH2(body: string, h2Title: string): string {
  const escapedH2 = h2Title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`##\\s+${escapedH2}[\\s\\S]*?(?=\\n##|$)`, 'm');
  const match = body.match(regex);
  if (!match) return '';
  // 移除 H2 标题本身，只保留段落内容
  return match[0].replace(/^##\s+.+\n/, '').slice(0, 500);
}

/**
 * 从正文提取 H2 标题作为场景
 */
function extractH2Scenes(body: string): string[] {
  const h2Regex = /^##\s+(.+)$/gm;
  const scenes: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = h2Regex.exec(body)) !== null) {
    const h2 = match[1].trim();
    // 过滤通用标题
    if (/FAQ|常见问题|总结|结语|写在最后|参考|相关/i.test(h2)) {
      continue;
    }
    scenes.push(h2);
  }

  // 去重并限制数量
  const uniq: string[] = [];
  for (const s of scenes) {
    if (!uniq.includes(s)) uniq.push(s);
    if (uniq.length >= CONFIG.maxInline) break;
  }
  return uniq;
}

/**
 * 扫描 MDX 文件并生成 ImageTask
 */
async function scanMdxFiles(): Promise<ImageTask[]> {
  const tasks: ImageTask[] = [];

  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) {
      console.warn(`⚠️ 目录不存在: ${dir}`);
      return;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.mdx')) {
        try {
          const task = processFile(fullPath);
          if (task) tasks.push(task);
        } catch (err) {
          console.error(`❌ 处理失败: ${fullPath}`, err);
        }
      }
    }
  }

  scanDir(CONFIG.mdxDir);
  return tasks;
}

/**
 * 处理单个 MDX 文件
 */
function processFile(filePath: string): ImageTask | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data, content: body } = parseFrontmatter(content);

  if (!data.title) {
    console.warn(`⚠️ 跳过无标题文件: ${filePath}`);
    return null;
  }

  const title = String(data.title);

  // 优先使用 frontmatter 中的分类 slug
  const categories = Array.isArray(data.categories)
    ? (data.categories as unknown[])
    : [];
  const frontmatterCategory =
    categories.find((c) => typeof c === 'string' && c.trim()) as
      | string
      | undefined;

  // 从路径获取分类作为兜底
  const categorySlug = frontmatterCategory || getCategoryFromPath(filePath);
  const style = getCategoryStyleBySlug(categorySlug);

  // 使用文件名作为 slug，确保与现有路径一致
  const slug = path.basename(filePath, path.extname(filePath));

  const textStrategy: TextStrategy = 'short-zh';
  const textToRender = extractCoreKeywords(title);

  // 从文章内容提取关键词，与分类关键词合并
  const articleKeywords = extractArticleKeywords(title, body);
  const keywords = [
    ...new Set([...articleKeywords, ...style.coverKeywords]),
  ].slice(0, 5);

  const coverPrompt = generateCoverPrompt({
    title,
    shortTitle: textToRender,
    keywords,
    style,
    textStrategy,
    textToRender,
  });

  let inlineImages: Array<{
    filename: string;
    scene: string;
    sceneType: string;
    prompt: string;
    status: 'pending';
  }> = [];

  if (CONFIG.mode === 'cover-and-inline') {
    const h2Scenes = extractH2Scenes(body);
    inlineImages = h2Scenes.map((scene, i) => {
      const paragraph = extractParagraphAfterH2(body, scene);
      const sceneType = detectSceneType(scene, paragraph);
      const elements = getSceneElements(sceneType, scene, paragraph);

      return {
        filename: `${slug}-${i + 1}.png`,
        scene,
        sceneType: sceneType as string,
        prompt: generateInlinePrompt({ scene, sceneType, elements, style }),
        status: 'pending' as const,
      };
    });

    // 过滤通用/冗余场景
    inlineImages = inlineImages.filter(
      (img) =>
        !/总结|结语|FAQ|常见问题|参考|致谢|感谢/.test(img.scene)
    );

    // 限制数量
    inlineImages = inlineImages.slice(0, CONFIG.maxInline);

    // 兜底补足
    while (inlineImages.length < CONFIG.maxInline) {
      const i = inlineImages.length;
      const defaultScene = `${style.category} 核心要点 ${i + 1}`;
      inlineImages.push({
        filename: `${slug}-${i + 1}.png`,
        scene: defaultScene,
        sceneType: 'concept',
        prompt: generateInlinePrompt({
          scene: defaultScene,
          sceneType: 'concept',
          elements: style.sceneElements.slice(0, 3),
          style,
        }),
        status: 'pending',
      });
    }
  }

  const now = new Date().toISOString();

  return {
    slug,
    title,
    shortTitleZh: textToRender,
    category: style.category,
    categoryEn: categorySlug,
    styleHint: style.styleHint,
    palette: style.palette,
    keywords,
    cover: {
      filename: `${slug}-cover.jpg`,
      prompt: coverPrompt,
      textStrategy,
      textToRender,
      status: 'pending',
    },
    inlineImages,
    mediaStatus: 'none',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 生成 Markdown 格式的任务清单
 */
function generateMarkdown(tasks: ImageTask[]): string {
  const lines: string[] = [
    '# 图片生成任务清单',
    '',
    `> 生成时间: ${new Date().toISOString()}`,
    `> 总任务数: ${tasks.length}`,
    '',
    '---',
    '',
  ];

  const byCategory = new Map<string, ImageTask[]>();
  for (const task of tasks) {
    const cat = task.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(task);
  }

  for (const [category, catTasks] of byCategory) {
    lines.push(`## ${category} (${catTasks.length} 篇)`);
    lines.push('');

    for (const task of catTasks) {
      lines.push(`### ${task.title}`);
      lines.push('');
      lines.push(`- **Slug**: \`${task.slug}\``);
      lines.push(`- **短标题**: ${task.shortTitleZh}`);
      lines.push('');

      lines.push('#### 封面 Prompt');
      lines.push('');
      lines.push(`**文件名**: \`${task.cover.filename}\``);
      lines.push('');
      lines.push('```');
      lines.push(task.cover.prompt);
      lines.push('```');
      lines.push('');

      lines.push('#### 内页 Prompt');
      lines.push('');
      for (const img of task.inlineImages) {
        lines.push(`**${img.scene}** (\`${img.filename}\`)`);
        lines.push('');
        lines.push('```');
        lines.push(img.prompt);
        lines.push('```');
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始生成图片 Prompt...');
  console.log(`📁 MDX 目录: ${CONFIG.mdxDir}`);
  console.log(`🎛️ 模式: ${CONFIG.mode}`);

  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const tasks = await scanMdxFiles();
  console.log(`✅ 扫描完成，共 ${tasks.length} 篇文章`);

  // 按分类统计
  const categoryCount = new Map<string, number>();
  for (const task of tasks) {
    const count = categoryCount.get(task.category) || 0;
    categoryCount.set(task.category, count + 1);
  }
  console.log('\n📊 分类统计:');
  for (const [cat, count] of categoryCount) {
    console.log(`   ${cat}: ${count} 篇`);
  }

  const jsonData: ImageTasksData = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalTasks: tasks.length,
    tasks,
  };

  const jsonPath = path.join(CONFIG.outputDir, CONFIG.outputJson);
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');
  console.log(`\n📄 JSON 输出: ${jsonPath}`);

  const markdown = generateMarkdown(tasks);
  const mdPath = path.join(CONFIG.outputDir, CONFIG.outputMd);
  fs.writeFileSync(mdPath, markdown, 'utf-8');
  console.log(`📄 Markdown 输出: ${mdPath}`);

  const totalCovers = tasks.length;
  const totalInlines = tasks.reduce((sum, t) => sum + t.inlineImages.length, 0);
  console.log('\n📊 图片统计:');
  console.log(`   封面图: ${totalCovers} 张`);
  console.log(`   内页图: ${totalInlines} 张`);
  console.log(`   总计: ${totalCovers + totalInlines} 张`);
}

main().catch(console.error);
