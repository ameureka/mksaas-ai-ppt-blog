/**
 * 博客分类统一配置
 * 合并 category-map.ts 和 category-styles.ts
 * 已集成图片生成所需的 keywords 和 palette 字段
 */

export interface CategoryConfig {
  slug: string;
  name: string;
  nameEn: string;
  colors: string[];
  palette: string; //用于 Prompt 的配色中文描述
  style: string;
  tone: string;
  elements: string[];
  keywords: string[]; // 用于封面生成的关键词
  faqTopics: string[];
  ctaSuggestions: string[];
}

export const categories: CategoryConfig[] = [
  {
    slug: 'business',
    name: '商务汇报',
    nameEn: 'Business Report',
    colors: ['#1E3A5F', '#2C5282', '#FFFFFF', '#E2E8F0'],
    palette: '深蓝/灰/白',
    style: '极简网格、数据卡片、科技光影、专业商务',
    tone: '决策支持、复盘、要点速览',
    elements: ['数据看板', '折线图', '演讲人', '会议室', '大屏展示'],
    keywords: ['商务汇报', '工作汇报', 'PPT'],
    faqTopics: ['决策层关注点', '风险/ROI', '数据来源'],
    ctaSuggestions: ['下载商务汇报模板', '查看汇报案例'],
  },
  {
    slug: 'education',
    name: '教育培训',
    nameEn: 'Education & Training',
    colors: ['#38A169', '#3182CE', '#F6E05E', '#F0FFF4'],
    palette: '绿/蓝/黄',
    style: '明快高对比、插画人物、卡片分组、互动感',
    tone: '互动、易学、步骤化',
    elements: ['书本', '课堂', '学习', '互动', '卡片'],
    keywords: ['教育培训', '课件', 'PPT'],
    faqTopics: ['课前准备', '互动页设计', '课后复习'],
    ctaSuggestions: ['获取培训课件模板', '查看课程设计指南'],
  },
  {
    slug: 'general',
    name: '通用技巧',
    nameEn: 'General Tips',
    colors: ['#4299E1', '#48BB78', '#ECC94B', '#EBF8FF'],
    palette: '蓝/绿/黄',
    style: '多功能、信息图、实用、清晰易懂',
    tone: '通用经验、跨场景、实用技巧',
    elements: ['工具', '流程', '技巧', '对比', '清单'],
    keywords: ['PPT技巧', '制作指南', 'PPT'],
    faqTopics: ['分类选择', '页数规划', '多场景兼顾'],
    ctaSuggestions: ['查看更多PPT技巧', '获取通用模板'],
  },
  {
    slug: 'marketing',
    name: '产品营销',
    nameEn: 'Product Marketing',
    colors: ['#D53F8C', '#805AD5', '#38B2AC', '#FFF5F7'],
    palette: '粉/紫/青',
    style: '高对比、大标题、渐变霓虹、情境mock、吸引力',
    tone: '转化、A/B、亮点/钩子',
    elements: ['产品展示', '营销漏斗', '用户画像', '数据看板'],
    keywords: ['产品营销', '营销方案', 'PPT'],
    faqTopics: ['转化率优化', '素材复用', 'A/B测试'],
    ctaSuggestions: ['获取营销方案模板', '查看营销案例'],
  },
  {
    slug: 'paid-search',
    name: '付费搜索',
    nameEn: 'Paid Search',
    colors: ['#9F7AEA', '#ED64A6', '#38B2AC', '#FAF5FF'],
    palette: '紫/粉/青',
    style: '现代、资源导向、搜索感、价值感',
    tone: '搜索效率、付费价值、模板选择',
    elements: ['搜索框', '锁/徽章', '模板预览', '付费标识', '资源库'],
    keywords: ['模板搜索', '付费模板', 'PPT'],
    faqTopics: ['免费vs付费', '搜索技巧', '模板改稿'],
    ctaSuggestions: ['查看付费模板', '学习搜索技巧'],
  },
  {
    slug: 'year-end',
    name: '年终总结',
    nameEn: 'Year-End Summary',
    colors: ['#C53030', '#DD6B20', '#F6E05E', '#FFFAF0'],
    palette: '暖橙/金/米',
    style: '时间线+图表、稳重、成就感、里程碑',
    tone: '成绩/复盘/计划、可信证据链',
    elements: ['时间线', '里程碑', '图表', '日历', '成长曲线'],
    keywords: ['年终总结', '年度复盘', 'PPT'],
    faqTopics: ['证据链构建', '数据来源', '失败复盘'],
    ctaSuggestions: ['使用年终总结模板', '查看总结清单'],
  },
  {
    slug: 'proposal',
    name: '项目提案',
    nameEn: 'Project Proposal',
    colors: ['#2B6CB0', '#38A169', '#FFFFFF', '#EBF8FF'],
    palette: '蓝/绿/白',
    style: '创新、前瞻、技术感、路线图、专业',
    tone: '说服决策层、ROI、风险控制',
    elements: ['灯泡', '路线图', '协作', '里程碑', '预算'],
    keywords: ['项目提案', 'BP', '路演', 'PPT'],
    faqTopics: ['决策层关注点', 'ROI计算', '风险评估'],
    ctaSuggestions: ['获取项目提案模板', '查看BP案例'],
  },
  {
    slug: 'report',
    name: '述职报告',
    nameEn: 'Performance Report',
    colors: ['#2D3748', '#4A5568', '#718096', '#F7FAFC'],
    palette: '深灰/石墨/白',
    style: '专业、稳重、成就导向、职业成长',
    tone: '成果呈现、证据链、职业发展',
    elements: ['职业成长', '成果展示', '演讲场景', '数据图表'],
    keywords: ['述职报告', '晋升汇报', 'PPT'],
    faqTopics: ['成绩不够好怎么办', '证据链构建', '岗位差异'],
    ctaSuggestions: ['使用述职报告模板', '查看述职技巧'],
  },
];

// 中文名 -> slug 映射
export const categoryMapping: Record<string, string> = Object.fromEntries(
  categories.map((c) => [c.name, c.slug])
);

// slug -> 中文名 映射
export const categoryMappingReverse: Record<string, string> =
  Object.fromEntries(categories.map((c) => [c.slug, c.name]));

// 辅助函数
export const getCategoryBySlug = (slug: string) => {
  const cat = categories.find((c) => c.slug === slug);
  // 如果找不到，默认返回通用技巧
  return cat || categories.find((c) => c.slug === 'general') || categories[2];
};

export const getCategoryByName = (name: string) =>
  categories.find((c) => c.name === name);

export const getAllSlugs = () => categories.map((c) => c.slug);
