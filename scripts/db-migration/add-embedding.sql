-- pgvector 向量搜索迁移
-- 执行前请确保 pgvector 扩展已启用

-- 1. 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 添加向量字段
ALTER TABLE ppt ADD COLUMN IF NOT EXISTS embedding vector(1024);

-- 3. 创建 HNSW 索引 (余弦相似度)
CREATE INDEX IF NOT EXISTS ppt_embedding_idx 
ON ppt USING hnsw (embedding vector_cosine_ops);
