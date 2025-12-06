# pgvector 配置决策

> **文档状态**: ✅ 已确认
> **确认日期**: 2025-12-07

---

## 最终配置

| 配置项 | 决策 | 说明 |
|--------|------|------|
| **Embedding 提供商** | 硅基流动 (SiliconFlow) | 中文效果最好，价格便宜，国内服务器 |
| **Embedding 模型** | BAAI/bge-large-zh-v1.5 | 中文 Embedding 标杆模型 |
| **向量维度** | 1024 | 模型固定输出 |
| **索引类型** | HNSW | 查询速度快，精度高 |
| **向量生成内容** | title + description + tags | 完整语义信息 |
| **搜索策略** | 向量 + SQL 混合 (降级方案) | 向量优先，SQL 兜底 |

---

## 一、Embedding 配置

### 1.1 提供商选择

**选择**: 硅基流动 (SiliconFlow)

**选择理由**:
- ✅ 中文效果最好 - BGE 系列是中文 Embedding 标杆
- ✅ 价格极便宜 - 比 OpenAI 便宜 10-100 倍
- ✅ 国内服务器 - 无需翻墙，延迟低
- ✅ 注册送 2000万 Token - 足够生成 10万+ 条 Embedding
- ✅ API 兼容 OpenAI 格式 - 代码改动小

### 1.2 模型选择

**选择**: `BAAI/bge-large-zh-v1.5`

**模型参数**:
- 维度: 1024
- 最大 Token: 512
- 语言: 中文优化
- 来源: 北京智源人工智能研究院 (BAAI)

**备选模型**:
- `BAAI/bge-m3` - 多语言，支持长文本 (8192 token)
- `Qwen/Qwen3-Embedding-4B` - 阿里最新，可变维度

### 1.3 API 配置

```bash
# .env.local
SILICONFLOW_API_KEY=sk-xxx  # 硅基流动 API Key
```

```typescript
// API 调用示例
const response = await fetch('https://api.siliconflow.cn/v1/embeddings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.SILICONFLOW_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'BAAI/bge-large-zh-v1.5',
    input: text,
    encoding_format: 'float',
  }),
});
```

---

## 二、数据库配置

### 2.1 向量维度

**选择**: 1024 维

**存储估算** (10,000 条数据):
- 每条: 1024 × 4 bytes = 4KB
- 总计: 4KB × 10,000 = 40MB

### 2.2 索引类型

**选择**: HNSW

**HNSW vs IVFFlat 对比**:

| 特性 | HNSW ✅ | IVFFlat |
|------|---------|---------|
| 查询速度 | 更快 | 较慢 |
| 构建速度 | 较慢 | 更快 |
| 内存占用 | 较高 | 较低 |
| 精度 | 更高 | 较低 |
| 适合场景 | 读多写少 ✅ | 写多读少 |

**选择理由**: PPT 搜索是读多写少场景，HNSW 更合适

### 2.3 Schema 变更

```sql
-- 1. 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 添加向量字段
ALTER TABLE ppt ADD COLUMN embedding vector(1024);

-- 3. 创建 HNSW 索引
CREATE INDEX ppt_embedding_idx ON ppt
USING hnsw (embedding vector_cosine_ops);
```

```typescript
// src/db/schema.ts 更新
import { vector } from 'drizzle-orm/pg-core';

export const ppt = pgTable("ppt", {
  // ... 现有字段

  // 新增向量字段
  embedding: vector("embedding", { dimensions: 1024 }),
});
```

---

## 三、向量生成内容

### 3.1 输入文本组成

**选择**: title + description + tags

```typescript
// 向量生成输入
const generateEmbeddingInput = (ppt: PPT): string => {
  const parts = [
    ppt.title,
    ppt.description || '',
    (ppt.tags || []).join(' '),
  ];
  return parts.filter(Boolean).join(' ');
};

// 示例
// 输入: "年终总结PPT模板 适用于企业年度工作汇报，展示业绩成果 商务 总结 汇报"
// 输出: [0.012, -0.034, 0.056, ... 共1024维]
```

### 3.2 为什么包含这三个字段

| 字段 | 作用 | 示例 |
|------|------|------|
| title | 核心主题 | "年终总结PPT模板" |
| description | 详细描述，丰富语义 | "适用于企业年度工作汇报" |
| tags | 关键词，补充分类 | "商务 总结 汇报" |

---

## 四、搜索策略

### 4.1 混合搜索方案

**选择**: 向量 + SQL 混合 (降级方案)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        混合搜索流程                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  用户输入 "新能源路演"                                                        │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │ 步骤1: 向量搜索 (主要)                                           │       │
│  │ - 生成查询向量                                                   │       │
│  │ - pgvector 相似度搜索                                            │       │
│  │ - 返回 Top 20 结果                                               │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │ 步骤2: SQL 补充 (降级/补充)                                       │       │
│  │ - 如果向量结果 < 5 条                                            │       │
│  │ - 执行 ILIKE 模糊匹配                                            │       │
│  │ - 合并去重                                                       │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│         │                                                                   │
│         ▼                                                                   │
│  返回最终结果 (向量相似度排序)                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 降级场景

| 场景 | 处理方式 |
|------|----------|
| Embedding API 失败 | 降级到 SQL ILIKE |
| 向量结果太少 (< 5条) | SQL 补充结果 |
| 新 PPT 未生成向量 | SQL 兜底 |

### 4.3 搜索 SQL 示例

```sql
-- 向量搜索
SELECT id, title, description,
       1 - (embedding <=> $query_vector) as similarity
FROM ppt
WHERE deleted_at IS NULL
  AND embedding IS NOT NULL
ORDER BY embedding <=> $query_vector
LIMIT 20;

-- SQL 降级搜索
SELECT id, title, description
FROM ppt
WHERE deleted_at IS NULL
  AND (
    title ILIKE '%新能源%'
    OR description ILIKE '%新能源%'
    OR array_to_string(tags, ',') ILIKE '%新能源%'
  )
LIMIT 20;
```

---

## 五、环境变量

```bash
# .env.local 新增
SILICONFLOW_API_KEY=sk-xxx           # 硅基流动 API Key
SILICONFLOW_EMBEDDING_MODEL=BAAI/bge-large-zh-v1.5  # Embedding 模型
```

---

## 六、实施清单

- [ ] 注册硅基流动账号，获取 API Key
- [ ] 添加环境变量 `SILICONFLOW_API_KEY`
- [ ] 执行数据库迁移 (启用 pgvector, 添加字段, 创建索引)
- [ ] 实现 Embedding 生成服务
- [ ] 为现有 68 条 PPT 生成向量
- [ ] 实现混合搜索 API
- [ ] 前端集成新搜索 API



> 已保存。现在继续讨论第一个待定事项：

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


## 待定事项 #1：实施优先级 - 直接上向量

### 需要详细设计的内容

你已决策: 直接上向量 (pgvector)，不先优化 SQL

需要确认的细节:

1. pgvector 配置
   - 向量维度: 1536 (OpenAI text-embedding-3-small) 还是其他？
   - 索引类型: HNSW (推荐) 还是 IVFFlat？

2. Embedding 模型选择
   - OpenAI text-embedding-3-small (便宜，1536维)
   - OpenAI text-embedding-3-large (更准，3072维)
   - 其他模型？

3. 向量生成内容
   - 仅 title？
   - title + description？
   - title + description + tags？

4. 搜索策略
   - 纯向量搜索？
   - 向量 + SQL 混合 (降级方案)？

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


你想逐一确认这些细节吗？
 ▸ Credits: 2.19 • Time: 1m 13s

> 1. pgvector 配置
   - 向量维度: 1536 (OpenAI text-embedding-3-small) 还是其他？
   - 索引类型: HNSW (推荐) 还是 IVFFlat？
---我们讨论下，在原始我们的设计之中的我们的好像么有使用的 openai 因为我没有 openai 的好像 api，我们是的如何设计的？我们必须使用 open ai 吗？向量的维度如何的设定的，索引的类型有什么区别，尤其是对中文来说的

> 好问题！让我详细分析 Embedding 模型选择和索引类型。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


## 1. Embedding 模型选择 - 不必须用 OpenAI

### 你项目已有的 AI SDK

json
// package.json 中已安装
"@ai-sdk/openai": "^2.0.0",      // OpenAI
"@ai-sdk/google": "^2.0.0",      // Google (Gemini)
"@ai-sdk/deepseek": "^1.0.0",    // DeepSeek
"@ai-sdk/fireworks": "^1.0.0",   // Fireworks
"@openrouter/ai-sdk-provider"    // OpenRouter (聚合多模型)


### 可选 Embedding 模型对比

| 模型 | 维度 | 中文支持 | 成本 | 你是否有 API |
|------|------|----------|------|-------------|
| OpenAI text-embedding-3-small | 1536 | ✅ 好 | $0.02/1M tokens | ❓ 待确认 |
| OpenAI text-embedding-3-large | 3072 | ✅ 好 | $0.13/1M tokens | ❓ 待确认 |
| Google text-embedding-004 | 768 | ✅ 好 | 免费额度大 | ✅ 有 |
| DeepSeek Embedding | 1024 | ✅✅ 极好 | 便宜 | ✅ 有 |
| Fireworks nomic-embed | 768 | ✅ 好 | 便宜 | ✅ 有 |
| OpenRouter | 多种 | 取决于模型 | 按模型计费 | ✅ 有 |

### 推荐方案

┌─────────────────────────────────────────────────────────────────────────────┐
│                        Embedding 模型推荐                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  首选: Google text-embedding-004                                            │
│  ├── 维度: 768                                                              │
│  ├── 中文: ✅ 支持良好                                                       │
│  ├── 成本: 免费额度大 (1500次/分钟)                                          │
│  └── 你已有: GOOGLE_GENERATIVE_AI_API_KEY ✅                                │
│                                                                             │
│  备选: DeepSeek Embedding                                                   │
│  ├── 维度: 1024                                                             │
│  ├── 中文: ✅✅ 中文优化，效果最好                                            │
│  ├── 成本: 极便宜                                                            │
│  └── 你已有: DEEPSEEK_API_KEY ✅                                            │
│                                                                             │
│  不推荐: OpenAI (如果没有 API Key)                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


## 2. 向量维度如何设定

### 维度由模型决定，不是自己设定

模型输出什么维度，数据库就存什么维度

Google text-embedding-004  → 768维  → embedding vector(768)
DeepSeek Embedding        → 1024维 → embedding vector(1024)
OpenAI text-embedding-3-small → 1536维 → embedding vector(1536)


### 维度对比

| 维度 | 存储空间 | 搜索速度 | 精度 |
|------|----------|----------|------|
| 768 | 3KB/条 | 最快 | 够用 |
| 1024 | 4KB/条 | 快 | 好 |
| 1536 | 6KB/条 | 中等 | 很好 |
| 3072 | 12KB/条 | 较慢 | 最好 |

10,000 条数据存储估算:
- 768维: 30MB
- 1024维: 40MB
- 1536维: 60MB

结论: 768 或 1024 维对你的场景完全够用

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


## 3. 索引类型对比

### HNSW vs IVFFlat

| 特性 | HNSW (推荐) | IVFFlat |
|------|-------------|---------|
| 查询速度 | ✅ 更快 | 较慢 |
| 构建速度 | 较慢 | ✅ 更快 |
| 内存占用 | 较高 | ✅ 较低 |
| 精度 | ✅ 更高 | 较低 |
| 适合场景 | 读多写少 | 写多读少 |
| 中文影响 | 无 | 无 |

### 索引类型与中文无关

索引只处理向量数字，不关心原始语言

中文 "年终总结" → Embedding 模型 → [0.12, -0.34, ...] → 索引存储
英文 "Annual Report" → Embedding 模型 → [0.15, -0.28, ...] → 索引存储

索引只看向量数字，不看文字


中文效果取决于 Embedding 模型，不是索引类型

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


## 4. 推荐配置

### 方案 A: Google (推荐 - 免费额度大)

sql
-- 768 维向量
ALTER TABLE ppt ADD COLUMN embedding vector(768);
CREATE INDEX ppt_embedding_idx ON ppt USING hnsw (embedding vector_cosine_ops);


### 方案 B: DeepSeek (中文最优)

sql
-- 1024 维向量
ALTER TABLE ppt ADD COLUMN embedding vector(1024);
CREATE INDEX ppt_embedding_idx ON ppt USING hnsw (embedding vector_cosine_ops);


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


## 需要你确认

1. 你有哪些 API Key？
   - [ ] OpenAI
   - [x] Google (GOOGLE_GENERATIVE_AI_API_KEY)
   - [x] DeepSeek (DEEPSEEK_API_KEY)
   - [x] Fireworks
   - [x] OpenRouter

2. 选择哪个 Embedding 模型？
   - A) Google text-embedding-004 (768维，免费额度大)
   - B) DeepSeek Embedding (1024维，中文最优)
   - C) 其他

3. 索引类型？
   - A) HNSW (推荐，查询快)
   - B) IVFFlat
 ▸ Credits: 1.48 • Time: 43s

> 中文还有哪些模型是可以使用的Embedding比较好的，硅基流动？

> 好问题！让我调研一下中文 Embedding 模型，包括硅基流动。
Searching the web for: 硅基流动 SiliconFlow embedding 模型 中文 API 2024 (using tool: web_search)

Allow this action? Use 't' to trust (always allow) this tool for the session. [y/n/t]:

> t


 ✓ Found 10 search results
 - Completed in 1.783s

Fetching content from: https://docs.siliconflow.cn/cn/api-reference/embeddings/create-embeddings (searching for: embedding model 模型 维度 dimension BGE) [mode: selective] (using tool: web_fetch)

Allow this action? Use 't' to trust (always allow) this tool for the session. [y/n/t]:

> t


 ✓ Fetched 7815 bytes (selective) from URL
 - Completed in 0.654s

> 找到了！硅基流动提供了很好的中文 Embedding 模型。让我整理一下：

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


## 中文 Embedding 模型完整对比

### 硅基流动 (SiliconFlow) 提供的模型

| 模型 | 维度 | 最大 Token | 中文优化 | 特点 |
|------|------|-----------|----------|------|
| BAAI/bge-large-zh-v1.5 | 1024 | 512 | ✅✅ 专为中文 | 中文首选 |
| BAAI/bge-large-en-v1.5 | 1024 | 512 | ❌ 英文 | 英文场景 |
| BAAI/bge-m3 | 1024 | 8192 | ✅✅ 多语言 | 长文本+多语言 |
| netease-youdao/bce-embedding-base_v1 | 768 | 512 | ✅✅ 中文优化 | 网易有道出品 |
| Qwen/Qwen3-Embedding-8B | 可变 (64-4096) | 32768 | ✅✅ 中文优化 | 最新最强 |
| Qwen/Qwen3-Embedding-4B | 可变 (64-2560) | 32768 | ✅✅ 中文优化 | 性价比高 |
| Qwen/Qwen3-Embedding-0.6B | 可变 (64-1024) | 32768 | ✅ 中文 | 轻量快速 |

### 全部中文 Embedding 模型对比

| 提供商 | 模型 | 维度 | 中文效果 | 成本 | 推荐度 |
|--------|------|------|----------|------|--------|
| 硅基流动 | BAAI/bge-large-zh-v1.5 | 1024 | ⭐⭐⭐⭐⭐ | 极便宜 | ⭐⭐⭐⭐⭐ |
| 硅基流动 | BAAI/bge-m3 | 1024 | ⭐⭐⭐⭐⭐ | 便宜 | ⭐⭐⭐⭐⭐ |
| 硅基流动 | Qwen3-Embedding-4B | 1024 | ⭐⭐⭐⭐⭐ | 便宜 | ⭐⭐⭐⭐ |
| 硅基流动 | 网易有道 BCE | 768 | ⭐⭐⭐⭐ | 极便宜 | ⭐⭐⭐⭐ |
| DeepSeek | DeepSeek Embedding | 1024 | ⭐⭐⭐⭐ | 便宜 | ⭐⭐⭐⭐ |
| Google | text-embedding-004 | 768 | ⭐⭐⭐ | 免费额度 | ⭐⭐⭐ |
| OpenAI | text-embedding-3-small | 1536 | ⭐⭐⭐ | 较贵 | ⭐⭐ |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


## 推荐方案：硅基流动

### 为什么选硅基流动？

┌─────────────────────────────────────────────────────────────────────────────┐
│                     硅基流动优势                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✅ 中文效果最好 - BGE 系列是中文 Embedding 标杆                              │
│  ✅ 价格极便宜 - 比 OpenAI 便宜 10-100 倍                                    │
│  ✅ 国内服务器 - 无需翻墙，延迟低                                             │
│  ✅ 注册送 2000万 Token - 足够生成 10万+ 条 Embedding                        │
│  ✅ API 兼容 OpenAI 格式 - 代码改动小                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


### 推荐配置

| 配置项 | 推荐值 | 原因 |
|--------|--------|------|
| 模型 | BAAI/bge-large-zh-v1.5 | 中文效果最好，专为中文优化 |
| 维度 | 1024 | 模型固定输出 |
| 索引 | HNSW | 查询快，精度高 |

### 代码示例

typescript
// 硅基流动 API 调用 (兼容 OpenAI 格式)
const response = await fetch('https://api.siliconflow.cn/v1/embeddings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.SILICONFLOW_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'BAAI/bge-large-zh-v1.5',
    input: '年终总结PPT模板，适用于企业年度工作汇报',
  }),
});

const { data } = await response.json();
const embedding = data[0].embedding; // 1024维向量


### 数据库配置

sql
-- 1024 维向量 (BGE 模型输出)
ALTER TABLE ppt ADD COLUMN embedding vector(1024);
CREATE INDEX ppt_embedding_idx ON ppt USING hnsw (embedding vector_cosine_ops);
