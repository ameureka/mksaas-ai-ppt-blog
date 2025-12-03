'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { ADSENSE_CONFIG } from '@/lib/config/adsense';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

type AdFormat =
  | 'horizontal'
  | 'rectangle'
  | 'vertical'
  | 'outstream'
  | 'multiplex';

interface DisplayAdProps {
  slot: string;
  format?: AdFormat;
  className?: string;
  lazy?: boolean;
  fluidLayout?: boolean;
}

const formatDimensions: Record<
  AdFormat,
  { minHeight: number; minWidth?: number; aspectRatio?: string }
> = {
  horizontal: { minHeight: 90 },
  rectangle: { minHeight: 250, minWidth: 300 },
  vertical: { minHeight: 600, minWidth: 300 },
  outstream: { minHeight: 250, aspectRatio: '16/9' },
  multiplex: { minHeight: 280 },
};

export function DisplayAd({
  slot,
  format = 'horizontal',
  className,
  lazy = true,
  fluidLayout = false,
}: DisplayAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!lazy);
  const [adPushed, setAdPushed] = useState(false);

  const dimensions = formatDimensions[format];

  // Lazy loading with IntersectionObserver
  useEffect(() => {
    if (!lazy || !containerRef.current) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [lazy]);

  // Push ad when visible
  useEffect(() => {
    if (
      !isVisible ||
      !ADSENSE_CONFIG.enabled ||
      !slot ||
      adPushed ||
      ADSENSE_CONFIG.testMode
    )
      return;

    try {
      const adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle = adsbygoogle;
      adsbygoogle.push({});
      setAdPushed(true);
    } catch (err) {
      console.error('AdSense push error:', err);
    }
  }, [isVisible, slot, adPushed]);

  // Don't render if disabled (and not in test mode)
  if (!ADSENSE_CONFIG.enabled && !ADSENSE_CONFIG.testMode) {
    return null;
  }

  // Don't render if slot is empty (except in test mode where we show placeholder)
  if (!slot && !ADSENSE_CONFIG.testMode) {
    return null;
  }

  // Test mode placeholder
  if (ADSENSE_CONFIG.testMode) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'bg-muted/30 border border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center',
          className
        )}
        style={{
          minHeight: dimensions.minHeight,
          minWidth: dimensions.minWidth,
          aspectRatio: dimensions.aspectRatio,
        }}
      >
        <div className="text-center text-muted-foreground">
          {format === 'outstream' && <div className="text-2xl mb-1">▶</div>}
          <p className="text-xs font-medium">Ad ({format})</p>
          <p className="text-[10px] opacity-60">
            {dimensions.minWidth || 'auto'}×{dimensions.minHeight}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={{
        minHeight: dimensions.minHeight,
        minWidth: dimensions.minWidth,
        aspectRatio: dimensions.aspectRatio,
      }}
    >
      {!adPushed && <Skeleton className="absolute inset-0" />}
      {isVisible && (
        <ins
          className="adsbygoogle block"
          style={{ display: 'block', width: '100%', height: '100%' }}
          data-ad-client={ADSENSE_CONFIG.publisherId}
          data-ad-slot={slot}
          data-ad-format={fluidLayout ? 'fluid' : 'auto'}
          data-full-width-responsive="true"
          {...(format === 'multiplex' && { 'data-ad-format': 'autorelaxed' })}
          {...(format === 'outstream' && {
            'data-ad-layout-key': '-6t+ed+2i-1n-4w',
          })}
        />
      )}
    </div>
  );
}

// Preset components
export function BlogBannerAd({ className }: { className?: string }) {
  return (
    <DisplayAd
      slot={ADSENSE_CONFIG.slots.blogBanner}
      format="horizontal"
      className={cn('w-full max-w-4xl mx-auto my-4', className)}
    />
  );
}

export function BlogSidebarAd({ className }: { className?: string }) {
  return (
    <DisplayAd
      slot={ADSENSE_CONFIG.slots.blogSidebar}
      format="rectangle"
      className={className}
    />
  );
}

export function HomeBannerAd({ className }: { className?: string }) {
  return (
    <DisplayAd
      slot={ADSENSE_CONFIG.slots.homeBanner}
      format="horizontal"
      className={cn('w-full max-w-4xl mx-auto my-4', className)}
    />
  );
}

// New preset components
export function VerticalSidebarAd({ className }: { className?: string }) {
  return (
    <DisplayAd
      slot={ADSENSE_CONFIG.slots.vertical}
      format="vertical"
      className={className}
    />
  );
}

export function OutstreamVideoAd({ className }: { className?: string }) {
  return (
    <DisplayAd
      slot={ADSENSE_CONFIG.slots.outstream}
      format="outstream"
      fluidLayout
      className={cn('my-6 mx-auto max-w-2xl rounded-lg', className)}
    />
  );
}

export function MultiplexAd({ className }: { className?: string }) {
  return (
    <DisplayAd
      slot={ADSENSE_CONFIG.slots.multiplex}
      format="multiplex"
      className={cn('w-full my-6', className)}
    />
  );
}
