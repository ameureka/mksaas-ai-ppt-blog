## PPTHub 数据库初始化数据约束（PPT 模板）
#20251212

> 目标：为 `piliang` 产线导出的元数据/批量导入脚本提供**统一、可执行的初始化数据规范**，确保空库重建后可直接支撑前台展示、SEO 与向量/混合搜索。

---

### 一、适用范围与目标表

- **目标表**：PPTHub 生产库 `ppt` 表（PostgreSQL + pgvector）。
- **初始化数据来源**：`piliang` 车间 A/B/C 产物（`assets.db.processed_assets`）+ 文件存储 URL。
- **不在本规范范围内**：运行期行为表（`search_log / hot_keywords / pinned_keywords / ad_watch_record / user_download_history / payment / user_credit` 等），这些应由线上逻辑/脚本增量生成。

---

### 二、字段分层与必备程度

#### A. 必须字段（缺一不可）

| 字段 | 类型 | 作用 | 约束/校验 |
|---|---|---|---|
| `title` | string | 主展示、SEO、向量输入 | 非空，去首尾空格；建议 1–100 字符；避免纯符号/重复标题 |
| `file_url` | string(URL) | 下载/预览直链 | 非空；必须 https 且导入前校验可访问(HTTP 200) |
| `category` | enum string | 分类聚合/展示 | 必须是 12 个有效 slug 之一（见下文映射表） |
| `thumbnail_url` | string(URL) | 列表卡片首图 | 必须是可访问图片 URL；若只提供 cover，导入脚本需回填 thumbnail |
| `status` | enum string | 前台/搜索过滤 | 仅允许 `draft / published / archived`；初始化批量默认 `published` |
| `deleted_at` | null | 软删过滤 | 初始化时必须为 `NULL`（建议数据文件不填，脚本默认空） |

#### B. 强烈建议字段（显著影响相关性/SEO）

| 字段 | 类型 | 作用 | 约束/校验 |
|---|---|---|---|
| `description` | string | SEO、SQL 降级搜索、向量输入 | 建议 50–500 字；允许空但会显著降低搜索质量 |
| `tags` | string[] | 向量输入、SQL tags 搜索、详情展示 | 数组；每项去空格/去重；建议 3–8 个，每项 ≤ 20 字 |
| `slides_count` | number | 详情/卡片信息 | 整数 ≥ 0；未知可填 0（建议 Python 侧离线提取） |
| `language` | string | 多语言展示/未来过滤 | 建议统一 `中文 / English / 其他`（与前端筛选值一致）；缺失可由规则/AI 推断并回填 |
| `author` | string | 展示、SQL 搜索字段之一 | 可空但建议补齐，默认可用 `PPTHub/Unknown/来源站名` |

#### C. 初始化增强字段（保留权重/历史）

| 字段 | 类型 | 作用 | 约束/校验 |
|---|---|---|---|
| `id` | string | 旧链接/外部引用稳定 | 若提供必须唯一，推荐 `ppt_{aid}` 便于回溯与增量重跑；不提供脚本生成 uuid |
| `created_at` | datetime | 新品排序/SEO 新鲜度 | ISO8601；不提供则用导入时间 |
| `updated_at` | datetime | 增量更新比对 | ISO8601；不提供则用导入时间 |
| `download_count` | number | 热度排序权重 | 整数 ≥ 0；不提供可默认 0（或后续脚本补充） |
| `view_count` | number | 热度排序权重 | 整数 ≥ 0；不提供可默认 0（或后续脚本补充） |
| `file_size` | number | 元数据展示/筛选 | 字节数 ≥ 0；可空 |
| `file_format` | string | 元数据展示 | 建议 `pptx/ppt/pdf` 等；默认 `pptx` |
| `cover_image_url` | string(URL) | 大图展示 | 可空；若填需可访问 |
| `visibility` | string | 公私有预留 | 默认 `public` |
| `review_status` | string | 审核预留 | 当前代码不依赖，可空 |
| `tenant_id` | string | 多租户预留 | 可空 |

#### D. 向量相关字段（一般不要求人工准备）

| 字段 | 类型 | 说明 | 导入策略 |
|---|---|---|---|
| `embedding` | float[1024] | pgvector 语义向量 | 若提供需维度=1024 且全为 finite；否则忽略并重算 |
| `embedding_model` | string | 模型名 | 若 embedding 提供但无 model，默认 `BAAI/bge-m3` |
| `embedding_status` | enum string | `pending/success/failed` | 初始化统一置 `pending`，由 EmbeddingService/repair cron 写回 |
| `embedding_error` | string | 最近失败原因 | 初始化不填；失败自动写入 |
| `embedding_updated_at` | datetime | 最近生成尝试时间 | 初始化不填；生成/重试自动写入 |

---

### 三、分类 slug 映射（必须严格匹配）

```ts
const VALID_CATEGORIES = {
  business:   '商务汇报',
  education:  '教育培训',
  technology: '科技互联网',
  design:     '设计创意',
  marketing:  '产品营销',
  hr:         '人力资源',
  medical:    '医疗健康',
  finance:    '金融财务',
  general:    '通用模板',
  summary:    '年终总结',
  report:     '述职报告',
  plan:       '工作计划',
};
```

> 数据库无枚举约束；导入脚本必须做严格校验，否则前台分类页会异常。

---

### 四、跨字段/链路级约束（导入器必须校验）

1. **展示可用性约束**  
   - 仅 `status='published' AND deleted_at IS NULL` 的记录会被首页/搜索 API 返回。  
   - 初始化时应保证对外展示资源全部为 published。

2. **搜索质量最低要求**  
   - 至少满足其一：`description` 非空 或 `tags` ≥ 2；否则向量与 SQL 召回都弱。  
   - `title + description + tags` 会被拼接为 embedding 输入文本。

3. **URL 可访问性**  
   - `file_url / thumbnail_url / cover_image_url`（若有）必须可访问；  
   - 图片需为 `image/*`，避免 404/防盗链导致卡片空白。

4. **自然键幂等**  
   - 每条数据必须可用自然键去重：推荐 `file_url`；若缺失则用 `title + category` 组合。  
   - 导入脚本需保证同自然键多次导入不会产生重复记录。

5. **字符规范**  
   - 统一 UTF‑8，去 BOM；所有文本去首尾空格；  
   - `tags` 避免混用全角/半角逗号导致分裂。

---

### 五、文件级结构建议（支持全量重建 + 未来增量）

导出/初始化文件建议带 `meta` 区，便于回溯与重跑：

```json
{
  "meta": {
    "schema_version": "ppt-import-v2",
    "exported_at": "2025-12-12T00:00:00Z",
    "natural_key": "file_url",
    "source": "piliang",
    "source_batch_id": "20251212-batch-01"
  },
  "items": [
    { "...ppt fields..." }
  ]
}
```

- **允许额外字段**（不入库）：如 `local_file_path / local_thumb_path / raw_category`，用于自动上传/映射与校验。

---

### 六、与 piliang 产线字段对齐（参考）

`processed_assets` → `ppt` 的常见映射：

| piliang(SQLite) | PPTHub(Postgres) | 说明 |
|---|---|---|
| `title` | `title` | 已清洗标题 |
| `original_tags`/`ai_keywords` | `tags` | 合并去重后导出 |
| `ai_summary` | `description` | SEO/向量输入主来源 |
| `file_path` | `file_url` | 上传 R2 后回填外链 |
| `cover_path` | `thumbnail_url`/`cover_image_url` | 上传 R2 后回填外链 |
| `pages_count` | `slides_count` | 页数 |

> 具体导出格式与脚本实现将在“数据准备格式”章节单独定义。
