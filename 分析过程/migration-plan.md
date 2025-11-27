# v0 到 mksaas 迁移计划

## 执行原则

1. **依赖优先**: 先迁移底层依赖，再迁移上层组件
2. **增量验证**: 每完成一个模块立即验证
3. **保持兼容**: 创建适配层而非直接修改现有代码
4. **文档追溯**: 每个迁移步骤都有记录

---

## Phase 1: 基础设施层 (Day 1-2)

### Task 1.1: 创建类型定义

**目标路径:** `src/lib/ppt/types/`

```bash
# 创建目录结构
src/lib/ppt/
├── types/
│   ├── index.ts          # 导出所有类型
│   ├── ppt.ts            # PPT相关类型
│   ├── api.ts            # API响应类型
│   └── download.ts       # 下载相关类型
```

**迁移文件:**
- `lib/types/api.ts` → `src/lib/ppt/types/api.ts`
- `lib/types/ppt.ts` → `src/lib/ppt/types/ppt.ts`

**适配要点:**
- 移除与mksaas冲突的User类型，使用现有的
- 保留PPT、Download、Review等业务类型

### Task 1.2: 创建路由常量

**目标路径:** `src/lib/ppt/constants/routes.ts`

```typescript
// PPT模块路由常量
export const PPTRoutes = {
  // 前台路由
  Home: (locale: string) => `/${locale}/ppt`,
  Categories: (locale: string) => `/${locale}/ppt/categories`,
  Category: (locale: string, name: string) => `/${locale}/ppt/category/${encodeURIComponent(name)}`,
  Detail: (locale: string, id: string) => `/${locale}/ppt/${id}`,

  // 后台路由
  AdminDashboard: (locale: string) => `/${locale}/admin/ppt`,
  AdminList: (locale: string) => `/${locale}/admin/ppt/list`,
  AdminUsers: (locale: string) => `/${locale}/admin/ppt/users`,
  AdminStats: (locale: string) => `/${locale}/admin/ppt/stats`,
  AdminSettings: (locale: string) => `/${locale}/admin/ppt/settings`,
} as const
```

### Task 1.3: 创建Toast适配层

**目标路径:** `src/lib/ppt/utils/toast-adapter.ts`

```typescript
import { toast as sonnerToast } from 'sonner'

// 创建与v0兼容的toast API
export const toast = {
  success: (message: string, options?: { description?: string; duration?: number }) => {
    sonnerToast.success(message, options)
  },
  error: (message: string, options?: { description?: string; duration?: number }) => {
    sonnerToast.error(message, options)
  },
  info: (message: string, options?: { description?: string; duration?: number }) => {
    sonnerToast(message, options)
  },
  warning: (message: string, options?: { description?: string; duration?: number }) => {
    sonnerToast.warning(message, options)
  },
}

// 兼容useToast hook
export function useToast() {
  return { toast }
}
```

### Task 1.4: 创建Auth适配层

**目标路径:** `src/lib/ppt/hooks/use-ppt-auth.ts`

```typescript
'use client'

import { authClient } from '@/lib/auth-client'

export interface PPTUser {
  id: string
  username: string
  email: string
  avatar?: string
  credits: number
  role: 'user' | 'vip' | 'admin'
}

export function usePPTAuth() {
  const { data: session, isPending } = authClient.useSession()

  const user: PPTUser | null = session?.user ? {
    id: session.user.id,
    username: session.user.name || session.user.email?.split('@')[0] || 'User',
    email: session.user.email || '',
    avatar: session.user.image || undefined,
    credits: 0, // TODO: 从数据库获取
    role: 'user', // TODO: 从session获取
  } : null

  const requireAuth = (callback: () => void): boolean => {
    if (!user) {
      return false
    }
    callback()
    return true
  }

  return {
    user,
    isLoading: isPending,
    requireAuth,
  }
}
```

### Task 1.5: 添加i18n翻译

**目标路径:** `messages/zh.json` 和 `messages/en.json`

```json
// 在现有文件中添加ppt命名空间
{
  "ppt": {
    "search": {
      "hotKeywords": "热门搜索",
      "recommendedCategories": "推荐分类",
      "recentDownloads": "最近下载",
      "placeholder": "搜索PPT模板...",
      "noResults": "未找到相关模板"
    },
    "category": {
      "all": "全部分类",
      "business": "商务汇报",
      "education": "教育培训",
      "marketing": "产品营销",
      "summary": "年终总结",
      "proposal": "项目提案",
      "training": "培训课件",
      "report": "述职报告",
      "plan": "营销方案"
    },
    "download": {
      "free": "免费下载",
      "credits": "积分下载",
      "watchAd": "观看广告下载",
      "register": "注册获取积分"
    },
    "admin": {
      "dashboard": "管理控制台",
      "totalPPTs": "PPT总数",
      "totalUsers": "用户总数",
      "totalDownloads": "总下载量"
    }
  }
}
```

---

## Phase 2: 业务组件层 (Day 3-5)

### Task 2.1: 迁移PPT卡片组件

**源文件:** `components/ppt-card.tsx`
**目标路径:** `src/components/ppt/ppt-card.tsx`

**适配要点:**
- 更新import路径
- 使用next-intl替换硬编码文本
- 使用Link组件替换href

### Task 2.2: 迁移搜索组件

**源文件:**
- `components/search-sidebar.tsx`
- `components/search-filters.tsx`

**目标路径:** `src/components/ppt/`

### Task 2.3: 迁移广告组件

**源文件:**
- `components/ads/display-ad.tsx`
- `components/ads/native-ad-card.tsx`

**目标路径:** `src/components/ppt/ads/`

### Task 2.4: 迁移下载流程组件

**源文件:**
- `components/auth/login-modal.tsx`
- `components/download-flow/download-modal.tsx`

**目标路径:** `src/components/ppt/download/`

**适配要点:**
- LoginModal需要适配Better Auth
- DownloadModal需要使用适配后的auth hook

### Task 2.5: 迁移管理后台组件

**源文件:** `components/admin/`
**目标路径:** `src/components/ppt/admin/`

---

## Phase 3: 页面迁移 (Day 6-8)

### Task 3.1: 创建PPT模块路由结构

```bash
src/app/[locale]/
├── (marketing)/
│   └── ppt/
│       ├── page.tsx              # PPT首页
│       ├── categories/
│       │   └── page.tsx          # 分类列表
│       ├── category/
│       │   └── [name]/
│       │       └── page.tsx      # 分类详情
│       └── [id]/
│           └── page.tsx          # PPT详情
└── (dashboard)/
    └── admin/
        └── ppt/
            ├── page.tsx          # 管理后台首页
            ├── list/
            │   └── page.tsx      # PPT列表
            ├── users/
            │   └── page.tsx      # 用户管理
            ├── stats/
            │   └── page.tsx      # 统计分析
            └── settings/
                └── page.tsx      # 系统设置
```

### Task 3.2: 迁移首页

**源文件:** `app/page.tsx`
**目标路径:** `src/app/[locale]/(marketing)/ppt/page.tsx`

**关键修改:**
1. 移除 `MksaasPublicLayout` 包裹
2. 更新所有import路径
3. 使用 `useTranslations` 替换硬编码文本
4. 使用 `usePPTAuth` 替换 `useAuth`
5. 使用适配后的 `toast`

### Task 3.3: 迁移分类页面

**源文件:**
- `app/categories/page.tsx`
- `app/category/[name]/page.tsx`

**目标路径:**
- `src/app/[locale]/(marketing)/ppt/categories/page.tsx`
- `src/app/[locale]/(marketing)/ppt/category/[name]/page.tsx`

### Task 3.4: 迁移PPT详情页

**源文件:** `app/ppt/[id]/page.tsx`
**目标路径:** `src/app/[locale]/(marketing)/ppt/[id]/page.tsx`

### Task 3.5: 迁移管理后台页面

**源文件:** `app/(admin)/admin/ppt/`
**目标路径:** `src/app/[locale]/(dashboard)/admin/ppt/`

---

## Phase 4: 集成与测试 (Day 9-10)

### Task 4.1: 功能验证清单

- [ ] 首页搜索功能
- [ ] 分类导航功能
- [ ] PPT详情展示
- [ ] 下载流程（免费/积分/广告）
- [ ] 用户登录/注册
- [ ] 管理后台访问
- [ ] 响应式布局
- [ ] 国际化切换

### Task 4.2: 修复遗留问题

根据测试结果修复问题

### Task 4.3: 性能优化

- 图片懒加载
- 组件代码分割
- 数据预取

---

## 文件迁移对照表

| v0源文件 | mksaas目标文件 | 状态 |
|---------|---------------|------|
| `lib/types/api.ts` | `src/lib/ppt/types/api.ts` | ⬜ |
| `lib/types/ppt.ts` | `src/lib/ppt/types/ppt.ts` | ⬜ |
| `lib/constants/routes.ts` | `src/lib/ppt/constants/routes.ts` | ⬜ |
| `lib/constants/i18n.ts` | `messages/zh.json` (ppt namespace) | ⬜ |
| `hooks/use-toast.ts` | `src/lib/ppt/utils/toast-adapter.ts` | ⬜ |
| `lib/hooks/use-auth.tsx` | `src/lib/ppt/hooks/use-ppt-auth.ts` | ⬜ |
| `components/ppt-card.tsx` | `src/components/ppt/ppt-card.tsx` | ⬜ |
| `components/search-sidebar.tsx` | `src/components/ppt/search-sidebar.tsx` | ⬜ |
| `components/search-filters.tsx` | `src/components/ppt/search-filters.tsx` | ⬜ |
| `components/ads/display-ad.tsx` | `src/components/ppt/ads/display-ad.tsx` | ⬜ |
| `components/ads/native-ad-card.tsx` | `src/components/ppt/ads/native-ad-card.tsx` | ⬜ |
| `components/auth/login-modal.tsx` | `src/components/ppt/auth/login-modal.tsx` | ⬜ |
| `components/download-flow/download-modal.tsx` | `src/components/ppt/download/download-modal.tsx` | ⬜ |
| `components/admin/*.tsx` | `src/components/ppt/admin/*.tsx` | ⬜ |
| `app/page.tsx` | `src/app/[locale]/(marketing)/ppt/page.tsx` | ⬜ |
| `app/categories/page.tsx` | `src/app/[locale]/(marketing)/ppt/categories/page.tsx` | ⬜ |
| `app/category/[name]/page.tsx` | `src/app/[locale]/(marketing)/ppt/category/[name]/page.tsx` | ⬜ |
| `app/ppt/[id]/page.tsx` | `src/app/[locale]/(marketing)/ppt/[id]/page.tsx` | ⬜ |
| `app/(admin)/admin/ppt/*.tsx` | `src/app/[locale]/(dashboard)/admin/ppt/*.tsx` | ⬜ |

---

## 注意事项

### 1. 不要迁移的文件

以下文件仅用于v0预览，不需要迁移：
- `components/mksaas-public-layout.tsx`
- `components/mksaas-preview-layout.tsx`
- `components/mksaas-dashboard-header.tsx`
- `app/layout.tsx` (使用mksaas现有的)
- `app/globals.css` (使用mksaas现有的)

### 2. 需要特别注意的适配

1. **Toast API**: v0使用自定义toast，mksaas使用sonner
2. **Auth系统**: v0使用自定义auth，mksaas使用Better Auth
3. **国际化**: v0使用常量对象，mksaas使用next-intl
4. **路由**: v0无locale前缀，mksaas有locale前缀

### 3. 数据库相关

v0项目使用Mock数据，迁移后需要：
1. 创建PPT相关数据库表
2. 实现真实的API接口
3. 替换Mock数据调用
