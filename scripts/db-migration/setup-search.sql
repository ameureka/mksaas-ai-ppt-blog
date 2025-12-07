-- PPT 搜索系统数据库设置脚本
-- 请在 Neon 控制台执行以下 SQL

-- 1. 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 添加向量字段到 ppt 表
ALTER TABLE ppt 
ADD COLUMN IF NOT EXISTS embedding vector(1024);

ALTER TABLE ppt 
ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(100);

-- 3. 创建向量索引（使用 HNSW 算法，适合余弦相似度）
CREATE INDEX IF NOT EXISTS ppt_embedding_idx 
ON ppt 
USING hnsw (embedding vector_cosine_ops);

-- 4. 创建搜索日志表
CREATE TABLE IF NOT EXISTS search_log (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL,
  result_count INTEGER DEFAULT 0,
  clicked_id VARCHAR(255),
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 创建搜索日志索引
CREATE INDEX IF NOT EXISTS idx_search_log_keyword 
ON search_log(keyword);

CREATE INDEX IF NOT EXISTS idx_search_log_created_at 
ON search_log(created_at DESC);

-- 6. 创建热门关键词视图（可选）
CREATE OR REPLACE VIEW hot_keywords AS
SELECT 
  keyword,
  COUNT(*) as search_count,
  AVG(result_count) as avg_results,
  MAX(created_at) as last_searched
FROM search_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY keyword
ORDER BY search_count DESC
LIMIT 20;

-- 7. 验证设置
SELECT 
  'pgvector' as component,
  extname as name,
  extversion as version,
  'installed' as status
FROM pg_extension 
WHERE extname = 'vector'

UNION ALL

SELECT 
  'embedding_field' as component,
  column_name as name,
  data_type as version,
  'exists' as status
FROM information_schema.columns 
WHERE table_name = 'ppt' 
AND column_name = 'embedding'

UNION ALL

SELECT 
  'search_log_table' as component,
  table_name as name,
  '' as version,
  'exists' as status
FROM information_schema.tables 
WHERE table_name = 'search_log'

UNION ALL

SELECT 
  'ppt_data' as component,
  'total_count' as name,
  COUNT(*)::TEXT as version,
  'rows' as status
FROM ppt

UNION ALL

SELECT 
  'ppt_with_embedding' as component,
  'embedded_count' as name,
  COUNT(embedding)::TEXT as version,
  'rows' as status
FROM ppt;
