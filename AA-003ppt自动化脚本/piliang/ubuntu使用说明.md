# Piliang Ubuntu 部署指南

本文档详细说明如何在 Ubuntu 服务器上部署和运行 Piliang PPT 批量处理工厂。

## 目录

- [前置条件](#前置条件)
- [系统要求](#系统要求)
- [项目转移](#项目转移)
- [系统依赖安装](#系统依赖安装)
- [Python 环境配置](#python-环境配置)
- [环境变量配置](#环境变量配置)
- [验证安装](#验证安装)
- [运行流水线](#运行流水线)
- [常见问题](#常见问题)

---

## 前置条件

### 必需的输入数据

运行 Piliang 流水线前，需要准备以下数据：

| 数据 | 说明 | 来源 |
|------|------|------|
| **crawler.db** | 爬虫数据库，包含 PPT 元数据 | 爬虫项目产出 |
| **downloads/** | 下载的 PPT 源文件（.zip/.rar/.pptx/.ppt） | 爬虫项目产出 |
| **manifest.json** | 批次清单文件，指定要处理的 aid 列表 | 手动创建或脚本生成 |

### 数据目录结构

```
piliang/data/
├── crawler.db                    # 爬虫数据库（必需）
├── downloads/                    # 下载文件目录（必需）
│   └── {channel}/               # 按渠道分目录
│       ├── {aid}-{title}.zip    # PPT 压缩包
│       ├── {aid}-{title}.pptx   # 或直接 PPTX
│       └── images/              # 封面图（可选）
│           └── {aid}-cover.jpg
├── input_raw/                   # Workshop 0 生成的标准输入包
└── output/                      # 各阶段输出
```

### crawler.db 表结构

```sql
-- ppt_meta 表（爬虫产出）
CREATE TABLE ppt_meta (
    aid TEXT PRIMARY KEY,        -- 资产 ID
    title TEXT,                  -- 标题
    channelId TEXT,              -- 渠道 ID
    channelName TEXT,            -- 渠道名称
    tags TEXT,                   -- 标签 JSON 数组
    detailUrl TEXT,              -- 详情页 URL
    updatedAt TEXT,              -- 更新时间
    filePath TEXT,               -- 下载文件路径
    coverPath TEXT,              -- 封面图路径
    fileSizeKB INTEGER,          -- 文件大小
    ratio TEXT,                  -- 比例 (16:9/4:3)
    downloadStatus TEXT          -- 下载状态
);
```

### manifest.json 格式

```json
{
  "batch_id": "production-batch-001",
  "notes": "生产批次",
  "aids": [
    {
      "aid": "139646",
      "channel_id": "ppt_moban",
      "input_dir": "input_raw/ppt_moban/139646"
    }
  ]
}
```

### 外部服务依赖

| 服务 | 用途 | 必需 |
|------|------|------|
| **Cloudflare R2 / S3** | 文件存储和 CDN | Workshop E 上传时必需 |
| **SiliconFlow API** | DeepSeek AI 调用 | Workshop C 启用 AI 时必需 |

---

## 系统要求

- Ubuntu 20.04 / 22.04 LTS
- Python 3.11+
- 磁盘空间：至少 5GB（LibreOffice + 数据）
- 内存：建议 4GB+

---

## 项目转移

### 方式 1：rsync 同步（推荐）

```bash
# 在本地 macOS 执行
rsync -avz --exclude '.venv' --exclude '__pycache__' --exclude '*.pyc' \
  /Users/ameureka/Desktop/mksaas-ai-ppt-blog/AA-003ppt自动化脚本/piliang/ \
  user@your-server:/home/user/piliang/
```

### 方式 2：scp 打包传输

```bash
# 本地打包（排除虚拟环境和缓存）
cd /Users/ameureka/Desktop/mksaas-ai-ppt-blog/AA-003ppt自动化脚本
tar --exclude='.venv' --exclude='__pycache__' --exclude='*.pyc' \
  -czvf piliang.tar.gz piliang/

# 传输到服务器
scp piliang.tar.gz user@your-server:/home/user/

# 在服务器解压
ssh user@your-server
tar -xzvf piliang.tar.gz
cd piliang
```

### 方式 3：Git 克隆（如果有仓库）

```bash
ssh user@your-server
git clone https://github.com/your-repo/piliang.git
cd piliang
```

---

## 系统依赖安装

```bash
# 更新包管理器
sudo apt update && sudo apt upgrade -y

# 安装 Python 3.11
sudo apt install -y python3.11 python3.11-venv python3.11-dev

# 安装 LibreOffice（PPTX 转换和封面生成）
sudo apt install -y libreoffice

# 安装 poppler-utils（PDF 转图片）
sudo apt install -y poppler-utils

# 安装 unar（解压 RAR 文件）
sudo apt install -y unar

# 安装 pip
sudo apt install -y python3-pip
```

### 验证系统依赖

```bash
# 检查 LibreOffice
which soffice
# 预期输出: /usr/bin/soffice

soffice --version
# 预期输出: LibreOffice 7.x.x ...

# 检查 pdftoppm
which pdftoppm
# 预期输出: /usr/bin/pdftoppm

pdftoppm -v
# 预期输出: pdftoppm version 22.x.x

# 检查 unar
which unar
# 预期输出: /usr/bin/unar

# 检查 Python
python3.11 --version
# 预期输出: Python 3.11.x
```

---

## Python 环境配置

```bash
cd /home/user/piliang

# 创建虚拟环境
python3.11 -m venv .venv

# 激活虚拟环境
source .venv/bin/activate

# 升级 pip
pip install --upgrade pip

# 安装项目依赖
pip install -e ".[dev]"
```

### 验证 Python 依赖

```bash
# 检查关键包
pip list | grep -E "python-pptx|Pillow|boto3|pyyaml"
# 预期输出:
# boto3           1.x.x
# Pillow          10.x.x
# python-pptx     0.6.x
# PyYAML          6.x.x
```

---

## 环境变量配置

```bash
cd /home/user/piliang

# 复制示例配置
cp .env.example .env

# 编辑配置文件
nano .env
```

### .env 配置示例

```bash
# ============================================
# 数据目录配置
# ============================================
PILIANG_DATA_ROOT=data
PILIANG_CRAWLER_DB=crawler.db
PILIANG_CONCURRENCY=4
PILIANG_HEAD_PRUNE_MAX=0

# ============================================
# 存储配置（Cloudflare R2 示例）
# ============================================
STORAGE_ENDPOINT=https://xxxxxxxx.r2.cloudflarestorage.com
STORAGE_BUCKET_NAME=ppt-assets
STORAGE_ACCESS_KEY_ID=your_access_key
STORAGE_SECRET_ACCESS_KEY=your_secret_key
STORAGE_REGION=auto
STORAGE_PUBLIC_URL=https://your-cdn.com
STORAGE_DRY_RUN=false

# 远程路径模板
STORAGE_PATH_PPTX=ppts/{category}/ppt_{aid}.pptx
STORAGE_PATH_THUMB=thumbs/{category}/ppt_{aid}.webp
STORAGE_PATH_PREVIEW=previews/{category}/ppt_{aid}.webp

# ============================================
# AI 配置（DeepSeek via SiliconFlow）
# ============================================
AI_PROVIDER=deepseek
SILICONFLOW_API_KEY=sk-xxxxxxxxxxxxxxxx
AI_COMMAND_TEMPLATE="python scripts/ai_caller.py {prompt} {output}"
AI_TIMEOUT_SECONDS=120
AI_MAX_RETRIES=3
```

---

## 验证安装

### 1. 运行测试

```bash
cd /home/user/piliang
source .venv/bin/activate

# 运行全部测试
pytest tests/ -v --tb=short

# 预期输出:
# ========================= test session starts ==========================
# ...
# ========================= 253 passed in 2.55s ==========================
```

### 2. 检查 LibreOffice 可用性

```bash
python3 -c "
import shutil
lo = shutil.which('soffice') or shutil.which('libreoffice')
print(f'LibreOffice: {lo}')
unar = shutil.which('unar')
print(f'unar: {unar}')
pdftoppm = shutil.which('pdftoppm')
print(f'pdftoppm: {pdftoppm}')
"

# 预期输出:
# LibreOffice: /usr/bin/soffice
# unar: /usr/bin/unar
# pdftoppm: /usr/bin/pdftoppm
```

### 3. 检查存储配置

```bash
python3 -c "
from factory.storage.storage_adapter import load_storage_config_from_env
cfg = load_storage_config_from_env()
print(f'Endpoint: {cfg.endpoint}')
print(f'Bucket: {cfg.bucket_name}')
print(f'Public URL: {cfg.public_url}')
print(f'Dry Run: {cfg.dry_run}')
"
```

---

## 运行流水线

### 准备测试数据

```bash
# 确保有输入数据
ls data/input_raw/
# 应该看到 channel 目录，如: education/, business/

# 检查 manifest 文件
cat fixtures/mini_batch_manifest.json
```

### 运行完整流水线

```bash
cd /home/user/piliang
source .venv/bin/activate
set -a && source .env && set +a

# Dry-run 模式（不上传）
python scripts/run_smoke_batch.py \
  --manifest fixtures/mini_batch_manifest.json \
  --db data/assets_smoke.db \
  --from-stage ingest \
  --to-stage F

# 启用 AI + 真实上传
python scripts/run_smoke_batch.py \
  --manifest fixtures/mini_batch_manifest.json \
  --db data/assets_smoke.db \
  --from-stage ingest \
  --to-stage F \
  --enable-ai
```

### 预期输出

```
=== Stage: ingest ===
[aid=100] ingest: success
[aid=1174] ingest: success
...

=== Stage: A ===
[aid=100] A: success (pages=24, size=2.1MB)
...

=== Stage: B ===
[aid=100] B: success (cleaned)
...

=== Stage: C ===
[aid=100] C: success (category=education, ai_summary=...)
...

=== Stage: COVER ===
[aid=100] COVER: success (cover=640x360, preview=1920x1080)
...

=== Stage: D ===
[aid=100] D: success (packed)
...

=== Stage: E ===
[aid=100] E: success (uploaded to CDN)
...

=== Stage: F ===
Exported 4 items to data/output/export/ppthub-init-xxx.json
```

### 验证输出

```bash
# 检查数据库状态
sqlite3 -header -column data/assets_smoke.db "
SELECT aid, stage, status FROM stage_records 
ORDER BY aid, stage;"

# 检查导出文件
ls -la data/output/export/
# ppthub-init-xxx.json
# ppthub-init-xxx.csv
# ppthub-export-report-xxx.json

# 查看 JSON 导出
python3 -c "
import json
data = json.load(open('data/output/export/ppthub-init-mini-batch.json'))
print(f'Items: {len(data[\"items\"])}')
for item in data['items'][:2]:
    print(f'  - {item[\"id\"]}: {item[\"title\"][:30]}...')
"

# 验证 CDN 可访问（如果已上传）
curl -sI https://your-cdn.com/ppts/education/ppt_100.pptx | head -3
# 预期: HTTP/2 200
```

---

## 常见问题

### Q: LibreOffice 找不到？

```bash
# 检查安装
dpkg -l | grep libreoffice

# 重新安装
sudo apt install --reinstall libreoffice

# 手动指定路径（在 .env 中）
LIBREOFFICE_PATH=/usr/bin/soffice
```

### Q: 权限问题？

```bash
# 确保数据目录可写
chmod -R 755 data/
chown -R $USER:$USER data/
```

### Q: 内存不足？

```bash
# 检查内存
free -h

# 添加 swap（如果需要）
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Q: AI 调用超时？

```bash
# 增加超时时间（在 .env 中）
AI_TIMEOUT_SECONDS=180
AI_MAX_RETRIES=5
```

### Q: 封面生成失败？

```bash
# 检查 LibreOffice 是否能正常转换
soffice --headless --convert-to pdf --outdir /tmp test.pptx

# 检查 pdftoppm
pdftoppm -png /tmp/test.pdf /tmp/test_page
```

---

## 后台运行

### 使用 nohup

```bash
nohup python scripts/run_smoke_batch.py \
  --manifest fixtures/large_batch.json \
  --db data/assets.db \
  --enable-ai \
  > logs/batch_$(date +%Y%m%d_%H%M%S).log 2>&1 &

# 查看进度
tail -f logs/batch_*.log
```

### 使用 screen

```bash
screen -S piliang
source .venv/bin/activate
set -a && source .env && set +a
python scripts/run_smoke_batch.py --manifest fixtures/large_batch.json --db data/assets.db --enable-ai

# Ctrl+A, D 分离
# screen -r piliang 重新连接
```

### 使用 systemd（生产环境）

```bash
# 创建 service 文件
sudo nano /etc/systemd/system/piliang.service
```

```ini
[Unit]
Description=Piliang PPT Batch Processor
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/piliang
Environment="PATH=/home/ubuntu/piliang/.venv/bin"
EnvironmentFile=/home/ubuntu/piliang/.env
ExecStart=/home/ubuntu/piliang/.venv/bin/python scripts/run_smoke_batch.py --manifest fixtures/production.json --db data/assets.db --enable-ai
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable piliang
sudo systemctl start piliang
sudo systemctl status piliang
```

---

## 快速命令参考

```bash
# 激活环境
cd /home/user/piliang && source .venv/bin/activate && set -a && source .env && set +a

# 运行测试
pytest tests/ -v

# 完整流水线
python scripts/run_smoke_batch.py --manifest fixtures/mini_batch_manifest.json --db data/assets.db --enable-ai

# 仅特定阶段
python scripts/run_smoke_batch.py --manifest fixtures/mini_batch_manifest.json --db data/assets.db --from-stage A --to-stage D

# 查看数据库
sqlite3 data/assets.db ".tables"
sqlite3 -header -column data/assets.db "SELECT * FROM stage_records LIMIT 10;"

# 清空输出重跑
rm -rf data/output/etl/* data/output/clean/* data/output/cover/* data/output/final/* data/output/export/*
```
