'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface NativeAdData {
  id: string;
  imageUrl: string;
  headline: string;
  description: string;
  advertiser: string;
  logoUrl?: string;
  clickUrl: string;
  callToAction: string;
}

interface NativeAdCardProps {
  ad: NativeAdData;
  position?: number;
  className?: string;
  onImpression?: (adId: string) => void;
  onClick?: (adId: string) => void;
}

export function NativeAdCard({
  ad,
  position,
  className,
  onImpression,
  onClick,
}: NativeAdCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  // 展示追踪 - Intersection Observer
  useEffect(() => {
    if (!cardRef.current || hasTrackedImpression) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // 50% 可见时触发展示追踪
            onImpression?.(ad.id);
            setHasTrackedImpression(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, [ad.id, hasTrackedImpression, onImpression]);

  const handleClick = () => {
    onClick?.(ad.id);
    window.open(ad.clickUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card
      ref={cardRef}
      className={cn(
        'group overflow-hidden cursor-pointer transition-all duration-300',
        'hover:shadow-lg hover:scale-[1.02] hover:border-primary',
        className
      )}
      onClick={handleClick}
    >
      {/* 图片区域 */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={ad.imageUrl || '/placeholder.svg'}
          alt={ad.headline}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* 广告标识 */}
        <Badge
          variant="secondary"
          className="absolute left-2 top-2 bg-black/60 text-white text-xs"
        >
          广告
        </Badge>
      </div>

      {/* 内容区域 */}
      <CardContent className="p-4">
        <h3 className="font-medium line-clamp-2 text-base leading-tight">
          {ad.headline}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 truncate">
          {ad.description}
        </p>
      </CardContent>

      {/* 底部区域 */}
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {ad.logoUrl && (
            <img
              src={ad.logoUrl || '/placeholder.svg'}
              alt={ad.advertiser}
              className="h-5 w-5 rounded object-contain"
            />
          )}
          <span className="text-xs text-muted-foreground truncate">
            {ad.advertiser}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="shrink-0 text-primary">
          {ad.callToAction}
          <ExternalLink className="ml-1 h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// Mock 数据示例
export const mockNativeAd: NativeAdData = {
  id: 'ad_001',
  imageUrl: '/placeholder.svg?height=200&width=320&text=Ad+Image',
  headline: '提升团队协作效率的最佳工具',
  description: '超过100万团队正在使用，免费试用30天',
  advertiser: 'Notion',
  logoUrl: '/placeholder.svg?height=40&width=40&text=Logo',
  clickUrl: 'https://example.com/landing',
  callToAction: '免费试用',
};
