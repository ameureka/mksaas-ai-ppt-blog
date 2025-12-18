# Piliang AI 批量处理增强方案（30000 PPT）

> 版本: v1.0  
> 日期: 2024-12-13  
> 状态: 设计中

## 目录

- [一、问题分析](#一问题分析)
- [二、架构设计](#二架构设计)
- [三、数据库扩展](#三数据库扩展)
- [四、核心组件设计](#四核心组件设计)
- [五、CLI 接口设计](#五cli-接口设计)
- [六、质量控制](#六质量控制)
- [七、监控与报告](#七监控与报告)
- [八、实施计划](#八实施计划)

---

## 一、问题分析

### 1.1 规模估算

| 指标 | 数值 | 说明 |
|------|------|------|
| 总量 | 30,000 PPT | 需要 AI 处理的资产数 |
| 规则命中率 | ~40% | 标题/标签关键词匹配，无需 AI |
| 实际 AI 调用 | ~18,000 次 | 60% 需要 AI 兜底 |
| 单次 AI 耗时 | 5-30s | 取决于模型和网络 |
| 顺序处理时间 | 25-150 小时 | 不可接受 |
| 并发处理时间 | 2.5-15 小时 | 10 并发 |

### 1.2 风险矩阵

```
┌──────────────────┬──────────────┬───────────────────────────────────────┐
│ 风险             │ 影响         │ 后果                                   │
├──────────────────┼──────────────┼───────────────────────────────────────┤
│ 进程中断         │ 高           │ 已处理数据丢失，需从头开始              │
│ AI API 限流      │ 高           │ 大量请求失败，成本浪费                  │
│ 重复处理         │ 中           │ AI 成本翻倍，时间浪费                   │
│ 内存溢出         │ 中           │ 大批量加载导致 OOM                      │
│ 网络抖动         │ 中           │ 单次失败导致整批失败                    │
│ AI 输出质量差    │ 中           │ 脏数据进入生产库                        │
│ 无法监控进度     │ 低           │ 无法预估完成时间，难以排期              │
└──────────────────┴──────────────┴───────────────────────────────────────┘
```

### 1.3 现有机制评估

| 能力 | 现状 | 评估 |
|------|------|------|
| 阶段记录 | `asset_stages` 表记录每个 aid 每个阶段的 status | ✅ 已有 |
| 重试机制 | `AIAdapter` 支持 3 次重试 + 指数退避 | ✅ 已有 |
| 错误记录 | `error_code`, `error_message` 字段 | ✅ 已有 |
| 去重（aid 级） | aid 是主键，不会重复插入 | ✅ 已有 |
| 断点续传 | 没有自动跳过已成功的 aid | ❌ 缺失 |
| 内容级去重 | 相似 PPT 会重复调用 AI | ❌ 缺失 |
| 并发控制 | 顺序执行，无限流 | ❌ 缺失 |
| 进度报告 | 无实时进度 | ❌ 缺失 |
| AI 缓存 | 每次都调用 AI | ❌ 缺失 |
| 质量校验 | 只有 success/failed | ❌ 缺失 |

---

## 二、架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BatchAIOrchestrator                                  │
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Scanner   │───▶│   Filter    │───▶│  Scheduler  │───▶│   Worker    │  │
│  │  (发现待处理) │    │ (断点/去重)  │    │ (并发调度)   │    │ (AI 执行)   │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘  │
│                                                                   │         │
│                                              ┌────────────────────┘         │
│                                              ▼                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  Reporter   │◀───│  Validator  │◀───│   Cache     │◀───│   Parser    │  │
│  │  (进度报告)  │    │ (质量校验)   │    │ (结果缓存)   │    │ (解析结果)   │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SQLite (assets.db)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ asset_stages │  │  ai_cache    │  │ batch_stats  │  │ ai_call_log  │    │
│  │ (阶段状态)    │  │ (内容缓存)   │  │ (批次统计)   │  │ (调用日志)   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流

```
                                    输入
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. Scanner: 从 manifest 或 DB 加载待处理 aid 列表                           │
│     SELECT aid FROM raw_assets WHERE source_batch_id = ?                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  2. Filter: 断点续传 + 去重                                                  │
│     - 跳过 stage=C, status=success 的 aid                                   │
│     - 跳过 content_hash 已存在于 ai_cache 的 aid                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. Scheduler: 并发调度                                                      │
│     - Semaphore 控制并发数（默认 5）                                         │
│     - 令牌桶限流（默认 10 req/min）                                          │
│     - 优先级队列（失败重试优先级低）                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  4. Worker: 执行 AI 处理                                                     │
│     a. 规则引擎匹配 → 命中则跳过 AI                                          │
│     b. 查询 ai_cache → 命中则复用                                            │
│     c. 调用 AI → 解析 → 校验 → 写入 cache + DB                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  5. Reporter: 实时进度                                                       │
│     - tqdm 进度条                                                            │
│     - 每 100 条输出统计                                                      │
│     - 完成后生成报告                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 处理流程状态机

```
                    ┌─────────────────────────────────────────┐
                    │              pending                     │
                    │           (初始状态)                     │
                    └─────────────────┬───────────────────────┘
                                      │
                          ┌───────────┴───────────┐
                          ▼                       ▼
              ┌─────────────────────┐   ┌─────────────────────┐
              │   rule_matched      │   │    processing       │
              │  (规则命中，跳过AI)  │   │    (处理中)         │
              └──────────┬──────────┘   └──────────┬──────────┘
                         │                         │
                         │              ┌──────────┼──────────┐
                         │              ▼          ▼          ▼
                         │    ┌──────────────┐ ┌────────┐ ┌────────┐
                         │    │ cache_hit    │ │success │ │ failed │
                         │    │ (缓存命中)   │ │ (成功) │ │ (失败) │
                         │    └──────┬───────┘ └────┬───┘ └────┬───┘
                         │           │              │          │
                         └───────────┴──────────────┘          │
                                      │                        │
                                      ▼                        │
                              ┌─────────────┐                  │
                              │    done     │◀─────────────────┘
                              │  (完成)     │     (重试耗尽)
                              └─────────────┘
```

---

## 三、数据库扩展

### 3.1 新增表结构

```sql
-- ============================================================
-- AI 缓存表：基于内容哈希缓存 AI 结果，避免重复调用
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_cache (
  content_hash TEXT PRIMARY KEY,      -- SHA256(title + '|' + sorted_tags + '|' + pptx_text[:500])
  ai_response TEXT NOT NULL,          -- 完整 AI JSON 响应
  ppthub_category TEXT,               -- 解析后的分类（便于查询）
  language TEXT,                      -- 解析后的语言
  model_name TEXT,                    -- 使用的模型名称
  model_version TEXT,                 -- 模型版本
  prompt_tokens INTEGER,              -- 输入 token 数（成本统计）
  completion_tokens INTEGER,          -- 输出 token 数
  latency_ms INTEGER,                 -- 响应延迟（毫秒）
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  hit_count INTEGER DEFAULT 0,        -- 缓存命中次数
  last_hit_at DATETIME                -- 最后命中时间
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_category ON ai_cache(ppthub_category);
CREATE INDEX IF NOT EXISTS idx_ai_cache_created_at ON ai_cache(created_at);

-- ============================================================
-- AI 调用日志表：记录每次 AI 调用详情（审计 + 调试）
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_call_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  aid TEXT NOT NULL,                  -- 关联的资产 ID
  source_batch_id TEXT NOT NULL,      -- 批次 ID
  content_hash TEXT,                  -- 内容哈希（关联 ai_cache）
  call_type TEXT NOT NULL,            -- 'ai_call' | 'cache_hit' | 'rule_match'
  model_name TEXT,                    -- 模型名称
  prompt_path TEXT,                   -- 提示词文件路径
  response_path TEXT,                 -- 响应文件路径
  status TEXT NOT NULL,               -- 'success' | 'failed' | 'timeout' | 'rate_limited'
  error_message TEXT,                 -- 错误信息
  latency_ms INTEGER,                 -- 响应延迟
  retry_count INTEGER DEFAULT 0,      -- 重试次数
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (aid) REFERENCES raw_assets(aid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_call_log_aid ON ai_call_log(aid);
CREATE INDEX IF NOT EXISTS idx_ai_call_log_batch ON ai_call_log(source_batch_id);
CREATE INDEX IF NOT EXISTS idx_ai_call_log_status ON ai_call_log(status);
CREATE INDEX IF NOT EXISTS idx_ai_call_log_type ON ai_call_log(call_type);

-- ============================================================
-- 批次统计表：实时统计批次处理进度
-- ============================================================
CREATE TABLE IF NOT EXISTS batch_stats (
  source_batch_id TEXT PRIMARY KEY,
  total_count INTEGER DEFAULT 0,          -- 总数
  pending_count INTEGER DEFAULT 0,        -- 待处理
  processing_count INTEGER DEFAULT 0,     -- 处理中
  success_count INTEGER DEFAULT 0,        -- 成功
  failed_count INTEGER DEFAULT 0,         -- 失败
  skipped_count INTEGER DEFAULT 0,        -- 跳过（已完成）
  rule_match_count INTEGER DEFAULT 0,     -- 规则命中（无需 AI）
  cache_hit_count INTEGER DEFAULT 0,      -- 缓存命中
  ai_call_count INTEGER DEFAULT 0,        -- 实际 AI 调用
  total_latency_ms INTEGER DEFAULT 0,     -- 总延迟（计算平均）
  total_tokens INTEGER DEFAULT 0,         -- 总 token 消耗
  started_at DATETIME,
  finished_at DATETIME,
  last_updated_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (source_batch_id) REFERENCES batches(source_batch_id)
);

-- ============================================================
-- 处理队列表：支持断点续传和优先级调度
-- ============================================================
CREATE TABLE IF NOT EXISTS processing_queue (
  aid TEXT PRIMARY KEY,
  source_batch_id TEXT NOT NULL,
  priority INTEGER DEFAULT 0,             -- 优先级（0=正常，-1=重试，1=优先）
  status TEXT DEFAULT 'pending',          -- 'pending' | 'processing' | 'done' | 'failed'
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  locked_at DATETIME,                     -- 处理锁（防止并发重复处理）
  locked_by TEXT,                         -- 锁持有者标识
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (aid) REFERENCES raw_assets(aid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_queue_status ON processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_priority ON processing_queue(priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_queue_batch ON processing_queue(source_batch_id);
```

### 3.2 内容哈希算法

```python
import hashlib

def compute_content_hash(title: str, tags: list[str], pptx_text: str) -> str:
    """
    计算内容哈希，用于 AI 缓存去重。
    
    策略：
    - title: 完整使用
    - tags: 排序后拼接（消除顺序差异）
    - pptx_text: 取前 500 字符（避免长文本影响）
    """
    normalized_title = title.strip().lower()
    normalized_tags = '|'.join(sorted(set(t.strip().lower() for t in tags if t.strip())))
    normalized_text = pptx_text[:500].strip().lower()
    
    content = f"{normalized_title}||{normalized_tags}||{normalized_text}"
    return hashlib.sha256(content.encode('utf-8')).hexdigest()[:32]
```

---

## 四、核心组件设计

### 4.1 BatchAIConfig 配置类

```python
@dataclass
class BatchAIConfig:
    # 并发控制
    max_concurrency: int = 5              # 最大并发数
    rate_limit_per_minute: int = 30       # 每分钟最大请求数
    
    # 重试策略
    max_retries: int = 3                  # 最大重试次数
    retry_delay_base: float = 2.0         # 重试基础延迟（秒）
    retry_backoff: float = 2.0            # 退避倍数
    
    # 断点续传
    resume_from_checkpoint: bool = True   # 自动跳过已成功的
    use_cache: bool = True                # 使用 AI 缓存
    
    # 质量控制
    validate_output: bool = True          # 校验 AI 输出
    min_description_length: int = 20      # 最小描述长度
    
    # 进度报告
    progress_interval: int = 100          # 每 N 条输出统计
    save_checkpoint_interval: int = 50    # 每 N 条保存检查点
    
    # 超时
    ai_timeout_seconds: int = 120         # AI 调用超时
    lock_timeout_seconds: int = 300       # 处理锁超时
```

### 4.2 并发调度器设计

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Scheduler 调度策略                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        Priority Queue                                │   │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│   │  │ P=1     │ │ P=0     │ │ P=0     │ │ P=-1    │ │ P=-1    │       │   │
│   │  │ 优先    │ │ 正常    │ │ 正常    │ │ 重试    │ │ 重试    │       │   │
│   │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘       │   │
│   │       │           │           │           │           │             │   │
│   └───────┴───────────┴───────────┴───────────┴───────────┴─────────────┘   │
│                                   │                                          │
│                                   ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      Semaphore (max=5)                               │   │
│   │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │   │
│   │  │Worker 1│ │Worker 2│ │Worker 3│ │Worker 4│ │Worker 5│            │   │
│   │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘            │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                          │
│                                   ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Rate Limiter (30/min)                             │   │
│   │  Token Bucket: ████████░░░░░░░░░░░░  (8/30 available)               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Worker 处理逻辑

```python
async def process_single(self, aid: str, context: ProcessContext) -> ProcessResult:
    """单个资产的 AI 处理流程"""
    
    # 1. 获取处理锁
    if not self._acquire_lock(aid):
        return ProcessResult(aid=aid, status='skipped', reason='locked')
    
    try:
        # 2. 加载资产数据
        asset = self._load_asset(aid)
        
        # 3. 规则引擎匹配
        rule_result = self._rule_engine.match(
            title=asset.title,
            tags=asset.original_tags
        )
        if rule_result:
            self._record_result(aid, 'rule_match', rule_result)
            return ProcessResult(aid=aid, status='success', source='rule')
        
        # 4. 计算内容哈希
        content_hash = compute_content_hash(
            title=asset.title,
            tags=asset.original_tags,
            pptx_text=asset.pptx_text
        )
        
        # 5. 查询缓存
        if self._config.use_cache:
            cached = self._cache.get(content_hash)
            if cached:
                self._record_result(aid, 'cache_hit', cached)
                self._cache.increment_hit(content_hash)
                return ProcessResult(aid=aid, status='success', source='cache')
        
        # 6. 调用 AI
        ai_result = await self._call_ai_with_retry(asset)
        
        # 7. 解析和校验
        parsed = self._parser.parse(ai_result)
        if self._config.validate_output:
            validation = self._validator.validate(parsed, asset)
            if not validation.valid:
                return ProcessResult(aid=aid, status='failed', errors=validation.errors)
        
        # 8. 写入缓存和数据库
        self._cache.put(content_hash, ai_result, parsed)
        self._record_result(aid, 'ai_call', parsed)
        
---

## 五、CLI 接口设计

### 5.1 命令行参数

```bash
python scripts/run_ai_batch.py \
  --manifest fixtures/full_batch_manifest.json \
  --db data/assets.db \
  --concurrency 5 \
  --rate-limit 30 \
  --resume \
  --use-cache \
  --validate \
  --progress \
  --report-interval 100 \
  --checkpoint-interval 50 \
  --dry-run
```

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--manifest` | 必需 | 批次清单文件 |
| `--db` | `data/assets.db` | 数据库路径 |
| `--concurrency` | 5 | 最大并发数 |
| `--rate-limit` | 30 | 每分钟最大 AI 调用数 |
| `--resume` | True | 断点续传（跳过已成功） |
| `--use-cache` | True | 使用 AI 缓存 |
| `--validate` | True | 校验 AI 输出质量 |
| `--progress` | True | 显示进度条 |
| `--report-interval` | 100 | 每 N 条输出统计 |
| `--checkpoint-interval` | 50 | 每 N 条保存检查点 |
| `--dry-run` | False | 仅模拟，不实际调用 AI |
| `--retry-failed` | False | 仅重试失败的 |
| `--priority-aids` | None | 优先处理的 aid 列表 |

### 5.2 输出示例

```
================================================================================
                    Piliang AI Batch Processor v1.0
================================================================================

[2024-12-13 21:50:00] 加载批次: smoke-b30000
[2024-12-13 21:50:01] 总资产数: 30,000
[2024-12-13 21:50:02] 已完成(跳过): 5,234
[2024-12-13 21:50:02] 待处理: 24,766

配置:
  - 并发数: 5
  - 限流: 30 req/min
  - 断点续传: ✓
  - AI 缓存: ✓
  - 输出校验: ✓

================================================================================

Processing: 100%|████████████████████████████| 24766/24766 [04:32:15<00:00]

--------------------------------------------------------------------------------
[进度报告 #100] 2024-12-13 21:55:00
--------------------------------------------------------------------------------
  已处理: 100 / 24,766 (0.4%)
  成功: 95 (95.0%)
  失败: 2 (2.0%)
  规则命中: 38 (38.0%)
  缓存命中: 12 (12.0%)
  AI 调用: 45 (45.0%)
  平均延迟: 8.2s
  预计剩余: 4h 28m
--------------------------------------------------------------------------------

================================================================================
                           处理完成报告
================================================================================

批次: smoke-b30000
开始时间: 2024-12-13 21:50:00
结束时间: 2024-12-14 02:22:15
总耗时: 4h 32m 15s

统计:
  ┌────────────────────┬──────────┬─────────┐
  │ 类型               │ 数量     │ 占比    │
  ├────────────────────┼──────────┼─────────┤
  │ 总数               │ 30,000   │ 100.0%  │
  │ 已跳过(断点续传)   │ 5,234    │ 17.4%   │
  │ 本次处理           │ 24,766   │ 82.6%   │
  │ ├─ 规则命中        │ 9,906    │ 40.0%   │
  │ ├─ 缓存命中        │ 3,715    │ 15.0%   │
  │ ├─ AI 调用成功     │ 10,892   │ 44.0%   │
  │ └─ 失败            │ 253      │ 1.0%    │
  └────────────────────┴──────────┴─────────┘

AI 调用统计:
  - 实际调用次数: 10,892
  - 总 Token 消耗: 2,178,400
  - 平均延迟: 8.5s
  - 缓存节省调用: 3,715 次 (25.4%)

失败分析:
  - timeout: 156 (61.7%)
  - rate_limited: 52 (20.6%)
  - parse_error: 28 (11.1%)
  - other: 17 (6.7%)

输出文件:
  - 报告: data/output/export/ai-batch-report-smoke-b30000.json
  - 失败列表: data/output/export/ai-batch-failed-smoke-b30000.json

================================================================================
```

---

## 六、质量控制

### 6.1 AI 输出校验规则

```python
@dataclass
class ValidationResult:
    valid: bool
    errors: list[str]
    warnings: list[str]

class AIOutputValidator:
    def validate(self, ai_meta: AiMeta, context: dict) -> ValidationResult:
        errors = []
        warnings = []
        
        # 1. 必填字段检查
        if not ai_meta.ppthub_category:
            errors.append('ppthub_category 为空')
        if not ai_meta.language:
            errors.append('language 为空')
        
        # 2. 分类有效性
        if ai_meta.ppthub_category not in VALID_CATEGORIES:
            errors.append(f'无效分类: {ai_meta.ppthub_category}')
        
        # 3. 语言有效性
        if ai_meta.language not in {'中文', 'English', '其他'}:
            errors.append(f'无效语言: {ai_meta.language}')
        
        # 4. 描述长度
        if len(ai_meta.ai_summary or '') < 20:
            warnings.append('描述过短，可能质量不佳')
        
        # 5. 关键词数量
        if len(ai_meta.ai_keywords or []) < 2:
            warnings.append('关键词过少')
        
        # 6. 分类与标题一致性（启发式）
        title = context.get('title', '')
        if not self._category_matches_title(ai_meta.ppthub_category, title):
            warnings.append('分类与标题可能不匹配')
        
        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
        )
```

### 6.2 异常处理策略

| 异常类型 | 处理策略 | 重试 |
|----------|----------|------|
| `TimeoutError` | 记录日志，加入重试队列 | ✓ (最多 3 次) |
| `RateLimitError` | 等待 60s 后重试 | ✓ (最多 5 次) |
| `ParseError` | 记录原始响应，标记失败 | ✗ |
| `ValidationError` | 使用默认值，记录警告 | ✗ |
| `NetworkError` | 指数退避重试 | ✓ (最多 3 次) |

---

## 七、监控与报告

### 7.1 实时监控指标

```python
@dataclass
class BatchMetrics:
    # 进度
    total: int
    processed: int
    remaining: int
    progress_percent: float
    
    # 状态分布
    success: int
    failed: int
    skipped: int
    
    # 处理类型分布
    rule_matched: int
    cache_hit: int
    ai_called: int
    
    # 性能
    avg_latency_ms: float
    total_tokens: int
    estimated_remaining_time: timedelta
    
    # 错误分布
    error_counts: dict[str, int]  # {'timeout': 10, 'rate_limited': 5, ...}
```

### 7.2 报告文件结构

```json
{
  "meta": {
    "batch_id": "smoke-b30000",
    "started_at": "2024-12-13T21:50:00Z",
    "finished_at": "2024-12-14T02:22:15Z",
    "duration_seconds": 16335,
    "config": {
      "concurrency": 5,
      "rate_limit": 30,
      "resume": true,
      "use_cache": true
    }
  },
  "summary": {
    "total": 30000,
    "skipped": 5234,
    "processed": 24766,
    "success": 24513,
    "failed": 253,
    "rule_matched": 9906,
    "cache_hit": 3715,
    "ai_called": 10892
  },
  "performance": {
    "avg_latency_ms": 8500,
    "total_tokens": 2178400,
    "cache_savings_percent": 25.4
  },
  "errors": {
    "timeout": 156,
    "rate_limited": 52,
    "parse_error": 28,
    "other": 17
  },
  "failed_aids": ["aid_001", "aid_002"],
  "category_distribution": {
    "business": 8234,
    "education": 5621,
    "technology": 4532
  }
}
```

---

## 八、实施计划

### 8.1 任务分解

| 阶段 | 任务 | 预估时间 | 优先级 |
|------|------|----------|--------|
| 1 | 数据库 schema 扩展（ai_cache, batch_stats, ai_call_log, processing_queue） | 30 min | P0 |
| 2 | 内容哈希 + 缓存 DAO 实现 | 30 min | P0 |
| 3 | BatchAIOrchestrator 核心类 | 60 min | P0 |
| 4 | 并发调度器 + 限流器 | 45 min | P0 |
| 5 | AIOutputValidator 质量校验 | 30 min | P1 |
| 6 | 进度报告 + tqdm 集成 | 30 min | P1 |
| 7 | CLI 脚本 run_ai_batch.py | 30 min | P0 |
| 8 | 单元测试 | 45 min | P1 |
| 9 | 集成测试（100 条样本） | 30 min | P1 |
| 10 | 文档更新 | 20 min | P2 |

**总计: ~6 小时**

### 8.2 依赖关系

```
┌─────────────────────────────────────────────────────────────────┐
│                        实施依赖图                                │
└─────────────────────────────────────────────────────────────────┘

  [1] Schema 扩展
        │
        ▼
  [2] 缓存 DAO ──────────────┐
        │                    │
        ▼                    ▼
  [3] Orchestrator ◀──── [4] 调度器
        │
        ├──────────────┬──────────────┐
        ▼              ▼              ▼
  [5] Validator   [6] Reporter   [7] CLI
        │              │              │
        └──────────────┴──────────────┘
                       │
                       ▼
                 [8] 单元测试
                       │
                       ▼
                 [9] 集成测试
                       │
                       ▼
                 [10] 文档
```

### 8.3 里程碑

| 里程碑 | 完成标准 | 目标日期 |
|--------|----------|----------|
| M1: 基础能力 | Schema + DAO + Orchestrator 可运行 | +2h |
| M2: 完整功能 | 并发 + 缓存 + 校验 + CLI | +4h |
| M3: 生产就绪 | 测试通过 + 文档完善 | +6h |

---

## 附录

### A. 环境变量配置

```bash
# .env 新增配置
AI_BATCH_CONCURRENCY=5
AI_BATCH_RATE_LIMIT=30
AI_BATCH_USE_CACHE=true
AI_BATCH_VALIDATE=true
AI_BATCH_CHECKPOINT_INTERVAL=50
```

### B. 相关文档

- [AI提示词与内容提取原理](ai提示词与内容提取原理.md)
- [PPT批量处理建设方案_V4](PPT批量处理建设方案_V4.md)
- [PPTHub数据库初始化数据约束](PPTHub数据库初始化数据约束.md)
