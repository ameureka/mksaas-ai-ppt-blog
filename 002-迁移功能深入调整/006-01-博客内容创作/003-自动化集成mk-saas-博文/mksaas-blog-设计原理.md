# MkSaaS 博客模块设计原理分析

> 分析时间：2025-12-02
> 目的：理解现有博客系统架构，为新内容集成提供依据

## 一、技术栈概览

```
┌─────────────────────────────────────────────────────────────┐
│                    MkSaaS 博客技术栈                         │
├─────────────────────────────────────────────────────────────┤
│  内容层    │  fumadocs-mdx  →  MDX 文件解析与管理            │
│  数据层    │  source.config.ts  →  Schema 定义与验证         │
│  路由层    │  Next.js App Router  →  动态路由与 SSG          │
│  展示层    │  React 组件  →  博客卡片、分页、分类筛选        │
└─────────────────────────────────────────────────────────────┘
```

## 二、核心文件结构

### 2.1 内容目录结构

```
content/
├── blog/                    # 博客文章
│   ├── algorithm.mdx        # 英文版
│   ├── algorithm.zh.mdx     # 中文版
│   └── ppt/                 # 新增 PPT 博客子目录
│       ├── marketing/
│       ├── business/
│       └── ...
├── category/                # 分类定义
│   ├── marketing.mdx
│   ├── marketing.zh.mdx
│   └── ...
└── author/                  # 作者定义
    ├── fox.mdx
    └── fox.zh.mdx
```

### 2.2 源码目录结构

```
src/
├── app/[locale]/(marketing)/blog/
│   ├── (blog)/
│   │   ├── page.tsx                    # 博客列表首页
│   │   ├── layout.tsx                  # 博客布局（含分类筛选）
│   │   ├── page/[page]/page.tsx        # 分页页面
│   │   └── category/[slug]/
│   │       ├── page.tsx                # 分类首页
│   │       └── page/[page]/page.tsx    # 分类分页
│   └── [...slug]/page.tsx              # 博客详情页
├── components/blog/
│   ├── blog-grid.tsx                   # 博客网格
│   ├── blog-card.tsx                   # 博客卡片
│   ├── blog-grid-with-pagination.tsx   # 带分页的网格
│   ├── blog-category-filter.tsx        # 分类筛选器
│   └── ...
└── lib/source.ts                       # 数据源定义
```

## 三、数据流设计

### 3.1 内容加载流程

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  MDX 文件    │ --> │  fumadocs    │ --> │  blogSource  │
│  content/    │     │  解析编译    │     │  数据接口    │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  React 组件  │ <-- │  页面组件    │ <-- │  getPages()  │
│  渲染展示    │     │  数据处理    │     │  获取文章    │
└──────────────┘     └──────────────┘     └──────────────┘
```

### 3.2 Schema 定义 (source.config.ts)

```typescript
// 博客文章 Schema
export const blog = defineCollections({
  type: 'doc',
  dir: 'content/blog',
  schema: frontmatterSchema.extend({
    image: z.string(),              // 封面图（必填）
    date: z.string().date(),        // 发布日期（必填）
    published: z.boolean().default(true),  // 发布状态
    premium: z.boolean().optional(), // 付费内容标记
    categories: z.array(z.string()), // 分类数组（必填）
    author: z.string(),             // 作者 ID（必填）
  }),
});

// 分类 Schema
export const category = defineCollections({
  type: 'doc',
  dir: 'content/category',
  schema: z.object({
    name: z.string(),               // 分类名称（必填）
    description: z.string().optional(), // 分类描述
  }),
});
```

## 四、分类系统设计

### 4.1 分类定义

分类通过 `content/category/` 目录下的 MDX 文件定义：

```yaml
# content/category/marketing.zh.mdx
---
name: 产品营销
description: 产品营销、营销方案相关的模板与制作指南
---
```

### 4.2 分类筛选逻辑

```typescript
// src/app/[locale]/(marketing)/blog/(blog)/category/[slug]/page.tsx

// 1. 获取分类信息
const category = categorySource.getPage([slug], locale);

// 2. 获取该语言的所有文章
const localePosts = blogSource.getPages(locale);

// 3. 筛选已发布文章
const publishedPosts = localePosts.filter((post) => post.data.published);

// 4. 按分类筛选
const filteredPosts = publishedPosts.filter((post) =>
  post.data.categories.some((cat) => cat === category.slugs[0])
);

// 5. 按日期排序
const sortedPosts = filteredPosts.sort((a, b) => {
  return new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
});
```

### 4.3 现有分类列表

| 分类 slug | 中文名称 | 用途 |
|-----------|----------|------|
| ai | AI | AI 相关 |
| business | 商务汇报 | 商务汇报 PPT |
| development | 开发 | 技术开发 |
| education | 教育培训 | 教育培训 PPT |
| general | 通用技巧 | 通用 PPT 技巧 |
| marketing | 产品营销 | 营销方案 PPT |
| product | 产品 | 产品相关 |
| project | 项目 | 项目管理 |
| proposal | 项目提案 | 项目提案 PPT |
| report | 述职报告 | 述职报告 PPT |
| tips | 技巧 | 实用技巧 |
| tutorial | 教程 | 使用教程 |
| year-end | 年终总结 | 年终总结 PPT |
| **paid-search** | **付费模板与搜索** | **新增** |

## 五、分页系统设计

### 5.1 分页配置

```typescript
// src/config/website.tsx
blog: {
  enable: true,
  paginationSize: 12,      // 每页显示 12 篇
  relatedPostsSize: 3,     // 相关文章 3 篇
},
```

### 5.2 分页逻辑

```typescript
// 计算分页
const currentPage = 1;
const blogPageSize = websiteConfig.blog.paginationSize;  // 12
const paginatedLocalePosts = sortedPosts.slice(
  (currentPage - 1) * blogPageSize,
  currentPage * blogPageSize
);
const totalPages = Math.ceil(sortedPosts.length / blogPageSize);
```

### 5.3 分页路由

```
/blog                      # 第 1 页
/blog/page/2               # 第 2 页
/blog/category/marketing   # 分类第 1 页
/blog/category/marketing/page/2  # 分类第 2 页
```

## 六、国际化设计

### 6.1 文件命名约定

```
xxx.mdx      # 英文版（默认语言）
xxx.zh.mdx   # 中文版
```

### 6.2 语言路由

```
/en/blog/xxx    # 英文版
/zh/blog/xxx    # 中文版
```

### 6.3 数据获取

```typescript
// 按语言获取文章
const localePosts = blogSource.getPages(locale);
```

## 七、静态生成 (SSG)

### 7.1 generateStaticParams

```typescript
// 生成所有静态页面参数
export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of LOCALES) {
    const localeCategories = categorySource
      .getPages(locale)
      .filter((category) => category.locale === locale);
    for (const category of localeCategories) {
      params.push({ locale, slug: category.slugs[0] });
    }
  }
  return params;
}
```

### 7.2 构建时生成

- 所有博客列表页
- 所有分类页
- 所有博客详情页
- 所有分页页面

## 八、与新内容的差异分析

### 8.1 目录结构差异

| 项目 | 现有设计 | 新内容 | 兼容性 |
|------|----------|--------|--------|
| 博客位置 | `content/blog/` 根目录 | `content/blog/ppt/` 子目录 | ⚠️ 需验证 |
| 文件命名 | `slug.mdx` / `slug.zh.mdx` | 中文文件名 | ⚠️ 需验证 |
| 分类引用 | 单个分类 | 单个分类 | ✅ 兼容 |

### 8.2 Frontmatter 差异

| 字段 | 现有设计 | 新内容 | 兼容性 |
|------|----------|--------|--------|
| title | 必填 | ✅ 有 | ✅ |
| description | 必填 | ✅ 有 | ✅ |
| image | 必填 | ✅ 有 | ✅ |
| date | 必填 | ✅ 有 | ✅ |
| published | 默认 true | ✅ 已设为 true | ✅ |
| categories | 必填数组 | ✅ 有 | ✅ |
| author | 必填 | ✅ 有 (fox) | ✅ |
| tags | 可选 | ✅ 有 | ✅ |
| seoKeywords | 可选 | ✅ 有 | ✅ |
| relatedPosts | 可选 | ✅ 有 | ✅ |

### 8.3 潜在问题

1. **子目录支持**: fumadocs-mdx 是否支持 `content/blog/ppt/` 子目录？
   - 需要验证 `dir: 'content/blog'` 是否递归扫描子目录

2. **中文文件名**: 文件名使用中文是否影响 URL 生成？
   - 可能需要在 frontmatter 中添加 `slug` 字段

3. **分类数量**: 新增 102 篇文章，分页是否正常？
   - 每页 12 篇，约 9 页，应该没问题

## 九、集成验证清单

### 9.1 构建前检查

```bash
# 1. 检查 Schema 兼容性
pnpm content  # 重新生成 .source 索引

# 2. 检查分类完整性
ls content/category/paid-search*

# 3. 检查文件格式
find content/blog/ppt -name "*.mdx" | head -5
```

### 9.2 构建验证

```bash
# 构建项目
pnpm build

# 检查是否有错误
# - Schema 验证错误
# - 分类不存在错误
# - 图片路径错误
```

### 9.3 运行时验证

```bash
# 启动开发服务器
pnpm dev

# 访问验证
# - /zh/blog  博客列表
# - /zh/blog/category/marketing  分类页
# - /zh/blog/ppt/marketing/xxx  文章详情
```

## 十、总结

### 10.1 MkSaaS 博客设计特点

1. **基于 fumadocs-mdx**: 使用 fumadocs 生态，MDX 文件自动解析
2. **Schema 驱动**: 通过 Zod Schema 定义和验证 Frontmatter
3. **静态生成**: 构建时生成所有页面，性能优秀
4. **国际化原生支持**: 通过文件命名约定实现多语言
5. **分类系统独立**: 分类作为独立内容类型管理

### 10.2 集成关键点

1. **确保 Schema 兼容**: Frontmatter 必须符合定义
2. **分类必须存在**: 引用的分类必须在 `content/category/` 中定义
3. **文件命名规范**: 遵循 `.mdx` / `.zh.mdx` 约定
4. **运行 pnpm content**: 添加新内容后需重新生成索引

### 10.3 下一步行动

1. 运行 `pnpm content` 重新生成索引
2. 运行 `pnpm build` 验证构建
3. 运行 `pnpm dev` 验证页面展示
4. 检查分类筛选、分页是否正常
