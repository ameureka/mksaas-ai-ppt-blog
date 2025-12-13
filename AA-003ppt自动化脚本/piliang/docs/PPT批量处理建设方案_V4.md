# PPT 批量处理与智能化工厂建设方案 (V5.0)

> **修订记录**:
> - V5.0: 在 V4.0 基础上补齐“空库可重建/向后兼容 PPTHub 初始化流水线”的完整链路：新增 **车间 0 输入收敛**、**车间 E 发布上传**、**车间 F 导出初始化文件** 与两道质量门；明确标准输入包格式、短 URL 命名策略（`ppt_{aid}`）、分类 slug 与语言派生规则，并扩展 `processed_assets` 字段以支持直接生成 `ppthub-init.json/csv`。
> - V4.0: 针对 PPT 详情页展示需求，细化 AI 内容理解字段，新增 `pages_count` (Python 读取)、`structure_features` 和 `template_features` (AI 生成)。调整 AI Prompt 策略。
> - V3.0: 深化 AI 内容理解 (车间 C) 的实现路径，确定为 "Python 生成 Prompt -> Agent/CLI 执行 -> Python 回填" 的文件交换模式。
> - V2.0: 基于解剖调研修正去水印和品牌注入策略。
> - V1.0: 初始草案。

## 1. 项目背景与目标
本项目旨在建立一条自动化的数据生产流水线 (Pipeline)，将爬虫采集到的原始 PPT 模板资源转化为**标准化、无品牌痕迹、高价值**的成品资源。
重点在于**品牌重塑 (Rebranding)** 至 **PPTHub** (`https://www.ppthub.shop/`)，并通过异步 AI 处理流程提取深层元数据，构建高质量的向量检索库，以支撑未来 PPT 详情页的丰富展示。

同时，V5.0 明确本工厂的终态产物需**直接满足 PPTHub 空库初始化约束**：
- 产线最终导出的 `ppthub-init.json/csv` 可直接进入 PPTHub 的批量入库/向量化流水线（详见 `PPTHub数据库初始化数据约束.md` 与数据库初始化 Phase 1–6）。
- 工厂侧不强制生成 pgvector embedding，只保证 `title/description/tags` 质量与可用的远程下载链接。

## 2. 技术路线选型 (Tech Stack)

*   **核心语言**: **Python 3.10+**
*   **PPT 操作**: **`python-pptx`** (深度清洗与页面重构)
*   **AI 交互**: **File-based Prompting** (异步模式) - 利用 Gemini CLI 处理预生成的 Prompt 文件，规避 API 依赖。
*   **数据管理**: `sqlite3`, `pandas`
*   **发布/导出**: 额外提供 Publisher + Exporter 模块：
    - Publisher：将成品 PPTX/封面上传至 R2/S3，并生成**短公共 URL**（禁止 pre‑signed 长链接）。
    - Exporter：从 `assets.db.processed_assets` 生成满足 PPTHub 初始化约束的 `ppthub-init.json/csv`（包含 meta + items）。
*   **规则配置**: `category-mapping.yaml`（关键词→12 分类 slug 映射，规则优先；AI 兜底）。

## 3. 核心处理流程 (Pipeline Design)

### 车间 0：输入收敛 (Ingest & Normalize)

> 目标：把爬虫产物收敛为“已解压主 PPTX + 封面 + 原始 meta”的**标准输入包**，后续车间只面向统一形态处理。

#### 0.1 标准输入包格式（推荐目录式）

每个模板一个目录（已解压）：

```text
input_raw/
  {channel_id}/
    {aid}/
      main.pptx
      cover.jpg
      meta.json
```

`meta.json`（允许附加字段，但至少包含）：
```json
{
  "aid": "139646",
  "title": "灰色简约曲线背景的欧美风商务汇报PPT模板",
  "channel_id": "ppt_moban",
  "channel_name": "欧美PPT模板",
  "original_tags": ["灰色","简约","商务","欧美"],
  "ratio": "16:9",
  "file_size_kb": 1350,
  "attachment_type": "zip",
  "origin_updated_at": "2025-10-01T00:00:00Z",
  "detail_url": "https://www.1ppt.com/moban/xxx.html"
}
```

> 注意：
> - 爬虫侧 `attachment_type` 可能与实际下载文件扩展不一致（如 `.rar` 标记但实际为 `.zip`），解压必须以 `file_path` 指向的真实文件为准，`attachment_type` 仅作参考。
> - 同一资源可能在多个频道出现，车间 0 需按 `url/aid` 去重并合并 `original_tags`，避免后续重复导出。

**主文件选择规则（当目录内存在多个 pptx 时）**：
1) 文件名包含 `aid/title` 的 pptx 优先；  
2) 否则取体积最大的 pptx；  
3) 再不行取第一个 pptx，并记录 `WARN_MULTI_PPTX`。

**封面匹配规则**：
优先从爬虫 `downloads/{channel_id}/images/{aid}-cover.jpg` 匹配；缺失允许为空但需记录 warning。

#### 0.2 质量门 1：原始完整性校验 (Preflight)

对每个 `input_raw/{channel_id}/{aid}` 校验：
- 必须存在 `main.pptx`
- `meta.json` 必须含 `aid/title/channel_id/channel_name/original_tags`
- `cover.jpg` 缺失记 warning，不阻塞后续。

### 车间 A：预处理 (ETL)
1.  **输入**: 读取 `input_raw/{channel_id}/{aid}/main.pptx` 与 `meta.json`。
2.  **标准化命名**: 本地成品命名保持 `{aid}-{title}.pptx` 便于人工排查；远程发布阶段另用短 ID 命名（见车间 E）。
3.  **封面**: 迁移并重命名封面图片至 `output/{channel_id}/images/{aid}.jpg`（若有）。
4.  **页数**: 使用 `python-pptx` 读取 PPTX 文件总页数 `pages_count`。
5.  **元数据补齐**: 计算 `file_size_kb`、写死 `file_format='pptx'`，保留爬虫侧 `origin_updated_at` 作为 `origin_created_at` 口径来源。

### 车间 B：深度清洗 (Deep Cleaning)

#### 1. 全局文本清洗
*   **替换规则**:
    *   `"第一PPT"` / `"1ppt"` -> **删除** 或替换为 `"PPTHub"`.
    *   `"www.1ppt.com"` -> **替换** 为 `"www.ppthub.shop"`.
*   **元数据重置**:
    *   `Title`: `{title} - PPTHub`
    *   `Author`: `PPTHub`
    *   `Company`: `PPTHub Inc.`
    *   `Comments`: `Download more at https://www.ppthub.shop/`

#### 2. 页面手术
*   **首页 (P1)**: 注入 `Presented by PPTHub` (若有空缺副标题)。
*   **尾部处理**: **强制删除倒数后 3 页**，并向前扫描直至无敏感词。
*   **品牌注入**:
    *   在清理后的末尾，插入 **1 页** `brand_end_slide.pptx` ("THANKS", "感谢您的观看", "https://www.ppthub.shop/")。

> 车间 B 额外输出：将成品 `author` 统一标记为 `PPTHub`（作为 PPTHub 初始化 author 默认值），并对 AI 可能引用的来源词做二次敏感词过滤。

### 车间 C：AI 内容理解 (AI Enrichment) - *异步文件交换模式*

此环节不阻塞清洗流程，可独立运行。产出字段与详情页展示高度匹配。

#### 步骤 1: 任务生成 (Generator)
*   Python 脚本遍历已清洗的 PPT。
*   提取 **Title**, **Tags** (DB), **Directory Text** (目录页文本), **PPTX 全文**。
*   生成 `ai_tasks/pending/{aid}.md` Prompt 文件。
    *   **Prompt 目标**: 忽略英文占位符，基于标题、标签及 PPT 全文（而非仅目录页）生成更丰富的 JSON 格式元数据。

#### 步骤 2: 批量执行 (Executor)
*   **操作者**: 用户 (通过 CLI Agent) 或 Shell 脚本。
*   **动作**: 读取 `pending/*.md`，调用 Gemini 模型，将输出结果保存至 `ai_tasks/completed/{aid}.json`。

#### 步骤 3: 数据回填 (Backfiller)
*   Python 脚本扫描 `completed/*.json`。
*   校验 JSON 格式。
*   更新数据库 `processed_assets` 表，**新增以下 AI 生成字段**：
    *   `ai_summary` (text): 200字以内的中文介绍，描述风格、配色、元素和适用场景。
    *   `ai_keywords` (text): 扩充 5-10 个核心关键词。
    *   `ai_scenario` (text): 适合的具体使用场景。
    *   `ai_color_scheme` (text): 推测的主要配色。
    *   `ai_structure_features` (text): 模板内部结构特点描述。
    *   `ai_template_features` (text): 模板特有功能或编辑特点。

*   **新增 PPTHub 兼容派生字段（必须产出）**：
    1. `ppthub_category`：12 个分类 slug 之一  
       - 规则优先：根据 `title/channel_name/original_tags/ai_keywords` 的关键词映射表判定（配置在 `category-mapping.yaml`）。  
       - AI 兜底：Prompt 中要求输出最终 slug。  
       - 仍不确定则回落 `general`。
    2. `language`：`中文 / English / 其他`  
       - 规则检测：先判定 zh/en/other（中文字符占比 > 30% → zh；英文占比 > 70% → en；否则 other），再映射到前台值：zh→中文、en→English、other→其他；AI 可修正。
    3. `tags_final`：准备导出给 PPTHub 的 tags  
       - 合并去重：`tags_final = uniq(trim(ai_keywords ∪ original_tags))`  
       - 收敛到 3–8 个；不足则补充 title 中的关键词。
    4. `description_final`：准备导出给 PPTHub 的 description  
       - 首选 `ai_summary`；为空则用 `title + ai_scenario` 拼接成 ≥50 字描述。

#### 字段覆盖度评估与 AI Prompt 调整

为了更好地支撑 PPT 详情页的展示需求，我们对 AI 生成字段的覆盖度进行了详细评估，并相应调整了 AI Prompt 策略：

| 截图信息               | AI 字段覆盖度                 | 是否需要新增字段？ | 补充说明                                                 |
| :--------------------- | :---------------------------- | :----------------- | :------------------------------------------------------- |
| **标题**               | `title` (来自爬虫)            | 否                 | 爬虫已抓取，AI 无需生成。                                |
| **下载量**             | 否                            | 否                 | 运营数据，AI 无法生成。                                  |
| **页数**               | `pages_count` (Python 读取)   | 是                 | 通过 `python-pptx` 读取，无需 AI 生成。                  |
| **格式**               | `attachmentType` (来自爬虫)   | 否                 | 爬虫已抓取（如 `.zip`，解压后是 `.pptx`）。             |
| **比例**               | `ratio` (来自爬虫)            | 否                 | 爬虫已抓取。                                             |
| **语言**               | `language` (规则/AI 派生)     | 是                 | 爬虫侧无稳定语言字段；按规则检测并输出 `中文/English/其他`，AI 可兜底修正。 |
| **更新时间**           | `updatedAt` (来自爬虫)        | 否                 | 爬虫已抓取。                                             |
| **模板描述**           | `ai_summary` (AI 生成)        | 否                 | 完全覆盖，`ai_summary` 应包含这部分信息。               |
| **适用场景**           | `ai_scenario` (AI 生成)       | 否                 | 完全覆盖，`ai_scenario` 专门为此设计。                   |
| **包含内容**           | `ai_structure_features` (AI 生成) | 是                 | AI 根据 PPT 全文总结其内部结构特点。                     |
| **模板特色**           | `ai_template_features` (AI 生成) | 是                 | AI 根据 PPT 全文总结其独特编辑特点。                     |
| **关键词**             | `ai_keywords` (AI 生成)       | 否                 | 完全覆盖。                                               |
| **配色方案**           | `ai_color_scheme` (AI 生成)   | 否                 | 完全覆盖。                                               |

**AI Prompt 调整 (示例)**：

```markdown
# Context
Title: [PPT标题，来自爬虫]
Original Tags: [原始标签，来自爬虫]
# (可选)Directory Structure: [提取自目录页，如果能通过 Python 脚本解析]

# Full Text (清洗后的 PPTX 全文):
[这里是清洗后 PPTX 中的所有可提取文本]

# Task
你是一个专业的 PPT 资源整理专家。请根据以上信息，输出以下 JSON 格式的元数据，请勿包含任何无关的英文占位符和无关文本：

1. **ai_summary**: 200字以内的中文介绍，描述风格、配色、元素和适用场景。
2. **ai_keywords**: 扩充 5-10 个中文关键词（SEO用）。
3. **ai_scenario**: 适合的具体使用场景（如“互联网路演”、“科技发布会”）。
4. **ai_color_scheme**: 推测的主要配色（如“黑金”、“蓝紫”）。
5. **ai_structure_features**: 提取模板的内部结构特点 (例如“包含封面、目录、正文、总结章节”或“图表与占位符丰富”)。
6. **ai_template_features**: 提取模板的独特编辑特点 (例如“全矢量可编辑”或“统一配色与字体”)。
7. **ppthub_category**: 输出 PPTHub 分类 slug（business/education/.../plan），只输出一个。
8. **language**: 输出主要语言（中文/English/其他）。

请仅输出 JSON。
```

### 车间 D：成品输出
*   **文件结构**:
    ```text
    output/
    └── ppt_moban/
        ├── 139719-蓝紫宇航员....pptx  (已清洗)
        └── images/
            └── 139719-cover.jpg
    ```
*   **数据**: SQLite 数据库包含完整的清洗状态和 AI 增强元数据。

### 车间 E：发布上传 (Publish)

> 目标：把车间 D 的本地成品发布到 R2/S3，并生成**短公共下载 URL**，避免中文文件名导致 URL 过长。

**远程命名策略（已确认）**：
- PPTHub 侧 id 使用 `ppt_{aid}`，远程文件名不带中文 title：  
  - PPTX：`ppts/{ppthub_category}/ppt_{aid}.pptx`  
  - 封面：`thumbs/{ppthub_category}/ppt_{aid}.jpg`
- URL 采用 `STORAGE_PUBLIC_URL` 生成的公开短链接，禁止写入 pre‑signed 长链接。

发布成功后回填：
`file_url_remote / thumbnail_url_remote / cover_url_remote / publish_status`。

### 车间 F：导出 PPTHub 初始化文件 (Export)

> 目标：从 `processed_assets` 生成可直接导入 PPTHub 的初始化文件。

输出目录：
```text
exports/ppthub-init/{batch_id}/
  ppthub-init.json
  ppthub-init.csv
  report.md
```

`ppthub-init.json` 结构：
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
    {
      "id": "ppt_139646",
      "title": "...",
      "category": "business",
      "tags": ["..."],
      "description": "...",
      "language": "中文",
      "slides_count": 24,
      "file_url": "https://pub-xxx.r2.dev/ppts/business/ppt_139646.pptx",
      "thumbnail_url": "https://pub-xxx.r2.dev/thumbs/business/ppt_139646.jpg",
      "cover_image_url": "https://pub-xxx.r2.dev/thumbs/business/ppt_139646.jpg",
      "file_size": 1382156,
      "file_format": "pptx",
      "author": "PPTHub",
      "status": "published",
      "visibility": "public",
      "created_at": "2025-10-01T00:00:00Z",
      "updated_at": "2025-12-12T00:00:00Z"
    }
  ]
}
```

> 导出时 `file_size` 使用清洗后 PPTX 的**字节数**（非 KB），以确保 PPTHub 前端展示与统计一致。
> 若后续导入走 PPTHub 的 `createPPT` action（而非纯 SQL 批量导入），导入脚本需将 `thumbnail_url/cover_image_url` 兼容映射到 `preview_url` 字段，以保证卡片封面正常展示。

#### 质量门 2：导出前终检 (Final Gate)
- `category` 必须在 12 slug 内  
- `file_url/thumbnail_url` 必须为公开短链接且可访问  
- `description` 非空或 `tags_final` ≥ 2  
- `status='published'` 且 `deleted_at IS NULL`

## 4. 目录结构规划

```text
piliang/
├── docs/
├── src/
│   ├── scripts/
│   │   ├── ingest_crawler.py        # 车间0：输入收敛（crawler.db + downloads -> input_raw）
│   │   ├── preprocessor.py          # 车间A：预处理（pages_count/file_size 等）
│   │   ├── cleaner.py               # 车间B：清洗逻辑
│   │   ├── ai_generator.py          # 车间C：生成 Prompt
│   │   ├── ai_backfiller.py         # 车间C：回填 AI 结果
│   │   ├── category_mapper.py       # 分类 slug 规则映射（category-mapping.yaml）
│   │   ├── language_detector.py     # 语言规则检测
│   │   ├── tags_normalizer.py       # tags 合并/去重/收敛
│   │   ├── publisher.py             # 车间E：上传并生成短公共 URL
│   │   ├── exporter_ppthub_init.py  # 车间F：导出初始化文件
│   │   └── validators.py            # 质量门校验
│   ├── templates/
│   │   └── brand_end_slide.pptx
│   └── ai_tasks/              # AI 任务队列
│       ├── pending/           # 待处理 .md
│       └── completed/         # 已完成 .json
├── input_link/            # -> ../pachong/downloads
├── input_db/              # -> ../pachong/data/crawler.db
├── input_raw/             # 标准输入包（车间0产物）
├── work/                  # 解压/临时文件
├── output/                # 车间D成品
├── exports/               # 车间F导出文件
├── configs/               # category-mapping.yaml / sensitive-words.txt
└── requirements.txt
```

## 5. 关键决策点确认
*   [x] **尾部处理**: 确认倒数 3 页策略。
*   [x] **品牌注入**: 确认 PPTHub 品牌及网址替换策略。
*   [x] **AI 模式**: 确认 **Prompt文件交换** 模式，解耦 Python 与 AI 环境。
*   [x] **AI 字段**: 确认新增 `pages_count` (Python 读取)、`ai_structure_features` 和 `ai_template_features` (AI 生成)。
*   [x] **PPTHub ID 策略**: 远程/初始化 id 使用 `ppt_{aid}`。
*   [x] **时间口径**: 使用爬虫 meta 的 `updatedAt` 作为 `origin_created_at` 的来源。
*   [x] **分类 slug**: 规则优先 + AI 兜底，落 `ppthub_category`（12 类）。
*   [x] **发布与初始化导出**: 新增车间 E/F 与质量门，确保空库可重建。

## 6. 数据库 Schema 设计 (Database Schema)

**表名**: `processed_assets` (位于 `assets.db`)

| 字段名 | 类型 | 来源 | 说明 |
| :--- | :--- | :--- | :--- |
| **`id`** | `INTEGER` | 主键 | 自增 ID |
| **`origin_aid`** | `TEXT` | 爬虫 DB | 原始文章 ID，用于关联 |
| **`channel_id`** | `TEXT` | 爬虫 DB | 来源频道 (e.g., `ppt_moban`) |
| **`channel_name`** | `TEXT` | 爬虫 DB | 原始中文分类 (e.g., "欧美PPT模板") |
| **`title`** | `TEXT` | 爬虫 DB | 清洗后的标题 |
| **`file_path`** | `TEXT` | 车间 A | 处理后的 PPTX 相对路径 |
| **`cover_path`** | `TEXT` | 车间 A | 处理后的封面图片相对路径 |
| **`pages_count`** | `INTEGER` | 车间 A | PPT 总页数 (Python 读取) |
| **`file_size_kb`** | `INTEGER` | 车间 A | 清洗后的文件大小 |
| **`attachment_type`** | `TEXT` | 爬虫 DB | 原始格式 (e.g., `.zip`, `.rar`) |
| **`ratio`** | `TEXT` | 爬虫 DB | 比例 (e.g., "16:9") |
| **`original_tags`** | `TEXT` | 爬虫 DB | 原始标签 (JSON Array) |
| **`is_cleaned`** | `BOOLEAN` | 车间 B | 清洗完成标志 (0/1) |
| **`ai_summary`** | `TEXT` | 车间 C | AI 生成: 模板描述 |
| **`ai_keywords`** | `TEXT` | 车间 C | AI 生成: 关键词 (JSON Array) |
| **`ai_scenario`** | `TEXT` | 车间 C | AI 生成: 适用场景 |
| **`ai_color_scheme`** | `TEXT` | 车间 C | AI 生成: 配色方案 |
| **`ai_structure_features`** | `TEXT` | 车间 C | AI 生成: 包含内容/结构特点 |
| **`ai_template_features`** | `TEXT` | 车间 C | AI 生成: 模板特色 |
| **`embedding_text`** | `TEXT` | 车间 C | 聚合文本，用于向量化 (Title + Summary + Keywords) |
| **`ppthub_category`** | `TEXT` | 车间 C | PPTHub 分类 slug（12 类之一） |
| **`language`** | `TEXT` | 车间 C | 主要语言（中文/English/其他） |
| **`tags_final`** | `TEXT` | 车间 C | 合并去重后的 tags（JSON Array，导出用） |
| **`description_final`** | `TEXT` | 车间 C | 最终 description（导出用） |
| **`author`** | `TEXT` | 车间 B | 默认作者（PPTHub） |
| **`origin_created_at`** | `DATETIME` | 爬虫 DB | 来源更新时间口径（= updatedAt） |
| **`origin_updated_at`** | `DATETIME` | 系统 | 本地处理更新时间 |
| **`file_url_remote`** | `TEXT` | 车间 E | 远程 PPTX 公共 URL |
| **`thumbnail_url_remote`** | `TEXT` | 车间 E | 远程缩略图公共 URL |
| **`cover_url_remote`** | `TEXT` | 车间 E | 远程封面公共 URL（可与 thumbnail 相同） |
| **`publish_status`** | `TEXT` | 车间 E | 发布状态 success/failed |
| **`export_batch_id`** | `TEXT` | 车间 F | 初始化导出批次号 |
| **`created_at`** | `DATETIME` | 系统 | 创建时间 |
| **`updated_at`** | `DATETIME` | 系统 | 更新时间 |

---

## 7. V5.0 必备产出与实现约束（不含任务拆解）

为保证 V5.0 方案可落地并向后兼容 PPTHub 空库初始化流程，工厂侧实现需满足以下“硬约束/交付物”：

### 7.1 必备脚本/模块（对应车间）

- `ingest_crawler.py`：从 `crawler.db + downloads/` 生成 `input_raw/` 标准输入包；按 `url/aid` 去重并合并 `original_tags`。
- `preprocessor.py`：读取 `main.pptx`，输出 `pages_count/file_size_kb/file_format/origin_created_at` 等基础字段。
- `cleaner.py`：执行去品牌/尾部清理/品牌注入，并回填 `is_cleaned/author/cleaned_file_path`。
- `ai_generator.py` / `ai_backfiller.py`：Prompt 交换与回填；必须产出 `ai_*` 字段 + `ppthub_category/language/tags_final/description_final`。
- `category_mapper.py`：加载 `configs/category-mapping.yaml`，按 priority 规则映射 slug，AI 兜底。
- `language_detector.py`：按规则检测语言并映射为 `中文/English/其他`。
- `tags_normalizer.py`：`ai_keywords ∪ original_tags` 合并、去重、收敛到 3–8 个。
- `publisher.py`：上传 PPTX/封面到 R2/S3；生成短公共 URL；回填 `*_url_remote/publish_status`。
- `exporter_ppthub_init.py`：导出 `ppthub-init.json/csv`（含 meta+items）与 `report.md`。
- `validators.py`：实现 Preflight 与 Final Gate 两道质量门校验。
- `pipeline.py`：统一 CLI 调度入口，支持按车间单独/串联执行。

### 7.2 输入约束

- 标准输入包必须满足 `input_raw/{channel_id}/{aid}/main.pptx + meta.json` 结构；封面 `cover.jpg` 可缺但需有 warning 记录。
- 解压必须以 `file_path` 指向的真实文件扩展为准，`attachment_type` 仅作参考。
- 允许多 pptx 情况，但必须按“主文件选择规则”确定唯一 `main.pptx`。

### 7.3 输出约束

- `assets.db.processed_assets` 必须包含第 6 节所有列（旧列不删、只增列），且 `ppthub_category/language/tags_final/description_final` 为非空可用值。
- `output/{channel_id}/` 需有最终清洗后的 `pptx/{aid}.pptx` 与可选 `images/{aid}.jpg`。
- 远程发布路径固定为：
  - `ppts/{ppthub_category}/ppt_{aid}.pptx`
  - `thumbs/{ppthub_category}/ppt_{aid}.jpg`
  且使用 `STORAGE_PUBLIC_URL` 生成短公共链接（禁止 pre‑signed）。
- 导出初始化文件固定输出：
  - `exports/ppthub-init/{batch_id}/ppthub-init.json`
  - `exports/ppthub-init/{batch_id}/ppthub-init.csv`
  - `exports/ppthub-init/{batch_id}/report.md`

### 7.4 质量/验收约束

- Preflight：每条记录至少满足 `title/file_url/category/thumbnail_url/status` 约束（见 `PPTHub数据库初始化数据约束.md`），错误阻塞，warning 允许继续。
- Final Gate：导出前确保：
  - `category` 命中 12 slug；`language` 为 `中文/English/其他`；
  - `file_url/thumbnail_url` 为可访问短公共 URL；
  - `description_final` 非空或 `tags_final` ≥ 2；
  - `status='published' AND deleted_at IS NULL`。
- 产线导出的 `ppthub-init` 文件应能被 PPTHub SQL 批量导入或 action 导入成功，并在导入后由 PPTHub 侧 embedding 流程完成向量生成与门控搜索。
