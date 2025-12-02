# Requirements Document

## Introduction

本规范定义了将 v0 项目中的 PPT 模块完整迁移到 mksaas 项目的需求。迁移涉及 98 个文件（含 31 个资源文件），需要处理 5 大适配点（Toast、Auth、i18n、布局、路由），按照 7 层依赖层级进行增量迁移，确保功能完整性和用户体验一致性。

## 参考文档

本规范基于以下分析文档制定，执行任务时请参考：

| 文档 | 路径 | 说明 |
|-----|------|------|
| 迁移方法论 | #[[file:分析过程/migration-methodology.md]] | 完整迁移方法论和执行流程 |
| 文件清单 | #[[file:分析过程/v0-complete-file-inventory.md]] | v0项目185个文件完整清单 |
| 迁移状态 | #[[file:分析过程/precise-file-status.md]] | 每个文件的迁移状态和目标路径 |
| 依赖分析 | #[[file:分析过程/v0-dependency-analysis.md]] | 7层依赖层级图 |
| 适配汇总 | #[[file:分析过程/adaptation-summary.md]] | 五大适配点汇总 |
| Toast适配 | #[[file:分析过程/adaptation-analysis-toast.md]] | Toast API适配详细分析 |
| Auth适配 | #[[file:分析过程/adaptation-analysis-auth.md]] | Auth系统适配详细分析 |
| i18n适配 | #[[file:分析过程/adaptation-analysis-i18n.md]] | 国际化适配详细分析 |
| 布局适配 | #[[file:分析过程/adaptation-analysis-layout.md]] | 布局组件适配详细分析 |
| 路由适配 | #[[file:分析过程/adaptation-analysis-routes.md]] | 路由适配详细分析 |

## Glossary

- **v0项目**: 原始 PPT 功能的独立项目，包含完整的 PPT 管理、展示、下载功能
- **mksaas**: 目标 SaaS 平台项目，基于 Next.js 15 App Router，使用 Better Auth、sonner、next-intl 等技术栈
- **PPT模块**: 包含 PPT 展示、分类、搜索、下载、后台管理等功能的业务模块
- **适配点**: v0 与 mksaas 之间存在 API 差异需要转换的技术点
- **依赖层级**: 文件之间的依赖关系层次，从底层类型定义到顶层页面组件
- **Better Auth**: mksaas 使用的认证系统
- **sonner**: mksaas 使用的 Toast 通知库
- **next-intl**: mksaas 使用的国际化方案
- **LocaleLink**: mksaas 中支持国际化的链接组件
- **DashboardHeader**: mksaas 后台页面的标准头部组件

## Requirements

### Requirement 1: 类型定义迁移

**User Story:** As a 开发者, I want to 将 v0 项目的类型定义迁移到 mksaas, so that 后续组件和业务逻辑可以正确引用类型。

#### Acceptance Criteria

1. WHEN 迁移类型定义文件 THEN THE 系统 SHALL 将 `lib/types/*.ts` 的 6 个文件复制到 `src/lib/types/ppt/` 目录
2. WHEN 迁移 schema 文件 THEN THE 系统 SHALL 将 `lib/schemas/*.ts` 的 4 个文件复制到 `src/lib/ppt/schemas/` 目录
3. WHEN 类型定义迁移完成 THEN THE 系统 SHALL 通过 `pnpm tsc --noEmit` 编译检查无错误
4. WHEN 导入类型定义 THEN THE 系统 SHALL 支持从 `@/lib/types/ppt` 路径正确导入所有类型

### Requirement 2: 常量和工具函数迁移

**User Story:** As a 开发者, I want to 将路由常量和国际化常量迁移到 mksaas, so that 组件可以使用统一的路由和文本配置。

#### Acceptance Criteria

1. WHEN 迁移路由常量 THEN THE 系统 SHALL 将 `lib/constants/routes.ts` 复制到 `src/lib/constants/ppt-routes.ts` 并更新路由路径（添加 `/ppt` 前缀）
2. WHEN 迁移国际化常量 THEN THE 系统 SHALL 将 `lib/constants/i18n.ts` 复制到 `src/lib/constants/ppt-i18n.ts`
3. WHEN 迁移 query-keys THEN THE 系统 SHALL 将 `lib/query-keys.ts` 复制到 `src/lib/ppt/query-keys.ts`
4. WHEN 常量迁移完成 THEN THE 系统 SHALL 通过 `pnpm tsc --noEmit` 编译检查无错误

### Requirement 3: Hooks 和 Actions 迁移

**User Story:** As a 开发者, I want to 将业务 hooks 和 server actions 迁移到 mksaas, so that 组件可以调用业务逻辑。

#### Acceptance Criteria

1. WHEN 迁移业务 hooks THEN THE 系统 SHALL 将 `hooks/*.ts` 的 14 个业务 hook 文件复制到 `src/hooks/ppt/` 目录
2. WHEN 迁移 server actions THEN THE 系统 SHALL 将 `lib/actions/*.ts` 的 4 个文件复制到 `src/actions/ppt/` 目录
3. WHEN 迁移 API 服务 THEN THE 系统 SHALL 将 `lib/api/services/*.ts` 的 3 个服务文件复制到 `src/lib/ppt/api/services/` 目录
4. WHEN hooks 中使用 toast THEN THE 系统 SHALL 将 `import { toast } from '@/hooks/use-toast'` 替换为 `import { toast } from 'sonner'`
5. WHEN hooks 和 actions 迁移完成 THEN THE 系统 SHALL 通过 `pnpm tsc --noEmit` 编译检查无错误

### Requirement 4: Toast API 适配

**User Story:** As a 开发者, I want to 将 v0 的 toast 调用适配为 mksaas 的 sonner, so that 通知功能正常工作。

#### Acceptance Criteria

1. WHEN 组件使用 toast 功能 THEN THE 系统 SHALL 使用 `import { toast } from 'sonner'` 导入
2. WHEN 调用 toast 方法 THEN THE 系统 SHALL 使用 `toast.success()`, `toast.error()`, `toast.info()` 等 sonner API
3. WHEN toast 适配完成 THEN THE 系统 SHALL 在 8 个受影响文件中正确替换约 30 次 toast 调用

### Requirement 5: Auth 系统适配

**User Story:** As a 开发者, I want to 将 v0 的自定义 auth 适配为 mksaas 的 Better Auth, so that 认证功能与 mksaas 统一。

#### Acceptance Criteria

1. WHEN 组件需要获取用户信息 THEN THE 系统 SHALL 使用 `authClient.useSession()` 替代 `useAuth()`
2. WHEN 用户未登录需要跳转 THEN THE 系统 SHALL 跳转到 `/auth/sign-in` 而非显示登录模态框
3. WHEN 检查用户权限 THEN THE 系统 SHALL 使用 Better Auth 的 session 数据判断用户角色
4. IF v0 的 `use-auth.tsx` 被引用 THEN THE 系统 SHALL 删除该引用并使用 `@/lib/auth-client`

### Requirement 6: 布局组件适配

**User Story:** As a 开发者, I want to 移除 v0 专用布局组件并使用 mksaas 布局, so that 页面风格与 mksaas 统一。

#### Acceptance Criteria

1. WHEN 前台页面使用布局 THEN THE 系统 SHALL 移除 `MksaasPublicLayout` 包裹，使用 `(marketing)/layout.tsx` 提供的布局
2. WHEN 后台页面使用布局 THEN THE 系统 SHALL 移除 `MksaasPreviewLayout` 包裹，使用 `(protected)/layout.tsx` 提供的布局
3. WHEN 后台页面渲染 THEN THE 系统 SHALL 添加 `DashboardHeader` 组件并配置正确的 breadcrumbs
4. WHEN 布局适配完成 THEN THE 系统 SHALL 确保 4 个后台页面都包含 DashboardHeader

### Requirement 7: 路由适配

**User Story:** As a 开发者, I want to 更新路由配置以适配 mksaas 的路由结构, so that 所有页面可以正确访问。

#### Acceptance Criteria

1. WHEN 前台页面路由配置 THEN THE 系统 SHALL 将原 `/` 路由更新为 `/ppt`，`/categories` 更新为 `/ppt/categories`
2. WHEN 后台页面路由配置 THEN THE 系统 SHALL 将 `/admin/ppt/users` 更新为 `/admin/users`，`/admin/ppt/stats` 更新为 `/admin/stats`
3. WHEN 组件中使用链接 THEN THE 系统 SHALL 使用 `LocaleLink` 替代 `next/link` 的 `Link` 组件
4. WHEN 组件中使用路由跳转 THEN THE 系统 SHALL 使用 `useLocaleRouter` 替代 `next/navigation` 的 `useRouter`

### Requirement 8: 业务组件迁移

**User Story:** As a 开发者, I want to 将 PPT 业务组件迁移到 mksaas, so that 页面可以正确渲染业务功能。

#### Acceptance Criteria

1. WHEN 迁移 PPT 展示组件 THEN THE 系统 SHALL 将 `ppt-card.tsx`, `search-sidebar.tsx`, `search-filters.tsx` 复制到 `src/components/ppt/`
2. WHEN 迁移广告组件 THEN THE 系统 SHALL 将 `components/ads/*.tsx` 的 3 个文件复制到 `src/components/ppt/ads/`
3. WHEN 迁移下载组件 THEN THE 系统 SHALL 将 `components/download/*.tsx` 的 2 个文件复制到 `src/components/ppt/download/`
4. WHEN 迁移后台管理组件 THEN THE 系统 SHALL 将 `components/admin/*.tsx` 的 8 个文件复制到 `src/components/ppt/admin/`
5. WHEN 组件迁移完成 THEN THE 系统 SHALL 更新所有导入路径并通过编译检查

### Requirement 9: 页面文件迁移

**User Story:** As a 开发者, I want to 将 PPT 页面文件迁移到 mksaas 的路由结构中, so that 用户可以访问所有 PPT 功能页面。

#### Acceptance Criteria

1. WHEN 迁移前台页面 THEN THE 系统 SHALL 将 4 个前台页面迁移到 `src/app/[locale]/(marketing)/ppt/` 目录
2. WHEN 迁移后台页面 THEN THE 系统 SHALL 将 5 个后台页面迁移到 `src/app/[locale]/(protected)/admin/` 目录
3. WHEN 页面迁移完成 THEN THE 系统 SHALL 更新所有组件导入路径
4. WHEN 访问 PPT 首页 `/ppt` THEN THE 系统 SHALL 正确渲染搜索和分类展示功能
5. WHEN 访问后台 `/admin/ppt` THEN THE 系统 SHALL 正确渲染统计卡片和管理功能

### Requirement 10: 资源文件迁移

**User Story:** As a 开发者, I want to 将 PPT 相关的图片资源迁移到 mksaas, so that 页面可以正确显示图片。

#### Acceptance Criteria

1. WHEN 迁移图片资源 THEN THE 系统 SHALL 将 `public/` 目录下的 31 个 PPT 相关图片复制到 `public/ppt/` 目录
2. WHEN 组件引用图片 THEN THE 系统 SHALL 更新图片路径从 `/xxx.png` 到 `/ppt/xxx.png`
3. WHEN 图片迁移完成 THEN THE 系统 SHALL 确保所有 PPT 缩略图和图标正确加载

### Requirement 11: 编译和运行时验证

**User Story:** As a 开发者, I want to 验证迁移后的代码可以正确编译和运行, so that 确保迁移质量。

#### Acceptance Criteria

1. WHEN 执行类型检查 THEN THE 系统 SHALL 通过 `pnpm tsc --noEmit` 无错误
2. WHEN 执行代码检查 THEN THE 系统 SHALL 通过 `pnpm lint` 无错误
3. WHEN 执行构建 THEN THE 系统 SHALL 通过 `pnpm build` 成功完成
4. WHEN 启动开发服务器 THEN THE 系统 SHALL 通过 `pnpm dev` 正常启动
5. WHEN 访问所有 PPT 页面 THEN THE 系统 SHALL 正确渲染无控制台错误

### Requirement 12: 功能完整性验证

**User Story:** As a 用户, I want to 使用迁移后的 PPT 功能, so that 我可以浏览、搜索和下载 PPT。

#### Acceptance Criteria

1. WHEN 用户访问 PPT 首页 THEN THE 系统 SHALL 显示搜索框和分类列表
2. WHEN 用户输入搜索关键词 THEN THE 系统 SHALL 显示匹配的 PPT 结果
3. WHEN 用户点击分类 THEN THE 系统 SHALL 显示该分类下的 PPT 列表
4. WHEN 用户点击 PPT 卡片 THEN THE 系统 SHALL 跳转到 PPT 详情页
5. WHEN 用户点击下载按钮 THEN THE 系统 SHALL 显示下载选项模态框
6. WHEN 管理员访问后台 THEN THE 系统 SHALL 显示统计数据和管理功能
