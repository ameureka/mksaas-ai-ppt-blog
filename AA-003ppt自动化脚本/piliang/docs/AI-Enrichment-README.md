# AI Enrichment 模块使用文档

## 概述

AI Enrichment 模块是 Piliang 工厂批量处理系统的核心组件（Workshop C），负责对 PPT 模板进行智能内容理解和派生字段增强。

### 主要功能

- **文本提取**: 从 PPTX 文件中提取可见文本内容
- **语言检测**: 基于字符占比自动检测语言（中文/英文/其他）
- **标签标准化**: 合并、去重、过滤敏感词，收敛到 3-8 个标签
- **描述生成**: 基于 AI 摘要和模板特征生成描述文本
- **分类推断**: 规则优先 + AI 回退的分类策略
- **批量处理**: 支持并发处理，单个失败不阻塞其他

## 快速开始

### 1. 安装依赖

```bash
cd piliang
poetry install
```

### 2. 配置环境

创建 `.env` 文件或设置环境变量：

```bash
# AI 命令模板（可选，用于调用外部 AI CLI）
AI_COMMAND_TEMPLATE='["gemini", "prompt", "{prompt}", "-o", "{output}"]'

# AI 超时配置
AI_TIMEOUT_SECONDS=60
AI_MAX_RETRIES=2

# 敏感词配置（可选，覆盖默认配置文件）
FORBIDDEN_KEYWORDS=第一PPT,1ppt,www.1ppt.com
```

### 3. 配置文件

确保以下配置文件存在：

```
piliang/
├── configs/
│   ├── forbidden-keywords.txt    # 敏感词列表
│   └── category-mapping.yaml     # 分类映射（可选）
└── templates/
    └── ai_prompt_template.md     # AI Prompt 模板
```

### 4. 基本使用

```python
from pathlib import Path
from src.factory.ai import (
    AIEnrichmentService,
    EnrichmentServiceConfig,
    create_etl_output,
)

# 创建服务
service = AIEnrichmentService(
    config=EnrichmentServiceConfig(
        ai_timeout_seconds=60,
        max_concurrency=2,
    )
)

# 创建输入
etl_output = create_etl_output(
    aid='ppt-001',
    channel_id='ppt_moban',
    local_pptx_path=Path('/path/to/template.pptx'),
    meta={
        'title': '商务年终总结PPT模板',
        'tags': ['商务', '年终总结'],
    },
)

# 处理单个 Asset
result = service.enrich_single(etl_output, skip_ai=False)

if result.success:
    output = result.output
    print(f"分类: {output.ppthub_category}")
    print(f"语言: {output.language}")
    print(f"标签: {output.tags_final}")
    print(f"描述: {output.description_final}")
else:
    print(f"错误: {result.error_message}")
```

### 5. 批量处理

```python
# 创建多个输入
etl_outputs = [
    create_etl_output(aid=f'ppt-{i:03d}', channel_id='ppt_moban', ...)
    for i in range(100)
]

# 批量处理
report = service.enrich_batch(
    batch_id='batch-001',
    etl_outputs=etl_outputs,
    skip_ai=False,
)

print(f"总数: {report.total}")
print(f"成功: {report.success}")
print(f"失败: {report.failed}")
print(f"成功率: {report.success_rate:.2%}")
```

## 模块架构

```
src/factory/ai/
├── __init__.py              # 模块导出
├── text_extractor.py        # 文本提取器
├── language_detector.py     # 语言检测器
├── tags_normalizer.py       # 标签标准化器
├── description_builder.py   # 描述构建器
├── prompt_template.py       # Prompt 模板管理
├── prompt_builder.py        # Prompt 构建器
├── ai_adapter.py            # AI 调用适配器
├── ai_parser.py             # AI 输出解析器
├── config_loader.py         # 配置加载器
├── field_merger.py          # 字段合并器
├── batch_processor.py       # 批量处理器
└── enrichment_service.py    # 统一服务入口
```

## 核心概念

### 1. 规则优先策略

分类推断采用规则优先策略：

1. **RuleEngine 匹配**: 首先尝试规则引擎匹配
2. **AI 调用**: 规则未命中时调用 AI
3. **Fallback**: AI 输出非法时回退到 `general`

```python
# 使用规则引擎
from src.factory.rules import RuleEngine

rule_engine = RuleEngine()
result = service.enrich_single(
    etl_output,
    rule_engine=rule_engine,
    skip_ai=False,
)

# 检查分类来源
print(f"分类来源: {result.output.category_source}")  # rule/ai/fallback
```

### 2. 语言检测规则

基于字符占比的检测规则：

| 条件 | 结果 |
|------|------|
| 中文字符占比 > 30% | 中文 |
| 英文字符占比 > 70% | English |
| 其他 | 其他 |

### 3. 标签收敛策略

- **合并**: AI 关键词 + 原始标签
- **去重**: 小写去重，保留原始大小写
- **过滤**: 长度 < 2 或 > 20，包含敏感词
- **收敛**:
  - \> 8 个: 保留 AI 前 5 个 + 原始补充至 8 个
  - < 3 个: 从标题提取关键词补充

### 4. 描述派生链

```
ai_summary → title + ai_scenario → + ai_structure_features
```

- 优先使用 AI 摘要
- 不足时追加标题和使用场景
- 最后追加结构特点
- 截断到 500 字
- 过滤敏感词

## 配置说明

### EnrichmentServiceConfig

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `project_root` | `Path` | `None` | 项目根目录 |
| `ai_command_template` | `list[str]` | `None` | AI 命令模板 |
| `ai_timeout_seconds` | `int` | `60` | AI 调用超时（秒） |
| `ai_max_retries` | `int` | `2` | AI 调用最大重试次数 |
| `max_concurrency` | `int` | `1` | 最大并发数 |
| `description_min_length` | `int` | `50` | 描述最小长度 |
| `description_max_length` | `int` | `500` | 描述最大长度 |
| `tags_min_count` | `int` | `3` | 标签最小数量 |
| `tags_max_count` | `int` | `8` | 标签最大数量 |

### 环境变量

| 变量名 | 说明 |
|--------|------|
| `AI_COMMAND_TEMPLATE` | AI 命令模板（JSON 数组） |
| `AI_TIMEOUT_SECONDS` | AI 调用超时 |
| `AI_MAX_RETRIES` | AI 调用重试次数 |
| `FORBIDDEN_KEYWORDS` | 敏感词列表（逗号分隔） |

## 数据库 Schema

### 新增字段

迁移脚本 `migrations/002_ai_enrichment_fields.sql` 添加以下字段：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `tags_final` | `TEXT` | 最终标签（JSON 数组） |
| `description_final` | `TEXT` | 最终描述 |
| `author` | `TEXT` | 作者 |
| `language_source` | `TEXT` | 语言来源（rule/ai/fallback） |
| `category_source` | `TEXT` | 分类来源（rule/ai/fallback） |
| `ai_fallback_reason` | `TEXT` | AI 回退原因 |
| `source_batch_id` | `TEXT` | 来源批次 ID |

### 新增索引

```sql
CREATE INDEX idx_ppthub_category ON processed_assets(ppthub_category);
CREATE INDEX idx_language ON processed_assets(language);
CREATE INDEX idx_source_batch_id ON processed_assets(source_batch_id);
```

## 故障排查

### 常见错误

#### 1. AI_EXEC_FAILED

**原因**: AI 命令执行失败（非零退出码）

**解决方案**:
- 检查 AI 命令模板是否正确
- 检查 AI CLI 是否已安装
- 查看 AI 命令的错误输出

#### 2. AI_OUTPUT_INVALID

**原因**: AI 输出文件不存在或 JSON 格式非法

**解决方案**:
- 检查输出目录权限
- 检查 AI 输出的 JSON 格式
- 验证必需字段是否完整

#### 3. ENRICHMENT_ERROR

**原因**: 处理过程中发生异常

**解决方案**:
- 检查 PPTX 文件是否有效
- 检查配置文件是否存在
- 查看详细错误日志

### 调试模式

```python
import logging

# 启用调试日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger('src.factory.ai')
logger.setLevel(logging.DEBUG)
```

### 跳过 AI 调用

开发测试时可跳过 AI 调用：

```python
result = service.enrich_single(etl_output, skip_ai=True)
```

## 测试

### 运行所有测试

```bash
python -m pytest tests/ -v
```

### 运行特定测试

```bash
# 集成测试
python -m pytest tests/test_ai_enrichment_e2e.py -v

# Schema 迁移测试
python -m pytest tests/test_schema_migration.py -v

# 单元测试
python -m pytest tests/test_text_extractor.py -v
python -m pytest tests/test_language_detector.py -v
python -m pytest tests/test_tags_normalizer.py -v
```

### 测试覆盖率

```bash
python -m pytest tests/ --cov=src/factory/ai --cov-report=html
```

## API 参考

### AIEnrichmentService

主要服务类，提供统一的 AI Enrichment 接口。

#### enrich_single()

处理单个 Asset。

```python
def enrich_single(
    self,
    etl_output: EtlOutput,
    *,
    rule_engine: Any | None = None,
    skip_ai: bool = False,
) -> EnrichmentResult
```

#### enrich_batch()

批量处理 Assets。

```python
def enrich_batch(
    self,
    *,
    batch_id: str,
    etl_outputs: list[EtlOutput],
    rule_engine: Any | None = None,
    skip_ai: bool = False,
) -> BatchProcessReport
```

#### persist_results()

持久化批量处理结果到数据库。

```python
def persist_results(
    self,
    conn: sqlite3.Connection,
    *,
    source_batch_id: str,
    report: BatchProcessReport,
) -> int
```

### 数据类型

#### EtlOutput

车间 B 输出（AI Enrichment 输入）。

```python
@dataclass
class EtlOutput:
    aid: str
    channel_id: str
    local_pptx_path: Path
    meta: dict[str, Any]
```

#### AiEnrichmentOutput

AI Enrichment 输出。

```python
@dataclass(frozen=True)
class AiEnrichmentOutput:
    aid: str
    ai_summary: str
    ai_keywords: list[str]
    ppthub_category: str
    language: Literal['中文', 'English', '其他']
    tags_final: list[str]
    description_final: str
    language_source: Literal['rule', 'ai', 'fallback']
    category_source: Literal['rule', 'ai', 'fallback']
    ai_fallback_reason: str | None = None
```

#### EnrichmentResult

单个 Asset 的处理结果。

```python
@dataclass(frozen=True)
class EnrichmentResult:
    aid: str
    success: bool
    output: AiEnrichmentOutput | None = None
    error_code: str | None = None
    error_message: str | None = None
    rule_matched: bool = False
    ai_called: bool = False
```

#### BatchProcessReport

批量处理报告。

```python
@dataclass(frozen=True)
class BatchProcessReport:
    batch_id: str
    total: int
    success: int
    failed: int
    skipped: int
    duration_ms: int
    results: list[AssetProcessResult]
```

## 更新日志

### v1.0.0

- 初始版本
- 实现完整的 AI Enrichment 流程
- 支持规则优先策略
- 支持批量处理与错误隔离
- 完整的单元测试和集成测试
