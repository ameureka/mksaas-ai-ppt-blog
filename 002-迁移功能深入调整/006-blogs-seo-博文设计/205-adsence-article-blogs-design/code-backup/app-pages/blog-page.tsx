'use client';

import { MksaasPublicLayout } from '@/components/mksaas-public-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ArrowRight,
  BookOpen,
  Clock,
  Eye,
  FileText,
  Palette,
  Search,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// 博客文章数据
const blogPosts = [
  {
    id: 'ppt-category-guide',
    title: '8大PPT分类完全指南：如何选择最适合你的模板类型',
    excerpt:
      '商务汇报、教育培训、产品营销...不同场景该选哪种PPT？本文详解8大分类的特点和适用场景，帮你3分钟找到最合适的模板。',
    category: '入门指南',
    tags: ['PPT分类', '模板选择', '新手入门'],
    readTime: 8,
    views: 12580,
    publishDate: '2025-01-20',
    featured: true,
    icon: BookOpen,
  },
  {
    id: 'ppt-page-count-guide',
    title: 'PPT页数黄金法则：不同场景的最佳页数建议',
    excerpt:
      '15分钟汇报需要多少页PPT？根据哈佛商学院研究，演讲时长与页数有最佳比例。本文提供详细的时长-页数对照表。',
    category: '设计技巧',
    tags: ['页数规划', '演讲技巧', '时间管理'],
    readTime: 6,
    views: 8920,
    publishDate: '2025-01-19',
    featured: true,
    icon: FileText,
  },
  // ... 更多文章数据
];

const categories = ['全部', '入门指南', '设计技巧', '实战教程', '案例分析'];

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');

  // ... 组件实现
}
