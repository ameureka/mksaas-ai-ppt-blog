/**
 * Prompt 模板 - 图片生成流水线
 * 封面和内页的 Prompt 模板及生成函数
 */

import type { CategoryStyle } from './category-styles';

export type TextStrategy = 'short-zh' | 'english' | 'blank';
export type SceneType = 'flow' | 'chart' | 'cards' | 'compare' | 'scene' | 'concept';

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
  sceneType: SceneType;
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
 * 场景类型判断规则 - 增强版，结合段落内容
 */
export function detectSceneType(h2Title: string, paragraphContent: string): SceneType {
  const text = (h2Title + ' ' + paragraphContent).toLowerCase();

  // 流程/步骤类
  if (/步骤|流程|第[一二三四五六七八九十]步|首先|然后|最后|阶段|顺序/.test(text)) {
    return 'flow';
  }
  // 对比类
  if (/对比|vs|区别|不同|优劣|比较|差异|选择/.test(text)) {
    return 'compare';
  }
  // 数据图表类
  if (/\d+%|数据|统计|增长|下降|趋势|报告|指标|roi|转化率/.test(text)) {
    return 'chart';
  }
  // 清单/要点类
  if (/要点|清单|列表|技巧|方法|原则|注意|避免|建议|tips/.test(text)) {
    return 'cards';
  }
  // 场景/案例类
  if (/案例|示例|场景|实战|应用|情境|演示|展示/.test(text)) {
    return 'scene';
  }
  return 'concept';
}

/**
 * 内容感知的元素关键词映射 - 深度增强版
 */
const CONTENT_ELEMENT_MAP: Array<{ pattern: RegExp; elements: string[] }> = [
  // === 品牌视觉 ===
  { pattern: /logo|标识|品牌|vi/i, elements: ['Logo图标', '品牌标识', '替换示意'] },
  { pattern: /配色|颜色|色彩|主色|辅助色|调色/, elements: ['调色板', '颜色对比', '配色方案', '取色器'] },
  { pattern: /字体|排版|字号|文字|标题字/, elements: ['字体样式', '排版对比', '文字示例', '字号标注'] },
  { pattern: /截图|界面|产品图|屏幕|软件/, elements: ['界面截图', '产品展示', '屏幕框', '软件界面'] },
  { pattern: /图标|插画|icon|视觉元素/, elements: ['图标库', '插画风格', '视觉元素', '图形符号'] },
  { pattern: /模板|母版|版式|布局/, elements: ['模板预览', '版式结构', '布局示意', '页面框架'] },

  // === 数据与图表 ===
  { pattern: /图表|数据|统计|分析|报表/, elements: ['数据图表', '统计图', '数据看板', '趋势线'] },
  { pattern: /时间线|里程碑|进度|阶段|节点/, elements: ['时间线', '里程碑', '进度条', '节点标记'] },
  { pattern: /增长|下降|趋势|变化|波动/, elements: ['趋势曲线', '增长箭头', '数据变化图', '波动线'] },
  { pattern: /百分比|占比|比例|份额/, elements: ['饼图', '环形图', '比例条', '占比标注'] },

  // === 人物角色 ===
  { pattern: /用户|受众|客户|人群|画像/, elements: ['用户画像', '人物图标', '受众分析', '人群标签'] },
  { pattern: /新人|新手|入门|初学/, elements: ['新人图标', '入门标识', '学习者形象', '成长符号'] },
  { pattern: /主管|领导|管理|经理|总监/, elements: ['管理者图标', '领导形象', '决策者符号', '层级示意'] },
  { pattern: /团队|协作|合作|沟通|讨论/, elements: ['团队图标', '协作示意', '沟通场景', '讨论图'] },
  { pattern: /演讲|汇报|展示|演示|讲解/, elements: ['演讲场景', '演讲人', '大屏展示', '听众'] },

  // === 业务场景 ===
  { pattern: /转化|漏斗|路径|渠道/, elements: ['转化漏斗', '路径图', '流程箭头', '渠道示意'] },
  { pattern: /目标|成果|成绩|kpi|指标/, elements: ['目标图标', '成果展示', '达成标记', '指标卡片'] },
  { pattern: /会议|会议室|开会/, elements: ['会议室', '会议桌', '白板', '投影'] },
  { pattern: /课堂|培训|教学|学习|课件/, elements: ['课堂场景', '培训图标', '学习元素', '教学示意'] },
  { pattern: /项目|提案|方案|计划/, elements: ['项目图标', '方案文档', '计划表', '提案符号'] },

  // === 对比与选择 ===
  { pattern: /vs|对比|比较|差异|区别/, elements: ['VS符号', '左右对比', '差异标注', '对比箭头'] },
  { pattern: /选择|挑选|筛选|决策/, elements: ['选择图标', '筛选漏斗', '决策树', '选项卡片'] },
  { pattern: /优势|劣势|优点|缺点/, elements: ['优劣对比', '加减符号', '评分星级', '对比表格'] },

  // === 结构与框架 ===
  { pattern: /结构|框架|架构|体系/, elements: ['结构图', '框架示意', '层级关系', '架构图'] },
  { pattern: /清单|列表|要点|条目/, elements: ['清单图标', '勾选标记', '条目列表', '要点卡片'] },
  { pattern: /章节|目录|大纲|提纲/, elements: ['目录结构', '章节标记', '大纲图', '层级列表'] },

  // === 年终/述职特有 ===
  { pattern: /年终|年度|全年|一年/, elements: ['年度日历', '12月时间轴', '年度总结图', '年份标记'] },
  { pattern: /总结|复盘|回顾|盘点/, elements: ['总结图标', '复盘箭头', '回顾时间线', '盘点清单'] },
  { pattern: /成长|提升|进步|突破/, elements: ['成长曲线', '上升箭头', '进步阶梯', '突破符号'] },
  { pattern: /证明|展示|呈现|体现/, elements: ['证据图标', '展示框', '呈现箭头', '证明标记'] },

  // === 营销特有 ===
  { pattern: /卖点|亮点|特色|优势/, elements: ['卖点标签', '亮点星标', '特色图标', '优势徽章'] },
  { pattern: /营销|推广|宣传|广告/, elements: ['营销漏斗', '推广图标', '宣传喇叭', '广告牌'] },
  { pattern: /产品|功能|特性|服务/, elements: ['产品图标', '功能模块', '特性卡片', '服务图示'] },

  // === 教育特有 ===
  { pattern: /知识|概念|原理|理论/, elements: ['知识图标', '概念图', '原理示意', '理论框架'] },
  { pattern: /练习|实践|操作|动手/, elements: ['练习图标', '实践场景', '操作步骤', '动手示意'] },
  { pattern: /问题|疑问|困惑|难点/, elements: ['问号图标', '疑问符号', '困惑表情', '难点标记'] },
];

/**
 * 根据场景类型和内容推荐画面元素 - 增强版
 */
export function getSceneElements(sceneType: SceneType, h2Title: string, paragraph: string = ''): string[] {
  const text = h2Title + ' ' + paragraph;
  const contentElements: string[] = [];

  // 根据内容关键词匹配元素
  for (const { pattern, elements } of CONTENT_ELEMENT_MAP) {
    if (pattern.test(text)) {
      contentElements.push(...elements.slice(0, 2));
    }
  }

  // 基础元素
  const baseElements: Record<SceneType, string[]> = {
    flow: ['箭头', '步骤卡片', '数字标记', '流程线'],
    chart: ['饼图', '柱状图', '趋势线', '数据标签'],
    cards: ['卡片组', '图标列表', '勾选标记', '分类标签'],
    compare: ['左右分栏', '对比表格', 'VS符号', '差异标注'],
    scene: ['人物插画', '场景背景', '互动元素', '情境展示'],
    concept: ['抽象图形', '图标组合', '概念可视化', '信息层级'],
  };

  // 合并：内容元素优先，基础元素补充
  if (contentElements.length >= 3) {
    return [...new Set(contentElements)].slice(0, 5);
  }

  const base = baseElements[sceneType] || baseElements.concept;
  return [...new Set([...contentElements, ...base])].slice(0, 5);
}

/**
 * 从文章内容提取关键词 - 深度增强版
 */
export function extractArticleKeywords(title: string, body: string): string[] {
  const text = title + ' ' + body;
  const keywords: string[] = [];

  const patterns: Array<{ pattern: RegExp; keyword: string; priority: number }> = [
    // 高优先级：标题中的核心词
    { pattern: /vs|对比/, keyword: '对比', priority: 10 },
    { pattern: /新人|新手/, keyword: '新人', priority: 10 },
    { pattern: /主管|领导|管理/, keyword: '主管', priority: 10 },
    { pattern: /年终|年度/, keyword: '年终', priority: 10 },
    { pattern: /述职/, keyword: '述职', priority: 10 },
    { pattern: /营销/, keyword: '营销', priority: 10 },
    { pattern: /培训|教育/, keyword: '培训', priority: 10 },
    { pattern: /提案|方案/, keyword: '方案', priority: 10 },

    // 中优先级：内容核心词
    { pattern: /logo/i, keyword: 'Logo', priority: 5 },
    { pattern: /品牌/, keyword: '品牌', priority: 5 },
    { pattern: /配色|颜色/, keyword: '配色', priority: 5 },
    { pattern: /字体/, keyword: '字体', priority: 5 },
    { pattern: /模板/, keyword: '模板', priority: 5 },
    { pattern: /截图/, keyword: '截图', priority: 5 },
    { pattern: /图表/, keyword: '图表', priority: 5 },
    { pattern: /数据/, keyword: '数据', priority: 5 },
    { pattern: /流程/, keyword: '流程', priority: 5 },
    { pattern: /步骤/, keyword: '步骤', priority: 5 },
    { pattern: /转化/, keyword: '转化', priority: 5 },
    { pattern: /结构/, keyword: '结构', priority: 5 },
    { pattern: /成长|提升/, keyword: '成长', priority: 5 },
    { pattern: /成果|成绩/, keyword: '成果', priority: 5 },
    { pattern: /目标/, keyword: '目标', priority: 5 },
    { pattern: /复盘|总结/, keyword: '复盘', priority: 5 },

    // 低优先级：通用词
    { pattern: /用户/, keyword: '用户', priority: 3 },
    { pattern: /场景/, keyword: '场景', priority: 3 },
    { pattern: /案例/, keyword: '案例', priority: 3 },
    { pattern: /技巧/, keyword: '技巧', priority: 3 },
    { pattern: /设计/, keyword: '设计', priority: 3 },
    { pattern: /排版/, keyword: '排版', priority: 3 },
  ];

  // 按优先级排序
  const sortedPatterns = patterns.sort((a, b) => b.priority - a.priority);

  for (const { pattern, keyword } of sortedPatterns) {
    if (pattern.test(text) && !keywords.includes(keyword)) {
      keywords.push(keyword);
    }
  }

  return keywords.slice(0, 5);
}
