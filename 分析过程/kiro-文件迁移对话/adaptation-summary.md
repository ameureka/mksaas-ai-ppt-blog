# 适配点汇总

## 五大适配点总览

| # | 适配点 | 复杂度 | 工作量 | 方案 | 状态 |
|---|-------|-------|-------|------|------|
| 1 | Toast API | 低 | 0.5小时 | 直接替换import | 待执行 |
| 2 | Auth系统 | 低 | 1小时 | 使用mksaas的Better Auth | 待执行 |
| 3 | 国际化i18n | 低 | 1小时 | 保留常量，后续优化 | 待执行 |
| 4 | 布局组件 | 低 | 1.5小时 | 删除v0专用组件+添加DashboardHeader | 部分完成 |
| 5 | 路由适配 | 中 | 1小时 | 更新路由常量+使用LocaleLink | 部分完成 |
| **总计** | | | **5小时** | | |

---

## 1. Toast API 适配

### 决定
- ✅ 采用方案A：直接替换import

### 执行
```typescript
// 修改前
import { toast } from '@/hooks/use-toast'

// 修改后
import { toast } from 'sonner'
```

### 受影响文件
8个文件，约30次调用

### 状态
待执行

---

## 2. Auth系统适配

### 决定
- ✅ 不迁移v0的use-auth.tsx
- ✅ 登录直接跳转mksaas登录页
- ✅ credits全部使用mksaas的credits系统

### 执行
```typescript
// 修改前
import { useAuth } from '@/lib/hooks/use-auth'
const { user } = useAuth()

// 修改后
import { authClient } from '@/lib/auth-client'
const { data: session } = authClient.useSession()
const user = session?.user

// 需要登录时
router.push('/auth/sign-in')
```

### 受影响文件
4个文件

### 不迁移的文件
- `lib/hooks/use-auth.tsx`
- `components/auth/login-modal.tsx`

### 状态
待执行

---

## 3. 国际化i18n适配

### 决定
- ✅ 第一阶段：保留常量，修改import路径
- ❌ 迁移时不做next-intl转换
- ❌ 迁移时不做英文翻译

### 执行
```typescript
// 将v0的i18n.ts复制到mksaas
// 路径: src/lib/constants/ppt-i18n.ts

// 修改import路径
import { ADMIN_I18N } from '@/lib/constants/ppt-i18n'
```

### 后续任务
| 任务 | 优先级 |
|-----|-------|
| 转换为next-intl JSON格式 | 中 |
| 修改组件使用useTranslations | 中 |
| 添加英文翻译 | 低 |

### 状态
待执行

---

## 4. 布局组件适配

### 决定
- ❌ 不迁移3个v0专用布局组件
- ✅ 删除使用，替换为mksaas组件
- ✅ Admin页面添加DashboardHeader

### 已完成
- ✅ 前台页面已移除MksaasPublicLayout包裹
- ✅ Admin页面已移除MksaasPreviewLayout包裹
- ✅ 页面已迁移到mksaas对应目录

### 待完成
- ⚠️ Admin页面需要添加DashboardHeader（4个页面）

### DashboardHeader添加方式
```typescript
import { DashboardHeader } from '@/components/dashboard/dashboard-header'

export default function AdminPage() {
  const breadcrumbs = [
    { label: 'Admin' },
    { label: 'PPT管理', isCurrentPage: true },
  ]

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />
      <div className="flex-1 overflow-auto p-6">
        {/* 页面内容 */}
      </div>
    </>
  )
}
```

### 各页面breadcrumbs配置
| 页面 | breadcrumbs |
|-----|-------------|
| admin/ppt/page.tsx | `[{ label: 'Admin' }, { label: 'PPT管理', isCurrentPage: true }]` |
| admin/stats/page.tsx | `[{ label: 'Admin' }, { label: '统计分析', isCurrentPage: true }]` |
| admin/users/page.tsx | `[{ label: 'Admin' }, { label: '用户管理', isCurrentPage: true }]` |
| admin/settings/page.tsx | `[{ label: 'Admin' }, { label: '系统设置', isCurrentPage: true }]` |

### 不迁移的文件
- `components/mksaas-public-layout.tsx`
- `components/mksaas-preview-layout.tsx`
- `components/mksaas-dashboard-header.tsx`

### 状态
部分完成（需要添加DashboardHeader）

---

## 5. 路由适配

### 决定
- ✅ 前台页面放在`(marketing)/ppt/`下
- ✅ Admin页面放在`(protected)/admin/`下
- ✅ 使用LocaleLink/useLocaleRouter处理国际化路由
- ✅ 更新路由常量文件

### 路由变化汇总

| 原v0路由 | 新mksaas路由 | 变化 |
|---------|-------------|------|
| `/` | `/ppt` | 添加/ppt前缀 |
| `/categories` | `/ppt/categories` | 添加/ppt前缀 |
| `/category/[name]` | `/ppt/category/[name]` | 添加/ppt前缀 |
| `/ppt/[id]` | `/ppt/[id]` | 保持不变 |
| `/admin/ppt` | `/admin/ppt` | 保持不变 |
| `/admin/ppt/list` | `/admin/ppt/list` | 保持不变 |
| `/admin/ppt/users` | `/admin/users` | 移除/ppt中间层 |
| `/admin/ppt/stats` | `/admin/stats` | 移除/ppt中间层 |
| `/admin/ppt/settings` | `/admin/settings` | 移除/ppt中间层 |

### 路由常量更新

```typescript
// src/lib/constants/ppt-routes.ts

export const PublicRoutes = {
  Home: "/ppt",  // 原来是 "/"
  Categories: "/ppt/categories",
  Category: (name: string) => `/ppt/category/${encodeURIComponent(name)}`,
  PPTDetail: (id: string) => `/ppt/${id}`,
}

export const AdminRoutes = {
  Dashboard: "/admin/ppt",
  PPTs: "/admin/ppt/list",
  Users: "/admin/users",  // 原来是 "/admin/ppt/users"
  Stats: "/admin/stats",
  Settings: "/admin/settings",
}
```

### 组件中的路由使用

```typescript
// 修改前 (v0)
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// 修改后 (mksaas)
import { LocaleLink } from '@/i18n/navigation'
import { useLocaleRouter } from '@/lib/navigation'
```

### 已完成
- ✅ 页面文件已迁移到mksaas对应目录
- ✅ 路由结构已适配mksaas约定

### 待完成
- ⚠️ 更新路由常量文件（路径变化）
- ⚠️ 组件中使用LocaleLink/useLocaleRouter

### 状态
部分完成（页面已迁移，路由常量待更新）

---

## 迁移时的修改清单

### 需要修改import的文件

| 文件 | Toast | Auth | i18n | Layout |
|-----|-------|------|------|--------|
| navigation-header.tsx | ✅ | ✅ | | |
| login-modal.tsx | ✅ | ❌不迁移 | | |
| download-modal.tsx | ✅ | ✅ | | |
| ppt-delete-dialog.tsx | ✅ | | ✅ | |
| ppt-edit-form.tsx | ✅ | | ✅ | |
| user-list-table.tsx | ✅ | | ✅ | |
| stats-card.tsx | | | ✅ | |
| download-trend-chart.tsx | | | ✅ | |
| top-ppt-list.tsx | | | ✅ | |
| app/page.tsx | ✅ | | | ✅已完成 |
| app/categories/page.tsx | | | | ✅已完成 |
| app/category/[name]/page.tsx | | | | ✅已完成 |
| app/ppt/[id]/page.tsx | | | | ✅已完成 |
| admin/ppt/page.tsx | | | ✅ | ⚠️需添加Header |
| admin/stats/page.tsx | | | ✅ | ⚠️需添加Header |
| admin/users/page.tsx | | | ✅ | ⚠️需添加Header |
| admin/settings/page.tsx | | | ✅ | ⚠️需添加Header |

---

## 不迁移的文件汇总

| 文件 | 原因 |
|-----|------|
| `lib/hooks/use-auth.tsx` | 使用mksaas的Better Auth |
| `lib/hooks/use-admin-auth.tsx` | 需要重写适配Better Auth |
| `components/auth/login-modal.tsx` | 直接跳转mksaas登录页 |
| `components/mksaas-public-layout.tsx` | v0预览专用 |
| `components/mksaas-preview-layout.tsx` | v0预览专用 |
| `components/mksaas-dashboard-header.tsx` | v0预览专用 |
| `hooks/use-toast.ts` | 使用mksaas的sonner |
| `hooks/use-mobile.ts` | mksaas已有 |
| `lib/api/mock/*.ts` | mock数据 |
| `lib/mock-data/*.ts` | mock数据 |
| `app/layout.tsx` | 使用mksaas的locale/layout |
| `app/(admin)/admin/ppt/layout.tsx` | 使用mksaas的(protected)/layout |

---

## 后续优化任务

| # | 任务 | 优先级 | 预计工作量 |
|---|-----|-------|-----------|
| 1 | i18n转换为next-intl | 中 | 5小时 |
| 2 | 添加英文翻译 | 低 | 2小时 |
| 3 | use-admin-auth重写 | 中 | 2小时 |
| 4 | 统一代码风格 | 低 | 2小时 |

---

## 执行顺序建议

### Phase 1: 基础适配（立即执行）
1. 复制i18n常量文件到mksaas
2. 为Admin页面添加DashboardHeader

### Phase 2: 组件迁移时适配
1. 迁移组件时修改Toast import
2. 迁移组件时修改Auth调用
3. 迁移组件时修改i18n import路径

### Phase 3: 后续优化（迁移完成后）
1. i18n转换为next-intl
2. 添加英文翻译
3. 重写use-admin-auth

---

## 相关文档

### 方法论文档
| 文档 | 说明 |
|-----|------|
| `migration-methodology.md` | **完整迁移方法论** |

### 文件清单文档
| 文档 | 说明 |
|-----|------|
| `v0-complete-file-inventory.md` | v0项目185个文件完整清单 |
| `precise-file-status.md` | 每个文件的迁移状态 |
| `v0-dependency-analysis.md` | 7层依赖层级图 |

### 适配分析文档
| 文档 | 说明 |
|-----|------|
| `adaptation-analysis-toast.md` | Toast适配详细分析 |
| `adaptation-analysis-auth.md` | Auth适配详细分析 |
| `adaptation-analysis-i18n.md` | i18n适配详细分析 |
| `adaptation-analysis-layout.md` | 布局组件适配详细分析 |
| `adaptation-analysis-routes.md` | 路由适配详细分析 |
