'use client';

import {
  BlogBannerAd,
  MultiplexAd,
  NativeAdCard,
  mockNativeAd,
} from '@/components/ads';
import { LoginModal } from '@/components/ppt/auth/login-modal';
import { DownloadModal } from '@/components/ppt/download/download-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { websiteConfig } from '@/config/website';
import { authClient } from '@/lib/auth-client';
import {
  getCategoryLabel,
  getCategoryMeta,
} from '@/lib/constants/ppt-category-meta';
import { PublicRoutes } from '@/lib/constants/ppt-routes';
import { formatFileSize } from '@/lib/formatter';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Heart,
  Maximize2,
  Palette,
  Share2,
  Star,
  ThumbsUp,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PPTDetail {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  categoryLabel: string;
  subcategory: string;
  downloads: number;
  views: number;
  rating: number | null;
  reviewCount: number;
  language: string;
  pages: number;
  fileSize: string;
  format: string;
  aspectRatio: string;
  previewUrls: string[];
  author: string;
  uploadedAt: string;
  updatedAt: string;
  isFeatured: boolean;
  isFirstDownloadFree: boolean;
  price: number;
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  verified: boolean;
  helpful: number;
  createdAt: string;
}

export default function PPTDetailPage() {
  const DEFAULT_USE_CASES = ['工作汇报', '项目总结', '方案提案', '年度计划'];
  const DEFAULT_FEATURES = [
    '全矢量可编辑',
    '统一配色与字体',
    '含基础图表占位符',
    '16:9 标准比例',
  ];

  const params = useParams();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const [ppt, setPpt] = useState<PPTDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recommendations, setRecommendations] = useState<PPTDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [isAllReviewsModalOpen, setIsAllReviewsModalOpen] = useState(false);

  const [helpfulReviews, setHelpfulReviews] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/ppts/${params.id}`);
        const json = await res.json();
        if (json.success) {
          const data = json.data;
          const category = data.category ?? 'general';
          const categoryMeta = getCategoryMeta(category);
          const previewUrls =
            data.preview_urls ??
            (data.preview_url ? [data.preview_url] : ['/placeholder.svg']);
          const totalSlides = Math.max(
            1,
            data.slides_count ?? 0,
            previewUrls.length
          );
          const detail: PPTDetail = {
            id: data.id,
            title: data.title,
            description:
              data.description?.trim() ||
              categoryMeta.description ||
              '暂无简介',
            tags: data.tags ?? [],
            category,
            categoryLabel: getCategoryLabel(category),
            subcategory: category,
            downloads: data.downloads ?? 0,
            views: data.views ?? 0,
            rating: null,
            reviewCount: 0,
            language: data.language ?? '中文',
            pages: totalSlides,
            fileSize: formatFileSize(data.file_size ?? 0),
            format: 'PPTX',
            aspectRatio: '16:9',
            previewUrls,
            author: data.author || '未知',
            uploadedAt: data.created_at || '',
            updatedAt: data.updated_at || '',
            isFeatured: false,
            isFirstDownloadFree: true,
            price: data.price ?? 5,
          };
          setPpt(detail);
          setReviews([]);

          // 记录浏览量 (静默处理错误)
          fetch(`/api/ppts/${params.id}/view`, { method: 'POST' }).catch(
            () => {}
          );

          // 获取推荐模板
          try {
            const recRes = await fetch(
              `/api/ppts?category=${encodeURIComponent(category)}&status=published&pageSize=4&sortBy=downloads&sortOrder=desc`
            );
            const recJson = await recRes.json();
            if (recJson.success && recJson.data.items) {
              // 排除当前 PPT
              const recs = recJson.data.items
                .filter((item: any) => item.id !== data.id)
                .slice(0, 4)
                .map((item: any) => ({
                  id: item.id,
                  title: item.title,
                  description: item.description || '暂无简介',
                  tags: item.tags ?? [],
                  category: item.category ?? 'general',
                  categoryLabel: getCategoryLabel(item.category ?? 'general'),
                  subcategory: item.category ?? 'general',
                  downloads: item.downloads ?? 0,
                  views: item.views ?? 0,
                  rating: null,
                  reviewCount: 0,
                  language: item.language ?? '中文',
                  pages: item.slides_count ?? 0,
                  fileSize: formatFileSize(item.file_size ?? 0),
                  format: 'PPTX',
                  aspectRatio: '16:9',
                  previewUrls: [item.preview_url || '/placeholder.svg'],
                  author: item.author || '未知',
                  uploadedAt: item.created_at || '',
                  updatedAt: item.updated_at || '',
                  isFeatured: false,
                  isFirstDownloadFree: true,
                  price: item.price ?? 5,
                }));
              setRecommendations(recs);
            } else {
              setRecommendations([]);
            }
          } catch (error) {
            console.error('Failed to fetch recommendations', error);
            setRecommendations([]);
          }
        } else {
          setPpt(null);
          toast.error('未找到该模板');
        }
      } catch (error) {
        console.error(error);
        setPpt(null);
        toast.error('加载失败');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingButton(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDownload = () => {
    if (websiteConfig.features.pptRequireLoginForDownload && !user) {
      setIsLoginModalOpen(true);
      toast.info('请先登录后下载');
      return;
    }
    setIsDownloadModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!user) {
      setIsLoginModalOpen(true);
      toast.info('请先登录后评价');
      return;
    }

    if (reviewComment.trim().length < 20) {
      toast.error('评论内容至少需要20个字');
      return;
    }

    setIsSubmittingReview(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newReview: Review = {
        id: `rev_${Date.now()}`,
        userId: user?.id || 'current_user',
        userName: user?.name || '当前用户',
        userAvatar: user?.image || '/ppt/diverse-user-avatars.png',
        rating: reviewRating,
        comment: reviewComment,
        verified: false,
        helpful: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };

      setReviews([newReview, ...reviews]);
      setIsReviewModalOpen(false);
      setReviewComment('');
      setReviewRating(5);

      toast.success('评价提交成功', {
        description: '您获得了 0.5 积分奖励',
      });
    } catch (error) {
      toast.error('提交失败，请稍后重试');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleMarkHelpful = (reviewId: string) => {
    if (helpfulReviews.has(reviewId)) {
      toast.info('您已经标记过有用了');
      return;
    }

    setHelpfulReviews(new Set(helpfulReviews).add(reviewId));
    setReviews(
      reviews.map((r) =>
        r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r
      )
    );
    toast.success('感谢您的反馈');
  };

  if (isLoading) {
    return (
      <div className="border-b">
        <div className="container mx-auto px-4">
          <Skeleton className="h-10 w-full max-w-xs my-3" />
        </div>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <Skeleton className="mb-4 h-[500px] w-full rounded-xl" />
              <Skeleton className="mb-2 h-8 w-3/4" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-[600px] w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ppt) return null;

  const categoryMeta = getCategoryMeta(ppt.category);
  const useCases =
    categoryMeta.useCases && categoryMeta.useCases.length > 0
      ? categoryMeta.useCases
      : DEFAULT_USE_CASES;
  const features =
    (categoryMeta as { features?: string[] }).features &&
    (categoryMeta as { features?: string[] }).features?.length
      ? (categoryMeta as { features?: string[] }).features!
      : DEFAULT_FEATURES;
  const totalSlides = Math.max(1, ppt.pages, ppt.previewUrls.length);
  const currentPreviewUrl =
    ppt.previewUrls.length > 0
      ? ppt.previewUrls[currentSlide % ppt.previewUrls.length]
      : '/placeholder.svg';
  const ratingText = ppt.rating !== null ? ppt.rating.toFixed(1) : '暂无评分';
  const ratingValue = ppt.rating !== null ? ppt.rating : 0;

  return (
    <>
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <div className="flex items-center gap-3">
            {/* 返回按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2 hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">返回</span>
            </Button>

            {/* 分隔线 */}
            <div className="h-5 w-px bg-border" />

            {/* 面包屑导航 */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto">
              <button
                type="button"
                onClick={() => router.push(PublicRoutes.Home)}
                className="hover:text-foreground transition-colors whitespace-nowrap"
              >
                首页
              </button>
              <span>/</span>
              <button
                type="button"
                onClick={() => router.push(PublicRoutes.Category(ppt.category))}
                className="hover:text-foreground transition-colors whitespace-nowrap"
              >
                {ppt.categoryLabel}
              </button>
              <span className="hidden sm:inline">/</span>
              <span className="text-foreground font-medium truncate max-w-[150px] sm:max-w-md hidden sm:inline">
                {ppt.title}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero 区域 */}
      <div className="container mx-auto px-4 py-4 md:py-8 max-w-7xl overflow-hidden">
        <div className="grid gap-6 md:gap-8 lg:grid-cols-5">
          {/* 左侧 - 预览区域 */}
          <div className="lg:col-span-3 space-y-6 min-w-0">
            {/* 主预览图 */}
            <div className="relative aspect-video rounded-xl border bg-muted overflow-hidden group w-full">
              <img
                src={currentPreviewUrl || '/placeholder.svg'}
                alt={`${ppt.title} - 第${(currentSlide % totalSlides) + 1}页`}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

              {/* 左右切换按钮 */}
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() =>
                  setCurrentSlide(Math.min(totalSlides - 1, currentSlide + 1))
                }
                disabled={currentSlide === totalSlides - 1}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>

              {/* 页码指示 */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                {(currentSlide % totalSlides) + 1} / {totalSlides}
              </div>

              {/* 全屏预览按钮 */}
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4 gap-2"
                onClick={() => setIsPreviewModalOpen(true)}
              >
                <Maximize2 className="h-4 w-4" />
                全屏预览
              </Button>
            </div>

            {/* 缩略图导航 */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {ppt.previewUrls.slice(0, 12).map((url, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`flex-shrink-0 w-20 h-14 rounded border-2 overflow-hidden transition-all ${
                    currentSlide === i
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <img
                    src={url || '/placeholder.svg'}
                    alt={`第${i + 1}页`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              {ppt.pages > 12 && (
                <div className="flex-shrink-0 w-20 h-14 rounded border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                  +{ppt.pages - 12}页
                </div>
              )}
            </div>

            {/* 模板详情 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl">
                  <FileText className="h-5 w-5" />
                  模板描述
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
                  {ppt.description || categoryMeta.description || '暂无简介'}
                </p>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm lg:text-base">
                    <Palette className="h-4 w-4" />
                    适用场景
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {useCases.map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3 text-sm lg:text-base">
                    包含内容
                  </h3>
                  <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>• 结构化章节（封面/目录/正文/总结）</div>
                    <div>• 约 {totalSlides} 页，可自由增删</div>
                    <div>• 图表与占位符，便于快速替换</div>
                    <div>• 统一样式与配色，保证版面一致</div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3 text-sm lg:text-base">
                    模板特色
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {features.map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  {ppt.tags.map((tag, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧 - 下载卡片 */}
          <div className="lg:col-span-2">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-xl lg:text-2xl">
                  {ppt.title}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${ppt.rating !== null && i < Math.round(ratingValue) ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                        />
                      ))}
                    <span className="ml-1 font-medium text-foreground">
                      {ratingText}
                    </span>
                    <span>({ppt.reviewCount}条评价)</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 统计信息 */}
                <div className="grid grid-cols-3 gap-4 py-4 border-y">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {(ppt.downloads / 1000).toFixed(1)}k
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      下载量
                    </div>
                  </div>
                  <div className="text-center border-x">
                    <div className="text-2xl font-bold">{ppt.pages}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      页数
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{ppt.fileSize}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      大小
                    </div>
                  </div>
                </div>

                {/* 详细信息 */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">格式</span>
                    <span className="font-medium">{ppt.format}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">比例</span>
                    <span className="font-medium">{ppt.aspectRatio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">语言</span>
                    <span className="font-medium">{ppt.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">更新时间</span>
                    <span className="font-medium">{ppt.updatedAt}</span>
                  </div>
                </div>

                <Separator />

                {/* 下载方式 */}
                <div className="space-y-3">
                  <h3 className="font-semibold">下载方式</h3>

                  {ppt.isFirstDownloadFree && (
                    <Card className="border-2 border-primary/20 bg-primary/5">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2 text-primary font-medium">
                          <div className="bg-primary/10 p-1.5 rounded">🎁</div>
                          <span>首次下载免费</span>
                        </div>
                        <Button
                          className="w-full"
                          size="lg"
                          onClick={handleDownload}
                        >
                          <Download className="mr-2 h-5 w-5" />
                          免费下载
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  <div className="text-center text-sm text-muted-foreground">
                    或
                  </div>

                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2 font-medium">
                        <div className="bg-primary/10 p-1.5 rounded text-primary">
                          💎
                        </div>
                        <span>使用 {ppt.price} 积分下载</span>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        size="lg"
                        onClick={handleDownload}
                      >
                        使用积分下载
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* 下载保障 */}
                <div className="space-y-2 text-sm">
                  <h3 className="font-semibold">下载保障</h3>
                  <ul className="space-y-1.5 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      <span>48小时有效下载链接</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      <span>支持PPT/PPTX格式</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      <span>可重复下载</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      <span>免费技术支持</span>
                    </li>
                  </ul>
                </div>

                <Separator />

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => toast.success('已添加到收藏')}
                  >
                    <Heart className="mr-1 h-4 w-4" />
                    收藏
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => toast.success('链接已复制')}
                  >
                    <Share2 className="mr-1 h-4 w-4" />
                    分享
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 广告位 - 评价区域上方 */}
        <BlogBannerAd className="my-12" />

        {/* 用户评价区域 */}
        <Card className="my-12">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                <Users className="h-5 w-5" />
                用户评价 ({ppt.reviewCount}条)
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReviewModalOpen(true)}
              >
                写评价 <span className="ml-1 text-primary">+0.5积分</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.map((review) => (
              <Card
                key={review.id}
                className="border-none shadow-none bg-muted/30"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={review.userAvatar || '/placeholder.svg'}
                        />
                        <AvatarFallback>{review.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {review.userName}
                          {review.verified && (
                            <Badge variant="secondary" className="text-xs">
                              已验证下载
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {review.createdAt}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                          />
                        ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 gap-1 ${helpfulReviews.has(review.id) ? 'text-primary' : ''}`}
                      onClick={() => handleMarkHelpful(review.id)}
                    >
                      <ThumbsUp
                        className={`h-3 w-3 ${helpfulReviews.has(review.id) ? 'fill-current' : ''}`}
                      />
                      有用 ({review.helpful})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => setIsAllReviewsModalOpen(true)}
            >
              查看全部 {ppt.reviewCount} 条评价
            </Button>
          </CardContent>
        </Card>

        {/* 推荐模板 */}
        {recommendations.length > 0 && (
          <>
            <Card className="my-12">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  推荐模板
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(() => {
                    const items = [...recommendations.slice(0, 6)];
                    // 在第 4 位插入原生广告
                    if (items.length >= 3) {
                      items.splice(3, 0, null as any);
                    }
                    return items.map((rec, index) => {
                      if (rec === null) {
                        return (
                          <NativeAdCard
                            key="native-ad-recommended"
                            ad={mockNativeAd}
                            position="detail_recommended_4"
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
                        <Card
                          key={rec.id}
                          className="group cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() =>
                            router.push(PublicRoutes.PPTDetail(rec.id))
                          }
                        >
                          <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                            <img
                              src={rec.previewUrls[0] || '/placeholder.svg'}
                              alt={rec.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <CardContent className="p-3">
                            <h4 className="font-medium line-clamp-2 text-sm mb-1">
                              {rec.title}
                            </h4>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Download className="h-3 w-3" />
                                <span>
                                  {(rec.downloads / 1000).toFixed(1)}k
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>
                                  {rec.rating !== null
                                    ? rec.rating.toFixed(1)
                                    : '暂无'}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    });
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* 广告位 - 推荐模板下方 */}
            <MultiplexAd className="my-8" />

            {/* 相关推荐区域 */}
            <div className="my-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6" />
                  相关推荐
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    router.push(PublicRoutes.Category(ppt.category))
                  }
                >
                  <span className="hidden sm:inline">查看更多</span>
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {recommendations.slice(0, 7).map((rec, i) => (
                  <Card
                    key={rec.id}
                    className="group cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push(PublicRoutes.PPTDetail(rec.id))}
                  >
                    <CardContent className="p-0">
                      <div className="aspect-[4/3] overflow-hidden rounded-t-lg bg-muted">
                        <img
                          src={rec.previewUrls[0] || '/placeholder.svg'}
                          alt={rec.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-4 space-y-2">
                        <h3 className="font-medium line-clamp-2 text-sm">
                          {rec.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>
                              {rec.rating !== null
                                ? rec.rating.toFixed(1)
                                : '暂无'}
                            </span>
                          </div>
                          <span>•</span>
                          <span>{(rec.downloads / 1000).toFixed(1)}k下载</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {/* 原生广告 */}
                <NativeAdCard
                  ad={mockNativeAd}
                  position="detail_related_8"
                  onImpression={(adId) =>
                    console.log('Native ad impression:', adId)
                  }
                  onClick={(adId) => console.log('Native ad click:', adId)}
                />
              </div>
            </div>
          </>
        )}

        {/* 底部广告位 */}
        <BlogBannerAd className="my-12" />
      </div>

      {/* 悬浮下载按钮 */}
      {showFloatingButton && (
        <div className="fixed bottom-4 right-4 lg:bottom-8 lg:right-8 z-50 animate-in slide-in-from-bottom-4">
          <Card className="shadow-2xl border-2">
            <CardContent className="p-3 lg:p-4 space-y-2">
              <div className="text-xs lg:text-sm font-medium text-center">
                快速下载
              </div>
              <Button className="w-full" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                {ppt.isFirstDownloadFree ? '免费下载' : '下载'}
              </Button>
              <div className="text-xs text-center text-muted-foreground">
                或使用{ppt.price}积分
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 全屏预览 Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] lg:max-w-7xl h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-base lg:text-lg">
              {ppt.title} - 完整预览
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 relative">
            <img
              src={ppt.previewUrls[currentSlide] || '/placeholder.svg'}
              alt={`第${currentSlide + 1}页`}
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 lg:px-4 py-2 rounded-full flex items-center gap-2 lg:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                disabled={currentSlide === 0}
                className="text-white hover:text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4 lg:h-5 lg:w-5" />
              </Button>
              <span className="text-xs lg:text-sm">
                {currentSlide + 1} / {ppt.pages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setCurrentSlide(Math.min(ppt.pages - 1, currentSlide + 1))
                }
                disabled={currentSlide === ppt.pages - 1}
                className="text-white hover:text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review submission modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base lg:text-lg">写评价</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">评分</label>
              <div className="flex gap-2">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setReviewRating(i + 1)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-7 w-7 lg:h-8 lg:w-8 ${i < reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                      />
                    </button>
                  ))}
                <span className="ml-2 text-xs lg:text-sm text-muted-foreground self-center">
                  {reviewRating === 5
                    ? '非常满意'
                    : reviewRating === 4
                      ? '满意'
                      : reviewRating === 3
                        ? '一般'
                        : reviewRating === 2
                          ? '不满意'
                          : '非常不满意'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                评论内容{' '}
                <span className="text-muted-foreground font-normal">
                  (至少20字)
                </span>
              </label>
              <Textarea
                placeholder="分享您使用这个模板的体验..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="min-h-[120px] text-sm lg:text-base"
              />
              <div className="mt-1 text-xs text-muted-foreground text-right">
                {reviewComment.length}/20
              </div>
            </div>

            <div className="rounded-lg bg-primary/5 p-3 text-sm">
              <div className="flex items-center gap-2 text-primary font-medium mb-1">
                💎 评价奖励
              </div>
              <p className="text-muted-foreground text-xs">
                提交评价即可获得{' '}
                <span className="font-medium text-foreground">0.5 积分</span>{' '}
                奖励
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsReviewModalOpen(false)}
              disabled={isSubmittingReview}
              className="w-full sm:w-auto"
            >
              取消
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={isSubmittingReview || reviewComment.trim().length < 20}
              className="w-full sm:w-auto"
            >
              {isSubmittingReview ? '提交中...' : '提交评价'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* All reviews modal */}
      <Dialog
        open={isAllReviewsModalOpen}
        onOpenChange={setIsAllReviewsModalOpen}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-3xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base lg:text-lg">
              全部评价 ({ppt.reviewCount}条)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {reviews.map((review) => (
              <Card
                key={review.id}
                className="border-none shadow-none bg-muted/30"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={review.userAvatar || '/placeholder.svg'}
                        />
                        <AvatarFallback>{review.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {review.userName}
                          {review.verified && (
                            <Badge variant="secondary" className="text-xs">
                              已验证下载
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {review.createdAt}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                          />
                        ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 gap-1 ${helpfulReviews.has(review.id) ? 'text-primary' : ''}`}
                      onClick={() => handleMarkHelpful(review.id)}
                    >
                      <ThumbsUp
                        className={`h-3 w-3 ${helpfulReviews.has(review.id) ? 'fill-current' : ''}`}
                      />
                      有用 ({review.helpful})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* LoginModal for authentication */}
      <LoginModal
        open={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
        onLoginSuccess={() => {
          toast.success('登录成功，现在可以下载了');
        }}
      />

      {/* DownloadModal */}
      <DownloadModal
        open={isDownloadModalOpen}
        onOpenChange={setIsDownloadModalOpen}
        ppt={ppt}
      />
    </>
  );
}
