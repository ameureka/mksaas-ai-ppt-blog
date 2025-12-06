-- ===========================================
-- Phase 3: Constraint Enhancement
-- Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 7.1, 7.2
-- ===========================================

-- 注意：在执行此脚本前，请确保已运行 phase1-cleanup.ts 清洗数据

-- Step 1: 添加外键约束 - ad_watch_record.ppt_id (SET NULL)
-- Requirements: 1.1, 1.3
ALTER TABLE ad_watch_record
ADD CONSTRAINT ad_watch_record_ppt_id_fkey
FOREIGN KEY (ppt_id) REFERENCES ppt(id) ON DELETE SET NULL;

-- Step 2: 添加外键约束 - user_download_history.ppt_id (CASCADE)
-- Requirements: 1.2, 1.4
ALTER TABLE user_download_history
ADD CONSTRAINT user_download_history_ppt_id_fkey
FOREIGN KEY (ppt_id) REFERENCES ppt(id) ON DELETE CASCADE;

-- Step 3: 添加唯一约束 - user_credit.user_id
-- Requirements: 2.1, 2.2
ALTER TABLE user_credit
ADD CONSTRAINT user_credit_user_id_unique UNIQUE (user_id);

-- Step 4: 验证 NOT NULL 约束 - ppt.title (schema 已定义)
-- Requirements: 7.1
-- 如果数据库中 title 允许 NULL，执行：
-- ALTER TABLE ppt ALTER COLUMN title SET NOT NULL;

-- Step 5: 验证 NOT NULL 约束 - ppt.file_url (schema 已定义)
-- Requirements: 7.2
-- 如果数据库中 file_url 允许 NULL，执行：
-- ALTER TABLE ppt ALTER COLUMN file_url SET NOT NULL;

-- ===========================================
-- 验证约束
-- ===========================================
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.constraint_type IN ('FOREIGN KEY', 'UNIQUE')
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;
