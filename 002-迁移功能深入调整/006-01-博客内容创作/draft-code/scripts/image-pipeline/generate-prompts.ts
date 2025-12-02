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
import { getCategoryStyleBySlug } from '../../config/category-styles';
import {
  type TextStrategy,
  detectSceneType,
  extractArticleKeywords,
  generateCoverPrompt,
  generateInlinePrompt,
  getSceneElements,
} from '../../config/prompt-templates';
import type { ImageTask, ImageTasksData, SceneType } from './types';

// 配置
const CONFIG = {
  mdxDir: path.resolve(
    __dirname,
    '../../../../006-blogs-seo-博文设计/广告-博文'
  ),
  outputDir: path.resolve(__dirname, '../../data'),
  outputJson: 'image-tasks.json',
  outputMd: 'image-tasks.md',
};

// 目录名 -> 分类 slug 映射
const DIR_TO_CATEGORY: Record<string, string> = {
  商务汇报PPT: 'business',
  年终总结PPT: 'year-end',
  教育培训与课件PPT: 'education',
  产品营销与营销方案PPT: 'marketing',
  项目提案PPT: 'proposal',
  述职报告PPT: 'report',
  通用与混合场景: 'general',
  付费模板搜索与产品视角: 'tips',
};

// 中文关键词 -> 英文翻译映射
const TITLE_TRANSLATIONS: Record<string, string> = {
  商务汇报: 'business-report',
  年终总结: 'year-end-summary',
  教育培训: 'education-training',
  培训课件: 'training-courseware',
  产品营销: 'product-marketing',
  营销方案: 'marketing-plan',
  项目提案: 'project-proposal',
  述职报告: 'work-report',
  述职: 'work-report',
  PPT模板: 'ppt-template',
  PPT: 'ppt',
  一般包含哪些内容: 'content-guide',
  推荐页数: 'page-count',
  推荐字体和配色: 'font-color',
  字体和配色: 'font-color',
  怎么做: 'how-to',
  怎么写: 'how-to-write',
  怎么选: 'how-to-choose',
  怎么设计: 'how-to-design',
  如何: 'how-to',
  什么时候: 'when-to',
  为什么: 'why',
  下载: 'download',
  模板: 'template',
  快速: 'quick',
  修改: 'modify',
  改成: 'convert',
  更专业: 'professional',
  数据: 'data',
  图表: 'chart',
  结构: 'structure',
  内容: 'content',
  设计: 'design',
  风格: 'style',
  分类: 'category',
  页数: 'pages',
  场景: 'scenario',
  技巧: 'tips',
  指南: 'guide',
  清单: 'checklist',
  案例: 'case-study',
  实战: 'practical',
  新手: 'beginner',
  入门: 'getting-started',
  免费: 'free',
  付费: 'paid',
  搜索: 'search',
  选择: 'choose',
  合适: 'suitable',
  互动: 'interactive',
  课堂: 'classroom',
  线上: 'online',
  线下: 'offline',
  复盘: 'review',
  总结: 'summary',
  计划: 'plan',
  目标: 'goal',
  成绩: 'achievement',
  失败: 'failure',
  决策层: 'decision-maker',
  老板: 'boss',
  领导: 'leader',
  同事: 'colleague',
  受众: 'audience',
  用户: 'user',
  产品: 'product',
  品牌: 'brand',
  转化: 'conversion',
  卖点: 'selling-point',
  创意: 'creative',
  策略: 'strategy',
  执行: 'execution',
  效果: 'effect',
  评估: 'evaluation',
  预算: 'budget',
  渠道: 'channel',
  路演: 'roadshow',
  汇报: 'report',
  演讲: 'presentation',
  会议: 'meeting',
  投影: 'projection',
  录屏: 'recording',
  发送: 'send',
  文件: 'file',
};

/**
 * 将中文标题转换为英文 slug
 */
function titleToSlug(title: string, categorySlug: string): string {
  let slug = title.replace(/[？?！!。，,：:""''「」【】（）()]/g, '').trim();

  // 按优先级替换关键词
  const sortedKeys = Object.keys(TITLE_TRANSLATIONS).sort(
    (a, b) => b.length - a.length
  );
  for (const zh of sortedKeys) {
    const en = TITLE_TRANSLATIONS[zh];
    slug = slug.replace(new RegExp(zh, 'g'), `-${en}-`);
  }

  // 清理多余字符
  slug = slug
    .replace(/[\u4e00-\u9fa5]/g, '') // 移除剩余中文
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  // 如果 slug 太短或为空，使用分类 + 随机后缀
  if (slug.length < 5) {
    slug = `${categorySlug}-${Date.now().toString(36)}`;
  }

  // 限制长度
  if (slug.length > 60) {
    slug = slug.slice(0, 60).replace(/-$/, '');
  }

  return slug;
}

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
    if (!/FAQ|常见问题|总结|结语|写在最后|参考|相关/.test(h2)) {
      scenes.push(h2);
    }
  }

  return scenes.slice(0, 4);
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

  // 从路径获取分类
  const categorySlug = getCategoryFromPath(filePath);
  const style = getCategoryStyleBySlug(categorySlug);

  // 生成英文 slug
  const slug = titleToSlug(title, categorySlug);

  const textStrategy: TextStrategy = 'short-zh';
  const textToRender = extractCoreKeywords(title);

  // 英文短标题
  const shortTitleEnMap: Record<string, string> = {
    business: 'Business Report PPT',
    'year-end': 'Year-End Summary PPT',
    education: 'Education Training PPT',
    marketing: 'Product Marketing PPT',
    proposal: 'Project Proposal PPT',
    report: 'Work Report PPT',
    general: 'PPT Tips',
    tips: 'Template Tips',
  };
  const shortTitleEn = shortTitleEnMap[categorySlug] || 'PPT Guide';

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

  const h2Scenes = extractH2Scenes(body);
  const inlineImages = h2Scenes.map((scene, i) => {
    // 提取该 H2 下的段落内容
    const paragraph = extractParagraphAfterH2(body, scene);
    // 传入段落内容进行场景类型判断
    const sceneType = detectSceneType(scene, paragraph);
    // 传入段落内容生成针对性元素
    const elements = getSceneElements(sceneType, scene, paragraph);

    return {
      filename: `${slug}-${i + 1}.png`,
      scene,
      sceneType: sceneType as SceneType,
      prompt: generateInlinePrompt({ scene, sceneType, elements, style }),
      status: 'pending' as const,
    };
  });

  // 确保至少 3 张内页图
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
      lines.push('```');
      lines.push(task.cover.prompt);
      lines.push('```');
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
