# CODEX 对话记录（/ppt 搜索主页 & 下载链路）

> 仅做阶段性记录，方便后续回顾设计思路与决策。代码细节以仓库当前版本为准。

## 一、会话背景

- 时间：2025-11（多轮会话）
- 工程目录：`/Users/ameureka/Desktop/mksaas-ai-ppt-blog`
- 目标模块：
  - `/ppt` 搜索/推荐主页 + 分类页 + 详情页；
  - PPT 下载链路（详情页下载弹窗 + 后端计数与权限）。
- 原始状态：
  - `/ppt` 前台页面使用 mock 数据；
  - `src/actions/ppt/*` 使用 mock；
  - 数据库设计与 mksaas 框架设计见 `001-datasize-vector-design` 等文档。

## 二、核心设计步骤（按时间线简要回顾）

1. **整体能力梳理**
   - 通过阅读 `src/app/[locale]/(marketing)/ppt/*` 等，梳理 PPT 模块的页面结构（搜索主页、分类、详情、admin）。
   - 结合 `docs/` 与 `001-datasize-vector-design` 了解 DB 结构、向量化设计、索引策略等。

2. **规格与方案设计（仅文档，不改代码阶段）**
   - 在 `深入细化调整/002-分割任务-01页面-搜索-主页/` 下创建：
     - `spec.md`：/ppt 搜索主页 V1 规格（SSR、分页、筛选、排序、下载开关、热门关键词策略等）。
     - `PLAN.md`：范围、既定决策、改造记录与任务拆分。
     - `工程方案.md`：数据层/前台/后台思路、配置、backlog、规范对齐 MkSaaS 标准。
     - `实施步骤.md`：从数据层 → 配置 → 前台 → 后台 → QA 的执行顺序。
     - `接口设计草案.md`：Server Actions 接口签名、数据映射、配置草案、数据流。
     - `种子数据与数据库说明.md`：ppt 表字段/索引/种子导出导入示例。
     - `热门搜索设计草案.md`：search_log 表、简单榜单/时间窗口榜单设计，初期用静态兜底。

3. **数据库前置验证**
   - 你使用 `psql` 在 Neon DB 上执行 SQL，并提供结果：
     - `\dt`：确认存在 `ppt/slide/category/download_record/view_record` 等表。
     - `\d+ ppt`：确认 ppt 表字段（id/title/category/author/file_url/slides_count 等）、索引（category/status/language/created_at/download_count/view_count）与触发器。
     - `SELECT count(*) FROM ppt;`：68 条数据。
     - 预览若干行，确认 file_url 为可用直链。
   - 我将这些结果记录到 `db-check/README.md`，确认可直接接 Drizzle，不需要额外 seed。

4. **Drizzle Actions 草案（设计区 code-drafts）**
   - 在 `code-drafts/` 下先写出 Drizzle 版本的：
     - `ppt-actions.ts`：getPPTs/getPPTById/create/update/delete/recordDownload/recordView。
     - `ppt-stats.ts`：getDashboardStats。
     - `ppt-config.ts`：下载登录开关、热门关键词、分类映射（草案）。
   - 保证返回格式仍为 `{ success, data?/error?, code? }`，字段映射遵循 TS camelCase → DB snake_case。

5. **正式接入数据层与 API（src/ 下改动）**
   - 将 Drizzle 逻辑迁入：
     - `src/db/schema.ts`：ppt 表列名与实际 DB 对齐（download_count/view_count、cover_image_url/thumbnail_url 等），索引名匹配迁移。
     - `src/actions/ppt/ppt.ts`：用 Drizzle 实现列表/详情/CRUD/计数，支持搜索/过滤/排序/分页。
     - `src/actions/ppt/stats.ts`：用 DB 聚合代替 mock。
   - 新增 API 路由：
     - `GET /api/ppts`：列表查询（search/category/status/sort/page/pageSize）。
     - `GET /api/ppts/[id]`：详情。
     - `POST /api/ppts/[id]/download`：读取下载开关、查询 PPT、recordDownload，返回 `fileUrl`。
   - 配置：
     - `src/types/index.d.ts` 增加 `pptRequireLoginForDownload`；
     - `src/config/website.tsx` 中默认 `pptRequireLoginForDownload: false`。

6. **前台 /ppt 页面与分类页初步接线**
   - 搜索主页 `/ppt`：
     - 初始加载：通过 `fetch('/api/ppts?…')` 拉取数据，填充精选/新品/最近下载等。
     - 搜索：调用 `/api/ppts?search=…`，用真实结果替换 mock。
     - 推荐分类与 Sidebar：使用 slug + 中文名映射；RecentDownloads 使用真实结果切片。
   - 分类页 `/ppt/category/[name]`：
     - 使用 slug 参数 → `/api/ppts?category=slug` 拉取数据；
     - slug → 中文分类名映射；
     - 将热点/精选/新品/全部使用真实数据填充。

7. **下载链路设计与组件分析（未全面改组件逻辑）**
   - 下载方案讨论与组件结构：
     - `004任务-下载组件/下载方案讨论.md`：开关/权限、首免/积分策略、接口流程、容错原则。
     - `004任务-下载组件/组件结构.md`：DownloadModal / DownloadOptionsModal 结构 ASCII + 下载时序图。
   - 现有约定：
     - 开关：`pptRequireLoginForDownload` 控制未登录是否允许下载。
     - 接口：`POST /api/ppts/[id]/download` 作为统一下载入口，未来可扩展积分/订阅/签名 URL。
     - UI：点击下载 → 检查开关 & 登录 → 打开 DownloadModal → 在 Modal 内调用下载接口。

8. **UI 容错与缺失字段策略**
   - `file_size`/`description` 在当前 DB 中无列：
     - 前端约定：file_size 显示“未知”，description 显示“暂无简介”，不阻断下载。
   - `preview_url` 缺失：
     - 使用 placeholder 图替代，或单一封面图复制铺满。
   - `file_url` 缺失：
     - 下载接口返回错误，前端提示“资源不可用”，禁用下载按钮。

## 三、当前状态与下一步

当前状态（此记录时）：

- 数据层与 API 已接通真实 DB（ppt/actions/stats/schema）。
- `/ppt` 与 `/ppt/category/[name]` 已初步接入真实列表数据，仍有部分 UI/交互需要细化。
- 下载接口 `/api/ppts/[id]/download` 已存在，但 DownloadModal/DownloadOptionsModal 仍未改为调用该接口，登录拦截尚未完全接入。
- 所有设计与讨论记录保存在 `深入细化调整/002-分割任务-01页面-搜索-主页/` 与 `004任务-下载组件/` 下。

下一步建议：

1. 在 `/ppt/[id]` 详情页接入下载 API，并将 DownloadModal/DownloadOptionsModal 的按钮改为调用统一接口（含开关/登录逻辑）。
2. 管理端 `/admin/ppt` 列表/编辑/创建接新 actions，使用 URL 文本输入代替上传控件。
3. 视需求逐步接入热门搜索统计、积分/订阅逻辑与签名 URL 防盗链。

