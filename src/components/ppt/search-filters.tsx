'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PPT_CATEGORIES,
  PPT_LANGUAGES,
  PPT_SORTS,
} from '@/lib/constants/ppt';
import type { LucideIcon } from 'lucide-react';

interface Category {
  name: string;
  slug: string;
  count?: number;
  icon?: LucideIcon;
  preview?: string;
}

interface Filters {
  category: string;
  language: string;
  sort: string;
}

interface SearchFiltersProps {
  filters: Filters;
  categories: Category[];
  onFiltersChange: (filters: Filters) => void;
}

export function SearchFilters({
  filters,
  categories,
  onFiltersChange,
}: SearchFiltersProps) {
  const availableCategories =
    categories.length > 0
      ? categories
      : PPT_CATEGORIES.map((cat) => ({ name: cat.label, slug: cat.value }));

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={filters.category}
        onValueChange={(v) => onFiltersChange({ ...filters, category: v })}
      >
        <SelectTrigger className="w-full sm:w-32">
          <SelectValue placeholder="分类" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部分类</SelectItem>
          {availableCategories.map((cat) => (
            <SelectItem key={cat.slug} value={cat.slug}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.language}
        onValueChange={(v) => onFiltersChange({ ...filters, language: v })}
      >
        <SelectTrigger className="w-full sm:w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部语言</SelectItem>
          {PPT_LANGUAGES.map((lang) => (
            <SelectItem key={lang.value} value={lang.value}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.sort}
        onValueChange={(v) => onFiltersChange({ ...filters, sort: v })}
      >
        <SelectTrigger className="w-full sm:w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PPT_SORTS.map((sort) => (
            <SelectItem key={sort.value} value={sort.value}>
              {sort.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
