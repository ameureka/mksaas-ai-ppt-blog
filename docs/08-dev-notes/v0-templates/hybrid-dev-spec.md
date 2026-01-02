# mk-saas Admin × v0 混合开发规范（草稿）

> 目标：在不牺牲 mk-saas Admin 权限/服务层的一致性的前提下，利用 v0 快速产出 UI。本文定义流程、约束与落地目录，作为后续实践的统一指南。

---

## 0. 角色与范围
- **mk-saas Admin**：Next.js 16 App Router，Dashboard 布局在 `app/[locale]/(protected)/layout.tsx`，服务层由 `src/actions/*` + 领域模块完成。
- **v0（可视化 UI）**：仅用于设计“内容区域”组件，如表单、表格、详情、统计等。
- **混合原则**：**逻辑/权限/数据访问在 mk-saas 原生实现**；**UI skeleton 可用 v0 生成**并迁入 `src/components/admin/*`。

---

## 1. 项目结构与命名

| 类型 | 推荐目录 |
| --- | --- |
| 路由入口 | `src/app/[locale]/(protected)/admin/<feature>/page.tsx`（仅 `return <FeaturePage />`） |
| v0 组件 | `src/components/admin/<feature>/`（文件名 `ppt-table.tsx` 等） |
| 领域服务 | `src/actions/<domain>/*.ts` + `src/<domain>/*` |
| Hook | `src/hooks/use-<domain>-*.ts` |
| 模板/文档 | `admin-ppt-guide/*`（当前目录，包含 `AdminPageShell.tsx`, 规则等） |

命名约定：
- v0 导入组件可在文件头添加注释 `// generated via v0 (YYYY-MM-DD)`，便于后续追踪。
- 组件使用 PascalCase，文件 `kebab-case.tsx`；hook 以 `use-` 开头。

---

## 2. 流程步骤

### Step 1. 需求梳理（mk-saas 端）
1. **确定领域服务**：新功能所需的数据库 schema、Safe Action、hook。
2. **权限配置**：`sidebar-config.tsx`、`routes.ts`、`adminActionClient`/`userActionClient` 设定哪些角色可访问。
3. **准备容器**：若已有 `AdminPageShell`，直接使用；否则先创建可复用的页面 shell 提供标题、工具栏位等。
4. **设计数据契约**：定义 `type PptItem`, `type ApprovePayload` 等，让 UI/服务共享类型（`src/types/` 或局部 `types.ts`）。

### Step 2. v0 设计/输出
1. **导入主题**：将 `admin-ppt-guide` 提供的 CSS 变量复制到 v0 Design System。
2. **设置 Rules/Sources**：使用 `admin-ppt-guide/v0-rules.md`（强调仅输出内容区域、使用 `AdminPageShell`、调用指定 hook/action）。
3. **生成组件**：在 v0 中设计 UI，确保：
   - 只渲染 `<AdminPageShell>` 内部内容；
   - 不包含 Layout/ThemeProvider/路由；
   - 所有事件通过 props 表示（`onApprove`, `onUpload`），体内禁止 fetch/axios；
   - 表格/表单数据允许 mock，但必须写明“迁移后用 `useXxx` 替换”。
4. **导出代码**：保存 `components/`, `hooks/`, `lib/`（如需 mock），`tests/`（至少 1 个 smoke test）。

### Step 3. 迁移到 mk-saas
1. **复制文件**：把 v0 的 `components` 放进 `src/components/admin/<feature>/`；`app/page.tsx` 复制到 `app/[locale]/(protected)/admin/<feature>/page.tsx`。
2. **接线逻辑**：
   - 替换 mock hook → `useXxx`（真实 React Query Hook）。
   - 将 props 回调连接至 Safe Action（`onApprove => approveAction({ ... })`）。
   - 导入 `AdminPageShell` 和 `@/components/ui/*`。
3. **类型与 i18n**：引用常量/枚举（`Routes`, `texts`）。文案用 `t('Key')` 或 `texts.en.xxx`，避免硬编码。
4. **测试**：跑 `pnpm lint`、`pnpm test`；验证权限（不同用户角色访问）及数据流。

---

## 3. v0 阶段「可/不可」清单

| 可做 | 不可做 |
| --- | --- |
| 使用 Tailwind + `@/components/ui/*` 设计表单/表格 | 创建 `<html>/<body>`、ThemeProvider、Sidebar |
| 定义 props 事件、mock 数据样例 | 调用真实 API/写 fetch/axios、处理权限逻辑 |
| 引用 `AdminPageShell`、`Button`, `Table`, `Dialog` 等 | 引入第三方 UI 库（除非已有） |
| 在 README 注明：`onApprove` 等函数最终会接 Safe Action | 修改服务层期望的输入/输出契约 |

---

## 4. 集成 Checklist（mk-saas 端）
1. ✅ 路由：文件位于 `(protected)/admin/<feature>`。
2. ✅ Layout：组件外层包裹 `AdminPageShell`，无重复 layout。
3. ✅ 权限：按钮/页面使用 `useSession` 判断角色；Safe Action 使用 `adminActionClient`。
4. ✅ 数据：所有数据读写通过 hooks/action；无直接 fetch。
5. ✅ 主题/字体：Tailwind class & CSS 变量；不可重设 `body` 字体。
6. ✅ Toast/Analytics：使用现有 `toast()` / `Analytics`；不自行封装。
7. ✅ 命名与注释：保留 v0 来源注释；必要时在 PR 描述注明“UI generated via v0，已接线到 XXX action”。

---

## 5. 示例：PPT 审核模块

1. **服务层准备**
   - Schema：`ppt_files`, `ppt_review_logs`.
   - 动作：`getPptReviewListAction`, `reviewPptAction`.
   - Hook：`usePptReviewList`, `useReviewPpt`.
   - Sidebar：新增 `/admin/ppt-review` 条目。

2. **v0 输出**
   - 页面 `PptReviewPage`: `AdminPageShell` + `FilterBar` + `ReviewTable`.
   - `ReviewTable` 接 `items`, `onApprove`, `onReject`.
   - `FilterBar` 接 `onFilterChange`.

3. **集成**
   - `app/[locale]/(protected)/admin/ppt-review/page.tsx`:
     ```tsx
     import { PptReviewPage } from '@/components/admin/ppt-review/ppt-review-page';
     export default function Page() {
       return <PptReviewPage />;
     }
     ```
   - `PptReviewPage` 内：
     ```tsx
     const { data, isLoading } = usePptReviewList(filters);
     const { mutate: approve } = useReviewPpt('approve');
     return (
       <AdminPageShell title="PPT 审核">
         <PptFilterBar onFilterChange={setFilters} />
         <ReviewTable
           items={data?.items ?? []}
           isLoading={isLoading}
           onApprove={(id) => approve({ pptId: id })}
         />
       </AdminPageShell>
     );
     ```

---

## 6. 建议的工作节奏

1. **规划阶段**：在 mk-saas 中梳理 domain → 定义 action/hook → 编写 `v0-rules`。
2. **v0 阶段**：导入主题 → 生成 UI → 在 README 标注字段含义、事件说明。
3. **集成阶段**：复制代码 → 接线 → lint/test → 权限验证 → 提 PR。
4. **维护**：若服务接口变化，只需更新 hook/action；UI 组件可复用。v0 生成的部分建议定期 review，避免遗留过多 mock 逻辑。

---

> 如需更新本规范，请在 `admin-ppt-guide/hybrid-dev-spec.md` 编辑并同步给团队。所有 v0 项目在启动前，需要先确认本文件的约束已满足。
