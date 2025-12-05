-- ==========================================
-- Neon SQL Editor 优化版本
-- 请在Neon控制台逐步执行以下SQL
-- ==========================================

-- 第1步: 创建 ad_watch_record 表
CREATE TABLE IF NOT EXISTS ad_watch_record (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
  ip_address TEXT,
  ppt_id TEXT,
  watch_token TEXT NOT NULL UNIQUE,
  download_token TEXT,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'pending',
  credits_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 第2步: 创建 ad_watch_record 索引
CREATE INDEX IF NOT EXISTS ad_watch_user_id_idx ON ad_watch_record(user_id);
CREATE INDEX IF NOT EXISTS ad_watch_ip_idx ON ad_watch_record(ip_address);
CREATE INDEX IF NOT EXISTS ad_watch_token_idx ON ad_watch_record(watch_token);
CREATE INDEX IF NOT EXISTS ad_watch_created_idx ON ad_watch_record(created_at);
CREATE INDEX IF NOT EXISTS ad_watch_status_idx ON ad_watch_record(status);

-- 第3步: 创建 user_download_history 表
CREATE TABLE IF NOT EXISTS user_download_history (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
  ppt_id TEXT NOT NULL,
  download_method TEXT NOT NULL,
  credits_spent INTEGER DEFAULT 0,
  ip_address TEXT,
  downloaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 第4步: 创建 user_download_history 索引
CREATE INDEX IF NOT EXISTS download_user_ppt_idx ON user_download_history(user_id, ppt_id);
CREATE INDEX IF NOT EXISTS download_user_idx ON user_download_history(user_id);
CREATE INDEX IF NOT EXISTS download_ppt_idx ON user_download_history(ppt_id);
CREATE INDEX IF NOT EXISTS download_method_idx ON user_download_history(download_method);

-- 第5步: 验证表已创建
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('ad_watch_record', 'user_download_history')
ORDER BY table_name;

