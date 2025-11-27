# PPT 模块实现计划

> 基于 MkSaaS 框架开发标准，本文档定义 PPT 模块从 Mock 数据迁移到真实数据库的完整实施计划。

**文档版本**: 1.0  
**更新日期**: 2025-11-27  
**前置依赖**: [MkSaaS框架开发标准.md](./MkSaaS框架开发标准.md)

---

## 1. 现状分析

### 1.1 已有资源

| 资源 | 位置 | 状态 |
|------|------|------|
| 数据库 Schema | `src/db/schema.ts` | ✅ 已定义 ppt 表 |
| 类型定义 | `src/lib/types/ppt/` | ✅ 已定义 |
| Mock Actions | `src/actions/ppt/` | ⚠️ 使用 mock 数据 |
| Hooks | `src/hooks/ppt/` | ✅ 已定义，调用 mock actions |
| 营销页面 | `src/app/[locale]/(marketing)/ppt/` | ⚠️ 使用前端 mock |
| 管理组件 | `src/components/ppt/admin/` | ⚠️ 使用 mock 数据 |

### 1.2 需要补全的链路

```
┌─────────────────────────────────────────────────────────────┐
│                      PPT 模块数据流                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [页面/组件] ──→ [Hooks] ──→ [Actions] ──→ [Drizzle] ──→ [DB]  │
│       ↑                                                     │
│       └──────────── [API Routes] ←─────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘

需要改造:
1. Actions: mock → Drizzle 真实查询
2. API Routes: 新增 /api/ppt/* 路由
3. 页面: 前端 mock → 调用 hooks/API
4. 存储: 接入 S3 上传
5. 计费: 可选，下载消耗积分
```

---

## 2. 实施阶段

### Phase 1: 数据层改造 (预计 1-2 天)

#### 1.1 改造 `src/actions/ppt/ppt.ts`

**目标**: 将 mock 数据替换为 Drizzle 真实查询

**改造清单**:

| 函数 | 当前状态 | 改造内容 |
|------|----------|----------|
| `getPPTs` | mock 数组过滤 | Drizzle 分页查询 |
| `getPPTById` | mock 数组查找 | Drizzle eq 查询 |
| `createPPT` | console.log | Drizzle insert |
| `updatePPT` | console.log | Drizzle update |
| `deletePPT` | console.log | Drizzle delete |

**代码模板**:

```typescript
// src/actions/ppt/ppt.ts
'use server';

import { getDb } from '@/db';
import { ppt } from '@/db/schema';
import { adminActionClient, userActionClient } from '@/lib/safe-action';
import { eq, and, desc, asc, ilike, count as countFn, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { z } from 'zod';

// Schema 定义
const getPPTsSchema = z.object({
  pageIndex: z.number().min(0).default(0),
  pageSize: z.number().min(1).max(100).default(10),
  search: z.string().optional().default(''),
  category: z.string().optional(),
  status: z.string().optional(),
  sorting: z.array(z.object({
    id: z.string(),
    desc: z.boolean(),
  })).optional().default([]),
});

// 列表查询
export const getPPTsAction = userActionClient
  .schema(getPPTsSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { pageIndex, pageSize, search, category, status, sorting } = parsedInput;
      const offset = pageIndex * pageSize;
      
      const db = await getDb();
      
      // 构建查询条件
      const conditions = [];
      if (search) {
        conditions.push(or(
          ilike(ppt.title, `%${search}%`),
          ilike(ppt.description, `%${search}%`)
        ));
      }
      if (category) {
        conditions.push(eq(ppt.category, category));
      }
      if (status) {
        conditions.push(eq(ppt.status, status));
      }
      
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      
      // 排序
      const sortConfig = sorting[0];
      const sortField = sortConfig?.id === 'downloads' ? ppt.downloads 
                      : sortConfig?.id === 'title' ? ppt.title 
                      : ppt.createdAt;
      const sortDirection = sortConfig?.desc ? desc : asc;
      
      // 执行查询
      const [items, [{ count }]] = await Promise.all([
        db.select().from(ppt).where(where)
          .orderBy(sortDirection(sortField))
          .limit(pageSize).offset(offset),
        db.select({ count: countFn() }).from(ppt).where(where),
      ]);
      
      return {
        success: true,
        data: { items, total: Number(count) },
      };
    } catch (error) {
      console.error('get ppts error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch PPTs',
      };
    }
  });
```

#### 1.2 改造 `src/actions/ppt/stats.ts`

**目标**: 真实统计数据

```typescript
export const getDashboardStatsAction = adminActionClient
  .action(async () => {
    try {
      const db = await getDb();
      
      const [pptCount] = await db.select({ count: countFn() }).from(ppt);
      const [userCount] = await db.select({ count: countFn() }).from(user);
      const [downloadSum] = await db
        .select({ total: sql<number>`COALESCE(SUM(${ppt.downloads}), 0)` })
        .from(ppt);
      
      return {
        success: true,
        data: {
          totalPPTs: Number(pptCount.count),
          totalUsers: Number(userCount.count),
          totalDownloads: Number(downloadSum.total),
          todayDownloads: 0,  // TODO: 需要下载记录表
          weeklyGrowth: 0,    // TODO: 需要历史数据
        },
      };
    } catch (error) {
      console.error('get dashboard stats error:', error);
      return { success: false, error: 'Failed to fetch stats' };
    }
  });
```

#### 1.3 新增 `src/actions/ppt/download.ts`

**目标**: 下载/浏览计数

```typescript
'use server';

import { getDb } from '@/db';
import { ppt } from '@/db/schema';
import { userActionClient } from '@/lib/safe-action';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

// 增加浏览量
export const incrementViewAction = userActionClient
  .schema(z.object({ pptId: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const db = await getDb();
      await db.update(ppt)
        .set({ views: sql`${ppt.views} + 1` })
        .where(eq(ppt.id, parsedInput.pptId));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to increment view' };
    }
  });

// 下载 PPT (增加下载量 + 返回下载链接)
export const downloadPPTAction = userActionClient
  .schema(z.object({ pptId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      const db = await getDb();
      
      // 获取 PPT 信息
      const [pptRecord] = await db.select()
        .from(ppt)
        .where(eq(ppt.id, parsedInput.pptId))
        .limit(1);
      
      if (!pptRecord) {
        return { success: false, error: 'PPT not found' };
      }
      
      // 增加下载量
      await db.update(ppt)
        .set({ downloads: sql`${ppt.downloads} + 1` })
        .where(eq(ppt.id, parsedInput.pptId));
      
      return {
        success: true,
        data: { downloadUrl: pptRecord.fileUrl },
      };
    } catch (error) {
      return { success: false, error: 'Failed to download' };
    }
  });
```

---

### Phase 2: API 路由层 (预计 0.5 天)

#### 2.1 新增 `src/app/api/ppt/route.ts`

**改造方案**: Server Component + Client Component 混合模式

```typescript
// src/app/[locale]/(marketing)/ppt/page.tsx
import { getPPTsAction } from '@/actions/ppt';
import { PPTListClient } from '@/components/ppt/ppt-list-client';

export default async function PPTListPage() {
  // 服务端获取初始数据
  const result = await getPPTsAction({ pageIndex: 0, pageSize: 12 });
  
  return (
    <PPTListClient 
      initialData={result?.data?.success ? result.data.data : null}
      initialError={result?.data?.success ? null : result?.data?.error}
    />
  );
}

export async function generateMetadata() {
  return {
    title: 'PPT 模板库 | MkSaaS',
    description: '海量精选 PPT 模板，一键下载',
  };
}
```

```typescript
// src/components/ppt/ppt-list-client.tsx
'use client';

import { usePPTs } from '@/hooks/ppt';
import { PPTCard } from './ppt-card';
import { SearchFilters } from './search-filters';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';

interface Props {
  initialData: { items: PPT[]; total: number } | null;
  initialError: string | null;
}

export function PPTListClient({ initialData, initialError }: Props) {
  const [params, setParams] = useState({
    pageIndex: 0,
    pageSize: 12,
    search: '',
    category: undefined,
  });
  
  const { data, isLoading, error } = usePPTs(params, {
    initialData,
  });
  
  if (error || initialError) {
    return <ErrorComponent message={error?.message || initialError} />;
  }
  
  return (
    <div>
      <SearchFilters 
        onSearch={(search) => setParams(prev => ({ ...prev, search, pageIndex: 0 }))}
        onCategoryChange={(category) => setParams(prev => ({ ...prev, category, pageIndex: 0 }))}
      />
      
      {isLoading ? (
        <PPTGridSkeleton />
      ) : (
        <PPTGrid items={data?.items || []} />
      )}
      
      <Pagination 
        total={data?.total || 0}
        pageIndex={params.pageIndex}
        pageSize={params.pageSize}
        onChange={(pageIndex) => setParams(prev => ({ ...prev, pageIndex }))}
      />
    </div>
  );
}
```

#### 4.2 改造 `/ppt/[id]/page.tsx` (详情页)

```typescript
// src/app/[locale]/(marketing)/ppt/[id]/page.tsx
import { getPPTByIdAction, incrementViewAction } from '@/actions/ppt';
import { PPTDetailClient } from '@/components/ppt/ppt-detail-client';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PPTDetailPage({ params }: Props) {
  const { id } = await params;
  
  // 获取 PPT 详情
  const result = await getPPTByIdAction({ id });
  
  if (!result?.data?.success || !result.data.data) {
    notFound();
  }
  
  // 增加浏览量 (服务端)
  await incrementViewAction({ pptId: id });
  
  return <PPTDetailClient ppt={result.data.data} />;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const result = await getPPTByIdAction({ id });
  
  if (!result?.data?.success) {
    return { title: 'PPT Not Found' };
  }
  
  const ppt = result.data.data;
  return {
    title: `${ppt.title} | MkSaaS PPT`,
    description: ppt.description || `下载 ${ppt.title} PPT 模板`,
  };
}
```

#### 4.3 改造 `/ppt/category/[name]/page.tsx` (分类页)

```typescript
// src/app/[locale]/(marketing)/ppt/category/[name]/page.tsx
import { getPPTsAction } from '@/actions/ppt';
import { PPTListClient } from '@/components/ppt/ppt-list-client';

interface Props {
  params: Promise<{ name: string }>;
}

export default async function PPTCategoryPage({ params }: Props) {
  const { name } = await params;
  const decodedCategory = decodeURIComponent(name);
  
  const result = await getPPTsAction({
    pageIndex: 0,
    pageSize: 12,
    category: decodedCategory,
  });
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{decodedCategory}</h1>
      <PPTListClient 
        initialData={result?.data?.success ? result.data.data : null}
        initialError={result?.data?.success ? null : result?.data?.error}
        defaultCategory={decodedCategory}
      />
    </div>
  );
}
```

---

### Phase 5: 管理端接线 (预计 1 天)

#### 5.1 改造 PPT 列表表格

**文件**: `src/components/ppt/admin/ppt-list-table.tsx`

```typescript
'use client';

import { usePPTs, useDeletePPT } from '@/hooks/ppt';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './ppt-columns';
import { useState } from 'react';

export function PPTListTable() {
  const [params, setParams] = useState({
    pageIndex: 0,
    pageSize: 10,
    search: '',
    sorting: [],
  });
  
  const { data, isLoading } = usePPTs(params);
  const deleteMutation = useDeletePPT();
  
  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };
  
  return (
    <DataTable
      columns={columns}
      data={data?.items || []}
      total={data?.total || 0}
      pageIndex={params.pageIndex}
      pageSize={params.pageSize}
      isLoading={isLoading}
      onPaginationChange={(pageIndex, pageSize) => 
        setParams(prev => ({ ...prev, pageIndex, pageSize }))
      }
      onSearchChange={(search) => 
        setParams(prev => ({ ...prev, search, pageIndex: 0 }))
      }
      onSortingChange={(sorting) => 
        setParams(prev => ({ ...prev, sorting }))
      }
      onDelete={handleDelete}
    />
  );
}
```

#### 5.2 改造 PPT 编辑表单

**文件**: `src/components/ppt/admin/ppt-edit-form.tsx`

```typescript
'use client';

import { useCreatePPT, useUpdatePPT } from '@/hooks/ppt';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const formSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  category: z.string().min(1, '请选择分类'),
  description: z.string().optional(),
  fileUrl: z.string().url('请上传文件'),
  previewUrl: z.string().url().optional(),
});

interface Props {
  ppt?: PPT;
  onSuccess?: () => void;
}

export function PPTEditForm({ ppt, onSuccess }: Props) {
  const createMutation = useCreatePPT();
  const updateMutation = useUpdatePPT();
  const isEditing = !!ppt;
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: ppt || {
      title: '',
      category: '',
      description: '',
      fileUrl: '',
      previewUrl: '',
    },
  });
  
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: ppt.id, ...data });
        toast.success('更新成功');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('创建成功');
      }
      onSuccess?.();
    } catch (error) {
      toast.error(error.message || '操作失败');
    }
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* 表单字段... */}
      <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
        {isEditing ? '更新' : '创建'}
      </Button>
    </form>
  );
}
```

---

### Phase 6: 计费/权限集成 (可选, 预计 0.5 天)

#### 6.1 下载需要登录

```typescript
// 使用 userActionClient 自动检查登录状态
export const downloadPPTAction = userActionClient
  .schema(z.object({ pptId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    // ctx.user 已经是登录用户
    // 未登录会自动返回 Unauthorized
  });
```

#### 6.2 下载消耗积分

```typescript
import { hasEnoughCredits, consumeCredits } from '@/credits/credits';

export const downloadPPTAction = userActionClient
  .schema(z.object({ pptId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const user = ctx.user;
    const { pptId } = parsedInput;
    
    // 检查积分
    const DOWNLOAD_COST = 1;
    const hasCredits = await hasEnoughCredits({
      userId: user.id,
      requiredCredits: DOWNLOAD_COST,
    });
    
    if (!hasCredits) {
      return {
        success: false,
        error: '积分不足，请充值后再试',
        code: 'INSUFFICIENT_CREDITS',
      };
    }
    
    // 消耗积分
    await consumeCredits({
      userId: user.id,
      amount: DOWNLOAD_COST,
      description: `下载 PPT: ${pptId}`,
    });
    
    // 获取下载链接
    const db = await getDb();
    const [pptRecord] = await db.select()
      .from(ppt)
      .where(eq(ppt.id, pptId))
      .limit(1);
    
    if (!pptRecord) {
      return { success: false, error: 'PPT not found' };
    }
    
    // 增加下载量
    await db.update(ppt)
      .set({ downloads: sql`${ppt.downloads} + 1` })
      .where(eq(ppt.id, pptId));
    
    return {
      success: true,
      data: { downloadUrl: pptRecord.fileUrl },
    };
  });
```

#### 6.3 客户端处理积分不足

```typescript
// 在下载按钮组件中
const handleDownload = async (pptId: string) => {
  const result = await downloadPPTAction({ pptId });
  
  if (!result?.data?.success) {
    if (result?.data?.code === 'INSUFFICIENT_CREDITS') {
      // 显示充值提示
      toast.error('积分不足', {
        action: {
          label: '去充值',
          onClick: () => router.push('/settings/credits'),
        },
      });
    } else {
      toast.error(result?.data?.error || '下载失败');
    }
    return;
  }
  
  // 开始下载
  window.open(result.data.data.downloadUrl, '_blank');
  toast.success('下载开始');
};
```

---

## 3. 实施时间表

| 阶段 | 任务 | 预计时间 | 依赖 |
|------|------|----------|------|
| Phase 1 | 数据层改造 | 1-2 天 | 无 |
| Phase 2 | API 路由层 | 0.5 天 | Phase 1 |
| Phase 3 | 存储集成 | 0.5 天 | Phase 1 |
| Phase 4 | 营销页面改造 | 1 天 | Phase 1, 2 |
| Phase 5 | 管理端接线 | 1 天 | Phase 1, 2 |
| Phase 6 | 计费/权限 | 0.5 天 | Phase 1-5 |

**总计**: 4.5-5.5 天

---

## 4. 测试检查清单

### 4.1 数据层测试

- [ ] `getPPTsAction` 分页正确
- [ ] `getPPTsAction` 搜索过滤正确
- [ ] `getPPTsAction` 分类过滤正确
- [ ] `getPPTByIdAction` 返回正确数据
- [ ] `createPPTAction` 创建成功
- [ ] `updatePPTAction` 更新成功
- [ ] `deletePPTAction` 删除成功
- [ ] `incrementViewAction` 浏览量增加
- [ ] `downloadPPTAction` 下载量增加

### 4.2 API 测试

- [ ] `GET /api/ppt` 返回列表
- [ ] `GET /api/ppt?search=xxx` 搜索正确
- [ ] `GET /api/ppt/:id` 返回详情
- [ ] `PUT /api/ppt/:id` 更新成功
- [ ] `DELETE /api/ppt/:id` 删除成功
- [ ] `POST /api/ppt/download` 返回下载链接

### 4.3 页面测试

- [ ] `/ppt` 列表页加载正常
- [ ] `/ppt` 搜索功能正常
- [ ] `/ppt` 分页功能正常
- [ ] `/ppt/:id` 详情页加载正常
- [ ] `/ppt/:id` 浏览量增加
- [ ] `/ppt/category/:name` 分类页正常
- [ ] `/admin/ppts` 管理页正常
- [ ] 创建/编辑/删除功能正常

### 4.4 计费测试 (如启用)

- [ ] 未登录用户无法下载
- [ ] 积分不足时提示充值
- [ ] 下载成功后积分扣除
- [ ] 积分交易记录正确

---

## 5. 风险与注意事项

### 5.1 数据迁移

如果已有 mock 数据需要保留，需要编写迁移脚本：

```typescript
// scripts/migrate-ppt-data.ts
import { getDb } from '@/db';
import { ppt } from '@/db/schema';
import { mockPPTs } from '@/lib/mock-data/ppts';
import { randomUUID } from 'crypto';

async function migrate() {
  const db = await getDb();
  
  for (const mockPPT of mockPPTs) {
    await db.insert(ppt).values({
      id: randomUUID(),
      title: mockPPT.title,
      category: mockPPT.category,
      // ... 映射其他字段
    });
  }
  
  console.log(`Migrated ${mockPPTs.length} PPTs`);
}

migrate();
```

### 5.2 向后兼容

- 保持 Action 返回格式不变
- 保持 Hook 接口不变
- 逐步替换，避免一次性大改

### 5.3 性能考虑

- 列表查询添加适当索引 (已在 schema 中定义)
- 考虑添加缓存层 (React Query 已提供客户端缓存)
- 大文件上传考虑分片

---

## 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.0 | 2025-11-27 | 初始版本，完整实施计划 |

---

**文档维护者**: MkSaaS 开发团队
