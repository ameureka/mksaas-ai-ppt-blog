# Embedding 配置更新记录

## 更新时间
2024-12-07

## 更新内容

### 1. 模型选择
- **旧模型**: BAAI/bge-large-zh-v1.5 (仅支持中文，512 tokens)
- **新模型**: BAAI/bge-m3 (多语言，8192 tokens)

### 2. 文件修改

#### src/lib/embedding.ts
- 第8行：`const EMBEDDING_MODEL = 'BAAI/bge-m3';`
- 状态：✅ 已确认

#### scripts/generate-embeddings.ts
- 第37行：`embedding_model = 'BAAI/bge-m3',`
- 状态：✅ 已更新

### 3. 环境变量
- SILICONFLOW_API_KEY：已配置
- API URL：https://api.siliconflow.cn/v1/embeddings

## 模型优势
1. **多语言支持**：支持100+种语言
2. **更长输入**：8192 tokens vs 512 tokens
3. **更好效果**：MTEB榜单验证
4. **完全免费**：无使用成本
