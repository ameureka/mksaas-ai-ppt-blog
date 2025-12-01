/**
 * 博客分类统一配置
 * 合并 category-map.ts 和 category-styles.ts
 */

export interface CategoryConfig {
  slug: string;
  name: string;
  nameEn: string;
  colors: string[];
  style: string;
  tone: string;
  elements: string[];
  faqTopics: string[];
  ctaSuggestions: string[];
}

export const categories: CategoryConfig[] = [
  {
    slug: 'business',
    name: '商务汇报',
    nameEn: 'Business Report',
    colors: ['#1E3A5F', '#2C5282', '#FFFFFF', '#E2E8F0'],
    style: '深蓝/灰、极简网格、数据卡片/折线图、科技光影',
    tone: '决策支持、复盘、要点速览',
    elements: ['数据看板', '折线图', '演讲人', '会议室', '大屏展示'],
    faqTopics: ['决策层关注点', '风险/ROI', '数据来源'],
    ctaSuggestions: ['下载商务汇报模板', '查看汇报案例'],
  },
  {
    slug: 'year-end',
    name: '年终总结',
    nameEn: 'Year-End Summary',
    colors: ['#C53030', '#DD6B20', '#F6E05E', '#FFFAF0'],
    style: '暖色/中性、时间线+图表、稳重、成就感',
    tone: '成绩/复盘/计划、可信证据链',
    elements: ['时间线', '里程碑', '图表', '日历', '成长曲线'],
    faqTopics: ['证据链构建', '数据来源', '失败复盘'],
    ctaSuggestions: ['使用年终总结模板', '查看总结清单'],
  },
  {
    slug: 'education',
    name: '教育培训',
    nameEn: 'Education & Training',
    colors: ['#38A169', '#3182CE', '#F6E05E', '#F0FFF4'],
    style: '明快、高对比、插画式人物、卡片分组',
    tone: '互动、易学、步骤化',
    elements: ['书本', '课堂', '学习', '互动', '卡片'],
    faqTopics: ['课前准备', '互动页设计', '课后复习'],
    ctaSuggestions: ['获取培训课件模板', '查看课程设计指南'],
  },
  {
    slug: 'marketing',
    name: '产品营销',
    nameEn: 'Product Marketing',
    colors: ['#D53F8C', '#805AD5', '#38B2AC', '#FFF5F7'],
    style: '高对比、大标题、渐变/霓虹、场景 mock',
    tone: '转化、A/B、亮点/钩子',
    elements: ['产品展示', '营销漏斗', '用户画像', '数据看板'],
    faqTopics: ['转化率优化', '素材复用', 'A/B测试'],
    ctaSuggestions: ['获取营销方案模板', '查看营销案例'],
  },
  {
    slug: 'proposal',
    name: '项目提案',
    nameEn: 'Project Proposal',
    colors: ['#2B6CB0', '#38A169', '#FFFFFF', '#EBF8FF'],
    style: '创新、前瞻、技术感、商务感兼顾',
    tone: '说服决策层、ROI、风险控制',
    elements: ['灯泡', '路线图', '协作', '里程碑', '预算'],
    faqTopics: ['决策层关注点', 'ROI计算', '风险评估'],
    ctaSuggestions: ['获取项目提案模板', '查看BP案例'],
  },
  {
    slug: 'report',
    name: '述职报告',
    nameEn: 'Performance Report',
    colors: ['#2D3748', '#4A5568', '#718096', '#F7FAFC'],
    style: '专业、可信、成就导向、稳重',
    tone: '成果呈现、证据链、职业发展',
    elements: ['职业成长', '成果展示', '演讲场景', '数据图表'],
    faqTopics: ['成绩不够好怎么办', '证据链构建', '岗位差异'],
    ctaSuggestions: ['使用述职报告模板', '查看述职技巧'],
  },
  {
    slug: 'general',
    name: '通用技巧',
    nameEn: 'General Tips',
    colors: ['#4299E1', '#48BB78', '#ECC94B', '#EBF8FF'],
    style: '多功能、实用、信息图、中性',
    tone: '通用经验、跨场景、实用技巧',
    elements: ['工具', '流程', '技巧', '对比', '清单'],
    faqTopics: ['分类选择', '页数规划', '多场景兼顾'],
    ctaSuggestions: ['查看更多PPT技巧', '获取通用模板'],
  },
  {
    slug: 'tips',
    name: '模板技巧',
    nameEn: 'Tips & Tricks',
    colors: ['#9F7AEA', '#ED64A6', '#4FD1C5', '#FAF5FF'],
    style: '现代、资源导向、信息图、锁/徽章元素',
    tone: '搜索效率、付费价值、模板选择',
    elements: ['搜索框', '模板库', '锁/徽章', '对比表'],
    faqTopics: ['免费vs付费', '搜索技巧', '模板改稿'],
    ctaSuggestions: ['查看付费模板', '学习搜索技巧'],
  },
  {
    slug: 'tutorial',
    name: '教程指南',
    nameEn: 'Tutorial',
    colors: ['#4299E1', '#38A169', '#F6E05E', '#EBF8FF'],
    style: '清晰、步骤化、实操性强',
    tone: '手把手教学、新手友好',
    elements: ['步骤图', '截图', '对比', '清单'],
    faqTopics: ['新手入门', '常见问题', '进阶技巧'],
    ctaSuggestions: ['查看更多教程', '获取入门模板'],
  },
];

// 中文名 -> slug 映射
export const categoryMapping: Record<string, string> = Object.fromEntries(
  categories.map((c) => [c.name, c.slug])
);

// slug -> 中文名 映射
export const categoryMappingReverse: Record<string, string> = Object.fromEntries(
  categories.map((c) => [c.slug, c.name])
);

// 辅助函数
export const getCategoryBySlug = (slug: string) =>
  categories.find((c) => c.slug === slug);

export const getCategoryByName = (name: string) =>
  categories.find((c) => c.name === name);

export const getAllSlugs = () => categories.map((c) => c.slug);
