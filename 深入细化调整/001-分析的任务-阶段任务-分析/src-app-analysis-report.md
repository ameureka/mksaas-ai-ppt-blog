# src/app 页面与组件结构分析报告

> **生成时间**: 2025-11-28
> **分析目标**: 梳理 `/src/app/[locale]/(marketing)/ppt` 下的页面结构、组件依赖及数据流，确认现有代码资产。

## 1. 目录结构概览

```
src/app/[locale]/(marketing)/ppt/
├── page.tsx                    # 搜索主页 (SearchHomePage)
├── category/
│   └── [name]/
│       └── page.tsx            # 分类列表页 (CategoryPage)
└── [id]/
    └── page.tsx                # 详情页 (PPTDetailPage)
```

---

## 2. 页面深度分析

### 2.1 搜索主页 (`/ppt`)
**文件**: `src/app/[locale]/(marketing)/ppt/page.tsx`
**类型**: Client Component (`'use client'`)

**核心功能**:
- **Hero 搜索区**: 包含大搜索框和热门关键词 (Hardcoded)。
- **条件渲染**:
  - **未搜索状态**: 展示“热门分类”、“编辑精选”、“本周新品”模块。
  - **搜索状态**: 展示搜索结果列表 (`filteredResults`) 和侧边栏。
- **组件依赖**:
  - `SearchSidebar` (`@/components/ppt/search-sidebar`): 侧边栏，包含热门搜索、分类推荐、最近下载。
  - `PPTCard` (`@/components/ppt/ppt-card`): 核心展示卡片。
  - `BannerAd` (`@/components/ppt/ads/display-ad`): 广告位占位。
  - `SearchFilters` (`@/components/ppt/search-filters`): 筛选栏。
- **数据流**:
  - `useEffect` 调用 `/api/ppts` 获取初始数据。
  - `handleSearch` 调用 `/api/ppts?search=...`。
  - **问题**: 存在大量硬编码数据 (`hotKeywords`, `categories`) 和客户端过滤逻辑。

### 2.2 分类列表页 (`/ppt/category/[name]`)
**文件**: `src/app/[locale]/(marketing)/ppt/category/[name]/page.tsx`
**类型**: Client Component (`'use client'`)

**核心功能**:
- **分类详情**: 根据 URL 中的 `[name]` (作为 slug) 查找硬编码的分类元数据（标题、描述、统计）。
- **列表展示**: 展示该分类下的 PPT 列表。
- **混合流**: 列表中穿插了 `NativeAdCard` (原生广告卡片)。
- **组件依赖**:
  - `PPTCard`: 复用。
  - `BannerAd`, `NativeAdCard`: 广告组件。
- **数据流**:
  - `useEffect` 调用 `/api/ppts?category=[name]`。
  - 包含 Mock 的加载延迟 (`setTimeout`)。

### 2.3 详情页 (`/ppt/[id]`)
**文件**: `src/app/[locale]/(marketing)/ppt/[id]/page.tsx`
**类型**: Client Component (`'use client'`)

**核心功能**:
- **两栏布局**: 左侧幻灯片预览，右侧信息与下载。
- **交互**:
  - 幻灯片预览器 (Image Gallery)。
  - 下载按钮 (触发 `DownloadModal`)。
  - 收藏按钮 (触发 `LoginModal`)。
  - 评论区 (Mock 数据)。
- **组件依赖**:
  - `DownloadModal` (`@/components/ppt/download/download-modal`): 下载弹窗。
  - `LoginModal` (`@/components/ppt/auth/login-modal`): 登录弹窗。
  - `Reviews` (`@/components/ppt/reviews`): 评论组件。
  - `RelatedPPTs`: 相关推荐。
- **数据流**:
  - `useEffect` 调用 `/api/ppts/[id]`。
  - 包含 Mock 的相关推荐数据。

---

## 3. 关键 UI 组件库 (`src/components/ppt/`)

| 组件名 | 路径 | 状态 | 描述 |
| :--- | :--- | :--- | :--- |
| **PPTCard** | `ppt-card.tsx` | ✅ 成熟 | 包含封面、标题、统计信息、Hover 效果。支持 Skeleton 状态。 |
| **SearchSidebar** | `search-sidebar.tsx` | ✅ 成熟 | 包含热门搜索、分类导航、下载榜单。 |
| **SearchFilters** | `search-filters.tsx` | ✅ 成熟 | 下拉筛选框 (分类、语言、排序)。 |
| **BannerAd** | `ads/display-ad.tsx` | ⚠️ 占位 | 简单的广告位占位符。 |
| **DownloadModal** | `download/download-modal.tsx` | ⚠️ Mock | 包含下载选项、格式选择，但逻辑是 Mock 的。 |
| **LoginModal** | `auth/login-modal.tsx` | ⚠️ Mock | 简单的登录提示弹窗。 |

---

## 4. 结论与迁移建议

**现状确认**:
1.  **页面架构完整**: 搜索页、分类页、详情页的 UI 骨架和交互逻辑已经非常完整。
2.  **组件复用率高**: `PPTCard`, `SearchSidebar` 等核心组件被多个页面复用，无需重写。
3.  **Mock 渗透深**: 页面内部充斥着 `setTimeout` 模拟延迟、硬编码的 `const categories`、以及假的 API 调用。

**对 "Draft First" 策略的影响**:
- **不必重写组件**: 我们不需要从头编写 `list-page.tsx` 和 `detail-page.tsx` 的 UI 部分。
- **重点是“替换内核”**: 我们的工作重点是将这些页面的**数据获取逻辑 (fetch/useEffect)** 替换为 **Server Actions**，并将硬编码的配置替换为统一的常量引用。

**修正后的 Draft 策略**:
在 `code-drafts/` 中创建页面时，应**直接复制**现有页面的 UI 代码，然后进行“外科手术式”的修改（替换数据源、移除 Mock），而不是重新发明轮子。
