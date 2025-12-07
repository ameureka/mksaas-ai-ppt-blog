-- 创建搜索日志表
CREATE TABLE IF NOT EXISTS search_log (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL,
  result_count INTEGER DEFAULT 0,
  clicked_id VARCHAR(255),
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_search_log_keyword 
ON search_log(keyword);

CREATE INDEX IF NOT EXISTS idx_search_log_created_at 
ON search_log(created_at DESC);

-- 验证创建成功
SELECT 
  table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'search_log'
GROUP BY table_name;
