-- 创建热门关键词缓存表
CREATE TABLE IF NOT EXISTS hot_keywords (
  id TEXT PRIMARY KEY,
  keyword TEXT NOT NULL,
  search_count INTEGER DEFAULT 0,
  download_score NUMERIC DEFAULT 0,
  final_score NUMERIC DEFAULT 0,
  rank INTEGER NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS hot_keywords_rank_idx ON hot_keywords(rank);

-- 确认创建成功
SELECT 'hot_keywords 表创建成功' as message;
