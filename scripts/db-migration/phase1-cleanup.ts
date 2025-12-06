/**
 * Phase 1: 数据清洗脚本
 * - 清理孤儿 ppt_id 记录
 * - 合并重复 user_credit 记录
 * - 填充 NULL 值
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 *
 * 运行方式: npx tsx scripts/db-migration/phase1-cleanup.ts
 */

import { resolve } from 'path';
import dotenv from 'dotenv';

// 加载 .env.local 文件
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { randomUUID } from 'crypto';
import { eq, isNull, sql } from 'drizzle-orm';
import { getDb } from '../../src/db';
import {
  adWatchRecord,
  ppt,
  userCredit,
  userDownloadHistory,
} from '../../src/db/schema';

interface CleanupReport {
  timestamp: string;
  adOrphansDeleted: number;
  downloadOrphansDeleted: number;
  duplicatesMerged: number;
  nullTitlesFilled: number;
  nullFileUrlsHandled: number;
  success: boolean;
  errors: string[];
}

/**
 * 清理 ad_watch_record 孤儿数据
 * Requirements: 8.1
 */
async function cleanOrphanAdWatchRecords(): Promise<number> {
  console.log('\nStep 1: Cleaning orphan ad_watch_record entries...');

  const db = getDb();

  // 获取所有有效的 PPT ID
  const validPpts = await db.select({ id: ppt.id }).from(ppt);
  const validPptIds = validPpts.map((p) => p.id);

  if (validPptIds.length === 0) {
    console.log('  → No PPT records found, skipping');
    return 0;
  }

  // 删除孤儿记录
  const deleted = await db
    .delete(adWatchRecord)
    .where(
      sql`${adWatchRecord.pptId} IS NOT NULL AND ${adWatchRecord.pptId} NOT IN (${sql.join(
        validPptIds.map((id) => sql`${id}`),
        sql`, `
      )})`
    )
    .returning({ id: adWatchRecord.id });

  console.log(`  → Deleted ${deleted.length} orphan ad_watch_record entries`);
  return deleted.length;
}

/**
 * 清理 user_download_history 孤儿数据
 * Requirements: 8.2
 */
async function cleanOrphanDownloadHistory(): Promise<number> {
  console.log('\nStep 2: Cleaning orphan user_download_history entries...');

  const db = getDb();

  // 获取所有有效的 PPT ID
  const validPpts = await db.select({ id: ppt.id }).from(ppt);
  const validPptIds = validPpts.map((p) => p.id);

  if (validPptIds.length === 0) {
    console.log('  → No PPT records found, skipping');
    return 0;
  }

  // 删除孤儿记录
  const deleted = await db
    .delete(userDownloadHistory)
    .where(
      sql`${userDownloadHistory.pptId} NOT IN (${sql.join(
        validPptIds.map((id) => sql`${id}`),
        sql`, `
      )})`
    )
    .returning({ id: userDownloadHistory.id });

  console.log(
    `  → Deleted ${deleted.length} orphan user_download_history entries`
  );
  return deleted.length;
}

/**
 * 合并重复 user_credit 记录
 * Requirements: 8.3
 */
async function cleanDuplicateUserCredits(): Promise<number> {
  console.log('\nStep 3: Merging duplicate user_credit entries...');

  const db = getDb();

  const duplicates = (await db.execute(sql`
    SELECT user_id, COUNT(*) as count, MAX(current_credits) as max_credits
    FROM user_credit
    GROUP BY user_id
    HAVING COUNT(*) > 1
  `)) as unknown as { user_id: string; count: number; max_credits: number }[];

  if (duplicates.length === 0) {
    console.log('  → No duplicate records found');
    return 0;
  }

  for (const dup of duplicates) {
    const userId = dup.user_id;
    const maxCredits = Number(dup.max_credits);

    // 删除该用户的所有记录
    await db.delete(userCredit).where(eq(userCredit.userId, userId));

    // 重新插入一条合并后的记录
    await db.insert(userCredit).values({
      id: randomUUID(),
      userId,
      currentCredits: maxCredits,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(
      `  → Merged credits for user ${userId}, kept ${maxCredits} credits`
    );
  }

  console.log(`  → Merged ${duplicates.length} duplicate user_credit entries`);
  return duplicates.length;
}

/**
 * 填充 ppt.title NULL 值
 * Requirements: 8.4
 */
async function fillNullTitles(): Promise<number> {
  console.log('\nStep 4: Filling NULL ppt.title values...');

  const db = getDb();

  const updated = await db
    .update(ppt)
    .set({ title: 'Untitled' })
    .where(isNull(ppt.title))
    .returning({ id: ppt.id });

  console.log(`  → Updated ${updated.length} ppt records with NULL title`);
  return updated.length;
}

/**
 * 处理 ppt.file_url NULL 值
 * Requirements: 8.5
 */
async function handleNullFileUrls(): Promise<number> {
  console.log('\nStep 5: Handling NULL ppt.file_url values...');

  const db = getDb();

  // 删除无效记录（没有文件 URL 的 PPT 无法使用）
  const deleted = await db
    .delete(ppt)
    .where(isNull(ppt.fileUrl))
    .returning({ id: ppt.id });

  console.log(`  → Deleted ${deleted.length} ppt records with NULL file_url`);
  return deleted.length;
}

/**
 * 主清洗函数
 */
export async function phase1Cleanup(): Promise<CleanupReport> {
  console.log('=== Phase 1: Data Cleanup ===');

  const errors: string[] = [];

  let adOrphansDeleted = 0;
  let downloadOrphansDeleted = 0;
  let duplicatesMerged = 0;
  let nullTitlesFilled = 0;
  let nullFileUrlsHandled = 0;

  try {
    adOrphansDeleted = await cleanOrphanAdWatchRecords();
  } catch (error) {
    errors.push(`Failed to clean ad_watch_record orphans: ${error}`);
    console.error('Error cleaning ad_watch_record orphans:', error);
  }

  try {
    downloadOrphansDeleted = await cleanOrphanDownloadHistory();
  } catch (error) {
    errors.push(`Failed to clean user_download_history orphans: ${error}`);
    console.error('Error cleaning user_download_history orphans:', error);
  }

  try {
    duplicatesMerged = await cleanDuplicateUserCredits();
  } catch (error) {
    errors.push(`Failed to merge duplicate user_credit: ${error}`);
    console.error('Error merging duplicate user_credit:', error);
  }

  try {
    nullTitlesFilled = await fillNullTitles();
  } catch (error) {
    errors.push(`Failed to fill NULL titles: ${error}`);
    console.error('Error filling NULL titles:', error);
  }

  try {
    nullFileUrlsHandled = await handleNullFileUrls();
  } catch (error) {
    errors.push(`Failed to handle NULL file_urls: ${error}`);
    console.error('Error handling NULL file_urls:', error);
  }

  const report: CleanupReport = {
    timestamp: new Date().toISOString(),
    adOrphansDeleted,
    downloadOrphansDeleted,
    duplicatesMerged,
    nullTitlesFilled,
    nullFileUrlsHandled,
    success: errors.length === 0,
    errors,
  };

  console.log('\n=== Cleanup Report ===');
  console.log(JSON.stringify(report, null, 2));

  if (report.success) {
    console.log('\n✅ Data cleanup completed successfully!');
    console.log(
      'Run phase0-prepare.ts again to verify readyForMigration = true'
    );
  } else {
    console.log('\n❌ Data cleanup completed with errors:');
    for (const error of errors) {
      console.log(`   - ${error}`);
    }
  }

  return report;
}

// 直接运行
phase1Cleanup()
  .then((report) => {
    process.exit(report.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Data cleanup failed:', error);
    process.exit(1);
  });
