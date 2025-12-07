import {
  Briefcase,
  Calendar,
  Cpu,
  DollarSign,
  FileText,
  GraduationCap,
  Heart,
  Palette,
  Presentation,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { PPT_CATEGORIES, slugToLabel } from './ppt';

const defaultMeta = {
  count: 0,
  icon: FileText,
  preview: '/placeholder.svg',
  description: '分类描述待更新',
  useCases: [] as string[],
  avgPages: '—',
  style: '—',
  difficulty: '—',
};

type CategoryMeta = typeof defaultMeta;

export const CATEGORY_META: Record<string, CategoryMeta> = {
  business: {
    ...defaultMeta,
    icon: Briefcase,
    preview: '/ppt/category-business.png',
    description: '商务汇报/路演/方案提案',
    useCases: ['商业计划书', '融资路演', '季度汇报'],
  },
  education: {
    ...defaultMeta,
    icon: GraduationCap,
    preview: '/ppt/category-education.png',
    description: '教育培训/课件/讲义',
    useCases: ['教学课件', '培训教材', '公开课'],
  },
  technology: {
    ...defaultMeta,
    icon: Cpu,
    preview: '/ppt/category-technology.png',
    description: '科技互联网/产品方案',
    useCases: ['技术方案', '产品发布', '技术分享'],
  },
  design: {
    ...defaultMeta,
    icon: Palette,
    preview: '/ppt/category-design.png',
    description: '设计创意/视觉呈现',
    useCases: ['作品集', '品牌提案', '视觉展示'],
  },
  marketing: {
    ...defaultMeta,
    icon: TrendingUp,
    preview: '/ppt/category-marketing.png',
    description: '产品营销/活动策划',
    useCases: ['营销方案', '市场推广', '活动策划'],
  },
  hr: {
    ...defaultMeta,
    icon: Users,
    preview: '/ppt/category-hr.png',
    description: '人力资源/培训/招聘',
    useCases: ['入职培训', '招聘宣讲', '团队建设'],
  },
  medical: {
    ...defaultMeta,
    icon: Heart,
    preview: '/ppt/category-medical.png',
    description: '医疗健康/护理/医学科普',
    useCases: ['医学讲座', '健康科普', '病例分享'],
  },
  finance: {
    ...defaultMeta,
    icon: DollarSign,
    preview: '/ppt/category-finance.png',
    description: '金融财务/投融资',
    useCases: ['财务报表', '投融资分析', '风控汇报'],
  },
  general: {
    ...defaultMeta,
    icon: Calendar,
    preview: '/ppt/category-general.png',
    description: '通用模板/日常办公',
    useCases: ['日常汇报', '信息分享', '项目通报'],
  },
  summary: {
    ...defaultMeta,
    icon: Calendar,
    preview: '/ppt/category-summary.png',
    description: '年终总结/年度汇报',
    useCases: ['年度总结', '年终述职', '年度回顾'],
  },
  report: {
    ...defaultMeta,
    icon: Presentation,
    preview: '/ppt/category-report.png',
    description: '述职报告/工作汇报',
    useCases: ['月度述职', '项目复盘', '阶段汇报'],
  },
  plan: {
    ...defaultMeta,
    icon: Target,
    preview: '/ppt/category-plan.png',
    description: '工作计划/项目规划',
    useCases: ['项目计划', '路线图', '实施方案'],
  },
};

// 保留旧导出名以兼容历史引用
export const categoryMeta = CATEGORY_META;

export function getCategoryLabel(slug: string): string {
  return slugToLabel[slug] ?? slug;
}

export function getCategoryMeta(slug: string) {
  return CATEGORY_META[slug] ?? {
    ...defaultMeta,
    icon: FileText,
    preview: '/placeholder.svg',
  };
}

export async function getCategoryStats() {
  try {
    const res = await fetch('/api/ppts/stats', { next: { revalidate: 300 } });
    if (!res.ok) return categoryMeta;
    const { data } = await res.json();

    const updated = { ...categoryMeta };
    for (const [key, count] of Object.entries(data)) {
      if (updated[key])
        updated[key] = { ...updated[key], count: count as number };
    }
    return updated;
  } catch {
    return categoryMeta;
  }
}
