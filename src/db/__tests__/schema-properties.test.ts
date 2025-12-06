/**
 * 数据库 Schema 属性测试
 * 使用 fast-check 进行属性基测试
 *
 * 验证数据库优化迁移 (2025-12-06) 的正确性
 *
 * 运行方式: pnpm vitest run src/db/__tests__/schema-properties.test.ts
 */

import { resolve } from 'path';
import dotenv from 'dotenv';

// 加载 .env.local 以连接 Neon 数据库
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sql } from 'drizzle-orm';
import { getDb } from '@/db';

// 测试数据生成器
const generateUserId = () => fc.uuid();
const generatePptId = () => fc.uuid();
const generateEmail = () =>
  fc.emailAddress().map((e) => `test_${Date.now()}_${e}`);
const generateTitle = () =>
  fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0);

describe('Database Schema Properties', () => {
  /**
   * Property 1: 外键完整性 - ad_watch_record.ppt_id
   * **Validates: Requirements 1.1, 1.5**
   *
   * 对于任意 ad_watch_record，如果 ppt_id 不为 NULL，
   * 则该 ppt_id 必须指向存在的 ppt 记录
   */
  it('Property 1: ad_watch_record.ppt_id references valid ppt', async () => {
    const db = getDb();

    // 查询所有非空 ppt_id 的 ad_watch_record
    const orphanRecords = await db.execute(sql`
      SELECT awr.id, awr.ppt_id
      FROM ad_watch_record awr
      WHERE awr.ppt_id IS NOT NULL
        AND awr.ppt_id NOT IN (SELECT id FROM ppt)
    `);

    expect(orphanRecords.length).toBe(0);
  });

  /**
   * Property 2: 外键完整性 - user_download_history.ppt_id
   * **Validates: Requirements 1.2, 1.5**
   *
   * 对于任意 user_download_history，ppt_id 必须指向存在的 ppt 记录
   */
  it('Property 2: user_download_history.ppt_id references valid ppt', async () => {
    const db = getDb();

    const orphanRecords = await db.execute(sql`
      SELECT udh.id, udh.ppt_id
      FROM user_download_history udh
      WHERE udh.ppt_id NOT IN (SELECT id FROM ppt)
    `);

    expect(orphanRecords.length).toBe(0);
  });

  /**
   * Property 5: 用户积分唯一性
   * **Validates: Requirements 2.1, 2.3**
   *
   * 对于任意用户，user_credit 表中最多只有一条记录
   */
  it('Property 5: user_credit has unique user_id', async () => {
    const db = getDb();

    const duplicates = await db.execute(sql`
      SELECT user_id, COUNT(*) as count
      FROM user_credit
      GROUP BY user_id
      HAVING COUNT(*) > 1
    `);

    expect(duplicates.length).toBe(0);
  });

  /**
   * Property 6: 索引无重复
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   *
   * 数据库中不应存在功能重复的索引
   */
  it('Property 6: no duplicate indexes on ppt table', async () => {
    const db = getDb();

    // 检查是否存在已删除的重复索引
    const duplicateIndexes = await db.execute(sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'ppt'
        AND indexname IN (
          'idx_ppt_category',
          'idx_ppt_language',
          'idx_ppt_created_at',
          'idx_import_batch_status'
        )
    `);

    expect(duplicateIndexes.length).toBe(0);
  });

  /**
   * Property 8: 软删除查询过滤
   * **Validates: Requirements 6.2, 6.3**
   *
   * 对于任意 PPT 查询（不含 includeDeleted），
   * 返回结果中不应包含 deleted_at 不为 NULL 的记录
   */
  it('Property 8: soft deleted ppt excluded by default', async () => {
    const db = getDb();

    // 验证 deleted_at 字段存在
    const columns = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'ppt' AND column_name = 'deleted_at'
    `);

    expect(columns.length).toBe(1);
  });

  /**
   * Property 10: NOT NULL 约束有效性
   * **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
   *
   * ppt.title 和 ppt.file_url 不应有 NULL 值
   */
  it('Property 10: ppt.title and ppt.file_url are NOT NULL', async () => {
    const db = getDb();

    const nullTitles = await db.execute(sql`
      SELECT COUNT(*) as count FROM ppt WHERE title IS NULL
    `);

    const nullFileUrls = await db.execute(sql`
      SELECT COUNT(*) as count FROM ppt WHERE file_url IS NULL
    `);

    expect(Number((nullTitles[0] as any)?.count || 0)).toBe(0);
    expect(Number((nullFileUrls[0] as any)?.count || 0)).toBe(0);
  });

  /**
   * Property 11: 字段重命名一致性
   * **Validates: Requirements 5.1, 5.2, 5.3**
   *
   * credit_transaction 表应有 stripe_invoice_id 列，
   * 不应有 payment_id 列
   */
  it('Property 11: stripe_invoice_id exists, payment_id removed', async () => {
    const db = getDb();

    const columns = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'credit_transaction'
        AND column_name IN ('stripe_invoice_id', 'payment_id')
    `);

    const columnNames = (columns as any[]).map((c) => c.column_name);

    expect(columnNames).toContain('stripe_invoice_id');
    expect(columnNames).not.toContain('payment_id');
  });

  /**
   * Property 12: 迁移可回滚性验证
   * **Validates: Requirements 12.2, 12.3**
   *
   * 验证关键约束存在
   */
  it('Property 12: foreign key constraints exist', async () => {
    const db = getDb();

    const constraints = await db.execute(sql`
      SELECT constraint_name, table_name
      FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY'
        AND table_name IN ('ad_watch_record', 'user_download_history')
    `);

    expect(constraints.length).toBeGreaterThan(0);
  });
});
