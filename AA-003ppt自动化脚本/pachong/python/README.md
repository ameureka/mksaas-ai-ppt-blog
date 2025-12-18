# PPT 批量处理方案

> 对爬虫下载的 PPT 资源进行质量筛选 + 封面生成

## 一、数据现状

```
downloads/
├── ppt_jieri/                    # 4个频道目录
│   ├── images/                   # 封面图
│   │   └── {aid}-cover.jpg       # 命名规则: aid-cover.jpg
│   ├── {aid}-{title}.zip         # 压缩包
│   └── {aid}-{title}.rar
├── ppt_xiazai/   (12680 个)
├── ppt_moban/    (5618 个)
└── ppt_hangye/   (5641 个)
```

**总计**: 约 30,000 个资源

---

## 二、处理流程

```
┌─────────────────────────────────────────────────────────────────┐
│                        批量处理流程                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    [1] 解压文件 (unar)
                              │
                              ▼
                    [2] 质量筛选 (python-pptx)
                         读取页数
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
              页数 < 6              页数 >= 6
                 │                      │
                 ▼                      ▼
         移动到 archive/        [3] 封面生成 (LibreOffice)
         (含对应封面)                   │
         清理临时文件                   ▼
              ✗                 [4] 图片处理 (Pillow)
                                裁切 16:9 + 转 WebP
                                       │
                                       ▼
                                删除旧封面，保存新封面
                                       ✓
```

**核心原则**: 先筛选，后生成。不合格的 PPT 直接移走，不浪费 LibreOffice 转换资源。

---

## 三、输出规格 (符合前台要求)

### 前台约束
- 详情页主预览区: `aspect-video` (16:9)
- 列表页: `object-cover` 裁切显示
- 全屏预览: 90vh Modal，需要高清图

### 生成规格

| 文件 | 规格 | 用途 |
|------|------|------|
| `{aid}-cover.webp` | **640×360** (16:9), WebP, 居中裁切 | 列表页缩略图 |
| `{aid}-preview_1.webp` | **1920×1080** (16:9), WebP, 居中裁切 | 详情页主图 + 全屏预览 |
| `{aid}-preview_2.webp` | 原比例, 最大宽 1920px, WebP | 详情页轮播 (第2页) |
| `{aid}-preview_3.webp` | 原比例, 最大宽 1920px, WebP | 详情页轮播 (第3页) |
| `{aid}-preview_4.webp` | 原比例, 最大宽 1920px, WebP | 详情页轮播 (第4页) |
| `{aid}-preview_5.webp` | 原比例, 最大宽 1920px, WebP | 详情页轮播 (第5页) |

### 图片处理逻辑

```python
def process_cover(slide_1_png: str) -> Image:
    """生成列表页封面 (640×360, 16:9 裁切)"""
    img = Image.open(slide_1_png)
    img = crop_to_16_9(img)           # 居中裁切为 16:9
    img = img.resize((640, 360))      # 缩放到 640×360
    return img

def process_preview_1(slide_1_png: str) -> Image:
    """生成详情页主图 (1920×1080, 16:9 裁切)"""
    img = Image.open(slide_1_png)
    img = crop_to_16_9(img)           # 居中裁切为 16:9
    img = img.resize((1920, 1080))    # 缩放到 1920×1080
    return img

def process_preview_n(slide_n_png: str) -> Image:
    """生成详情页轮播图 (原比例, 最大宽 1920px)"""
    img = Image.open(slide_n_png)
    if img.width > 1920:
        ratio = 1920 / img.width
        img = img.resize((1920, int(img.height * ratio)))
    return img

def crop_to_16_9(img: Image) -> Image:
    """居中裁切为 16:9"""
    target_ratio = 16 / 9
    current_ratio = img.width / img.height
    
    if current_ratio > target_ratio:
        # 太宽，裁左右
        new_width = int(img.height * target_ratio)
        left = (img.width - new_width) // 2
        return img.crop((left, 0, left + new_width, img.height))
    else:
        # 太高，裁上下
        new_height = int(img.width / target_ratio)
        top = (img.height - new_height) // 2
        return img.crop((0, top, img.width, top + new_height))
```

### 文件格式
- 统一使用 **WebP** 格式
- 压缩质量: 85 (平衡画质与文件大小)
- 兼容性: 现代浏览器均支持，文件体积比 JPG 小 25-35%

---

## 四、目录结构变化

```
downloads/
├── ppt_jieri/
│   ├── images/
│   │   ├── {aid}-cover.webp       # 列表页封面 (640×360, 16:9)
│   │   ├── {aid}-preview_1.webp   # 详情页主图 (1920×1080, 16:9)
│   │   ├── {aid}-preview_2.webp   # 轮播图 (原比例, max 1920px)
│   │   ├── {aid}-preview_3.webp
│   │   ├── {aid}-preview_4.webp
│   │   ├── {aid}-preview_5.webp
│   │   └── {aid}-cover.jpg        # 旧封面 (处理后删除)
│   ├── {aid}-{title}.zip
│   └── ...
│
├── archive/                        # 不合格资源 (页数<6)
│   ├── ppt_jieri/
│   │   ├── images/
│   │   │   └── {aid}-cover.jpg    # 保留原封面
│   │   └── {aid}-{title}.zip      # 原压缩包
│   └── ...
```

---

## 五、数据库同步 (重要)

### 5.1 爬虫数据库 (SQLite - crawler.db)

当前 `tasks.meta` 结构:
```json
{
  "aid": "100084",
  "coverPath": ".../images/100084-cover.jpg",
  "filePath": ".../100084-xxx.zip"
}
```

处理后需要更新为:
```json
{
  "aid": "100084",
  "coverPath": ".../images/100084-cover.webp",
  "previewPaths": [
    ".../images/100084-preview_1.webp",
    ".../images/100084-preview_2.webp",
    ".../images/100084-preview_3.webp",
    ".../images/100084-preview_4.webp",
    ".../images/100084-preview_5.webp"
  ],
  "slideCount": 12,
  "filePath": ".../100084-xxx.zip"
}
```

### 5.2 前台数据库 (PostgreSQL - ppt 表)

当前字段:
- `cover_image_url` - 封面图 URL
- `thumbnail_url` - 缩略图 URL (与封面相同)

**需要扩展** (二选一):

**方案 A: 添加 preview_urls 数组字段 (推荐)**
```sql
ALTER TABLE ppt ADD COLUMN preview_urls TEXT[];
```

**方案 B: 前台按命名规则拼接**
```typescript
// 根据 coverImageUrl 推导 previewUrls
const baseUrl = coverImageUrl.replace('-cover.webp', '');
const previewUrls = [1,2,3,4,5].map(i => `${baseUrl}-preview_${i}.webp`);
```

### 5.3 数据同步脚本

处理完成后，需要运行同步脚本将本地数据导入前台数据库:
```bash
# 这是后续步骤，本脚本只负责文件处理
python sync_to_postgres.py --channel ppt_jieri
```

---

## 六、前台 previewUrls 数组对应

```javascript
// 前台详情页期望的数据结构
previewUrls: [
  "{aid}-preview_1.webp",  // 主图 (16:9, 高清) - 用于详情页大图
  "{aid}-preview_2.webp",  // 第2页
  "{aid}-preview_3.webp",  // 第3页
  "{aid}-preview_4.webp",  // 第4页
  "{aid}-preview_5.webp",  // 第5页
]

// cover 单独用于列表页缩略图
coverImageUrl: "{aid}-cover.webp"  // 640×360, 加载快
```

---

## 七、技术依赖

| 工具 | 用途 | 安装方式 |
|------|------|----------|
| unar | 解压 zip/rar | `brew install unar` (已安装) |
| LibreOffice | PPT → PNG 导出 | 已安装于 /Applications |
| python-pptx | 读取 PPT 页数 | `pip install python-pptx` |
| Pillow | 图片裁切/转码 | `pip install Pillow` |

---

## 八、风险与应对策略

### 8.1 .ppt 格式不支持

**问题**: python-pptx 只支持 .pptx，不支持旧版 .ppt

**解决方案**:
```python
def ensure_pptx(ppt_path: str, temp_dir: str) -> str:
    """将 .ppt 转换为 .pptx，返回可用的 pptx 路径"""
    if ppt_path.lower().endswith('.pptx'):
        return ppt_path
    
    # 使用 LibreOffice 转换
    subprocess.run([
        '/Applications/LibreOffice.app/Contents/MacOS/soffice',
        '--headless',
        '--convert-to', 'pptx',
        '--outdir', temp_dir,
        ppt_path
    ], check=True, timeout=60)
    
    # 返回转换后的文件路径
    base_name = Path(ppt_path).stem
    return str(Path(temp_dir) / f"{base_name}.pptx")
```

### 8.2 压缩包内多个 PPT 文件

**问题**: 一个压缩包可能包含多个 .ppt/.pptx 文件

**解决方案**: 优先级选择
```python
def find_best_ppt(temp_dir: str) -> Optional[str]:
    """从解压目录中选择最佳 PPT 文件"""
    ppt_files = []
    for ext in ['*.pptx', '*.ppt', '*.PPTX', '*.PPT']:
        ppt_files.extend(Path(temp_dir).rglob(ext))
    
    if not ppt_files:
        return None
    
    # 优先级: 
    # 1. .pptx 优先于 .ppt
    # 2. 文件大小最大的优先 (通常内容更丰富)
    # 3. 排除包含 "备份"、"副本" 等关键词的文件
    
    def score(f: Path) -> tuple:
        is_pptx = f.suffix.lower() == '.pptx'
        is_backup = any(kw in f.name for kw in ['备份', '副本', 'backup', 'copy'])
        size = f.stat().st_size
        return (not is_backup, is_pptx, size)
    
    return str(max(ppt_files, key=score))
```

### 8.3 压缩包损坏

**问题**: 部分压缩包可能损坏或格式异常

**解决方案**: 异常捕获 + 日志记录
```python
def extract_archive(archive_path: str, temp_dir: str) -> bool:
    """解压文件，返回是否成功"""
    try:
        result = subprocess.run(
            ['unar', '-o', temp_dir, '-f', archive_path],
            capture_output=True,
            timeout=120,
            text=True
        )
        if result.returncode != 0:
            logger.error(f"解压失败 {archive_path}: {result.stderr}")
            return False
        return True
    except subprocess.TimeoutExpired:
        logger.error(f"解压超时 {archive_path}")
        return False
    except Exception as e:
        logger.error(f"解压异常 {archive_path}: {e}")
        return False
```

### 8.4 处理时间长 - 断点续传

**问题**: 3万文件处理时间长，中断后需要重新开始

**解决方案**: SQLite 记录处理状态
```python
# 数据库表结构
"""
CREATE TABLE IF NOT EXISTS process_log (
    aid TEXT PRIMARY KEY,
    channel TEXT NOT NULL,
    status TEXT CHECK(status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'ARCHIVED')) NOT NULL,
    slide_count INTEGER,
    error_msg TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
"""

def get_pending_files(channel: str, limit: int = 100) -> list:
    """获取待处理文件，跳过已完成的"""
    # 从压缩文件列表中排除已在 process_log 中标记为 COMPLETED/ARCHIVED 的
    pass

def mark_completed(aid: str, slide_count: int):
    """标记处理完成"""
    pass

def mark_failed(aid: str, error_msg: str):
    """标记处理失败"""
    pass
```

### 8.5 磁盘空间

**问题**: 临时文件占用大量磁盘空间

**解决方案**: 
```python
import tempfile
import shutil
from contextlib import contextmanager

@contextmanager
def temp_workspace():
    """创建临时工作目录，自动清理"""
    temp_dir = tempfile.mkdtemp(prefix='ppt_process_')
    try:
        yield temp_dir
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

# 使用方式
def process_single_file(archive_path: str):
    with temp_workspace() as temp_dir:
        # 所有临时文件都在 temp_dir 中
        # 退出 with 块时自动清理
        extract_archive(archive_path, temp_dir)
        # ... 处理逻辑
```

### 8.6 LibreOffice 并发限制

**问题**: LibreOffice 不支持多实例并发运行

**解决方案**: 使用进程锁或单线程处理 LibreOffice 相关操作
```python
import threading

libreoffice_lock = threading.Lock()

def export_slides_to_png(ppt_path: str, output_dir: str) -> list:
    """导出 PPT 页面为 PNG (线程安全)"""
    with libreoffice_lock:
        subprocess.run([
            '/Applications/LibreOffice.app/Contents/MacOS/soffice',
            '--headless',
            '--convert-to', 'png',
            '--outdir', output_dir,
            ppt_path
        ], check=True, timeout=120)
    
    return sorted(Path(output_dir).glob('*.png'))
```

### 8.7 PPT 文件读取失败

**问题**: 部分 PPT 文件可能加密或格式异常

**解决方案**: 多重降级策略
```python
def get_slide_count(ppt_path: str, temp_dir: str) -> int:
    """获取 PPT 页数，支持多种降级策略"""
    
    # 策略1: python-pptx 直接读取 (最快)
    try:
        pptx_path = ensure_pptx(ppt_path, temp_dir)
        prs = Presentation(pptx_path)
        return len(prs.slides)
    except Exception as e:
        logger.warning(f"python-pptx 读取失败: {e}")
    
    # 策略2: LibreOffice 导出 PNG 后计数
    try:
        png_dir = Path(temp_dir) / 'png_count'
        png_dir.mkdir(exist_ok=True)
        export_slides_to_png(ppt_path, str(png_dir))
        return len(list(png_dir.glob('*.png')))
    except Exception as e:
        logger.warning(f"LibreOffice 导出失败: {e}")
    
    # 策略3: 返回 -1 表示无法确定
    return -1
```

---

## 九、核心代码结构

```
python/
├── README.md              # 本文档
├── requirements.txt       # Python 依赖
├── ppt_processor.py       # 主脚本
├── lib/
│   ├── __init__.py
│   ├── extractor.py       # 解压模块
│   ├── analyzer.py        # PPT 分析模块
│   ├── converter.py       # 格式转换模块
│   ├── image_processor.py # 图片处理模块
│   └── db.py              # 数据库模块
└── data/
    └── process.db         # 处理状态数据库
```

---

## 十、使用方法

```bash
# 1. 创建虚拟环境
cd /Users/ameureka/Desktop/mksaas-ai-ppt-blog/AA-003ppt自动化脚本/pachong/python
python3 -m venv .venv
source .venv/bin/activate

# 2. 安装依赖
pip install -r requirements.txt

# 3. 测试运行 (dry-run 模式，不实际修改文件)
python ppt_processor.py --channel ppt_jieri --limit 10 --dry-run

# 4. 小批量测试
python ppt_processor.py --channel ppt_jieri --limit 100

# 5. 全量处理
python ppt_processor.py --channel ppt_jieri
python ppt_processor.py --channel ppt_xiazai
python ppt_processor.py --channel ppt_moban
python ppt_processor.py --channel ppt_hangye

# 6. 查看处理状态
python ppt_processor.py --stats
```

---

## 十一、命令行参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `--channel` | 指定处理的频道 | `--channel ppt_jieri` |
| `--limit` | 限制处理数量 | `--limit 100` |
| `--dry-run` | 模拟运行，不实际修改 | `--dry-run` |
| `--stats` | 显示处理统计 | `--stats` |
| `--retry-failed` | 重试失败的任务 | `--retry-failed` |
| `--min-slides` | 最小页数阈值 (默认6) | `--min-slides 8` |

---

## 十二、预估时间

假设约 30% 的 PPT 不合格 (页数<6)，只有 70% 需要生成封面：

| 阶段 | 适用范围 | 单文件耗时 | 总耗时 |
|------|----------|-----------|--------|
| 解压 | 全部 30000 | ~1s | ~8h |
| 页数读取 | 全部 30000 | ~1s | ~8h |
| **不合格移动** | **~9000** | ~0.5s | ~1h |
| PNG 导出 | 合格 ~21000 | ~5s | ~29h |
| 图片裁切 | 合格 ~21000 | ~0.5s | ~3h |
| **总计** | - | - | **~49h** |

**相比原方案节省**: 约 30h (跳过不合格文件的 LibreOffice 转换)

**优化建议**:
- 断点续传，随时可中断恢复
- 并行解压 + 串行 LibreOffice
- 使用 SSD 加速 I/O

---

## 十三、日志与监控

```python
# 日志配置
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('logs/process.log'),
        logging.StreamHandler()
    ]
)

# 进度输出示例
# 2025-12-13 23:30:00 [INFO] 开始处理 ppt_jieri (共 6100 个文件)
# 2025-12-13 23:30:05 [INFO] [1/6100] 100084 - 页数: 12 - 生成封面成功
# 2025-12-13 23:30:10 [INFO] [2/6100] 100086 - 页数: 4 - 移动到 archive
# 2025-12-13 23:30:15 [WARN] [3/6100] 100088 - 解压失败: 文件损坏
```

---

## 十四、回滚方案

如果处理出现问题，可以通过以下方式回滚:

1. **恢复 archive 文件**: 将 `archive/` 下的文件移回原目录
2. **删除新生成的封面**: 删除 `images/*-cover.webp` 和 `images/*-preview_*.webp`
3. **重置数据库**: 删除 `data/process.db` 重新开始

```bash
# 回滚脚本示例
python ppt_processor.py --rollback --channel ppt_jieri
```
