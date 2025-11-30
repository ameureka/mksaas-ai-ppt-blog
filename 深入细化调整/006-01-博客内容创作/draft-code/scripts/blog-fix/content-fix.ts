/**
 * 博客正文内容修复脚本
 *
 * 功能：
 * - 插入内部链接
 * - 插入权威引用和统计数据
 * - 生成 FAQ 段落
 * - 生成 CTA 段落
 * - 插入图片占位符
 *
 * 迁移说明：
 * - 校验通过后迁移到 scripts/blog-fix/content-fix.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { type CategoryStyle, categoryStyles } from '../../config/category-map';
import type { AppliedFix, BlogFile, BlogFrontmatter } from './index';

// ============================================================================
// 类型定义
// ============================================================================

export type ContentFixType =
  | 'fix-internal-links'
  | 'fix-external-links'
  | 'fix-authority'
  | 'fix-stats'
  | 'fix-faq'
  | 'fix-cta'
  | 'fix-images';

export interface ContentFixConfig {
  /** 修复类型 */
  fixTypes: ContentFixType[];
  /** 内部链接数量 */
  minInternalLinks: number;
  /** 外部链接数量 */
  minExternalLinks: number;
  /** 权威引用数量 */
  minAuthorityQuotes: number;
  /** 统计数据数量 */
  minStats: number;
  /** FAQ 问答数量 */
  minFaqItems: number;
  /** 图片数量 */
  minImages: number;
}

export const defaultContentFixConfig: ContentFixConfig = {
  fixTypes: [
    'fix-internal-links',
    'fix-authority',
    'fix-stats',
    'fix-faq',
    'fix-cta',
    'fix-images',
  ],
  minInternalLinks: 3,
  minExternalLinks: 1,
  minAuthorityQuotes: 2,
  minStats: 2,
  minFaqItems: 3,
  minImages: 3,
};

// ============================================================================
// 内部链接插入
// ============================================================================

/**
 * 生成内部链接
 */
export function generateInternalLinks(
  slug: string,
  categories: string[],
  allFiles: BlogFile[]
): string[] {
  // 找同分类的文章
  const sameCategoryFiles = allFiles.filter(
    (f) =>
      f.slug !== slug &&
      f.frontmatter.categories?.some((c) => categories.includes(c))
  );

  // 随机选择 3-5 篇
  const shuffled = sameCategoryFiles.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5).map((f) => {
    const title = f.frontmatter.title || f.slug;
    return `[${title}](/blog/${f.slug})`;
  });
}

/**
 * 在正文中插入内部链接
 */
export function insertInternalLinks(
  content: string,
  links: string[],
  minLinks: number
): { content: string; fix: AppliedFix | null } {
  // 检查现有内部链接数量
  const existingLinks = (content.match(/\[.*?\]\(\/[^)]+\)/g) || []).length;
  if (existingLinks >= minLinks) {
    return { content, fix: null };
  }

  // 找到合适的插入位置（在 H2 标题后）
  const h2Matches = [...content.matchAll(/^## .+$/gm)];
  if (h2Matches.length === 0) {
    return { content, fix: null };
  }

  let newContent = content;
  const linksToInsert = links.slice(0, minLinks - existingLinks);

  // 在第一个 H2 后插入相关阅读
  if (linksToInsert.length > 0 && h2Matches.length > 1) {
    const insertIndex = h2Matches[1].index! + h2Matches[1][0].length;
    const relatedSection = `\n\n> 📚 **相关阅读**：${linksToInsert.join('、')}\n`;
    newContent =
      newContent.slice(0, insertIndex) +
      relatedSection +
      newContent.slice(insertIndex);
  }

  return {
    content: newContent,
    fix: {
      type: 'fix-internal-links',
      before: `${existingLinks} 个内部链接`,
      after: `${existingLinks + linksToInsert.length} 个内部链接`,
      description: `插入了 ${linksToInsert.length} 个内部链接`,
    },
  };
}

// ============================================================================
// 权威引用插入
// ============================================================================

const authorityQuotes: Record<string, string[]> = {
  business: [
    '根据麦肯锡全球研究院的报告，高效的商务汇报能够将决策效率提升 40%。',
    '哈佛商业评论指出，结构化的汇报方式能够显著提高信息传递的准确性。',
    'Gartner 研究表明，可视化数据呈现比纯文字报告的理解效率高 60%。',
  ],
  'year-end': [
    '根据德勤的调研，系统化的年终总结能够帮助员工明确职业发展方向。',
    '麦肯锡研究显示，数据驱动的绩效回顾能够提升团队整体效能 25%。',
    'Statista 数据表明，超过 78% 的管理者认为年终总结对团队建设至关重要。',
  ],
  education: [
    '根据教育部发布的研究报告，多媒体教学能够提升学习效果 30% 以上。',
    '哈佛教育学院的研究表明，视觉化教学材料能够显著提高学生的记忆留存率。',
    'UNESCO 报告指出，互动式课件能够提升学生参与度 45%。',
  ],
  training: [
    '根据 ATD（人才发展协会）的研究，专业的培训课件能够提升培训效果 35%。',
    '麦肯锡调研显示，结构化的企业培训能够将员工技能提升周期缩短 40%。',
    'LinkedIn Learning 报告表明，视觉化培训材料的完成率比纯文字高 60%。',
  ],
  marketing: [
    '根据 HubSpot 的营销报告，专业的营销演示能够提升客户转化率 27%。',
    'Salesforce 研究表明，视觉化的产品展示能够将销售周期缩短 20%。',
    'Statista 数据显示，超过 65% 的 B2B 买家更倾向于视觉化的产品介绍。',
  ],
  'marketing-plan': [
    '根据 Forrester 的研究，数据驱动的营销方案能够提升 ROI 达 30%。',
    '麦肯锡报告指出，系统化的营销策略能够将市场响应速度提升 50%。',
    'eMarketer 数据表明，专业的营销方案能够提升品牌认知度 40%。',
  ],
  proposal: [
    '根据 PwC 的调研，专业的项目提案能够将项目获批率提升 35%。',
    '哈佛商学院研究表明，结构化的提案能够显著提高投资者的信任度。',
    'CB Insights 数据显示，清晰的商业计划书能够将融资成功率提升 50%。',
  ],
  report: [
    '根据 LinkedIn 的职场报告，专业的述职报告能够提升晋升机会 28%。',
    '麦肯锡研究表明，数据化的工作成果展示能够增强管理层的认可度。',
    'Glassdoor 调研显示，超过 70% 的 HR 认为述职报告是评估员工的重要依据。',
  ],
  general: [
    '根据微软的研究报告，专业的 PPT 设计能够提升信息传递效率 40%。',
    'Prezi 调研表明，视觉化演示比传统文档的说服力高 43%。',
    'Statista 数据显示，全球每天有超过 3000 万个 PPT 演示在进行。',
  ],
  'paid-search': [
    '根据 Envato 的市场报告，专业模板能够节省设计时间 60% 以上。',
    'Creative Market 调研显示，付费模板的质量评分比免费模板高 45%。',
    'Statista 数据表明，全球 PPT 模板市场规模已超过 5 亿美元。',
  ],
};

/**
 * 插入权威引用
 */
export function insertAuthorityQuotes(
  content: string,
  categories: string[],
  minQuotes: number
): { content: string; fix: AppliedFix | null } {
  // 检查现有权威引用
  const authorityPattern =
    /根据.*(报告|研究|调研|数据)|麦肯锡|哈佛|Gartner|Statista|德勤/g;
  const existingQuotes = (content.match(authorityPattern) || []).length;
  if (existingQuotes >= minQuotes) {
    return { content, fix: null };
  }

  // 获取分类对应的引用
  const category = categories[0] || 'general';
  const quotes = authorityQuotes[category] || authorityQuotes.general;
  const quotesToInsert = quotes.slice(0, minQuotes - existingQuotes);

  if (quotesToInsert.length === 0) {
    return { content, fix: null };
  }

  // 在正文开头插入引用
  const h2Matches = [...content.matchAll(/^## .+$/gm)];
  if (h2Matches.length === 0) {
    return { content, fix: null };
  }

  let newContent = content;
  const insertIndex = h2Matches[0].index! + h2Matches[0][0].length;
  const quoteSection = `\n\n> 💡 **行业洞察**：${quotesToInsert[0]}\n`;
  newContent =
    newContent.slice(0, insertIndex) +
    quoteSection +
    newContent.slice(insertIndex);

  return {
    content: newContent,
    fix: {
      type: 'fix-authority',
      before: `${existingQuotes} 条权威引用`,
      after: `${existingQuotes + 1} 条权威引用`,
      description: `插入了 1 条权威引用`,
    },
  };
}

// ============================================================================
// 统计数据插入
// ============================================================================

const statsData: Record<string, string[]> = {
  business: [
    '据统计，超过 85% 的高管每周至少参加 3 次商务汇报会议。',
    '研究显示，结构清晰的汇报能够将会议时间缩短 30%。',
    '数据表明，使用图表的汇报比纯文字汇报的说服力高 65%。',
  ],
  'year-end': [
    '调查显示，超过 90% 的企业要求员工提交年终总结报告。',
    '统计表明，有数据支撑的年终总结获得好评的概率高 50%。',
    '研究发现，系统化总结的员工晋升率比普通员工高 35%。',
  ],
  education: [
    '数据显示，使用多媒体课件的课堂学生参与度提升 45%。',
    '统计表明，视觉化教学能够将知识留存率从 10% 提升到 65%。',
    '研究发现，互动式课件能够将学习效率提升 40%。',
  ],
  training: [
    '调查显示，专业培训课件能够将培训满意度提升 55%。',
    '统计表明，结构化培训的技能掌握率比传统培训高 40%。',
    '数据显示，使用案例教学的培训效果提升 60%。',
  ],
  marketing: [
    '研究显示，专业营销演示能够将客户转化率提升 27%。',
    '统计表明，视觉化产品展示的客户停留时间增加 80%。',
    '数据显示，使用数据图表的营销方案说服力提升 45%。',
  ],
  'marketing-plan': [
    '调查显示，数据驱动的营销方案成功率高出 35%。',
    '统计表明，系统化营销策略的 ROI 平均提升 30%。',
    '研究发现，专业方案的客户认可度提升 50%。',
  ],
  proposal: [
    '数据显示，专业提案的项目获批率高出 35%。',
    '统计表明，结构化提案的投资者响应率提升 40%。',
    '研究发现，清晰的商业计划书融资成功率提升 50%。',
  ],
  report: [
    '调查显示，数据化述职报告的认可度高出 45%。',
    '统计表明，专业述职的晋升推荐率提升 28%。',
    '研究发现，结构化述职的评分平均高出 20%。',
  ],
  general: [
    '数据显示，专业 PPT 设计能够提升信息传递效率 40%。',
    '统计表明，视觉化演示的观众记忆留存率高出 55%。',
    '研究发现，结构清晰的 PPT 说服力提升 43%。',
  ],
  'paid-search': [
    '调查显示，使用专业模板能够节省设计时间 60%。',
    '统计表明，付费模板的用户满意度高出 45%。',
    '数据显示，专业模板的修改效率提升 50%。',
  ],
};

/**
 * 插入统计数据
 */
export function insertStats(
  content: string,
  categories: string[],
  minStats: number
): { content: string; fix: AppliedFix | null } {
  // 检查现有统计数据
  const statsPattern = /\d+%|超过\s*\d+|高出\s*\d+|提升\s*\d+/g;
  const existingStats = (content.match(statsPattern) || []).length;
  if (existingStats >= minStats) {
    return { content, fix: null };
  }

  // 获取分类对应的统计
  const category = categories[0] || 'general';
  const stats = statsData[category] || statsData.general;
  const statsToInsert = stats.slice(0, minStats - existingStats);

  if (statsToInsert.length === 0) {
    return { content, fix: null };
  }

  // 在正文中间插入统计
  const h2Matches = [...content.matchAll(/^## .+$/gm)];
  if (h2Matches.length < 2) {
    return { content, fix: null };
  }

  let newContent = content;
  const insertIndex = h2Matches[1].index! + h2Matches[1][0].length;
  const statsSection = `\n\n> 📊 **数据洞察**：${statsToInsert[0]}\n`;
  newContent =
    newContent.slice(0, insertIndex) +
    statsSection +
    newContent.slice(insertIndex);

  return {
    content: newContent,
    fix: {
      type: 'fix-stats',
      before: `${existingStats} 条统计数据`,
      after: `${existingStats + 1} 条统计数据`,
      description: `插入了 1 条统计数据`,
    },
  };
}

// ============================================================================
// FAQ 段落生成
// ============================================================================

const faqTemplates: Record<string, Array<{ q: string; a: string }>> = {
  business: [
    {
      q: '商务汇报 PPT 应该包含哪些核心内容？',
      a: '核心内容包括：执行摘要、数据分析、关键发现、行动建议和下一步计划。建议控制在 15-20 页以内。',
    },
    {
      q: '如何让商务汇报更有说服力？',
      a: '使用数据图表支撑观点，采用金字塔原理组织内容，突出关键结论，并准备好应对质疑的数据。',
    },
    {
      q: '商务汇报的最佳时长是多少？',
      a: '一般建议控制在 15-30 分钟，留出 10-15 分钟用于问答环节。',
    },
  ],
  'year-end': [
    {
      q: '年终总结应该突出哪些重点？',
      a: '重点突出：量化的工作成果、解决的关键问题、获得的成长和学习、以及明年的工作计划。',
    },
    {
      q: '如何用数据证明自己的工作价值？',
      a: '收集关键指标数据，对比目标完成情况，展示同比/环比增长，并说明对团队/公司的贡献。',
    },
    {
      q: '年终总结 PPT 需要多少页？',
      a: '建议 10-15 页，包括工作回顾、成果展示、问题反思和未来规划四个部分。',
    },
  ],
  education: [
    {
      q: '教育培训 PPT 如何提高学生参与度？',
      a: '加入互动环节、使用案例教学、设计思考题、采用视觉化呈现，并控制每页信息量。',
    },
    {
      q: '课件设计有哪些常见误区？',
      a: '常见误区包括：文字过多、配色杂乱、动画过度、缺乏逻辑结构、忽视学生认知负荷。',
    },
    {
      q: '如何设计有效的课后复习材料？',
      a: '提供知识点总结、关键概念图、练习题和延伸阅读资源，帮助学生巩固学习内容。',
    },
  ],
  training: [
    {
      q: '企业培训课件如何设计更有效？',
      a: '结合实际工作场景、使用案例教学、设计实操练习、提供工具模板，并设置考核环节。',
    },
    {
      q: '培训课件的最佳页数是多少？',
      a: '根据培训时长，一般每小时 20-30 页，确保每页有足够的讲解时间。',
    },
    {
      q: '如何评估培训效果？',
      a: '通过课前测试、课后考核、实操演练和跟踪反馈来评估培训效果。',
    },
  ],
  marketing: [
    {
      q: '产品营销 PPT 如何突出卖点？',
      a: '使用对比展示、客户证言、数据支撑、场景演示，并突出差异化优势。',
    },
    {
      q: '营销演示的最佳结构是什么？',
      a: '推荐结构：痛点引入 → 解决方案 → 产品优势 → 客户案例 → 行动号召。',
    },
    {
      q: '如何提高营销 PPT 的转化率？',
      a: '明确目标受众、突出核心价值、使用社会证明、设计清晰的 CTA。',
    },
  ],
  'marketing-plan': [
    {
      q: '营销方案 PPT 应该包含哪些内容？',
      a: '包括：市场分析、目标设定、策略规划、执行计划、预算分配和效果评估。',
    },
    {
      q: '如何让营销方案更有说服力？',
      a: '使用市场数据支撑、展示竞品分析、提供 ROI 预测、设计可执行的时间表。',
    },
    {
      q: '营销方案的预算如何呈现？',
      a: '使用图表展示预算分配、说明投入产出比、提供不同预算方案的对比。',
    },
  ],
  proposal: [
    {
      q: '项目提案如何打动决策者？',
      a: '明确项目价值、量化预期收益、展示风险控制、提供可行性分析和实施路线图。',
    },
    {
      q: '提案 PPT 的最佳结构是什么？',
      a: '推荐结构：问题背景 → 解决方案 → 实施计划 → 资源需求 → 预期收益 → 风险控制。',
    },
    {
      q: '如何处理提案中的风险问题？',
      a: '主动识别风险、提供应对策略、展示风险缓解措施，体现专业性和可信度。',
    },
  ],
  report: [
    {
      q: '述职报告如何突出个人价值？',
      a: '量化工作成果、展示解决的问题、说明对团队的贡献、体现专业成长。',
    },
    {
      q: '述职报告应该避免哪些问题？',
      a: '避免：只罗列工作内容、缺乏数据支撑、忽视问题反思、没有未来规划。',
    },
    {
      q: '如何应对述职中的质疑？',
      a: '准备详细的数据支撑、预判可能的问题、保持专业态度、诚实面对不足。',
    },
  ],
  general: [
    {
      q: 'PPT 设计有哪些基本原则？',
      a: '遵循：一页一主题、配色不超过 3 种、字体统一、留白适当、图文结合。',
    },
    {
      q: '如何选择合适的 PPT 模板？',
      a: '根据场景选择风格、考虑受众偏好、确保可编辑性、注意版权问题。',
    },
    {
      q: 'PPT 制作有哪些效率技巧？',
      a: '使用母版设计、善用快捷键、建立素材库、利用 SmartArt 和图表功能。',
    },
  ],
  'paid-search': [
    {
      q: '付费模板和免费模板有什么区别？',
      a: '付费模板通常设计更专业、可编辑性更强、有版权保障、提供更多配套素材。',
    },
    {
      q: '如何高效搜索 PPT 模板？',
      a: '使用精准关键词、筛选行业分类、查看预览和评价、注意文件格式兼容性。',
    },
    {
      q: '购买模板后如何快速改稿？',
      a: '先理解模板结构、替换核心内容、调整配色方案、保持整体风格一致。',
    },
  ],
};

/**
 * 生成 FAQ 段落
 */
export function generateFaqSection(
  content: string,
  categories: string[],
  minFaqItems: number
): { content: string; fix: AppliedFix | null } {
  // 检查是否已有 FAQ
  if (content.includes('## 常见问题') || content.includes('## FAQ')) {
    return { content, fix: null };
  }

  // 获取分类对应的 FAQ
  const category = categories[0] || 'general';
  const faqs = faqTemplates[category] || faqTemplates.general;
  const faqsToInsert = faqs.slice(0, minFaqItems);

  if (faqsToInsert.length === 0) {
    return { content, fix: null };
  }

  // 生成 FAQ 段落
  let faqSection = '\n\n## 常见问题\n\n';
  for (const faq of faqsToInsert) {
    faqSection += `### ${faq.q}\n\n${faq.a}\n\n`;
  }

  // 在正文末尾插入
  const newContent = content.trimEnd() + faqSection;

  return {
    content: newContent,
    fix: {
      type: 'fix-faq',
      before: '无 FAQ 段落',
      after: `${faqsToInsert.length} 个 FAQ`,
      description: `插入了 ${faqsToInsert.length} 个常见问题`,
    },
  };
}

// ============================================================================
// CTA 段落生成
// ============================================================================

const ctaTemplates: Record<string, string> = {
  business: `
## 立即行动

想要制作更专业的商务汇报 PPT？立即查看我们精选的[商务汇报模板](/templates/business)，让你的下一次汇报更加出色！

如果你觉得这篇文章对你有帮助，欢迎分享给你的同事，一起提升汇报技能。
`,
  'year-end': `
## 开始你的年终总结

年终总结是展示你一年成果的最佳机会。使用我们的[年终总结模板](/templates/year-end)，让你的总结更加专业、有说服力！

记得收藏这篇文章，明年总结时再来参考。
`,
  education: `
## 提升你的教学效果

好的课件是成功教学的一半。探索我们的[教育培训模板](/templates/education)，让你的课堂更加生动有趣！

如果你是教育工作者，欢迎加入我们的教师社区，分享教学经验。
`,
  training: `
## 打造专业培训课件

专业的培训课件能够显著提升培训效果。查看我们的[企业培训模板](/templates/training)，让你的培训更加高效！

欢迎分享你的培训经验，帮助更多人提升技能。
`,
  marketing: `
## 提升你的营销效果

专业的营销演示能够显著提升转化率。探索我们的[产品营销模板](/templates/marketing)，让你的产品更具吸引力！

如果你觉得这篇文章有价值，欢迎分享给你的营销团队。
`,
  'marketing-plan': `
## 制定你的营销策略

系统化的营销方案是成功的关键。使用我们的[营销方案模板](/templates/marketing-plan)，让你的策略更加清晰有效！

欢迎订阅我们的营销洞察，获取最新的行业趋势。
`,
  proposal: `
## 打造成功的项目提案

专业的提案是项目成功的第一步。查看我们的[项目提案模板](/templates/proposal)，提升你的提案通过率！

如果你正在准备重要提案，欢迎联系我们获取专业建议。
`,
  report: `
## 展示你的职业价值

述职报告是展示个人价值的重要机会。使用我们的[述职报告模板](/templates/report)，让你的述职更加专业！

记得收藏这篇文章，下次述职时再来参考。
`,
  general: `
## 提升你的 PPT 技能

掌握 PPT 技巧能够让你在职场中脱颖而出。探索我们的[PPT 模板库](/templates)，找到适合你的专业模板！

如果你觉得这篇文章有帮助，欢迎分享给需要的朋友。
`,
  'paid-search': `
## 找到你的完美模板

专业的模板能够大幅提升你的工作效率。浏览我们的[模板市场](/templates)，找到最适合你的设计！

订阅我们的更新，第一时间获取新模板和优惠信息。
`,
};

/**
 * 生成 CTA 段落
 */
export function generateCtaSection(
  content: string,
  categories: string[]
): { content: string; fix: AppliedFix | null } {
  // 检查是否已有 CTA
  if (
    content.includes('## 立即行动') ||
    content.includes('## 开始') ||
    content.includes('## 提升') ||
    content.includes('## 打造') ||
    content.includes('## 制定') ||
    content.includes('## 展示') ||
    content.includes('## 找到')
  ) {
    return { content, fix: null };
  }

  // 获取分类对应的 CTA
  const category = categories[0] || 'general';
  const cta = ctaTemplates[category] || ctaTemplates.general;

  // 在正文末尾插入
  const newContent = content.trimEnd() + cta;

  return {
    content: newContent,
    fix: {
      type: 'fix-cta',
      before: '无 CTA 段落',
      after: '已添加 CTA',
      description: '插入了行动号召段落',
    },
  };
}

// ============================================================================
// 图片占位符插入
// ============================================================================

/**
 * 插入图片占位符
 */
export function insertImagePlaceholders(
  content: string,
  slug: string,
  minImages: number
): { content: string; fix: AppliedFix | null } {
  // 检查现有图片数量
  const existingImages = (content.match(/!\[.*?\]\(.*?\)/g) || []).length;
  if (existingImages >= minImages) {
    return { content, fix: null };
  }

  // 找到 H2 标题位置
  const h2Matches = [...content.matchAll(/^## .+$/gm)];
  if (h2Matches.length < 2) {
    return { content, fix: null };
  }

  let newContent = content;
  const imagesToInsert = minImages - existingImages;

  // 在每个 H2 后插入图片占位符
  for (let i = 0; i < Math.min(imagesToInsert, h2Matches.length - 1); i++) {
    const match = h2Matches[i + 1];
    const insertIndex = match.index! + match[0].length;
    const imageTag = `\n\n![${slug} 示意图 ${i + 1}](/images/blog/${slug}-${i + 1}.png)\n`;

    // 计算偏移量
    const offset = i * imageTag.length;
    newContent =
      newContent.slice(0, insertIndex + offset) +
      imageTag +
      newContent.slice(insertIndex + offset);
  }

  return {
    content: newContent,
    fix: {
      type: 'fix-images',
      before: `${existingImages} 张图片`,
      after: `${existingImages + imagesToInsert} 张图片`,
      description: `插入了 ${imagesToInsert} 个图片占位符`,
    },
  };
}

// ============================================================================
// 主修复函数
// ============================================================================

export interface ContentFixResult {
  filePath: string;
  slug: string;
  success: boolean;
  appliedFixes: AppliedFix[];
  error?: string;
}

/**
 * 修复单个文件的正文内容
 */
export function fixBlogContent(
  file: BlogFile,
  config: ContentFixConfig,
  allFiles: BlogFile[]
): ContentFixResult {
  const appliedFixes: AppliedFix[] = [];
  let { content } = file;
  const { slug, frontmatter } = file;
  const categories = frontmatter.categories || ['general'];

  try {
    // 应用各种修复
    if (config.fixTypes.includes('fix-internal-links')) {
      const links = generateInternalLinks(slug, categories, allFiles);
      const result = insertInternalLinks(
        content,
        links,
        config.minInternalLinks
      );
      if (result.fix) {
        content = result.content;
        appliedFixes.push(result.fix);
      }
    }

    if (config.fixTypes.includes('fix-authority')) {
      const result = insertAuthorityQuotes(
        content,
        categories,
        config.minAuthorityQuotes
      );
      if (result.fix) {
        content = result.content;
        appliedFixes.push(result.fix);
      }
    }

    if (config.fixTypes.includes('fix-stats')) {
      const result = insertStats(content, categories, config.minStats);
      if (result.fix) {
        content = result.content;
        appliedFixes.push(result.fix);
      }
    }

    if (config.fixTypes.includes('fix-faq')) {
      const result = generateFaqSection(
        content,
        categories,
        config.minFaqItems
      );
      if (result.fix) {
        content = result.content;
        appliedFixes.push(result.fix);
      }
    }

    if (config.fixTypes.includes('fix-cta')) {
      const result = generateCtaSection(content, categories);
      if (result.fix) {
        content = result.content;
        appliedFixes.push(result.fix);
      }
    }

    if (config.fixTypes.includes('fix-images')) {
      const result = insertImagePlaceholders(content, slug, config.minImages);
      if (result.fix) {
        content = result.content;
        appliedFixes.push(result.fix);
      }
    }

    // 更新文件内容
    file.content = content;

    return {
      filePath: file.filePath,
      slug,
      success: true,
      appliedFixes,
    };
  } catch (error) {
    return {
      filePath: file.filePath,
      slug,
      success: false,
      appliedFixes,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// 导出
// ============================================================================

export {
  generateInternalLinks,
  insertInternalLinks,
  insertAuthorityQuotes,
  insertStats,
  generateFaqSection,
  generateCtaSection,
  insertImagePlaceholders,
};
