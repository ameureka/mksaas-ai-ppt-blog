/**
 * @deprecated 此文件已废弃，请使用 category-config.ts
 * 
 * 博客分类映射配置
 *
 * 本文件定义了 PPT 博客的分类映射和视觉风格配置。
 *
 * 迁移说明：
 * - 校验通过后迁移到 scripts/blog-audit/category-map.ts
 * - 或作为共享配置放在 src/config/blog-categories.ts
 */

// ============================================================================
// 分类映射表
// ============================================================================

/**
 * 中文分类名称到英文 slug 的映射
 */
export const categoryMapping: Record<string, string> = {
  商务汇报: 'business',
  教育培训: 'education',
  培训课件: 'training',
  产品营销: 'marketing',
  营销方案: 'marketing-plan',
  年终总结: 'year-end',
  项目提案: 'proposal',
  述职报告: 'report',
  通用: 'general',
  付费与搜索: 'paid-search',
};

/**
 * 英文 slug 到中文分类名称的反向映射
 */
export const categoryMappingReverse: Record<string, string> =
  Object.fromEntries(
    Object.entries(categoryMapping).map(([zh, en]) => [en, zh])
  );

/**
 * ppt-blog-index.ts 中的 PptCategoryName 到英文 slug 的映射
 */
export const pptCategoryToSlug: Record<string, string> = {
  通用: 'general',
  商务汇报: 'business',
  教育培训: 'education',
  培训课件: 'training',
  产品营销: 'marketing',
  营销方案: 'marketing-plan',
  年终总结: 'year-end',
  项目提案: 'proposal',
  述职报告: 'report',
  付费与搜索: 'paid-search',
};

// ============================================================================
// 分类视觉风格配置
// ============================================================================

export interface CategoryStyle {
  /** 中文名称 */
  name: string;
  /** 英文 slug */
  slug: string;
  /** 主色调数组 */
  colors: string[];
  /** 视觉风格描述（用于图片生成 Prompt） */
  style: string;
  /** 文案语气描述 */
  tone: string;
  /** 画面元素建议 */
  elements: string[];
  /** FAQ 主题建议 */
  faqTopics: string[];
  /** CTA 建议 */
  ctaSuggestions: string[];
}

export const categoryStyles: Record<string, CategoryStyle> = {
  business: {
    name: '商务汇报',
    slug: 'business',
    colors: ['#1E3A5F', '#2C5282', '#FFFFFF', '#E2E8F0'],
    style: '深蓝/灰、极简网格、数据卡片/折线图、科技光影',
    tone: '决策支持、复盘、要点速览',
    elements: ['数据看板', '折线图', '演讲人', '会议室', '大屏展示'],
    faqTopics: ['决策层关注点', '风险/ROI', '数据来源'],
    ctaSuggestions: ['下载商务汇报模板', '查看汇报案例'],
  },
  'year-end': {
    name: '年终总结',
    slug: 'year-end',
    colors: ['#C53030', '#DD6B20', '#F6E05E', '#FFFAF0'],
    style: '暖色/中性、时间线+图表、稳重、成就感',
    tone: '成绩/复盘/计划、可信证据链',
    elements: ['时间线', '里程碑', '图表', '日历', '成长曲线'],
    faqTopics: ['证据链构建', '数据来源', '失败复盘'],
    ctaSuggestions: ['使用年终总结模板', '查看总结清单'],
  },
  education: {
    name: '教育培训',
    slug: 'education',
    colors: ['#38A169', '#3182CE', '#F6E05E', '#F0FFF4'],
    style: '明快、高对比、插画式人物、卡片分组',
    tone: '互动、易学、步骤化',
    elements: ['书本', '课堂', '学习', '互动', '卡片'],
    faqTopics: ['课前准备', '互动页设计', '课后复习'],
    ctaSuggestions: ['获取培训课件模板', '查看课程设计指南'],
  },
  training: {
    name: '培训课件',
    slug: 'training',
    colors: ['#38A169', '#2B6CB0', '#ECC94B', '#F0FFF4'],
    style: '明快、高对比、插画式人物、卡片分组、企业风',
    tone: '专业培训、企业内训、步骤化',
    elements: ['培训场景', '企业logo', '流程图', '互动元素'],
    faqTopics: ['企业内训场景', '课件复用', '互动设计'],
    ctaSuggestions: ['下载企业培训模板', '查看内训案例'],
  },
  marketing: {
    name: '产品营销',
    slug: 'marketing',
    colors: ['#D53F8C', '#805AD5', '#38B2AC', '#FFF5F7'],
    style: '高对比、大标题、渐变/霓虹、场景 mock',
    tone: '转化、A/B、亮点/钩子',
    elements: ['产品展示', '营销漏斗', '用户画像', '数据看板'],
    faqTopics: ['转化率优化', '素材复用', 'A/B测试'],
    ctaSuggestions: ['获取营销方案模板', '查看营销案例'],
  },
  'marketing-plan': {
    name: '营销方案',
    slug: 'marketing-plan',
    colors: ['#805AD5', '#D53F8C', '#38B2AC', '#FAF5FF'],
    style: '高对比、大标题、渐变/霓虹、策略图',
    tone: '策略、创意、数据驱动',
    elements: ['策略图', '时间线', '预算分配', '渠道矩阵'],
    faqTopics: ['创意与数据平衡', '预算分配', '效果评估'],
    ctaSuggestions: ['下载营销方案模板', '查看方案案例'],
  },
  proposal: {
    name: '项目提案',
    slug: 'proposal',
    colors: ['#2B6CB0', '#38A169', '#FFFFFF', '#EBF8FF'],
    style: '创新、前瞻、技术感、商务感兼顾',
    tone: '说服决策层、ROI、风险控制',
    elements: ['灯泡', '路线图', '协作', '里程碑', '预算'],
    faqTopics: ['决策层关注点', 'ROI计算', '风险评估'],
    ctaSuggestions: ['获取项目提案模板', '查看BP案例'],
  },
  report: {
    name: '述职报告',
    slug: 'report',
    colors: ['#2D3748', '#4A5568', '#718096', '#F7FAFC'],
    style: '专业、可信、成就导向、稳重',
    tone: '成果呈现、证据链、职业发展',
    elements: ['职业成长', '成果展示', '演讲场景', '数据图表'],
    faqTopics: ['成绩不够好怎么办', '证据链构建', '岗位差异'],
    ctaSuggestions: ['使用述职报告模板', '查看述职技巧'],
  },
  general: {
    name: '通用技巧',
    slug: 'general',
    colors: ['#4299E1', '#48BB78', '#ECC94B', '#EBF8FF'],
    style: '多功能、实用、信息图、中性',
    tone: '通用经验、跨场景、实用技巧',
    elements: ['工具', '流程', '技巧', '对比', '清单'],
    faqTopics: ['分类选择', '页数规划', '多场景兼顾'],
    ctaSuggestions: ['查看更多PPT技巧', '获取通用模板'],
  },
  'paid-search': {
    name: '付费与搜索',
    slug: 'paid-search',
    colors: ['#9F7AEA', '#ED64A6', '#4FD1C5', '#FAF5FF'],
    style: '现代、资源导向、信息图、锁/徽章元素',
    tone: '搜索效率、付费价值、模板选择',
    elements: ['搜索框', '模板库', '锁/徽章', '对比表'],
    faqTopics: ['免费vs付费', '搜索技巧', '模板改稿'],
    ctaSuggestions: ['查看付费模板', '学习搜索技巧'],
  },
};

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 获取分类的英文 slug
 */
export function getCategorySlug(zhCategory: string): string | undefined {
  return categoryMapping[zhCategory];
}

/**
 * 获取分类的中文名称
 */
export function getCategoryName(slug: string): string | undefined {
  return categoryMappingReverse[slug];
}

/**
 * 获取分类的视觉风格配置
 */
export function getCategoryStyle(slug: string): CategoryStyle | undefined {
  return categoryStyles[slug];
}

/**
 * 验证分类是否存在
 */
export function isValidCategory(category: string): boolean {
  return category in categoryMapping || category in categoryStyles;
}

/**
 * 获取所有分类 slug 列表
 */
export function getAllCategorySlugs(): string[] {
  return Object.keys(categoryStyles);
}

/**
 * 获取所有中文分类名称列表
 */
export function getAllCategoryNames(): string[] {
  return Object.keys(categoryMapping);
}
