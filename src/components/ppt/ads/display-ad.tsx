'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

type AdFormat = 'mrec' | 'half_page' | 'leaderboard' | 'mobile_banner';

export interface DisplayAdProps {
  slot: string; // 广告位 ID
  format: AdFormat;
  className?: string;
  lazy?: boolean; // 懒加载，默认 true
  sticky?: boolean; // 是否粘性定位
  delay?: number; // 延迟加载 ms
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onImpression?: () => void;
}

const formatSizes: Record<
  AdFormat,
  { width: number | string; height: number }
> = {
  mrec: { width: 300, height: 250 },
  half_page: { width: 300, height: 600 },
  leaderboard: { width: 728, height: 90 },
  mobile_banner: { width: 320, height: 50 },
};

export function DisplayAd({
  slot,
  format,
  className,
  lazy = true,
  sticky = false,
  delay = 0,
  onLoad,
  onError,
  onImpression,
}: DisplayAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(!lazy);
  const [hasError, setHasError] = useState(false);

  const { width, height } = formatSizes[format];

  // 懒加载 - Intersection Observer
  useEffect(() => {
    if (!lazy || !containerRef.current) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 延迟加载
            if (delay > 0) {
              setTimeout(() => setIsVisible(true), delay);
            } else {
              setIsVisible(true);
            }
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' } // 提前 200px 开始加载
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [lazy, delay]);

  // 模拟广告加载
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      // 模拟加载成功
      setIsLoading(false);
      onLoad?.();
      onImpression?.();
    }, 1000);

    return () => clearTimeout(timer);
  }, [isVisible, onLoad, onImpression, slot]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-muted/30 rounded-lg overflow-hidden flex flex-col items-center justify-center',
        sticky && 'sticky top-4',
        format === 'leaderboard' ? 'w-full max-w-[728px]' : '',
        format === 'mobile_banner' ? 'w-full max-w-[320px]' : '',
        className
      )}
      style={{
        width:
          format === 'leaderboard' || format === 'mobile_banner'
            ? '100%'
            : width,
        maxWidth: typeof width === 'number' ? width : undefined,
        height,
      }}
    >
      {/* 加载状态 */}
      {isLoading && <Skeleton className="absolute inset-0 size-full" />}

      {/* 广告内容 */}
      {isVisible && !isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 w-full h-full">
          <div className="text-center text-muted-foreground">
            <p className="text-sm font-medium">广告位</p>
            <p className="text-xs opacity-70">{format}</p>
            <p className="text-[10px] opacity-50 mt-1">
              {typeof width === 'number' ? width : 'full'}x{height}
            </p>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
          <p className="text-xs text-muted-foreground">广告加载失败</p>
        </div>
      )}

      {/* 广告标识 */}
      <div className="absolute bottom-1 right-2 text-[10px] text-muted-foreground/60 px-1 py-0.5 bg-background/50 rounded pointer-events-none select-none">
        广告
      </div>
    </div>
  );
}

// 便捷组件 - 侧边栏广告
export function SidebarAd({
  slot,
  className,
  ...props
}: Omit<DisplayAdProps, 'format'>) {
  return (
    <DisplayAd slot={slot} format="mrec" className={className} {...props} />
  );
}

// 便捷组件 - 侧边栏大广告
export function SidebarLargeAd({
  slot,
  className,
  sticky = true,
  ...props
}: Omit<DisplayAdProps, 'format'>) {
  return (
    <DisplayAd
      slot={slot}
      format="half_page"
      sticky={sticky}
      className={className}
      {...props}
    />
  );
}

// 便捷组件 - 横幅广告
export function BannerAd({
  slot,
  className,
  ...props
}: Omit<DisplayAdProps, 'format'>) {
  return (
    <DisplayAd
      slot={slot}
      format="leaderboard"
      className={cn('mx-auto hidden md:flex', className)}
      {...props}
    />
  );
}

// 便捷组件 - 移动端横幅广告
export function MobileBannerAd({
  slot,
  className,
  sticky = true,
  ...props
}: Omit<DisplayAdProps, 'format'>) {
  return (
    <DisplayAd
      slot={slot}
      format="mobile_banner"
      sticky={sticky}
      className={cn('mx-auto md:hidden', className)}
      {...props}
    />
  );
}
