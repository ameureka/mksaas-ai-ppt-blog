export const PPT_CATEGORIES = [
  { label: '商务汇报', value: 'business' },
  { label: '教育培训', value: 'education' },
  { label: '产品营销', value: 'marketing' },
  { label: '年终总结', value: 'summary' },
  { label: '项目提案', value: 'proposal' },
  { label: '培训课件', value: 'training' },
  { label: '述职报告', value: 'report' },
  { label: '营销方案', value: 'plan' },
] as const;

export const PPT_SORTS = [
  { label: '最受欢迎', value: 'popular' },
  { label: '最新上传', value: 'newest' },
  { label: '下载最多', value: 'downloads' },
  { label: '评分最高', value: 'rating' },
] as const;

export const PPT_LANGUAGES = [
  { label: '中文', value: 'Chinese' },
  { label: '英文', value: 'English' },
  { label: '其他', value: 'Other' },
] as const;

export type PPTCategory = (typeof PPT_CATEGORIES)[number]['value'];
export type PPTSort = (typeof PPT_SORTS)[number]['value'];
export type PPTLanguage = (typeof PPT_LANGUAGES)[number]['value'];
