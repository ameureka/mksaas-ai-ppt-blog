/**
 * 博客翻译脚本
 *
 * 功能：
 * - 将中文博客翻译为英文
 * - 保持 MDX 组件结构不变
 * - 保持图片路径和内部链接路径不变
 * - 生成成对的中英文文件
 *
 * 迁移说明：
 * - 校验通过后迁移到 scripts/blog-translate/
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import matter from 'gray-matter';
import {
  categoryMapping,
  categoryMappingReverse,
} from '../../config/category-map';

// ============================================================================
// 类型定义
// ============================================================================

export interface TranslateConfig {
  /** 源文件目录 */
  sourceDir: string;
  /** 输出目录 */
  outputDir: string;
  /** 源语言 */
  sourceLang: 'zh' | 'en';
  /** 目标语言 */
  targetLang: 'zh' | 'en';
  /** AI 提供商 */
  aiProvider: 'openai' | 'deepseek' | 'gemini';
  /** API Key */
  apiKey?: string;
  /** 是否 dry-run */
  dryRun: boolean;
  /** 并发数 */
  concurrency: number;
}

export interface TranslateResult {
  /** 源文件路径 */
  sourceFile: string;
  /** 目标文件路径 */
  targetFile: string;
  /** 文件 slug */
  slug: string;
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
  /** 翻译统计 */
  stats?: {
    titleTranslated: boolean;
    descriptionTranslated: boolean;
    contentLength: number;
    translatedLength: number;
  };
}

export interface BlogFrontmatter {
  title: string;
  description: string;
  date: string;
  image?: string;
  categories?: string[];
  tags?: string[];
  seoKeywords?: string[];
  relatedPosts?: string[];
  published?: boolean;
  author?: string;
}

export const defaultTranslateConfig: TranslateConfig = {
  sourceDir: 'content/blog',
  outputDir: 'content/blog',
  sourceLang: 'zh',
  targetLang: 'en',
  aiProvider: 'deepseek',
  dryRun: false,
  concurrency: 3,
};

// ============================================================================
// 翻译 Prompt 模板
// ============================================================================

export const translatePrompts = {
  title: `Translate the following Chinese blog title to English. Keep it concise, SEO-friendly, and professional. Only return the translated title, no explanations.

Chinese title: {title}`,

  description: `Translate the following Chinese blog description to English. Keep it concise (under 160 characters), SEO-friendly, and professional. Only return the translated description, no explanations.

Chinese description: {description}`,

  content: `Translate the following Chinese blog content to English. Follow these rules strictly:

1. Keep all MDX component syntax unchanged (e.g., <Component />, <Callout>, etc.)
2. Keep all image paths unchanged (e.g., ![alt](/images/...))
3. Keep all internal links unchanged (e.g., [text](/blog/...))
4. Keep all external links unchanged (e.g., [text](https://...))
5. Keep all code blocks unchanged
6. Translate headings (##, ###) naturally
7. Maintain the same markdown structure
8. Use professional, SEO-friendly language
9. Keep the same tone and style

Chinese content:
{content}

English translation:`,

  tags: `Translate the following Chinese tags to English. Return as comma-separated values. Keep them concise and SEO-friendly.

Chinese tags: {tags}`,

  keywords: `Translate the following Chinese SEO keywords to English. Return as comma-separated values. Keep them concise and SEO-friendly.

Chinese keywords: {keywords}`,
};

// ============================================================================
// 文件工具
// ============================================================================

/**
 * 扫描需要翻译的文件
 */
export function scanFilesToTranslate(
  dir: string,
  sourceLang: 'zh' | 'en'
): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanFilesToTranslate(fullPath, sourceLang));
    } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
      // 根据源语言筛选
      if (sourceLang === 'zh') {
        // 中文源：不包含 .en. 的文件
        if (!entry.name.includes('.en.')) {
          files.push(fullPath);
        }
      } else {
        // 英文源：包含 .en. 或不包含 .zh. 的文件
        if (entry.name.includes('.en.') || !entry.name.includes('.zh.')) {
          files.push(fullPath);
        }
      }
    }
  }
  return files;
}

/**
 * 解析 MDX 文件
 */
export function parseMdxFile(
  filePath: string
): { frontmatter: BlogFrontmatter; content: string; slug: string } | null {
  try {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(rawContent);
    const basename = path.basename(filePath, path.extname(filePath));
    const slug = basename.replace(/\.(zh|en)$/, '');

    return {
      frontmatter: data as BlogFrontmatter,
      content,
      slug,
    };
  } catch (error) {
    console.error(`解析文件失败: ${filePath}`, error);
    return null;
  }
}

/**
 * 生成目标文件路径
 */
export function getTargetFilePath(
  sourceFile: string,
  targetLang: 'zh' | 'en'
): string {
  const dir = path.dirname(sourceFile);
  const ext = path.extname(sourceFile);
  const basename = path.basename(sourceFile, ext);

  // 移除现有的语言后缀
  const cleanBasename = basename.replace(/\.(zh|en)$/, '');

  // 添加目标语言后缀
  const targetBasename =
    targetLang === 'en' ? cleanBasename : `${cleanBasename}.zh`;

  return path.join(dir, `${targetBasename}${ext}`);
}

// ============================================================================
// 翻译函数（模拟）
// ============================================================================

/**
 * 模拟翻译函数（实际使用时替换为 AI API 调用）
 */
export async function translateText(
  text: string,
  promptTemplate: string,
  config: TranslateConfig
): Promise<string> {
  // 这里是模拟实现，实际使用时需要调用 AI API
  // 例如 OpenAI、DeepSeek、Gemini 等

  if (config.dryRun) {
    return `[TRANSLATED] ${text}`;
  }

  // TODO: 实现实际的 AI 翻译调用
  // const prompt = promptTemplate.replace('{text}', text);
  // const response = await callAI(config.aiProvider, config.apiKey, prompt);
  // return response;

  // 临时返回占位符
  return `[TRANSLATED] ${text}`;
}

/**
 * 翻译 Frontmatter
 */
export async function translateFrontmatter(
  frontmatter: BlogFrontmatter,
  config: TranslateConfig
): Promise<BlogFrontmatter> {
  const translated: BlogFrontmatter = { ...frontmatter };

  // 翻译标题
  if (frontmatter.title) {
    translated.title = await translateText(
      frontmatter.title,
      translatePrompts.title.replace('{title}', frontmatter.title),
      config
    );
  }

  // 翻译描述
  if (frontmatter.description) {
    translated.description = await translateText(
      frontmatter.description,
      translatePrompts.description.replace(
        '{description}',
        frontmatter.description
      ),
      config
    );
  }

  // 翻译分类（使用映射表）
  if (frontmatter.categories) {
    translated.categories = frontmatter.categories.map((cat) => {
      if (config.targetLang === 'en') {
        return categoryMapping[cat] || cat;
      }
      return categoryMappingReverse[cat] || cat;
    });
  }

  // 翻译 tags
  if (frontmatter.tags && frontmatter.tags.length > 0) {
    const tagsText = frontmatter.tags.join(', ');
    const translatedTags = await translateText(
      tagsText,
      translatePrompts.tags.replace('{tags}', tagsText),
      config
    );
    translated.tags = translatedTags.split(',').map((t) => t.trim());
  }

  // 翻译 seoKeywords
  if (frontmatter.seoKeywords && frontmatter.seoKeywords.length > 0) {
    const keywordsText = frontmatter.seoKeywords.join(', ');
    const translatedKeywords = await translateText(
      keywordsText,
      translatePrompts.keywords.replace('{keywords}', keywordsText),
      config
    );
    translated.seoKeywords = translatedKeywords.split(',').map((k) => k.trim());
  }

  // 保持不变的字段
  // date, image, relatedPosts, published, author

  return translated;
}

/**
 * 翻译正文内容
 */
export async function translateContent(
  content: string,
  config: TranslateConfig
): Promise<string> {
  // 保护 MDX 组件、代码块、链接等
  const protectedPatterns: Array<{ pattern: RegExp; placeholder: string }> = [];
  let protectedContent = content;
  let placeholderIndex = 0;

  // 保护代码块
  const codeBlockRegex = /```[\s\S]*?```/g;
  protectedContent = protectedContent.replace(codeBlockRegex, (match) => {
    const placeholder = `__CODE_BLOCK_${placeholderIndex++}__`;
    protectedPatterns.push({
      pattern: new RegExp(placeholder, 'g'),
      placeholder: match,
    });
    return placeholder;
  });

  // 保护内联代码
  const inlineCodeRegex = /`[^`]+`/g;
  protectedContent = protectedContent.replace(inlineCodeRegex, (match) => {
    const placeholder = `__INLINE_CODE_${placeholderIndex++}__`;
    protectedPatterns.push({
      pattern: new RegExp(placeholder, 'g'),
      placeholder: match,
    });
    return placeholder;
  });

  // 保护图片
  const imageRegex = /!\[.*?\]\(.*?\)/g;
  protectedContent = protectedContent.replace(imageRegex, (match) => {
    const placeholder = `__IMAGE_${placeholderIndex++}__`;
    protectedPatterns.push({
      pattern: new RegExp(placeholder, 'g'),
      placeholder: match,
    });
    return placeholder;
  });

  // 保护链接（但翻译链接文本）
  // 这里简化处理，保持链接不变

  // 翻译内容
  const translatedContent = await translateText(
    protectedContent,
    translatePrompts.content.replace('{content}', protectedContent),
    config
  );

  // 恢复保护的内容
  let restoredContent = translatedContent;
  for (const { pattern, placeholder } of protectedPatterns.reverse()) {
    restoredContent = restoredContent.replace(pattern, placeholder);
  }

  return restoredContent;
}

// ============================================================================
// 主翻译函数
// ============================================================================

/**
 * 翻译单个文件
 */
export async function translateFile(
  sourceFile: string,
  config: TranslateConfig
): Promise<TranslateResult> {
  const targetFile = getTargetFilePath(sourceFile, config.targetLang);

  try {
    // 解析源文件
    const parsed = parseMdxFile(sourceFile);
    if (!parsed) {
      return {
        sourceFile,
        targetFile,
        slug: '',
        success: false,
        error: '无法解析源文件',
      };
    }

    const { frontmatter, content, slug } = parsed;

    // 翻译 Frontmatter
    const translatedFrontmatter = await translateFrontmatter(
      frontmatter,
      config
    );

    // 翻译正文
    const translatedContent = await translateContent(content, config);

    // 写入目标文件
    if (!config.dryRun) {
      const output = matter.stringify(translatedContent, translatedFrontmatter);
      fs.writeFileSync(targetFile, output, 'utf-8');
    }

    return {
      sourceFile,
      targetFile,
      slug,
      success: true,
      stats: {
        titleTranslated: true,
        descriptionTranslated: true,
        contentLength: content.length,
        translatedLength: translatedContent.length,
      },
    };
  } catch (error) {
    return {
      sourceFile,
      targetFile,
      slug: '',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 批量翻译
 */
export async function batchTranslate(
  config: Partial<TranslateConfig> = {}
): Promise<{
  totalFiles: number;
  successFiles: number;
  failedFiles: number;
  results: TranslateResult[];
}> {
  const fullConfig: TranslateConfig = { ...defaultTranslateConfig, ...config };

  // 扫描需要翻译的文件
  const files = scanFilesToTranslate(
    fullConfig.sourceDir,
    fullConfig.sourceLang
  );

  console.log(`找到 ${files.length} 个文件需要翻译`);

  const results: TranslateResult[] = [];

  // 按并发数分批处理
  for (let i = 0; i < files.length; i += fullConfig.concurrency) {
    const batch = files.slice(i, i + fullConfig.concurrency);
    const batchResults = await Promise.all(
      batch.map((file) => translateFile(file, fullConfig))
    );
    results.push(...batchResults);

    console.log(
      `已处理 ${Math.min(i + fullConfig.concurrency, files.length)}/${files.length}`
    );
  }

  return {
    totalFiles: files.length,
    successFiles: results.filter((r) => r.success).length,
    failedFiles: results.filter((r) => !r.success).length,
    results,
  };
}

// ============================================================================
// 检测缺少英文版的文件
// ============================================================================

/**
 * 检测缺少英文版的文件
 */
export function detectMissingEnglish(dir: string): string[] {
  const missing: string[] = [];
  if (!fs.existsSync(dir)) return missing;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = new Set<string>();

  for (const entry of entries) {
    if (
      entry.isFile() &&
      (entry.name.endsWith('.mdx') || entry.name.endsWith('.md'))
    ) {
      files.add(entry.name);
    }
  }

  // 检查每个中文文件是否有对应的英文版
  for (const file of files) {
    if (file.includes('.zh.')) continue; // 跳过已标记为中文的文件

    const ext = path.extname(file);
    const basename = path.basename(file, ext);

    // 检查是否有英文版
    const enFile = `${basename}.en${ext}`;
    const enFileAlt = basename.replace(/\.zh$/, '') + ext;

    if (!files.has(enFile) && !files.has(enFileAlt)) {
      // 如果文件名不包含 .en，则认为是中文文件，需要英文版
      if (!file.includes('.en.')) {
        missing.push(path.join(dir, file));
      }
    }
  }

  return missing;
}

// ============================================================================
// CLI 入口
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const config: Partial<TranslateConfig> = {
    dryRun: args.includes('--dry-run'),
  };

  // 解析 --source-dir 参数
  const sourceDirIndex = args.indexOf('--source-dir');
  if (sourceDirIndex !== -1 && args[sourceDirIndex + 1]) {
    config.sourceDir = args[sourceDirIndex + 1];
  }

  // 解析 --output-dir 参数
  const outputDirIndex = args.indexOf('--output-dir');
  if (outputDirIndex !== -1 && args[outputDirIndex + 1]) {
    config.outputDir = args[outputDirIndex + 1];
  }

  // 解析 --provider 参数
  const providerIndex = args.indexOf('--provider');
  if (providerIndex !== -1 && args[providerIndex + 1]) {
    config.aiProvider = args[providerIndex + 1] as
      | 'openai'
      | 'deepseek'
      | 'gemini';
  }

  console.log('🌐 博客翻译脚本');
  console.log('配置:', JSON.stringify(config, null, 2));
  console.log('');

  const result = await batchTranslate(config);

  console.log('\n📊 翻译结果:');
  console.log(`  总文件数: ${result.totalFiles}`);
  console.log(`  成功: ${result.successFiles}`);
  console.log(`  失败: ${result.failedFiles}`);

  // 输出详细结果到 JSON
  const reportPath =
    '深入细化调整/006-01-博客内容创作/流水线设计-博文生产/blog-translate-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\n📄 详细报告已保存到: ${reportPath}`);
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}
