/**
 * @deprecated 此文件已废弃，请使用 category-config.ts
 * 
 * 分类风格配置 - 图片生成流水线
 * 定义每个分类的视觉风格、配色和典型元素
 */

export interface CategoryStyle {
  category: string;
  categoryEn: string;
  styleHint: string;
  palette: string;
  paletteHex: string[];
  sceneElements: string[];
  coverKeywords: string[];
}

export const categoryStyles: CategoryStyle[] = [
  {
    category: '商务汇报',
    categoryEn: 'business',
    styleHint: '极简网格、数据卡片、科技光影、专业商务',
    palette: '深蓝/灰/白',
    paletteHex: ['#1E3A5F', '#E2E8F0', '#FFFFFF'],
    sceneElements: ['数据看板', '折线图', '演讲人+大屏', '会议室', '商务图表'],
    coverKeywords: ['商务汇报', '工作汇报', 'PPT'],
  },
  {
    category: '年终总结',
    categoryEn: 'year-end',
    styleHint: '时间线+图表、稳重、成就感、里程碑',
    palette: '暖橙/金/米',
    paletteHex: ['#DD6B20', '#F6E05E', '#FFFAF0'],
    sceneElements: ['时间线', '成就卡片', '数据对比', '日历', '奖杯', '里程碑'],
    coverKeywords: ['年终总结', '年度复盘', 'PPT'],
  },
  {
    category: '教育培训',
    categoryEn: 'education',
    styleHint: '明快高对比、插画人物、卡片分组、互动感',
    palette: '绿/蓝/黄',
    paletteHex: ['#38A169', '#3182CE', '#F6E05E'],
    sceneElements: ['课堂场景', '步骤图', '互动元素', '书本', '学生', '卡片'],
    coverKeywords: ['教育培训', '课件', 'PPT'],
  },
  {
    category: '培训课件',
    categoryEn: 'training',
    styleHint: '企业风、专业培训、结构化、清晰',
    palette: '蓝/灰/白',
    paletteHex: ['#2B6CB0', '#718096', '#FFFFFF'],
    sceneElements: ['培训场景', '流程图', '知识卡片', '讲师', '白板'],
    coverKeywords: ['培训课件', '企业培训', 'PPT'],
  },
  {
    category: '产品营销',
    categoryEn: 'marketing',
    styleHint: '高对比、大标题、渐变霓虹、情境mock、吸引力',
    palette: '粉/紫/青',
    paletteHex: ['#D53F8C', '#805AD5', '#38B2AC'],
    sceneElements: ['产品展示', '营销漏斗', '用户场景', '数据增长', '转化图'],
    coverKeywords: ['产品营销', '营销方案', 'PPT'],
  },
  {
    category: '营销方案',
    categoryEn: 'marketing-plan',
    styleHint: '策略图、数据驱动、专业营销、方案感',
    palette: '橙/蓝/白',
    paletteHex: ['#ED8936', '#4299E1', '#FFFFFF'],
    sceneElements: ['策略图', '渠道分析', '预算分配', '时间节点', '目标达成'],
    coverKeywords: ['营销方案', '推广策略', 'PPT'],
  },
  {
    category: '项目提案',
    categoryEn: 'proposal',
    styleHint: '创新、前瞻、技术感、路线图、专业',
    palette: '蓝/绿/白',
    paletteHex: ['#2B6CB0', '#38A169', '#FFFFFF'],
    sceneElements: ['灯泡', '路线图', '里程碑', '团队', '目标', '创新'],
    coverKeywords: ['项目提案', 'BP', '路演', 'PPT'],
  },
  {
    category: '述职报告',
    categoryEn: 'report',
    styleHint: '专业、稳重、成就导向、职业成长',
    palette: '深灰/石墨/白',
    paletteHex: ['#2D3748', '#4A5568', '#FFFFFF'],
    sceneElements: ['职业成长', '成果图表', '能力雷达', '目标达成', '晋升'],
    coverKeywords: ['述职报告', '晋升汇报', 'PPT'],
  },
  {
    category: '通用技巧',
    categoryEn: 'general',
    styleHint: '多功能、信息图、实用、清晰易懂',
    palette: '蓝/绿/黄',
    paletteHex: ['#4299E1', '#48BB78', '#F6E05E'],
    sceneElements: ['工具', '流程', '清单', '技巧', '对比', '步骤'],
    coverKeywords: ['PPT技巧', '制作指南', 'PPT'],
  },
  {
    category: '模板技巧',
    categoryEn: 'tips',
    styleHint: '现代、资源导向、信息图、锁/徽章元素',
    palette: '紫/粉/青',
    paletteHex: ['#9F7AEA', '#ED64A6', '#4FD1C5'],
    sceneElements: ['搜索框', '模板库', '锁/徽章', '对比表', '技巧卡片'],
    coverKeywords: ['模板技巧', '模板选择', 'PPT'],
  },
  {
    category: '付费搜索',
    categoryEn: 'paid-search',
    styleHint: '现代、资源导向、搜索感、价值感',
    palette: '紫/粉/青',
    paletteHex: ['#9F7AEA', '#ED64A6', '#38B2AC'],
    sceneElements: ['搜索框', '锁/徽章', '模板预览', '付费标识', '资源库'],
    coverKeywords: ['模板搜索', '付费模板', 'PPT'],
  },
];

/**
 * 根据分类名称获取风格配置
 */
export function getCategoryStyle(category: string): CategoryStyle {
  const style = categoryStyles.find(
    (s) => s.category === category || s.categoryEn === category
  );
  return style || categoryStyles[8]; // 默认返回通用技巧
}

/**
 * 根据英文 slug 获取风格配置
 */
export function getCategoryStyleBySlug(slug: string): CategoryStyle {
  const style = categoryStyles.find((s) => s.categoryEn === slug);
  return style || categoryStyles[8];
}

/**
 * 获取所有分类的英文 slug 列表
 */
export function getAllCategorySlugs(): string[] {
  return categoryStyles.map((s) => s.categoryEn);
}
