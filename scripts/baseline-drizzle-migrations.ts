import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { sql } from 'drizzle-orm';
import { getDb } from '../src/db/index.js';

/**
 * 生产/已存在数据库的 Drizzle 迁移基线脚本。
 *
 * 场景：
 * - 线上数据库已有人为/旧工具创建过表
 * - 但 drizzle.__drizzle_migrations 为空/不存在
 * - 导致 `drizzle-kit migrate` 误重放 0000~0007
 *
 * 本脚本会在 migrations 表为空时插入一个 baseline 记录，
 * 使得 migrate 仅执行 0008 及之后的迁移。
 *
 * 运行:
 *   pnpm db:baseline
 */

const LAST_APPLIED_MIGRATION_MILLIS = 1765285157730; // 0007_parched_wendell_rand

async function baselineMigrations() {
  const db = getDb();

  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS drizzle`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);

  const rows = await db.execute(sql`
    SELECT created_at
    FROM drizzle.__drizzle_migrations
    ORDER BY created_at DESC
    LIMIT 1
  `);

  const lastCreatedAt = rows[0]?.created_at
    ? Number((rows[0] as any).created_at)
    : null;

  if (lastCreatedAt && lastCreatedAt >= LAST_APPLIED_MIGRATION_MILLIS) {
    console.log(
      `[baseline] already baselined, last created_at=${lastCreatedAt}`
    );
    return;
  }

  await db.execute(sql`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES ('baseline_0007', ${LAST_APPLIED_MIGRATION_MILLIS})
  `);

  console.log(
    `[baseline] inserted baseline row at ${LAST_APPLIED_MIGRATION_MILLIS}`
  );
}

baselineMigrations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[baseline] failed:', error);
    process.exit(1);
  });
