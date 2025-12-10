import React, { ReactNode } from 'react';

interface CategoryErrorBannerProps {
  hasError: boolean;
  children?: ReactNode;
}

export function CategoryErrorBanner({
  hasError,
  children,
}: CategoryErrorBannerProps) {
  if (!hasError) return null;
  return (
    <div className="container mx-auto px-4 pt-4">
      <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        分类数据加载部分失败，已展示可用数据，稍后可刷新重试。
        {children}
      </div>
    </div>
  );
}
