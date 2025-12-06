```markdown
# Implementation Plan (tasks.md)

## Overview
本实施计划基于 Requirements v2.0 和 Design v2.0，将数据库优化分为 5 个阶段执行。每个阶段包含具体的编码任务，按依赖关系排序。

## Phase 0: 迁移准备
- [ ] **1. 创建迁移准备脚本和备份**
    - [ ] 1.1 **创建 Neon 数据库分支作为备份**
        - 通过 Neon Console 或 API 创建分支 `db-optimization-backup-YYYYMMDD`
        - 记录分支 ID 用于回滚
        - *Requirements: 12.1, 12.3*
    - [ ] 1.2 **创建迁移准备脚本** `scripts/db-migration/phase0-prepare.ts`
        - 实现数据库状态检查函数
        - 统计孤儿数据数量
        - 统计重复数据数量
        - 统计 NULL 值数量
        - 生成迁移前报告
        - *Requirements: 8.1, 8.2, 8.3, 8.4, 8.5*
    - [ ] 1.3 **编写属性测试验证迁移准备**
        - Property 12: 迁移可回滚性
        - *Validates: Requirements 12.2, 12.3*

## Phase 1: 数据清洗
- [ ] **2. 清洗孤儿数据**
    - [ ] 2.1 **创建数据清洗脚本** `scripts/db-migration/phase1-cleanup.ts`
        - 实现 `cleanOrphanAdWatchRecords()` 函数
        - 删除 `ad_watch_record` 中 `ppt_id` 指向不存在 PPT 的记录
        - *Requirements: 8.1*
    - [ ] 2.2 **清洗 user_download_history 孤儿数据**
        - 实现 `cleanOrphanDownloadHistory()` 函数
        - 删除 `user_download_history` 中 `ppt_id` 指向不存在 PPT 的记录
        - *Requirements: 8.2*
    - [ ] 2.3 **编写属性测试验证孤儿数据清洗**
        - Property 1: 外键完整性 - `ad_watch_record`
        - Property 2: 外键完整性 - `user_download_history`
        - *Validates: Requirements 1.5, 8.1, 8.2*

- [ ] **3. 清洗重复数据**
    - [ ] 3.1 **实现 user_credit 重复数据合并**
        - 实现 `cleanDuplicateUserCredits()` 函数
        - 找出同一 `user_id` 的多条记录
        - 保留积分最高的记录，删除其他记录
        - *Requirements: 8.3*
    - [ ] 3.2 **编写属性测试验证唯一性**
        - Property 5: 用户积分唯一性
        - *Validates: Requirements 2.3, 8.3*

- [ ] **4. 填充 NULL 值**
    - [ ] 4.1 **填充 ppt.title NULL 值**
        - 将所有 NULL title 更新为 `'Untitled'`
        - *Requirements: 8.4*
    - [ ] 4.2 **处理 ppt.file_url NULL 值**
        - 删除 `file_url` 为 NULL 的 PPT 记录（或填充占位 URL）
        - *Requirements: 8.5*
    - [ ] 4.3 **编写属性测试验证 NOT NULL**
        - Property 10: NOT NULL 约束有效性
        - *Validates: Requirements 7.3, 7.4, 8.4, 8.5*

- [ ] **5. Checkpoint - 验证数据清洗完成**
    - [ ] 运行 `phase0-prepare.ts` 验证 `readyForMigration = true`
    - [ ] 确保所有测试通过，如有问题询问用户

## Phase 2: 索引优化
- [ ] **6. 删除冗余索引**
    - [ ] 6.1 **创建索引清理 SQL 脚本** `scripts/db-migration/phase2-indexes.sql`
        - `DROP INDEX idx_ppt_category`
        - `DROP INDEX idx_ppt_language`
        - `DROP INDEX idx_ppt_created_at`
        - `DROP INDEX idx_import_batch_status`
        - `DROP INDEX user_id_idx`
        - *Requirements: 3.1, 3.2, 3.3, 3.4*
    - [ ] 6.2 **删除测试表**
        - `DROP TABLE playing_with_neon`
        - *Requirements: 9.1*
    - [ ] 6.3 **编写属性测试验证索引无重复**
        - Property 6: 索引无重复
        - *Validates: Requirements 3.1, 3.2, 3.3, 3.4*

- [ ] **7. 添加缺失索引**
    - [ ] 7.1 **添加 slide 表索引**
        - `CREATE INDEX idx_slide_ppt_id ON slide(ppt_id)`
        - `CREATE INDEX idx_slide_ppt_number ON slide(ppt_id, slide_number)`
        - *Requirements: 4.1, 4.2*
    - [ ] 7.2 **添加复合索引**
        - `CREATE INDEX ppt_status_created_idx ON ppt(status, created_at DESC)`
        - `CREATE INDEX download_method_date_idx ON user_download_history(download_method, downloaded_at)`
        - *Requirements: 4.3, 4.4*
    - [ ] 7.3 **编写属性测试验证索引生效**
        - Property 7: 索引覆盖高频查询
        - *Validates: Requirements 4.1, 4.2*

- [ ] **8. Checkpoint - 验证索引优化完成**
    - [ ] 运行 `EXPLAIN ANALYZE` 验证索引使用
    - [ ] 确保所有测试通过，如有问题询问用户

## Phase 3: 约束增强
- [ ] **9. 添加外键约束**
    - [ ] 9.1 **更新 schema.ts - ad_watch_record.ppt_id 外键**
        - 修改 `pptId` 字段添加 `.references(() => ppt.id, { onDelete: 'set null' })`
        - *Requirements: 1.1, 1.3*
    - [ ] 9.2 **更新 schema.ts - user_download_history.ppt_id 外键**
        - 修改 `pptId` 字段添加 `.references(() => ppt.id, { onDelete: 'cascade' })`
        - *Requirements: 1.2, 1.4*
    - [ ] 9.3 **生成并执行 Drizzle 迁移**
        - 运行 `pnpm db:generate`
        - 运行 `pnpm db:migrate`
        - *Requirements: 1.1, 1.2, 1.3, 1.4*
    - [ ] 9.4 **编写属性测试验证外键约束**
        - Property 1: 外键完整性 - `ad_watch_record`
        - Property 2: 外键完整性 - `user_download_history`
        - Property 3: 级联删除一致性
        - Property 4: SET NULL 一致性
        - *Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5*

- [ ] **10. 添加唯一约束**
    - [ ] 10.1 **更新 schema.ts - user_credit.user_id 唯一约束**
        - 添加 `userCreditUserIdUnique: unique("user_credit_user_id_unique").on(table.userId)`
        - *Requirements: 2.1, 2.4*
    - [ ] 10.2 **生成并执行 Drizzle 迁移**
        - 运行 `pnpm db:generate`
        - 运行 `pnpm db:migrate`
        - *Requirements: 2.1, 2.2*
    - [ ] 10.3 **编写属性测试验证唯一约束**
        - Property 5: 用户积分唯一性
        - *Validates: Requirements 2.1, 2.2, 2.3, 2.4*

- [ ] **11. 添加 NOT NULL 约束**
    - [ ] 11.1 **验证 schema.ts 中 ppt.title 和 ppt.file_url 已定义 notNull()**
        - 确认 `title: text("title").notNull()`
        - 确认 `fileUrl: text("file_url").notNull()`
        - *Requirements: 7.1, 7.2*
    - [ ] 11.2 **生成并执行 Drizzle 迁移（如需要）**
        - 运行 `pnpm db:generate`
        - 运行 `pnpm db:migrate`
        - *Requirements: 7.1, 7.2, 7.3, 7.4*
    - [ ] 11.3 **编写属性测试验证 NOT NULL 约束**
        - Property 10: NOT NULL 约束有效性
        - *Validates: Requirements 7.1, 7.2, 7.3, 7.4*

- [ ] **12. Checkpoint - 验证约束增强完成**
    - [ ] 使用 Drizzle Studio 验证约束
    - [ ] 确保所有测试通过，如有问题询问用户

## Phase 4: 字段重构
- [ ] **13. 字段重命名 - credit_transaction.payment_id**
    - [ ] 13.1 **更新 schema.ts 字段定义**
        - 将 `paymentId: text("payment_id")` 改为 `stripeInvoiceId: text("stripe_invoice_id")`
        - *Requirements: 5.1*
    - [ ] 13.2 **更新 src/credits/credits.ts**
        - 将所有 `paymentId` 引用改为 `stripeInvoiceId`
        - 更新 `saveCreditTransaction` 函数参数
        - *Requirements: 11.1*
    - [ ] 13.3 **更新 src/credits/types.ts**
        - 将 `CreditTransaction.paymentId` 改为 `stripeInvoiceId`
        - *Requirements: 11.2*
    - [ ] 13.4 **更新 src/actions/get-credit-transactions.ts**
        - 将查询字段 `paymentId` 改为 `stripeInvoiceId`
        - *Requirements: 11.3*
    - [ ] 13.5 **更新 src/payment/provider/stripe.ts**
        - 将 `paymentId: invoice.id` 改为 `stripeInvoiceId: invoice.id`
        - *Requirements: 11.4*
    - [ ] 13.6 **生成并执行 Drizzle 迁移**
        - 运行 `pnpm db:generate`
        - 运行 `pnpm db:migrate`
        - *Requirements: 5.1, 5.2*
    - [ ] 13.7 **编写属性测试验证字段重命名**
        - Property 11: 字段重命名一致性
        - *Validates: Requirements 5.1, 5.2, 5.3*

- [ ] **14. 删除废弃字段**
    - [ ] 14.1 **从 schema.ts 删除 user_credit.lastRefreshAt**
        - 删除 `lastRefreshAt: timestamp("last_refresh_at")` 行
        - *Requirements: 5.2*
    - [ ] 14.2 **生成并执行 Drizzle 迁移**
        - 运行 `pnpm db:generate`
        - 运行 `pnpm db:migrate`
        - *Requirements: 5.2*

- [ ] **15. 添加软删除字段**
    - [ ] 15.1 **更新 schema.ts - ppt 表添加 deleted_at**
        - 添加 `deletedAt: timestamp("deleted_at")`
        - *Requirements: 6.1*
    - [ ] 15.2 **更新 schema.ts - user 表添加 deleted_at**
        - 添加 `deletedAt: timestamp("deleted_at")`
        - *Requirements: 6.5*
    - [ ] 15.3 **创建软删除查询工具** `src/lib/ppt/queries.ts`
        - 实现 `getPptList({ includeDeleted?: boolean })`
        - 实现 `softDeletePpt(pptId: string)`
        - 实现 `restorePpt(pptId: string)`
        - *Requirements: 6.2, 6.3, 6.4, 11.5*
    - [ ] 15.4 **生成并执行 Drizzle 迁移**
        - 运行 `pnpm db:generate`
        - 运行 `pnpm db:migrate`
        - *Requirements: 6.1, 6.5*
    - [ ] 15.5 **编写属性测试验证软删除**
        - Property 8: 软删除查询过滤
        - Property 9: 软删除可恢复性
        - *Validates: Requirements 6.2, 6.3, 6.4*

- [ ] **16. 添加元数据字段**
    - [ ] 16.1 **更新 schema.ts - ppt 表添加元数据字段**
        - 添加 `description: text("description")`
        - 添加 `fileSize: integer("file_size")`
        - 添加 `fileFormat: text("file_format").default('pptx')`
        - *Requirements: 10.1, 10.2, 10.3*
    - [ ] 16.2 **生成并执行 Drizzle 迁移**
        - 运行 `pnpm db:generate`
        - 运行 `pnpm db:migrate`
        - *Requirements: 10.1, 10.2, 10.3, 10.4*
    - [ ] 16.3 **编写单元测试验证元数据字段**
        - 测试 `description`、`file_size`、`file_format` 字段可正常读写
        - *Requirements: 10.4*

- [ ] **17. Checkpoint - 验证字段重构完成**
    - [ ] 运行 `pnpm lint` 确保代码无错误
    - [ ] 运行 `pnpm build` 确保构建成功
    - [ ] 确保所有测试通过，如有问题询问用户

## Phase 5: 验证与收尾
- [ ] **18. 全面验证**
    - [ ] 18.1 **运行所有属性测试**
        - 执行 `pnpm test src/db/__tests__/`
        - 确保所有 12 个 Property 测试通过
        - *Requirements: 1-12*
    - [ ] 18.2 **使用 Drizzle Studio 验证数据库结构**
        - 运行 `pnpm db:studio`
        - 验证外键约束、唯一约束、索引
        - *Requirements: 1-12*
    - [ ] 18.3 **执行验证 SQL 脚本**
        - 验证孤儿数据为 0
        - 验证重复数据为 0
        - 验证索引无重复
        - *Requirements: 1.5, 2.3, 3.1-3.4*

- [ ] **19. 文档更新**
    - [ ] 19.1 **更新 AA-001-前置数据库优化/PostgreSQL数据治理与增强方案.md**
        - 标记已完成的优化项
        - 记录迁移执行日期
        - *Requirements: 12.4*
    - [ ] 19.2 **更新 src/db/schema.ts 注释**
        - 为新增字段添加注释说明
        - 为外键约束添加注释说明
        - *Requirements: 5.3*

- [ ] **20. Final Checkpoint - 确保所有测试通过**
    - [ ] 运行 `pnpm lint`
    - [ ] 运行 `pnpm build`
    - [ ] 运行 `pnpm test`
    - [ ] 确保所有测试通过，如有问题询问用户

## 执行顺序依赖图

```text
Phase 0 (准备)
    │
    ▼
Phase 1 (清洗) ──────────────────┐
    │                            │
    ▼                            │
Phase 2 (索引) ◀─────────────────┘
    │
    ▼
Phase 3 (约束) ← 依赖 Phase 1 完成
    │
    ▼
Phase 4 (重构)
    │
    ▼
Phase 5 (验证)
```

## 风险与回滚

| 阶段 | 风险等级 | 回滚方案 |
| :--- | :--- | :--- |
| Phase 0 | 无 | N/A |
| Phase 1 | 低 | 从 Neon 分支恢复 |
| Phase 2 | 低 | 重新创建删除的索引 |
| Phase 3 | 中 | 删除新增约束，从 Neon 分支恢复数据 |
| Phase 4 | 中 | 回滚迁移，恢复旧字段名 |
| Phase 5 | 无 | N/A |

## 预估工时

| 阶段 | 任务数 | 预估时间 |
| :--- | :--- | :--- |
| Phase 0 | 3 | 1 小时 |
| Phase 1 | 8 | 2 小时 |
| Phase 2 | 6 | 1 小时 |
| Phase 3 | 10 | 3 小时 |
| Phase 4 | 14 | 4 小时 |
| Phase 5 | 5 | 1 小时 |
| **总计** | **46** | **12 小时** |
```
