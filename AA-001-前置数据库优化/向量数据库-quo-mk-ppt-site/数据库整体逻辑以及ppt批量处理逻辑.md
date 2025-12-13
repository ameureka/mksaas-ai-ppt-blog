# PPT 批量入库与处理服务设计方案

**文档版本**: v1.0  
**更新时间**: 2025-12-10  
**适用范围**: PPTHub 1k-10k PPT 批量入库、向量化、存储架构

---

## 一、背景与需求

### 1.1 当前状况
- 数据库: PostgreSQL (Neon) + pgvector 扩展
- 向量模型: BAAI/bge-m3 (1024维)
- 前端框架: Next.js 15 (Vercel 部署)
- 存储: S3/R2 兼容存储
- 现状补充: 已建 HNSW 向量索引 `ppt_embedding_idx`（vector_cosine_ops）；向量覆盖口径以 `embedding IS NOT NULL AND embedding_status='success'` 为准，数量随线上数据实时变化；并已增加 `embedding_status/embedding_error/embedding_updated_at` 用于可观测与补漏。

### 1.2 核心需求
- 批量导入 1k-10k PPT 数据
- 自动生成向量用于语义搜索
- 支持未来扩展到日常运营上传

---

## 二、向量数据库方案选择

### 2.1 方案对比

| 方案 | 选择 | 说明 |
|------|------|------|
| **pgvector** | ✅ 推荐 | PostgreSQL 原生扩展，Neon 已支持 |
| Pinecone | ❌ 未选择 | 独立向量数据库，需额外付费和维护 |
| Redis Stack | ❌ 未选择 | 不适合当前架构 |

### 2.2 为什么选 pgvector？

```
┌─────────────────────────┬───────────────────────────────────────────────────┐
│      pgvector (推荐)     │              Pinecone                             │
├─────────────────────────┼───────────────────────────────────────────────────┤
│ ✅ 同一个数据库          │ ❌ 独立服务，需要同步数据                          │
│ ✅ 免费 (Neon 已支持)    │ ❌ 付费 ($70+/月起)                               │
│ ✅ 无需维护两套系统      │ ❌ 需要维护 ID 映射关系                            │
│ ✅ 事务一致性            │ ❌ 最终一致性                                      │
│ ✅ 简单，一个 SQL 搞定   │ ❌ 需要两次查询 (向量库 + 主库)                    │
│ ⚠️ 大规模性能一般        │ ✅ 大规模性能优秀                                  │
└─────────────────────────┴───────────────────────────────────────────────────┘
```

### 2.3 pgvector 容量评估（现状已建 HNSW 索引）

| 数据量 | pgvector 性能 | 是否够用 |
|--------|--------------|----------|
| 1,000 | < 10ms | ✅ 绰绰有余 |
| 10,000 | < 50ms | ✅ 完全够用 |
| 100,000 | < 200ms | ✅ 够用 |
| 1,000,000 | 需优化索引/架构 | ⚠️ 考虑 Pinecone |

**存储估算 (10,000 条)**:
- 每条向量: 1024 维 × 4 字节 = 6KB
- 总计: 6KB × 10,000 = 60MB
- 索引: 已用 HNSW，约 100-150MB（视参数而定）；覆盖率口径同上，建议按 `embedding_status='success'` 持续统计

**结论**: Neon 免费版 (512MB) 轻松承载（现量级约 1k+ 条，HNSW 已建，按需持续监控向量覆盖率）

---

## 三、PPT 批量入库所需信息清单

### 3.1 必填字段（数据库强制要求）

| 字段 | 说明 | 校验规则 |
|------|------|----------|
| `title` | PPT 标题 | NOT NULL，建议 < 100 字符 |
| `file_url` | 文件直链 | NOT NULL，必须可访问 |
| `status` | 状态 | 必须设为 `published` 才能前台/搜索展示 |
| `deleted_at` | 软删标记 | 必须为空（未软删），否则前台/搜索会过滤掉 |

### 3.2 核心业务字段（强烈建议）

| 字段 | 说明 | 校验规则 |
|------|------|----------|
| `category` | 分类 | **必须是 12 个有效 slug 之一** |
| `tags` | 标签数组 | 建议 3-5 个，统一命名规范 |
| `description` | 描述 | 用于 SEO + 向量化，建议 50-200 字 |
| `language` | 语言 | `中文` / `English` / `其他`（数据库为 text，不强制枚举，初始化需与前端筛选一致） |
| `thumbnail_url` | 缩略图 | 卡片展示必需，必须可访问 |
| `slides_count` | 页数 | 前端展示 |

### 3.3 可选元数据

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `author` | 作者 | 可用默认值 "PPTHub" |
| `file_size` | 文件大小(字节) | 可选 |
| `file_format` | 文件格式 | 默认 `pptx` |
| `cover_image_url` | 封面大图 | 可同 thumbnail_url |
| `visibility` | 可见性 | 默认 `public` |

### 3.4 统计字段

| 字段 | 说明 | 策略 |
|------|------|------|
| `download_count` | 下载数 | 新数据设 0，更新数据保留原值 |
| `view_count` | 浏览数 | 新数据设 0，更新数据保留原值 |

### 3.5 系统自动字段

| 字段 | 处理方式 |
|------|----------|
| `id` | 默认自动生成 `ppt_{uuid}`；批量初始化推荐外部提供稳定的 `ppt_{aid}` |
| `created_at` | 自动生成或保留原始时间 |
| `updated_at` | 自动生成 |
| `deleted_at` | 置空 (NULL) |
| `embedding` | 批量脚本生成 |
| `embedding_model` | 自动填充 `BAAI/bge-m3` |
| `embedding_status` | 初始化为 `pending`，生成成功置 `success`，失败置 `failed` |
| `embedding_error` | 失败时写入原因，成功清空 |
| `embedding_updated_at` | 每次生成/重试时写入时间 |

---

## 四、分类映射表（必须严格匹配）

```typescript
const VALID_CATEGORIES = {
  'business':    '商务汇报',
  'education':   '教育培训',
  'technology':  '科技互联网',
  'design':      '设计创意',
  'marketing':   '产品营销',
  'hr':          '人力资源',
  'medical':     '医疗健康',
  'finance':     '金融财务',
  'general':     '通用模板',
  'summary':     '年终总结',
  'report':      '述职报告',
  'plan':        '工作计划',
};
```

⚠️ **注意**: 数据库无枚举约束，插错值不会报错但前端会异常！

---

## 五、数据准备格式

V5 之后，**标准初始化文件以 `ppthub-init.json` 为唯一权威格式**（由 piliang 工厂车间 F 导出），CSV 仅是其 items 的平铺版本。

### 5.1 标准 JSON（推荐：ppthub-init.json）

结构为 `{ meta, items }`：

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
      "title": "2024年度工作总结",
      "category": "summary",
      "tags": ["年终总结", "工作汇报", "数据分析"],
      "description": "适用于企业年度总结的专业模板",
      "language": "中文",
      "slides_count": 24,
      "file_url": "https://pub-xxx.r2.dev/ppts/summary/ppt_139646.pptx",
      "thumbnail_url": "https://pub-xxx.r2.dev/thumbs/summary/ppt_139646.jpg",
      "cover_image_url": "https://pub-xxx.r2.dev/thumbs/summary/ppt_139646.jpg",
      "file_size": 1382156,
      "file_format": "pptx",
      "author": "PPTHub",
      "status": "published",
      "visibility": "public",
      "download_count": 0,
      "view_count": 0,
      "created_at": "2025-10-01T00:00:00Z",
      "updated_at": "2025-12-12T00:00:00Z"
    }
  ]
}
```

字段说明（items 内）：
- **必填**：`title / file_url / category / thumbnail_url / status`，且 `deleted_at` 由导入脚本强制置空。
- **强烈建议**：`description / tags / slides_count / language / author`。
- **可选增强**：`id(推荐 ppt_{aid}) / cover_image_url / file_size(字节) / file_format / visibility / download_count / view_count / created_at / updated_at`。
- `category` 必须为 12 个有效 slug（见第 4 章映射）。
- `language` 取值必须与前端筛选一致：`中文 / English / 其他`。
- `file_url/thumbnail_url/cover_image_url` 必须为 `STORAGE_PUBLIC_URL` 生成的**短公共链接**，禁止 pre‑signed 长链接。
- 允许存在额外字段，导入器会忽略未知字段（用于溯源/调试）。

### 5.2 CSV（从 JSON items 展平）

CSV 不包含 meta，等价于 items 数组平铺。推荐字段全集如下（可按需省略可选列）：

```csv
id,title,category,tags,description,language,slides_count,file_url,thumbnail_url,cover_image_url,file_size,file_format,author,status,visibility,download_count,view_count,created_at,updated_at
ppt_139646,"2024年度工作总结","summary","年终总结|工作汇报|数据分析","适用于企业年度总结的专业模板","中文",24,"https://pub-xxx.r2.dev/ppts/summary/ppt_139646.pptx","https://pub-xxx.r2.dev/thumbs/summary/ppt_139646.jpg","https://pub-xxx.r2.dev/thumbs/summary/ppt_139646.jpg",1382156,"pptx","PPTHub","published","public",0,0,"2025-10-01T00:00:00Z","2025-12-12T00:00:00Z"
```

约束同 JSON。`tags` 以 `|` 或 `,` 分隔均可，导入时会 split+去重。

---

## 六、存储与链接准备

### 6.1 文件上传目标

| 资源 | 目标位置 | 命名规范建议 |
|------|----------|--------------|
| PPT 文件 | S3/R2 | `ppts/{category}/{uuid}.pptx` |
| 缩略图 | S3/R2 | `thumbs/{category}/{uuid}.png` |
| 封面图 | S3/R2 | `covers/{category}/{uuid}.png` |

### 6.2 链接格式示例
```
file_url:      https://{bucket}.r2.cloudflarestorage.com/ppts/business/xxx.pptx
thumbnail_url: https://{bucket}.r2.cloudflarestorage.com/thumbs/business/xxx.png
```

---

## 七、环境配置要求

### 7.1 必需的环境变量

```bash
# 数据库
DATABASE_URL="postgresql://neondb_owner:xxx@xxx.neon.tech/neondb?sslmode=require"

# 存储 (S3/R2)
STORAGE_REGION="auto"
STORAGE_BUCKET_NAME="ppthub-files"
STORAGE_ACCESS_KEY_ID="xxx"
STORAGE_SECRET_ACCESS_KEY="xxx"
STORAGE_ENDPOINT="https://xxx.r2.cloudflarestorage.com"
STORAGE_PUBLIC_URL="https://pub-xxx.r2.dev"

# 向量化 API
SILICONFLOW_API_KEY="sk-xxx"  # 或 OPENROUTER_API_KEY

# embedding 补漏与质量门控
CRON_SECRET="xxx"  # 保护 /api/cron/repair-embeddings
VECTOR_SIMILARITY_THRESHOLD="0.3"  # 向量结果相似度阈值(0~1), 默认 0.3
```

### 7.2 API 限制

| 服务 | 限制 | 策略 |
|------|------|------|
| 硅基流动 (BAAI/bge-m3) | 免费额度有限 | 批量限速约 1s/条（按供应商限流动态调整） |
| 数据库连接 | 连接池限制 | 批量 100 条/批 |


---

## 八、唯一性与更新策略

### 8.1 ID 策略

| 场景 | 策略 |
|------|------|
| 全新导入 | 优先使用输入提供的 `ppt_{aid}`；缺失时再生成 `ppt_{uuid}` |
| 更新现有 | 保留原 ID，用 `file_url` 或 `title` 做匹配 |

### 8.2 Upsert 规则

```typescript
// 自然键选择（二选一）
const naturalKey = 'file_url';  // 推荐：文件链接唯一
// 或
const naturalKey = 'title';     // 备选：标题唯一（可能有重名风险）
```

### 8.3 数据处理策略

| 情况 | 处理 |
|------|------|
| 新数据 | INSERT |
| 已存在（匹配自然键） | UPDATE（保留 id/统计数据；若 title/description/tags 无变化则不重算 embedding） |
| 废弃数据 | 软删除 (设置 deleted_at) |

---

## 九、数据质量校验清单

### 9.1 导入前校验
- [ ] `title` 非空
- [ ] `file_url` 非空且可访问 (HTTP 200)
- [ ] `status='published'` 且 `deleted_at IS NULL`
- [ ] `category` 在 12 个有效值内
- [ ] `thumbnail_url` 必填且可访问
- [ ] 无重复数据（按自然键去重）

### 9.2 导入后校验
- [ ] 各分类数量统计
- [ ] 空 description 数量
- [ ] 空 thumbnail_url 数量
- [ ] 向量化覆盖率 (embedding 非空且 `embedding_status='success'`)
- [ ] embedding pending/failed 数量（必要时触发 `/api/cron/repair-embeddings` 补漏重试）
- [ ] 文件 404 检查
- [ ] 搜索日志/热词：必要时触发热词更新，观测搜索结果是否正常返回（status+软删过滤生效）

---

## 十、批量入库执行流水线（现状：HNSW 索引已建；已有成功向量记录则跳过生成）

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 0: 数据库初始化                                       │
│  空库先执行 pnpm db:migrate / 启用 vector 扩展 / 建 HNSW 索引 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: 文件上传                                           │
│  PPT 文件 + 缩略图 → S3/R2 → 获取 URL                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: 元数据收集                                         │
│  整理 CSV/JSON，包含所有必填+核心字段                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 3: 数据校验                                           │
│  必填检查 + 分类校验 + URL 可访问性 + 去重                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 4: 批量写入                                           │
│  INSERT/UPSERT → ppt 表，每批 100 条（写入 embedding_status='pending'） │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 5: 向量化                                             │
│  遍历 embedding IS NULL 或 embedding_status!='success' → 调用 API → 更新 embedding + status │
│  限速: ~1s/条；失败可通过 repair cron 补漏重试               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 6: 验证 & 清理                                        │
│  分类统计 + 向量覆盖率 + 热词缓存更新（必要时手动刷新）       │
│  校验前台/搜索是否仅返回发布且未软删的数据                    │
│  可观察 search_log 以验证搜索请求落库                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 十一、上传服务架构方案

### 11.1 Vercel 限制分析

| 限制项 | Vercel 限制 | PPT 上传需求 |
|--------|------------|--------------|
| 请求体大小 | 4.5MB (Hobby) / 50MB (Pro) | PPT 通常 5-50MB ❌ |
| 函数执行时间 | 10s (Hobby) / 60s (Pro) | 向量化需要 2-5s ⚠️ |
| 无状态 | 无持久存储 | 需要临时文件处理 ❌ |

**结论**: Vercel 不适合直接处理 PPT 上传

### 11.2 架构方案对比

#### 方案 A: 客户端直传 S3/R2 + Vercel 处理元数据

```
┌─────────────────────────────────────────────────────────────────────┐
│                      管理后台 (前端)                                  │
└─────────────────────────────────────────────────────────────────────┘
         │                              │
         │ 1. 请求上传凭证               │ 4. 提交元数据
         ↓                              ↓
┌─────────────────┐            ┌─────────────────┐
│ Vercel API      │            │ Vercel API      │
│ /api/upload/    │            │ /api/ppts       │
│ presign         │            │ (CRUD)          │
└────────┬────────┘            └────────┬────────┘
         │ 2. 返回预签名 URL             │ 5. 写入数据库
         ↓                              ↓
┌─────────────────┐            ┌─────────────────┐
│ S3/R2           │            │ PostgreSQL      │
│ (文件存储)       │            │ (元数据+向量)    │
└─────────────────┘            └─────────────────┘
         ↑
         │ 3. 直传文件 (绕过 Vercel)
```

**优点**: 无需额外服务器，利用现有存储，成本低  
**缺点**: 无法自动提取 PPT 页数/缩略图

#### 方案 B: 独立处理服务

```
┌─────────────────────────────────────────────────────────────────────┐
│                      管理后台 (Vercel)                                │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ 上传 PPT 文件
         ↓
┌─────────────────────────────────────────────────────────────────────┐
│              独立处理服务 (VPS/云函数)                                 │
│  - 接收 PPT 文件                                                    │
│  - 提取页数 (python-pptx / LibreOffice)                            │
│  - 生成缩略图 (首页截图)                                            │
│  - 上传到 S3/R2                                                     │
│  - 生成向量 (调用 embedding API)                                    │
│  - 写入数据库                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

**优点**: 全自动处理，支持大文件  
**缺点**: 需要额外服务器成本

#### 方案 C: 混合方案 ✅ 推荐

```
日常运营 (少量):  方案 A - 客户端直传 + 手动填元数据
批量导入 (大量):  本地脚本 - 批量处理 + 直接写库
```

### 11.3 成本对比

| 方案 | 月成本 | 适用场景 |
|------|--------|----------|
| A: 客户端直传 | $0 | 日常少量上传 |
| B: 独立服务 | $5-20/月 (VPS) | 需要自动提取元数据 |
| C: 混合 | $0 | 日常+批量 |

---

## 十二、Cloudflare Workers 处理服务设计

### 12.1 架构概览

```
┌─────────────────────────────────────────────────────────────────────┐
│                      管理后台 / 批量脚本                              │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ POST /process
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Cloudflare Workers                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  /api/process-ppt - 处理单个 PPT                             │   │
│  │  /api/presign - 生成 R2 预签名上传 URL                        │   │
│  │  /api/batch - 批量处理队列                                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ↓                    ↓                    ↓
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ Cloudflare  │      │ 硅基流动     │      │ Neon        │
│ R2 (存储)   │      │ (向量API)   │      │ PostgreSQL  │
└─────────────┘      └─────────────┘      └─────────────┘
```

### 12.2 Workers 限制

| 限制项 | 免费版 | 付费版 ($5/月) |
|--------|--------|---------------|
| 请求数 | 10万/天 | 1000万/月 |
| CPU 时间 | 10ms | 50ms |
| 内存 | 128MB | 128MB |
| 请求体 | 100MB | 100MB |

### 12.3 Workers 能力范围

```
Workers 负责：
├── 生成预签名 URL（上传到 R2）
├── 接收元数据
├── 调用向量化 API
├── 写入数据库
└── 批量任务队列

Workers 不做：
├── 解析 PPT 文件（需要 python-pptx）
├── 生成缩略图（需要 LibreOffice）
└── 大文件处理
```

### 12.4 项目结构

```
ppt-worker/
├── src/
│   ├── index.ts          # 主入口
│   ├── routes/
│   │   ├── presign.ts    # 预签名上传
│   │   ├── process.ts    # 处理单个 PPT
│   │   └── batch.ts      # 批量处理
│   ├── services/
│   │   ├── r2.ts         # R2 存储
│   │   ├── db.ts         # 数据库
│   │   └── embedding.ts  # 向量生成
│   └── types.ts
├── wrangler.toml         # 配置
└── package.json
```

### 12.5 wrangler.toml 配置

```toml
name = "ppt-processor"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# R2 存储绑定
[[r2_buckets]]
binding = "PPT_BUCKET"
bucket_name = "ppthub-files"

# 环境变量
[vars]
EMBEDDING_API_URL = "https://api.siliconflow.cn/v1/embeddings"

# 密钥 (通过 wrangler secret 设置)
# DATABASE_URL
# EMBEDDING_API_KEY
```

### 12.6 部署步骤

```bash
# 1. 创建项目
mkdir ppt-worker && cd ppt-worker
pnpm init
pnpm add hono pg
pnpm add -D wrangler typescript @types/node

# 2. 配置 wrangler.toml

# 3. 设置密钥
wrangler secret put DATABASE_URL
wrangler secret put EMBEDDING_API_KEY

# 4. 创建 R2 存储桶
wrangler r2 bucket create ppthub-files

# 5. 部署
wrangler deploy
```

### 12.7 API 使用示例

**单个处理**:
```bash
curl -X POST https://ppt-processor.xxx.workers.dev/api/process \
  -H "Content-Type: application/json" \
  -d '{
    "title": "2024年度工作总结",
    "category": "summary",
    "tags": ["年终总结", "工作汇报"],
    "description": "适用于企业年度总结",
    "fileUrl": "https://r2.xxx.com/ppts/xxx.pptx",
    "thumbnailUrl": "https://r2.xxx.com/thumbs/xxx.png",
    "slidesCount": 24
  }'
```

**批量处理**:
```bash
curl -X POST https://ppt-processor.xxx.workers.dev/api/batch \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "title": "PPT 1", "category": "business", ... },
      { "title": "PPT 2", "category": "education", ... }
    ]
  }'
```


---

## 十三、推荐实施路径

### 当前阶段 (1k-10k PPT)

```
Step 1: 准备数据
├── 整理 PPT 文件
├── 生成/收集缩略图
├── 准备 CSV/JSON 元数据

Step 2: 上传文件
├── 批量上传 PPT 到 S3/R2
├── 批量上传缩略图到 S3/R2
└── 记录 URL 到元数据

Step 3: 批量导入
├── 运行导入脚本 → 写入数据库
└── 运行向量化脚本/repair cron → 生成 embedding（落 embedding_status）

Step 4: 验证
├── 检查分类统计
├── 检查向量覆盖率（以 embedding_status='success' 统计）
└── 更新热词缓存
```

### 未来扩展

```
如需日常上传功能:
├── 开发后台管理页面
├── 实现客户端直传
└── 可选: 部署 Workers API

如需自动提取元数据:
├── 部署独立处理服务 (VPS)
├── 使用 python-pptx 提取页数
└── 使用 LibreOffice 生成缩略图
```

---

## 十四、相关脚本清单

### 已有脚本
| 脚本 | 用途 | 命令 |
|------|------|------|
| `check-categories.ts` | 检查分类数据分布 | `pnpm check-categories` |
| `check-data-issues.ts` | 检查数据质量问题 | `pnpm check-data` |
| `fix-data-issues.ts` | 修复数据问题 | `pnpm fix-data` |
| `generate-embeddings.ts` | 批量生成 embedding | `pnpm generate-embeddings` |
| `baseline-drizzle-migrations.ts` | 已存在库写入迁移基线（避免重放旧迁移） | `pnpm db:baseline` |
| `seed-*.ts` | 种子数据 | `pnpm seed-all` |

### 待开发脚本
| 脚本 | 用途 |
|------|------|
| `batch-import.ts` | 批量导入 CSV/JSON |
| `batch-upload.ts` | 批量上传文件到 S3/R2 |
| `batch-vectorize.ts` | 批量生成向量 |
| `validate-urls.ts` | 校验 URL 可访问性 |

---

## 十五、总结

### 核心决策

| 决策项 | 选择 |
|--------|------|
| 向量数据库 | pgvector (PostgreSQL 扩展) |
| 向量模型 | BAAI/bge-m3 (1024维，SiliconFlow 优先，OpenRouter 兜底) |
| 批量处理方式 | 本地脚本 |
| 日常上传方式 | 客户端直传 S3/R2 |
| 独立服务 | 暂不需要，未来可选 Workers |

### 下一步行动

0. **初始化空库** - 执行 `pnpm db:migrate`，确保 `vector` 扩展与 `ppt_embedding_idx` 已创建（Neon 无权限时在控制台手动执行）
1. **准备数据源** - CSV/JSON 格式的 PPT 元数据
2. **上传文件** - PPT 文件和缩略图到 S3/R2
3. **运行批量导入** - 执行导入脚本（成功向量记录则跳过生成）
4. **验证结果** - 检查数据质量、状态过滤、向量覆盖率；记录搜索/向量性能监控
5. **后续治理** - 集成搜索日志/缓存（SQL 降级不分词）、评估全文索引或枚举约束（category/status 仍为可空 text）

---

## 附录：PPTHub 批量初始化导入器设计（V5 对齐）

> 目标：消费 `ppthub-init.json/csv`，在空库或已存在库中幂等写入 `ppt` 表，并触发/补漏 embedding 生成，确保上线即用。

### A.1 输入与校验

- 支持读取 `ppthub-init.json`（推荐）或 CSV。
- 校验 `meta.schema_version` 与 `natural_key`；不匹配则拒绝导入。
- 对每条 item 做字段归一化：
  - `title/description/tags` 去首尾空格、去 BOM、tags 去重收敛。
  - `category` 必须命中 12 slug。
  - `language` 必须为 `中文/English/其他`（若为 zh/en/other 则先映射）。
  - `status` 默认 `published`；`visibility` 默认 `public`。
  - `deleted_at` 一律置 NULL（初始化不允许软删）。

### A.2 自然键与 Upsert 策略

- **自然键**：优先 `file_url`（meta.natural_key），如缺失则回退 `title + category`。
- 导入分为两种：
  1. **INSERT 新记录**：自然键未命中时插入。
  2. **UPDATE 已存在记录**：自然键命中时更新核心字段。

更新规则：
- 业务字段（`title/category/description/tags/language/author/file_url/thumbnail_url/cover_image_url/file_size/file_format/visibility/status`）按输入覆盖。
- 统计字段（`download_count/view_count`）**默认保留库内旧值**；仅当输入显式提供且 `force_stats=true`（导入参数）时覆盖。
- `created_at`：若输入提供则写入（用于保留来源上架时间），否则保持旧值/导入时间。
- `updated_at`：无论输入是否提供，最终写为导入时间。

### A.3 Embedding 状态初始化与触发

- **新插入记录**：强制设置  
  `embedding_status='pending'`, `embedding_error=NULL`, `embedding_updated_at=now`。
- **更新记录**：若 `title/description/tags` 任一变化或库内 `embedding IS NULL/embedding_status!='success'`：
  - 置 `embedding_status='pending'` 并更新 `embedding_updated_at=now`；
  - 异步触发 `EmbeddingService.generateAndPersist`（不阻塞导入）。
- 导入完成后可运行 PPTHub repair cron（`/api/cron/repair-embeddings`）批量补漏。

### A.4 导入方式与兼容性

- **SQL 批量导入**：直接写 `thumbnail_url/cover_image_url`。
- **若走 createPPT action**：导入脚本需把 `thumbnail_url/cover_image_url` 兼容映射为 `preview_url`（防止卡片无封面）。

### A.5 失败处理与报告

- 以 batch（建议 100 条/批）事务写入；单批失败回滚但不影响其他批次。
- 输出报告：
  - `inserted / updated / skipped / failed` 数量
  - failed 逐条原因（字段缺失/URL 不可访问/分类不合法/DB 异常）
  - embedding 触发统计（pending 数量、直接 success 数量）
