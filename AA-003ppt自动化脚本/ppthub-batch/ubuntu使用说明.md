# ppthub-batch Ubuntu 部署指南

本文档说明如何在 Ubuntu 服务器上部署和运行 ppthub-batch 批量导入工具。

## 目录

- [前置条件](#前置条件)
- [系统要求](#系统要求)
- [项目转移](#项目转移)
- [系统依赖安装](#系统依赖安装)
- [项目依赖安装](#项目依赖安装)
- [环境变量配置](#环境变量配置)
- [验证安装](#验证安装)
- [运行导入](#运行导入)
- [与 Piliang 配合使用](#与-piliang-配合使用)
- [常见问题](#常见问题)

---

## 前置条件

### 必需的输入数据

运行 ppthub-batch 前，需要准备以下数据：

| 数据 | 说明 | 来源 |
|------|------|------|
| **ppthub-init-*.json** | Piliang 导出的初始化数据 | piliang Workshop F 产出 |
| **PostgreSQL 数据库** | PPTHub 主数据库（已创建 ppt 表） | PPTHub 主项目 |

### ppthub-init.json 格式

```json
{
  "meta": {
    "schema_version": "ppt-import-v2",
    "exported_at": "2024-12-18T12:00:00Z",
    "natural_key": "file_url",
    "source": "piliang",
    "source_batch_id": "batch-001"
  },
  "items": [
    {
      "id": "ppt_100",
      "title": "商务报告模板",
      "category": "business",
      "language": "中文",
      "tags": ["商务", "报告"],
      "description": "专业商务报告模板...",
      "file_url": "https://cdn.example.com/ppts/business/ppt_100.pptx",
      "thumbnail_url": "https://cdn.example.com/thumbs/business/ppt_100.webp",
      "slides_count": 20,
      "file_size": 1048576,
      "status": "published",
      "ai_summary": "...",
      "ai_content_summary": "...",
      "ai_keywords": ["商务", "报告"]
    }
  ]
}
```

### 数据库前置要求

在 PPTHub 主项目中完成以下设置：

```bash
# 1. 运行数据库迁移（创建 ppt 表）
cd /path/to/ppthub
pnpm db:migrate

# 2. 创建向量索引（可选，用于语义搜索）
pnpm tsx scripts/setup-vector-db.ts
```

### ppt 表结构（PPTHub 主项目定义）

```sql
CREATE TABLE ppt (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    language TEXT DEFAULT '中文',
    tags TEXT[],
    description TEXT,
    file_url TEXT UNIQUE NOT NULL,
    thumbnail_url TEXT,
    cover_image_url TEXT,
    slides_count INTEGER,
    file_size INTEGER,
    file_format TEXT DEFAULT 'pptx',
    author TEXT,
    status TEXT DEFAULT 'published',
    visibility TEXT DEFAULT 'public',
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    embedding vector(1536),
    embedding_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 外部服务依赖

| 服务 | 用途 | 必需 |
|------|------|------|
| **PostgreSQL** | PPTHub 数据库 | ✅ 必需 |
| **CDN 文件** | file_url/thumbnail_url 指向的文件 | 应已由 piliang 上传 |

### 完整数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                    上游: piliang 项目                            │
│  输入: crawler.db + downloads/                                  │
│  输出: ppthub-init-*.json + CDN 文件已上传                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                 当前: ppthub-batch 项目                          │
│  输入: ppthub-init-*.json                                       │
│  输出: 数据写入 PostgreSQL ppt 表                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    下游: PPTHub 主项目                           │
│  输入: ppt 表数据 (embedding_status=pending)                    │
│  处理: 生成向量 embedding，更新 embedding_status=success         │
│  输出: 可搜索的 PPT 模板数据                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 系统要求

- Ubuntu 20.04 / 22.04 LTS
- Node.js 18+ (推荐 20 LTS)
- pnpm 8+
- 网络可访问 PostgreSQL 数据库

---

## 项目转移

### 方式 1：rsync 同步

```bash
# 在本地 macOS 执行
rsync -avz --exclude 'node_modules' \
  /path/to/ppthub-batch/ \
  user@your-server:/home/user/ppthub-batch/
```

### 方式 2：scp 打包传输

```bash
# 本地打包
cd /path/to/AA-003ppt自动化脚本
tar --exclude='node_modules' -czvf ppthub-batch.tar.gz ppthub-batch/

# 传输到服务器
scp ppthub-batch.tar.gz user@your-server:/home/user/

# 在服务器解压
ssh user@your-server
tar -xzvf ppthub-batch.tar.gz
cd ppthub-batch
```

---

## 系统依赖安装

```bash
# 更新包管理器
sudo apt update

# 安装 Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
# 预期: v20.x.x

npm --version
# 预期: 10.x.x

# 安装 pnpm
npm install -g pnpm

pnpm --version
# 预期: 8.x.x 或 9.x.x
```

---

## 项目依赖安装

```bash
cd /home/user/ppthub-batch

# 安装依赖
pnpm install

# 验证安装
ls node_modules/.bin/tsx
# 预期: node_modules/.bin/tsx
```

---

## 环境变量配置

```bash
# 复制示例配置
cp .env.example .env

# 编辑配置
nano .env
```

### .env 配置示例

```bash
# 数据库连接 (必需)
# Neon 云数据库示例:
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# 本地 PostgreSQL 示例:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/ppthub

# 可选: 存储公共 URL 前缀
# STORAGE_PUBLIC_URL=https://your-cdn.example.com
```

---

## 验证安装

### 1. 运行测试

```bash
cd /home/user/ppthub-batch
pnpm test

# 预期输出:
# ✓ src/lib/postcheck.test.ts (14 tests)
# ✓ src/lib/url-validator.test.ts (22 tests)
# ...
# Test Files  7 passed (7)
#      Tests  118 passed (118)
```

### 2. 检查数据库连接

```bash
pnpm tsx -e "
import 'dotenv/config';
import { checkDatabaseConnection, closeDatabase } from './src/lib/db';
async function test() {
  const ok = await checkDatabaseConnection();
  console.log('数据库连接:', ok ? '✅ 成功' : '❌ 失败');
  await closeDatabase();
}
test();
"
```

### 3. Dry-run 测试

```bash
# 假设 piliang 导出文件在 ../piliang/data/output/export/
pnpm batch-import \
  --input ../piliang/data/output/export/ppthub-init-*.json \
  --dry-run

# 预期输出:
# 🚀 PPTHub 批量导入
# ==================
# ✅ 解析成功: X 条记录
# ✅ 有效记录: X
# ✅ Dry Run: 模拟插入 X 条
```

---

## 运行导入

### 基本用法

```bash
cd /home/user/ppthub-batch

# Dry-run 模式（仅校验）
pnpm batch-import \
  --input /path/to/ppthub-init.json \
  --dry-run

# 真实导入
pnpm batch-import \
  --input /path/to/ppthub-init.json \
  --postcheck

# 导出报告
pnpm batch-import \
  --input /path/to/ppthub-init.json \
  --output /path/to/report.json \
  --postcheck
```

### 完整选项

```bash
pnpm batch-import \
  -i, --input <path>       # 输入文件 (必需)
  -f, --format <format>    # auto|json|csv (默认: auto)
  -b, --batch-size <size>  # 每批次记录数，最大 100 (默认: 100)
  -m, --mode <mode>        # sql|action (默认: sql)
  --force-stats            # 强制覆盖 download_count/view_count
  --dry-run                # 仅校验不写库
  -o, --output <path>      # 导入报告输出路径
  --storage-url <url>      # 存储公共 URL 前缀
  --show-sql               # 显示生成的 SQL
  --postcheck              # 执行导入后校验报告
```

---

## 与 Piliang 配合使用

### 完整工作流

```bash
# 1. 在 piliang 中运行流水线
cd /home/user/piliang
source .venv/bin/activate
set -a && source .env && set +a
python scripts/run_smoke_batch.py \
  --manifest fixtures/production.json \
  --db data/assets.db \
  --enable-ai

# 2. 导入到 PPTHub 数据库
cd /home/user/ppthub-batch
pnpm batch-import \
  --input ../piliang/data/output/export/ppthub-init-*.json \
  --postcheck

# 3. 触发 Embedding 生成（在 PPTHub 主项目）
# 方式 A: 调用 Repair Cron
curl -X GET "https://your-ppthub.com/api/cron/repair-embeddings?limit=50" \
  -H "Authorization: Bearer ${CRON_SECRET}"

# 方式 B: 运行脚本
cd /home/user/ppthub
pnpm tsx scripts/generate-embeddings.ts
```

---

## 常见问题

### Q: 数据库连接失败？

```bash
# 检查环境变量
echo $DATABASE_URL

# 测试连接
psql "$DATABASE_URL" -c "SELECT 1"

# 检查网络
ping ep-xxx.region.aws.neon.tech
```

### Q: 找不到 tsx 命令？

```bash
# 确保依赖已安装
pnpm install

# 或使用 npx
npx tsx scripts/batch-import.ts --help
```

### Q: 导入后 embedding 状态是 pending？

这是正常的。导入后需要通过以下方式生成向量：

1. **Repair Cron（推荐）**
   ```bash
   curl -X GET "https://your-ppthub.com/api/cron/repair-embeddings?limit=50" \
     -H "Authorization: Bearer ${CRON_SECRET}"
   ```

2. **手动脚本**
   ```bash
   cd /path/to/ppthub
   pnpm tsx scripts/generate-embeddings.ts
   ```

### Q: 如何查看导入的数据？

```bash
pnpm tsx -e "
import 'dotenv/config';
import { executeRawSql, closeDatabase } from './src/lib/db';
async function check() {
  const rows = await executeRawSql(\`
    SELECT id, title, category, embedding_status
    FROM ppt ORDER BY created_at DESC LIMIT 10
  \`);
  console.table(rows);
  await closeDatabase();
}
check();
"
```

---

## 快速命令参考

```bash
# 安装依赖
pnpm install

# 运行测试
pnpm test

# Dry-run 导入
pnpm batch-import --input data.json --dry-run

# 真实导入 + 校验报告
pnpm batch-import --input data.json --postcheck

# 导出报告
pnpm batch-import --input data.json --output report.json

# 显示 SQL（调试）
pnpm batch-import --input data.json --dry-run --show-sql
```
