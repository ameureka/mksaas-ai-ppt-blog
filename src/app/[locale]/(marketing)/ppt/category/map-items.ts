export interface RawPPT {
  id: string;
  title: string;
  category?: string;
  preview_url?: string;
  cover_image_url?: string;
  thumbnailUrl?: string;
  downloads?: number;
  downloadCount?: number;
  download_count?: number;
  views?: number;
  viewCount?: number;
  view_count?: number;
  slides_count?: number;
  slidesCount?: number;
  language?: string;
  tags?: string[];
}

export interface MappedPPT {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  thumbnail: string;
  downloads: number;
  views: number;
  rating?: number;
  reviewCount?: number;
  price?: number;
  language?: string;
  slides: number;
  tags: string[];
  previewUrl: string;
  pages: number;
}

export function mapCategoryItems(
  items: RawPPT[],
  fallbackCategory: string
): MappedPPT[] {
  return items.map((item) => {
    const thumb =
      item.thumbnailUrl ??
      item.preview_url ??
      item.cover_image_url ??
      '/placeholder.svg';
    const slides = item.slides_count ?? item.slidesCount ?? 0;
    return {
      id: item.id,
      title: item.title,
      category: item.category ?? fallbackCategory,
      subcategory: item.category ?? fallbackCategory,
      thumbnail: thumb,
      downloads:
        item.downloads ?? item.downloadCount ?? item.download_count ?? 0,
      views: item.views ?? item.viewCount ?? item.view_count ?? 0,
      rating: 4.5,
      reviewCount: 0,
      price: undefined,
      language: item.language ?? '中文',
      slides,
      tags: item.tags ?? [],
      previewUrl: thumb,
      pages: slides,
    };
  });
}
