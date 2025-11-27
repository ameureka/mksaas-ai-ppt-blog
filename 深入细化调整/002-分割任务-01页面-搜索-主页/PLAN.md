# /ppt 搜索主页改造计划（V1）

> 目标：替换 mock，接通真实数据与鉴权配置，确保 `/ppt` 相关页面可上线运行；记录方案、任务清单、后续预留。

## 范围与现状
- 范围：`/ppt` 搜索主页 + 分类页 + 详情页的前台链路；后台管理和下载鉴权作为配套。
- 现状：前端 UI 完整但数据全是 mock；`src/actions/ppt/*` 用 mock 数据；`ppt` 表已有 Drizzle 定义；上传/向量化未接通。

## 已定方案
- 渲染与数据：SSR + Server Actions 直接查 Drizzle，不暴露 `/api/ppts`；页码分页（`page`/`pageSize`）。
- 分类/语言：slug（business, education, technology, creative, marketing, medical, finance, hr, lifestyle, general）+ 中文映射；语言 zh/en。
- 排序：`newest`→`created_at` desc；`popular`→`view_count` desc（次序 download_count）；`downloads`→`download_count` desc。
- 热门关键词：首版静态兜底；预留热门搜索统计接口（参考 search-system design）。
- 下载权限：配置开关；默认免登录下载，开关后需登录；暂不扣积分。
- 上传：本迭代不做上传/向量化，`fileUrl`/`previewUrl` 手工维护。

## 改造记录（预期）
- 数据层：`src/actions/ppt/{ppt,user,stats}.ts` 替换为 Drizzle 查询/写入，去掉随机/延时；支持分页、过滤、详情、创建/更新/删除、下载/浏览计数。
- 页面：`src/app/[locale]/(marketing)/ppt/page.tsx`、`.../category/[name]/page.tsx`、`.../[id]/page.tsx` 改为服务器取数，接入分页/筛选/错误态，去掉 mock。
- 下载链路：新增或改造下载接口（如 `/api/ppts/[id]/download` 或 server action），记录下载并返回直链，读取登录开关。
- 管理端：`src/components/ppt/admin/*` 及对应 admin 页面接真实 actions，隐藏上传控件，使用文本 URL。
- 配置/开关：新增下载需要登录的开关（可放 config/env）；热门关键词静态兜底配置。
- 日志/埋点：保留接口或 TODO，后续落库或统一日志。

## 任务拆分
1) 数据层接通
   - 实现 Drizzle 版的 list/detail/create/update/delete、计数累加、简单统计。
   - 支持分页/筛选（search/category/language/sort/page/pageSize）。
2) 前台页面改造
   - 搜索主页：SSR 取数 + 分页交互（页码），热门关键词静态兜底，错误/空/加载态。
   - 分类页、详情页：用真实数据；去掉 mock 延时与随机；下载按钮调用真实链路。
3) 下载链路与权限
   - 提供下载接口/Action；按开关决定是否要求登录；记录下载计数。
4) 管理端接通
   - 列表/创建/编辑/删除接真实 actions；隐藏上传控件，保留 URL 输入。
5) 配置与文档
   - 添加下载开关、热门关键词兜底配置；在 specs/README 标注现状与用法。
6) 预留/Backlog
   - 上传与预览生成接 S3；热门搜索统计与推荐；积分/扣费；日志/审计落库；向量化检索。

## 关联模块与文件
- 数据：`src/db/schema.ts`（ppt 表），`src/db/index.ts`。
- Actions：`src/actions/ppt/*`。
- 前台页面：`src/app/[locale]/(marketing)/ppt/*`。
- 管理端：`src/app/[locale]/(protected)/admin/ppt/*` + `src/components/ppt/admin/*`。
- 存储：`app/api/storage/upload`（未来接入）。
- 配置：`src/config/website.tsx`（可放下载登录开关），热门关键词兜底可放常量/配置文件。

## 待确认/后续接入
- 热门搜索统计的具体接口与上线时间。
- 下载登录开关的配置位置（env vs. website config）。
- 是否需要保留 API 形式供第三方/后续“加载更多”使用（目前暂不需要）。***
