# PPT 分类系统重构方案 - 单一数据源设计

**日期**: 2025年12月3日
**状态**: 📋 待实施（常量裁剪为 12 类，API/前端已接入）
**关联问题**: `03-PPTCategory类型定义技术债务深度分析报告.md`

---

## 一、现状分析

### 1.1 数据库实际数据（2025年12月3日查询，需现库复核）

| 分类 slug | 数量 | 占比 | 样本数据 |
|-----------|------|------|----------|
| `business` | 743 | 50.5% | 弥散风、小清新 |
| `education` | 550 | 37.4% | 企业培训、红色英雄故事 |
| `technology` | 73 | 5.0% | 弥散风 |
| `design` | 44 | 3.0% | 岗位竞聘 |
| `marketing` | 28 | 1.9% | 设计行业 |
| `hr` | 15 | 1.0% | - |
| `medical` | 14 | 1.0% | - |
| `finance` | 3 | 0.2% | - |
| `general` | 1 | 0.1% | - |

**总计**: 9 个分类，1471 条记录

### 1.2 现有代码问题（最新校验）

| 文件 | 分类值 | 问题 |
|------|--------|------|
| `src/lib/constants/ppt.ts` | 12个 | 已作为 API/类型来源，前端已引用 |
| `src/lib/types/ppt/ppt.ts` | 12个（由常量推导） | 与常量一致 |
| `src/app/api/ppts/route.ts` | 12个（引用常量） | 校验已放宽，依赖常量列表 |
| 前端页面 | 常量驱动 | 首页/分类页均引用常量 |


---

## 二、目标分类体系设计

### 2.1 最终分类列表（12个，已收敛常量）

基于数据库现有数据 + 业务需求扩展：

| # | slug | 中文名 | 英文名 | 图标 | 数据库 | 说明 |
|---|------|--------|--------|------|--------|------|
| 1 | `business` | 商务汇报 | Business | Briefcase | ✅ 743条 | 企业汇报、客户提案 |
| 2 | `education` | 教育培训 | Education | GraduationCap | ✅ 550条 | 课程讲解、知识分享 |
| 3 | `technology` | 科技互联网 | Technology | Cpu | ✅ 73条 | 技术方案、产品架构 |
| 4 | `design` | 设计创意 | Design | Palette | ✅ 44条 | 创意设计、视觉展示 |
| 5 | `marketing` | 产品营销 | Marketing | TrendingUp | ✅ 28条 | 营销方案、品牌推广 |
| 6 | `hr` | 人力资源 | HR | Users | ✅ 15条 | 招聘培训、团队建设 |
| 7 | `medical` | 医疗健康 | Medical | Heart | ✅ 14条 | 医疗报告、健康宣传 |
| 8 | `finance` | 金融财务 | Finance | DollarSign | ✅ 3条 | 财务分析、投资报告 |
| 9 | `general` | 通用模板 | General | FileText | ✅ 1条 | 其他通用场景 |
| 10 | `summary` | 年终总结 | Summary | Calendar | 🆕 新增 | 年度回顾、工作总结 |
| 11 | `report` | 述职报告 | Report | ClipboardList | 🆕 新增 | 晋升述职、绩效汇报 |
| 12 | `plan` | 工作计划 | Plan | Target | 🆕 新增 | 项目计划、目标规划 |

### 2.2 废弃/待裁剪的分类（与现常量差异）

| slug | 原因/动作 |
|------|----------|
| `product` | 常量中存在，建议并入 `marketing` 或待数据复核 |
| `creative` | 常量中存在，建议并入 `design` |
| `lifestyle` | 常量中存在，建议并入 `general` |
| `hr`/`medical`/`finance` | 常量中存在，需确认业务与数据覆盖 |

---

## 三、架构设计

### 3.1 数据流架构（SEO 优化版）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    新架构：Server Component + Client 交互                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  src/lib/constants/ppt.ts 或 src/config/ppt-categories.ts (单一数据源 SSOT) │
│         │                                                                   │
│         ├──→ src/lib/types/ppt/ppt.ts (类型推导)                           │
│         │                                                                   │
│         ├──→ src/actions/ppt/ppt.ts (Server Action + 验证)                 │
│         │         │                                                         │
│         │         ├──→ PPT 首页 (Server Component)                         │
│         │         │         └──→ 首屏数据服务端渲染 (SEO ✅)                │
│         │         │                                                         │
│         │         └──→ PPT 交互组件 (Client Component)                     │
│         │                   └──→ 搜索/筛选等交互                            │
│         │                                                                   │
│         ├──→ src/app/api/ppts/route.ts (基于常量校验)                      │
│         │                                                                   │
│         └──→ 前端组件 (从配置读取分类列表)                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 验证逻辑位置

| 层级 | 是否验证 | 说明 |
|------|----------|------|
| API Route | ❌ 不验证 | 只做参数透传，简化代码 |
| Server Action | ✅ 验证 | 使用 `isValidCategory()` 统一验证 |
| 前端组件 | ✅ 类型约束 | 使用配置生成选项，TypeScript 编译时检查 |

### 3.3 文件结构（可复用现有常量）

```
src/
├── lib/constants/ppt.ts        # ✅ 现有分类来源，可作为 SSOT（或迁移到 config/）
├── lib/
│   └── types/
│       └── ppt/
│           └── ppt.ts         # ✅ 已从常量推导
├── actions/
│   └── ppt/
│       └── ppt.ts             # ✅ 使用常量校验
├── app/
│   ├── api/
│   │   └── ppts/
│   │       └── route.ts       # ✅ 使用常量校验
│   └── [locale]/
│       └── (marketing)/
│           └── ppt/
│               ├── page.tsx           # ⏳ 待引用常量、可拆分 Server/Client
│               └── categories/page.tsx# ⏳ 待引用常量
└── 待删除/收敛文件：
    ├── src/types/ppt.ts               # ⚠️ 重复，迁移后可删
    ├── src/schemas/ppt.ts             # ⚠️ 重复，无引用
    └── src/lib/ppt/schemas/ppt.ts     # ⚠️ 仅测试使用，需与常量同步或移除
```

---

## 四、核心代码设计

### 4.1 单一数据源配置文件

**文件**: `src/config/ppt-categories.ts`

```typescript
import {
  Briefcase,
  GraduationCap,
  Cpu,
  Palette,
  TrendingUp,
  Users,
  Heart,
  DollarSign,
  FileText,
  Calendar,
  ClipboardList,
  Target,
  type LucideIcon,
} from 'lucide-react';

/**
 * PPT 分类配置 - 单一数据源 (Single Source of Truth)
 */
export interface PPTCategoryConfig {
  slug: string;
  label: { zh: string; en: string };
  icon: LucideIcon;
  description?: { zh: string; en: string };
  order: number;
}

export const PPT_CATEGORIES = [
  { slug: 'business', label: { zh: '商务汇报', en: 'Business' }, icon: Briefcase, order: 1 },
  { slug: 'education', label: { zh: '教育培训', en: 'Education' }, icon: GraduationCap, order: 2 },
  { slug: 'technology', label: { zh: '科技互联网', en: 'Technology' }, icon: Cpu, order: 3 },
  { slug: 'design', label: { zh: '设计创意', en: 'Design' }, icon: Palette, order: 4 },
  { slug: 'marketing', label: { zh: '产品营销', en: 'Marketing' }, icon: TrendingUp, order: 5 },
  { slug: 'hr', label: { zh: '人力资源', en: 'HR' }, icon: Users, order: 6 },
  { slug: 'medical', label: { zh: '医疗健康', en: 'Medical' }, icon: Heart, order: 7 },
  { slug: 'finance', label: { zh: '金融财务', en: 'Finance' }, icon: DollarSign, order: 8 },
  { slug: 'general', label: { zh: '通用模板', en: 'General' }, icon: FileText, order: 9 },
  { slug: 'summary', label: { zh: '年终总结', en: 'Summary' }, icon: Calendar, order: 10 },
  { slug: 'report', label: { zh: '述职报告', en: 'Report' }, icon: ClipboardList, order: 11 },
  { slug: 'plan', label: { zh: '工作计划', en: 'Plan' }, icon: Target, order: 12 },
] as const;

// 自动推导类型
export type PPTCategorySlug = (typeof PPT_CATEGORIES)[number]['slug'];

// 验证函数
export const isValidCategory = (value: string): value is PPTCategorySlug => {
  return PPT_CATEGORIES.some((c) => c.slug === value);
};

// 获取分类配置
export const getCategoryConfig = (slug: string) => {
  return PPT_CATEGORIES.find((c) => c.slug === slug);
};

// 获取分类标签
export const getCategoryLabel = (slug: string, locale: 'zh' | 'en' = 'zh') => {
  return getCategoryConfig(slug)?.label[locale] ?? slug;
};

// 导出 slug 列表
export const VALID_CATEGORY_SLUGS = PPT_CATEGORIES.map((c) => c.slug);
```

### 4.2 类型定义更新

**文件**: `src/lib/types/ppt/ppt.ts`

```typescript
import type { PPTCategorySlug } from '@/config/ppt-categories';

// 使用从配置推导的类型，保持向后兼容
export type PPTCategory = PPTCategorySlug;

export interface PPT {
  id: string;
  title: string;
  category: PPTCategory;
  author: string;
  // ... 其他字段保持不变
}
```

### 4.3 Server Action 验证

**文件**: `src/actions/ppt/ppt.ts`

```typescript
import { isValidCategory } from '@/config/ppt-categories';

const buildWhere = (params?: PPTListParams) => {
  if (!params) return undefined;
  const conditions = [];

  // 分类验证：使用统一配置
  if (params.category && isValidCategory(params.category)) {
    conditions.push(eq(pptTable.category, params.category));
  }

  // ... 其他条件
  return conditions.length ? and(...conditions) : undefined;
};
```

### 4.4 API Route 简化

**文件**: `src/app/api/ppts/route.ts`

```typescript
import { getPPTs } from '@/actions/ppt/ppt';
import type { NextRequest } from 'next/server';

// 简化：移除硬编码验证，让 Server Action 处理
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const params = {
    search: searchParams.get('search') ?? undefined,
    category: searchParams.get('category') ?? undefined, // 不在这里验证
    sortBy: searchParams.get('sortBy') ?? undefined,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') ?? undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
    pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
  };

  const result = await getPPTs(params);
  return Response.json(result, { status: result.success ? 200 : 400 });
}
```

### 4.5 首页重构为 Server Component + Client 交互

**文件**: `src/app/[locale]/(marketing)/ppt/page.tsx` (Server Component)

```typescript
import { getPPTs } from '@/actions/ppt/ppt';
import { PPT_CATEGORIES, getCategoryLabel } from '@/config/ppt-categories';
import { PPTClientSection } from './ppt-client';

// Server Component - 首屏数据服务端渲染，SEO 友好
export default async function PPTPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  // 服务端获取初始数据
  const [featuredResult, newResult] = await Promise.all([
    getPPTs({ pageSize: 8, sortBy: 'downloads', sortOrder: 'desc' }),
    getPPTs({ pageSize: 12, sortBy: 'created_at', sortOrder: 'desc' }),
  ]);

  const featuredPPTs = featuredResult.success ? featuredResult.data.items : [];
  const newPPTs = newResult.success ? newResult.data.items : [];

  // 从配置生成分类列表
  const categories = PPT_CATEGORIES.map((cat) => ({
    slug: cat.slug,
    name: getCategoryLabel(cat.slug, locale as 'zh' | 'en'),
    icon: cat.icon,
  }));

  return (
    <>
      {/* SEO: JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'PPT-AI',
            // ...
          }),
        }}
      />

      {/* Hero Section - 静态内容，服务端渲染 */}
      <HeroSection />

      {/* Client Component - 处理搜索、筛选等交互 */}
      <PPTClientSection
        initialFeatured={featuredPPTs}
        initialNew={newPPTs}
        categories={categories}
        locale={locale}
      />
    </>
  );
}
```

**文件**: `src/app/[locale]/(marketing)/ppt/ppt-client.tsx` (Client Component)

```typescript
'use client';

import { useState } from 'react';
import { PPTCard } from '@/components/ppt/ppt-card';
import { SearchFilters } from '@/components/ppt/search-filters';
import type { PPT } from '@/lib/types/ppt/ppt';

interface PPTClientSectionProps {
  initialFeatured: PPT[];
  initialNew: PPT[];
  categories: Array<{ slug: string; name: string; icon: any }>;
  locale: string;
}

export function PPTClientSection({
  initialFeatured,
  initialNew,
  categories,
  locale,
}: PPTClientSectionProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PPT[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    language: 'all',
    sort: 'popular',
  });

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setHasSearched(true);

    // 调用 API 搜索
    const res = await fetch(`/api/ppts?search=${encodeURIComponent(searchQuery)}`);
    const json = await res.json();
    if (json.success) {
      setResults(json.data.items);
    }
  };

  const handleCategoryClick = (slug: string) => {
    // 使用 slug 而非中文名
    router.push(`/${locale}/ppt/category/${slug}`);
  };

  return (
    <>
      {/* 搜索区域 */}
      <SearchSection query={query} onSearch={handleSearch} />

      {/* 搜索结果或默认内容 */}
      {hasSearched ? (
        <SearchResults results={results} filters={filters} categories={categories} />
      ) : (
        <>
          {/* 热门分类 - 使用配置数据 */}
          <CategoryGrid categories={categories} onCategoryClick={handleCategoryClick} />

          {/* 编辑精选 - 使用服务端数据 */}
          <FeaturedSection ppts={initialFeatured} />

          {/* 本周新品 - 使用服务端数据 */}
          <NewSection ppts={initialNew} />
        </>
      )}
    </>
  );
}
```

### 4.6 分类页面更新

**文件**: `src/app/[locale]/(marketing)/ppt/categories/page.tsx`

```typescript
import { PPT_CATEGORIES, getCategoryLabel } from '@/config/ppt-categories';

export default function CategoriesPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  // 从配置生成分类列表，不再硬编码
  const categories = PPT_CATEGORIES.map((cat) => ({
    slug: cat.slug,
    name: getCategoryLabel(cat.slug, locale as 'zh' | 'en'),
    icon: cat.icon,
    // count 可以从 API 获取或使用静态数据
  }));

  const handleCategoryClick = (slug: string) => {
    // 使用 slug 而非中文名
    router.push(`/${locale}/ppt/category/${slug}`);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <Card
            key={category.slug}
            onClick={() => handleCategoryClick(category.slug)}
          >
            <Icon className="h-6 w-6" />
            <h3>{category.name}</h3>
          </Card>
        );
      })}
    </div>
  );
}
```

---

## 五、实施步骤（结合现状调整）

### 阶段 1：单一数据源（30分钟）

| 步骤 | 操作 | 文件 | 说明 |
|------|------|------|------|
| 1.1 | 复用/迁移配置 | `src/lib/constants/ppt.ts` → 目标 12 类，或迁移到 `src/config/ppt-categories.ts` | 保持现有 API/类型引用 |
| 1.2 | 添加 i18n 翻译 | `messages/zh.json`, `messages/en.json` | 分类名称翻译 |

### 阶段 2：类型/Schema 同步（20分钟）

| 步骤 | 操作 | 文件 | 说明 |
|------|------|------|------|
| 2.1 | 更新类型定义 | `src/lib/types/ppt/ppt.ts` | 已引用常量，随裁剪同步 |
| 2.2 | 更新 Zod Schema | `src/lib/ppt/schemas/ppt.ts` | 同步分类枚举 |

### 阶段 3：后端同步（20分钟）

| 步骤 | 操作 | 文件 | 说明 |
|------|------|------|------|
| 3.1 | 更新 Server Action | `src/actions/ppt/ppt.ts` | 已使用常量，随裁剪同步 |
| 3.2 | API Route 校验 | `src/app/api/ppts/route.ts` | 已使用常量，随裁剪同步 |

### 阶段 4：前端落地（60分钟）

| 步骤 | 操作 | 文件 | 说明 |
|------|------|------|------|
| 4.1 | 首页/分类页 | `src/app/[locale]/(marketing)/ppt/page.tsx` / `categories/page.tsx` | 引用常量，去硬编码 |
| 4.2 | 筛选组件 | `src/components/ppt/search-filters.tsx` | 从常量读取选项 |
| 4.3 | 其他 | Footer/导航使用统一 slug |

### 阶段 5：清理重复/测试（10分钟）

| 步骤 | 操作 | 文件 | 说明 |
|------|------|------|------|
| 5.1 | 删除重复文件 | `src/types/ppt.ts` | 迁移引用后删除 |
| 5.2 | 删除重复文件 | `src/schemas/ppt.ts` | 无引用，直接删除 |
| 5.3 | 同步/下线测试 Schema | `src/lib/ppt/schemas/ppt.ts` | 与常量同步或移除 |
| 5.4 | 迁移引用 | `src/lib/query-keys.ts` | 随收敛调整引用路径 |

### 阶段 6：测试验证（30分钟）

| 步骤 | 操作 | 验证点 |
|------|------|--------|
| 6.1 | 运行 lint | `pnpm lint`（需先处理现有 Biome 报告） |
| 6.2 | 运行 build | `pnpm build` 成功 |
| 6.3 | 测试首页 | 分类显示正确，点击跳转正确 |
| 6.4 | 测试搜索 | 搜索功能正常 |
| 6.5 | 测试分类筛选 | 筛选结果正确 |
| 6.6 | 测试 SEO | 查看页面源码，确认首屏数据已渲染 |

---

## 六、风险评估与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 类型不兼容 | 编译失败 | 中 | 保持 `PPTCategory` 类型别名向后兼容 |
| 首页重构影响交互 | 用户体验 | 中 | 充分测试搜索、筛选功能 |
| SEO 变化 | 搜索排名 | 低 | 保持 URL 结构不变 |
| 数据库分类不存在 | 查询为空 | 低 | 新增分类暂时无数据是正常的 |

---

## 七、预期收益

### 7.1 技术收益

| 收益 | 说明 |
|------|------|
| 单一数据源 | 所有分类定义集中在 `src/lib/constants/ppt.ts`（或迁移后单点） |
| 类型安全 | TypeScript 自动推导，编译时检查 |
| 易于维护 | 新增/修改分类只需改一处 |
| 代码简化 | 删除 3 个重复文件，减少混乱 |

### 7.2 业务收益

| 收益 | 说明 |
|------|------|
| SEO 优化 | 首屏服务端渲染，搜索引擎可索引 |
| 性能提升 | 减少客户端请求，首屏加载更快 |
| 分类准确 | 前端展示与数据库一致 |
| 国际化支持 | 内置中英文标签 |

---

## 八、后续优化（可选）

| 优化项 | 说明 | 优先级 |
|--------|------|--------|
| 分类数量统计 | 从数据库实时获取各分类 PPT 数量 | P2 |
| 分类图片 | 为每个分类添加封面图 | P3 |
| 数据库约束 | 添加 PostgreSQL enum 或 check constraint | P3 |
| 分类管理后台 | 支持动态添加/编辑分类 | P4 |

---

## 九、检查清单

实施完成后，确认以下项目：

- [ ] `src/lib/constants/ppt.ts` 裁剪/迁移并作为唯一分类来源
- [ ] 前端引用常量，去硬编码（首页/分类页/筛选/导航）
- [ ] `src/lib/types/ppt/ppt.ts` 同步常量
- [ ] `src/actions/ppt/ppt.ts` / `src/app/api/ppts/route.ts` 同步常量
- [ ] `src/types/ppt.ts` / `src/schemas/ppt.ts` 清理
- [ ] `src/lib/ppt/schemas/ppt.ts` 同步或下线
- [ ] `pnpm lint` 通过
- [ ] `pnpm build` 成功
- [ ] 手动测试通过（分类筛选/搜索/首屏渲染）
