# mk-saas V0 页面设计要求与布局对接指南

## 背景
- 目标：V0 生成的页面需直接挂载到 mk-saas 现有的全局布局上，复用站点提供的字体、国际化、导航与间距体系。
- 范围：营销域页面放在 `(marketing)`，受保护的业务/账户域页面放在 `(protected)`；所有路径都在 `[locale]` 之下。

## 布局骨架
- **LocaleLayout（根）**：注入全局字体、NextIntl Provider、Nuqs URL 适配、全局 Toaster 与 Analytics。任何页面必须在此布局树下才能继承基础能力。
- **(marketing)/layout.tsx**：内置顶部 `Navbar` 与底部 `Footer`，`main.flex-1` 撑满视口。营销首页、二级页面只需作为子路由挂载即可自动获得导航与页脚。
- **(protected)/layout.tsx**：提供 `SidebarProvider` 尺寸变量、`DashboardSidebar`（含 Logo、动态菜单、用户卡片）与 `SidebarInset` 内容区。业务内页（如用户管理）挂载后可复用侧栏与内容间距。

## 导航与权限
- **侧边导航模型**：`sidebar-config.tsx` 定义 Dashboard、Admin Users、Settings 等分组，并支持基于角色的 `authorizeOnly` 过滤。新增受保护页面需匹配路由并在配置中挂载或沿用现有项，以确保高亮与可见性一致。
- **路径与角色**：保持“营销 → 注册/登录 → Dashboard → 设置/管理”链路；敏感页面放在 `(protected)`，并依赖菜单过滤或守卫控制访问。

## 设计原则与约束
1. **保持布局继承**：避免绕过 `(marketing)` 与 `(protected)` 既有 layout；不要重复注入导航、页脚或侧栏。
2. **遵循全局样式栈**：Layout 已注入字体、Tailwind 指示器、Toaster、Analytics；组件仅需使用 Tailwind 工具类与 `cn` 组合 class。
3. **导航一致性**：顶部导航由 `Navbar` 提供，侧边导航由 `DashboardSidebar + sidebar-config` 提供；路径与命名需与配置对齐。
4. **多语言兼容**：所有路由位于 `[locale]` 下，文案应通过 `next-intl` 命名空间（如 `Marketing.*`, `Dashboard.*`），避免硬编码固定语言。
5. **信息架构**：保持层级清晰（主页 → 二级营销页 → 注册/登录 → Dashboard → 设置/管理），避免孤立页面。
6. **权限敏感性**：用户管理等页面应依赖角色过滤；必要时在页面内增加守卫逻辑，确保仅授权角色可见。
7. **UI 一致性**：Dashboard 区域使用 `SidebarInset` 约束内容宽度与内边距；营销页使用 `main.flex-1` 对齐 Navbar/Footer。

## V0 交付约束
- **组件责任**：仅产出页面主体内容，复用已有布局；不要重新定义全局 Provider、导航、页脚或侧栏。
- **命名与路径**：遵循既有路由约定（如 `/dashboard`, `/admin/users`, `/settings/...`），以匹配菜单高亮与跳转。
- **资产与样式**：优先使用已有 UI 组件和 Tailwind token，不新增全局样式或字体。
- **可访问性**：保持表单与交互的可访问属性（`aria-*`、焦点状态），遵循现有组件模式。

