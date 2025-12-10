import React, { ReactNode } from 'react';

interface FeaturedErrorBannerProps {
  hasError: boolean;
  children?: ReactNode;
}

export function FeaturedErrorBanner({
  hasError,
  children,
}: FeaturedErrorBannerProps) {
  if (!hasError) return null;
  return (
    <div className="container mx-auto px-4 pt-4">
      <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        精选数据加载失败，已展示可用内容，可稍后刷新。
        {children}
      </div>
    </div>
  );
}
