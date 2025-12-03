'use client';

import { BlogBannerAd, NativeAdCard, mockNativeAd } from '@/components/ads';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PublicRoutes } from '@/lib/constants/ppt-routes';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  ChevronRight,
  FileText,
  GraduationCap,
  Home,
  Presentation,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const allCategories = [
  {
    name: '商务汇报',
    count: 12345,
    icon: Briefcase,
    preview: '/ppt/business-presentation.png',
    description: '专业的商务汇报模板，助力工作展示',
    useCases: ['企业年度总结', '季度业绩展示', '部门工作汇报', '客户提案演示'],
    avgPages: '20-30页',
    style: '简约专业',
    difficulty: '中等',
  },
  {
    name: '教育培训',
    count: 8234,
    icon: GraduationCap,
    preview: '/ppt/education-training.png',
    description: '丰富的教育培训课件，提升教学质量',
    useCases: ['课程讲解', '知识分享', '培训教材', '学术答辩'],
    avgPages: '15-25页',
    style: '清新活泼',
    difficulty: '简单',
  },
  {
    name: '产品营销',
    count: 6789,
    icon: TrendingUp,
    preview: '/ppt/product-marketing.jpg',
    description: '精美的营销模板，助力产品推广',
    useCases: ['新品发布', '营销方案', '品牌宣传', '产品介绍'],
    avgPages: '15-20页',
    style: '时尚创意',
    difficulty: '中等',
  },
  {
    name: '年终总结',
    count: 15678,
    icon: Calendar,
    preview: '/ppt/year-end-summary.jpg',
    description: '年终总结必备，展现工作成果',
    useCases: ['年度工作总结', '个人述职', '部门总结', '项目回顾'],
    avgPages: '25-40页',
    style: '正式庄重',
    difficulty: '复杂',
  },
  {
    name: '项目提案',
    count: 9456,
    icon: Target,
    preview: '/ppt/project-proposal.png',
    description: '专业的项目提案模板，提升通过率',
    useCases: ['商业计划', '项目申报', '投资路演', '创业提案'],
    avgPages: '20-30页',
    style: '数据可视化',
    difficulty: '复杂',
  },
  {
    name: '培训课件',
    count: 7123,
    icon: FileText,
    preview: '/ppt/training-courseware.jpg',
    description: '系统的培训课件，知识传递更高效',
    useCases: ['员工培训', '技能提升', '入职引导', '安全培训'],
    avgPages: '30-50页',
    style: '实用简洁',
    difficulty: '中等',
  },
  {
    name: '述职报告',
    count: 11234,
    icon: Presentation,
    preview: '/ppt/job-report.jpg',
    description: '述职报告专用，展现个人价值',
    useCases: ['晋升述职', '转正汇报', '年度述职', '工作总结'],
    avgPages: '15-25页',
    style: '专业稳重',
    difficulty: '中等',
  },
  {
    name: '营销方案',
    count: 5678,
    icon: Users,
    preview: '/ppt/marketing-plan.png',
    description: '创意营销方案，打动客户',
    useCases: ['活动策划', '推广方案', '市场分析', '渠道策略'],
    avgPages: '20-30页',
    style: '创意丰富',
    difficulty: '中等',
  },
];

export default function CategoriesPage() {
  const router = useRouter();

  const handleCategoryClick = (categoryName: string) => {
    console.log('[PPT] Navigating to category:', categoryName);
    router.push(PublicRoutes.Category(categoryName));
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'PPT模板分类总览',
            description:
              '浏览所有PPT模板分类，包括商务汇报、教育培训、产品营销等8大类别，超过70000+精选模板',
            url: 'https://ppt-ai.com/categories',
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: '首页',
                  item: 'https://ppt-ai.com',
                },
                { '@type': 'ListItem', position: 2, name: '分类总览' },
              ],
            },
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: allCategories.length,
              itemListElement: allCategories.map((cat, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                item: {
                  '@type': 'CreativeWork',
                  name: cat.name,
                  description: cat.description,
                  url: `https://ppt-ai.com/category/${encodeURIComponent(cat.name)}`,
                },
              })),
            },
          }),
        }}
      />

      <main className="container mx-auto px-4 py-8">
        <nav
          className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
          aria-label="面包屑"
        >
          <a
            href={PublicRoutes.Home}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            首页
          </a>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">全部分类</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-balance">
            全部分类
          </h1>
          <p className="text-muted-foreground text-pretty">
            浏览所有分类，找到适合你的PPT模板。超过70000+精选模板，涵盖商务、教育、营销等多个领域
          </p>
        </div>

        {/* 广告位 - 页面顶部 */}
        <section className="my-8">
          <BlogBannerAd />
        </section>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allCategories.map((category, index) => {
            const Icon = category.icon;

            if (index === 4) {
              return [
                <NativeAdCard
                  key="native-ad-categories"
                  ad={mockNativeAd}
                  position="categories_grid_5"
                  onImpression={(adId) =>
                    console.log('Native ad impression:', adId)
                  }
                  onClick={(adId) => console.log('Native ad click:', adId)}
                />,

                <Card
                  key={category.name}
                  className="group cursor-pointer overflow-hidden transition-all hover:shadow-xl hover:border-primary hover:-translate-y-1"
                  onClick={() => handleCategoryClick(category.name)}
                >
                  <CardContent className="p-0">
                    <div className="relative h-48 overflow-hidden bg-muted">
                      <img
                        src={category.preview || '/placeholder.svg'}
                        alt={category.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                      <div className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {category.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {category.count.toLocaleString()} 个模板
                      </p>
                    </div>
                  </CardContent>
                </Card>,
              ];
            }

            return (
              <Card
                key={category.name}
                className="group cursor-pointer overflow-hidden transition-all hover:shadow-xl hover:border-primary hover:-translate-y-1"
                onClick={() => handleCategoryClick(category.name)}
              >
                <CardContent className="p-0">
                  <div className="relative h-48 overflow-hidden bg-muted">
                    <img
                      src={category.preview || '/placeholder.svg'}
                      alt={category.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    <div className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {category.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {category.count.toLocaleString()} 个模板
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 lg:hidden">
          <h3 className="text-lg font-semibold mb-4">快速导航</h3>
          <div className="space-y-2">
            {allCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={`mobile-${category.name}`}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleCategoryClick(category.name)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <img
                      src={category.preview || '/placeholder.svg'}
                      alt={category.name}
                      className="w-16 h-16 rounded object-cover"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                        <h4 className="font-semibold text-sm truncate">
                          {category.name}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {category.count.toLocaleString()} 个模板
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">常见问题</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left">
                如何选择合适的PPT分类？
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                根据您的使用场景选择：<strong>商务汇报</strong>
                适合企业内部工作展示和客户提案；<strong>教育培训</strong>
                适合课程讲解和知识分享；<strong>产品营销</strong>
                适合新品发布和品牌宣传；<strong>年终总结</strong>
                适合年度工作回顾；<strong>项目提案</strong>
                适合商业计划和投资路演；<strong>培训课件</strong>
                适合系统化的技能培训；<strong>述职报告</strong>
                适合个人工作总结和晋升汇报；<strong>营销方案</strong>
                适合市场活动策划。
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                每个分类大概有多少页PPT？
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                不同分类的页数差异较大：<strong>商务汇报</strong>和
                <strong>项目提案</strong>通常为20-30页，
                <strong>年终总结</strong>较长为25-40页，
                <strong>培训课件</strong>最详细可达30-50页，
                <strong>教育培训</strong>和<strong>述职报告</strong>
                相对精简为15-25页，<strong>产品营销</strong>和
                <strong>营销方案</strong>
                通常为15-20页。您可以根据实际需求选择合适页数的模板。
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                不同分类的设计风格有什么区别？
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                每个分类都有其独特的设计风格：<strong>商务汇报</strong>和
                <strong>述职报告</strong>
                偏向简约专业、稳重大气；<strong>教育培训</strong>
                多采用清新活泼、色彩丰富的风格；
                <strong>产品营销</strong>和<strong>营销方案</strong>
                追求时尚创意、视觉冲击力；<strong>年终总结</strong>
                通常是正式庄重、数据导向；<strong>项目提案</strong>
                注重数据可视化和逻辑清晰；<strong>培训课件</strong>
                则以实用简洁、易于理解为主。
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                哪些分类适合初学者使用？
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                推荐初学者从<strong>教育培训</strong>
                类模板开始，结构简单、内容清晰；<strong>产品营销</strong>和
                <strong>述职报告</strong>
                类模板也相对容易上手，页数适中且逻辑明确；
                <strong>培训课件</strong>
                虽然页数较多但结构化程度高，也适合新手。而
                <strong>年终总结</strong>和<strong>项目提案</strong>
                类模板通常需要较多数据整理和逻辑梳理，建议有一定经验后再使用。
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">
                可以在一个PPT中混用多个分类的模板吗？
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                可以，但需要注意保持整体风格的一致性。建议先选择一个主分类作为PPT的基调，然后从其他分类中借鉴特定页面。例如，在
                <strong>商务汇报</strong>中可以引入<strong>产品营销</strong>
                类模板的创意页面；在
                <strong>年终总结</strong>中可以使用<strong>项目提案</strong>
                类模板的数据可视化图表。混用时务必统一配色方案和字体风格，避免视觉混乱。
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left">
                如何快速找到我需要的模板？
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                有三种方法：<strong>1. 分类浏览</strong> -
                直接点击对应分类查看所有模板；<strong>2. 关键词搜索</strong> -
                在首页搜索框输入关键词如"年终总结"、"项目提案"等；
                <strong>3. 筛选排序</strong> -
                在分类页面使用筛选功能，按下载量、评分、语言等条件筛选。推荐先通过分类缩小范围，再使用搜索和筛选精准定位。
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* 广告位 - 底部 */}
        <section className="my-12">
          <BlogBannerAd />
        </section>

        {/* CTA Section */}
        <div className="mt-16 text-center py-12 border-t">
          <h2 className="text-2xl font-bold mb-4">找不到想要的分类？</h2>
          <p className="text-muted-foreground mb-6 text-pretty">
            使用搜索功能，快速找到你需要的PPT模板。支持关键词搜索、高级筛选等功能
          </p>
          <Button size="lg" onClick={() => router.push(PublicRoutes.Home)}>
            返回首页搜索
          </Button>
        </div>
      </main>
    </>
  );
}
