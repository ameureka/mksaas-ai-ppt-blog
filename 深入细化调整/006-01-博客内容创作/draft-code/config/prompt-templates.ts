/**
 * Prompt 模板 - 图片生成流水线
 * 封面和内页的 Prompt 模板及生成函数
 */

import type { CategoryStyle } from './category-styles';

export type TextStrategy = 'short-zh' | 'english' | 'blank';

export interface CoverPromptParams {
  title: string;
  shortTitle: string;
  keywords: string[];
  style: CategoryStyle;
  textStrategy: TextStrategy;
  textToRender: string;
}

export interface InlinePromptParams {
  scene: string;
  sceneType: 'flow' | 'chart' | 'cards' | 'compare' | 'scene' | 'concept';
  elements: string[];
  style: CategoryStyle;
}

/**
 * 封面 Prompt 模板（中文版）
 */
export const coverPromptTemplateZh = `
你是专业平面设计师，请生成 1200x630 的博客封面图。

【文章主题】{title}
【短标题】{shortTitle}
【关键词】{keywords}
【需渲染文字】{textToRender}
【风格】{styleHint}
【配色】{palette}
【画面元素】{sceneElements}

【设计要求】
- 标题文字居中或居左，字号大，对比度高，清晰可读
- 背景简洁，留白充足，便于阅读
- 风格符合 {category} 分类特点
- 无水印，无多余文字，高清输出
- 构图平衡，视觉焦点明确

【构图建议】
- 主体元素占画面 40-50%
- 文字区域留白 15-20%
- 整体简洁专业
`.trim();

/**
 * 封面 Prompt 模板（英文版）
 */
export const coverPromptTemplateEn = `
You are a professional graphic designer. Generate a 1200x630 blog cover image.

【Topic】{title}
【Short Title】{shortTitle}
【Keywords】{keywords}
【Text to Render】{textToRender}
【Style】{styleHint}
【Color Palette】{palette}
【Visual Elements】{sceneElements}

【Design Requirements】
- Title text centered or left-aligned, large font, high contrast, clearly readable
- Clean background, ample whitespace, easy to read
- Style matches {category} category characteristics
- No watermark, no extra text, high-quality output
- Balanced composition, clear visual focus

【Composition】
- Main elements occupy 40-50% of the canvas
- Text area whitespace 15-20%
- Overall clean and professional
`.trim();

/**
 * 内页 Prompt 模板
 */
export const inlinePromptTemplate = `
生成 1000x600 的信息图/情景图。

【场景】{scene}
【类型】{sceneType}
【画面元素】{elements}
【风格】{styleHint}
【配色】{palette}

【要求】
- 清晰、简洁、无水印
- 文字极少（仅短标签）
- 适合博客正文插图
- 与封面风格一致
- 信息传达准确
`.trim();

/**
 * 留白策略的 Prompt 后缀
 */
export const blankTextSuffix = `
【文字处理】
- 在画面中央留出空白区域（约 30% 宽度）
- 空白区域背景为纯色或轻微渐变
- 供后期叠加中文标题使用
`.trim();

/**
 * 生成封面 Prompt
 */
export function generateCoverPrompt(params: CoverPromptParams): string {
  const { title, shortTitle, keywords, style, textStrategy, textToRender } = params;

  let template = coverPromptTemplateZh;
  let finalTextToRender = textToRender;

  if (textStrategy === 'blank') {
    finalTextToRender = '（留白，不渲染文字）';
    template += '\n\n' + blankTextSuffix;
  } else if (textStrategy === 'english') {
    template = coverPromptTemplateEn;
  }

  return template
    .replace(/{title}/g, title)
    .replace(/{shortTitle}/g, shortTitle)
    .replace(/{keywords}/g, keywords.join('、'))
    .replace(/{textToRender}/g, finalTextToRender)
    .replace(/{styleHint}/g, style.styleHint)
    .replace(/{palette}/g, style.palette)
    .replace(/{sceneElements}/g, style.sceneElements.slice(0, 4).join('、'))
    .replace(/{category}/g, style.category);
}

/**
 * 生成内页 Prompt
 */
export function generateInlinePrompt(params: InlinePromptParams): string {
  const { scene, sceneType, elements, style } = params;

  const typeDescriptions: Record<string, string> = {
    flow: '流程图/步骤图',
    chart: '数据图表/统计图',
    cards: '卡片组/清单图',
    compare: '对比图/VS图',
    scene: '场景示意图',
    concept: '概念图/信息图',
  };

  return inlinePromptTemplate
    .replace(/{scene}/g, scene)
    .replace(/{sceneType}/g, typeDescriptions[sceneType] || '信息图')
    .replace(/{elements}/g, elements.join('、'))
    .replace(/{styleHint}/g, style.styleHint)
    .replace(/{palette}/g, style.palette);
}

/**
 * 场景类型判断规则
 */
export function detectSceneType(
  h2Title: string,
  paragraphContent: string
): 'flow' | 'chart' | 'cards' | 'compare' | 'scene' | 'concept' {
  const text = h2Title + paragraphContent;

  if (/步骤|流程|第一步|首先|然后|最后|阶段/.test(text)) {
    return 'flow';
  }
  if (/对比|vs|区别|不同|优劣|比较/.test(text)) {
    return 'compare';
  }
  if (/\d+%|数据|统计|增长|下降|趋势|报告/.test(text)) {
    return 'chart';
  }
  if (/要点|清单|列表|技巧|方法|原则/.test(text)) {
    return 'cards';
  }
  if (/案例|示例|场景|实战|应用/.test(text)) {
    return 'scene';
  }
  return 'concept';
}

/**
 * 根据场景类型推荐画面元素
 */
export function getSceneElements(
  sceneType: 'flow' | 'chart' | 'cards' | 'compare' | 'scene' | 'concept',
  h2Title: string
): string[] {
  const baseElements: Record<string, string[]> = {
    flow: ['箭头', '步骤卡片', '数字标记', '流程线', '节点'],
    chart: ['饼图', '柱状图', '趋势线', '数据标签', '图例'],
    cards: ['卡片组', '图标列表', '勾选标记', '分类标签'],
    compare: ['左右分栏', '对比表格', 'VS符号', '差异标注'],
    scene: ['人物插画', '场景背景', '互动元素', '情境展示'],
    concept: ['抽象图形', '图标组合', '概念可视化', '信息层级'],
  };

  return baseElements[sceneType] || baseElements.concept;
}
