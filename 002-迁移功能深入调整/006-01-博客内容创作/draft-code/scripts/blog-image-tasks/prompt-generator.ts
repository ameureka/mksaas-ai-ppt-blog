/**
 * 图片 Prompt 生成器
 *
 * 功能：
 * - 读取 MDX 文件，提取标题、分类、关键词
 * - 根据分类风格生成封面 Prompt
 * - 根据正文内容生成内页 Prompt
 * - 输出 Gemini CLI 可用的命令格式
 *
 * 使用方式：
 * - CLI 模式：生成 shell 脚本供 gemini cli 调用
 * - 网页模式：生成 Markdown 文件供手工复制
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import matter from 'gray-matter';
import { type CategoryStyle, categoryStyles } from '../../config/category-map';

// ============================================================================
// 类型定义
// ============================================================================

export type TextStrategy = 'short-zh' | 'english' | 'blank';

export interface ImagePromptConfig {
  /** 博客内容目录 */
  contentDir: string;
  /** 输出目录 */
  outputDir: string;
  /** 文字渲染策略 */
  textStrategy: TextStrategy;
  /** 输出格式 */
  outputFormat: 'json' | 'markdown' | 'shell';
  /** 每篇内页图数量 */
  inlineCount: number;
}

export interface CoverPrompt {
  filename: string;
  size: string;
  textToRender: string;
  textStrategy: TextStrategy;
  prompt: string;
  geminiCommand: string;
}

export interface InlinePrompt {
  filename: string;
  size: string;
  scene: string;
  prompt: string;
  geminiCommand: string;
}

export interface ArticleImageTask {
  slug: string;
  title: string;
  category: string;
  categoryStyle: CategoryStyle;
  cover: CoverPrompt;
  inlineImages: InlinePrompt[];
  status: {
    coverDone: boolean;
    inlineDone: number;
    uploaded: boolean;
  };
}
