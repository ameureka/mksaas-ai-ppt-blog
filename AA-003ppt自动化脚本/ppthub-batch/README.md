# PPTHub Batch Import

批量导入 PPT 模板数据到 PPTHub 数据库的 CLI 工具。

## 前置条件

在使用本工具前，确保主项目 (PPTHub) 已完成以下设置：

1. **数据库 Schema** - 运行 `pnpm db:migrate` 创建 `ppt` 表
2. **pgvector 扩展** - 运行 `pnpm tsx scripts/setup-vector-db.ts` 创建向量索引
3. **存储配置** - R2/S3 存储已配置并可访问

```bash
# 在主项目中执行
cd /path/to/ppthub
pnpm db:migrate
pnpm tsx scripts/setup-vector-db.ts
```

## 功能

- ✅ JSON/CSV 解析与 schema 校验
- ✅ Preflight 校验（字段规范化、分类/语言验证、去重）
- ✅ URL 格式校验（短公共 URL，无签名参数）
- ✅ URL 一致性校验（file_url 与 thumbnail_url 的 category/aid 一致）
- ✅ SQL Upsert 生成（基于 file_url 自然键）
- ✅ Action 模式支持（调用 createPPT action）
- ✅ Embedding 触发与 Repair Cron 说明
- ✅ 导入后校验报告
- ✅ 一致性校验

## 安装

```bash
cd ppthub-batch
pnpm install
```

## 使用

```bash
# 基本用法 (dry-run 模式)
pnpm batch-import --input <path> --dry-run

# 完整选项
pnpm batch-import \
  -i, --input <path>       # 输入文件 (必需)
  -f, --format <format>    # auto|json|csv (默认: auto)
  -b, --batch-size <size>  # 每批次记录数，最大 100 (默认: 100)
  -m, --mode <mode>        # sql|action (默认: sql)
  --force-stats            # 强制覆盖 download_count/view_count
  --dry-run                # 仅校验不写库
  -o, --output <path>      # 导入报告输出路径
  --storage-url <url>      # 存储公共 URL 前缀 (用于 URL 校验)
  --show-sql               # 显示生成的 SQL (调试用)
  --postcheck              # 执行导入后校验报告
```

## 示例

```bash
# 从 piliang 导出文件导入
pnpm batch-import \
  --input ../piliang/data/output/export/ppthub-init-upload-test-001.json \
  --dry-run \
  --postcheck

# 使用 action 模式
pnpm batch-import \
  --input data.json \
  --mode action \
  --dry-run
```

## 输入格式

### JSON (ppthub-init.json)

```json
{
  "schema_version": "ppt-import-v2",
  "source_batch_id": "batch-001",
  "items": [
    {
      "id": "ppt_1001",
      "title": "商务报告模板",
      "category": "business",
      "language": "中文",
      "tags": ["商务", "报告"],
      "description": "专业商务报告模板...",
      "file_url": "https://cdn.example.com/ppts/business/ppt_1001.pptx",
      "thumbnail_url": "https://cdn.example.com/ppts/business/ppt_1001_thumb.webp",
      "file_size": 1048576,
      "slide_count": 20,
      "status": "published"
    }
  ]
}
```

### CSV

```csv
id,title,category,language,tags,description,file_url,thumbnail_url,file_size,slide_count,status
ppt_1001,商务报告模板,business,中文,"商务,报告",专业商务报告模板...,https://...,https://...,1048576,20,published
```

## 有效分类

```
business, education, technology, medical, finance,
marketing, creative, simple, chinese, nature, cartoon, other
```

## 有效语言

```
中文, English, 其他
```

## 项目结构

```
ppthub-batch/
├── scripts/
│   └── batch-import.ts     # CLI 入口
├── src/lib/
│   ├── types.ts            # 类型定义
│   ├── parser.ts           # JSON/CSV 解析
│   ├── preflight.ts        # Preflight 校验
│   ├── url-validator.ts    # URL 格式与一致性校验
│   ├── upsert.ts           # SQL Upsert 生成
│   ├── embedding.ts        # Embedding 触发
│   ├── postcheck.ts        # 导入后校验
│   └── action-executor.ts  # Action 模式执行器
├── package.json
└── tsconfig.json
```

## 与 Piliang 配合

1. 在 piliang 中运行完整流水线生成 `ppthub-init-*.json`
2. 使用本工具导入到 PPTHub 数据库

```bash
# Piliang 导出
cd piliang
python scripts/run_smoke_batch.py

# 导入到 PPTHub
cd ../ppthub-batch
pnpm batch-import --input ../piliang/data/output/export/ppthub-init-*.json
```

## Embedding 生成

导入后 embedding_status 为 'pending'，需要通过以下方式生成向量：

1. **自动方式 - Repair Cron (推荐)**
   ```
   GET /api/cron/repair-embeddings?limit=50
   Header: Authorization: Bearer ${CRON_SECRET}
   ```

2. **手动方式 - 运行脚本**
   ```bash
   cd /path/to/ppthub
   pnpm tsx scripts/generate-embeddings.ts
   ```

## 项目职责边界

本项目是 PPTHub 数据导入流程中的**中间桥梁**，专注于数据导入，不涉及文件处理和 AI 服务。

### ✅ ppthub-batch 负责

| 功能 | 说明 |
|------|------|
| JSON/CSV 解析 | 从 piliang 导出文件读取数据 |
| Preflight 校验 | 验证必填字段、分类、语言、URL 格式 |
| 批量 Upsert | 写入/更新 ppt 表 |
| 设置 embedding_status=pending | 标记需要向量化的记录 |
| Post-check 报告 | 导入后统计汇总 |

### ❌ ppthub-batch 不负责

| 功能 | 由谁负责 |
|------|----------|
| PPT 文件解析/处理 | piliang 项目 |
| 封面/缩略图生成 | piliang 项目 |
| 文件上传到 R2 | piliang 项目 |
| 向量生成 (Embedding) | 主项目 (PPTHub) |
| 搜索功能 | 主项目 (PPTHub) |

### 🔄 完整数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                         piliang (上游)                           │
│  - 下载/处理 PPT 源文件                                           │
│  - 生成缩略图、封面                                               │
│  - 上传文件到 R2 存储                                            │
│  - AI 内容丰富 (可选)                                            │
│  - 导出 ppthub-init.json                                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ppthub-batch (本项目)                         │
│  - 读取 JSON/CSV                                                │
│  - Preflight 校验 (字段、分类、语言、URL)                          │
│  - 批量写入数据库 (INSERT ... ON CONFLICT)                       │
│  - 设置 embedding_status = 'pending'                            │
│  - 生成导入报告                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PPTHub 主项目 (下游)                         │
│  - Repair Cron 自动生成向量                                       │
│  - 或手动运行 scripts/generate-embeddings.ts                     │
│  - 更新 embedding 字段和 embedding_status = 'success'            │
│  - 提供搜索、下载、展示等业务功能                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 架构说明

### 当前架构（CLI 批量导入）

### 可选扩展：Workers 在线 API（未实现）

```
客户端 → Workers API → 数据库
         ↓
    /api/process-ppt (单条)
    /api/batch (批量)
```

- 云端运行，实时处理
- 适合日常少量上传

#### Workers 模式职责边界

| 职责 | Workers | 离线脚本 |
|------|---------|---------|
| 预签名上传 URL | ✅ | ❌ |
| 接收元数据 | ✅ | ✅ |
| 调用 embedding API | ✅ | ✅ |
| 写入数据库 | ✅ | ✅ |
| PPT 解析 | ❌ | ✅ |
| 缩略图生成 | ❌ | ✅ |
| 超大文件处理 | ❌ | ✅ |

> 如需实现 Workers 模式，参考 `specs/ppthub-batch-import-and-vectorization/requirements.md` 中的 Requirement 11-12。
