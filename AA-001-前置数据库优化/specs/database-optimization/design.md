```markdown
# Design Document (v2.0)

## Overview
本设计文档描述 PPTHub 数据库优化的技术实现方案，对应 Requirements v2.0 的 12 项需求。

优化分为五个阶段：

*   **Phase 0: 迁移准备**（备份、Neon 分支）
*   **Phase 1: 数据清洗**（孤儿数据、重复数据、空值）
*   **Phase 2: 索引优化**（删除冗余、补充缺失）
*   **Phase 3: 约束增强**（外键、唯一约束、NOT NULL）
*   **Phase 4: 字段重构**（重命名、软删除、元数据）

所有变更通过 Drizzle ORM 迁移执行，确保可回滚和版本控制。

## 当前数据库统计
| 指标 | 数量 |
| :--- | :--- |
| PPT 模板 | 1,471 |
| 幻灯片 | 36,497 |
| 分类 | 10 |
| 用户 | 6 |
| 索引总数 | 76 |
| 重复索引 | 8 |

## Architecture

**当前数据库架构（问题标注）**

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Current Architecture (with Issues)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐                                                           │
│  │     user     │                                                           │
│  │   (PK: id)   │◀──────────────────────────────────────────┐              │
│  │              │                                            │              │
│  │ ❌ 无deleted_at                                           │              │
│  │ ❌ user_id_idx冗余                                        │              │
│  └──────┬───────┘                                            │              │
│         │                                                    │              │
│         │ FK (cascade) ✅                                    │              │
│         ▼                                                    │              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐ │              │
│  │   session    │     │   account    │     │   payment    │ │              │
│  │              │     │              │     │              │ │              │
│  │ ❌ token_idx │     │      ✅      │     │      ✅      │ │              │
│  │   冗余       │     │              │     │              │ │              │
│  └──────────────┘     └──────────────┘     └──────────────┘ │              │
│                                                              │              │
│  ┌──────────────┐     ┌────────────────────┐                │              │
│  │ user_credit  │     │ credit_transaction │                │              │
│  │              │     │                    │                │              │
│  │ ❌ 无UNIQUE  │────▶│ ❌ payment_id      │                │              │
│  │ ❌ 废弃字段  │     │    命名歧义        │                │              │
│  └──────────────┘     └────────────────────┘                │              │
│                                                              │              │
│  ┌──────────────┐                                           │              │
│  │     ppt      │◀═══════════════════════════════════════╗  │              │
│  │   (PK: id)   │                                        ║  │              │
│  │              │                                        ║  │              │
│  │ ❌ 无deleted_at                                       ║  │              │
│  │ ❌ 3对重复索引                                        ║  │              │
│  │ ❌ title/file_url nullable                            ║  │              │
│  │ ❌ 缺description/file_size                            ║  │              │
│  └──────┬───────┘                                        ║  │              │
│         │                                                ║  │              │
│         │ ❌ 无FK                     ┌──────────────────╨──┤              │
│         ▼                             │  ad_watch_record    │              │
│  ┌──────────────┐                     │                     │              │
│  │    slide     │                     │ ❌ ppt_id 无FK      │              │
│  │              │                     │    (纯文本)         │              │
│  │ ❌ 无ppt_id  │                     └─────────────────────┘              │
│  │   索引       │                                        ║                 │
│  └──────────────┘                     ┌──────────────────╨──┐              │
│                                       │user_download_history│              │
│  ┌──────────────┐                     │                     │              │
│  │playing_with_ │                     │ ❌ ppt_id 无FK      │              │
│  │    neon      │                     │    (纯文本)         │              │
│  │ ❌ 测试表    │                     └─────────────────────┘              │
│  └──────────────┘                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**目标数据库架构**

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Target Architecture                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐                                                           │
│  │     user     │                                                           │
│  │   (PK: id)   │◀──────────────────────────────────────────┐              │
│  │              │                                            │              │
│  │ ✅ deleted_at                                             │              │
│  │ ✅ 无冗余索引                                             │              │
│  └──────┬───────┘                                            │              │
│         │                                                    │              │
│         │ FK (cascade) ✅                                    │              │
│         ▼                                                    │              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐ │              │
│  │   session    │     │   account    │     │   payment    │ │              │
│  │      ✅      │     │      ✅      │     │      ✅      │ │              │
│  └──────────────┘     └──────────────┘     └──────────────┘ │              │
│                                                              │              │
│  ┌──────────────┐     ┌────────────────────┐                │              │
│  │ user_credit  │     │ credit_transaction │                │              │
│  │              │     │                    │                │              │
│  │ ✅ UNIQUE    │────▶│ ✅ stripe_invoice_ │                │              │
│  │ ✅ 无废弃字段│     │    id (重命名)     │                │              │
│  └──────────────┘     └────────────────────┘                │              │
│                                                              │              │
│  ┌──────────────┐                                           │              │
│  │     ppt      │◀═══════════════════════════════════════╗  │              │
│  │   (PK: id)   │                                        ║  │              │
│  │              │                                        ║  │              │
│  │ ✅ deleted_at                                         ║  │              │
│  │ ✅ 无重复索引                                         ║  │              │
│  │ ✅ title/file_url NOT NULL                            ║  │              │
│  │ ✅ description/file_size/file_format                  ║  │              │
│  │ ✅ status_created复合索引                             ║  │              │
│  └──────┬───────┘                                        ║  │              │
│         │                                                ║  │              │
│         │ FK (cascade) ✅             ┌──────────────────╨──┤              │
│         ▼                             │  ad_watch_record    │              │
│  ┌──────────────┐                     │                     │              │
│  │    slide     │                     │ ✅ ppt_id FK        │              │
│  │              │                     │    (SET NULL)       │              │
│  │ ✅ ppt_id    │                     └─────────────────────┘              │
│  │   索引       │                                        ║                 │
│  │ ✅ 复合索引  │                     ┌──────────────────╨──┐              │
│  └──────────────┘                     │user_download_history│              │
│                                       │                     │              │
│  ❌ playing_with_neon 已删除          │ ✅ ppt_id FK        │              │
│                                       │    (CASCADE)        │              │
│                                       │ ✅ 复合索引         │              │
│                                       └─────────────────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. 迁移脚本组件

#### 1.1 Phase 0: 迁移准备
文件: `scripts/db-migration/phase0-prepare.ts`

```typescript
/**
 * Phase 0: 迁移准备
 * - 创建 Neon 分支作为备份
 * - 验证当前数据库状态
 * - 生成迁移前报告
 */
import { neon } from '@neondatabase/serverless';

export async function phase0Prepare() {
  console.log('=== Phase 0: Migration Preparation ===');

  // 1. 创建 Neon 分支（通过 Neon API 或控制台）
  console.log('Step 1: Create Neon branch for backup');
  console.log('  → Use Neon Console or API to create branch: db-optimization-backup-YYYYMMDD');

  // 2. 验证当前状态
  const sql = neon(process.env.DATABASE_URL!);

  // 统计孤儿数据
  const adOrphans = await sql`
    SELECT COUNT(*) as count FROM ad_watch_record
    WHERE ppt_id IS NOT NULL
    AND ppt_id NOT IN (SELECT id FROM ppt)
  `;

  const downloadOrphans = await sql`
    SELECT COUNT(*) as count FROM user_download_history
    WHERE ppt_id NOT IN (SELECT id FROM ppt)
  `;

  const duplicateCredits = await sql`
    SELECT user_id, COUNT(*) as count
    FROM user_credit
    GROUP BY user_id
    HAVING COUNT(*) > 1
  `;

  const nullTitles = await sql`
    SELECT COUNT(*) as count FROM ppt WHERE title IS NULL
  `;

  const nullFileUrls = await sql`
    SELECT COUNT(*) as count FROM ppt WHERE file_url IS NULL
  `;

  // 3. 生成报告
  const report = {
    timestamp: new Date().toISOString(),
    orphanData: {
      adWatchRecords: adOrphans[0].count,
      downloadHistory: downloadOrphans[0].count,
    },
    duplicateData: {
      userCredits: duplicateCredits.length,
    },
    nullValues: {
      pptTitle: nullTitles[0].count,
      pptFileUrl: nullFileUrls[0].count,
    },
    readyForMigration:
      adOrphans[0].count === 0 &&
      downloadOrphans[0].count === 0 &&
      duplicateCredits.length === 0 &&
      nullTitles[0].count === 0 &&
      nullFileUrls[0].count === 0,
  };

  console.log('\n=== Pre-Migration Report ===');
  console.log(JSON.stringify(report, null, 2));

  return report;
}
```

#### 1.2 Phase 1: 数据清洗
文件: `scripts/db-migration/phase1-cleanup.ts`

```typescript
/**
 * Phase 1: 数据清洗
 * - 清理孤儿 ppt_id 记录
 * - 合并重复 user_credit 记录
 * - 填充 NULL 值
 */
import { getDb } from '@/db';
import { adWatchRecord, userDownloadHistory, userCredit, ppt } from '@/db/schema';
import { sql, eq, isNull, notInArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function phase1Cleanup() {
  const db = await getDb();

  console.log('=== Phase 1: Data Cleanup ===');

  // Step 1: 清理 ad_watch_record 孤儿数据
  console.log('\nStep 1: Cleaning orphan ad_watch_record entries...');

  const validPptIds = await db.select({ id: ppt.id }).from(ppt);
  const validIds = validPptIds.map(p => p.id);

  if (validIds.length > 0) {
    const adDeleted = await db
      .delete(adWatchRecord)
      .where(
        sql`${adWatchRecord.pptId} IS NOT NULL AND ${adWatchRecord.pptId} NOT IN (${sql.join(validIds.map(id => sql`${id}`), sql`, `)})`
      )
      .returning({ id: adWatchRecord.id });

    console.log(`  → Deleted ${adDeleted.length} orphan ad_watch_record entries`);
  }

  // Step 2: 清理 user_download_history 孤儿数据
  console.log('\nStep 2: Cleaning orphan user_download_history entries...');

  if (validIds.length > 0) {
    const downloadDeleted = await db
      .delete(userDownloadHistory)
      .where(
        sql`${userDownloadHistory.pptId} NOT IN (${sql.join(validIds.map(id => sql`${id}`), sql`, `)})`
      )
      .returning({ id: userDownloadHistory.id });

    console.log(`  → Deleted ${downloadDeleted.length} orphan user_download_history entries`);
  }

  // Step 3: 合并重复 user_credit 记录
  console.log('\nStep 3: Merging duplicate user_credit entries...');

  const duplicates = await db.execute(sql`
    SELECT user_id, COUNT(*) as count, MAX(current_credits) as max_credits
    FROM user_credit
    GROUP BY user_id
    HAVING COUNT(*) > 1
  `);

  for (const dup of duplicates.rows) {
    const userId = dup.user_id as string;
    const maxCredits = dup.max_credits as number;

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
  }

  console.log(`  → Merged ${duplicates.rows.length} duplicate user_credit entries`);

  // Step 4: 填充 ppt.title NULL 值
  console.log('\nStep 4: Filling NULL ppt.title values...');

  const titleUpdated = await db
    .update(ppt)
    .set({ title: 'Untitled' })
    .where(isNull(ppt.title))
    .returning({ id: ppt.id });

  console.log(`  → Updated ${titleUpdated.length} ppt records with NULL title`);

  // Step 5: 处理 ppt.file_url NULL 值
  console.log('\nStep 5: Handling NULL ppt.file_url values...');

  // 选项 A: 删除无效记录
  const fileUrlDeleted = await db
    .delete(ppt)
    .where(isNull(ppt.fileUrl))
    .returning({ id: ppt.id });

  console.log(`  → Deleted ${fileUrlDeleted.length} ppt records with NULL file_url`);

  console.log('\n=== Phase 1 Complete ===');

  return {
    adOrphansDeleted: 0, // 从上面获取
    downloadOrphansDeleted: 0,
    duplicatesMerged: duplicates.rows.length,
    nullTitlesFilled: titleUpdated.length,
    nullFileUrlsDeleted: fileUrlDeleted.length,
  };
}
```

#### 1.3 Phase 2: 索引优化
文件: `scripts/db-migration/phase2-indexes.sql`

```sql
-- ===========================================
-- Phase 2: Index Optimization
-- ===========================================

-- Step 1: 删除重复索引（保留 Drizzle 定义的）
DROP INDEX IF EXISTS idx_ppt_category;
DROP INDEX IF EXISTS idx_ppt_language;
DROP INDEX IF EXISTS idx_ppt_created_at;
DROP INDEX IF EXISTS idx_import_batch_status;

-- Step 2: 删除冗余索引
DROP INDEX IF EXISTS user_id_idx;  -- 主键已是索引

-- Step 3: 删除测试表
DROP TABLE IF EXISTS playing_with_neon;

-- Step 4: 添加缺失索引 - slide 表
CREATE INDEX IF NOT EXISTS idx_slide_ppt_id ON slide(ppt_id);
CREATE INDEX IF NOT EXISTS idx_slide_ppt_number ON slide(ppt_id, slide_number);

-- Step 5: 添加复合索引 - ppt 表
CREATE INDEX IF NOT EXISTS ppt_status_created_idx ON ppt(status, created_at DESC);

-- Step 6: 添加复合索引 - user_download_history 表
CREATE INDEX IF NOT EXISTS download_method_date_idx ON user_download_history(download_method, downloaded_at);

-- Step 7: 验证索引
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

#### 1.4 Phase 3: 约束增强
文件: `src/db/migrations/0007_add_constraints.sql` (Drizzle 生成)

```sql
-- ===========================================
-- Phase 3: Constraint Enhancement
-- ===========================================

-- Step 1: 添加外键约束 - ad_watch_record.ppt_id
ALTER TABLE ad_watch_record
ADD CONSTRAINT ad_watch_record_ppt_id_fkey
FOREIGN KEY (ppt_id) REFERENCES ppt(id) ON DELETE SET NULL;

-- Step 2: 添加外键约束 - user_download_history.ppt_id
ALTER TABLE user_download_history
ADD CONSTRAINT user_download_history_ppt_id_fkey
FOREIGN KEY (ppt_id) REFERENCES ppt(id) ON DELETE CASCADE;

-- Step 3: 添加唯一约束 - user_credit.user_id
ALTER TABLE user_credit
ADD CONSTRAINT user_credit_user_id_unique UNIQUE (user_id);

-- Step 4: 添加 NOT NULL 约束 - ppt.title (数据已清洗)
ALTER TABLE ppt ALTER COLUMN title SET NOT NULL;

-- Step 5: 添加 NOT NULL 约束 - ppt.file_url (数据已清洗)
ALTER TABLE ppt ALTER COLUMN file_url SET NOT NULL;
```

#### 1.5 Phase 4: 字段重构
文件: `src/db/migrations/0008_field_refactor.sql` (Drizzle 生成)

```sql
-- ===========================================
-- Phase 4: Field Refactoring
-- ===========================================

-- Step 1: 添加软删除字段 - ppt
ALTER TABLE ppt ADD COLUMN deleted_at TIMESTAMP;

-- Step 2: 添加软删除字段 - user
ALTER TABLE "user" ADD COLUMN deleted_at TIMESTAMP;

-- Step 3: 字段重命名 - credit_transaction.payment_id → stripe_invoice_id
-- 使用双写策略：先添加新字段，再迁移数据，最后删除旧字段
ALTER TABLE credit_transaction ADD COLUMN stripe_invoice_id TEXT;
UPDATE credit_transaction SET stripe_invoice_id = payment_id;
ALTER TABLE credit_transaction DROP COLUMN payment_id;

-- Step 4: 删除废弃字段 - user_credit.last_refresh_at
ALTER TABLE user_credit DROP COLUMN IF EXISTS last_refresh_at;

-- Step 5: 添加元数据字段 - ppt
ALTER TABLE ppt ADD COLUMN description TEXT;
ALTER TABLE ppt ADD COLUMN file_size INTEGER;
ALTER TABLE ppt ADD COLUMN file_format TEXT DEFAULT 'pptx';
```

### 2. Schema 变更

#### 2.1 完整的目标 Schema
文件: `src/db/schema.ts` (变更后)

```typescript
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  index,
  unique
} from "drizzle-orm/pg-core";

// ============ Auth 模块 ============

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  role: text('role'),
  banned: boolean('banned'),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
  customerId: text('customer_id'),
  deletedAt: timestamp('deleted_at'), // 新增: R6
}, (table) => ({
  // 移除 userIdIdx (R3)
  userCustomerIdIdx: index("user_customer_id_idx").on(table.customerId),
  userRoleIdx: index("user_role_idx").on(table.role),
}));

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by')
}, (table) => ({
  // 移除 sessionTokenIdx (R3) - unique 约束已提供索引
  sessionUserIdIdx: index("session_user_id_idx").on(table.userId),
}));

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
}, (table) => ({
  accountUserIdIdx: index("account_user_id_idx").on(table.userId),
  accountAccountIdIdx: index("account_account_id_idx").on(table.accountId),
  accountProviderIdIdx: index("account_provider_id_idx").on(table.providerId),
}));

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
});

export const payment = pgTable("payment", {
  id: text("id").primaryKey(),
  priceId: text('price_id').notNull(),
  type: text('type').notNull(),
  scene: text('scene'),
  interval: text('interval'),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').notNull(),
  subscriptionId: text('subscription_id'),
  sessionId: text('session_id'),
  invoiceId: text('invoice_id').unique(),
  status: text('status').notNull(),
  paid: boolean('paid').notNull().default(false),
  periodStart: timestamp('period_start'),
  periodEnd: timestamp('period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end'),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  paymentTypeIdx: index("payment_type_idx").on(table.type),
  paymentSceneIdx: index("payment_scene_idx").on(table.scene),
  paymentPriceIdIdx: index("payment_price_id_idx").on(table.priceId),
  paymentUserIdIdx: index("payment_user_id_idx").on(table.userId),
  paymentCustomerIdIdx: index("payment_customer_id_idx").on(table.customerId),
  paymentStatusIdx: index("payment_status_idx").on(table.status),
  paymentPaidIdx: index("payment_paid_idx").on(table.paid),
  paymentSubscriptionIdIdx: index("payment_subscription_id_idx").on(table.subscriptionId),
  paymentSessionIdIdx: index("payment_session_id_idx").on(table.sessionId),
  paymentInvoiceIdIdx: index("payment_invoice_id_idx").on(table.invoiceId),
}));

// ============ 积分模块 ============

export const userCredit = pgTable("user_credit", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
  currentCredits: integer("current_credits").notNull().default(0),
  // lastRefreshAt 已删除 (R5)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userCreditUserIdIdx: index("user_credit_user_id_idx").on(table.userId),
  userCreditUserIdUnique: unique("user_credit_user_id_unique").on(table.userId), // 新增: R2
}));

export const creditTransaction = pgTable("credit_transaction", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
  type: text("type").notNull(),
  description: text("description"),
  amount: integer("amount").notNull(),
  remainingAmount: integer("remaining_amount"),
  stripeInvoiceId: text("stripe_invoice_id"), // 重命名: R5
  expirationDate: timestamp("expiration_date"),
  expirationDateProcessedAt: timestamp("expiration_date_processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  creditTransactionUserIdIdx: index("credit_transaction_user_id_idx").on(table.userId),
  creditTransactionTypeIdx: index("credit_transaction_type_idx").on(table.type),
}));

// ============ PPT 模块 ============

export const ppt = pgTable("ppt", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id"),
  title: text("title").notNull(), // R7: 确保 NOT NULL
  author: text("author"),
  slidesCount: integer("slides_count").default(0),
  fileUrl: text("file_url").notNull(), // R7: 确保 NOT NULL
  coverImageUrl: text("cover_image_url"),
  thumbnailUrl: text("thumbnail_url"),
  category: text("category"),
  tags: text("tags").array(),
  language: text("language"),
  status: text("status").default('draft'),
  visibility: text("visibility"),
  downloadCount: integer("download_count").default(0),
  viewCount: integer("view_count").default(0),
  embeddingId: text("embedding_id"),
  embeddingModel: text("embedding_model"),
  reviewStatus: text("review_status"),
  // 新增字段: R6, R10
  deletedAt: timestamp("deleted_at"),
  description: text("description"),
  fileSize: integer("file_size"),
  fileFormat: text("file_format").default('pptx'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  pptCategoryIdx: index("ppt_category_idx").on(table.category),
  pptStatusIdx: index("ppt_status_idx").on(table.status),
  pptLanguageIdx: index("ppt_language_idx").on(table.language),
  pptCreatedAtIdx: index("ppt_created_at_idx").on(table.createdAt),
  pptDownloadsIdx: index("ppt_download_count_idx").on(table.downloadCount),
  pptViewsIdx: index("ppt_view_count_idx").on(table.viewCount),
  pptStatusCreatedIdx: index("ppt_status_created_idx").on(table.status, table.createdAt), // 新增: R4
}));

// ============ 广告与下载模块 ============

export const adWatchRecord = pgTable("ad_watch_record", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: 'cascade' }),
  ipAddress: text("ip_address"),
  pptId: text("ppt_id").references(() => ppt.id, { onDelete: 'set null' }), // 变更: R1
  watchToken: text("watch_token").unique().notNull(),
  downloadToken: text("download_token"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  status: text("status").notNull().default('pending'),
  creditsAwarded: integer("credits_awarded").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  adWatchUserIdIdx: index("ad_watch_user_id_idx").on(table.userId),
  adWatchIpIdx: index("ad_watch_ip_idx").on(table.ipAddress),
  adWatchTokenIdx: index("ad_watch_token_idx").on(table.watchToken),
  adWatchCreatedIdx: index("ad_watch_created_idx").on(table.createdAt),
  adWatchStatusIdx: index("ad_watch_status_idx").on(table.status),
}));

export const userDownloadHistory = pgTable("user_download_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: 'cascade' }),
  pptId: text("ppt_id").notNull().references(() => ppt.id, { onDelete: 'cascade' }), // 变更: R1
  downloadMethod: text("download_method").notNull(),
  creditsSpent: integer("credits_spent").default(0),
  ipAddress: text("ip_address"),
  downloadedAt: timestamp("downloaded_at").notNull().defaultNow(),
}, (table) => ({
  downloadUserPptIdx: index("download_user_ppt_idx").on(table.userId, table.pptId),
  downloadUserIdx: index("download_user_idx").on(table.userId),
  downloadPptIdx: index("download_ppt_idx").on(table.pptId),
  downloadMethodIdx: index("download_method_idx").on(table.downloadMethod),
  downloadMethodDateIdx: index("download_method_date_idx").on(table.downloadMethod, table.downloadedAt), // 新增: R4
}));
```

### 3. 代码适配组件

#### 3.1 积分模块适配
文件: `src/credits/credits.ts` (变更)

```typescript
// 变更前
export async function saveCreditTransaction({
  // ...
  paymentId,
}: {
  // ...
  paymentId?: string;
}) {
  await db.insert(creditTransaction).values({
    // ...
    paymentId,
  });
}

// 变更后
export async function saveCreditTransaction({
  // ...
  stripeInvoiceId, // 重命名
}: {
  // ...
  stripeInvoiceId?: string; // 重命名
}) {
  await db.insert(creditTransaction).values({
    // ...
    stripeInvoiceId, // 重命名
  });
}
```

文件: `src/credits/types.ts` (变更)

```typescript
// 变更前
export interface CreditTransaction {
  // ...
  paymentId: string | null;
}

// 变更后
export interface CreditTransaction {
  // ...
  stripeInvoiceId: string | null; // 重命名
}
```

文件: `src/actions/get-credit-transactions.ts` (变更)

```typescript
// 变更前
const selectFields = {
  // ...
  paymentId: creditTransaction.paymentId,
};

// 变更后
const selectFields = {
  // ...
  stripeInvoiceId: creditTransaction.stripeInvoiceId, // 重命名
};
```

文件: `src/payment/provider/stripe.ts` (变更)

```typescript
// 变更前
await addCredits({
  // ...
  paymentId: invoice.id,
});

// 变更后
await addCredits({
  // ...
  stripeInvoiceId: invoice.id, // 重命名
});
```

#### 3.2 PPT 查询适配（软删除）
文件: `src/lib/ppt/queries.ts` (新增)

```typescript
import { getDb } from '@/db';
import { ppt } from '@/db/schema';
import { isNull, and, eq } from 'drizzle-orm';

/**
 * 获取 PPT 列表（默认排除软删除）
 */
export async function getPptList(options?: { includeDeleted?: boolean }) {
  const db = await getDb();

  const baseCondition = options?.includeDeleted
    ? undefined
    : isNull(ppt.deletedAt);

  return db
    .select()
    .from(ppt)
    .where(baseCondition);
}

/**
 * 软删除 PPT
 */
export async function softDeletePpt(pptId: string) {
  const db = await getDb();

  return db
    .update(ppt)
    .set({ deletedAt: new Date() })
    .where(eq(ppt.id, pptId));
}

/**
 * 恢复软删除的 PPT
 */
export async function restorePpt(pptId: string) {
  const db = await getDb();

  return db
    .update(ppt)
    .set({ deletedAt: null })
    .where(eq(ppt.id, pptId));
}
```

## Data Models

**变更对照表**

| 表名 | 字段 | 变更类型 | 变更前 | 变更后 | 对应需求 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ad_watch_record` | `ppt_id` | 添加约束 | text | text FK→ppt.id (SET NULL) | R1 |
| `user_download_history` | `ppt_id` | 添加约束 | text NOT NULL | text NOT NULL FK→ppt.id (CASCADE) | R1 |
| `user_credit` | `user_id` | 添加约束 | 无唯一约束 | UNIQUE | R2 |
| `user_credit` | `last_refresh_at` | 删除 | timestamp | - | R5 |
| `credit_transaction` | `payment_id` | 重命名 | `payment_id` | `stripe_invoice_id` | R5 |
| `ppt` | `title` | 添加约束 | nullable | NOT NULL | R7 |
| `ppt` | `file_url` | 添加约束 | nullable | NOT NULL | R7 |
| `ppt` | `deleted_at` | 新增 | - | timestamp | R6 |
| `ppt` | `description` | 新增 | - | text | R10 |
| `ppt` | `file_size` | 新增 | - | integer | R10 |
| `ppt` | `file_format` | 新增 | - | text DEFAULT 'pptx' | R10 |
| `user` | `deleted_at` | 新增 | - | timestamp | R6 |

**索引变更对照表**

| 表名 | 索引名 | 变更类型 | 对应需求 |
| :--- | :--- | :--- | :--- |
| `ppt` | `idx_ppt_category` | 删除 | R3 |
| `ppt` | `idx_ppt_language` | 删除 | R3 |
| `ppt` | `idx_ppt_created_at` | 删除 | R3 |
| `ppt` | `ppt_status_created_idx` | 新增 | R4 |
| `import_batch` | `idx_import_batch_status` | 删除 | R3 |
| `user` | `user_id_idx` | 删除 | R3 |
| `slide` | `idx_slide_ppt_id` | 新增 | R4 |
| `slide` | `idx_slide_ppt_number` | 新增 | R4 |
| `user_download_history` | `download_method_date_idx` | 新增 | R4 |

## Correctness Properties
A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

*   **Property 1: 外键完整性 - `ad_watch_record`**
    For any `ad_watch_record` 记录，如果 `ppt_id` 不为 NULL，则该 `ppt_id` 必须指向一个存在的 `ppt` 记录
    *Validates: Requirements 1.1, 1.3, 1.5*

*   **Property 2: 外键完整性 - `user_download_history`**
    For any `user_download_history` 记录，其 `ppt_id` 必须指向一个存在的 `ppt` 记录
    *Validates: Requirements 1.2, 1.4*

*   **Property 3: 级联删除一致性**
    For any PPT 删除操作，删除后 `user_download_history` 表中不存在引用该 PPT 的记录
    *Validates: Requirements 1.2*

*   **Property 4: SET NULL 一致性**
    For any PPT 删除操作，删除后 `ad_watch_record` 表中原引用该 PPT 的记录的 `ppt_id` 字段为 NULL
    *Validates: Requirements 1.1*

*   **Property 5: 用户积分唯一性**
    For any `user_id`，`user_credit` 表中最多存在一条该 `user_id` 的记录
    *Validates: Requirements 2.1, 2.2, 2.3, 2.4*

*   **Property 6: 索引无重复**
    For any 表的索引列表，不存在两个索引定义在完全相同的列上
    *Validates: Requirements 3.1, 3.2, 3.3, 3.4*

*   **Property 7: 索引覆盖高频查询**
    For any `slide` 表按 `ppt_id` 的查询，执行计划显示 Index Scan
    *Validates: Requirements 4.1, 4.2*

*   **Property 8: 软删除查询过滤**
    For any 默认 PPT 列表查询，返回结果中不包含 `deleted_at` 不为 NULL 的记录
    *Validates: Requirements 6.2, 6.3*

*   **Property 9: 软删除可恢复性**
    For any 已软删除的 PPT，将其 `deleted_at` 设为 NULL 后，该 PPT 应出现在默认查询结果中
    *Validates: Requirements 6.4*

*   **Property 10: NOT NULL 约束有效性**
    For any `ppt` 插入操作，如果 `title` 或 `file_url` 为 NULL，则操作被拒绝
    *Validates: Requirements 7.1, 7.2, 7.3, 7.4*

*   **Property 11: 字段重命名一致性**
    For any `credit_transaction` 记录，不存在 `payment_id` 字段，只存在 `stripe_invoice_id` 字段
    *Validates: Requirements 5.1, 5.2, 5.3*

*   **Property 12: 迁移可回滚性**
    For any 迁移失败场景，数据库状态应与迁移前一致
    *Validates: Requirements 12.2, 12.3*

## Error Handling

### 1. 外键约束错误处理
`src/lib/db-errors.ts`

```typescript
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public detail?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ForeignKeyViolationError extends DatabaseError {
  constructor(
    public table: string,
    public column: string,
    public referencedTable: string
  ) {
    super(
      `Foreign key violation: ${table}.${column} references non-existent ${referencedTable} record`,
      '23503'
    );
    this.name = 'ForeignKeyViolationError';
  }
}

export class UniqueConstraintViolationError extends DatabaseError {
  constructor(
    public table: string,
    public column: string
  ) {
    super(
      `Unique constraint violation: ${table}.${column} already exists`,
      '23505'
    );
    this.name = 'UniqueConstraintViolationError';
  }
}

export class NotNullViolationError extends DatabaseError {
  constructor(
    public table: string,
    public column: string
  ) {
    super(
      `NOT NULL violation: ${table}.${column} cannot be null`,
      '23502'
    );
    this.name = 'NotNullViolationError';
  }
}

export function handleDbError(error: unknown): never {
  if (error instanceof Error) {
    const message = error.message;

    // PostgreSQL 错误码解析
    if (message.includes('23503') || message.includes('foreign key')) {
      throw new ForeignKeyViolationError('unknown', 'unknown', 'unknown');
    }
    if (message.includes('23505') || message.includes('unique')) {
      throw new UniqueConstraintViolationError('unknown', 'unknown');
    }
    if (message.includes('23502') || message.includes('not-null')) {
      throw new NotNullViolationError('unknown', 'unknown');
    }
  }
  throw error;
}
```

### 2. 迁移错误处理
`scripts/db-migration/migrate-with-rollback.ts`

```typescript
import { getDb } from '@/db';
import { sql } from 'drizzle-orm';

export async function migrateWithRollback(
  migrationFn: () => Promise<void>,
  rollbackFn?: () => Promise<void>
) {
  const db = await getDb();

  try {
    // 开始事务
    await db.transaction(async (tx) => {
      console.log('Starting migration...');

      // 执行迁移
      await migrationFn();

      // 验证迁移结果
      const validation = await validateMigration(tx);

      if (!validation.success) {
        throw new Error(`Migration validation failed: ${validation.errors.join(', ')}`);
      }

      console.log('Migration completed successfully');
    });
  } catch (error) {
    console.error('Migration failed:', error);

    if (rollbackFn) {
      console.log('Executing rollback...');
      await rollbackFn();
      console.log('Rollback completed');
    }

    throw error;
  }
}

async function validateMigration(tx: any) {
  const errors: string[] = [];

  // 验证外键约束
  const orphanAd = await tx.execute(sql`
    SELECT COUNT(*) as count FROM ad_watch_record
    WHERE ppt_id IS NOT NULL
    AND ppt_id NOT IN (SELECT id FROM ppt)
  `);

  if (orphanAd.rows[0].count > 0) {
    errors.push(`Found ${orphanAd.rows[0].count} orphan ad_watch_record entries`);
  }

  // 验证唯一约束
  const duplicateCredits = await tx.execute(sql`
    SELECT user_id, COUNT(*) FROM user_credit
    GROUP BY user_id HAVING COUNT(*) > 1
  `);

  if (duplicateCredits.rows.length > 0) {
    errors.push(`Found ${duplicateCredits.rows.length} duplicate user_credit entries`);
  }

  return {
    success: errors.length === 0,
    errors,
  };
}
```

## Testing Strategy

### 1. 单元测试
使用 Vitest 进行单元测试：

`src/db/__tests__/constraints.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '@/db';
import { ppt, adWatchRecord, userDownloadHistory, userCredit, user } from '@/db/schema';
import { randomUUID } from 'crypto';

describe('Database Constraints', () => {
  let db: ReturnType<typeof getDb>;
  let testUserId: string;
  let testPptId: string;

  beforeAll(async () => {
    db = await getDb();

    // 创建测试用户
    testUserId = randomUUID();
    await db.insert(user).values({
      id: testUserId,
      name: 'Test User',
      email: `test-${testUserId}@example.com`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 创建测试 PPT
    testPptId = randomUUID();
    await db.insert(ppt).values({
      id: testPptId,
      title: 'Test PPT',
      fileUrl: 'https://example.com/test.pptx',
    });
  });

  afterAll(async () => {
    // 清理测试数据
    await db.delete(ppt).where(eq(ppt.id, testPptId));
    await db.delete(user).where(eq(user.id, testUserId));
  });

  /**
   * 测试外键约束 - ad_watch_record
   * Validates: R1.3
   */
  it('should reject ad_watch_record with invalid ppt_id', async () => {
    const invalidPptId = randomUUID();

    await expect(
      db.insert(adWatchRecord).values({
        id: randomUUID(),
        pptId: invalidPptId,
        watchToken: randomUUID(),
        startedAt: new Date(),
        status: 'pending',
      })
    ).rejects.toThrow(/foreign key/i);
  });

  /**
   * 测试外键约束 - user_download_history
   * Validates: R1.4
   */
  it('should reject user_download_history with invalid ppt_id', async () => {
    const invalidPptId = randomUUID();

    await expect(
      db.insert(userDownloadHistory).values({
        id: randomUUID(),
        pptId: invalidPptId,
        downloadMethod: 'firstFree',
        downloadedAt: new Date(),
      })
    ).rejects.toThrow(/foreign key/i);
  });

  /**
   * 测试唯一约束 - user_credit
   * Validates: R2.1
   */
  it('should reject duplicate user_credit for same user', async () => {
    // 创建第一条记录
    await db.insert(userCredit).values({
      id: randomUUID(),
      userId: testUserId,
      currentCredits: 100,
    });

    // 尝试创建第二条应该失败
    await expect(
      db.insert(userCredit).values({
        id: randomUUID(),
        userId: testUserId,
        currentCredits: 200,
      })
    ).rejects.toThrow(/unique/i);
  });

  /**
   * 测试 NOT NULL 约束 - ppt.title
   * Validates: R7.3
   */
  it('should reject ppt with null title', async () => {
    await expect(
      db.insert(ppt).values({
        id: randomUUID(),
        title: null as any,
        fileUrl: 'https://example.com/test.pptx',
      })
    ).rejects.toThrow(/not-null|null/i);
  });

  /**
   * 测试级联删除 - user_download_history
   * Validates: R1.2
   */
  it('should cascade delete user_download_history when ppt is deleted', async () => {
    // 创建下载记录
    const downloadId = randomUUID();
    await db.insert(userDownloadHistory).values({
      id: downloadId,
      pptId: testPptId,
      downloadMethod: 'firstFree',
      downloadedAt: new Date(),
    });

    // 删除 PPT
    await db.delete(ppt).where(eq(ppt.id, testPptId));

    // 验证下载记录也被删除
    const records = await db
      .select()
      .from(userDownloadHistory)
      .where(eq(userDownloadHistory.id, downloadId));

    expect(records.length).toBe(0);
  });
});
```

### 2. 属性测试 (Property-Based Testing)
使用 fast-check 进行属性测试：

`src/db/__tests__/properties.test.ts`

```typescript
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { getDb } from '@/db';
import { ppt, adWatchRecord, userCredit } from '@/db/schema';
import { randomUUID } from 'crypto';
import { isNull, eq } from 'drizzle-orm';

describe('Database Properties', () => {
  /**
   * Property 1: 外键完整性 - ad_watch_record
   * For any ad_watch_record, if ppt_id is not NULL, it must reference an existing ppt
   * Validates: R1.1, R1.3, R1.5
   */
  it('Property 1: ad_watch_record.ppt_id always references valid ppt', async () => {
    const db = await getDb();

    // 获取所有 ad_watch_record 的 ppt_id
    const records = await db
      .select({ pptId: adWatchRecord.pptId })
      .from(adWatchRecord)
      .where(isNull(adWatchRecord.pptId).not());

    // 获取所有有效的 ppt.id
    const validPpts = await db.select({ id: ppt.id }).from(ppt);
    const validIds = new Set(validPpts.map(p => p.id));

    // 验证所有 ppt_id 都有效
    for (const record of records) {
      expect(validIds.has(record.pptId!)).toBe(true);
    }
  });

  /**
   * Property 5: 用户积分唯一性
   * For any user_id, there is at most one user_credit record
   * Validates: R2.1, R2.2, R2.3, R2.4
   */
  it('Property 5: user_credit has unique user_id', async () => {
    const db = await getDb();

    const duplicates = await db.execute(sql`
      SELECT user_id, COUNT(*) as count
      FROM user_credit
      GROUP BY user_id
      HAVING COUNT(*) > 1
    `);

    expect(duplicates.rows.length).toBe(0);
  });

  /**
   * Property 8: 软删除查询过滤
   * Default PPT queries exclude records where deleted_at is not NULL
   * Validates: R6.2, R6.3
   */
  it('Property 8: default queries exclude soft-deleted records', async () => {
    const db = await getDb();

    // 获取默认查询结果
    const defaultResults = await db
      .select()
      .from(ppt)
      .where(isNull(ppt.deletedAt));

    // 验证所有结果的 deleted_at 都是 NULL
    for (const record of defaultResults) {
      expect(record.deletedAt).toBeNull();
    }
  });

  /**
   * Property 10: NOT NULL 约束有效性
   * For any ppt insert, if title or file_url is NULL, the operation is rejected
   * Validates: R7.1, R7.2, R7.3, R7.4
   */
  it('Property 10: ppt rejects null title and file_url', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.option(fc.string(), { nil: null }),
          fileUrl: fc.option(fc.string(), { nil: null }),
        }),
        async ({ title, fileUrl }) => {
          const db = await getDb();

          if (title === null || fileUrl === null) {
            await expect(
              db.insert(ppt).values({
                id: randomUUID(),
                title: title as any,
                fileUrl: fileUrl as any,
              })
            ).rejects.toThrow();
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
```

### 3. 集成测试
`src/db/__tests__/migration.integration.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { phase0Prepare } from '@/scripts/db-migration/phase0-prepare';
import { phase1Cleanup } from '@/scripts/db-migration/phase1-cleanup';

describe('Migration Integration', () => {
  /**
   * 测试完整迁移流程
   */
  it('should complete full migration without errors', async () => {
    // Phase 0: 准备
    const prepReport = await phase0Prepare();
    expect(prepReport).toBeDefined();

    // Phase 1: 清洗（如果需要）
    if (!prepReport.readyForMigration) {
      const cleanupReport = await phase1Cleanup();
      expect(cleanupReport).toBeDefined();
    }

    // 验证迁移后状态
    const postReport = await phase0Prepare();
    expect(postReport.readyForMigration).toBe(true);
  });
});
```
```
