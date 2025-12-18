# Piliang 批量处理工厂（V5）

Piliang 是 PPTHub 的 PPT 批量处理与初始化导出工具：把爬虫下载/本地素材加工为可导入 PPTHub 的初始化数据（JSON/CSV），并为后续 AI/向量化链路提供稳定输入。

## 目录

- [当前状态](#当前状态)
- [数据链路总览](#数据链路总览)
- [流水线阶段详解](#流水线阶段详解)
- [目录结构](#目录结构)
- [输入规范](#输入规范)
- [输出规范](#输出规范)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [示例与用法](#示例与用法)
- [常见问题](#常见问题)

---

## 当前状态

| 状态 | 说明 |
|------|------|
| ✅ 结构收敛 | 源码/配置/模板/运行时数据分层清晰 |
| ✅ 标准输入包生成 | `scripts/ingest_crawler.py`（Workshop0） |
| ✅ 端到端可跑通 | `scripts/run_smoke_batch.py` |
| ✅ 封面生成 | Workshop Cover 从清洗后 PPTX 生成干净封面 |
| ✅ AI 内容丰富 | Workshop C 支持 DeepSeek/Gemini 双提供商 |
| ✅ S3/R2 上传 | Workshop E 真实上传到 Cloudflare R2 已验证 |
| ✅ 测试通过 | `pytest tests` 253/253 passed |
| ✅ 跨平台支持 | macOS + Ubuntu (LibreOffice/unar 自动检测) |

---

## 数据链路总览

### 整体流程图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Piliang 批量处理工厂                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────────────────────────────┐
│   爬虫产物    │     │   本地素材    │     │              外部输入                 │
│ crawler.db   │     │  downloads/  │     │   手动准备的 PPTX + meta.json        │
└──────┬───────┘     └──────┬───────┘     └──────────────────┬───────────────────┘
       │                    │                                │
       └────────────────────┼────────────────────────────────┘
                            ▼
              ┌─────────────────────────────┐
              │     Workshop 0 (Ingest)     │
              │  发现/去重/选择主 PPTX       │
              │  生成标准输入包              │
              └─────────────┬───────────────┘
                            ▼
              ┌─────────────────────────────┐
              │     Preflight Gate          │
              │  校验输入包完整性            │
              │  (meta必需键/main.pptx)     │
              └─────────────┬───────────────┘
                            ▼
              ┌─────────────────────────────┐
              │     Workshop A (ETL)        │
              │  页数/大小/命名标准化        │
              │  提取 origin_updated_at     │
              └─────────────┬───────────────┘
                            ▼
              ┌─────────────────────────────┐
              │     Workshop B (Clean)      │
              │  敏感词替换                  │
              │  尾页裁剪                    │
              │  品牌尾页注入（可选）         │
              └─────────────┬───────────────┘
                            ▼
              ┌─────────────────────────────┐
              │     Workshop C (AI)         │
              │  规则优先分类                │
              │  AI 始终调用内容丰富         │
              │  生成 category/tags/desc    │
              └─────────────┬───────────────┘
                            ▼
              ┌─────────────────────────────┐
              │   Workshop Cover (封面)     │
              │  从清洗后 PPTX 生成封面      │
              │  640×360 + 1920×1080       │
              └─────────────┬───────────────┘
                            ▼
              ┌─────────────────────────────┐
              │     Workshop D (Pack)       │
              │  本地成品打包归档            │
              │  {aid}-final.pptx + cover   │
              └─────────────┬───────────────┘
                            ▼
              ┌─────────────────────────────┐
              │     Workshop E (Publish)    │
              │  上传到 S3/R2               │
              │  或 dry-run 生成 URL        │
              └─────────────┬───────────────┘
                            ▼
              ┌─────────────────────────────┐
              │     Final Gate              │
              │  导出阻断校验                │
              │  (必填字段/category/URL)    │
              └─────────────┬───────────────┘
                            ▼
              ┌─────────────────────────────┐
              │     Workshop F (Export)     │
              │  导出 JSON/CSV/报告         │
              └─────────────┬───────────────┘
                            ▼
              ┌─────────────────────────────┐
              │        输出产物             │
              │  ppthub-init-*.json         │
              │  ppthub-init-*.csv          │
              │  ppthub-export-report.json  │
              └─────────────────────────────┘
```

### 数据流转示意

```
crawler.db + downloads/
        │
        ▼ Workshop 0
data/input_raw/{channel}/{aid}/
    ├── main.pptx
    ├── meta.json
    └── cover.jpg (可选)
        │
        ▼ Workshop A
data/output/etl/{channel}/{aid}.pptx
        │
        ▼ Workshop B
data/output/clean/{channel}/{aid}-clean.pptx
        │
        ▼ Workshop C
assets.db (ai_meta 字段更新)
        │
        ▼ Workshop Cover
data/output/cover/{channel}/
    ├── {aid}-cover.webp   (640×360)
    └── {aid}-preview.webp (1920×1080)
        │
        ▼ Workshop D
data/output/final/{channel}/
    ├── {aid}-final.pptx
    ├── {aid}-cover.webp
    └── {aid}-preview.webp
        │
        ▼ Workshop E
S3/R2 远程存储 (或 dry-run URL)
        │
        ▼ Workshop F
data/output/export/
    ├── ppthub-init-{batch_id}.json
    ├── ppthub-init-{batch_id}.csv
    └── ppthub-export-report-{batch_id}.json
```

---

## 流水线阶段详解

阶段枚举定义于 `src/factory/stages.py`：

| 阶段 | 名称 | 输入 | 输出 | 说明 |
|------|------|------|------|------|
| `ingest` | Workshop 0 | crawler.db + downloads/ | StandardInputPackage | 发现/去重/选择主 PPTX |
| `preflight` | Preflight Gate | StandardInputPackage | 校验结果 | 校验 meta 必需键、main.pptx 存在 |
| `A` | Workshop A | StandardInputPackage | EtlOutput | ETL：页数/大小/命名标准化 |
| `B` | Workshop B | EtlOutput | CleanOutput | 深度清洗：敏感词/尾页/品牌注入 |
| `C` | Workshop C | CleanOutput | AiMeta | 语义理解：规则分类 + AI 内容丰富 |
| `COVER` | Workshop Cover | CleanOutput | CoverOutput | 从清洗后 PPTX 生成封面 |
| `D` | Workshop D | EtlOutput + CleanOutput + CoverOutput | PackedOutput | 本地成品打包归档 |
| `E` | Workshop E | PackedOutput | PublishOutput | 发布到 S3/R2 或 dry-run |
| `final_gate` | Final Gate | PpthubInitItem[] | valid/blocked | 导出阻断校验 |
| `F` | Workshop F | valid items | JSON/CSV/Report | 导出初始化文件 |

### 阶段状态枚举

```python
class StageStatus(str, Enum):
    pending = 'pending'        # 待处理
    success = 'success'        # 成功
    failed = 'failed'          # 失败
    export_blocked = 'export_blocked'  # 导出阻断
```

---

## 目录结构

```
piliang/
├── src/factory/           # 核心流水线代码
│   ├── workshops/         # 各车间实现 (0/A/B/C/D/E/F)
│   ├── gates/             # 校验门 (preflight/final_gate)
│   ├── db/                # SQLite DAO 与初始化
│   ├── ai/                # AI 适配器/提示词构建/解析
│   ├── rules/             # 规则引擎 (关键词匹配)
│   ├── storage/           # S3/R2 存储适配器
│   ├── cli/               # CLI 入口 (预留)
│   ├── utils/             # 工具函数
│   ├── config.py          # 配置加载
│   ├── types.py           # 数据类型定义
│   └── stages.py          # 阶段枚举
├── configs/               # 配置文件
│   ├── category-mapping.yaml    # 分类映射规则
│   ├── forbidden-keywords.txt   # 敏感词列表
│   └── ai_prompt_template.md    # AI 提示词模板
├── templates/             # 模板文件
│   └── brand_end_slide.pptx     # 品牌尾页模板
├── data/                  # 运行时数据 (gitignore)
│   ├── downloads/         # 爬虫下载的原始文件
│   ├── input_raw/         # 标准输入包
│   └── output/            # 各阶段输出
│       ├── etl/           # Workshop A 产物
│       ├── clean/         # Workshop B 产物
│       ├── final/         # Workshop D 产物
│       └── export/        # Workshop F 产物
├── fixtures/              # 测试/冒烟清单
│   ├── mini_batch_manifest.json
│   └── small_batch_manifest.json
├── scripts/               # 可执行脚本
│   ├── run_smoke_batch.py       # 冒烟批处理
│   ├── ingest_crawler.py        # 爬虫数据导入
│   ├── ai_caller.py             # 统一 AI 调用入口（DeepSeek/Gemini）
│   ├── create_template.py       # 生成品牌尾页
│   └── investigate_ppt.py       # PPT 调试工具
├── tests/                 # 单元/性质测试
├── docs/                  # 文档
│   ├── PPT批量处理建设方案_V4.md
│   ├── PPTHub数据库初始化数据约束.md
│   ├── ai提示词与内容提取原理.md
│   ├── ai-adapter-options.md          # AI 适配器方案对比
│   ├── AI批量处理增强方案.md
│   └── 封面生成Workshop设计方案.md
├── .env.example           # 环境变量示例
├── pyproject.toml         # 项目配置
└── README.md              # 本文件
```

---

## 输入规范

### 1. 爬虫数据库 (crawler.db)

Workshop 0 从爬虫数据库的 `tasks` 表读取资产元数据：

```sql
-- 实际表结构
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT UNIQUE NOT NULL,
    type TEXT CHECK(type IN ('list', 'detail')) NOT NULL,
    status TEXT CHECK(status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    meta TEXT,  -- JSON 字符串，包含资产元数据
    ...
);
```

`meta` 字段为 JSON 字符串，包含以下关键字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `aid` | string | 资产唯一标识 |
| `title` | string | 标题 |
| `channelId` | string | 渠道 ID |
| `channelName` | string | 渠道名称 |
| `tags` | array | 标签数组 |
| `detailUrl` | string | 详情页 URL |
| `updatedAt` | string | 更新时间 |
| `filePath` | string | 下载文件路径 |
| `coverPath` | string | 封面图路径 |
| `fileSizeKB` | number | 文件大小 (KB) |
| `ratio` | string | 比例 (16:9/4:3) |
| `downloadStatus` | string | 下载状态 |

### 2. 下载文件 (downloads/)

支持的文件格式：

| 格式 | 说明 |
|------|------|
| `.zip` | 直接解压提取 .pptx |
| `.rar` | 需要 `rarfile` 库 + `unar` 工具 |
| `.pptx` | 直接使用 |
| `.ppt` | 自动转换为 .pptx（需要 LibreOffice） |

文件命名规范：`{aid}-{title}.{ext}`，例如：
- `139646-商务汇报PPT模板.zip`
- `611-McAfee公司介绍PPT模板下载.rar`

封面图位于 `downloads/{channel}/images/{aid}-cover.jpg`

> 注：原始封面是“爬虫下载的站点封面图”，可能带第三方水印。即使没有这个封面文件，后续也能继续跑：默认会在 Workshop Cover 里从清洗后的 PPTX 重新生成干净封面。

### 2. 标准输入包 (Standard Input Package)

位于 `data/input_raw/{channel_id}/{aid}/`：

```
data/input_raw/ppt_moban/139646/
├── main.pptx          # 必需：主 PPTX 文件
├── meta.json          # 必需：元数据
└── cover.jpg          # 可选：封面图（缺失会 warning）
```

#### meta.json 必需字段

```json
{
  "aid": "139646",
  "title": "商务汇报PPT模板",
  "channel_id": "ppt_moban",
  "channel_name": "PPT模板网",
  "original_tags": ["商务", "汇报", "简约"]
}
```

#### meta.json 推荐字段

```json
{
  "aid": "139646",
  "title": "商务汇报PPT模板",
  "channel_id": "ppt_moban",
  "channel_name": "PPT模板网",
  "original_tags": ["商务", "汇报", "简约"],
  "detail_url": "https://example.com/ppt/139646",
  "origin_updated_at": "2024-12-01T10:00:00Z",
  "ratio": "16:9",
  "file_size_kb": 2048,
  "attachment_type": "pptx",
  "download_links": ["https://..."]
}
```

### 3. Manifest 清单文件

位于 `fixtures/*.json`，用于批量处理：

```json
{
  "batch_id": "smoke-b10",
  "notes": "10-sample aids for smoke test",
  "aids": [
    {
      "aid": "139646",
      "channel_id": "ppt_moban",
      "input_dir": "input_raw/ppt_moban/139646"
    },
    {
      "aid": "139649",
      "channel_id": "ppt_moban",
      "input_dir": "input_raw/ppt_moban/139649"
    }
  ]
}
```

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `batch_id` | string | ✅ | 批次唯一标识 |
| `notes` | string | ❌ | 备注说明 |
| `aids` | array | ✅ | 资产列表 |
| `aids[].aid` | string | ✅ | 资产 ID |
| `aids[].channel_id` | string | ✅ | 渠道 ID |
| `aids[].input_dir` | string | ✅ | 输入目录（相对于 data_root） |

---

## 输出规范

### 1. 各阶段中间产物

| 阶段 | 输出路径 | 文件格式 |
|------|----------|----------|
| Workshop A | `data/output/etl/{channel}/{aid}.pptx` | 标准化 PPTX |
| Workshop B | `data/output/clean/{channel}/{aid}-clean.pptx` | 清洗后 PPTX |
| Workshop Cover | `data/output/cover/{channel}/{aid}-cover.webp` | 封面图（默认 WebP，640×360） |
| Workshop Cover | `data/output/cover/{channel}/{aid}-preview.webp` | 预览图（默认 WebP，1920×1080） |
| Workshop D | `data/output/final/{channel}/{aid}-final.pptx` | 最终 PPTX |
| Workshop D | `data/output/final/{channel}/{aid}-cover.webp` | 封面图（默认 WebP；若 Cover 失败且存在 input cover 则可能为 .jpg） |
| Workshop D | `data/output/final/{channel}/{aid}-preview.webp` | 预览图（默认 WebP；当前为本地成品产物） |
| Workshop D | `data/output/final/{channel}/{aid}-cover.jpg` | 封面图（fallback：当未生成 cover_out 且存在 input cover.jpg） |

### 2. 最终导出文件

位于 `data/output/export/`：

#### ppthub-init-{batch_id}.json

```json
{
  "meta": {
    "schema_version": "ppt-import-v2",
    "exported_at": "2024-12-13T12:00:00Z",
    "natural_key": "file_url",
    "source": "piliang",
    "source_batch_id": "smoke-b10"
  },
  "items": [
    {
      "id": "ppt_139646",
      "title": "商务汇报PPT模板",
      "category": "business",
      "tags": ["商务", "汇报", "简约"],
      "description": "适用于企业商务汇报的专业PPT模板...",
      "language": "中文",
      "slides_count": 24,
      "file_url": "https://cdn.example.com/ppts/ppt_moban/ppt_139646.pptx",
      "thumbnail_url": "https://cdn.example.com/thumbs/ppt_moban/ppt_139646.webp",
      "cover_image_url": "https://cdn.example.com/thumbs/ppt_moban/ppt_139646.webp",
      "file_size": 2097152,
      "file_format": "pptx",
      "author": "PPTHub",
      "status": "published",
      "visibility": "public",
      "download_count": 0,
      "view_count": 0,
      "created_at": "2024-12-13T12:00:00Z",
      "updated_at": "2024-12-13T12:00:00Z",
      "ai_summary": "商务汇报PPT模板，简约风格，适合企业季度汇报",
      "ai_content_summary": "这是一套专业的商务汇报PPT模板，采用简约大气的设计风格，配色以蓝白灰为主调，整体视觉清爽专业。模板包含封面页、目录页、内容展示页和结尾页等完整结构，共24页精心设计的版式。内置丰富的图表组件，支持数据可视化展示，特别适合企业季度汇报、项目总结、工作计划等商务场景使用。",
      "ai_keywords": ["商务", "汇报", "简约", "企业"],
      "ai_scenario": "企业季度汇报、项目总结",
      "ai_color_scheme": "蓝白灰",
      "ai_structure_features": "封面+目录+内容+结尾",
      "ai_template_features": "图表丰富、数据可视化"
    }
  ]
}
```

#### ppthub-init-{batch_id}.csv

CSV 格式，包含与 JSON 相同的字段，便于 Excel 查看和批量导入。

#### ppthub-export-report-{batch_id}.json

```json
{
  "batch_id": "smoke-b10",
  "exported_at": "2024-12-13T12:00:00Z",
  "summary": {
    "total": 10,
    "valid": 8,
    "blocked": 2
  },
  "valid_items": ["ppt_139646", "ppt_139649", "..."],
  "blocked_items": [
    {
      "id": "ppt_139650",
      "reason": "missing_category",
      "details": "category 字段为空"
    }
  ]
}
```

### 3. PPTHub 数据库字段映射

| Piliang 字段 | PPTHub 字段 | 说明 |
|--------------|-------------|------|
| `title` | `title` | 已清洗标题 |
| `original_tags` + `ai_keywords` | `tags` | 合并去重 |
| `ai_summary` | `description` | 列表页摘要（50-100字） |
| `ai_content_summary` | `ai_content_summary` | SEO 长描述（300-500字） |
| `file_url_remote` | `file_url` | 上传后的外链 |
| `thumbnail_url_remote` | `thumbnail_url` | 封面外链 640×360（列表缩略图） |
| `preview_url_remote` | `preview_url` | 预览外链 1920×1080（详情页大图） |
| `cover_url_remote` | `cover_image_url` | 封面外链（当前与 thumbnail_url 相同） |
| `pages_count` | `slides_count` | 页数 |
| `ppthub_category` | `category` | 分类 slug |

### 4. 分类 slug 映射

必须使用以下 12 个有效分类：

| Slug | 中文名 |
|------|--------|
| `business` | 商务汇报 |
| `education` | 教育培训 |
| `technology` | 科技互联网 |
| `design` | 设计创意 |
| `marketing` | 产品营销 |
| `hr` | 人力资源 |
| `medical` | 医疗健康 |
| `finance` | 金融财务 |
| `general` | 通用模板 |
| `summary` | 年终总结 |
| `report` | 述职报告 |
| `plan` | 工作计划 |

---

## 快速开始

### 1. 安装依赖

```bash
cd AA-003ppt自动化脚本/piliang
pip install -e ".[dev]"
```

> 说明：Piliang 会调用本机的 LibreOffice（用于 PPTX -> PDF/PNG），并优先使用 `pdftoppm`（用于从 PDF 导出多页图片并智能选封面页）。
> - LibreOffice（macOS）：`/Applications/LibreOffice.app/Contents/MacOS/soffice`
> - LibreOffice（Ubuntu）：`sudo apt install libreoffice`
> - `pdftoppm`（macOS）：`brew install poppler`
> - `pdftoppm`（Ubuntu）：`sudo apt install poppler-utils`

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填写必要配置
```

### 3. 运行测试

```bash
pytest tests
# 预期输出: 253 passed
```

### 4. 准备输入数据

**方式 A：从爬虫数据导入**

```bash
# 确保 crawler.db 和 downloads/ 已就绪
python scripts/ingest_crawler.py --manifest fixtures/small_batch_manifest.json
```

> 注：爬虫库中 `file_path` 可能是旧的绝对路径（例如 `/Users/xxx/...`），`ingest_crawler.py` 会优先按 `aid-标题.*` 在 `downloads_root` 中匹配实际文件名，避免路径不一致导致失败。

**方式 B：手动准备**

```bash
mkdir -p data/input_raw/ppt_moban/139646
# 放入 main.pptx 和 meta.json
```

### 5. 运行冒烟批处理

```bash
# 完整流程（dry-run 模式，不实际上传）
python scripts/run_smoke_batch.py \
  --manifest fixtures/small_batch_manifest.json \
  --db /tmp/assets_smoke.db

# 仅入库不执行车间
python scripts/run_smoke_batch.py \
  --manifest fixtures/small_batch_manifest.json \
  --db /tmp/assets_smoke.db \
  --dry-run

# 指定阶段范围
python scripts/run_smoke_batch.py \
  --manifest fixtures/small_batch_manifest.json \
  --db /tmp/assets_smoke.db \
  --from-stage A \
  --to-stage D

# 如需同时跑 AI（Stage C），请先配置 AI 提供商：
# 方式1: DeepSeek (推荐，快速)
# export AI_PROVIDER=deepseek
# export SILICONFLOW_API_KEY=sk-xxx
# 方式2: Gemini CLI (免费)
# export AI_PROVIDER=gemini
# python scripts/run_smoke_batch.py --enable-ai --manifest fixtures/small_batch_manifest.json --db /tmp/assets_smoke.db --from-stage A --to-stage D
```

### 6. 水印/品牌清洗说明（重要）

- Workshop B（Clean）会清洗：
  - 幻灯片正文文本（shape text）
  - 母版/版式（slide master / layout）
  - Core Properties（标题/作者等元信息）
- `configs/forbidden-keywords.txt` 定义敏感词列表。
- `configs/brand-replacement.txt` 定义敏感词替换规则；默认对来源品牌采用“删除”（替换为空）以避免残留和奇怪的域名碎片（例如 `www..com`）。
- `PILIANG_HEAD_PRUNE_MAX`：可选，删除开头最多 N 页“包含敏感词的水印封面页”。默认 `0`（不删），以避免误删真实封面内容。
- 品牌尾页注入：若存在 `templates/brand_end_slide.pptx`，会在末尾追加品牌页，并返回 `WARN_BRAND_APPENDED`。
  - 若品牌模板比例与目标 PPT 不一致（常见：品牌模板 16:9、来源模板 4:3），会优先走“渲染为图片 + contain_blur 适配后全幅插入”，避免 deep-copy shapes 出现 off-canvas 或样式继承异常。
  - 为避免每个资产重复调用 LibreOffice，品牌页会按比例做缓存（同一比例批次内复用）。

### 7. 封面生成策略（重要）

Workshop Cover 默认策略：
- `pptx -> pdf`（LibreOffice）
- `pdf -> 多页 png`（`pdftoppm`）
- 从前 `max_pages` 页中选择“更不空/更均衡”的一页作为封面（会尽量避开最后一页 PPTHub 品牌尾页）
- 生成：
  - `cover.webp`（640×360）
  - `preview.webp`（1920×1080）

输出适配模式：
- 默认 `contain_blur`：保留整页画面，并用模糊背景补齐 16:9（适合 4:3 模板，避免强裁切导致封面过空/丢主体）。
- 可选 `crop`：强制裁切为 16:9（对 16:9 原生模板更友好，但对 4:3 可能裁掉内容）。

---

## 配置说明

### 环境变量 (.env)

```bash
# 数据根目录（相对路径以 piliang 项目根目录为基准）
PILIANG_DATA_ROOT=data

# 爬虫数据库路径（相对于 PILIANG_DATA_ROOT 或绝对路径）
PILIANG_CRAWLER_DB=crawler.db

# 并发参数（Orchestrator 使用）
PILIANG_CONCURRENCY=4

# 开头水印页裁剪：删除开头最多 N 页“包含敏感词的水印封面页”（默认 0 不删）
PILIANG_HEAD_PRUNE_MAX=0

# 敏感词覆盖（逗号/换行分隔；为空则读取 configs/forbidden-keywords.txt）
FORBIDDEN_KEYWORDS=

# 存储配置（S3/R2 兼容）
STORAGE_ENDPOINT=https://xxx.r2.cloudflarestorage.com
STORAGE_BUCKET_NAME=ppthub
STORAGE_ACCESS_KEY_ID=xxx
STORAGE_SECRET_ACCESS_KEY=xxx
STORAGE_REGION=auto
STORAGE_PUBLIC_URL=https://cdn.example.com

# true 时不实际上传，仅生成 public_url
STORAGE_DRY_RUN=true

# AI 配置（Workshop C 元数据生成）
# AI 提供商选择: deepseek | gemini
# - deepseek: 使用 SiliconFlow API 调用 DeepSeek-V3 (快速 2-3s，需要 API Key)
# - gemini: 使用本地 Gemini CLI (免费，启动约 15s，需要已登录 gemini CLI)
AI_PROVIDER=deepseek

# SiliconFlow API Key (AI_PROVIDER=deepseek 时必需)
# 获取地址: https://cloud.siliconflow.cn/
SILICONFLOW_API_KEY=

# AI CLI 命令模板，{prompt} 和 {output} 会被替换为实际路径
# 默认使用统一入口: python scripts/ai_caller.py {prompt} {output}
AI_COMMAND_TEMPLATE=python scripts/ai_caller.py {prompt} {output}
AI_TIMEOUT_SECONDS=120
AI_MAX_RETRIES=3
```

生产环境示例（请按实际云厂商替换）：

```bash
STORAGE_ENDPOINT=https://s3.ap-southeast-1.amazonaws.com
STORAGE_BUCKET_NAME=ppthub-prod
STORAGE_ACCESS_KEY_ID=AKIAxxxx
STORAGE_SECRET_ACCESS_KEY=xxxxxxxx
STORAGE_REGION=ap-southeast-1
STORAGE_PUBLIC_URL=https://cdn.ppthub.com
STORAGE_PATH_PPTX=ppts/{category}/ppt_{aid}.pptx
STORAGE_PATH_THUMB=thumbs/{category}/ppt_{aid}.webp
STORAGE_PATH_PREVIEW=previews/{category}/ppt_{aid}.webp
STORAGE_DRY_RUN=false
```

### 配置文件

#### configs/category-mapping.yaml

```yaml
categories:
  business:
    name: 商务汇报
    keywords: [商务, 汇报, 企业, 公司, 会议]
  education:
    name: 教育培训
    keywords: [教育, 培训, 学校, 课件, 教学]
  # ...更多分类
```

#### configs/forbidden-keywords.txt

```
第一PPT
1ppt
www.1ppt.com
# 每行一个敏感词
```

#### configs/ai_prompt_template.md

AI 提示词模板，用于 Workshop C 的语义理解。详见 `docs/ai提示词与内容提取原理.md`。

---

## 示例与用法

### 示例 1：完整批处理流程

```bash
# 1. 准备输入数据
python scripts/ingest_crawler.py --manifest fixtures/mini_batch_manifest.json

# 2. 运行完整流程
python scripts/run_smoke_batch.py \
  --manifest fixtures/mini_batch_manifest.json \
  --db data/assets.db \
  --public-base-url https://cdn.ppthub.com

# 3. 查看输出
ls -la data/output/export/
# ppthub-init-smoke-b10.json
# ppthub-init-smoke-b10.csv
# ppthub-export-report-smoke-b10.json
```

### 示例 2：单独运行某个车间

```python
from factory.config import load_factory_config
from factory.workshops import WorkshopA, WorkshopAConfig
from factory.types import StandardInputPackage
from pathlib import Path

cfg = load_factory_config()
wa = WorkshopA(WorkshopAConfig(output_dir=cfg.data_root / 'output' / 'etl'))

pkg = StandardInputPackage(
    aid='139646',
    channel_id='ppt_moban',
    root_dir=Path('data/input_raw/ppt_moban/139646'),
    main_pptx_path=Path('data/input_raw/ppt_moban/139646/main.pptx'),
    meta_path=Path('data/input_raw/ppt_moban/139646/meta.json'),
    cover_path=Path('data/input_raw/ppt_moban/139646/cover.jpg'),
)

etl_out = wa.run(pkg)
print(f"ETL 完成: {etl_out.local_pptx_path}, 页数: {etl_out.pages_count}")
```

### 示例 3：生成品牌尾页模板

```bash
python scripts/create_template.py
# 输出: templates/brand_end_slide.pptx
```

### 示例 4：调试 PPT 文件

```bash
python scripts/investigate_ppt.py data/input_raw/ppt_moban/139646/main.pptx
# 输出 PPT 结构信息、页数、文本内容等
```

---

## 常见问题

### Q: 测试中出现 zipfile duplicate name 警告？

这是 `python-pptx` 在复制 slide 元素时的已知行为，不影响导出结果。

### Q: 如何跳过 AI 阶段？

`run_smoke_batch.py` 默认跳过 Stage C（AI）。如需启用：
1. 配置 `AI_PROVIDER=deepseek` 并设置 `SILICONFLOW_API_KEY`，或
2. 配置 `AI_PROVIDER=gemini`（需要已登录 Gemini CLI）
3. 运行时添加 `--enable-ai` 参数

### Q: 如何处理 .rar 文件？

需要安装 `rarfile` 库和 `unar` 工具：

```bash
pip install rarfile
# macOS
brew install unar
# Ubuntu/Linux
sudo apt install unar
```

### Q: 如何处理 .ppt 文件（旧版 PowerPoint）？

需要安装 LibreOffice，Workshop 0 会自动将 `.ppt` 转换为 `.pptx`：

```bash
# macOS
brew install --cask libreoffice
# Ubuntu/Linux
sudo apt install libreoffice
```

转换后的文件会带有 `WARN_PPT_CONVERTED` 警告标记。

### Q: 如何真实上传到 S3/R2？

1. 在 `.env` 中配置存储凭证：
   ```bash
   STORAGE_ENDPOINT="https://xxx.r2.cloudflarestorage.com"
   STORAGE_BUCKET_NAME="ppt-assets"
   STORAGE_ACCESS_KEY_ID="your_key"
   STORAGE_SECRET_ACCESS_KEY="your_secret"
   STORAGE_PUBLIC_URL="https://your-cdn.com"
   STORAGE_DRY_RUN=false
   ```
2. 运行批处理脚本，文件会自动上传
3. 导出的 JSON 中 `file_url` 和 `thumbnail_url` 将是真实可访问的 URL

> 已验证：Cloudflare R2 上传正常，6/6 文件全部成功上传并可公开访问。

### Q: 如何添加新的分类？

编辑 `configs/category-mapping.yaml`，添加新的分类 slug 和关键词映射。

### Q: datetime.utcnow() 弃用警告？

来自部分历史实现，不影响当前运行。后续会统一替换为 timezone-aware 写法。

### Q: 封面生成失败怎么办？

Workshop Cover 默认走“多页导出 + 选页”，并在失败时回退：

1. `pptx -> pdf`（LibreOffice）
2. `pdf -> 多页 png`（`pdftoppm`）
3. 从前 N 页中挑“更不空/更均衡”的一页作为封面（会尽量避开最后一页 PPTHub 品牌尾页）
4. 回退：若缺少 `pdftoppm` 或 PDF 导出失败，则改为 LibreOffice “仅导出第一页为 PNG”
5. 如果仍然失败，流水线会自动回退到使用原始封面（input `cover.jpg`）

如果失败：

1. 确保 LibreOffice 已安装：`brew install --cask libreoffice`
2. 检查路径是否正确（默认 `/Applications/LibreOffice.app/Contents/MacOS/soffice`）
3. 确保 `pdftoppm` 可用：推荐通过 Homebrew 安装 `poppler`
4. 如果仍然失败，流水线会自动回退到使用原始封面

### Q: 封面图片格式是什么？

Workshop Cover 生成两个尺寸的 WebP 图片：
- `{aid}-cover.webp` - 640×360，用于列表页
- `{aid}-preview.webp` - 1920×1080，用于详情页

WebP 格式比 JPG 小 25-35%，质量设置为 85。

### Q: 为什么要重新生成封面？

原始封面来自爬虫下载，可能包含第三方品牌水印（如"第一PPT"）。Workshop Cover 会从清洗后的 PPTX（默认前 N 页）导出多页并智能选一页重新生成干净封面，尽量确保最终产物不含第三方品牌信息。

---

## 相关文档

- [PPT批量处理建设方案_V4](docs/PPT批量处理建设方案_V4.md)
- [PPTHub数据库初始化数据约束](docs/PPTHub数据库初始化数据约束.md)
- [AI提示词与内容提取原理](docs/ai提示词与内容提取原理.md)
- [AI适配器方案对比](docs/ai-adapter-options.md) - DeepSeek/Gemini 双提供商实现
- [AI批量处理增强方案](docs/AI批量处理增强方案.md)
- [封面生成Workshop设计方案](docs/封面生成Workshop设计方案.md)
- [Agent 开发指南](docs/agent.md)

---

## License

MIT
