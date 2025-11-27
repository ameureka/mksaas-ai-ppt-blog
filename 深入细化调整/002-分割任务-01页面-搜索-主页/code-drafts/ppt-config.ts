/**
 * PPT 配置（草案）
 * - 放置下载登录开关、热门关键词、分类映射
 * - 未来可由管理后台写入/读取
 */

export const pptConfig = {
  requireLoginForDownload: false,
  hotKeywords: [
    '年终总结',
    '工作汇报',
    '项目提案',
    '述职报告',
    '商业计划',
    '培训课件',
    '产品介绍',
    '营销方案',
  ],
  categories: [
    { slug: 'business', label: '商务汇报' },
    { slug: 'education', label: '教育培训' },
    { slug: 'technology', label: '科技互联网' },
    { slug: 'creative', label: '创意设计' },
    { slug: 'marketing', label: '营销策划' },
    { slug: 'medical', label: '医疗健康' },
    { slug: 'finance', label: '金融财务' },
    { slug: 'hr', label: '人力资源' },
    { slug: 'lifestyle', label: '生活休闲' },
    { slug: 'general', label: '通用模板' },
  ],
};
