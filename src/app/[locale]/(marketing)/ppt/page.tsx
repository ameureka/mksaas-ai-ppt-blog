'use client';

import { BlogBannerAd, NativeAdCard, mockNativeAd } from '@/components/ads';
import { PPTCard } from '@/components/ppt/ppt-card';
import { SearchFilters } from '@/components/ppt/search-filters';
import { SearchSidebar } from '@/components/ppt/search-sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PublicRoutes } from '@/lib/constants/ppt-routes';
import {
  Briefcase,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  Presentation,
  Search,
  Target,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface PPT {
  id: string;
  title: string;
  tags?: string[];
  downloads: number;
  views: number;
  language?: string;
  previewUrl?: string;
  pages?: number;
  category: string;
  isAd?: boolean;
}

const hotKeywords: { text: string; size: 'large' | 'medium' | 'small' }[] = [
  { text: '年终总结', size: 'large' },
  { text: '工作汇报', size: 'medium' },
  { text: '项目提案', size: 'large' },
  { text: '述职报告', size: 'small' },
  { text: '商业计划', size: 'medium' },
  { text: '培训课件', size: 'small' },
  { text: '产品介绍', size: 'medium' },
  { text: '营销方案', size: 'small' },
];

function getErrorMessage(code: string, retryAfter?: number): string {
  const errorMap: Record<string, string> = {
    VALIDATION_FAILED: '输入格式有误，请检查后重试',
    RATE_LIMITED: retryAfter
      ? `请求过于频繁，请等待 ${retryAfter} 秒后重试`
      : '请求过于频繁，请稍后再试',
    FORBIDDEN: '需要登录才能继续',
    NOT_FOUND: '未找到相关内容，试试换个关键词',
    INTERNAL_ERROR: '服务器错误，请稍后重试',
  };
  return errorMap[code] || '未知错误，请稍后重试';
}

function useAuditLog() {
  const logAction = (action: string, metadata?: Record<string, any>) => {
    console.log('[Audit Log Placeholder]', {
      action,
      metadata,
      timestamp: new Date().toISOString(),
    });
  };

  return { logAction };
}

export default function SearchHomePage() {
  const t = useTranslations('PPTPage.categories');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PPT[]>([]);
  const [featuredPPTs, setFeaturedPPTs] = useState<PPT[]>([]);
  const [newPPTs, setNewPPTs] = useState<PPT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number>(0);
  const [filters, setFilters] = useState({
    category: 'all',
    language: 'all',
    sort: 'popular',
  });
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const router = useRouter(); // Add navigation hook for view more buttons

  const { logAction } = useAuditLog();

  // Categories using translations
  const categories = useMemo(
    () => [
      {
        name: t('business'),
        slug: 'business',
        count: 12345,
        icon: Briefcase,
        preview: '/ppt/business-presentation-template.png',
      },
      {
        name: t('education'),
        slug: 'education',
        count: 8234,
        icon: GraduationCap,
        preview: '/ppt/education-training-template.jpg',
      },
      {
        name: t('marketing'),
        slug: 'marketing',
        count: 6789,
        icon: TrendingUp,
        preview: '/ppt/product-marketing-template.jpg',
      },
      {
        name: t('general'),
        slug: 'general',
        count: 15678,
        icon: Calendar,
        preview: '/ppt/year-end-summary-template.jpg',
      },
      {
        name: t('creative'),
        slug: 'creative',
        count: 9456,
        icon: Target,
        preview: '/ppt/project-proposal-template.png',
      },
      {
        name: t('training'),
        slug: 'education',
        count: 7123,
        icon: FileText,
        preview: '/ppt/training-courseware-template.jpg',
      },
      {
        name: t('report'),
        slug: 'business',
        count: 11234,
        icon: Presentation,
        preview: '/ppt/job-report-template.jpg',
      },
      {
        name: t('plan'),
        slug: 'marketing',
        count: 5678,
        icon: Users,
        preview: '/ppt/marketing-plan-template.png',
      },
    ],
    [t]
  );

  const transform = (items: any[]): PPT[] =>
    items.map((item) => ({
      id: item.id,
      title: item.title,
      tags: item.tags ?? [],
      downloads: item.downloads ?? 0,
      views: item.views ?? 0,
      language: item.language ?? '中文',
      previewUrl: item.preview_url ?? '/placeholder.svg',
      pages: item.slides_count ?? 0,
      category: item.category ?? '其他',
    }));

  // Load initial data
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          '/api/ppts?page=1&pageSize=12&sortBy=created_at&sortOrder=desc'
        );
        const json = await res.json();
        if (json.success) {
          const items = transform(json.data.items ?? []);
          setFeaturedPPTs(items.slice(0, 8));
          setNewPPTs(items.slice(0, 12));
        }
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (retryAfter > 0) {
      const interval = setInterval(() => {
        setRetryAfter((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setError(null);
            toast.success('可以重新搜索了');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [retryAfter]);

  // Mock API call for search
  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      toast.error('请输入搜索关键词');
      return;
    }

    logAction('search', { query: searchQuery, filters });

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch(
        `/api/ppts?search=${encodeURIComponent(searchQuery)}`
      );
      const json = await res.json();
      if (json.success) {
        const items = transform(json.data.items ?? []);
        setResults(items);
        if (items.length === 0) {
          setError('NOT_FOUND');
        }
      } else {
        setError(json.code || 'INTERNAL_ERROR');
        toast.error(getErrorMessage(json.code));
      }
    } catch (err) {
      setError('INTERNAL_ERROR');
      toast.error(getErrorMessage('INTERNAL_ERROR'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeywordClick = (keyword: string) => {
    setQuery(keyword);
    handleSearch(keyword);
  };

  const handleCategoryClick = (categorySlug: string) => {
    logAction('category_click', { category: categorySlug });
    router.push(PublicRoutes.Category(categorySlug));
  };

  const handleDownload = (ppt: PPT) => {
    toast.success(`正在准备下载《${ppt.title}》...`, {
      description: '下载功能需要后端支持，当前为演示模式',
      duration: 3000,
    });
    logAction('download_attempt', { pptId: ppt.id, title: ppt.title });
  };

  const handleViewMore = (section: 'featured' | 'new') => {
    // Add handler for view more buttons
    logAction('view_more_click', { section });
    router.push(PublicRoutes.Categories);
  };

  const filteredResults = useMemo(() => {
    if (!hasSearched) return [];

    let filtered = [...results];

    // 按分类筛选
    if (filters.category !== 'all') {
      filtered = filtered.filter((ppt) => ppt.category === filters.category);
    }

    // 按语言筛选
    if (filters.language !== 'all') {
      filtered = filtered.filter((ppt) => ppt.language === filters.language);
    }

    // 排序
    if (filters.sort === 'popular') {
      filtered.sort((a, b) => b.views - a.views);
    } else if (filters.sort === 'newest') {
      filtered.sort((a, b) => b.id.localeCompare(a.id));
    } else if (filters.sort === 'downloads') {
      filtered.sort((a, b) => b.downloads - a.downloads);
    }

    return filtered;
  }, [results, filters, hasSearched]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'PPT-AI',
            url: 'https://ppt-ai.com',
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://ppt-ai.com/search?q={search_term_string}',
              },
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'PPT-AI',
            url: 'https://ppt-ai.com',
            logo: 'https://ppt-ai.com/logo.png',
            description: 'AI驱动的PPT模板搜索平台，提供100000+精选模板',
            sameAs: [
              'https://twitter.com/pptai',
              'https://www.facebook.com/pptai',
            ],
          }),
        }}
      />

      {/* Mobile search modal */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-background md:hidden">
          <div className="flex h-16 items-center gap-2 border-b px-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0"
              onClick={() => setMobileSearchOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <Input
              type="text"
              placeholder="搜索模板..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(query);
                  setMobileSearchOpen(false);
                }
              }}
              className="flex-1"
              autoFocus
            />
            <Button
              size="sm"
              onClick={() => {
                handleSearch(query);
                setMobileSearchOpen(false);
              }}
              disabled={isLoading || retryAfter > 0}
            >
              搜索
            </Button>
          </div>
          {/* Mobile hot keywords */}
          <div className="p-4">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              热门搜索
            </p>
            <div className="space-y-2">
              {hotKeywords.map((keyword, i) => (
                <button
                  key={i}
                  onClick={() => {
                    handleKeywordClick(keyword.text);
                    setMobileSearchOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors hover:bg-muted"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">
                    {i + 1}
                  </span>
                  <span>{keyword.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4 py-20 md:py-32">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight md:text-6xl">
            3秒找到你要的PPT模板
          </h1>
          <p className="mb-8 text-pretty text-lg text-muted-foreground md:text-xl">
            100000+精选模板，一句话搜索，立即下载
          </p>

          {/* Main search input */}
          <div className="mx-auto mb-8 max-w-2xl">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="试试：新能源路演"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                  className="h-14 rounded-full border-2 pl-12 pr-4 text-base focus-visible:border-primary"
                  disabled={retryAfter > 0}
                />
              </div>
              <Button
                size="lg"
                className="h-14 rounded-full px-6 md:px-8"
                onClick={() => handleSearch(query)}
                disabled={isLoading || retryAfter > 0}
              >
                {retryAfter > 0 ? `等待 ${retryAfter}s` : '搜索'}
              </Button>
            </div>
            {retryAfter > 0 && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-destructive">
                <Clock className="h-4 w-4 animate-pulse" />
                <span>请求过于频繁，请等待 {retryAfter} 秒后重试</span>
              </div>
            )}
          </div>

          {/* Hot keywords */}
          {/* Hot keywords increase touch target size */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm text-muted-foreground">热门搜索：</span>
            {hotKeywords.map((keyword, i) => (
              <button
                key={i}
                onClick={() => handleKeywordClick(keyword.text)}
                className={`inline-flex items-center rounded-full bg-secondary text-secondary-foreground px-4 py-2.5 sm:py-1.5 transition-colors hover:bg-secondary/80 ${
                  keyword.size === 'large'
                    ? 'text-base font-medium'
                    : keyword.size === 'medium'
                      ? 'text-sm'
                      : 'text-xs'
                }`}
              >
                {keyword.text}
              </button>
            ))}
          </div>
        </div>
      </section>

      {hasSearched && (
        <section className="container mx-auto mb-16 px-4">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Main content area */}
            <div className="flex-1">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">
                  {isLoading
                    ? '搜索中...'
                    : error === 'NOT_FOUND'
                      ? '未找到结果'
                      : `找到 ${filteredResults.length} 个模板`}
                </h2>

                {!error && (
                  <SearchFilters
                    filters={filters}
                    categories={categories}
                    onFiltersChange={setFilters}
                  />
                )}
              </div>

              {/* 搜索结果上方横幅广告 */}
              {!isLoading && !error && filteredResults.length > 0 && (
                <BlogBannerAd className="mb-8" />
              )}

              {isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <Skeleton className="h-40 sm:h-48 w-full" />
                      <CardContent className="p-4">
                        <Skeleton className="mb-2 h-5 w-3/4" />
                        <Skeleton className="mb-3 h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : error === 'NOT_FOUND' ? (
                <div className="py-16 text-center">
                  <p className="mb-2 text-lg text-muted-foreground">
                    未找到相关模板
                  </p>
                  <p className="text-sm text-muted-foreground">
                    尝试换个关键词
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {(() => {
                    const items = [...filteredResults];
                    // 在第 5 位和第 11 位插入原生广告
                    if (items.length >= 4) {
                      items.splice(4, 0, null as any);
                    }
                    if (items.length >= 11) {
                      items.splice(10, 0, null as any);
                    }
                    return items.map((ppt, index) => {
                      if (ppt === null) {
                        return (
                          <NativeAdCard
                            key={`native-ad-search-${index}`}
                            ad={mockNativeAd}
                            position={`search_results_${index}`}
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

              {/* Mobile sidebar content (accordion) */}
              {!error && (
                <div className="mt-8 space-y-6 lg:hidden">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="mb-3 font-semibold">热门搜索</h3>
                      <div className="space-y-2">
                        {hotKeywords.slice(0, 6).map((keyword, i) => (
                          <button
                            key={i}
                            onClick={() => handleKeywordClick(keyword.text)}
                            className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors hover:bg-muted"
                          >
                            <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">
                              {i + 1}
                            </span>
                            <span className="text-sm">{keyword.text}</span>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h3 className="mb-3 font-semibold">推荐分类</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.slice(0, 6).map((cat) => {
                          const Icon = cat.icon;
                          return (
                            <button
                              key={cat.name}
                              onClick={() => handleCategoryClick(cat.slug)}
                              className="flex flex-col items-center gap-2 rounded-md border p-3 transition-colors hover:bg-muted"
                            >
                              <Icon className="h-5 w-5 text-muted-foreground" />
                              <span className="text-xs font-medium">
                                {cat.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            <SearchSidebar
              hotKeywords={hotKeywords}
              categories={categories}
              recentDownloads={results.slice(0, 3)}
              onKeywordClick={handleKeywordClick}
              onCategoryClick={handleCategoryClick}
            />
          </div>
        </section>
      )}

      {/* Quick Category Navigation */}
      {!hasSearched && (
        <section className="container mx-auto mb-16 px-4">
          <h2 className="mb-8 text-center text-3xl font-bold">热门分类</h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.name}
                  className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:border-primary"
                  onClick={() => handleCategoryClick(category.slug)}
                >
                  <CardContent className="p-0">
                    <div className="relative h-40 overflow-hidden bg-muted">
                      <img
                        src={category.preview || '/placeholder.svg'}
                        alt={category.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">{category.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {category.count.toLocaleString()}个模板
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* 广告位 - 热门分类下方 */}
      {!hasSearched && (
        <section className="container mx-auto mb-8 px-4">
          <BlogBannerAd />
        </section>
      )}

      {/* Featured Templates */}
      {!hasSearched && (
        <section className="container mx-auto mb-16 px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold">编辑精选</h2>
            <Button variant="link" onClick={() => handleViewMore('featured')}>
              查看更多 →
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(() => {
              const items = [...featuredPPTs];
              // 在第 5 位插入原生广告
              if (items.length >= 4) {
                items.splice(4, 0, null as any);
              }
              return items.map((ppt, index) => {
                if (ppt === null) {
                  return (
                    <NativeAdCard
                      key="native-ad-featured"
                      ad={mockNativeAd}
                      position="home_featured_5"
                      onImpression={(adId) =>
                        console.log('Native ad impression:', adId)
                      }
                      onClick={(adId) => console.log('Native ad click:', adId)}
                    />
                  );
                }
                return (
                  <PPTCard key={ppt.id} ppt={ppt} onDownload={handleDownload} />
                );
              });
            })()}
          </div>
        </section>
      )}

      {/* New Templates */}
      {!hasSearched && (
        <section className="container mx-auto mb-16 px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold">本周新品</h2>
            <Button variant="link" onClick={() => handleViewMore('new')}>
              查看更多 →
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(() => {
              const items = [...newPPTs];
              // 在第 5 位插入原生广告
              if (items.length >= 4) {
                items.splice(4, 0, null as any);
              }
              return items.map((ppt, index) => {
                if (ppt === null) {
                  return (
                    <NativeAdCard
                      key="native-ad-new"
                      ad={mockNativeAd}
                      position="home_new_5"
                      onImpression={(adId) =>
                        console.log('Native ad impression:', adId)
                      }
                      onClick={(adId) => console.log('Native ad click:', adId)}
                    />
                  );
                }
                return (
                  <PPTCard key={ppt.id} ppt={ppt} onDownload={handleDownload} />
                );
              });
            })()}
          </div>
        </section>
      )}
    </>
  );
}
