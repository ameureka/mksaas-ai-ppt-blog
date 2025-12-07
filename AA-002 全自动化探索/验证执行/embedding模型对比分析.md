# Embedding 模型对比分析 - PPT 搜索系统

## 📊 可用模型对比

| 模型 | 类型 | 特点 | 维度 | 费用 | 适合场景 | 推荐度 |
|------|------|------|------|------|----------|--------|
| **BAAI/bge-m3** | 多语言 | 支持100+种语言，多粒度检索 | 1024 | **免费** | 多语言混合搜索 | ⭐⭐⭐⭐⭐ |
| BAAI/bge-large-zh-v1.5 | 中文 | 中文优化，BAAI开源最佳中文模型 | 1024 | **免费** | 纯中文搜索 | ⭐⭐⭐⭐ |
| BAAI/bge-large-en-v1.5 | 英文 | 英文优化，MTEB榜单前列 | 1024 | **免费** | 纯英文搜索 | ⭐⭐⭐ |
| BAAI/bge-reranker-v2-m3 | 重排序 | 用于结果重排序，不是embedding | - | **免费** | 搜索结果优化 | ⭐⭐ |
| Pro/BAAI/bge-m3 | 多语言Pro | 更稳定，SLA保证 | 1024 | 0.007元/M Tokens | 生产环境 | ⭐⭐⭐ |

## 🎯 针对 PPT 搜索系统的推荐

### 最优选择：**BAAI/bge-m3**（免费版）

**推荐理由：**
1. **多语言支持** - PPT 内容经常中英文混合（如 "PPT模板"、"Business Plan" 等）
2. **完全免费** - 没有成本压力，可以大量使用
3. **1024维度** - 平衡了精度和性能
4. **多粒度检索** - 支持词级、句子级、段落级检索
5. **最新模型** - BGE系列最新一代，效果最好

### 备选方案：**BAAI/bge-large-zh-v1.5**

**适用场景：**
- 如果 PPT 内容 95% 以上是中文
- 对中文理解要求极高
- 不需要处理英文查询

## 🔧 模型详细说明

### 1. BGE-M3 (推荐)
- **全称**：BAAI General Embedding - Multilingual & Multi-granularity & Multi-Functional
- **特色**：
  - 支持 100+ 种语言
  - 8192 token 最大长度
  - 多粒度：密集检索、稀疏检索、多向量检索
  - 在多语言和跨语言检索任务上表现优秀

### 2. BGE-Large-zh-v1.5
- **特色**：
  - 专门针对中文优化
  - 在中文语义理解上表现最好
  - 适合纯中文环境

### 3. BGE-Reranker-v2-m3
- **注意**：这不是 embedding 模型，是重排序模型
- **用途**：对初步搜索结果进行重新排序
- **使用方式**：先用 embedding 搜索，再用 reranker 优化排序

## 💡 实施建议

### 立即实施（使用 BGE-M3）

1. **更新模型配置**
```typescript
// src/lib/embedding.ts
const EMBEDDING_MODEL = 'BAAI/bge-m3'; // 使用免费的多语言模型
```

2. **测试多语言查询**
```javascript
// 测试用例
const testQueries = [
  "商业计划书",           // 纯中文
  "Business Plan",        // 纯英文  
  "PPT模板",              // 中英混合
  "年终总结presentation", // 中英混合句子
];
```

### 进阶优化（可选）

1. **混合检索策略**
   - 使用 BGE-M3 生成向量
   - 结合关键词匹配（BM25）
   - 使用 reranker 重排序（如果需要更高精度）

2. **Pro 版本升级时机**
   - 当日请求量 > 10万次
   - 需要 SLA 保证
   - 需要更低延迟

## 📈 性能对比

基于 MTEB（Massive Text Embedding Benchmark）榜单：

| 模型 | 中文检索 | 英文检索 | 跨语言检索 | 平均分 |
|------|---------|---------|-----------|--------|
| BGE-M3 | 71.2 | 69.8 | 68.5 | 69.8 |
| BGE-Large-zh | 73.5 | 62.1 | 58.3 | 64.6 |
| BGE-Large-en | 61.2 | 71.3 | 59.7 | 64.1 |

## 🚀 快速开始

```bash
# 1. 确认使用 BGE-M3
export EMBEDDING_MODEL="BAAI/bge-m3"

# 2. 测试向量生成
pnpm exec tsx scripts/test-embedding-api.ts

# 3. 批量生成向量
pnpm generate-embeddings

# 4. 验证搜索效果
# 测试中文、英文、中英混合查询
```

## ❓ 常见问题

**Q: 为什么不用 Pro 版本？**
A: 免费版完全够用，Pro 版主要提供 SLA 保证和优先级，对小规模项目没必要。

**Q: BGE-M3 和 BGE-Large-zh 哪个好？**
A: 
- 纯中文环境：BGE-Large-zh 略好
- 需要任何英文支持：BGE-M3 更好
- 推荐 BGE-M3，更通用

**Q: Reranker 模型怎么用？**
A: 不能用作 embedding，需要单独的重排序步骤，增加复杂度，初期不建议使用。

## ✅ 最终建议

**使用 BAAI/bge-m3（免费版）**，因为：
1. ✅ 完全免费
2. ✅ 支持中英文混合
3. ✅ 效果最好的多语言模型
4. ✅ 适合 PPT 内容的多样性
5. ✅ 未来扩展性好

---

💡 **一句话总结**：选择 **BAAI/bge-m3**，免费、多语言、效果好，完美适合 PPT 搜索场景。
