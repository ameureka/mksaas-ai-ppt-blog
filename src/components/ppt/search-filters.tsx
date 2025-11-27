'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LucideIcon } from 'lucide-react';

interface Category {
  name: string;
  slug?: string;
  count: number;
  icon: LucideIcon;
  preview: string;
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
          {categories.map((cat) => (
            <SelectItem key={cat.name} value={cat.slug ?? cat.name}>
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
          <SelectItem value="中文">中文</SelectItem>
          <SelectItem value="English">English</SelectItem>
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
          <SelectItem value="popular">最受欢迎</SelectItem>
          <SelectItem value="newest">最新上传</SelectItem>
          <SelectItem value="downloads">下载最多</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
