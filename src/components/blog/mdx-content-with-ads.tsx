'use client';

import { injectAdsIntoContent } from '@/lib/mdx/inject-ads';
import type { ReactNode } from 'react';

interface MDXContentWithAdsProps {
  children: ReactNode;
}

export function MDXContentWithAds({ children }: MDXContentWithAdsProps) {
  const contentWithAds = injectAdsIntoContent(children);
  return <>{contentWithAds}</>;
}
