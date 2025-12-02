# v0项目完整文件清单与迁移覆盖检查

## v0项目文件统计

### 一、根目录配置文件 (10个) - 不迁移

| 文件 | 迁移状态 | 原因 |
|-----|---------|------|
| `components.json` | ❌ 不迁移 | mksaas已有 |
| `next-env.d.ts` | ❌ 不迁移 | 自动生成 |
| `next.config.mjs` | ❌ 不迁移 | mksaas已有 |
| `package.json` | ❌ 不迁移 | mksaas已有 |
| `pnpm-lock.yaml` | ❌ 不迁移 | 自动生成 |
| `postcss.config.mjs` | ❌ 不迁移 | mksaas已有 |
| `README.md` | ❌ 不迁移 | 项目文档 |
| `tsconfig.json` | ❌ 不迁移 | mksaas已有 |
| `tsconfig.tsbuildinfo` | ❌ 不迁移 | 自动生成 |
| `.DS_Store` | ❌ 不迁移 | 系统文件 |

---

### 二、hooks目录 (16个)

| # | 文件 | 迁移状态 | 目标位置 | 说明 |
|---|-----|---------|---------|------|
| 1 | `hooks/index.ts` | ✅ 需迁移 | `src/hooks/ppt/index.ts` | 导出文件 |
| 2 | `hooks/use-adjust-credits.ts` | ✅ 需迁移 | `src/hooks/ppt/use-adjust-credits.ts` | PPT业务hook |
| 3 | `hooks/use-ban-user.ts` | ✅ 需迁移 | `src/hooks/ppt/use-ban-user.ts` | PPT业务hook |
| 4 | `hooks/use-create-ppt.ts` | ⚠️ 已有 | `src/hooks/ppt/use-create-ppt.ts` | mksaas已有，需对比 |
| 5 | `hooks/use-delete-ppt.ts` | ⚠️ 已有 | `src/hooks/ppt/use-delete-ppt.ts` | mksaas已有，需对比 |
| 6 | `hooks/use-get-dashboard-stats.ts` | ✅ 需迁移 | `src/hooks/ppt/use-get-dashboard-stats.ts` | PPT业务hook |
| 7 | `hooks/use-get-ppt.ts` | ⚠️ 已有 | `src/hooks/ppt/use-get-ppt.ts` | mksaas已有，需对比 |
| 8 | `hooks/use-get-ppts.ts` | ⚠️ 已有 | `src/hooks/ppt/use-get-ppts.ts` | mksaas已有，需对比 |
| 9 | `hooks/use-get-user.ts` | ✅ 需迁移 | `src/hooks/ppt/use-get-user.ts` | PPT业务hook |
| 10 | `hooks/use-get-users.ts` | ✅ 需迁移 | `src/hooks/ppt/use-get-users.ts` | PPT业务hook |
| 11 | `hooks/use-mobile.ts` | ❌ 不迁移 | - | mksaas已有 |
| 12 | `hooks/use-rewarded-video.ts` | ✅ 需迁移 | `src/hooks/ppt/use-rewarded-video.ts` | PPT业务hook |
| 13 | `hooks/use-toast.ts` | ❌ 不迁移 | - | mksaas已有sonner |
| 14 | `hooks/use-update-ppt.ts` | ⚠️ 已有 | `src/hooks/ppt/use-update-ppt.ts` | mksaas已有，需对比 |
| 15 | `hooks/use-update-settings.ts` | ✅ 需迁移 | `src/hooks/ppt/use-update-settings.ts` | PPT业务hook |
| 16 | `hooks/use-update-user.ts` | ✅ 需迁移 | `src/hooks/ppt/use-update-user.ts` | PPT业务hook |

**hooks统计**: 需迁移9个, 已有需对比5个, 不迁移2个

---

### 三、lib目录

#### 3.1 lib/types (6个，不含.bak)

| # | 文件 | 迁移状态 | 目标位置 |
|---|-----|---------|---------|
| 1 | `lib/types/index.ts` | ✅ 需迁移 | `src/lib/types/ppt/index.ts` |
| 2 | `lib/types/admin.ts` | ✅ 需迁移 | `src/lib/types/ppt/admin.ts` |
| 3 | `lib/types/api.ts` | ✅ 需迁移 | `src/lib/types/ppt/api.ts` |
| 4 | `lib/types/ppt.ts` | ✅ 需迁移 | `src/lib/types/ppt/ppt.ts` |
| 5 | `lib/types/server-action.ts` | ✅ 需迁移 | `src/lib/types/ppt/server-action.ts` |
| 6 | `lib/types/user.ts` | ✅ 需迁移 | `src/lib/types/ppt/user.ts` |

#### 3.2 lib/constants (2个)

| # | 文件 | 迁移状态 | 目标位置 |
|---|-----|---------|---------|
| 7 | `lib/constants/i18n.ts` | ✅ 需适配 | `messages/zh.json` (合并) |
| 8 | `lib/constants/routes.ts` | ✅ 需迁移 | `src/lib/constants/ppt-routes.ts` |

#### 3.3 lib/hooks (2个)

| # | 文件 | 迁移状态 | 目标位置 |
|---|-----|---------|---------|
| 9 | `lib/hooks/use-admin-auth.tsx` | ✅ 需适配 | `src/hooks/ppt/use-ppt-admin-auth.tsx` |
| 10 | `lib/hooks/use-auth.tsx` | ❌ 不迁移 | - (使用Better Auth) |

#### 3.4 lib/actions (4个)

| # | 文件 | 迁移状态 | 目标位置 |
|---|-----|---------|---------|
| 11 | `lib/actions/index.ts` | ✅ 需迁移 | `src/actions/ppt/index.ts` |
| 12 | `lib/actions/ppt.ts` | ✅ 需迁移 | `src/actions/ppt/ppt.ts` |
| 13 | `lib/actions/stats.ts` | ✅ 需迁移 | `src/actions/ppt/stats.ts` |
| 14 | `lib/actions/user.ts` | ✅ 需迁移 | `src/actions/ppt/user.ts` |

#### 3.5 lib/admin (2个)

| # | 文件 | 迁移状态 | 目标位置 |
|---|-----|---------|---------|
| 15 | `lib/admin/audit.ts` | ✅ 需迁移 | `src/lib/ppt/admin/audit.ts` |
| 16 | `lib/admin/permissions.tsx` | ✅ 需迁移 | `src/lib/ppt/admin/permissions.tsx` |

#### 3.6 lib/api (7个)

| # | 文件 | 迁移状态 | 目标位置 |
|---|-----|---------|---------|
| 17 | `lib/api/client.ts` | ✅ 需迁移 | `src/lib/ppt/api/client.ts` |
| 18 | `lib/api/index.ts` | ✅ 需迁移 | `src/lib/ppt/api/index.ts` |
| 19 | `lib/api/mock/auth.mock.ts` | ❌ 不迁移 | - (mock数据) |
| 20 | `lib/api/mock/ppt.mock.ts` | ❌ 不迁移 | - (mock数据) |
| 21 | `lib/api/services/audit.service.ts` | ✅ 需迁移 | `src/lib/ppt/api/services/audit.service.ts` |
| 22 | `lib/api/services/auth.service.ts` | ✅ 需适配 | `src/lib/ppt/api/services/auth.service.ts` |
| 23 | `lib/api/services/ppt.service.ts` | ✅ 需迁移 | `src/lib/ppt/api/services/ppt.service.ts` |

#### 3.7 lib/mock-data (3个，不含.bak)

| # | 文件 | 迁移状态 | 说明 |
|---|-----|---------|------|
| 24 | `lib/mock-data/ppts.ts` | ❌ 不迁移 | mock数据，生产环境不需要 |
| 25 | `lib/mock-data/stats.ts` | ❌ 不迁移 | mock数据 |
| 26 | `lib/mock-data/users.ts` | ❌ 不迁移 | mock数据 |

#### 3.8 lib/schemas (4个)

| # | 文件 | 迁移状态 | 目标位置 |
|---|-----|---------|---------|
| 27 | `lib/schemas/index.ts` | ✅ 需迁移 | `src/lib/ppt/schemas/index.ts` |
| 28 | `lib/schemas/common.ts` | ✅ 需迁移 | `src/lib/ppt/schemas/common.ts` |
| 29 | `lib/schemas/ppt.ts` | ✅ 需迁移 | `src/lib/ppt/schemas/ppt.ts` |
| 30 | `lib/schemas/user.ts` | ✅ 需迁移 | `src/lib/ppt/schemas/user.ts` |

#### 3.9 lib根目录 (3个)

| # | 文件 | 迁移状态 | 目标位置 |
|---|-----|---------|---------|
| 31 | `lib/utils.ts` | ❌ 不迁移 | mksaas已有 |
| 32 | `lib/query-keys.ts` | ✅ 需迁移 | `src/lib/ppt/query-keys.ts` |
| 33 | `lib/actions-mock.ts` | ❌ 不迁移 | mock数据 |

**lib统计**: 需迁移24个, 不迁移9个

---

### 四、components目录

#### 4.1 components/ui (56个)

全部不迁移 - mksaas已有完整UI组件库

#### 4.2 components业务组件 (18个)

| # | 文件 | 迁移状态 | 目标位置 |
|---|-----|---------|---------|
| 1 | `components/ppt-card.tsx` | ✅ 需适配 | `src/components/ppt/ppt-card.tsx` |
| 2 | `components/search-sidebar.tsx` | ✅ 需适配 | `src/components/ppt/search-sidebar.tsx` |
| 3 | `components/search-filters.tsx` | ✅ 需适配 | `src/components/ppt/search-filters.tsx` |
| 4 | `components/navigation-header.tsx` | ✅ 需适配 | `src/components/ppt/navigation-header.tsx` |
| 5 | `components/theme-provider.tsx` | ❌ 不迁移 | mksaas已有 |
| 6 | `components/mksaas-public-layout.tsx` | ❌ 不迁移 | v0预览专用 |
| 7 | `components/mksaas-preview-layout.tsx` | ❌ 不迁移 | v0预览专用 |
| 8 | `components/mksaas-dashboard-header.tsx` | ❌ 不迁移 | v0预览专用 |
| 9 | `components/ads/display-ad.tsx` | ✅ 需迁移 | `src/components/ppt/ads/display-ad.tsx` |
| 10 | `components/ads/native-ad-card.tsx` | ✅ 需迁移 | `src/components/ppt/ads/native-ad-card.tsx` |
| 11 | `components/ads/rewarded-video-ad.tsx` | ✅ 需迁移 | `src/components/ppt/ads/rewarded-video-ad.tsx` |
| 12 | `components/auth/login-modal.tsx` | ✅ 需适配 | `src/components/ppt/auth/login-modal.tsx` |
| 13 | `components/download/download-options-modal.tsx` | ✅ 需适配 | `src/components/ppt/download/download-options-modal.tsx` |
| 14 | `components/download-flow/download-modal.tsx` | ✅ 需适配 | `src/components/ppt/download/download-modal.tsx` |
| 15 | `components/admin/stats-card.tsx` | ✅ 需迁移 | `src/components/ppt/admin/stats-card.tsx` |
| 16 | `components/admin/ppt-list-table.tsx` | ✅ 需适配 | `src/components/ppt/admin/ppt-list-table.tsx` |
| 17 | `components/admin/ppt-edit-form.tsx` | ✅ 需适配 | `src/components/ppt/admin/ppt-edit-form.tsx` |
| 18 | `components/admin/ppt-delete-dialog.tsx` | ✅ 需迁移 | `src/components/ppt/admin/ppt-delete-dialog.tsx` |
| 19 | `components/admin/user-list-table.tsx` | ✅ 需适配 | `src/components/ppt/admin/user-list-table.tsx` |
| 20 | `components/admin/download-trend-chart.tsx` | ✅ 需迁移 | `src/components/ppt/admin/download-trend-chart.tsx` |
| 21 | `components/admin/category-distribution-chart.tsx` | ✅ 需迁移 | `src/components/ppt/admin/category-distribution-chart.tsx` |
| 22 | `components/admin/top-ppt-list.tsx` | ✅ 需迁移 | `src/components/ppt/admin/top-ppt-list.tsx` |
| 23 | `components/providers/query-provider.tsx` | ❌ 不迁移 | mksaas已有 |

**components统计**: 需迁移18个, 不迁移61个(含UI 56个)

---

### 五、app目录 (15个)

| # | 文件 | 迁移状态 | 目标位置 |
|---|-----|---------|---------|
| 1 | `app/layout.tsx` | ❌ 不迁移 | mksaas已有根布局 |
| 2 | `app/globals.css` | ❌ 不迁移 | mksaas已有 |
| 3 | `app/loading.tsx` | ❌ 不迁移 | mksaas已有 |
| 4 | `app/sitemap.ts` | ❌ 不迁移 | mksaas已有 |
| 5 | `app/page.tsx` | ✅ 需适配 | `src/app/[locale]/(public)/ppt/page.tsx` |
| 6 | `app/categories/page.tsx` | ✅ 需适配 | `src/app/[locale]/(public)/ppt/categories/page.tsx` |
| 7 | `app/category/[name]/page.tsx` | ✅ 需适配 | `src/app/[locale]/(public)/ppt/category/[name]/page.tsx` |
| 8 | `app/ppt/[id]/page.tsx` | ✅ 需适配 | `src/app/[locale]/(public)/ppt/[id]/page.tsx` |
| 9 | `app/(admin)/admin/ppt/layout.tsx` | ✅ 需适配 | `src/app/[locale]/(admin)/admin/ppt/layout.tsx` |
| 10 | `app/(admin)/admin/ppt/page.tsx` | ✅ 需适配 | `src/app/[locale]/(admin)/admin/ppt/page.tsx` |
| 11 | `app/(admin)/admin/ppt/list/page.tsx` | ✅ 需适配 | `src/app/[locale]/(admin)/admin/ppt/list/page.tsx` |
| 12 | `app/(admin)/admin/ppt/list/loading.tsx` | ✅ 需迁移 | `src/app/[locale]/(admin)/admin/ppt/list/loading.tsx` |
| 13 | `app/(admin)/admin/ppt/stats/page.tsx` | ✅ 需适配 | `src/app/[locale]/(admin)/admin/ppt/stats/page.tsx` |
| 14 | `app/(admin)/admin/ppt/users/page.tsx` | ✅ 需适配 | `src/app/[locale]/(admin)/admin/ppt/users/page.tsx` |
| 15 | `app/(admin)/admin/ppt/settings/page.tsx` | ✅ 需适配 | `src/app/[locale]/(admin)/admin/ppt/settings/page.tsx` |

**app统计**: 需迁移11个, 不迁移4个

---

### 六、public目录 (31个图片/资源)

| 迁移状态 | 说明 |
|---------|------|
| ✅ 需迁移 | PPT模板缩略图等业务图片需要迁移到mksaas的public目录 |

---

### 七、styles目录 (1个)

| 文件 | 迁移状态 | 说明 |
|-----|---------|------|
| `styles/globals.css` | ❌ 不迁移 | mksaas已有全局样式 |

---

## 最终统计汇总

| 目录 | v0文件总数 | 需迁移 | 不迁移 | 覆盖率 |
|-----|-----------|-------|-------|-------|
| 根目录配置 | 10 | 0 | 10 | 100% |
| hooks | 16 | 9+5对比 | 2 | 100% |
| lib/types | 6 | 6 | 0 | 100% |
| lib/constants | 2 | 2 | 0 | 100% |
| lib/hooks | 2 | 1 | 1 | 100% |
| lib/actions | 4 | 4 | 0 | 100% |
| lib/admin | 2 | 2 | 0 | 100% |
| lib/api | 7 | 5 | 2 | 100% |
| lib/mock-data | 3 | 0 | 3 | 100% |
| lib/schemas | 4 | 4 | 0 | 100% |
| lib/根目录 | 3 | 1 | 2 | 100% |
| components/ui | 56 | 0 | 56 | 100% |
| components/业务 | 23 | 18 | 5 | 100% |
| app | 15 | 11 | 4 | 100% |
| public | 31 | 31 | 0 | 100% |
| styles | 1 | 0 | 1 | 100% |
| **合计** | **185** | **94+5对比** | **86** | **100%** |

---

## 覆盖检查结论

✅ **所有v0文件已100%覆盖**

- 需迁移文件：94个（含31个public资源）
- 需对比合并：5个（mksaas已有同名hooks）
- 不迁移文件：86个（配置/UI组件/mock数据/v0专用）

### 遗漏文件检查

经过完整统计，之前的分析**遗漏了以下文件**：

1. **hooks目录新增**：9个业务hooks（use-adjust-credits, use-ban-user等）
2. **lib/actions目录**：4个server action文件
3. **lib/admin目录**：2个管理功能文件
4. **lib/api目录**：5个API服务文件
5. **lib/schemas目录**：4个验证schema文件
6. **public目录**：31个图片资源

这些文件在之前的`precise-file-status.md`中未完全列出。
