-- ===========================================
-- Phase 4: Field Refactoring
-- Requirements: 5.1, 5.2, 6.1, 6.5, 10.1, 10.2, 10.3
-- ===========================================

-- Step 1: 字段重命名 - credit_transaction.payment_id → stripe_invoice_id
-- Requirements: 5.1
-- 使用双写策略：先添加新字段，再迁移数据，最后删除旧字段
ALTER TABLE credit_transaction ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT;
UPDATE credit_transaction SET stripe_invoice_id = payment_id WHERE stripe_invoice_id IS NULL;
ALTER TABLE credit_transaction DROP COLUMN IF EXISTS payment_id;

-- Step 2: 删除废弃字段 - user_credit.last_refresh_at
-- Requirements: 5.2
ALTER TABLE user_credit DROP COLUMN IF EXISTS last_refresh_at;

-- Step 3: 添加软删除字段 - ppt
-- Requirements: 6.1
ALTER TABLE ppt ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Step 4: 添加软删除字段 - user
-- Requirements: 6.5
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Step 5: 添加元数据字段 - ppt
-- Requirements: 10.1, 10.2, 10.3
ALTER TABLE ppt ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE ppt ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE ppt ADD COLUMN IF NOT EXISTS file_format TEXT DEFAULT 'pptx';

-- ===========================================
-- 验证字段变更
-- ===========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name IN ('ppt', 'user', 'user_credit', 'credit_transaction')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
