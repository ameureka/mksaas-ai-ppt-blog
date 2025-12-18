#!/usr/bin/env tsx
/**
 * PPTHub 批量导入 CLI
 *
 * 用法:
 *   pnpm batch-import --input <path> [options]
 *
 * Requirements: 1.1, 6.1, 8.4, 10.5, 13.5
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import { Command } from 'commander';
import {
  batchViaAction,
  generateActionExample,
} from '../src/lib/action-executor.js';
import {
  checkDatabaseConnection,
  closeDatabase,
  executeBatchUpsert,
  executeEmbeddingTrigger,
  initDatabase,
} from '../src/lib/db.js';
import {
  getRepairCronInstructions,
  triggerEmbeddings,
} from '../src/lib/embedding.js';
import { ParseError, parseInitCsv, parseInitJson } from '../src/lib/parser.js';
import { formatPostCheckResult, postCheck } from '../src/lib/postcheck.js';
import { type NormalizedItem, preflight } from '../src/lib/preflight.js';
import type {
  BatchImportOptions,
  ImportReport,
  PpthubInitItem,
} from '../src/lib/types.js';
import { batchUpsert, generateUpsertSql } from '../src/lib/upsert.js';

const program = new Command();

program
  .name('batch-import')
  .description(
    'PPTHub 批量导入工具 - 从 ppthub-init.json/csv 导入 PPT 模板数据'
  )
  .version('1.0.0')
  .requiredOption(
    '-i, --input <path>',
    '输入文件路径 (ppthub-init.json 或 .csv)'
  )
  .option('-f, --format <format>', '输入格式 (auto|json|csv)', 'auto')
  .option('-b, --batch-size <size>', '每批次记录数 (最大 100)', '100')
  .option('-m, --mode <mode>', '写入模式 (sql|action)', 'sql')
  .option('--force-stats', '强制覆盖 download_count/view_count', false)
  .option('--dry-run', '仅校验不写库', false)
  .option('-o, --output <path>', '导入报告输出路径')
  .option('--storage-url <url>', '存储公共 URL 前缀 (用于 URL 校验)')
  .option('--show-sql', '显示生成的 SQL (用于调试)')
  .option('--postcheck', '执行导入后校验报告')
  .parse(process.argv);

const opts = program.opts();

async function main() {
  const inputPath = path.resolve(opts.input);

  // 检查输入文件存在
  if (!fs.existsSync(inputPath)) {
    console.error(chalk.red(`❌ 输入文件不存在: ${inputPath}`));
    process.exit(1);
  }

  // 确定格式
  let format: 'json' | 'csv' = 'json';
  if (opts.format === 'auto') {
    format = inputPath.endsWith('.csv') ? 'csv' : 'json';
  } else {
    format = opts.format as 'json' | 'csv';
  }

  // 解析 batchSize
  const batchSize = Math.min(
    100,
    Math.max(1, Number.parseInt(opts.batchSize, 10) || 100)
  );

  // 解析 mode
  const mode: 'sql' | 'action' = opts.mode === 'action' ? 'action' : 'sql';

  const options: BatchImportOptions = {
    inputPath,
    format,
    naturalKey: 'file_url',
    batchSize,
    forceStats: opts.forceStats,
    dryRun: opts.dryRun,
  };

  console.log(chalk.bold.cyan('🚀 PPTHub 批量导入'));
  console.log(chalk.gray('=================='));
  console.log(`📁 输入文件: ${chalk.yellow(inputPath)}`);
  console.log(`📋 格式: ${chalk.yellow(format)}`);
  console.log(`📦 批次大小: ${chalk.yellow(batchSize)}`);
  console.log(`📝 写入模式: ${chalk.yellow(mode)}`);
  console.log(
    `🔄 强制覆盖统计: ${options.forceStats ? chalk.green('是') : chalk.gray('否')}`
  );
  console.log(
    `🧪 Dry Run: ${options.dryRun ? chalk.yellow('是') : chalk.gray('否')}`
  );
  console.log('');

  // 检查数据库连接 (非 dry-run 模式)
  if (!options.dryRun && mode === 'sql') {
    console.log(chalk.blue('🔌 检查数据库连接...'));
    try {
      const connected = await checkDatabaseConnection();
      if (!connected) {
        console.error(
          chalk.red('❌ 无法连接到数据库。请检查 DATABASE_URL 环境变量。')
        );
        process.exit(1);
      }
      console.log(chalk.green('✅ 数据库连接成功'));
    } catch (error) {
      console.error(
        chalk.red(
          `❌ 数据库连接失败: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }
  }

  // Task 2: 解析输入文件
  let items: PpthubInitItem[] = [];
  let sourceBatchId = '';

  try {
    if (format === 'json') {
      console.log(chalk.blue('📖 解析 JSON...'));
      const initFile = parseInitJson(inputPath);
      items = initFile.items;
      sourceBatchId = initFile.meta.source_batch_id;
      console.log(chalk.green(`✅ 解析成功: ${items.length} 条记录`));
      console.log(`   source_batch_id: ${chalk.gray(sourceBatchId)}`);
    } else {
      console.log(chalk.blue('📖 解析 CSV...'));
      items = parseInitCsv(inputPath);
      sourceBatchId = `csv-${Date.now()}`;
      console.log(chalk.green(`✅ 解析成功: ${items.length} 条记录`));
    }
  } catch (err) {
    if (err instanceof ParseError) {
      console.error(chalk.red(`❌ 解析失败 [${err.code}]: ${err.message}`));
    } else {
      console.error(chalk.red(`❌ 解析失败:`), err);
    }
    process.exit(1);
  }

  console.log('');

  // Task 3: Preflight 校验
  console.log(chalk.blue('🔍 Preflight 校验...'));
  const preflightResult = preflight(items, {
    storagePublicUrl: opts.storageUrl,
  });

  console.log(chalk.green(`✅ 有效记录: ${preflightResult.validItems.length}`));
  console.log(chalk.red(`❌ 无效记录: ${preflightResult.invalidItems.length}`));

  if (preflightResult.invalidItems.length > 0) {
    console.log(chalk.yellow('\n⚠️  无效记录详情:'));
    for (const { item, errors } of preflightResult.invalidItems.slice(0, 5)) {
      console.log(
        `   - ${chalk.gray(item.id || item.title)}: ${errors.join(', ')}`
      );
    }
    if (preflightResult.invalidItems.length > 5) {
      console.log(
        chalk.gray(`   ... 还有 ${preflightResult.invalidItems.length - 5} 条`)
      );
    }
  }

  console.log('');

  // Task 5/10: 批量写库 (支持 sql/action 两种模式)
  console.log(chalk.blue(`💾 批量写库 (${mode} 模式)...`));

  let upsertResult: {
    inserted: string[];
    updated: string[];
    failed: { id: string; error: string }[];
  };

  // 创建进度条
  const progressBar = new cliProgress.SingleBar({
    format:
      '  进度 |' +
      chalk.cyan('{bar}') +
      '| {percentage}% | {value}/{total} 批次',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  });

  if (mode === 'action') {
    // Action 模式
    if (opts.showSql && preflightResult.validItems.length > 0) {
      console.log('\n📝 Action 调用示例:');
      console.log(
        generateActionExample(preflightResult.validItems[0]).substring(0, 500) +
          '...\n'
      );
    }

    upsertResult = await batchViaAction(
      preflightResult.validItems,
      { dryRun: options.dryRun },
      async (input) => {
        // TODO: 实际调用 createPPT action (需要连接主项目)
        throw new Error(
          'Action executor not implemented - use --dry-run for testing'
        );
      }
    );
  } else {
    // SQL 模式 (默认)
    if (opts.showSql && preflightResult.validItems.length > 0) {
      const sql = generateUpsertSql(
        preflightResult.validItems.slice(0, 1),
        options.forceStats
      );
      console.log('\n📝 生成的 SQL (示例):');
      console.log(chalk.gray(sql.substring(0, 500) + '...\n'));
    }

    const totalBatches = Math.ceil(
      preflightResult.validItems.length / batchSize
    );
    if (!options.dryRun && preflightResult.validItems.length > 0) {
      progressBar.start(totalBatches, 0);
    }

    let batchCount = 0;
    upsertResult = await batchUpsert(
      preflightResult.validItems,
      { forceStats: options.forceStats, dryRun: options.dryRun },
      async (sql) => {
        // 使用真正的数据库执行器
        const result = await executeBatchUpsert(sql);
        batchCount++;
        if (!options.dryRun) {
          progressBar.update(batchCount);
        }
        return result;
      }
    );

    if (!options.dryRun && preflightResult.validItems.length > 0) {
      progressBar.stop();
    }
  }

  if (options.dryRun) {
    console.log(
      chalk.yellow(`✅ Dry Run: 模拟插入 ${upsertResult.inserted.length} 条`)
    );
  } else {
    console.log(chalk.green(`✅ 插入: ${upsertResult.inserted.length} 条`));
    console.log(chalk.blue(`✅ 更新: ${upsertResult.updated.length} 条`));
    if (upsertResult.failed.length > 0) {
      console.log(chalk.red(`❌ 失败: ${upsertResult.failed.length} 条`));
    }
  }

  console.log('');

  // Task 7: Embedding Trigger
  console.log(chalk.blue('🧠 Embedding 触发...'));
  const embeddingResult = await triggerEmbeddings(
    preflightResult.validItems,
    { dryRun: options.dryRun },
    options.dryRun
      ? undefined
      : async (sql) => {
          return await executeEmbeddingTrigger(sql);
        }
  );

  if (options.dryRun) {
    console.log(
      chalk.yellow(
        `✅ Dry Run: 模拟触发 ${embeddingResult.triggered.length} 条`
      )
    );
  } else {
    console.log(chalk.green(`✅ 触发: ${embeddingResult.triggered.length} 条`));
    console.log(
      chalk.gray(`⏭️  跳过: ${embeddingResult.skipped.length} 条 (已有向量)`)
    );
  }

  console.log('');
  console.log(chalk.gray(getRepairCronInstructions()));
  console.log('');

  // 导入报告
  const report: ImportReport = {
    batch_id: `import-${Date.now()}`,
    imported_at: new Date().toISOString(),
    input_path: inputPath,
    options: {
      format,
      naturalKey: 'file_url',
      batchSize,
      forceStats: options.forceStats,
      dryRun: options.dryRun,
    },
    summary: {
      total: items.length,
      inserted: upsertResult.inserted.length,
      updated: upsertResult.updated.length,
      skipped: preflightResult.invalidItems.length,
      failed: upsertResult.failed.length,
    },
    failed_items: [
      ...preflightResult.invalidItems.map(({ item, errors }) => ({
        id: item.id || item.file_url,
        errors,
      })),
      ...upsertResult.failed.map(({ id, error }) => ({
        id,
        errors: [error],
      })),
    ],
  };

  // Task 11: 一致性校验
  const sumCheck =
    report.summary.inserted +
    report.summary.updated +
    report.summary.skipped +
    report.summary.failed;
  if (sumCheck !== report.summary.total) {
    console.log(
      chalk.yellow(
        `⚠️  一致性警告: 计数之和 (${sumCheck}) ≠ 总数 (${report.summary.total})`
      )
    );
  }

  // 输出报告
  const reportJson = JSON.stringify(report, null, 2);
  console.log(chalk.bold('📊 导入报告:'));
  console.log(chalk.gray(reportJson));

  // Task 8: Post Check
  if (opts.postcheck && preflightResult.validItems.length > 0) {
    console.log('');
    const checkResult = postCheck(preflightResult.validItems);
    console.log(
      formatPostCheckResult(checkResult, preflightResult.validItems.length)
    );
  }

  if (opts.output) {
    const outputPath = path.resolve(opts.output);
    fs.writeFileSync(outputPath, reportJson, 'utf-8');
    console.log(chalk.green(`\n📄 报告已保存: ${outputPath}`));
  }

  // 关闭数据库连接
  if (!options.dryRun && mode === 'sql') {
    await closeDatabase();
  }

  console.log(chalk.bold.green('\n✅ 所有 Tasks 完成!'));
}

main().catch((err) => {
  console.error(chalk.red('❌ 导入失败:'), err);
  closeDatabase().finally(() => process.exit(1));
});
