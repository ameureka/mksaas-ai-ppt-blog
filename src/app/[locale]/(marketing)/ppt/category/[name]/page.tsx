'use client';

import { BlogBannerAd, NativeAdCard, mockNativeAd } from '@/components/ads';
import { PPTCard } from '@/components/ppt/ppt-card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PPT_CATEGORIES } from '@/lib/constants/ppt';
import { categoryMeta } from '@/lib/constants/ppt-category-meta';
import { PublicRoutes } from '@/lib/constants/ppt-routes';
import {
  BookOpen,
  Briefcase,
  Calendar,
  ChevronRight,
  Cpu,
  DollarSign,
  Download,
  FileText,
  Filter,
  Flame,
  GraduationCap,
  Heart,
  Home,
  Palette,
  Presentation,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { mapCategoryItems } from '../map-items';
import { CategoryErrorBanner } from '../category-error-banner';

interface PPT {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  thumbnail?: string;
  downloads: number;
  views: number;
  rating?: number;
  reviewCount?: number;
  price?: number;
  language?: string;
  slides?: number;
  tags?: string[];
  previewUrl?: string;
  pages?: number;
}

const categoryMetadata: Record<
  string,
  {
    icon: any;
    description: string;
    totalTemplates: number;
    totalDownloads: string;
    avgRating: number;
    avgPages: string;
    style: string;
    useCases: string[];
  }
> = {
  商务汇报: {
    icon: Briefcase,
    description:
      '专业的商务汇报模板，助力工作展示。适用于企业内部汇报、客户提案、项目总结等场景',
    totalTemplates: 12345,
    totalDownloads: '580k+',
    avgRating: 4.7,
    avgPages: '20-30',
    style: '简约专业',
    useCases: [
      '企业年度总结',
      '季度业绩汇报',
      '部门工作总结',
      '客户提案演示',
      '项目进度汇报',
      '商业计划书',
    ],
  },
  教育培训: {
    icon: GraduationCap,
    description: '丰富的教育培训课件，提升教学质量',
    totalTemplates: 8234,
    totalDownloads: '420k+',
    avgRating: 4.6,
    avgPages: '25-35',
    style: '清新活泼',
    useCases: [
      '课堂教学',
      '企业培训',
      '在线教育',
      '学术报告',
      '培训讲义',
      '教学演示',
    ],
  },
  产品营销: {
    icon: TrendingUp,
    description: '精美的营销模板，助力产品推广',
    totalTemplates: 6789,
    totalDownloads: '350k+',
    avgRating: 4.8,
    avgPages: '15-25',
    style: '时尚科技',
    useCases: [
      '产品发布会',
      '营销方案',
      '市场分析',
      '品牌推广',
      '竞品分析',
      '销售提案',
    ],
  },
  年终总结: {
    icon: Calendar,
    description: '年终总结必备，展现工作成果',
    totalTemplates: 15678,
    totalDownloads: '680k+',
    avgRating: 4.7,
    avgPages: '20-30',
    style: '商务大气',
    useCases: [
      '年度工作总结',
      '部门总结',
      '个人述职',
      '业绩汇报',
      '项目复盘',
      '计划展望',
    ],
  },
  项目提案: {
    icon: Target,
    description: '专业的项目提案模板，提升通过率',
    totalTemplates: 9456,
    totalDownloads: '450k+',
    avgRating: 4.6,
    avgPages: '18-28',
    style: '专业严谨',
    useCases: [
      '项目立项',
      '招标提案',
      '投资提案',
      '合作方案',
      '技术方案',
      '预算申请',
    ],
  },
  培训课件: {
    icon: BookOpen,
    description: '系统的培训课件，知识传递高效',
    totalTemplates: 7123,
    totalDownloads: '380k+',
    avgRating: 4.5,
    avgPages: '30-40',
    style: '结构清晰',
    useCases: [
      '员工培训',
      '新人入职',
      '技能提升',
      '安全培训',
      '产品培训',
      '制度培训',
    ],
  },
  述职报告: {
    icon: Presentation,
    description: '述职报告专用，展现个人价值',
    totalTemplates: 11234,
    totalDownloads: '520k+',
    avgRating: 4.7,
    avgPages: '20-25',
    style: '专业稳重',
    useCases: [
      '年度述职',
      '晋升述职',
      '转正述职',
      '岗位竞聘',
      '绩效汇报',
      '工作回顾',
    ],
  },
  营销方案: {
    icon: Users,
    description: '创意营销方案，打动客户',
    totalTemplates: 5678,
    totalDownloads: '320k+',
    avgRating: 4.8,
    avgPages: '15-20',
    style: '创意新颖',
    useCases: [
      '营销策划',
      '活动方案',
      '推广计划',
      '品牌策略',
      '渠道策略',
      '市场推广',
    ],
  },
  科技互联网: {
    icon: Cpu,
    description: '科技互联网主题模板，支持技术方案与产品架构展示',
    totalTemplates: 3200,
    totalDownloads: '180k+',
    avgRating: 4.6,
    avgPages: '18-30',
    style: '科技感',
    useCases: [
      '技术方案',
      '产品架构',
      '路演汇报',
      '技术分享',
      '产品发布',
      '数据报告',
    ],
  },
  设计创意: {
    icon: Palette,
    description: '设计创意类模板，突出视觉与创意呈现',
    totalTemplates: 2100,
    totalDownloads: '120k+',
    avgRating: 4.7,
    avgPages: '15-25',
    style: '创意视觉',
    useCases: [
      '视觉展示',
      '创意提案',
      '作品集',
      '品牌设计',
      '广告创意',
      '艺术展示',
    ],
  },
  人力资源: {
    icon: Users,
    description: '人力资源类模板，涵盖招聘与培训',
    totalTemplates: 1800,
    totalDownloads: '95k+',
    avgRating: 4.5,
    avgPages: '15-25',
    style: '商务简洁',
    useCases: [
      '招聘培训',
      '人事汇报',
      '团队建设',
      '绩效考核',
      '员工手册',
      '组织架构',
    ],
  },
  医疗健康: {
    icon: Heart,
    description: '医疗健康主题模板，适用于医疗报告与健康宣传',
    totalTemplates: 1400,
    totalDownloads: '75k+',
    avgRating: 4.6,
    avgPages: '15-30',
    style: '稳重专业',
    useCases: [
      '医疗报告',
      '健康宣传',
      '科普讲座',
      '病例分析',
      '医学研究',
      '健康管理',
    ],
  },
  金融财务: {
    icon: DollarSign,
    description: '金融财务类模板，支持财务分析与投资报告',
    totalTemplates: 900,
    totalDownloads: '60k+',
    avgRating: 4.5,
    avgPages: '20-30',
    style: '数据可视化',
    useCases: [
      '财务分析',
      '投资报告',
      '预算计划',
      '审计报告',
      '风险评估',
      '财务汇报',
    ],
  },
  通用模板: {
    icon: FileText,
    description: '通用模板集合，适配多种场景',
    totalTemplates: 5000,
    totalDownloads: '250k+',
    avgRating: 4.5,
    avgPages: '15-30',
    style: '通用简洁',
    useCases: [
      '通用汇报',
      '日常展示',
      '会议记录',
      '工作安排',
      '信息传达',
      '简单演示',
    ],
  },
  工作计划: {
    icon: Target,
    description: '工作计划类模板，助力目标规划与执行',
    totalTemplates: 4500,
    totalDownloads: '220k+',
    avgRating: 4.6,
    avgPages: '15-25',
    style: '清晰条理',
    useCases: [
      '年度计划',
      '月度计划',
      '项目计划',
      'OKR规划',
      '战略规划',
      '执行方案',
    ],
  },
};

// Note: generateMetadata moved to layout.tsx or a separate server component
export default function CategoryPage() {
  const params = useParams<{ name: string }>();
  const slug = decodeURIComponent(params?.name ?? '');
  // 从 PPT_CATEGORIES 自动生成映射，保证一致性
  const slugToName = Object.fromEntries(
    PPT_CATEGORIES.map((cat) => [cat.value, cat.label])
  );
  const nameToSlug = Object.fromEntries(
    PPT_CATEGORIES.map((cat) => [cat.label, cat.value])
  );
  const categoryName = slugToName[slug] ?? slug;

  const router = useRouter();
  const metadata = categoryMetadata[categoryName] || categoryMetadata.商务汇报;
  const CategoryIcon = metadata.icon;

  const [hotPPTs, setHotPPTs] = useState<PPT[]>([]);
  const [featuredPPTs, setFeaturedPPTs] = useState<PPT[]>([]);
  const [newPPTs, setNewPPTs] = useState<PPT[]>([]);
  const [allPPTs, setAllPPTs] = useState<PPT[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('popular');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasError, setHasError] = useState(false);

  // 排序映射
  const sortByMap: Record<string, string> = {
    popular: 'downloads',
    newest: 'created_at',
    downloads: 'downloads',
    rating: 'downloads', // 暂无评分字段，用下载量代替
  };

  // 数据映射函数
  const mapItems = (items: any[]): PPT[] =>
    mapCategoryItems(items, categoryName) as unknown as PPT[];

  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchCategoryPPTs = async () => {
      setIsLoading(true);
      try {
        const apiSortBy = sortByMap[sortBy] ?? 'downloads';

        // 并行请求：热门、最新、全部
        const [hotRes, newRes, allRes] = await Promise.all([
          fetch(
            `/api/ppts?category=${encodeURIComponent(
              slug
            )}&status=published&pageSize=8&sortBy=downloads&sortOrder=desc`
          ),
          fetch(
            `/api/ppts?category=${encodeURIComponent(
              slug
            )}&status=published&pageSize=8&sortBy=created_at&sortOrder=desc`
          ),
          fetch(
            `/api/ppts?category=${encodeURIComponent(
              slug
            )}&status=published&page=${page}&pageSize=12&sortBy=${apiSortBy}&sortOrder=desc`
          ),
        ]);

        const [hotJson, newJson, allJson] = await Promise.all([
          hotRes.json(),
          newRes.json(),
          allRes.json(),
        ]);

        if (hotJson.success) {
          setHotPPTs(mapItems(hotJson.data.items ?? []));
          setFeaturedPPTs(mapItems(hotJson.data.items ?? [])); // 精选暂用热门
        }
        if (newJson.success) {
          setNewPPTs(mapItems(newJson.data.items ?? []));
        }
        if (allJson.success) {
          setAllPPTs(mapItems(allJson.data.items ?? []));
          const total = allJson.data.total ?? 0;
          setTotalCount(total);
          setTotalPages(Math.max(1, Math.ceil(total / 12)));
        }

        if (!hotJson.success && !newJson.success && !allJson.success) {
          toast.error('加载分类数据失败');
          setHasError(true);
        }
      } catch (error) {
        console.error(error);
        toast.error('加载分类数据失败');
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryPPTs();
  }, [slug, sortBy, page]);

  const handleDownload = (ppt: PPT) => {
    router.push(`/ppt/${ppt.id}`);
  };

  if (!categoryName) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">分类未找到</h1>
          <Button onClick={() => router.push(PublicRoutes.Categories)}>
            返回分类列表
          </Button>
        </div>
      </div>
    );
  }

  // 空状态：分类无数据时显示友好提示
  if (!isLoading && allPPTs.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-6">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground/50" />
            </div>
            <h1 className="text-2xl font-bold mb-4">该分类暂无内容</h1>
            <p className="text-muted-foreground mb-8">
              「{categoryName}」分类的模板正在准备中，敬请期待！
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => router.push(PublicRoutes.Home)}>
                <Home className="h-4 w-4 mr-2" />
                返回首页
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(PublicRoutes.Categories)}
              >
                浏览其他分类
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <link rel="canonical" href={`https://ppt-ai.com/ppt/category/${slug}`} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${categoryName}PPT模板`,
            description: metadata.description,
            url: `https://ppt-ai.com/category/${encodeURIComponent(categoryName)}`,
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: hotPPTs.slice(0, 5).map((ppt, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                  '@type': 'CreativeWork',
                  name: ppt.title,
                  description: `${categoryName}专业PPT模板`,
                  image: ppt.thumbnail,
                },
              })),
            },
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: '首页',
                  item: 'https://ppt-ai.com',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: '分类总览',
                  item: 'https://ppt-ai.com/categories',
                },
                { '@type': 'ListItem', position: 3, name: categoryName },
              ],
            },
          }),
        }}
      />

      <CategoryErrorBanner hasError={hasError} />

      <main className="container mx-auto px-4 py-8">
        <nav
          className="flex items-center gap-2 text-sm text-muted-foreground mb-8"
          aria-label="面包屑"
        >
          <a
            href={PublicRoutes.Home}
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Home className="h-4 w-4" />
            首页
          </a>
          <ChevronRight className="h-4 w-4" />
          <a
            href={PublicRoutes.Categories}
            className="hover:text-foreground transition-colors"
          >
            分类总览
          </a>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{categoryName}</span>
        </nav>

        <section className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="hidden md:flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg flex-shrink-0">
              <CategoryIcon className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold mb-3">
                {categoryName}PPT模板
              </h1>
              <p className="text-muted-foreground text-lg mb-6">
                {metadata.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {metadata.totalTemplates.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">模板总数</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {metadata.totalDownloads}
                    </p>
                    <p className="text-xs text-muted-foreground">次下载</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary fill-primary flex-shrink-0" />
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {metadata.avgRating}
                    </p>
                    <p className="text-xs text-muted-foreground">平均评分</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {metadata.avgPages}
                    </p>
                    <p className="text-xs text-muted-foreground">常用页数</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h3 className="text-lg font-semibold mb-4">常见使用场景</h3>
          <div className="flex flex-wrap gap-2">
            {metadata.useCases.map((tag, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-4 py-2 text-sm"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </section>

        {/* 广告位 - Hero 下方 */}
        <section className="mb-8">
          <BlogBannerAd />
        </section>

        <section className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Flame className="h-6 w-6 text-orange-500" />
                热门PPT
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                下载量最高的{categoryName}模板
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="self-start sm:self-auto bg-transparent"
            >
              查看全部 <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {(() => {
                const items = [...hotPPTs];
                // 在第 6 位插入原生广告
                if (items.length >= 5) {
                  items.splice(5, 0, null as any);
                }
                return items.map((ppt, index) => {
                  if (ppt === null) {
                    return (
                      <NativeAdCard
                        key="native-ad-hot"
                        ad={mockNativeAd}
                        position={`category_${slug}_hot_6`}
                        onImpression={(adId) =>
                          console.log('Native ad impression:', adId)
                        }
                        onClick={(adId) =>
                          console.log('Native ad click:', adId)
                        }
                      />
                    );
                  }
                  return (
                    <PPTCard
                      key={ppt.id}
                      ppt={ppt}
                      onDownload={handleDownload}
                    />
                  );
                });
              })()}
            </div>
          )}
        </section>

        <section className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-yellow-500" />
                精选PPT
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                编辑推荐的高质量模板
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="self-start sm:self-auto bg-transparent"
            >
              查看全部 <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {(() => {
                const items = [...featuredPPTs];
                // 在第 6 位插入原生广告
                if (items.length >= 5) {
                  items.splice(5, 0, null as any);
                }
                return items.map((ppt, index) => {
                  if (ppt === null) {
                    return (
                      <NativeAdCard
                        key="native-ad-featured"
                        ad={mockNativeAd}
                        position={`category_${slug}_featured_6`}
                        onImpression={(adId) =>
                          console.log('Native ad impression:', adId)
                        }
                        onClick={(adId) =>
                          console.log('Native ad click:', adId)
                        }
                      />
                    );
                  }
                  return (
                    <PPTCard
                      key={ppt.id}
                      ppt={ppt}
                      onDownload={handleDownload}
                    />
                  );
                });
              })()}
            </div>
          )}
        </section>

        {/* 全部PPT区块（原有功能保留） */}
        <section className="mb-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">全部{categoryName}PPT</h2>
              <p className="text-muted-foreground">
                共找到{' '}
                <span className="font-semibold text-foreground">
                  {totalCount}
                </span>{' '}
                个模板
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">最受欢迎</SelectItem>
                  <SelectItem value="newest">最新上传</SelectItem>
                  <SelectItem value="downloads">下载最多</SelectItem>
                  <SelectItem value="rating">评分最高</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {(() => {
                  const items = [...allPPTs];
                  // 在第 6 位插入原生广告
                  if (items.length >= 5) {
                    items.splice(5, 0, null as any);
                  }
                  return items.map((ppt, index) => {
                    if (ppt === null) {
                      return (
                        <NativeAdCard
                          key="native-ad-all"
                          ad={mockNativeAd}
                          position={`category_${slug}_all_6`}
                          onImpression={(adId) =>
                            console.log('Native ad impression:', adId)
                          }
                          onClick={(adId) =>
                            console.log('Native ad click:', adId)
                          }
                        />
                      );
                    }
                    return (
                      <PPTCard
                        key={ppt.id}
                        ppt={ppt}
                        onDownload={handleDownload}
                      />
                    );
                  });
                })()}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    上一页
                  </Button>

                  <div className="flex gap-1">
                    {(() => {
                      const pages: (number | string)[] = [];
                      const showPages = 5; // 最多显示5个页码

                      if (totalPages <= showPages + 2) {
                        // 总页数较少时，显示全部
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // 总页数较多时，智能显示
                        pages.push(1); // 始终显示第一页

                        let start = Math.max(2, page - 1);
                        let end = Math.min(totalPages - 1, page + 1);

                        // 确保显示足够的页码
                        if (page <= 3) {
                          end = Math.min(totalPages - 1, 4);
                        } else if (page >= totalPages - 2) {
                          start = Math.max(2, totalPages - 3);
                        }

                        if (start > 2) {
                          pages.push('...');
                        }

                        for (let i = start; i <= end; i++) {
                          pages.push(i);
                        }

                        if (end < totalPages - 1) {
                          pages.push('...');
                        }

                        pages.push(totalPages); // 始终显示最后一页
                      }

                      return pages.map((p, idx) => {
                        if (p === '...') {
                          return (
                            <span
                              key={`ellipsis-${idx}`}
                              className="px-2 text-muted-foreground"
                            >
                              ...
                            </span>
                          );
                        }
                        return (
                          <Button
                            key={p}
                            variant={page === p ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => setPage(p as number)}
                          >
                            {p}
                          </Button>
                        );
                      });
                    })()}
                  </div>

                  <Button
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    下一页
                  </Button>
                </div>
              )}
            </>
          )}
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">{categoryName}PPT常见问题</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>
                {categoryName}PPT一般包含哪些内容？
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground leading-relaxed">
                  典型的{categoryName}PPT通常包括：<strong>封面页</strong>、
                  <strong>目录页</strong>、<strong>公司介绍</strong>、
                  <strong>项目背景</strong>、<strong>数据分析</strong>、
                  <strong>解决方案</strong>、<strong>时间规划</strong>、
                  <strong>预算预估</strong>、<strong>总结展望</strong>
                  等模块。根据具体场景可以灵活调整内容结构，
                  关键是保持逻辑清晰、重点突出。
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>
                如何让{categoryName}PPT更专业？
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  提升PPT专业度的关键要素：
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>
                    <strong>统一配色</strong>：使用2-3个主色，避免颜色过多
                  </li>
                  <li>
                    <strong>图表可视化</strong>：数据用图表展示，清晰直观
                  </li>
                  <li>
                    <strong>版式简洁</strong>：每页内容不宜过多，留白得当
                  </li>
                  <li>
                    <strong>避免花哨动画</strong>：过多动画会分散注意力
                  </li>
                  <li>
                    <strong>字体统一</strong>：标题和正文使用一致的字体系统
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>
                {categoryName}PPT推荐页数是多少？
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground leading-relaxed">
                  根据汇报时长决定：<strong>15分钟汇报建议15-20页</strong>，
                  <strong>30分钟建议25-30页</strong>，
                  <strong>1小时可达40-50页</strong>。
                  关键是每页内容不宜过多，一般遵循"一页一个核心观点"的原则。
                  过多页数可能导致听众疲劳，过少则无法充分展示内容。
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>
                {categoryName}PPT推荐字体和配色？
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>
                    <strong>字体推荐</strong>：<br />
                    正文：微软雅黑、思源黑体、阿里巴巴普惠体
                    <br />
                    标题：方正兰亭黑、华文中宋、站酷高端黑
                  </p>
                  <p>
                    <strong>配色推荐</strong>：<br />
                    商务蓝系（#1E40AF + #3B82F6 + #93C5FD）
                    <br />
                    科技灰系（#1F2937 + #6B7280 + #D1D5DB）
                    <br />
                    商务绿系（#065F46 + #10B981 + #6EE7B7）
                  </p>
                  <p className="text-sm">
                    避免使用过于鲜艳的红色、黄色等刺激性颜色，保持专业稳重的视觉风格。
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>
                如何快速修改下载的{categoryName}模板？
              </AccordionTrigger>
              <AccordionContent>
                <ol className="list-decimal list-inside text-muted-foreground space-y-2 ml-4">
                  <li>
                    <strong>先通读模板</strong>，理解整体逻辑结构和设计思路
                  </li>
                  <li>
                    <strong>替换封面</strong>：修改标题、副标题和公司Logo
                  </li>
                  <li>
                    <strong>修改目录</strong>：对应章节名称调整为自己的内容
                  </li>
                  <li>
                    <strong>逐页替换</strong>：保持版式不变，只替换文字和图片
                  </li>
                  <li>
                    <strong>统一检查</strong>：字体、配色、数据准确性最后验证
                  </li>
                </ol>
                <p className="text-sm text-muted-foreground mt-2">
                  小技巧：使用"查找替换"功能批量修改公司名称、项目名称等重复出现的内容。
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>
                为什么要选择付费的{categoryName}PPT模板？
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  付费模板相比免费模板的优势：
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>
                    <strong>设计质量更高</strong>
                    ：专业设计师精心制作，版式更精美
                  </li>
                  <li>
                    <strong>可商用授权</strong>：避免版权风险，放心用于商业场景
                  </li>
                  <li>
                    <strong>独家内容</strong>：不易撞版，展现独特性和专业性
                  </li>
                  <li>
                    <strong>持续更新</strong>：获得最新设计趋势和功能优化
                  </li>
                  <li>
                    <strong>技术支持</strong>：遇到问题可获得客服协助
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  我们平台的付费模板仅需5积分，性价比极高，且首次下载免费。
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-6">相关分类推荐</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(categoryMetadata)
              .filter(([name]) => name !== categoryName)
              .slice(0, 4)
              .map(([name, meta]) => {
                const Icon = meta.icon;
                const categorySlug = nameToSlug[name] ?? name;
                return (
                  <Card
                    key={name}
                    className="cursor-pointer hover:shadow-md hover:border-primary transition-all"
                    onClick={() =>
                      router.push(PublicRoutes.Category(categorySlug))
                    }
                  >
                    <CardContent className="p-6 text-center">
                      <Icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                      <h4 className="font-semibold text-sm mb-1">{name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {meta.totalTemplates.toLocaleString()} 个模板
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </section>
      </main>
    </>
  );
}
