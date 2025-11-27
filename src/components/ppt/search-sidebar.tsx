'use client';
import { PUBLIC_I18N } from '@/lib/constants/ppt-i18n';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Download, TrendingUpIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface HotKeyword {
  text: string;
  size: 'large' | 'medium' | 'small';
}

interface Category {
  name: string;
  slug?: string;
  count: number;
  icon: LucideIcon;
  preview: string;
}

interface PPT {
  id: string;
  title: string;
  previewUrl: string;
  pages: number;
}

interface SearchSidebarProps {
  hotKeywords: HotKeyword[];
  categories: Category[];
  recentDownloads: PPT[];
  onKeywordClick: (keyword: string) => void;
  onCategoryClick: (categorySlug: string) => void;
}

export function SearchSidebar({
  hotKeywords,
  categories,
  recentDownloads,
  onKeywordClick,
  onCategoryClick,
}: SearchSidebarProps) {
  return (
    <aside className="hidden lg:block lg:w-80">
      <div className="sticky top-20 space-y-6">
        {/* {PUBLIC_I18N.search.hotKeywords} */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUpIcon className="h-4 w-4" />
              {PUBLIC_I18N.search.hotKeywords}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {hotKeywords.slice(0, 6).map((keyword, i) => (
              <button
                key={i}
                onClick={() => onKeywordClick(keyword.text)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">
                  {i + 1}
                </span>
                <span>{keyword.text}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* {PUBLIC_I18N.search.recommendedCategories} */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4" />
              {PUBLIC_I18N.search.recommendedCategories}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {categories.slice(0, 5).map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.name}
                  onClick={() => onCategoryClick(cat.slug ?? cat.name)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{cat.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* {PUBLIC_I18N.search.recentDownloads} */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-4 w-4" />
              {PUBLIC_I18N.search.recentDownloads}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentDownloads.slice(0, 3).map((ppt) => (
              <div key={ppt.id} className="flex gap-3">
                <img
                  src={ppt.previewUrl || '/placeholder.svg'}
                  alt={ppt.title}
                  className="h-12 w-16 rounded object-cover"
                />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{ppt.title}</p>
                  <p className="text-xs text-muted-foreground">{ppt.pages}页</p>
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full">
              查看全部
            </Button>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
