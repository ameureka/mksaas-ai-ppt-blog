-- ===========================================
-- Phase 2: Index Optimization
-- Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 9.1
-- ===========================================

-- Step 1: 删除重复索引（保留 Drizzle 定义的）
-- ppt 表有 Drizzle 定义的 ppt_category_idx, ppt_language_idx, ppt_created_at_idx
-- 这些手动创建的索引与 Drizzle 索引重复
DROP INDEX IF EXISTS idx_ppt_category;
DROP INDEX IF EXISTS idx_ppt_language;
DROP INDEX IF EXISTS idx_ppt_created_at;

-- Step 2: 删除 import_batch 表的冗余索引
DROP INDEX IF EXISTS idx_import_batch_status;

-- Step 3: 删除 user 表的冗余索引（主键已是索引）
DROP INDEX IF EXISTS user_id_idx;

-- Step 4: 删除测试表
-- Requirements: 9.1
DROP TABLE IF EXISTS playing_with_neon;

-- Step 5: 添加缺失索引 - slide 表
-- Requirements: 4.1, 4.2
CREATE INDEX IF NOT EXISTS idx_slide_ppt_id ON slide(ppt_id);
CREATE INDEX IF NOT EXISTS idx_slide_ppt_number ON slide(ppt_id, slide_number);

-- Step 6: 添加复合索引 - ppt 表
-- Requirements: 4.3
-- 用于 status + created_at 排序查询
CREATE INDEX IF NOT EXISTS ppt_status_created_idx ON ppt(status, created_at DESC);

-- Step 7: 添加复合索引 - user_download_history 表
-- Requirements: 4.4
-- 用于按下载方式和日期查询
CREATE INDEX IF NOT EXISTS download_method_date_idx ON user_download_history(download_method, downloaded_at);

-- ===========================================
-- 验证索引
-- ===========================================
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
