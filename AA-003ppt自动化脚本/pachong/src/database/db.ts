import Database from 'better-sqlite3';
import { ensureDirSync } from 'fs-extra';
import { dirname } from 'path';
import { getConfig } from '../config';

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  const config = getConfig();
  ensureDirSync(dirname(config.DB_PATH));

  dbInstance = new Database(config.DB_PATH);
  
  // Initialize Schema
  initSchema(dbInstance);

  return dbInstance;
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE NOT NULL,
      type TEXT CHECK(type IN ('list', 'detail')) NOT NULL,
      status TEXT CHECK(status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')) NOT NULL DEFAULT 'PENDING',
      retry_count INTEGER DEFAULT 0,
      meta TEXT,
      error_msg TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_url ON tasks(url);
  `);
}
