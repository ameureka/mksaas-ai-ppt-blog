# MkSaaS 框架开发标准规范

> 本文档定义了 MkSaaS 项目的开发标准，所有新功能模块（如 PPT 模块）必须遵循这些规范，以确保代码一致性和可维护性。

**文档版本**: 1.0  
**更新日期**: 2025-11-27  
**适用范围**: 数据层、Server Actions、API 路由、Hooks、存储、页面、计费/权限

---

## 目录

1. [数据层标准 (Drizzle ORM)](#1-数据层标准-drizzle-orm)
2. [Server Actions 标准](#2-server-actions-标准)
3. [API 路由标准](#3-api-路由标准)
4. [Hooks 标准](#4-hooks-标准)
5. [存储集成标准](#5-存储集成标准)
6. [页面开发标准](#6-页面开发标准)
7. [计费/权限集成标准](#7-计费权限集成标准)
8. [类型定义标准](#8-类型定义标准)
9. [文件组织标准](#9-文件组织标准)
10. [错误处理标准](#10-错误处理标准)

---

## 1. 数据层标准 (Drizzle ORM)

### 1.1 参考实现
- `src/credits/credits.ts` - 积分系统数据操作
- `src/actions/get-users.ts` - 用户列表查询

### 1.2 数据库连接

```typescript
// ✅ 正确: 使用 getDb() 获取数据库连接
import { getDb } from '@/db';

const db = await getDb();
const result = await db.select().from(ppt).where(eq(ppt.id, id));

// ❌ 错误: 直接导入 db 实例
import { db } from '@/db';  // 不要这样做
```

### 1.3 查询构建

```typescript
import { eq, and, desc, asc, ilike, count as countFn, or, isNull, gt } from 'drizzle-orm';

// 分页查询标准模式
const [items, [{ count }]] = await Promise.all([
  db.select()
    .from(ppt)
    .where(where)
    .orderBy(sortDirection(sortField))
    .limit(pageSize)
    .offset(offset),
  db.select({ count: countFn() })
    .from(ppt)
    .where(where),
]);
```

### 1.4 ID 生成

```typescript
import { randomUUID } from 'crypto';

// 插入新记录时使用 randomUUID()
await db.insert(ppt).values({
  id: randomUUID(),
  title: data.title,
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

### 1.5 字段命名规范

| 层级 | 命名风格 | 示例 |
|------|----------|------|
| 数据库字段 | snake_case | `file_url`, `created_at` |
| TypeScript 接口 | camelCase | `fileUrl`, `createdAt` |
| Schema 定义 | 两者映射 | `fileUrl: text('file_url')` |

---

## 2. Server Actions 标准

### 2.1 参考实现
- `src/actions/get-users.ts` - 管理员查询
- `src/actions/consume-credits.ts` - 用户操作
- `src/actions/create-checkout-session.ts` - 支付操作

### 2.2 文件结构

```typescript
'use server';  // 必须在文件顶部声明

import { getDb } from '@/db';
import { ppt } from '@/db/schema';
import { adminActionClient, userActionClient, actionClient } from '@/lib/safe-action';
import { z } from 'zod';
```

### 2.3 Safe Action 客户端选择

| 客户端 | 用途 | 权限要求 |
|--------|------|----------|
| `actionClient` | 公开操作 | 无需认证 |
| `userActionClient` | 用户操作 | 需要登录 |
| `adminActionClient` | 管理操作 | 需要管理员角色 |

### 2.4 输入验证 (Zod Schema)

```typescript
const getPPTsSchema = z.object({
  pageIndex: z.number().min(0).default(0),
  pageSize: z.number().min(1).max(100).default(10),
  search: z.string().optional().default(''),
  category: z.string().optional(),
  sorting: z.array(z.object({
    id: z.string(),
    desc: z.boolean(),
  })).optional().default([]),
  filters: z.array(z.object({
    id: z.string(),
    value: z.string(),
  })).optional().default([]),
});
```

### 2.5 Action 实现模板

```typescript
export const getPPTsAction = userActionClient
  .schema(getPPTsSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { pageIndex, pageSize, search, sorting, filters } = parsedInput;
      const user = ctx.user;  // 从 context 获取用户信息
      
      // 业务逻辑...
      
      return {
        success: true,
        data: { items, total },
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

### 2.6 返回格式标准

```typescript
// ✅ 成功响应
{ success: true, data: { items: [], total: 0 } }

// ✅ 失败响应
{ success: false, error: 'Error message' }

// ❌ 不要抛出异常，而是返回错误对象
throw new Error('Something went wrong');  // 不推荐
```

---

## 3. API 路由标准

### 3.1 参考实现
- `src/app/api/storage/upload/route.ts` - 文件上传
- `src/app/api/chat/route.ts` - AI 聊天

### 3.2 路由文件结构

```
src/app/api/
├── ppt/
│   ├── route.ts           # GET /api/ppt (列表)
│   ├── [id]/
│   │   └── route.ts       # GET/PUT/DELETE /api/ppt/:id
│   └── download/
│       └── route.ts       # POST /api/ppt/download
```

### 3.3 路由实现模板

```typescript
import { type NextRequest, NextResponse } from 'next/server';

// GET 请求
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 10;
    
    // 调用 action 或直接查询数据库
    const result = await getPPTsAction({ pageIndex: page - 1, pageSize });
    
    if (!result?.data?.success) {
      return NextResponse.json(
        { error: result?.data?.error || 'Failed to fetch' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching PPTs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST 请求
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // 验证和处理...
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error creating PPT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3.4 动态路由参数

```typescript
// src/app/api/ppt/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // 使用 id 查询...
}
```

---

## 4. Hooks 标准

### 4.1 参考实现
- `src/hooks/use-users.ts` - 用户管理 hooks
- `src/hooks/ppt/use-get-ppts.ts` - PPT 列表查询

### 4.2 Query Keys 定义

```typescript
// src/lib/ppt/query-keys.ts
export const pptKeys = {
  all: ['ppts'] as const,
  lists: () => [...pptKeys.all, 'lists'] as const,
  list: (params: PPTListParams) => [...pptKeys.lists(), params] as const,
  details: () => [...pptKeys.all, 'details'] as const,
  detail: (id: string) => [...pptKeys.details(), id] as const,
};
```

### 4.3 查询 Hook 模板

```typescript
'use client';

import { getPPTsAction } from '@/actions/ppt';
import { pptKeys } from '@/lib/ppt/query-keys';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export function usePPTs(params: PPTListParams) {
  return useQuery({
    queryKey: pptKeys.list(params),
    queryFn: async () => {
      const result = await getPPTsAction(params);
      if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to fetch PPTs');
      }
      return result.data.data;
    },
    placeholderData: keepPreviousData,  // 分页时保持旧数据
  });
}
```

### 4.4 变更 Hook 模板

```typescript
'use client';

import { deletePPTAction } from '@/actions/ppt';
import { pptKeys } from '@/lib/ppt/query-keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useDeletePPT() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deletePPTAction({ id });
      if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to delete');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('删除成功');
      // 刷新列表缓存
      queryClient.invalidateQueries({ queryKey: pptKeys.lists() });
    },
    onError: (error) => {
      toast.error(error.message || '删除失败');
    },
  });
}
```

### 4.5 Hook 文件组织

```
src/hooks/ppt/
├── index.ts              # 统一导出
├── use-get-ppts.ts       # 列表查询
├── use-get-ppt.ts        # 详情查询
├── use-create-ppt.ts     # 创建
├── use-update-ppt.ts     # 更新
└── use-delete-ppt.ts     # 删除
```

---

## 5. 存储集成标准

### 5.1 参考实现
- `src/app/api/storage/upload/route.ts` - 文件上传 API
- `src/storage/provider/s3.ts` - S3 存储提供者

### 5.2 上传文件

```typescript
// 客户端上传
const uploadFile = async (file: File, folder: string = 'ppts') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  
  const response = await fetch('/api/storage/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }
  
  return response.json();  // { url: 'https://...' }
};
```

### 5.3 文件类型限制

```typescript
// 当前支持的类型 (src/app/api/storage/upload/route.ts)
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

// PPT 模块需要扩展支持
const pptAllowedTypes = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/vnd.ms-powerpoint',  // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',  // .pptx
  'application/pdf',  // 预览用
];
```

### 5.4 文件大小限制

```typescript
// src/lib/constants.ts
export const MAX_FILE_SIZE = 10 * 1024 * 1024;  // 10MB

// PPT 文件可能需要更大限制
export const MAX_PPT_FILE_SIZE = 50 * 1024 * 1024;  // 50MB
```

---

## 6. 页面开发标准

### 6.1 参考实现
- `src/app/[locale]/(protected)/admin/users/page.tsx` - 管理页面
- `src/app/[locale]/(marketing)/blog/page.tsx` - 营销页面

### 6.2 Server Component (推荐用于 SEO 页面)

```typescript
// src/app/[locale]/(marketing)/ppt/page.tsx
import { getPPTsAction } from '@/actions/ppt';
import { PPTListClient } from '@/components/ppt/ppt-list-client';

export default async function PPTListPage() {
  // 服务端获取初始数据
  const result = await getPPTsAction({ pageIndex: 0, pageSize: 12 });
  
  if (!result?.data?.success) {
    return <ErrorComponent message={result?.data?.error} />;
  }
  
  // 传递给客户端组件
  return <PPTListClient initialData={result.data.data} />;
}

// 生成元数据
export async function generateMetadata() {
  return {
    title: 'PPT 模板库',
    description: '海量精选 PPT 模板下载',
  };
}
```

### 6.3 Client Component (用于交互复杂的页面)

```typescript
'use client';

import { usePPTs } from '@/hooks/ppt';
import { Skeleton } from '@/components/ui/skeleton';

export default function PPTListPage() {
  const [params, setParams] = useState({ page: 1, pageSize: 12 });
  const { data, isLoading, error } = usePPTs(params);
  
  if (isLoading) return <PPTListSkeleton />;
  if (error) return <ErrorComponent message={error.message} />;
  
  return (
    <div>
      <PPTGrid items={data.items} />
      <Pagination 
        total={data.total} 
        page={params.page}
        onChange={(page) => setParams(prev => ({ ...prev, page }))}
      />
    </div>
  );
}
```

### 6.4 混合模式 (推荐)

```typescript
// page.tsx (Server Component)
export default async function PPTListPage() {
  const initialData = await getPPTsAction({ pageIndex: 0, pageSize: 12 });
  return <PPTListClient initialData={initialData.data?.data} />;
}

// ppt-list-client.tsx (Client Component)
'use client';

export function PPTListClient({ initialData }) {
  const [params, setParams] = useState({ pageIndex: 0, pageSize: 12 });
  const { data } = usePPTs(params, { initialData });
  // 交互逻辑...
}
```

### 6.5 路由组织

```
src/app/[locale]/
├── (marketing)/           # 公开营销页面
│   └── ppt/
│       ├── page.tsx       # /ppt - 列表页
│       ├── [id]/
│       │   └── page.tsx   # /ppt/:id - 详情页
│       └── category/
│           └── [name]/
│               └── page.tsx  # /ppt/category/:name
├── (protected)/           # 需要登录的页面
│   └── admin/
│       └── ppts/
│           └── page.tsx   # /admin/ppts - 管理页面
```

---

## 7. 计费/权限集成标准

### 7.1 参考实现
- `src/credits/credits.ts` - 积分系统核心
- `src/actions/consume-credits.ts` - 积分消耗

### 7.2 权限检查

```typescript
// 使用 userActionClient 自动检查登录状态
export const downloadPPTAction = userActionClient
  .schema(z.object({ pptId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const user = ctx.user;  // 已登录用户
    // ...
  });

// 使用 adminActionClient 检查管理员权限
export const deletePPTAction = adminActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    // 只有管理员可以执行
  });
```

### 7.3 积分检查与消耗

```typescript
import { hasEnoughCredits, consumeCredits } from '@/credits/credits';

export const downloadPPTAction = userActionClient
  .schema(z.object({ pptId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const user = ctx.user;
    const { pptId } = parsedInput;
    
    // 1. 检查积分余额
    const hasCredits = await hasEnoughCredits({ 
      userId: user.id, 
      requiredCredits: 1 
    });
    
    if (!hasCredits) {
      return { 
        success: false, 
        error: 'Insufficient credits',
        code: 'INSUFFICIENT_CREDITS'
      };
    }
    
    // 2. 消耗积分
    await consumeCredits({
      userId: user.id,
      amount: 1,
      description: `Download PPT: ${pptId}`,
    });
    
    // 3. 执行业务逻辑
    const ppt = await getPPTById(pptId);
    await incrementDownloadCount(pptId);
    
    return { 
      success: true, 
      data: { downloadUrl: ppt.fileUrl } 
    };
  });
```

### 7.4 积分类型常量

```typescript
// src/credits/types.ts
export enum CREDIT_TRANSACTION_TYPE {
  MONTHLY_REFRESH = 'MONTHLY_REFRESH',
  REGISTER_GIFT = 'REGISTER_GIFT',
  PURCHASE_PACKAGE = 'PURCHASE_PACKAGE',
  SUBSCRIPTION_RENEWAL = 'SUBSCRIPTION_RENEWAL',
  LIFETIME_MONTHLY = 'LIFETIME_MONTHLY',
  USAGE = 'USAGE',
  EXPIRE = 'EXPIRE',
}
```

---

## 8. 类型定义标准

### 8.1 参考实现
- `src/lib/types/ppt/ppt.ts` - PPT 类型
- `src/credits/types.ts` - 积分类型

### 8.2 实体类型定义

```typescript
// src/lib/types/ppt/ppt.ts

// 枚举类型
export type PPTCategory = 'business' | 'product' | 'education' | 'marketing' | 'general';
export type PPTStatus = 'draft' | 'published' | 'archived';

// 实体类型 (与数据库对应，使用 camelCase)
export interface PPT {
  id: string;
  title: string;
  category: PPTCategory;
  author: string;
  description?: string;
  slidesCount: number;
  fileSize: string;
  fileUrl: string;
  previewUrl?: string;
  downloads: number;
  views: number;
  status: PPTStatus;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### 8.3 输入类型定义

```typescript
// 创建输入
export interface CreatePPTInput {
  title: string;
  category: PPTCategory;
  description?: string;
  fileUrl: string;
  previewUrl?: string;
}

// 更新输入
export interface UpdatePPTInput {
  title?: string;
  category?: PPTCategory;
  description?: string;
  status?: PPTStatus;
}
```

### 8.4 查询参数类型

```typescript
export interface PPTListParams {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  category?: PPTCategory;
  status?: PPTStatus;
  sorting?: { id: string; desc: boolean }[];
  filters?: { id: string; value: string }[];
}
```

### 8.5 响应类型

```typescript
// 通用列表响应
export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

// Action 响应
export type ServerActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
```

---

## 9. 文件组织标准

### 9.1 功能模块目录结构

```
src/
├── actions/
│   └── ppt/
│       ├── index.ts          # 统一导出
│       ├── ppt.ts            # PPT CRUD actions
│       ├── stats.ts          # 统计 actions
│       └── download.ts       # 下载相关 actions
│
├── app/
│   ├── api/ppt/
│   │   ├── route.ts          # GET /api/ppt
│   │   ├── [id]/route.ts     # GET/PUT/DELETE /api/ppt/:id
│   │   └── download/route.ts # POST /api/ppt/download
│   │
│   └── [locale]/
│       ├── (marketing)/ppt/  # 公开页面
│       └── (protected)/admin/ppts/  # 管理页面
│
├── components/ppt/
│   ├── ppt-card.tsx          # PPT 卡片组件
│   ├── ppt-grid.tsx          # PPT 网格组件
│   ├── ppt-list-client.tsx   # 列表客户端组件
│   └── admin/
│       ├── ppt-list-table.tsx    # 管理表格
│       ├── ppt-edit-form.tsx     # 编辑表单
│       └── ppt-delete-dialog.tsx # 删除对话框
│
├── hooks/ppt/
│   ├── index.ts              # 统一导出
│   ├── use-get-ppts.ts
│   ├── use-get-ppt.ts
│   ├── use-create-ppt.ts
│   ├── use-update-ppt.ts
│   └── use-delete-ppt.ts
│
├── lib/
│   ├── types/ppt/
│   │   ├── ppt.ts            # PPT 类型定义
│   │   └── server-action.ts  # Action 类型
│   └── ppt/
│       └── query-keys.ts     # React Query keys
│
└── db/
    └── schema.ts             # 包含 ppt 表定义
```

### 9.2 导出规范

```typescript
// src/actions/ppt/index.ts
export { getPPTsAction, getPPTByIdAction } from './ppt';
export { getDashboardStatsAction } from './stats';
export { downloadPPTAction, incrementViewAction } from './download';

// src/hooks/ppt/index.ts
export { usePPTs } from './use-get-ppts';
export { usePPT } from './use-get-ppt';
export { useCreatePPT } from './use-create-ppt';
export { useUpdatePPT } from './use-update-ppt';
export { useDeletePPT } from './use-delete-ppt';
```

---

## 10. 错误处理标准

### 10.1 Action 层错误处理

```typescript
export const getPPTsAction = userActionClient
  .schema(schema)
  .action(async ({ parsedInput }) => {
    try {
      // 业务逻辑
      return { success: true, data: result };
    } catch (error) {
      // 记录错误日志
      console.error('get ppts error:', error);
      
      // 返回友好错误信息
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch PPTs',
      };
    }
  });
```

### 10.2 API 层错误处理

```typescript
export async function GET(request: NextRequest) {
  try {
    // 业务逻辑
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error:', error);
    
    // 区分错误类型
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 10.3 客户端错误处理

```typescript
// Hook 中
const { data, error, isError } = usePPTs(params);

if (isError) {
  toast.error(error.message || '加载失败');
}

// Mutation 中
const deleteMutation = useDeletePPT();

deleteMutation.mutate(id, {
  onError: (error) => {
    toast.error(error.message || '删除失败');
  },
});
```

### 10.4 错误码规范

| 错误码 | 含义 | HTTP 状态码 |
|--------|------|-------------|
| `VALIDATION_FAILED` | 输入验证失败 | 400 |
| `UNAUTHORIZED` | 未登录 | 401 |
| `FORBIDDEN` | 无权限 | 403 |
| `NOT_FOUND` | 资源不存在 | 404 |
| `RATE_LIMITED` | 请求过于频繁 | 429 |
| `INSUFFICIENT_CREDITS` | 积分不足 | 402 |
| `INTERNAL_ERROR` | 服务器错误 | 500 |

---

## 附录 A: 快速参考

### A.1 常用导入

```typescript
// 数据库
import { getDb } from '@/db';
import { ppt, user } from '@/db/schema';
import { eq, and, desc, asc, ilike, count as countFn, or, isNull, gt } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Safe Action
import { actionClient, userActionClient, adminActionClient } from '@/lib/safe-action';
import { z } from 'zod';

// React Query
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

// Next.js
import { type NextRequest, NextResponse } from 'next/server';

// 积分系统
import { hasEnoughCredits, consumeCredits, addCredits } from '@/credits/credits';
import { CREDIT_TRANSACTION_TYPE } from '@/credits/types';

// UI 组件
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
```

### A.2 常用命令

```bash
# 开发
pnpm dev              # 启动开发服务器 (端口 3005)
pnpm build            # 构建生产版本
pnpm lint             # 代码检查

# 数据库
pnpm db:push          # 推送 schema 到数据库
pnpm db:generate      # 生成迁移文件
pnpm db:migrate       # 执行迁移
pnpm db:studio        # 打开数据库管理界面
```

### A.3 环境变量

```env
# 数据库
DATABASE_URL=postgresql://...

# 存储
STORAGE_REGION=auto
STORAGE_BUCKET_NAME=your-bucket
STORAGE_ACCESS_KEY_ID=...
STORAGE_SECRET_ACCESS_KEY=...
STORAGE_ENDPOINT=https://...
STORAGE_PUBLIC_URL=https://...
```

---

## 附录 B: 检查清单

### B.1 新功能开发检查清单

- [ ] Schema 定义在 `src/db/schema.ts`
- [ ] 类型定义在 `src/lib/types/{feature}/`
- [ ] Actions 使用 safe-action 客户端
- [ ] Actions 返回 `{ success, data/error }` 格式
- [ ] Hooks 使用 React Query
- [ ] Query Keys 集中管理
- [ ] 错误处理完整
- [ ] 日志记录关键操作
- [ ] 权限检查正确

### B.2 代码审查检查清单

- [ ] 使用 `getDb()` 而非直接导入 db
- [ ] 使用 `randomUUID()` 生成 ID
- [ ] Zod schema 验证输入
- [ ] try-catch 包裹异步操作
- [ ] 错误信息用户友好
- [ ] 敏感信息不暴露给客户端
- [ ] 分页查询使用 `keepPreviousData`
- [ ] Mutation 后刷新相关缓存

---

## 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.0 | 2025-11-27 | 初始版本，涵盖数据层、Actions、API、Hooks、存储、页面、计费/权限标准 |

---

**文档维护者**: MkSaaS 开发团队  
**反馈渠道**: 如有问题或建议，请在项目 Issue 中提出
