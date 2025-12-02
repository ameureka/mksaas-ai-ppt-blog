# 03 - PPT 模块设计方案

## 设计原则确立

### 核心原则：设计优先
> **重要**: 在修改任何代码之前，必须先创建设计文档并等待审核

**设计文档位置**: `/Users/ameureka/Desktop/mksaas-ai-ppt-blog/深入细化调整/002-分割任务-01页面-搜索-主页/`

**流程**:
```
需求分析 → 设计文档 → 用户审核 → 代码实现 → 验证测试
   ↑_______________|  如发现问题，回到设计阶段
```

## 已创建的设计文档

### 1. spec.md - 需求规格说明
**内容**:
- 功能需求清单
- 用户故事
- 验收标准
- 非功能性需求

**关键需求**:
1. PPT 模板浏览和搜索
2. 分类导航和筛选
3. 详情页展示和下载
4. 管理后台（优先级低）
5. 统计分析

### 2. PLAN.md - 项目计划
**内容**:
- 项目范围
- 时间规划
- 里程碑
- 风险评估

**实施阶段**:
- **阶段 1**: 数据库集成（已完成）
- **阶段 2**: API 层实现（已完成）
- **阶段 3**: 前端集成（进行中）
- **阶段 4**: 下载功能（设计中）
- **阶段 5**: 管理后台（待定）

### 3. 工程方案.md - 技术方案
**架构决策**:

#### 数据层
```
[PostgreSQL (Neon)]
        ↓
[Drizzle ORM]
        ↓
[Server Actions]
        ↓
[API Routes (可选)]
        ↓
[TanStack Query Hooks]
        ↓
[React Components]
```

#### SSR 优先策略
```typescript
// 优先使用 Server Components
export default async function PPTPage() {
  const data = await getPPTs(); // Server Action
  return <PPTList data={data} />;
}

// 客户端交互使用 Client Components
'use client';
export function PPTList({ data }) {
  const { data: ppts } = useGetPPTs(); // TanStack Query
  return <div>{/* render */}</div>;
}
```

### 4. 实施步骤.md - 实现步骤
**步骤清单**:

#### Step 1: Schema 对齐 ✅
- 将 Drizzle schema 与实际数据库对齐
- 字段名映射：`download_count` → `downloadCount`
- 添加缺失的索引

#### Step 2: Server Actions ✅
- 实现 CRUD 操作
- 实现统计查询
- 实现下载记录

#### Step 3: API Routes ✅
- `/api/ppts` - 列表端点
- `/api/ppts/[id]` - 详情端点
- `/api/ppts/[id]/download` - 下载端点

#### Step 4: Hooks 层 🔄
- `use-get-ppts` - 列表查询
- `use-get-ppt` - 详情查询
- `use-create-ppt` - 创建（管理员）
- `use-update-ppt` - 更新（管理员）
- `use-delete-ppt` - 删除（管理员）

#### Step 5: UI 集成 🔄
- 搜索列表页
- 分类页面
- 详情页
- 下载模态框

### 5. 接口设计草案.md - API 接口设计

#### GET /api/ppts
**请求参数**:
```typescript
{
  search?: string;        // 搜索关键词
  category?: string;      // 分类 slug
  language?: string;      // 语言
  sortBy?: string;        // 排序字段
  sortOrder?: 'asc' | 'desc';
  page?: number;          // 页码（默认 1）
  pageSize?: number;      // 每页数量（默认 12）
}
```

**响应格式**:
```typescript
{
  success: boolean;
  data: {
    items: PPT[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  };
}
```

#### GET /api/ppts/[id]
**响应格式**:
```typescript
{
  success: boolean;
  data: PPT;
}
```

#### POST /api/ppts/[id]/download
**请求体**:
```typescript
{
  method?: 'free' | 'credits' | 'ad' | 'register';
}
```

**响应格式**:
```typescript
{
  success: boolean;
  data: {
    fileUrl: string;
  };
}
```

### 6. 热门搜索设计草案.md - 热门关键词设计

#### 方案选择
**初期方案**: 静态配置
```typescript
// src/config/ppt-config.tsx
export const HOT_KEYWORDS = [
  '年终总结',
  '商务汇报',
  '教育培训',
  '产品营销',
  // ...
];
```

**未来方案**: 动态统计
```typescript
// 基于搜索日志统计
SELECT
  search_keyword,
  COUNT(*) as count
FROM search_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY search_keyword
ORDER BY count DESC
LIMIT 10;
```

### 7. 种子数据与数据库说明.md - 数据准备

#### 已有数据
- **总数**: 68 条 PPT 记录
- **字段**: 已包含所有必要字段
- **索引**: 已添加性能索引

#### 字段映射
```typescript
// 数据库字段 → DTO 字段
{
  download_count: number;    // → downloads: number
  view_count: number;        // → views: number
  thumbnail_url: string;     // → preview_url: string
  cover_image_url: string;   // → (备用预览图)
  // ...
}
```

#### 缺失字段处理
```typescript
// DB 中不存在的字段
{
  description: undefined,     // 返回 undefined
  file_size: '',              // 返回空字符串
}

// 前端显示
{
  description: row.description ?? '暂无描述',
  file_size: row.file_size || '未知大小',
}
```

## 关键设计决策

### 1. 分类系统
**Category Slug 映射**:
```typescript
const CATEGORY_SLUG_MAP = {
  'business': '商务汇报',
  'education': '教育培训',
  'technology': '技术报告',
  'creative': '创意设计',
  'marketing': '产品营销',
  'medical': '医疗健康',
  'finance': '金融财务',
  'hr': '人力资源',
  'lifestyle': '生活方式',
  'general': '其他分类',
};
```

**URL 设计**:
```
/ppt/category/business      → 商务汇报分类
/ppt/category/education     → 教育培训分类
```

### 2. 下载功能设计
**配置开关**:
```typescript
// src/config/website.tsx
features: {
  pptRequireLoginForDownload: false,  // 默认不需要登录
}
```

**下载流程**:
```
用户点击下载
  ↓
检查 pptRequireLoginForDownload
  ├─ false → 直接下载
  └─ true  → 检查登录状态
       ├─ 已登录 → 下载
       └─ 未登录 → 显示登录模态框
```

### 3. 数据转换层
**DTO 转换**:
```typescript
const toPPTDto = (row: typeof pptTable.$inferSelect): PPT => ({
  id: row.id,
  title: row.title,
  category: (row.category ?? 'general') as PPT['category'],
  author: row.author ?? 'Unknown',
  description: undefined,  // DB 不存在
  slides_count: row.slidesCount ?? 0,
  file_size: '',           // DB 不存在
  file_url: row.fileUrl,
  preview_url: row.thumbnailUrl ?? row.coverImageUrl ?? undefined,
  downloads: row.downloadCount ?? 0,
  views: row.viewCount ?? 0,
  status: (row.status ?? 'draft') as PPT['status'],
  uploaded_at: row.createdAt?.toISOString(),
  created_at: row.createdAt?.toISOString(),
  updated_at: row.updatedAt?.toISOString(),
});
```

### 4. 搜索与过滤
**支持的过滤器**:
```typescript
interface PPTListParams {
  search?: string;         // 标题搜索
  category?: string;       // 分类过滤
  language?: string;       // 语言过滤
  status?: string;         // 状态过滤（管理员）
  fromDate?: string;       // 起始日期
  toDate?: string;         // 结束日期
  sortBy?: string;         // 排序字段
  sortOrder?: 'asc' | 'desc';  // 排序方向
  page?: number;           // 页码
  pageSize?: number;       // 每页数量
}
```

**SQL 构建**:
```typescript
const buildWhere = (params?: PPTListParams) => {
  const conditions = [];

  if (params?.search) {
    conditions.push(ilike(pptTable.title, `%${params.search}%`));
  }

  if (params?.category) {
    conditions.push(eq(pptTable.category, params.category));
  }

  // ... 其他条件

  return conditions.length > 0 ? and(...conditions) : undefined;
};
```

### 5. 性能优化
**索引策略**:
```sql
-- 分类查询优化
CREATE INDEX ppt_category_idx ON ppt(category);

-- 排序优化
CREATE INDEX ppt_download_count_idx ON ppt(download_count);
CREATE INDEX ppt_view_count_idx ON ppt(view_count);
CREATE INDEX ppt_created_at_idx ON ppt(created_at);
```

**分页策略**:
```typescript
// 默认每页 12 条
const DEFAULT_PAGE_SIZE = 12;

// 限制最大页面大小
const MAX_PAGE_SIZE = 100;

// 分页参数规范化
function normalizePagination(page?: number, pageSize?: number) {
  return {
    page: Math.max(1, page ?? 1),
    pageSize: Math.min(MAX_PAGE_SIZE, Math.max(1, pageSize ?? DEFAULT_PAGE_SIZE)),
  };
}
```

## 设计评审要点

### 需要确认的问题
1. ✅ **分类系统**: 使用 slug 还是中文名称？ → **决定：slug**
2. ✅ **下载开关**: 默认是否需要登录？ → **决定：默认不需要（false）**
3. ⏳ **热门关键词**: 静态配置还是动态统计？ → **决定：先静态，后动态**
4. ✅ **缺失字段**: description 和 file_size 如何处理？ → **决定：返回 undefined/空，前端显示"暂无"**
5. ⏳ **管理后台**: 何时实施？ → **待定：优先级低**

### 潜在风险
1. **数据库性能**: 68 条记录目前无问题，需监控增长后的性能
2. **字段扩展**: 未来可能需要添加 description 和 file_size 字段
3. **热门搜索**: 静态配置不能反映实际搜索趋势，需要后续实现统计功能
4. **下载安全**: 目前直接返回文件 URL，未来可能需要签名 URL 防止盗链

### 设计优势
1. ✅ **SSR 优先**: 良好的 SEO 和首屏性能
2. ✅ **类型安全**: 端到端的 TypeScript 类型检查
3. ✅ **可扩展性**: Server Actions + API Routes 双层设计
4. ✅ **国际化**: 完整的 i18n 支持
5. ✅ **配置驱动**: 通过 feature flags 控制功能

## 下一步
1. ✅ 用户审核设计文档
2. ✅ 开始代码实现
3. 🔄 前端页面集成
4. ⏳ 下载功能实现
5. ⏳ 管理后台开发
