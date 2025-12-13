# 第一PPT资源抓取方案 Spec

## 0. 背景与目标
- **站点**：https://www.1ppt.com（含模板、行业/节日分类、PPT素材/图表、课件等板块）
- **目标**：构建一条可由 MCP/LLM 调度的 Playwright + HTTP 抓取链路，稳定解析所有 PPT/PPTX/RAR 资源并批量下载。
- **验证状态**：已通过 `mcp-services/src/inspect.ts` 实测列表→详情→下载页流程，确认 DOM 稳定、下载链路可用。
- **运行环境**：方案需能在 Ubuntu 或 macOS 主机上直接部署运行（依赖 Node.js + Playwright + MCP SDK，无 Codex CLI 绑定）。
- **数据规模**（分页“末页”×每页条数）：
  | 板块 | 页数 | 每页条数 | 估算条目 |
  |------|------|----------|---------|
  | PPT模板 | 281 | 20 | 5,620 |
  | 行业PPT | 282 | 20 | 5,640 |
  | 节日PPT | 305 | 20 | 6,100 |
  | PPT背景 | 130 | 20 | 2,600 |
  | PPT素材 | 59 | 20 | 1,180 |
  | PPT图表 | 99 | 20 | 1,980 |
  | PPT下载 | 607 | 20 | 12,140 |
  | PPT课件·语文 | 769 | 40 | 30,760（其余学科同量级）
- **平均文件大小**：样本 10 条 ≈ 4.8 MB（0.6–8.5MB），整站下载需 60–170 GB（课件区则 >200 GB）。

## 1. Requirements
### Functional Requirements
1. **分页遍历**：支持按频道（PPT模板/行业/节日/下载等）遍历 `ppt_{channel}_{page}.html`，解析 `ul.tplist > li`。
2. **详情解析**：抓取 `h1`、频道、更新时间、文件大小、附件类型、标签、`aid` 等元信息。
3. **下载链路解析**：
   - 访问 `/plus/download.php?open=0&aid={aid}&cid=3`（附 Referer）获取本地与夸克链接。
   - 调用 `/plus/kuakeajax.php?open=0&aid={aid}&cid=3` 解析夸克分享 URL。
4. **文件下载**：
   - 默认使用 `https://ppt.1ppt.com/uploads/soft/...` 本地直链；失败时回退夸克链接。
   - 支持重试、断点续传、命名规范 `/{channel}/{aid}-{slug}.zip|rar|pptx`。
5. **调度接口**：提供 MCP 工具（或 API）给 LLM 调用，包括：
   - `listTemplates(page, channel)`
   - `fetchTemplateDetail(detailUrl)`
   - `resolveDownloadLinks(aid, detailUrl)`
   - `downloadAsset(url, meta)`
6. **下载目录配置**：文件保存路径需可通过配置文件或 CLI 参数注入，禁止硬编码固定目录，支持多环境自定义。
7. **数据存储**：输出 JSON/SQLite，记录 `aid、title、channel、tags、sizeKB、download_urls、status、file_path`。

### Non-Functional Requirements
1. **鲁棒性**：请求失败自动重试（指数退避），遇 302/403 记录并等待人工确认。
2. **限速 & 反爬**：默认 1–2 并发，每请求间隔 ≥1s，支持代理/UA 轮换。
3. **可观测性**：日志记录步骤（分页、详情、下载）与文件大小、耗时。
4. **可扩展性**：频道/栏目配置化（JSON），新频道只需添加入口。
5. **安全合规**：遵循站点使用条款，仅用于学习研究；保留来源信息。
6. **跨平台兼容**：脚本/配置须避免 OS 特有路径或命令依赖，确保在 Ubuntu/macOS 均可运行（如使用 Node path API、避免 `sed -i` 差异）。

## 2. 约束与假设
- 站点编码 GB2312/GBK，需要转换为 UTF-8 再解析。
- 详情页下载入口固定在 `.downurllist`，JS 通过 DedeAjax 填充夸克链接。
- `download.php` 无 Referer 会 302 返回详情页，脚本必须设置 `Referer`.
- 本地 CDN 直链可直接 HTTP 下载；夸克链接可能需人工登录（备用）。
- 课件区为独立站点样式但 DOM 仍使用 `ul.tplist`，每页 40 条。

## 3. 方案设计
### 3.1 架构概览
```
入口配置(JSON) ──► 分页爬虫（Playwright/Page.request） ──► 详情解析器
                                                     │
                                                     ├─► 下载页解析器 (download.php)
                                                     ├─► kuakeajax 解析器
                                                     └─► 元数据存储 (SQLite/JSONL)
                                                                    │
                                                                    └─► 下载调度器 (队列/Worker)
```

### 3.2 核心模块
1. **Paginator**：读取频道配置 `{name, baseUrl, pagePattern, perPage}`，生成 URL 队列，调用 `Page.goto` + `page.$$eval('.tplist li', …)` 提取卡片字段。
2. **DetailFetcher**：对每个详情 URL 请求，解析 `.ppt_info` 列表内容、`aid`、`tags`、`download.php` 链接。
3. **DownloadResolver**：
   - 使用 Playwright `page.waitForEvent('popup')` 或 `context.request` 打开下载页，抓取 `.downloadlist li a` 文本与 href。
   - 直接 `context.request.get('/plus/kuakeajax.php?…')` 解析夸克链接，保持 Referer。
4. **Downloader**：
   - 通过 `axios`/`node-fetch` 流式下载本地直链；失败则调用夸克链接（可使用浏览器上下文保持登录）。
   - 支持 `Range`/断点策略，校验 `Content-Length` 与元数据 `sizeKB`。
5. **MCP Tooling**：围绕以上模块暴露 4 个工具，允许 LLM 在对话中分步调用，实现“LLM 决策 + 工具执行”。
6. **Persistence**：推荐 SQLite (via better-sqlite3) 记录任务表 `templates(aid primary key, title, channel, size_kb, detail_url, download_url_local, download_url_quark, status, file_path, updated_at)`。

### 3.3 执行流程
1. **初始化**：载入频道列表（可从 `spec` 表格或外部配置），确定抓取范围。
2. **分页爬取**：循环页码→解析 20 条卡片→写入 DB/任务队列。
3. **详情解析**：异步消费队列，调用 `fetchTemplateDetail` 更新元数据、补齐 `aid/sizeKB/tag`。
4. **下载解析**：对已获取详情的条目调用 `resolveDownloadLinks`，获得本地&夸克 URL。
5. **下载执行**：worker 读取状态=READY 的条目，顺序下载并校验，成功后标记 COMPLETED、写入文件路径。
6. **监控/恢复**：失败任务记录 `error_reason`，定期重试或人工检查。

## 4. Plan（实施阶段）
1. **Phase 0 – 项目基建**
   - [ ] 完成 `mcp-services` 项目脚手架（已完成 Playwright/ts-node 安装）。
   - [ ] 新建 `channels.json` 描述入口。
   - [ ] 初始化 SQLite/JSON 数据存储。
2. **Phase 1 – 抓取器实现**
   - [ ] 编写 `src/paginator.ts`：拉取分页、输出卡片列表。
   - [ ] 编写 `src/detailFetcher.ts`：解析 `.ppt_info`、`aid`、`downloadLink`。
   - [ ] 编写 `src/downloadResolver.ts`：访问下载页 + `kuakeajax`。
   - [ ] 编写 `src/downloader.ts`：下载、校验、错误处理。
3. **Phase 2 – MCP 工具化**
   - [ ] 使用 `@modelcontextprotocol/sdk` 实现工具服务器，封装上述模块。
   - [ ] 定义工具 schema（输入参数、输出结构），并在 CLI 测试。
4. **Phase 3 – 批量执行 & 校验**
   - [ ] 选择频道（如 PPT下载）跑全量，监控日志/磁盘占用。
   - [ ] 与样本详情对比，验证记录字段一致，抽查下载文件可打开。
   - [ ] 记录总耗时与平均吞吐，调整并发/限速。
5. **Phase 4 – 扩展 & 维护**
   - [ ] 增强课件区支持（40条/页，URL 模式 `xxxkejian_{page}.html`）。
   - [ ] 加入去重/防止重复下载（基于 `aid`/文件名）。
   - [ ] 如需夸克高速下载，集成账号登录或调用其开放 API。

## 5. Task Breakdown
1. **配置与数据层**
   - 任务 1.1：编写 `channels.json`（字段：`id,name,baseUrl,pagePattern,perPage`）。
   - 任务 1.2：创建 SQLite schema + DAO。
2. **爬虫模块**
   - 任务 2.1：`Paginator` 实装（支持 CLI 参数 `--channel --start --end`）。
   - 任务 2.2：`DetailFetcher` 支持并发 + 失败重试。
   - 任务 2.3：`DownloadResolver` 解析本地/夸克 URL 并持久化。
3. **下载模块**
   - 任务 3.1：下载器封装（支持 Range、MD5 校验可选）。
   - 任务 3.2：磁盘目录规划与空间监控（按频道/年月分文件夹），并提供配置/CLI 参数指定输出根目录，杜绝硬编码路径。
4. **MCP 集成**
   - 任务 4.1：注册工具（list/fetch/resolve/download）并编写文档。
   - 任务 4.2：在 CLI 中通过 LLM 指令测试完整链路。
5. **运行与监控**
   - 任务 5.1：编写运行脚本（如 `npm run crawl -- --channel xiazai`）。
   - 任务 5.2：输出统计报表（总条数、成功率、平均大小、耗时）。
   - 任务 5.3：设置异常告警（连续失败/磁盘不足）。

## 6. 验证与交付标准
1. **功能验收**：随机选 20 条记录，核对元数据与页面一致，下载文件可打开。
2. **性能目标**：单线程限速下能稳定完成 ≥500 条/小时；若加并发，应保持错误率 <2%。
3. **数据完整性**：`aid` 唯一、状态机完整（NEW→DETAIL→RESOLVED→DOWNLOADED/FAILED）。
4. **文档交付**：保留此 spec、运行说明、频道配置、磁盘需求估算表。

---
**附**：已存在脚本 `mcp-services/src/inspect.ts` 可作为模块开发参考或单次验证工具。
