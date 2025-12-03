'use client';

import { ADSENSE_CONFIG } from '@/lib/config/adsense';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'anchor-ad-dismissed';

export function AnchorAd() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [adPushed, setAdPushed] = useState(false);

  useEffect(() => {
    // Check sessionStorage on mount
    const isDismissed = sessionStorage.getItem(STORAGE_KEY) === 'true';
    setDismissed(isDismissed);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (
      dismissed ||
      !ADSENSE_CONFIG.enabled ||
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
      console.error('AnchorAd push error:', err);
    }
  }, [dismissed, adPushed]);

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    setDismissed(true);
  };

  // Don't render until mounted (avoid hydration mismatch)
  if (!mounted) return null;
  if (dismissed) return null;
  if (!ADSENSE_CONFIG.enabled && !ADSENSE_CONFIG.testMode) return null;

  // Test mode placeholder
  if (ADSENSE_CONFIG.testMode) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <div className="relative max-w-4xl mx-auto h-[90px] flex items-center justify-center">
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            aria-label="Close ad"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="w-full max-w-2xl text-center text-muted-foreground border border-dashed border-muted-foreground/30 rounded-lg py-6">
            <p className="text-xs font-medium">Anchor Ad</p>
            <p className="text-[10px] opacity-60">auto×90</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 border-t">
      <div className="relative max-w-4xl mx-auto" style={{ maxHeight: 100 }}>
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-1 right-1 z-10 p-1 rounded-full bg-background/80 hover:bg-background shadow"
          aria-label="Close ad"
        >
          <X className="h-4 w-4" />
        </button>
        <ins
          className="adsbygoogle block"
          style={{ display: 'block', height: 90 }}
          data-ad-client={ADSENSE_CONFIG.publisherId}
          data-ad-slot={ADSENSE_CONFIG.slots.anchor}
          data-ad-format="horizontal"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
