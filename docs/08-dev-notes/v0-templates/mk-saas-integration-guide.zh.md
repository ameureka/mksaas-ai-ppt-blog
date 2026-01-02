# mk-saas 集成指南 (v2.0 - Mock-First Edition)

> **核心原则**: UI 与逻辑分离。v0 只负责生成 UI 和 Mock 数据调用，复杂的后端逻辑和状态管理由 mk-saas 框架接管。

---

## 1. 黄金法则 (The Golden Rules)

### 🚫 禁止生成布局 (No Layouts)
- **绝对禁止**生成 `<html>`, `<body>`, `<aside>` (侧边栏), `<header>` (顶部导航)。
- 页面组件应该是一个纯粹的内容容器 (`div` 或 `AdminPageShell`)。
- 假设页面已经被渲染在 `SidebarProvider` 和 `DashboardLayout` 之中。

### 🧩 Mock 优先 (Mock-First)
- **不要**尝试实现真实的 `fetch` 或 `Server Actions`。
- **必须**调用 `lib/api.ts` 中定义的 Mock 函数 (返回 Promise)。
- 这样我们可以轻松地用真实的 Server Action 替换 Mock 函数，而无需修改 UI 代码。

### 🔗 路由枚举 (Routes Enum)
- **禁止**硬编码字符串路径 (如 `"/admin/users"`).
- **必须**使用 `Routes` 枚举 (如 `Routes.AdminUsers`).

### 🌐 国际化 (i18n)
- **禁止**硬编码中文。
- **必须**使用 `t()` 函数 (如 `t('heroTitle')`).

---

## 2. 目录结构规范

```
app/
  page.tsx                  # 只包含对 FeaturePage 的引用
components/
  FeaturePage.tsx           # 主页面组件 (无 Layout)
  feature-table.tsx         # 子组件
  feature-filter.tsx        # 子组件
lib/
  api.ts                    # Mock API 定义 (关键!)
  types.ts                  # 类型定义
  texts.ts                  # i18n 字典
  routes.ts                 # 路由枚举
hooks/
  use-feature-data.ts       # 数据 Hook (调用 Mock API)
```

## 3. 开发流程

1. **定义 Mock API**: 在 `lib/api.ts` 中定义你需要的数据接口。
2. **构建 UI**: 使用 shadcn/ui 组件构建页面，调用 Mock API 获取数据。
3. **交付**: 提交生成的代码。

---

## 4. 示例代码

### API Mock (`lib/api.ts`)
```typescript
export async function fetchItems(): Promise<Item[]> {
  return Promise.resolve([{ id: '1', name: 'Mock Item' }]);
}
```

### UI Component (`components/FeaturePage.tsx`)
```tsx
import { fetchItems } from '@/lib/api';

export default function FeaturePage() {
  // Use hook to fetch data
  const { data } = useDataList(); 
  
  return (
    <div className="space-y-4">
      {/* Content Only - No Sidebar! */}
      <h1>{t('title')}</h1>
      <DataTable data={data} />
    </div>
  );
}
```
