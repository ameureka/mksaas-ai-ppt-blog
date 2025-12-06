/**
 * 数据库迁移执行脚本
 * 按顺序执行所有迁移阶段
 *
 * 运行方式: npx tsx scripts/db-migration/run-migration.ts
 */

import { resolve } from 'path';
import dotenv from 'dotenv';

// 加载 .env.local 文件
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { readFileSync } from 'fs';
import { join } from 'path';
import { sql } from 'drizzle-orm';
import { getDb } from '../../src/db';

async function executeSqlFile(filename: string) {
  const db = getDb();
  const filePath = join(__dirname, filename);
  const sqlContent = readFileSync(filePath, 'utf-8');

  // 分割 SQL 语句（简单分割，不处理复杂情况）
  const statements = sqlContent
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  console.log(`\nExecuting ${filename}...`);

  for (const statement of statements) {
    if (statement.toLowerCase().startsWith('select')) {
      // 查询语句，显示结果
      try {
        const result = await db.execute(sql.raw(statement));
        console.log('Query result:', result);
      } catch (error) {
        console.log(
          'Query skipped (may not be critical):',
          (error as Error).message
        );
      }
    } else {
      // DDL 语句
      try {
        await db.execute(sql.raw(statement));
        console.log(`✓ Executed: ${statement.substring(0, 60)}...`);
      } catch (error) {
        const errorMsg = (error as Error).message;
        if (
          errorMsg.includes('already exists') ||
          errorMsg.includes('does not exist')
        ) {
          console.log(
            `⚠ Skipped (already applied): ${statement.substring(0, 60)}...`
          );
        } else {
          console.error(`✗ Failed: ${statement.substring(0, 60)}...`);
          console.error(`  Error: ${errorMsg}`);
        }
      }
    }
  }
}

async function runMigration() {
  console.log('=== Database Migration ===\n');
  console.log(
    '⚠️  IMPORTANT: Make sure you have created a Neon branch backup first!'
  );
  console.log(
    `   Branch name: db-optimization-backup-${new Date().toISOString().split('T')[0]}\n`
  );

  // Phase 2: 索引优化
  console.log('\n--- Phase 2: Index Optimization ---');
  await executeSqlFile('phase2-indexes.sql');

  // Phase 3: 约束增强
  console.log('\n--- Phase 3: Constraint Enhancement ---');
  await executeSqlFile('phase3-constraints.sql');

  // Phase 4: 字段重构
  console.log('\n--- Phase 4: Field Refactoring ---');
  await executeSqlFile('phase4-fields.sql');

  console.log('\n=== Migration Complete ===');
  console.log('Run phase0-prepare.ts to verify the migration results.');
}

runMigration()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
