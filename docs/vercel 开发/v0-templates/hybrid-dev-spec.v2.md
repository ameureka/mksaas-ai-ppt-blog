# mk-saas Admin × v0 混合开发规范（V2·通用方法论）

> 面向所有在 mk-saas 体系中开发 Admin 功能的工程师，提供“原生服务 + v0 UI”混合模式的完整指南。本文比 v1 更细，包含方法论、调研清单、产出规范、代码挂载示例、验收 checklist，便于任何大模型或开发者快速复刻流程。

---

## 0. 背景与目标

- **mk-saas 模板**：Next.js App Router + shadcn 设计系统 + Safe Action 服务层 + Better Auth 权限体系。
- **v0.app**：可视化 UI 生成工具，适合快速搭建 CRUD 页面、表单、表格、仪表盘等。
- **混合开发原则**：  
  - 业务逻辑、权限、状态管理、Server Action **必须留在 mk-saas 原生代码**；  
  - 纯 UI/表单/表格可借助 v0 生成，但必须遵循 mk-saas 规范，以便无缝迁移。

本文输出一套「先调研 → 再生成 → 后集成 → 最终验收」的标准流程。

---

## 1. 开发前调研 Checklist

开发人员或大模型在动手前应完成以下调研，以确保 v0 输出契合主系统：

### 1.1 结构/布局
1. 找到 **受保护路由**：`src/app/[locale]/(protected)/layout.tsx`。记录 Dashboard 布局如何提供 Sidebar、Header、Providers。
2. 理解 **导航配置**：`src/config/sidebar-config.tsx`/`routes.ts`。明确新增页面需要在哪个 group 下注册，并要求哪些角色可见。
3. 掌握 **通用容器**：如 `AdminPageShell` (标题 + 操作栏 + 内容)，`PageHeader`、`PageContent` 等，后续 v0 页面应直接套用。

### 1.2 设计系统
1. 颜色 & 主题变量：`src/styles/globals.css` (`:root` & `.dark`) + `tailwind.config`.
2. 字体：`src/assets/fonts.ts` + root layout `<body>` 的 className。
3. UI 组件：`src/components/ui/*` + `components/dashboard/*`（表格、卡片、统计、toast）。
4. 动画/阴影/spacing：`globals.css` 中 `--shadow-*`、`--radius`。

### 1.3 行为层
1. i18n：`NextIntlClientProvider` 位置（`src/app/[locale]/layout.tsx`），`routing.locales` & `messages`.
2. Analytics：`src/analytics/` + `<Analytics />`。记录启用了哪些 provider（PostHog、Umami、Google 等）。
3. Toaster：`<Toaster>` 在 layout 内，`@/hooks/use-toast`.
4. Query/State：`src/components/providers/query-provider.tsx` (React Query)，`useSession`、`useCurrentUser` 等 hook 用法。

### 1.4 服务层与权限
1. Safe Action 客户端：`actionClient`, `userActionClient`, `adminActionClient`（`src/lib/safe-action.ts`）。
2. 领域模块：`src/credits/*`, `src/payment/*`, `src/newsletter/*`, `src/storage/*`, `src/notification/*`等。
3. Hook：`src/hooks/use-*.ts` (React Query + tanstack)。
4. 权限：Better Auth 配置 `src/lib/auth.ts`，角色字段（如 `user.role`）如何控制 UI。

调研产出建议整理成一份 `docs/hybrid-precheck.md`，记录以下信息：
- 当前模块的目标（例如 PPT 审核）。
- 已有 Action/Hook/Schema。
- 需要 v0 生成的 UI 模块清单。

---

## 2. v0 阶段：设计系统导入与产出规范

### 2.1 导入主题

1. 在 v0 的 Design System 设置里粘贴 `globals.css` 的 `:root` 和 `.dark` 变量（可参考本文的 CSS snippet）。
2. 保持与 mk-saas 相同的变量命名（`--background`, `--primary`, `--sidebar` 等），确保 v0 预览与实际近似。

### 2.2 Rules/Sources 配置

上传以下文件（或在 prompt 中引用）：
- `AdminPageShell.tsx`：告诉 v0 所有页面都要用这个容器。
- `v0-rules.md`：含有不允许创建 layout、禁止提供真实 API 的规则。
- `lib/texts.ts` 模板：提醒 v0 文案需要集中管理（便于 i18n）。
- `hook` & `action` 占位说明：例如 `usePptList`、`reviewPptAction`，让 v0 知道这些函数存在，不必再实现业务逻辑。

### 2.3 输出规范

**组件结构**：
```tsx
import { AdminPageShell } from "@/components/admin/admin-page-shell"

export function PptReviewPage({ items, onApprove, ... }: Props) {
  return (
    <AdminPageShell title="PPT 审核">
      <FilterBar onFilterChange={...} />
      <ReviewTable items={items} onApprove={onApprove} />
    </AdminPageShell>
  )
}
```

**约束**：
- 不创建 `<html>`、`<body>`、`ThemeProvider`、`Sidebar`。
- 不写 fetch/axios；所有逻辑通过 props 或 `TODO` 注释提醒后续接线。
- 所有按钮/事件以 `props` 形式暴露（`onUpload`, `onApprove`，参数类型清晰）。
- 使用 `@/components/ui/*` 的 Button/Input/Table；如 v0 不认识 import 路径，保持文本即可，后续复制到 mk-saas 中 import 会生效。
- 所有文案/placeholder 建议来源 `texts`（或通过 props 传入），避免硬编码。

**文档要求**：
- 每个生成的模块附带 README/注释，注明：
  - 期望的 props（type/interface）。
  - 事件回调需要对接的 Safe Action 名称。
  - 依赖的数据结构（`PptItem` 等）。

---

## 3. 集成阶段：把 v0 代码挂到 mk-saas

### 3.1 目录落位

1. `components/` → `src/components/admin/<feature>/...`。
2. `app/page.tsx` → `src/app/[locale]/(protected)/admin/<feature>/page.tsx`（只保留 `<FeaturePage />`）。
3. 若 v0 产出 `lib/`、`hooks/` 用于 mock，迁移时替换为 mk-saas 的真实 hook/action，然后删除 mock 文件。

### 3.2 接线操作

1. **替换数据源**：
   - `const mockData = [...]` → `const { data, isLoading } = usePptList(filters)`。
   - `const handleApprove = (id) => ...` → `const { mutateAsync: approve } = useReviewPpt()`.
2. **接 Safe Action**：
   ```tsx
   <ReviewTable
     items={data?.items ?? []}
     onApprove={(id) => approve({ pptId: id })}
   />
   ```
3. **权限控制**：通过 `const session = useSession()` 控制敏感按钮：
   ```tsx
   if (session?.user.role !== 'admin') return null;
   ```
4. **文案 & i18n**：将静态文案改为 `const t = useTranslations('PptPage')`；或引用 `texts[locale].xxx`。
5. **命名**：添加注释 `// generated via v0 (2024-xx)`，并在 PR 说明中提及来源。

### 3.3 验收 Checklist

1. ✅ 路由：仅 `(protected)/admin/...`，并在 sidebar config 中注册。
2. ✅ 权限：非授权用户无法访问；Action 使用 `adminActionClient`。
3. ✅ 主题：没有多余 layout；`AdminPageShell` 包裹；Tailwind class 与 mk-saas 设计一致。
4. ✅ 逻辑：事件均已接 stub → Safe Action；无 `fetch`/`axios`.
5. ✅ 测试/类型：`pnpm lint`/`pnpm test`；类型同步 `src/types`.
6. ✅ 文档：README/注释解释 v0 组件 props 与 Action 对应关系。

---

## 4. 示例流程（PPT 审核）

1. **调研阶段**：  
   - 目标：审核 PPT；权限：`admin, editor`;  
   - 服务层：`getPptReviewListAction`, `reviewPptAction`;  
   - Hook：`usePptReviewList`, `useReviewPpt`.

2. **v0 设计**：  
   - 生成 `PptReviewPage` + `PptFilterBar` + `PptReviewTable`；  
   - `README` 说明 `onApprove/onReject`→`reviewPptAction`.

3. **集成**：  
   - 拷贝组件到 `src/components/admin/ppt/review/*`；  
   - `page.tsx` 返回 `<PptReviewPage />`;  
   - 用 `usePptReviewList` 替换 mock；`reviewPptAction` 绑定到按钮；  
   - 添加 sidebar 入口 + 文案翻译；  
   - 运行 lint/test。

---

## 5. 适配其它功能的通用流程

1. **字段/数据契约统一**：所有 v0 输出的接口、type 必须对应 mk-saas 的 `interfaces.ts` 或 `schema`。
2. **模块文档**：每个 `src/components/admin/<feature>/README.md` 记录：
   - 功能概述
   - 依赖 Action/Hook 列表
   - 迁移注意事项（导入路径、权限、i18n 键名）
3. **版本管理**：v0 产出若更新，需与原 PR 对比，记录差异；建议在 Git 提交信息加 `[v0-ui]` 标签。

---

## 6. 快速执行步骤（流程图）

1. **分析**：阅读 `layout` / `providers` / `actions` / `hooks` → 输出调研笔记。
2. **准备**：在 mk-saas 中扩展 Action/Hook/Schema，确保服务可用。
3. **生成**：在 v0 导入主题 + 规则 → 创建 UI → 输出代码（+ README）。
4. **迁移**：复制到 `src/components/admin/...` → 接 Action/Hook → 处理权限 → 添加路由。
5. **验证**：lint/test/i18n/权限 → 记录 v0 来源 → 合并。

---

### 附：调研笔记模板（可用于大模型或人工）

```
功能：PPT 审核
路由位置：/admin/ppt-review
权限角色：admin, editor
所需服务：
  - Actions: getPptReviewListAction, reviewPptAction
  - Hooks: usePptReviewList, useReviewPpt
  - Types: PptItem { id, title, status, submittedBy, createdAt }
主题 & UI：使用 AdminPageShell + Table + Dialog
v0 输出目标：
  - ReviewPage: props { items, isLoading, onApprove, onReject }
  - FilterBar/Form/Stats
```

---

只要遵循本文的方法论，就能高效地从 mk-saas 中提取设计与服务要素，利用 v0 设计 UI，并在集成时保持权限、主题、数据访问的一致性。欢迎在 `admin-ppt-guide/` 下持续更新此规范。***
