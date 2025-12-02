# Design Document: v0 PPT 模块迁移到 mksaas

## Overview

本设计文档描述将 v0 项目中的 PPT 模块迁移到 mksaas 项目的技术方案。迁移涉及 98 个文件（含 31 个资源文件），需要处理 5 大适配点，按照 7 层依赖层级进行增量迁移。

## 参考文档

执行迁移时请参考以下分析文档：

- **迁移方法论**: #[[file:分析过程/migration-methodology.md]] - 完整迁移流程和验证方法
- **文件清单**: #[[file:分析过程/v0-complete-file-inventory.md]] - 185个文件的完整清单
- **迁移状态**: #[[file:分析过程/precise-file-status.md]] - 每个文件的源路径和目标路径
- **依赖分析**: #[[file:分析过程/v0-dependency-analysis.md]] - 7层依赖层级和迁移顺序
- **适配汇总**: #[[file:分析过程/adaptation-summary.md]] - 五大适配点的决策和执行方案

### 迁移范围

| 类别 | 文件数 | 说明 |
|-----|-------|------|
| 类型定义 | 10 | types + schemas |
| 常量 | 3 | routes + i18n + query-keys |
| Hooks | 14 | 业务 hooks |
| Actions | 4 | server actions |
| API 服务 | 5 | api client + services |
| 业务组件 | 18 | PPT/广告/下载/管理组件 |
| 页面 | 11 | 前台4个 + 后台7个 |
| 资源 | 31 | 图片文件 |
| **总计** | **98** | |

### 不迁移的文件

| 类别 | 文件数 | 原因 |
|-----|-------|------|
| 配置文件 | 10 | mksaas 已有 |
| UI 组件 | 56 | mksaas 已有完整 shadcn/ui |
| Mock 数据 | 9 | 生产环境不需要 |
| v0 专用组件 | 4 | MksaasPublicLayout 等 |
| 工具函数 | 2 | utils.ts, use-toast.ts |
| Auth Hook | 1 | 使用 Better Auth |
| **总计** | **87** | |

## Architecture

### 依赖层级架构

```
Layer 7: 页面层 (app/[locale]/(marketing)/ppt/*.tsx)
    ↓
Layer 6: 布局层 (使用 mksaas 现有布局)
    ↓
Layer 5: 业务组件层 (src/components/ppt/*.tsx)
    ↓
Layer 4: Hooks层 (src/hooks/ppt/*.ts)
    ↓
Layer 3: Actions层 (src/actions/ppt/*.ts)
    ↓
Layer 2: 常量/工具层 (src/lib/constants/ppt-*.ts)
    ↓
Layer 1: 类型定义层 (src/lib/types/ppt/*.ts)
```

### 目录结构

```
src/
├── lib/
│   ├── types/
│   │   └── ppt/                    # PPT 类型定义
│   │       ├── index.ts
│   │       ├── ppt.ts
│   │       ├── user.ts
│   │       ├── admin.ts
│   │       ├── api.ts
│   │       └── server-action.ts
│   ├── ppt/                        # PPT 业务逻辑
│   │   ├── schemas/                # Zod 验证
│   │   ├── api/                    # API 客户端
│   │   │   └── services/           # API 服务
│   │   ├── admin/                  # 管理功能
│   │   └── query-keys.ts
│   └── constants/
│       ├── ppt-routes.ts           # 路由常量
│       └── ppt-i18n.ts             # 国际化常量
├── hooks/
│   └── ppt/                        # PPT 业务 hooks
├── actions/
│   └── ppt/                        # PPT server actions
├── components/
│   └── ppt/                        # PPT 业务组件
│       ├── ads/                    # 广告组件
│       ├── download/               # 下载组件
│       └── admin/                  # 管理组件
├── app/
│   └── [locale]/
│       ├── (marketing)/
│       │   └── ppt/                # 前台页面
│       │       ├── page.tsx        # PPT 首页
│       │       ├── categories/     # 分类列表
│       │       ├── category/[name]/ # 分类详情
│       │       └── [id]/           # PPT 详情
│       └── (protected)/
│           └── admin/              # 后台页面
│               ├── ppt/            # PPT 管理
│               ├── users/          # 用户管理
│               ├── stats/          # 统计分析
│               └── settings/       # 系统设置
└── public/
    └── ppt/                        # PPT 图片资源
```

## Components and Interfaces

### 适配层接口

#### 1. Toast 适配

```typescript
// 迁移前 (v0)
import { toast } from '@/hooks/use-toast'
toast({ title: "成功", description: "操作完成" })

// 迁移后 (mksaas)
import { toast } from 'sonner'
toast.success("操作完成")
```

#### 2. Auth 适配

```typescript
// 迁移前 (v0)
import { useAuth } from '@/lib/hooks/use-auth'
const { user, login, logout } = useAuth()

// 迁移后 (mksaas)
import { authClient } from '@/lib/auth-client'
const { data: session } = authClient.useSession()
const user = session?.user

// 需要登录时
import { useLocaleRouter } from '@/lib/navigation'
const router = useLocaleRouter()
router.push('/auth/sign-in')
```

#### 3. 路由适配

```typescript
// 迁移前 (v0)
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// 迁移后 (mksaas)
import { LocaleLink } from '@/i18n/navigation'
import { useLocaleRouter } from '@/lib/navigation'
```

#### 4. 布局适配

```typescript
// 迁移前 (v0) - 前台页面
import { MksaasPublicLayout } from '@/components/mksaas-public-layout'
export default function Page() {
  return <MksaasPublicLayout>...</MksaasPublicLayout>
}

// 迁移后 (mksaas) - 前台页面
// 直接使用 (marketing)/layout.tsx 提供的布局
export default function Page() {
  return <div>...</div>
}

// 迁移后 (mksaas) - 后台页面
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
export default function AdminPage() {
  const breadcrumbs = [
    { label: 'Admin' },
    { label: 'PPT管理', isCurrentPage: true },
  ]
  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />
      <div className="flex-1 overflow-auto p-6">...</div>
    </>
  )
}
```

### 核心组件接口

#### PPTCard 组件

```typescript
interface PPTCardProps {
  ppt: PPT
  onClick?: () => void
  showActions?: boolean
}
```

#### SearchSidebar 组件

```typescript
interface SearchSidebarProps {
  categories: Category[]
  selectedCategory?: string
  onCategorySelect: (category: string) => void
  hotKeywords: string[]
  onKeywordClick: (keyword: string) => void
}
```

#### DownloadModal 组件

```typescript
interface DownloadModalProps {
  ppt: PPT
  isOpen: boolean
  onClose: () => void
  onDownload: (option: DownloadOption) => void
}
```

## Data Models

### PPT 类型定义

```typescript
// src/lib/types/ppt/ppt.ts
export interface PPT {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  thumbnailUrl: string
  downloadUrl: string
  downloadCount: number
  viewCount: number
  createdAt: Date
  updatedAt: Date
  authorId: string
  status: 'draft' | 'published' | 'archived'
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  pptCount: number
  icon?: string
}
```

### 用户类型定义

```typescript
// src/lib/types/ppt/user.ts
export interface PPTUser {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'user' | 'admin'
  credits: number
  downloadHistory: string[]
  createdAt: Date
}
```

### API 响应类型

```typescript
// src/lib/types/ppt/api.ts
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

基于需求分析，以下是迁移后系统必须满足的正确性属性：

### Property 1: Toast API 一致性

*For any* 迁移后的源文件，如果该文件使用 toast 功能，则该文件必须从 `sonner` 导入 toast，且不存在对 `@/hooks/use-toast` 的引用。

**Validates: Requirements 3.4, 4.1, 4.2, 4.3**

### Property 2: Auth API 一致性

*For any* 迁移后的源文件，如果该文件需要用户认证信息，则该文件必须使用 `authClient.useSession()` 或 `@/lib/auth-client`，且不存在对 `@/lib/hooks/use-auth` 的引用。

**Validates: Requirements 5.1, 5.4**

### Property 3: 布局组件一致性

*For any* 迁移后的页面文件，该文件不应包含 `MksaasPublicLayout` 或 `MksaasPreviewLayout` 的引用。对于后台页面，应包含 `DashboardHeader` 组件。

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 4: 国际化路由一致性

*For any* 迁移后的组件文件，如果该文件使用路由链接或导航，则应使用 `LocaleLink` 替代 `next/link` 的 `Link`，使用 `useLocaleRouter` 替代 `next/navigation` 的 `useRouter`。

**Validates: Requirements 7.3, 7.4**

### Property 5: 图片路径一致性

*For any* 迁移后的组件文件，如果该文件引用 PPT 相关图片，则图片路径应以 `/ppt/` 为前缀。

**Validates: Requirements 10.2**

### Property 6: 编译正确性

*For any* 迁移阶段完成后，执行 `pnpm tsc --noEmit` 应返回退出码 0，表示无类型错误。

**Validates: Requirements 1.3, 2.4, 3.5, 8.5, 11.1**

## Error Handling

### 迁移过程错误处理

| 错误类型 | 处理方案 |
|---------|---------|
| 文件不存在 | 记录警告，跳过该文件 |
| 导入路径错误 | 编译时报错，立即修复 |
| 类型不兼容 | 创建适配类型或类型断言 |
| API 不兼容 | 创建适配层函数 |

### 运行时错误处理

| 错误类型 | 处理方案 |
|---------|---------|
| 认证失败 | 跳转到登录页 |
| API 请求失败 | 显示 toast 错误提示 |
| 图片加载失败 | 显示占位图 |
| 路由不存在 | 显示 404 页面 |

### 回滚机制

```bash
# 迁移前创建分支
git checkout -b feature/ppt-migration

# 每个 Phase 完成后 commit
git add .
git commit -m "Phase 1: 迁移类型定义"

# 出现严重问题可回滚
git reset --hard HEAD~1
```

## Testing Strategy

### 双重测试方法

本迁移项目采用单元测试和属性测试相结合的方法：

- **单元测试**: 验证具体示例、边界情况和错误条件
- **属性测试**: 验证应在所有输入上成立的通用属性

### 属性测试框架

使用 **fast-check** 作为 TypeScript/JavaScript 的属性测试库。

```typescript
import fc from 'fast-check'
```

### 属性测试配置

每个属性测试应运行至少 100 次迭代：

```typescript
fc.assert(
  fc.property(/* ... */),
  { numRuns: 100 }
)
```

### 属性测试标注格式

每个属性测试必须使用以下格式标注：

```typescript
/**
 * **Feature: v0-ppt-migration, Property 1: Toast API 一致性**
 * 验证所有迁移文件使用正确的 toast 导入
 */
```

### 单元测试范围

| 测试类型 | 覆盖范围 |
|---------|---------|
| 文件存在性测试 | 验证所有目标文件已创建 |
| 导入路径测试 | 验证导入语句正确 |
| 编译测试 | 验证 TypeScript 编译通过 |
| 页面渲染测试 | 验证页面可正常渲染 |

### 验证命令

```bash
# 类型检查
pnpm tsc --noEmit

# 代码检查
pnpm lint

# 构建验证
pnpm build

# 开发服务器
pnpm dev
```

### 手动验证清单

| 页面 | URL | 验证点 |
|-----|-----|-------|
| PPT首页 | `/ppt` | 搜索、分类展示 |
| 分类列表 | `/ppt/categories` | 分类卡片 |
| 分类详情 | `/ppt/category/[name]` | PPT列表 |
| PPT详情 | `/ppt/[id]` | 详情展示、下载 |
| Admin Dashboard | `/admin/ppt` | 统计卡片 |
| PPT列表 | `/admin/ppt/list` | 表格、操作 |
| 用户管理 | `/admin/users` | 用户列表 |
| 统计分析 | `/admin/stats` | 图表 |
| 系统设置 | `/admin/settings` | 表单 |
