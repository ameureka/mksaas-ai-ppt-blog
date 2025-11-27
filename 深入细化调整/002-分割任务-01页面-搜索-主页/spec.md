# PPT 搜索/推荐主页（/ppt）V1 规格草案

> 目标：替换现有 mock 逻辑，接入真实数据与后端能力，为上线做准备。本草案待确认后再细化实现方案。

## 1. 页面范围与入口
- 路由：`/ppt`（Locale 前缀自动处理）。
- 组成：Hero 搜索区、热门关键词、广告位、搜索结果列表（含筛选）、精选/最新模块。
- 依赖：全局 layout/providers 不改动。

## 2. 数据来源与接口
- 列表/搜索：RSC/Server Action 直接调用数据库（Drizzle），不依赖 `/api`。参数：`search`、`category`（slug）、`language`、`sort`（popular|newest|downloads）、`page`、`pageSize`。
- 数据字段（最小集）：`id`、`title`、`category`（slug）、`tags[]`、`language`、`previewUrl`/`thumbnailUrl`、`downloads`、`views`、`pages`、`createdAt`。
- 计数：列表只读，不在前端加随机数；下载/浏览计数通过后端接口更新（可后续在详情/下载落地）。
- 接口形态：仅使用 Server Components/Server Actions（SSR）；不暴露 `/api/ppts` 给前端加载更多（如后续需要，再补 API）。

## 3. 功能与交互
- 搜索：输入回车或点击搜索触发查询；无关键词时报错提示。
- 筛选：分类（含“全部”）、语言（全部/中文/English）、排序（热度/最新/下载量）。
- 热门关键词：上线先用静态兜底；预留从“热门搜索”生成（后端提供 TOP 关键词列表）。
- 结果展示：卡片列表，支持加载态骨架、空态、错误提示。
- 分页：首版采用页码分页（`page`/`pageSize`），SSR 渲染；未来可兼容“加载更多”/无限滚动（接口保持分页参数即可）。
- 查看更多按钮：跳转到 `/ppt/categories`（保持现有路由）。
- 广告位：`<BannerAd>` 保留但可接受无数据占位。

## 4. 权限与计费
- 浏览/搜索：公开。
- 下载：本页只展示卡片按钮；实际下载鉴权在详情/下载接口处理。登录校验可配置：默认上线初期“无需登录即可下载”，后台开关后可“需登录才能下载”（积分扣减暂不启用）。

## 5. UI/状态要求
- 状态：加载中骨架、空数据提示、错误提示（含重试按钮可选）、搜索限流提示逻辑改为后端返回的错误码而非随机。
- 文案：沿用现有中文文案，按需要在 i18n 中补 key。
- 响应式：保留现有 mobile 搜索弹窗与桌面布局。

## 6. SEO
- 保留现有 schema.org 结构化数据；标题/描述来源：固定营销文案或配置，不依赖随机数据。
- 需要时可根据查询展示 “共 N 个模板” 文案。

## 7. 事件/审计（可选）
- 搜索/筛选/关键词点击/下载尝试的埋点接口：如需保留，改为调用统一日志或后端事件，而非 `console.log`。

## 8. 边界与不做
- 不在本迭代实现评论、推荐算法、真实广告投放位管理。
- 不在本迭代实现下载计费/积分扣减（后续在详情/下载流程处理）。

## 9. 固定决策与待确认
- 已确认：
  - 渲染方式：SSR + Server Actions（无需 `/api/ppts`）。
  - 分类/语言：使用 slug（business, education, technology, creative, marketing, medical, finance, hr, lifestyle, general），中文名映射，语言 zh/en。
  - 热门关键词：上线先用静态兜底，后续按 search-system 设计接入热门搜索统计。
  - 排序：`newest`→`created_at` desc；`popular`→`view_count` desc（次序 download_count）；`downloads`→`download_count` desc。
  - 下载权限：可配置开关；默认上线初期“无需登录即可下载”，开关后“需登录才能下载”；暂不扣积分。
  - 分页交互：首选页码分页（SSR/SEO 友好）；如需“加载更多”，前端可追加客户端 fetch，接口保持分页参数。
- 待确认：
  - 热门搜索统计接入的时间点与接口形态（上线先用静态兜底）。

---
确认以上后，可输出实现步骤与接口定义细稿。
