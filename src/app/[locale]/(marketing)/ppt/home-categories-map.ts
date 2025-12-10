import { PPT_CATEGORIES } from '@/lib/constants/ppt';
import { categoryMeta } from '@/lib/constants/ppt-category-meta';

export interface CategoryStatsResponse {
  success: boolean;
  data?: Record<string, number>;
}

export interface HotCategory {
  name: string;
  slug: string;
  count: number;
  icon: any;
  preview: string;
}

export function mergeCategoryStats(
  stats: Record<string, number> | undefined
): HotCategory[] {
  const merged = { ...categoryMeta };
  if (stats) {
    for (const [key, count] of Object.entries(stats)) {
      if (merged[key]) {
        merged[key] = { ...merged[key], count: count as number };
      }
    }
  }

  return PPT_CATEGORIES.map((cat) => {
    const meta = merged[cat.value as keyof typeof merged] ?? {
      count: 0,
      icon: undefined,
      preview: '/placeholder.svg',
    };
    return {
      name: cat.label,
      slug: cat.value,
      count: meta.count ?? 0,
      icon: meta.icon,
      preview: meta.preview ?? '/placeholder.svg',
    };
  });
}

export function sortCategoriesByCount(
  categories: HotCategory[]
): HotCategory[] {
  const order = PPT_CATEGORIES.map((c) => c.value);
  return [...categories].sort((a, b) => {
    if (b.count === a.count) {
      return order.indexOf(a.slug as any) - order.indexOf(b.slug as any);
    }
    return b.count - a.count;
  });
}
