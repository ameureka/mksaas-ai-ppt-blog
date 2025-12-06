export const PPT_CATEGORIES = [
  { label: '商务汇报', value: 'business' },
  { label: '教育培训', value: 'education' },
  { label: '科技互联网', value: 'technology' },
  { label: '设计创意', value: 'design' },
  { label: '产品营销', value: 'marketing' },
  { label: '人力资源', value: 'hr' },
  { label: '医疗健康', value: 'medical' },
  { label: '金融财务', value: 'finance' },
  { label: '通用模板', value: 'general' },
  { label: '年终总结', value: 'summary' },
  { label: '述职报告', value: 'report' },
  { label: '工作计划', value: 'plan' },
] as const;

export const PPT_CATEGORY_VALUES = PPT_CATEGORIES.map(
  (category) => category.value
);

export const PPT_SORTS = [
  { label: '最受欢迎', value: 'popular' },
  { label: '最新上传', value: 'newest' },
  { label: '下载最多', value: 'downloads' },
  { label: '评分最高', value: 'rating' },
] as const;

export const PPT_LANGUAGES = [
  { label: '中文', value: '中文' },
  { label: '英文', value: 'English' },
  { label: '其他', value: '其他' },
] as const;

export type PPTCategory = (typeof PPT_CATEGORIES)[number]['value'];
export type PPTSort = (typeof PPT_SORTS)[number]['value'];
export type PPTLanguage = (typeof PPT_LANGUAGES)[number]['value'];
