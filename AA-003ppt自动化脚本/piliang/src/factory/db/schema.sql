-- PiliangFactory assets.db schema (SQLite)
-- Source of truth: `.kiro/specs/piliang-batch-factory-v5/design.md`

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS batches (
  source_batch_id TEXT PRIMARY KEY,
  input_root TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS raw_assets (
  aid TEXT PRIMARY KEY,
  source_batch_id TEXT NOT NULL,
  channel_ids TEXT,
  channel_names TEXT,
  detail_url TEXT,
  original_tags TEXT,
  origin_updated_at DATETIME,
  file_path TEXT,
  cover_path TEXT,
  ingest_status TEXT,
  ingest_error_code TEXT,
  ingest_error_message TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_batch_id) REFERENCES batches(source_batch_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_raw_assets_source_batch_id ON raw_assets(source_batch_id);
CREATE INDEX IF NOT EXISTS idx_raw_assets_ingest_status ON raw_assets(ingest_status);

CREATE TABLE IF NOT EXISTS processed_assets (
  aid TEXT PRIMARY KEY,
  source_batch_id TEXT NOT NULL,
  local_pptx_path TEXT,
  local_cover_path TEXT,
  pages_count INTEGER,
  file_size_kb INTEGER,
  file_format TEXT,
  ai_summary TEXT,
  ai_keywords TEXT,
  ai_scenario TEXT,
  ai_color_scheme TEXT,
  ai_structure_features TEXT,
  ai_template_features TEXT,
  ppthub_category TEXT,
  language TEXT,
  file_url_remote TEXT,
  thumbnail_url_remote TEXT,
  cover_url_remote TEXT,
  publish_status TEXT,
  export_status TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (aid) REFERENCES raw_assets(aid) ON DELETE CASCADE,
  FOREIGN KEY (source_batch_id) REFERENCES batches(source_batch_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_processed_assets_source_batch_id ON processed_assets(source_batch_id);
CREATE INDEX IF NOT EXISTS idx_processed_assets_publish_status ON processed_assets(publish_status);
CREATE INDEX IF NOT EXISTS idx_processed_assets_export_status ON processed_assets(export_status);

CREATE TABLE IF NOT EXISTS asset_stages (
  aid TEXT NOT NULL,
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at DATETIME,
  finished_at DATETIME,
  error_code TEXT,
  error_message TEXT,
  warnings TEXT,
  artifacts TEXT,
  PRIMARY KEY (aid, stage),
  FOREIGN KEY (aid) REFERENCES raw_assets(aid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_asset_stages_aid ON asset_stages(aid);
CREATE INDEX IF NOT EXISTS idx_asset_stages_status ON asset_stages(status);
CREATE INDEX IF NOT EXISTS idx_asset_stages_stage ON asset_stages(stage);

