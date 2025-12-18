-- AI Enrichment 字段扩展
-- 版本: 2
-- 依赖: 001_initial_schema.sql (processed_assets 表已存在)
-- 说明: 为 processed_assets 表添加派生字段和来源追踪字段

-- 添加派生字段
ALTER TABLE processed_assets ADD COLUMN tags_final TEXT;
ALTER TABLE processed_assets ADD COLUMN description_final TEXT;
ALTER TABLE processed_assets ADD COLUMN author TEXT DEFAULT 'PPTHub';

-- 添加来源追踪字段
ALTER TABLE processed_assets ADD COLUMN language_source TEXT;
ALTER TABLE processed_assets ADD COLUMN category_source TEXT;
ALTER TABLE processed_assets ADD COLUMN ai_fallback_reason TEXT;

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_processed_assets_ppthub_category ON processed_assets(ppthub_category);
CREATE INDEX IF NOT EXISTS idx_processed_assets_language ON processed_assets(language);
CREATE INDEX IF NOT EXISTS idx_processed_assets_category_source ON processed_assets(category_source);
