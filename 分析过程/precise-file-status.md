# v0项目完整文件迁移清单

## 方法论

1. **统计v0所有文件** - 逐个目录扫描
2. **判断文件类型** - 配置/类型/组件/页面/资源
3. **检查mksaas对应** - 是否已有同功能文件
4. **决定迁移策略** - 直接复制/需适配/不迁移

---

## v0项目文件总览

| 目录 | 文件数 | 需迁移 | 不迁移 | 覆盖率 |
|-----|-------|-------|-------|-------|
| 根目录配置 | 10 | 0 | 10 | 100% |
| hooks/ | 16 | 14 | 2 | 100% |
| lib/ | 33 | 24 | 9 | 100% |
| components/ui/ | 56 | 0 | 56 | 100% |
| components/业务 | 23 | 18 | 5 | 100% |
| app/ | 15 | 11 | 4 | 100% |
| public/ | 31 | 31 | 0 | 100% |
| styles/ | 1 | 0 | 1 | 100% |
| **合计** | **185** | **98** | **87** | **100%** |

---

## 一、根目录配置文件 (10个) - 全部不迁移

| # | 文件 | 迁移 | 原因 |
|---|-----|------|------|
| 1 | `components.json` | ❌ | mksaas已有 |
| 2 | `next-env.d.ts` | ❌ | 自动生成 |
| 3 | `next.config.mjs` | ❌ | mksaas已有 |
| 4 | `package.json` | ❌ | mksaas已有 |
| 5 | `pnpm-lock.yaml` | ❌ | 自动生成 |
| 6 | `postcss.config.mjs` | ❌ | mksaas已有 |
| 7 | `README.md` | ❌ | 项目文档 |
| 8 | `tsconfig.json` | ❌ | mksaas已有 |
| 9 | `tsconfig.tsbuildinfo` | ❌ | 自动生成 |
| 10 | `.DS_Store` | ❌ | 系统文件 |

---

## 二、hooks目录 (16个)

| # | v0文件 | 迁移 | mksaas目标 | 类型 |
|---|-------|------|-----------|------|
| 1 | `hooks/index.ts` | ✅ | `src/hooks/ppt/index.ts` | 直接复制 |
| 2 | `hooks/use-adjust-credits.ts` | ✅ | `src/hooks/ppt/use-adjust-credits.ts` | 直接复制 |
| 3 | `hooks/use-ban-user.ts` | ✅ | `src/hooks/ppt/use-ban-user.ts` | 直接复制 |
| 4 | `hooks/use-create-ppt.ts` | ⚠️ | `src/hooks/ppt/use-create-ppt.ts` | 需对比(已有) |
| 5 | `hooks/use-delete-ppt.ts` | ⚠️ | `src/hooks/ppt/use-delete-ppt.ts` | 需对比(已有) |
| 6 | `hooks/use-get-dashboard-stats.ts` | ✅ | `src/hooks/ppt/use-get-dashboard-stats.ts` | 直接复制 |
| 7 | `hooks/use-get-ppt.ts` | ⚠️ | `src/hooks/ppt/use-get-ppt.ts` | 需对比(已有) |
| 8 | `hooks/use-get-ppts.ts` | ⚠️ | `src/hooks/ppt/use-get-ppts.ts` | 需对比(已有) |
| 9 | `hooks/use-get-user.ts` | ✅ | `src/hooks/ppt/use-get-user.ts` | 直接复制 |
| 10 | `hooks/use-get-users.ts` | ✅ | `src/hooks/ppt/use-get-users.ts` | 直接复制 |
| 11 | `hooks/use-mobile.ts` | ❌ | - | mksaas已有 |
| 12 | `hooks/use-rewarded-video.ts` | ✅ | `src/hooks/ppt/use-rewarded-video.ts` | 直接复制 |
| 13 | `hooks/use-toast.ts` | ❌ | - | mksaas已有sonner |
| 14 | `hooks/use-update-ppt.ts` | ⚠️ | `src/hooks/ppt/use-update-ppt.ts` | 需对比(已有) |
| 15 | `hooks/use-update-settings.ts` | ✅ | `src/hooks/ppt/use-update-settings.ts` | 直接复制 |
| 16 | `hooks/use-update-user.ts` | ✅ | `src/hooks/ppt/use-update-user.ts` | 直接复制 |

**统计**: ✅需迁移9个, ⚠️需对比5个, ❌不迁移2个

---

## 三、lib目录 (33个)

### 3.1 lib/types (6个)

| # | v0文件 | 迁移 | mksaas目标 | 类型 |
|---|-------|------|-----------|------|
| 1 | `lib/types/index.ts` | ✅ | `src/lib/types/ppt/index.ts` | 直接复制 |
| 2 | `lib/types/admin.ts` | ✅ | `src/lib/types/ppt/admin.ts` | 直接复制 |
| 3 | `lib/types/api.ts` | ✅ | `src/lib/types/ppt/api.ts` | 直接复制 |
| 4 | `lib/types/ppt.ts` | ✅ | `src/lib/types/ppt/ppt.ts` | 直接复制 |
| 5 | `lib/types/server-action.ts` | ✅ | `src/lib/types/ppt/server-action.ts` | 直接复制 |
| 6 | `lib/types/user.ts` | ⚠️ | `src/lib/types/ppt/user.ts` | 需适配(与mksaas User合并) |

### 3.2 lib/constants (2个)

| # | v0文件 | 迁移 | mksaas目标 | 类型 |
|---|-------|------|-----------|------|
| 7 | `lib/constants/routes.ts` | ✅ | `src/lib/constants/ppt-routes.ts` | 直接复制 |
| 8 | `lib/constants/i18n.ts` | ⚠️ | `messages/zh.json` (合并) | 需适配(next-intl) |

### 3.3 lib/hooks (2个)

| # | v0文件 | 迁移 | mksaas目标 | 类型 |
|---|-------|------|-----------|------|
| 9 | `lib/hooks/use-admin-auth.tsx` | ⚠️ | `src/hooks/ppt/use-ppt-admin-auth.tsx` | 需适配(Better Auth) |
| 10 | `lib/hooks/use-auth.tsx` | ❌ | - | mksaas已有Better Auth |

### 3.4 lib/actions (4个)

| # | v0文件 | 迁移 | mksaas目标 | 类型 |
|---|-------|------|-----------|------|
| 11 | `lib/actions/index.ts` | ✅ | `src/actions/ppt/index.ts` | 直接复制 |
| 12 | `lib/actions/ppt.ts` | ✅ | `src/actions/ppt/ppt.ts` | 直接复制 |
| 13 | `lib/actions/stats.ts` | ✅ | `src/actions/ppt/stats.ts` | 直接复制 |
| 14 | `lib/actions/user.ts` | ✅ | `src/actions/ppt/user.ts` | 直接复制 |

### 3.5 lib/admin (2个)

| # | v0文件 | 迁移 | mksaas目标 | 类型 |
|---|-------|------|-----------|------|
| 15 | `lib/admin/audit.ts` | ✅ | `src/lib/ppt/admin/audit.ts` | 直接复制 |
| 16 | `lib/admin/permissions.tsx` | ✅ | `src/lib/ppt/admin/permissions.tsx` | 直接复制 |

### 3.6 lib/api (7个)

| # | v0文件 | 迁移 | mksaas目标 | 类型 |
|---|-------|------|-----------|------|
| 17 | `lib/api/client.ts` | ✅ | `src/lib/ppt/api/client.ts` | 直接复制 |
| 18 | `lib/api/index.ts` | ✅ | `src/lib/ppt/api/index.ts` | 直接复制 |
| 19 | `lib/api/mock/auth.mock.ts` | ❌ | - | mock数据不迁移 |
| 20 | `lib/api/mock/ppt.mock.ts` | ❌ | - | mock数据不迁移 |
| 21 | `lib/api/services/audit.service.ts` | ✅ | `src/lib/ppt/api/services/audit.service.ts` | 直接复制 |
| 22 | `lib/api/services/auth.service.ts` | ⚠️ | `src/lib/ppt/api/services/auth.service.ts` | 需适配(Better Auth) |
| 23 | `lib/api/services/ppt.service.ts` | ✅ | `src/lib/ppt/api/services/ppt.service.ts` | 直接复制 |

### 3.7 lib/mock-data (3个) - 全部不迁移

| # | v0文件 | 迁移 | 原因 |
|---|-------|------|------|
| 24 | `lib/mock-data/ppts.ts` | ❌ | mock数据 |
| 25 | `lib/mock-data/stats.ts` | ❌ | mock数据 |
| 26 | `lib/mock-data/users.ts` | ❌ | mock数据 |

### 3.8 lib/schemas (4个)

| # | v0文件 | 迁移 | mksaas目标 | 类型 |
|---|-------|------|-----------|------|
| 27 | `lib/schemas/index.ts` | ✅ | `src/lib/ppt/schemas/index.ts` | 直接复制 |
| 28 | `lib/schemas/common.ts` | ✅ | `src/lib/ppt/schemas/common.ts` | 直接复制 |
| 29 | `lib/schemas/ppt.ts` | ✅ | `src/lib/ppt/schemas/ppt.ts` | 直接复制 |
| 30 | `lib/schemas/user.ts` | ✅ | `src/lib/ppt/schemas/user.ts` | 直接复制 |

### 3.9 lib根目录 (3个)

| # | v0文件 | 迁移 | mksaas目标 | 类型 |
|---|-------|------|-----------|------|
| 31 | `lib/utils.ts` | ❌ | - | mksaas已有 |
| 32 | `lib/query-keys.ts` | ✅ | `src/lib/ppt/query-keys.ts` | 直接复制 |
| 33 | `lib/actions-mock.ts` | ❌ | - | mock数据 |

**lib统计**: ✅需迁移19个, ⚠️需适配5个, ❌不迁移9个

---

## 四、components目录 (79个)

### 4.1 components/ui (56个) - 全部不迁移

mksaas已有完整UI组件库，全部56个UI组件不需要迁移。

### 4.2 components业务组件 (23个)

| # | v0文件 | 迁移 | mksaas目标 | 类型 |
|---|-------|------|-----------|------|
| 1 | `components/ppt-card.tsx` | ⚠️ | `src/components/ppt/ppt-card.tsx` | 需适配(toast) |
| 2 | `components/search-sidebar.tsx` | ⚠️ | `src/components/ppt/search-sidebar.tsx` | 需适配(i18n) |
| 3 | `components/search-filters.tsx` | ⚠️ | `src/components/ppt/search-filters.tsx` | 需适配(i18n) |
| 4 | `components/navigation-header.tsx` | ⚠️ | `src/components/ppt/navigation-header.tsx` | 需适配(auth) |
| 5 | `components/theme-provider.tsx` | ❌ | - | mksaas已有 |
| 6 | `components/mksaas-public-layout.tsx` | ❌ | - | v0预览专用 |
| 7 | `components/mksaas-preview-layout.tsx` | ❌ | - | v0预览专用 |
| 8 | `components/mksaas-dashboard-header.tsx` | ❌ | - | v0预览专用 |
| 9 | `components/ads/display-ad.tsx` | ✅ | `src/components/ppt/ads/display-ad.tsx` | 直接复制 |
| 10 | `components/ads/native-ad-card.tsx` | ✅ | `src/components/ppt/ads/native-ad-card.tsx` | 直接复制 |
| 11 | `components/ads/rewarded-video-ad.tsx` | ✅ | `src/components/ppt/ads/rewarded-video-ad.tsx` | 直接复制 |
| 12 | `components/auth/login-modal.tsx` | ⚠️ | `src/components/ppt/auth/login-modal.tsx` | 需适配(Better Auth) |
| 13 | `components/download/download-options-modal.tsx` | ⚠️ | `src/components/ppt/download/download-options-modal.tsx` | 需适配 |
| 14 | `components/download-flow/download-modal.tsx` | ⚠️ | `src/components/ppt/download/download-modal.tsx` | 需适配 |
| 15 | `components/admin/stats-card.tsx` | ✅ | `src/components/ppt/admin/stats-card.tsx` | 直接复制 |
| 16 | `components/admin/ppt-list-table.tsx` | ⚠️ | `src/components/ppt/admin/ppt-list-table.tsx` | 需适配 |
| 17 | `components/admin/ppt-edit-form.tsx` | ⚠️ | `src/components/ppt/admin/ppt-edit-form.tsx` | 需适配 |
| 18 | `components/admin/ppt-delete-dialog.tsx` | ✅ | `src/components/ppt/admin/ppt-delete-dialog.tsx` | 直接复制 |
| 19 | `components/admin/user-list-table.tsx` | ⚠️ | `src/components/ppt/admin/user-list-table.tsx` | 需适配 |
| 20 | `components/admin/download-trend-chart.tsx` | ✅ | `src/components/ppt/admin/download-trend-chart.tsx` | 直接复制 |
| 21 | `components/admin/category-distribution-chart.tsx` | ✅ | `src/components/ppt/admin/category-distribution-chart.tsx` | 直接复制 |
| 22 | `components/admin/top-ppt-list.tsx` | ✅ | `src/components/ppt/admin/top-ppt-list.tsx` | 直接复制 |
| 23 | `components/providers/query-provider.tsx` | ❌ | - | mksaas已有 |

**components统计**: ✅需迁移8个, ⚠️需适配10个, ❌不迁移61个(含UI 56个)

---

## 五、app目录 (15个)

| # | v0文件 | 迁移 | mksaas目标 | 类型 |
|---|-------|------|-----------|------|
| 1 | `app/layout.tsx` | ❌ | - | mksaas已有根布局 |
| 2 | `app/globals.css` | ❌ | - | mksaas已有 |
| 3 | `app/loading.tsx` | ❌ | - | mksaas已有 |
| 4 | `app/sitemap.ts` | ❌ | - | mksaas已有 |
| 5 | `app/page.tsx` | ⚠️ | `src/app/[locale]/(public)/ppt/page.tsx` | 需适配(i18n+layout) |
| 6 | `app/categories/page.tsx` | ⚠️ | `src/app/[locale]/(public)/ppt/categories/page.tsx` | 需适配 |
| 7 | `app/category/[name]/page.tsx` | ⚠️ | `src/app/[locale]/(public)/ppt/category/[name]/page.tsx` | 需适配 |
| 8 | `app/ppt/[id]/page.tsx` | ⚠️ | `src/app/[locale]/(public)/ppt/[id]/page.tsx` | 需适配 |
| 9 | `app/(admin)/admin/ppt/layout.tsx` | ⚠️ | `src/app/[locale]/(admin)/admin/ppt/layout.tsx` | 需适配 |
| 10 | `app/(admin)/admin/ppt/page.tsx` | ⚠️ | `src/app/[locale]/(admin)/admin/ppt/page.tsx` | 需适配 |
| 11 | `app/(admin)/admin/ppt/list/page.tsx` | ⚠️ | `src/app/[locale]/(admin)/admin/ppt/list/page.tsx` | 需适配 |
| 12 | `app/(admin)/admin/ppt/list/loading.tsx` | ✅ | `src/app/[locale]/(admin)/admin/ppt/list/loading.tsx` | 直接复制 |
| 13 | `app/(admin)/admin/ppt/stats/page.tsx` | ⚠️ | `src/app/[locale]/(admin)/admin/ppt/stats/page.tsx` | 需适配 |
| 14 | `app/(admin)/admin/ppt/users/page.tsx` | ⚠️ | `src/app/[locale]/(admin)/admin/ppt/users/page.tsx` | 需适配 |
| 15 | `app/(admin)/admin/ppt/settings/page.tsx` | ⚠️ | `src/app/[locale]/(admin)/admin/ppt/settings/page.tsx` | 需适配 |

**app统计**: ✅需迁移1个, ⚠️需适配10个, ❌不迁移4个

---

## 六、public目录 (31个) - 全部需迁移

PPT模板缩略图等业务图片，全部需要迁移到 `public/ppt/` 目录。

---

## 七、styles目录 (1个) - 不迁移

| # | v0文件 | 迁移 | 原因 |
|---|-------|------|------|
| 1 | `styles/globals.css` | ❌ | mksaas已有全局样式 |

---

## 最终统计汇总

### 按迁移类型

| 类型 | 数量 | 说明 |
|-----|------|------|
| ✅ **直接复制** | 37个 | 类型/常量/简单组件/hooks/资源 |
| ⚠️ **需适配** | 30个 | 需修改toast/auth/i18n/路由 |
| ⚠️ **需对比** | 5个 | mksaas已有同名文件，需对比合并 |
| 🖼️ **资源文件** | 31个 | public目录图片 |
| ❌ **不迁移** | 82个 | 配置/UI组件/mock/v0专用 |
| **合计** | **185** | |

### 按优先级排序的迁移顺序

| Phase | 内容 | 文件数 | 预计时间 |
|-------|-----|-------|---------|
| 1 | 类型定义 + 常量 | 8个 | 0.5天 |
| 2 | Hooks + Actions + Schemas | 23个 | 1天 |
| 3 | 业务组件 | 18个 | 2天 |
| 4 | 页面文件 | 11个 | 2天 |
| 5 | 资源文件 | 31个 | 0.5天 |
| **合计** | | **91个** | **6天** |

---

## 适配点详细说明

| 适配类型 | 涉及文件数 | 具体修改 |
|---------|-----------|---------|
| **Toast** | 8个 | `import { toast } from '@/hooks/use-toast'` → `import { toast } from 'sonner'` |
| **Auth** | 6个 | 自定义useAuth → Better Auth的`useSession()` |
| **i18n** | 12个 | 常量对象 → `useTranslations('ppt')` |
| **路由** | 11个 | 添加`[locale]`前缀，调整路由结构 |
| **布局** | 4个 | 移除MksaasPublicLayout包装 |

---

## 执行原则

1. **先验证，再执行** - 每个文件迁移前验证源文件存在
2. **逐个明确** - 每个文件的状态、依赖、冲突都要明确记录
3. **增量测试** - 每迁移一个文件立即测试
4. **回滚准备** - 每个步骤都要有回滚方案
