'use client';

import { ADSENSE_CONFIG } from '@/lib/config/adsense';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface DisplayAdProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
  style?: React.CSSProperties;
}

export function DisplayAd({
  slot,
  format = 'auto',
  className,
  style,
}: DisplayAdProps) {
  const adRef = useRef<HTMLModElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!ADSENSE_CONFIG.enabled || !slot || loaded) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      setLoaded(true);
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, [slot, loaded]);

  // Don't render if disabled or no slot
  if (!ADSENSE_CONFIG.enabled || !slot) {
    if (ADSENSE_CONFIG.testMode) {
      return (
        <div
          className={cn(
            'bg-muted/50 flex items-center justify-center rounded-lg border border-dashed',
            className
          )}
          style={style}
        >
          <span className="text-xs text-muted-foreground">
            Ad Placeholder ({format})
          </span>
        </div>
      );
    }
    return null;
  }

  return (
    <ins
      ref={adRef}
      className={cn('adsbygoogle block', className)}
      style={style}
      data-ad-client={ADSENSE_CONFIG.publisherId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}

// Preset components
export function BlogBannerAd({ className }: { className?: string }) {
  return (
    <DisplayAd
      slot={ADSENSE_CONFIG.slots.blogBanner}
      format="horizontal"
      className={className}
      style={{ minHeight: 90 }}
    />
  );
}

export function BlogSidebarAd({ className }: { className?: string }) {
  return (
    <DisplayAd
      slot={ADSENSE_CONFIG.slots.blogSidebar}
      format="rectangle"
      className={className}
      style={{ minHeight: 250, minWidth: 300 }}
    />
  );
}

export function HomeBannerAd({ className }: { className?: string }) {
  return (
    <DisplayAd
      slot={ADSENSE_CONFIG.slots.homeBanner}
      format="horizontal"
      className={className}
      style={{ minHeight: 90 }}
    />
  );
}
