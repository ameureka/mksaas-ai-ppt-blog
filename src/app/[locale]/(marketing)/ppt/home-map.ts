export interface RawHomePPT {
  id: string;
  title: string;
  category?: string;
  tags?: string[];
  language?: string;
  preview_url?: string;
  thumbnailUrl?: string;
  cover_image_url?: string;
  downloads?: number;
  downloadCount?: number;
  viewCount?: number;
  views?: number;
  slides_count?: number;
  slidesCount?: number;
}

export interface HomePPT {
  id: string;
  title: string;
  tags: string[];
  downloads: number;
  views: number;
  language: string;
  previewUrl: string;
  pages: number;
  category: string;
  isAd?: boolean;
}

export function mapHomeItems(items: RawHomePPT[]): HomePPT[] {
  return items.map((item) => {
    const downloads =
      item.downloads ?? item.downloadCount ?? 0;
    const views = item.views ?? item.viewCount ?? 0;
    const pages = item.slides_count ?? item.slidesCount ?? 0;
    const previewUrl =
      item.preview_url ??
      item.thumbnailUrl ??
      item.cover_image_url ??
      '/placeholder.svg';

    return {
      id: item.id,
      title: item.title,
      tags: item.tags ?? [],
      downloads,
      views,
      language: item.language ?? '中文',
      previewUrl,
      pages,
      category: item.category ?? '其他',
    };
  });
}
