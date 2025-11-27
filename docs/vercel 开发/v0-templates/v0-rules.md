# v0 Admin UI 生成约束（PPT 模块示例）

将本文件内容复制到 v0 project → Rules → Instructions / Sources，使生成的代码天然兼容 mk-saas Dashboard。

## 1. 技术 & 布局约束

1. 仅使用 Next.js App Router + TypeScript + Tailwind + `@/components/ui/*`。
2. `page.tsx` 只渲染 `<AdminPageShell>` 内容；layout 由 mk-saas 的 `(protected)` 路由提供，不要创建 `<html>` 或 Sidebar。
3. 所有组件放在 `src/components/admin/ppt/`，以 `kebab-case` 命名；默认导出 PascalCase 组件。
4. `AdminPageShell` 从 `@/components/admin/admin-page-shell` 导入，用于包裹整个页面。

## 2. 数据访问约束

1. 禁止直接 `fetch` 或使用外部 SDK；所有动作通过 Safe Action 或 Hook：  
   - 列表：`usePptList()`（React Query）。  
   - 审核：`reviewPptAction(params)`。  
   - 上传：`uploadPptAction(formData)`。  
   - 下载统计：`usePptDownloads(filters)`。  
   - 广告统计：`usePptAdStats(range)`。
2. 客户端表单提交需要调用 action 并在成功后触发 `queryClient.invalidateQueries`（可复用 hook 中的封装）。
3. 错误/成功反馈使用 `toast`（`@/hooks/use-toast`），不要自建 alert。

## 3. 权限 & 路由

1. 页面默认位于 `src/app/[locale]/(protected)/admin/ppt/page.tsx`。  
2. 所有敏感按钮必须检查 `session?.user.role`（通过 `useSession` 或 action 注入），仅允许 `admin/editor`。
3. 不要在客户端自行做积分扣费/权限判断，交给 server action。

## 4. UI 规范

1. Tailwind class 遵循 `text-sm`, `space-y-6` 等设计系统；必要时使用 `cn()`。
2. 列表 & 表单使用 `@/components/ui/table`, `form`, `select`, `dialog`, `card` 等组件。
3. 图表/统计块可复用 `components/dashboard/chart-*`。
4. 一切 icon 使用 `lucide-react`，大小遵循现有模式（`className="size-4"`）。

## 5. 产出要求

1. `page.tsx` 应类似：
   ```tsx
   import { PptAdminPage } from '@/components/admin/ppt/ppt-admin-page'

   export default function Page() {
     return <PptAdminPage />
   }
   ```
2. 主要组件示例：
   ```tsx
   export function PptAdminPage() {
     return (
       <AdminPageShell title="PPT 管理" description="上传、审核、统计">
         <PptToolbar />
         <PptList />
       </AdminPageShell>
     )
   }
   ```
3. 需包含类型定义、loading/error 状态处理、空态文案。

遵守以上规则，v0 生成的 Admin UI 即可直接复制进 mk-saas 并与现有权限/服务层无缝衔接。
