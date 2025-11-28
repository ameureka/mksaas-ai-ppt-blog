# PPT 搜索/推荐主页 (/ppt) V2.0 规格说明书

> **文档状态**: 2025-11-28 已更新
> **对应版本**: Release V1.0 (去 Mock 化)

## 1. 页面概述
- **路由**: `/ppt`
- **定位**: 营销着陆页 + 搜索入口 + 模板列表展示。
- **数据源**: 实时数据库 (Neon PostgreSQL via Drizzle ORM)。

## 2. 核心功能规格

### 2.1 搜索与筛选
- **输入**: 关键词 (Title/Author 模糊匹配)。
- **筛选维度**:
  - **Category**: 必须使用 Slug 匹配 (如 `business`, `education`)。
  - **Language**: `zh` (中文) / `en` (英文) / `all` (全部)。
  - **Sort**:
    - `popular`: View Count DESC
    - `newest`: Created At DESC
    - `downloads`: Download Count DESC
- **交互**: 筛选条件改变时，触发重新请求 (Server Action 或 API)，**禁止客户端过滤**。

### 2.2 列表展示
- **分页**: 支持 `page` / `pageSize` (默认 12)。
- **卡片信息**:
  - 封面图/缩略图
  - 标题
  - 作者
  - 统计数据 (下载量, 浏览量)
  - 标签 (Tags)
- **状态**:
  - Loading: 骨架屏 (Skeleton)
  - Empty: "未找到相关模板" 提示
  - Error: 错误提示 + 重试按钮

### 2.3 下载功能
- **流程**:
  1. 用户点击下载。
  2. 前端调用 Action。
  3. 后端检查权限 (V1 默认放行，V2 检查登录)。
  4. 后端记录下载 (原子 +1)。
  5. 返回文件直链。
  6. 前端触发浏览器下载。

---

## 3. 接口与数据契约

### 3.1 数据模型 (PPT DTO)
前端组件统一使用以下接口：

```typescript
interface PPT {
  id: string;
  title: string;
  category: string;      // slug
  author: string;
  file_url: string;
  preview_url: string;
  downloads: number;
  views: number;
  tags: string[];        // Array<string>
  language: string;      // 'zh' | 'en'
  created_at: string;    // ISO
}
```

### 3.2 常量配置
前端必须引用统一常量，不得硬编码：

```typescript
// src/lib/constants/ppt.ts
export const PPT_CATEGORIES = [
  { slug: 'business', label: '商务汇报', ... },
  // ... 确保 Slug 唯一
];

export const HOT_KEYWORDS = [...];
```

---

## 4. 性能与 SEO
- **SEO**: 页面需包含 JSON-LD 结构化数据 (SearchAction)。
- **Performance**: 
    - 列表图片需使用 `next/image` 优化或 CDN 缩略图。
    - **配置**: `next.config.ts` 必须包含图片源域名白名单。
- **容错性**: 
    - 图片加载失败需显示占位图。
    - 缺少 `description` / `file_size` 时，UI 应优雅降级（隐藏对应区块）。
- **Caching**: 热门查询结果建议在 Action 层做短暂缓存 (待定)。

## 5. 废弃特性 (V1)
- ❌ **客户端随机数**: 不再在前端生成随机下载量/浏览量。
- ❌ **虚拟下载**: 不再只弹 Toast 不下载。
- ❌ **Mock API**: 不再使用 `lib/api/mock` 下的数据。