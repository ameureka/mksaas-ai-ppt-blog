'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LocaleLink } from '@/i18n/navigation';
import { Download, Eye, Globe } from 'lucide-react';

interface PPTBase {
  id: string;
  title: string;
  category: string;
  downloads: number;
  views: number;
  // Support both DTO and legacy fields
  tags?: string[];
  language?: string;
  preview_url?: string;
  previewUrl?: string;
  slides_count?: number;
  pages?: number;
  isAd?: boolean;
}

interface PPTCardProps {
  ppt: PPTBase;
  onDownload: (ppt: PPTBase) => void;
}

export function PPTCard({ ppt, onDownload }: PPTCardProps) {
  if (ppt.isAd) {
    return (
      <Card className="overflow-hidden border-2 border-dashed border-primary/30 bg-primary/5">
        <CardContent className="flex h-full min-h-[300px] flex-col items-center justify-center p-6">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            推广内容
          </p>
          <p className="text-center text-sm text-muted-foreground">
            原生广告位
          </p>
        </CardContent>
      </Card>
    );
  }

  // Normalize fields
  const previewUrl = ppt.preview_url || ppt.previewUrl || '/placeholder.svg';
  const pages = ppt.slides_count || ppt.pages || 0;
  const tags = ppt.tags || [];
  const language = ppt.language || '中文';

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
      <LocaleLink href={`/ppt/${ppt.id}`}>
        <CardHeader className="p-3 cursor-pointer">
          <div className="relative h-40 sm:h-48 lg:h-56 overflow-hidden rounded-xl bg-muted">
            <img
              src={previewUrl}
              alt={ppt.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105 rounded-xl"
              loading="lazy"
            />
            <Badge className="absolute right-2 top-2 gap-1" variant="secondary">
              <Globe className="h-3 w-3" />
              {language}
            </Badge>
          </div>
        </CardHeader>
      </LocaleLink>
      <CardContent className="p-4">
        <LocaleLink href={`/ppt/${ppt.id}`}>
          <CardTitle className="mb-2 line-clamp-2 text-base hover:text-primary transition-colors cursor-pointer">
            {ppt.title}
          </CardTitle>
        </LocaleLink>
        <div className="mb-3 flex flex-wrap gap-1">
          {tags.length > 0 ? (
            tags.map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))
          ) : (
            <Badge
              variant="outline"
              className="text-xs text-muted-foreground border-dashed"
            >
              {ppt.category}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            {(ppt.downloads / 1000).toFixed(1)}k
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {(ppt.views / 1000).toFixed(1)}k
          </span>
          <span>{pages}页</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full h-10"
          size="sm"
          onClick={() => onDownload(ppt)}
        >
          立即下载
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * PPTCard 骨架屏组件
 * 用于数据加载时的占位显示
 */
export function PPTCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3">
        <Skeleton className="h-40 sm:h-48 lg:h-56 w-full rounded-xl" />
      </CardHeader>
      <CardContent className="p-4">
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-3" />
        <div className="flex gap-1 mb-3">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-8" />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}
