# Implementation Plan

## 参考文档

执行任务时请参考以下分析文档，确保迁移准确性：

| 文档 | 路径 | 用途 |
|-----|------|------|
| **迁移方法论** | #[[file:分析过程/migration-methodology.md]] | 执行流程、验证命令、回滚机制 |
| **文件清单** | #[[file:分析过程/v0-complete-file-inventory.md]] | 查找源文件完整路径 |
| **迁移状态** | #[[file:分析过程/precise-file-status.md]] | 源路径→目标路径映射表 |
| **依赖分析** | #[[file:分析过程/v0-dependency-analysis.md]] | 依赖层级和迁移顺序 |
| **适配汇总** | #[[file:分析过程/adaptation-summary.md]] | 五大适配点执行方案 |

### 关键路径映射（来自 #[[file:分析过程/migration-methodology.md]]）

| v0路径 | mksaas路径 |
|-------|-----------|
| `@/lib/types/*` | `@/lib/types/ppt/*` |
| `@/lib/constants/routes` | `@/lib/constants/ppt-routes` |
| `@/lib/constants/i18n` | `@/lib/constants/ppt-i18n` |
| `@/hooks/use-toast` | `sonner` |
| `@/lib/hooks/use-auth` | `@/lib/auth-client` |
| `@/components/mksaas-*` | 删除，使用mksaas布局 |

---

## Phase 1: 类型定义和 Schemas 迁移

- [x] 1. 迁移类型定义文件
  - [x] 1.1 创建 `src/lib/types/ppt/` 目录并复制 6 个类型文件
    - 参考: #[[file:分析过程/precise-file-status.md]] 第三章 lib/types 部分
    - 源目录: `vo-ui-code-pro/v0mksaaspptsite/lib/types/`
    - 复制 `lib/types/index.ts` → `src/lib/types/ppt/index.ts`
    - 复制 `lib/types/ppt.ts` → `src/lib/types/ppt/ppt.ts`
    - 复制 `lib/types/user.ts` → `src/lib/types/ppt/user.ts`
    - 复制 `lib/types/admin.ts` → `src/lib/types/ppt/admin.ts`
    - 复制 `lib/types/api.ts` → `src/lib/types/ppt/api.ts`
    - 复制 `lib/types/server-action.ts` → `src/lib/types/ppt/server-action.ts`
    - _Requirements: 1.1, 1.4_
  - [x] 1.2 创建 `src/lib/ppt/schemas/` 目录并复制 4 个 schema 文件
    - 参考: #[[file:分析过程/precise-file-status.md]] 第三章 lib/schemas 部分
    - 源目录: `vo-ui-code-pro/v0mksaaspptsite/lib/schemas/`
    - 复制 `lib/schemas/index.ts` → `src/lib/ppt/schemas/index.ts`
    - 复制 `lib/schemas/common.ts` → `src/lib/ppt/schemas/common.ts`
    - 复制 `lib/schemas/ppt.ts` → `src/lib/ppt/schemas/ppt.ts`
    - 复制 `lib/schemas/user.ts` → `src/lib/ppt/schemas/user.ts`
    - _Requirements: 1.2_
  - [x] 1.3 运行 `pnpm tsc --noEmit` 验证编译通过
    - 参考: #[[file:分析过程/migration-methodology.md]] 第四章 编译验证循环
    - _Requirements: 1.3_

- [x]* 1.4 编写属性测试：编译正确性
  - **Property 6: 编译正确性**
  - **Validates: Requirements 1.3**

## Phase 2: 常量和工具函数迁移

- [x] 2. 迁移常量文件
  - [x] 2.1 复制并更新路由常量
    - 参考: #[[file:分析过程/adaptation-analysis-routes.md]] 路由变化汇总
    - 参考: #[[file:分析过程/adaptation-summary.md]] 第5节 路由适配
    - 复制 `lib/constants/routes.ts` → `src/lib/constants/ppt-routes.ts`
    - 更新路由路径：`/` → `/ppt`，`/categories` → `/ppt/categories`
    - 更新 admin 路由：`/admin/ppt/users` → `/admin/users`
    - _Requirements: 2.1, 7.1, 7.2_
  - [x] 2.2 复制国际化常量
    - 参考: #[[file:分析过程/adaptation-analysis-i18n.md]] i18n适配方案
    - 复制 `lib/constants/i18n.ts` → `src/lib/constants/ppt-i18n.ts`
    - _Requirements: 2.2_
  - [x] 2.3 复制 query-keys
    - 复制 `lib/query-keys.ts` → `src/lib/ppt/query-keys.ts`
    - _Requirements: 2.3_
  - [x] 2.4 运行 `pnpm tsc --noEmit` 验证编译通过
    - _Requirements: 2.4_

## Phase 3: Hooks 和 Actions 迁移

- [x] 3. 迁移业务 Hooks
  - [x] 3.1 创建 `src/hooks/ppt/` 目录并复制 hooks 文件
    - 参考: #[[file:分析过程/precise-file-status.md]] 第二章 hooks目录
    - 参考: #[[file:分析过程/v0-complete-file-inventory.md]] hooks统计
    - 源目录: `vo-ui-code-pro/v0mksaaspptsite/hooks/`
    - ⚠️ 注意: `use-mobile.ts` 和 `use-toast.ts` 不迁移（mksaas已有）
    - 复制 `hooks/index.ts` → `src/hooks/ppt/index.ts`
    - 复制 `hooks/use-adjust-credits.ts` → `src/hooks/ppt/use-adjust-credits.ts`
    - 复制 `hooks/use-ban-user.ts` → `src/hooks/ppt/use-ban-user.ts`
    - 复制 `hooks/use-create-ppt.ts` → `src/hooks/ppt/use-create-ppt.ts`
    - 复制 `hooks/use-delete-ppt.ts` → `src/hooks/ppt/use-delete-ppt.ts`
    - 复制 `hooks/use-get-dashboard-stats.ts` → `src/hooks/ppt/use-get-dashboard-stats.ts`
    - 复制 `hooks/use-get-ppt.ts` → `src/hooks/ppt/use-get-ppt.ts`
    - 复制 `hooks/use-get-ppts.ts` → `src/hooks/ppt/use-get-ppts.ts`
    - 复制 `hooks/use-get-user.ts` → `src/hooks/ppt/use-get-user.ts`
    - 复制 `hooks/use-get-users.ts` → `src/hooks/ppt/use-get-users.ts`
    - 复制 `hooks/use-rewarded-video.ts` → `src/hooks/ppt/use-rewarded-video.ts`
    - 复制 `hooks/use-update-ppt.ts` → `src/hooks/ppt/use-update-ppt.ts`
    - 复制 `hooks/use-update-settings.ts` → `src/hooks/ppt/use-update-settings.ts`
    - 复制 `hooks/use-update-user.ts` → `src/hooks/ppt/use-update-user.ts`
    - _Requirements: 3.1_
  - [x] 3.2 适配 hooks 中的 toast 调用
    - 参考: #[[file:分析过程/adaptation-analysis-toast.md]] Toast API适配
    - 参考: #[[file:分析过程/adaptation-summary.md]] 第1节 Toast API适配
    - 将 `import { toast } from '@/hooks/use-toast'` 替换为 `import { toast } from 'sonner'`
    - _Requirements: 3.4, 4.1, 4.2_

- [x]* 3.3 编写属性测试：Toast API 一致性
  - **Property 1: Toast API 一致性**
  - **Validates: Requirements 3.4, 4.1, 4.2, 4.3**

- [x] 4. 迁移 Server Actions
  - [x] 4.1 创建 `src/actions/ppt/` 目录并复制 actions 文件
    - 参考: #[[file:分析过程/precise-file-status.md]] 3.4 lib/actions
    - 源目录: `vo-ui-code-pro/v0mksaaspptsite/lib/actions/`
    - 复制 `lib/actions/index.ts` → `src/actions/ppt/index.ts`
    - 复制 `lib/actions/ppt.ts` → `src/actions/ppt/ppt.ts`
    - 复制 `lib/actions/stats.ts` → `src/actions/ppt/stats.ts`
    - 复制 `lib/actions/user.ts` → `src/actions/ppt/user.ts`
    - _Requirements: 3.2_

- [x] 5. 迁移 API 服务
  - [x] 5.1 创建 `src/lib/ppt/api/` 目录并复制 API 文件
    - 参考: #[[file:分析过程/precise-file-status.md]] 3.6 lib/api
    - 源目录: `vo-ui-code-pro/v0mksaaspptsite/lib/api/`
    - ⚠️ 注意: 不迁移 `lib/api/mock/` 下的 mock 文件
    - 复制 `lib/api/client.ts` → `src/lib/ppt/api/client.ts`
    - 复制 `lib/api/index.ts` → `src/lib/ppt/api/index.ts`
    - _Requirements: 3.3_
  - [x] 5.2 创建 `src/lib/ppt/api/services/` 目录并复制服务文件
    - 源目录: `vo-ui-code-pro/v0mksaaspptsite/lib/api/services/`
    - 复制 `lib/api/services/audit.service.ts` → `src/lib/ppt/api/services/audit.service.ts`
    - 复制 `lib/api/services/auth.service.ts` → `src/lib/ppt/api/services/auth.service.ts`
    - 复制 `lib/api/services/ppt.service.ts` → `src/lib/ppt/api/services/ppt.service.ts`
    - _Requirements: 3.3_

- [x] 6. 迁移 Admin 工具
  - [x] 6.1 创建 `src/lib/ppt/admin/` 目录并复制文件
    - 参考: #[[file:分析过程/precise-file-status.md]] 3.5 lib/admin
    - 源目录: `vo-ui-code-pro/v0mksaaspptsite/lib/admin/`
    - 复制 `lib/admin/audit.ts` → `src/lib/ppt/admin/audit.ts`
    - 复制 `lib/admin/permissions.tsx` → `src/lib/ppt/admin/permissions.tsx`
    - _Requirements: 3.3_
  - [x] 6.2 运行 `pnpm tsc --noEmit` 验证编译通过
    - _Requirements: 3.5_

- [x] 7. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: 业务组件迁移

- [x] 8. 迁移 PPT 展示组件
  - [x] 8.1 创建 `src/components/ppt/` 目录并复制核心组件
    - 参考: #[[file:分析过程/precise-file-status.md]] 第四章 components业务组件
    - 参考: #[[file:分析过程/v0-dependency-analysis.md]] Layer 4 业务组件层
    - 源目录: `vo-ui-code-pro/v0mksaaspptsite/components/`
    - ⚠️ 注意: 不迁移 `theme-provider.tsx`, `mksaas-*.tsx`, `providers/query-provider.tsx`
    - 复制 `components/ppt-card.tsx` → `src/components/ppt/ppt-card.tsx`
    - 复制 `components/search-sidebar.tsx` → `src/components/ppt/search-sidebar.tsx`
    - 复制 `components/search-filters.tsx` → `src/components/ppt/search-filters.tsx`
    - 复制 `components/navigation-header.tsx` → `src/components/ppt/navigation-header.tsx`
    - _Requirements: 8.1_
  - [x] 8.2 适配组件中的 toast 调用
    - 参考: #[[file:分析过程/adaptation-summary.md]] 迁移时的修改清单
    - 将所有 `@/hooks/use-toast` 替换为 `sonner`
    - _Requirements: 4.1, 4.2_
  - [x] 8.3 适配组件中的 auth 调用
    - 参考: #[[file:分析过程/adaptation-analysis-auth.md]] Auth系统适配
    - 参考: #[[file:分析过程/adaptation-summary.md]] 第2节 Auth系统适配
    - 将 `useAuth()` 替换为 `authClient.useSession()`
    - 将登录跳转改为 `/auth/sign-in`
    - _Requirements: 5.1, 5.2, 5.3_

- [x]* 8.4 编写属性测试：Auth API 一致性
  - **Property 2: Auth API 一致性**
  - **Validates: Requirements 5.1, 5.4**

- [x] 9. 迁移广告组件
  - [x] 9.1 创建 `src/components/ppt/ads/` 目录并复制文件
    - 参考: #[[file:分析过程/precise-file-status.md]] 4.2 components业务组件
    - 源目录: `vo-ui-code-pro/v0mksaaspptsite/components/ads/`
    - 复制 `components/ads/display-ad.tsx` → `src/components/ppt/ads/display-ad.tsx`
    - 复制 `components/ads/native-ad-card.tsx` → `src/components/ppt/ads/native-ad-card.tsx`
    - 复制 `components/ads/rewarded-video-ad.tsx` → `src/components/ppt/ads/rewarded-video-ad.tsx`
    - _Requirements: 8.2_

- [x] 10. 迁移下载组件
  - [x] 10.1 创建 `src/components/ppt/download/` 目录并复制文件
    - 参考: #[[file:分析过程/v0-dependency-analysis.md]] 3.4 PPT详情页依赖树
    - 源目录: `vo-ui-code-pro/v0mksaaspptsite/components/`
    - 复制 `components/download/download-options-modal.tsx` → `src/components/ppt/download/download-options-modal.tsx`
    - 复制 `components/download-flow/download-modal.tsx` → `src/components/ppt/download/download-modal.tsx`
    - _Requirements: 8.3_
  - [x] 10.2 适配下载组件中的 auth 和 toast
    - 参考: #[[file:分析过程/adaptation-summary.md]] 迁移时的修改清单
    - _Requirements: 4.1, 5.1_

- [x] 11. 迁移后台管理组件
  - [x] 11.1 创建 `src/components/ppt/admin/` 目录并复制文件
    - 参考: #[[file:分析过程/precise-file-status.md]] 4.2 components业务组件
    - 源目录: `vo-ui-code-pro/v0mksaaspptsite/components/admin/`
    - 复制 `components/admin/stats-card.tsx` → `src/components/ppt/admin/stats-card.tsx`
    - 复制 `components/admin/ppt-list-table.tsx` → `src/components/ppt/admin/ppt-list-table.tsx`
    - 复制 `components/admin/ppt-edit-form.tsx` → `src/components/ppt/admin/ppt-edit-form.tsx`
    - 复制 `components/admin/ppt-delete-dialog.tsx` → `src/components/ppt/admin/ppt-delete-dialog.tsx`
    - 复制 `components/admin/user-list-table.tsx` → `src/components/ppt/admin/user-list-table.tsx`
    - 复制 `components/admin/download-trend-chart.tsx` → `src/components/ppt/admin/download-trend-chart.tsx`
    - 复制 `components/admin/category-distribution-chart.tsx` → `src/components/ppt/admin/category-distribution-chart.tsx`
    - 复制 `components/admin/top-ppt-list.tsx` → `src/components/ppt/admin/top-ppt-list.tsx`
    - _Requirements: 8.4_
  - [x] 11.2 适配管理组件中的 i18n 引用
    - 参考: #[[file:分析过程/adaptation-summary.md]] 迁移时的修改清单
    - 更新 `@/lib/constants/i18n` → `@/lib/constants/ppt-i18n`
    - _Requirements: 2.2_
  - [x] 11.3 运行 `pnpm tsc --noEmit` 验证编译通过
    - _Requirements: 8.5_

- [x] 12. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: 页面文件迁移

- [x] 13. 迁移前台页面
  - [x] 13.1 迁移 PPT 首页
    - 参考: #[[file:分析过程/v0-dependency-analysis.md]] 3.1 首页依赖树
    - 参考: #[[file:分析过程/adaptation-analysis-layout.md]] 布局组件适配
    - 源文件: `vo-ui-code-pro/v0mksaaspptsite/app/page.tsx`
    - 更新 `src/app/[locale]/(marketing)/ppt/page.tsx` 的导入路径
    - 移除 `MksaasPublicLayout` 包裹（使用 (marketing)/layout.tsx）
    - 使用 `LocaleLink` 替代 `Link`
    - _Requirements: 9.1, 6.1, 7.3_
  - [x] 13.2 迁移分类列表页
    - 参考: #[[file:分析过程/v0-dependency-analysis.md]] 3.2 分类列表页
    - 源文件: `vo-ui-code-pro/v0mksaaspptsite/app/categories/page.tsx`
    - 更新 `src/app/[locale]/(marketing)/ppt/categories/page.tsx`
    - _Requirements: 9.1_
  - [x] 13.3 迁移分类详情页
    - 参考: #[[file:分析过程/v0-dependency-analysis.md]] 3.3 分类详情页
    - 源文件: `vo-ui-code-pro/v0mksaaspptsite/app/category/[name]/page.tsx`
    - 更新 `src/app/[locale]/(marketing)/ppt/category/[name]/page.tsx`
    - _Requirements: 9.1_
  - [x] 13.4 迁移 PPT 详情页
    - 参考: #[[file:分析过程/v0-dependency-analysis.md]] 3.4 PPT详情页依赖树
    - 源文件: `vo-ui-code-pro/v0mksaaspptsite/app/ppt/[id]/page.tsx`
    - 更新 `src/app/[locale]/(marketing)/ppt/[id]/page.tsx`
    - _Requirements: 9.1_

- [x]* 13.5 编写属性测试：布局组件一致性
  - **Property 3: 布局组件一致性**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [x]* 13.6 编写属性测试：国际化路由一致性
  - **Property 4: 国际化路由一致性**
  - **Validates: Requirements 7.3, 7.4**

- [x] 14. 迁移后台页面
  - [x] 14.1 迁移 Admin Dashboard
    - 参考: #[[file:分析过程/v0-dependency-analysis.md]] 3.6 管理后台首页
    - 参考: #[[file:分析过程/adaptation-summary.md]] DashboardHeader添加方式
    - 源文件: `vo-ui-code-pro/v0mksaaspptsite/app/(admin)/admin/ppt/page.tsx`
    - 更新 `src/app/[locale]/(protected)/admin/ppt/page.tsx`
    - 添加 `DashboardHeader` 组件
    - 配置 breadcrumbs: `[{ label: 'Admin' }, { label: 'PPT管理', isCurrentPage: true }]`
    - _Requirements: 9.2, 6.3_
  - [x] 14.2 迁移 PPT 列表页
    - 源文件: `vo-ui-code-pro/v0mksaaspptsite/app/(admin)/admin/ppt/list/page.tsx`
    - 更新 `src/app/[locale]/(protected)/admin/ppt/list/page.tsx`
    - 添加 `DashboardHeader`
    - _Requirements: 9.2, 6.3_
  - [x] 14.3 迁移用户管理页
    - 参考: #[[file:分析过程/adaptation-summary.md]] 各页面breadcrumbs配置
    - 源文件: `vo-ui-code-pro/v0mksaaspptsite/app/(admin)/admin/ppt/users/page.tsx`
    - 目标: `src/app/[locale]/(protected)/admin/users/page.tsx` (注意路径变化)
    - 添加 `DashboardHeader`
    - _Requirements: 9.2, 6.3_
  - [x] 14.4 迁移统计分析页
    - 源文件: `vo-ui-code-pro/v0mksaaspptsite/app/(admin)/admin/ppt/stats/page.tsx`
    - 目标: `src/app/[locale]/(protected)/admin/stats/page.tsx` (注意路径变化)
    - 添加 `DashboardHeader`
    - _Requirements: 9.2, 6.3_
  - [x] 14.5 迁移系统设置页
    - 源文件: `vo-ui-code-pro/v0mksaaspptsite/app/(admin)/admin/ppt/settings/page.tsx`
    - 目标: `src/app/[locale]/(protected)/admin/settings/page.tsx` (注意路径变化)
    - 添加 `DashboardHeader`
    - _Requirements: 9.2, 6.3_
  - [x] 14.6 运行 `pnpm tsc --noEmit` 验证编译通过
    - _Requirements: 9.3_

- [x] 15. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: 资源文件迁移

- [x] 16. 迁移图片资源
  - [x] 16.1 创建 `public/ppt/` 目录并复制图片
    - 参考: #[[file:分析过程/v0-complete-file-inventory.md]] 第六章 public目录
    - 参考: #[[file:分析过程/precise-file-status.md]] 第六章 public目录
    - 源目录: `vo-ui-code-pro/v0mksaaspptsite/public/`
    - 复制 v0 项目 `public/` 下的 31 个 PPT 相关图片到 `public/ppt/`
    - _Requirements: 10.1_
  - [x] 16.2 更新组件中的图片路径
    - 参考: #[[file:分析过程/migration-methodology.md]] 路径映射表
    - 搜索所有组件中的图片引用
    - 将 `/xxx.png` 更新为 `/ppt/xxx.png`
    - _Requirements: 10.2_

- [x]* 16.3 编写属性测试：图片路径一致性
  - **Property 5: 图片路径一致性**
  - **Validates: Requirements 10.2**

## Phase 7: 最终验证

- [x] 17. 编译和构建验证
  - [x] 17.1 运行类型检查
    - 执行 `pnpm tsc --noEmit`
    - _Requirements: 11.1_
  - [x] 17.2 运行代码检查
    - 执行 `pnpm lint`
    - _Requirements: 11.2_
  - [x] 17.3 运行构建
    - 执行 `pnpm build`
    - _Requirements: 11.3_

- [x] 18. 功能验证
  - [x] 18.1 验证前台页面
    - 参考: #[[file:分析过程/migration-methodology.md]] 6.1 页面访问测试
    - 访问 `/ppt` 验证首页（搜索、分类展示）
    - 访问 `/ppt/categories` 验证分类列表（分类卡片）
    - 访问 `/ppt/category/商务汇报` 验证分类详情（PPT列表）
    - 访问 `/ppt/123` 验证 PPT 详情（详情展示、下载）
    - _Requirements: 9.4, 12.1, 12.2, 12.3, 12.4, 12.5_
  - [x] 18.2 验证后台页面
    - 参考: #[[file:分析过程/migration-methodology.md]] 6.1 页面访问测试
    - 访问 `/admin/ppt` 验证 Dashboard（统计卡片）
    - 访问 `/admin/ppt/list` 验证 PPT 列表（表格、操作）
    - 访问 `/admin/users` 验证用户管理（用户列表）
    - 访问 `/admin/stats` 验证统计分析（图表）
    - 访问 `/admin/settings` 验证系统设置（表单）
    - _Requirements: 9.5, 12.6_
  - [x] 18.3 验证图片加载
    - 检查所有 PPT 缩略图正确显示
    - _Requirements: 10.3_

- [x] 19. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

---

## 迁移完成后的验证清单

参考 #[[file:分析过程/migration-methodology.md]] 第七章完整性报告

### 编译状态
- [ ] `pnpm tsc --noEmit` 无错误
- [ ] `pnpm lint` 无错误
- [ ] `pnpm build` 成功

### 页面访问状态
- [ ] 前台页面全部正常访问（4个）
- [ ] 后台页面全部正常访问（5个）

### 功能测试状态
- [ ] 搜索功能正常
- [ ] 分类筛选正常
- [ ] 下载流程正常
- [ ] 登录跳转正常
- [ ] Toast提示正常

### 适配点验证
- [ ] Toast 使用 sonner（8个文件）
- [ ] Auth 使用 Better Auth（6个文件）
- [ ] i18n 使用 ppt-i18n（12个文件）
- [ ] 路由使用 LocaleLink（11个文件）
- [ ] 布局移除 v0 专用组件（4个文件）

---

## 重要提醒

1. **源文件位置**: 所有 v0 源文件位于 `vo-ui-code-pro/v0mksaaspptsite/`
2. **增量验证**: 每个 Phase 完成后立即运行 `pnpm tsc --noEmit`
3. **Git 提交**: 每个 Phase 完成后 commit，便于回滚
4. **参考文档**: 遇到问题时查看 `分析过程/` 目录下的详细分析文档
5. **路径映射**: 严格按照 #[[file:分析过程/migration-methodology.md]] 的路径映射表执行
