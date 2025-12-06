/**
 * Phase 0: 迁移准备脚本
 * - 验证当前数据库状态
 * - 统计孤儿数据、重复数据、NULL 值
 * - 生成迁移前报告
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 12.1, 12.3
 *
 * 运行方式: npx tsx scripts/db-migration/phase0-prepare.ts
 */

import { resolve } from 'path';
import dotenv from 'dotenv';

// 加载 .env.local 文件
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { isNull, sql } from 'drizzle-orm';
import { getDb } from '../../src/db';
import {
  adWatchRecord,
  ppt,
  userCredit,
  userDownloadHistory,
} from '../../src/db/schema';

interface MigrationReport {
  timestamp: string;
  orphanData: {
    adWatchRecords: number;
    downloadHistory: number;
  };
  duplicateData: {
    userCredits: number;
    duplicateUserIds: string[];
  };
  nullValues: {
    pptTitle: number;
    pptFileUrl: number;
  };
  tableStats: {
    pptCount: number;
    userCreditCount: number;
    adWatchRecordCount: number;
    downloadHistoryCount: number;
  };
  readyForMigration: boolean;
  issues: string[];
}

export async function phase0Prepare(): Promise<MigrationReport> {
  console.log('=== Phase 0: Migration Preparation ===\n');

  const db = getDb();
  const issues: string[] = [];

  // Step 1: 提示创建 Neon 分支
  console.log('Step 1: Neon Branch Backup');
  console.log('  → Please create a Neon branch for backup:');
  console.log(
    `  → Branch name: db-optimization-backup-${new Date().toISOString().split('T')[0]}`
  );
  console.log('  → Use Neon Console or API to create the branch\n');

  // Step 2: 统计表数据
  console.log('Step 2: Collecting table statistics...');

  const pptCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(ppt);
  const creditCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(userCredit);
  const adWatchCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(adWatchRecord);
  const downloadCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(userDownloadHistory);

  const pptCount = Number(pptCountResult[0]?.count || 0);
  const creditCount = Number(creditCountResult[0]?.count || 0);
  const adWatchCount = Number(adWatchCountResult[0]?.count || 0);
  const downloadCount = Number(downloadCountResult[0]?.count || 0);

  console.log(`  → PPT: ${pptCount}`);
  console.log(`  → User Credits: ${creditCount}`);
  console.log(`  → Ad Watch Records: ${adWatchCount}`);
  console.log(`  → Download History: ${downloadCount}\n`);

  // Step 3: 统计孤儿数据
  console.log('Step 3: Checking orphan data...');

  // 获取所有有效的 PPT ID
  const validPpts = await db.select({ id: ppt.id }).from(ppt);
  const validPptIds = validPpts.map((p) => p.id);

  // 统计 ad_watch_record 孤儿数据
  let adOrphanCount = 0;
  if (validPptIds.length > 0) {
    const adOrphans = await db
      .select({ count: sql<number>`count(*)` })
      .from(adWatchRecord)
      .where(
        sql`${adWatchRecord.pptId} IS NOT NULL AND ${adWatchRecord.pptId} NOT IN (${sql.join(
          validPptIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );
    adOrphanCount = Number(adOrphans[0]?.count || 0);
  }

  // 统计 user_download_history 孤儿数据
  let downloadOrphanCount = 0;
  if (validPptIds.length > 0) {
    const downloadOrphans = await db
      .select({ count: sql<number>`count(*)` })
      .from(userDownloadHistory)
      .where(
        sql`${userDownloadHistory.pptId} NOT IN (${sql.join(
          validPptIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );
    downloadOrphanCount = Number(downloadOrphans[0]?.count || 0);
  }

  console.log(`  → Orphan ad_watch_record entries: ${adOrphanCount}`);
  console.log(
    `  → Orphan user_download_history entries: ${downloadOrphanCount}`
  );

  if (adOrphanCount > 0) {
    issues.push(`Found ${adOrphanCount} orphan ad_watch_record entries`);
  }
  if (downloadOrphanCount > 0) {
    issues.push(
      `Found ${downloadOrphanCount} orphan user_download_history entries`
    );
  }
  console.log('');

  // Step 4: 统计重复数据
  console.log('Step 4: Checking duplicate data...');

  const duplicates = (await db.execute(sql`
    SELECT user_id, COUNT(*) as count
    FROM user_credit
    GROUP BY user_id
    HAVING COUNT(*) > 1
  `)) as unknown as { user_id: string; count: number }[];

  const duplicateUserIds = duplicates.map((d) => d.user_id);

  console.log(`  → Duplicate user_credit entries: ${duplicates.length}`);
  if (duplicates.length > 0) {
    console.log(`  → Affected user IDs: ${duplicateUserIds.join(', ')}`);
    issues.push(
      `Found ${duplicates.length} users with duplicate credit records`
    );
  }
  console.log('');

  // Step 5: 统计 NULL 值
  console.log('Step 5: Checking NULL values...');

  const nullTitles = await db
    .select({ count: sql<number>`count(*)` })
    .from(ppt)
    .where(isNull(ppt.title));
  const nullTitleCount = Number(nullTitles[0]?.count || 0);

  const nullFileUrls = await db
    .select({ count: sql<number>`count(*)` })
    .from(ppt)
    .where(isNull(ppt.fileUrl));
  const nullFileUrlCount = Number(nullFileUrls[0]?.count || 0);

  console.log(`  → PPT with NULL title: ${nullTitleCount}`);
  console.log(`  → PPT with NULL file_url: ${nullFileUrlCount}`);

  if (nullTitleCount > 0) {
    issues.push(`Found ${nullTitleCount} PPT records with NULL title`);
  }
  if (nullFileUrlCount > 0) {
    issues.push(`Found ${nullFileUrlCount} PPT records with NULL file_url`);
  }
  console.log('');

  // 生成报告
  const readyForMigration =
    adOrphanCount === 0 &&
    downloadOrphanCount === 0 &&
    duplicates.length === 0 &&
    nullTitleCount === 0 &&
    nullFileUrlCount === 0;

  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    orphanData: {
      adWatchRecords: adOrphanCount,
      downloadHistory: downloadOrphanCount,
    },
    duplicateData: {
      userCredits: duplicates.length,
      duplicateUserIds,
    },
    nullValues: {
      pptTitle: nullTitleCount,
      pptFileUrl: nullFileUrlCount,
    },
    tableStats: {
      pptCount,
      userCreditCount: creditCount,
      adWatchRecordCount: adWatchCount,
      downloadHistoryCount: downloadCount,
    },
    readyForMigration,
    issues,
  };

  // 输出报告
  console.log('=== Pre-Migration Report ===');
  console.log(JSON.stringify(report, null, 2));
  console.log('');

  if (readyForMigration) {
    console.log('✅ Database is ready for migration!');
  } else {
    console.log('❌ Database needs cleanup before migration:');
    for (const issue of issues) {
      console.log(`   - ${issue}`);
    }
    console.log('\nRun phase1-cleanup.ts to clean up the data.');
  }

  return report;
}

// 直接运行
phase0Prepare()
  .then((report) => {
    process.exit(report.readyForMigration ? 0 : 1);
  })
  .catch((error) => {
    console.error('Migration preparation failed:', error);
    process.exit(1);
  });
