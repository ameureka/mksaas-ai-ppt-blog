# 封面生成 Workshop 设计方案

## 问题背景

当前流水线的封面处理存在 bug：

```
原始封面 (downloads/images/{aid}-cover.jpg)
    ↓ Workshop 0 复制
input_raw/{aid}/cover.jpg  ← 带第三方品牌水印（如"第一PPT"）
    ↓ Workshop D 直接使用
final/{aid}-cover.jpg      ← 还是带水印的旧封面！
```

Workshop B 已经清洗了 PPT 内容（敏感词替换、尾页裁剪、品牌尾页注入），但封面仍然是原始的带第三方品牌的图片。

## 解决方案

### 方案对比

| 方案 | 描述 | 优点 | 缺点 |
|------|------|------|------|
| A. 修改 Workshop D | 在 pack 时从 clean_pptx 生成封面 | 改动小 | 职责混合，不符合单一职责 |
| B. 新增 Workshop D' | B→D'→D，独立封面生成阶段 | 职责清晰，可独立测试 | 增加一个阶段 |
| C. 合并到 Workshop B | 清洗后立即生成封面 | 减少阶段 | 职责不清，B 已经很重 |

**推荐方案 B：新增 Workshop D' (Cover)**

### 新流水线

```
Workshop B (Clean)
    ↓ clean_pptx_path
Workshop D' (Cover)  ← 新增
    ↓ 从 clean_pptx 第一页生成封面
    ↓ cover_path (新生成的干净封面)
Workshop D (Pack)
    ↓ 使用新封面打包
```

## 技术实现

### 参考实现

参考 `pachong/python/lib/generator.py` 的成熟方案：

```python
class CoverGenerator:
    def export_slides(self, ppt_path: str, output_dir: str, max_slides: int = 5) -> List[str]:
        """LibreOffice 导出 PPT 页面为 PNG"""
        with _libreoffice_lock:
            result = subprocess.run(
                [LIBREOFFICE_PATH, '--headless', '--convert-to', 'png', '--outdir', output_dir, ppt_path],
                capture_output=True, timeout=120, text=True
            )
            png_files = sorted(Path(output_dir).glob('*.png'))
            return [str(f) for f in png_files[:max_slides]]

    def generate_cover(self, png_path: str, output_path: str) -> bool:
        """生成列表页封面 (640×360, 16:9 裁切)"""
        img = Image.open(png_path)
        img = self._crop_to_16_9(img)
        img = img.resize((640, 360), Image.Resampling.LANCZOS)
        img.save(output_path, 'WEBP', quality=85)
        return True

    def _crop_to_16_9(self, img: Image.Image) -> Image.Image:
        """居中裁切为 16:9"""
        target_ratio = 16 / 9
        current_ratio = img.width / img.height
        if current_ratio > target_ratio:
            new_width = int(img.height * target_ratio)
            left = (img.width - new_width) // 2
            return img.crop((left, 0, left + new_width, img.height))
        else:
            new_height = int(img.width / target_ratio)
            top = (img.height - new_height) // 2
            return img.crop((0, top, img.width, top + new_height))
```

### 核心流程

```
1. LibreOffice 导出第一页为 PNG
   soffice --headless --convert-to png --outdir {temp} {clean_pptx}

2. PIL 处理（两个尺寸都必须生成）
   - 列表封面: 640×360 WebP (16:9 裁切)
   - 详情预览: 1920×1080 WebP (16:9 裁切)

3. 输出
   - {aid}-cover.webp   (640×360，列表页使用)
   - {aid}-preview.webp (1920×1080，详情页使用)
```

### 依赖

| 依赖 | 用途 | 安装 |
|------|------|------|
| LibreOffice | PPTX → PNG | `brew install --cask libreoffice` |
| Pillow | 图片处理 | `pip install Pillow` |
| threading.Lock | LibreOffice 不支持并发 | 内置 |

## 接口设计

### 新增文件

`src/factory/workshops/workshop_cover.py`

### 数据类型

```python
@dataclass(frozen=True)
class CoverOutput:
    aid: str
    channel_id: str
    cover_path: Path    # 列表封面 640×360
    preview_path: Path  # 详情预览 1920×1080
    source_slide: int   # 来源页码 (通常为 1)
```

### 配置

```python
@dataclass(frozen=True)
class WorkshopCoverConfig:
    output_dir: Path
    cover_size: tuple[int, int] = (640, 360)    # 列表封面
    preview_size: tuple[int, int] = (1920, 1080) # 详情预览
    quality: int = 85
    format: str = 'webp'  # 或 'jpg'
```

### 阶段枚举

```python
# stages.py
class StageName(str, Enum):
    ingest = 'ingest'
    preflight = 'preflight'
    A = 'A'
    B = 'B'
    C = 'C'
    COVER = 'COVER'  # 新增
    D = 'D'
    E = 'E'
    final_gate = 'final_gate'
    F = 'F'
```

### 调用示例

```python
from factory.workshops.workshop_cover import WorkshopCover, WorkshopCoverConfig

cover_workshop = WorkshopCover(WorkshopCoverConfig(
    output_dir=cfg.data_root / 'output' / 'cover'
))

cover_out = cover_workshop.run(clean_out)
# cover_out.cover_path → data/output/cover/{channel}/{aid}-cover.webp
```

## 流水线集成

### run_smoke_batch.py 修改

```python
# 现有流程
etl_out = run_etl(...)      # Workshop A
clean_out = run_clean(...)  # Workshop B
# ai_out = run_ai(...)      # Workshop C (可选)

# 新增
cover_out = run_cover(conn, clean_out=clean_out, workshop=cover_workshop)

# 修改 Workshop D 输入
pack_out = run_pack(
    conn,
    etl_out=etl_out,
    clean_out=clean_out,
    cover_out=cover_out,  # 使用新生成的封面
    workshop=pack_workshop,
)
```

### Workshop D 修改

```python
def pack(self, etl_out: EtlOutput, clean_out: CleanOutput, cover_out: CoverOutput | None = None) -> dict:
    # ...
    
    # 优先使用新生成的封面
    if cover_out and cover_out.cover_path.exists():
        final_cover = target_dir / f'{etl_out.aid}-cover.{cover_out.cover_path.suffix}'
        shutil.copyfile(cover_out.cover_path, final_cover)
    elif etl_out.local_cover_path and etl_out.local_cover_path.exists():
        # 回退到原始封面 (兼容旧流程)
        final_cover = target_dir / f'{etl_out.aid}-cover.jpg'
        shutil.copyfile(etl_out.local_cover_path, final_cover)
```

## 输出规范

### 文件路径

```
data/output/cover/{channel_id}/
├── {aid}-cover.webp      # 列表封面 640×360 (必需)
└── {aid}-preview.webp    # 详情预览 1920×1080 (必需)
```

### 质量参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| 格式 | WebP | 比 JPG 小 25-35%，支持透明 |
| 质量 | 85 | 平衡文件大小和清晰度 |
| 列表封面 | 640×360 | 16:9，适合列表页展示 |
| 详情预览 | 1920×1080 | 16:9，适合详情页大图 |

## 错误处理

| 错误码 | 场景 | 处理 |
|--------|------|------|
| `LIBREOFFICE_NOT_FOUND` | LibreOffice 未安装 | 回退到原始封面 + 警告 |
| `EXPORT_FAILED` | PNG 导出失败 | 回退到原始封面 + 警告 |
| `COVER_GEN_FAILED` | 图片处理失败 | 回退到原始封面 + 警告 |

## 实现清单

- [ ] 新增 `src/factory/workshops/workshop_cover.py`
- [ ] 新增 `CoverOutput` 类型到 `types.py`
- [ ] 更新 `stages.py` 添加 `COVER` 阶段
- [ ] 更新 `run_smoke_batch.py` 集成新阶段
- [ ] 修改 `workshopD.py` 支持 `cover_out` 参数
- [ ] 添加单元测试 `tests/test_workshop_cover.py`
- [ ] 更新 `README.md` 流程图和阶段说明

## 预估工作量

| 任务 | 时间 |
|------|------|
| workshop_cover.py 实现 | 1h |
| 类型和阶段更新 | 0.5h |
| 流水线集成 | 0.5h |
| 测试 | 1h |
| 文档更新 | 0.5h |
| **总计** | **3.5h** |
