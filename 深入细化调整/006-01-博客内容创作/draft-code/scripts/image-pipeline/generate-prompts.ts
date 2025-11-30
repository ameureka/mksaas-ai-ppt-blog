/**
 * Prompt 生成脚本 - 从 MDX 文件提取内容并生成图片 Prompt
 * 
 * 用法: npx tsx scripts/image-pipeline/generate-prompts.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { getCategoryStyle } from '../../config/category-styles';
import {
  generateCoverPrompt,
  generateInlinePrompt,
  detectSceneType,
  getSceneElements,
  type TextStrategy,
} from '../../config/prompt-templates';
import type { ImageTask, ImageTasksData, SceneType } from './types';

// 配置
const CONFIG = {
  mdxDir: path.resolve(__dirname, '../../../../006-blogs-seo-博文设计/广告-博文'),
  outputDir: path.resolve(__dirname, '../../data'),
  outputJson: 'image-tasks.json',
  outputMd: 'image-tasks.md',
};

/**
 * 简单的 frontmatter 解析（不依赖 gray-matter）
 */
function parseFrontmatter(content: string): { data: Record<string, unknown>; content: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, content };
  }

  const frontmatterStr = match[1];
  const body = match[2];
  const data: Record<string, unknown> = {};

  // 简单解析 YAML
  const lines = frontmatterStr.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // 处理字符串值
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }

    // 处理数组
    if (value.startsWith('[') && value.endsWith(']')) {
      const arrayContent = value.slice(1, -1);
      data[key] = arrayContent
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
 * 选择文字渲染策略
 */
function selectTextStrategy(title: string): TextStrategy {
  if (title.length <= 6) return 'short-zh';
  return 'short-zh';
}

/**
 * 提取核心关键词（2-6 字）
 */
function extractCoreKeywords(title: string): string {
  const cleaned = title
    .replace(/[？?！!。，,：:]/g, '')
    .replace(/PPT$/i, '')
    .replace(/一般包含哪些内容$/, '')
    .replace(/怎么做$/, '')
    .replace(/如何制作$/, '')
    .replace(/完整指南$/, '')
    .trim();

  const matches = cleaned.match(/[\u4e00-\u9fa5]{2,6}/g);
  if (matches && matches.length > 0) {
    return matches[0] + 'PPT';
  }
  return cleaned.slice(0, 6);
}

/**
 * 生成英文短标题
 */
function generateEnglishTitle(categoryEn: string): string {
  const categoryMap: Record<string, string> = {
    business: 'Business Report PPT',
    'year-end': 'Year-End Summary PPT',
    education: 'Education Training PPT',
    training: 'Training Course PPT',
    marketing: 'Product Marketing PPT',
    'marketing-plan': 'Marketing Plan PPT',
    proposal: 'Project Proposal PPT',
    report: 'Work Report PPT',
    general: 'PPT Tips',
    'paid-search': 'Template Search',
  };
  return categoryMap[categoryEn] || 'PPT Guide';
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
    if (!/FAQ|常见问题|总结|结语|写在最后|参考|相关/.test(h2)) {
      scenes.push(h2);
    }
  }

  return scenes.slice(0, 4);
}

/**
 * 提取段落内容
 */
function extractParagraphAfterH2(body: string, h2Title: string): string {
  const escapedH2 = h2Title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`##\\s+${escapedH2}[\\s\\S]*?(?=##|$)`, 'm');
  const match = body.match(regex);
  return match ? match[0].slice(0, 500) : '';
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
      } else if (entry.name.endsWith('.zh.mdx')) {
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
  const filename = path.basename(filePath, '.zh.mdx');
  const slug = filename.toLowerCase().replace(/\s+/g, '-');

  const categories = Array.isArray(data.categories) ? data.categories : ['通用技巧'];
  const categoryZh = String(categories[0] || '通用技巧');
  const style = getCategoryStyle(categoryZh);

  const textStrategy = selectTextStrategy(title);
  const textToRender = extractCoreKeywords(title);
  const shortTitleEn = generateEnglishTitle(style.categoryEn);

  const seoKeywords = Array.isArray(data.seoKeywords) ? data.seoKeywords.map(String) : [];
  const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
  const keywords = [...seoKeywords, ...tags, ...style.coverKeywords].slice(0, 5);

  const coverPrompt = generateCoverPrompt({
    title,
    shortTitle: textToRender,
    keywords,
    style,
    textStrategy,
    textToRender,
  });

  const h2Scenes = extractH2Scenes(body);
  const inlineImages = h2Scenes.map((scene, i) => {
    const paragraph = extractParagraphAfterH2(body, scene);
    const sceneType = detectSceneType(scene, paragraph);
    const elements = getSceneElements(sceneType, scene);

    return {
      filename: `${slug}-${i + 1}.png`,
      scene,
      sceneType: sceneType as SceneType,
      prompt: generateInlinePrompt({ scene, sceneType, elements, style }),
      status: 'pending' as const,
    };
  });

  while (inlineImages.length < 3) {
    const i = inlineImages.length;
    const defaultScene = `${style.category}核心要点 ${i + 1}`;
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

  const now = new Date().toISOString();

  return {
    slug,
    title,
    shortTitleZh: textToRender,
    shortTitleEn,
    category: categoryZh,
    categoryEn: style.categoryEn,
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
      lines.push(`- **文字策略**: ${task.cover.textStrategy}`);
      lines.push('');

      lines.push('#### 封面 Prompt');
      lines.push('');
      lines.push('```');
      lines.push(task.cover.prompt);
      lines.push('```');
      lines.push('');
      lines.push(`**文件名**: \`${task.cover.filename}\``);
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

  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const tasks = await scanMdxFiles();
  console.log(`✅ 扫描完成，共 ${tasks.length} 篇文章`);

  const jsonData: ImageTasksData = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalTasks: tasks.length,
    tasks,
  };

  const jsonPath = path.join(CONFIG.outputDir, CONFIG.outputJson);
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');
  console.log(`📄 JSON 输出: ${jsonPath}`);

  const markdown = generateMarkdown(tasks);
  const mdPath = path.join(CONFIG.outputDir, CONFIG.outputMd);
  fs.writeFileSync(mdPath, markdown, 'utf-8');
  console.log(`📄 Markdown 输出: ${mdPath}`);

  const totalCovers = tasks.length;
  const totalInlines = tasks.reduce((sum, t) => sum + t.inlineImages.length, 0);
  console.log('');
  console.log('📊 统计:');
  console.log(`   封面图: ${totalCovers} 张`);
  console.log(`   内页图: ${totalInlines} 张`);
  console.log(`   总计: ${totalCovers + totalInlines} 张`);
}

main().catch(console.error);
