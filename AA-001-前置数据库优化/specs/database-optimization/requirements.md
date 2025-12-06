# Requirements Document (v2.0)

## Introduction
本文档定义了 PPTHub 数据库优化项目的需求规格。基于对 `src/db/schema.ts`、Neon 数据库实际查询、以及 `PostgreSQL数据治理与增强方案.md`、`向量数据治理与增强方案.md`、`数据库现状.md` 三份分析文档的综合评估，目标是：

*   增强数据完整性（外键约束、唯一约束）
*   消除索引冗余，补充缺失索引
*   规范字段命名，清理废弃字段
*   引入软删除机制，增强数据安全
*   补充元数据字段，支持前端展示和 SEO
*   确保迁移安全，支持回滚

**当前数据库核心问题：**

1.  1,471 个 PPT、36,497 个 slide、6 个用户
2.  `ad_watch_record` 和 `user_download_history` 的 `ppt_id` 无外键约束
3.  `ppt` 表有 3 对重复索引，`slide` 表缺少 `ppt_id` 索引
4.  `user_credit` 无唯一约束，存在并发风险
5.  `credit_transaction.payment_id` 命名与实际用途不符

## Glossary

*   **PPT_System**: PPTHub 平台的 PostgreSQL 数据库系统（Neon 托管，新加坡区域）
*   **Orphan_Data**: 引用已删除记录的孤儿数据（如 `ppt_id` 指向不存在的 PPT）
*   **Foreign_Key**: 数据库外键约束，确保引用完整性
*   **Soft_Delete**: 软删除机制，通过 `deleted_at` 字段标记删除而非物理删除
*   **Drizzle_ORM**: 项目使用的 TypeScript ORM 框架
*   **Migration**: 数据库迁移脚本，位于 `src/db/migrations/`
*   **Index_Scan**: 使用索引的查询方式，性能优于全表扫描
*   **Seq_Scan**: 顺序扫描（全表扫描），性能较差

## Requirements

### Requirement 1: 外键约束完整性 - PPT 关联表
**User Story:** As a 数据库管理员, I want 所有引用 PPT 的表都有外键约束, so that 删除 PPT 时不会产生孤儿数据，数据一致性由数据库层保证。

**Acceptance Criteria**
*   WHEN 管理员删除一个 PPT 记录 THEN THE PPT_System SHALL 自动将 `ad_watch_record` 表中对应的 `ppt_id` 设置为 `NULL`（`SET NULL` 策略）
*   WHEN 管理员删除一个 PPT 记录 THEN THE PPT_System SHALL 自动级联删除 `user_download_history` 表中对应的下载记录（`CASCADE` 策略）
*   WHEN 开发者尝试插入一个引用不存在 PPT 的 `ad_watch_record` THEN THE PPT_System SHALL 拒绝该插入操作并返回 PostgreSQL 错误码 `23503`
*   WHEN 开发者尝试插入一个引用不存在 PPT 的 `user_download_history` THEN THE PPT_System SHALL 拒绝该插入操作并返回 PostgreSQL 错误码 `23503`
*   WHEN 执行验证 SQL `SELECT COUNT(*) FROM ad_watch_record WHERE ppt_id IS NOT NULL AND ppt_id NOT IN (SELECT id FROM ppt)` THEN THE PPT_System SHALL 返回 0

### Requirement 2: 用户积分唯一性约束
**User Story:** As a 系统开发者, I want `user_credit` 表对 `user_id` 有唯一约束, so that 并发场景下不会为同一用户创建多条积分记录，积分余额始终准确。

**Acceptance Criteria**
*   WHEN 系统尝试为已有积分记录的用户创建新积分记录 THEN THE PPT_System SHALL 拒绝该操作并返回 PostgreSQL 错误码 `23505`
*   WHEN 多个并发请求同时为新用户创建积分记录 THEN THE PPT_System SHALL 仅允许一条记录成功插入，其余返回唯一约束错误
*   WHEN 执行验证 SQL `SELECT user_id, COUNT(*) FROM user_credit GROUP BY user_id HAVING COUNT(*) > 1` THEN THE PPT_System SHALL 返回空结果集
*   WHEN 查看 `user_credit` 表约束 THEN THE PPT_System SHALL 显示 `user_id` 列有 `UNIQUE` 约束

### Requirement 3: 索引优化 - 删除冗余
**User Story:** As a 系统运维人员, I want 数据库不存在功能重复的索引, so that 写入性能最优且存储不浪费。

**Acceptance Criteria**
*   WHEN 执行 `SELECT indexname FROM pg_indexes WHERE tablename = 'ppt'` THEN THE PPT_System SHALL 不包含 `idx_ppt_category`、`idx_ppt_language`、`idx_ppt_created_at`
*   WHEN 执行 `SELECT indexname FROM pg_indexes WHERE tablename = 'import_batch'` THEN THE PPT_System SHALL 不包含 `idx_import_batch_status`
*   WHEN 执行 `SELECT indexname FROM pg_indexes WHERE tablename = 'user'` THEN THE PPT_System SHALL 不包含 `user_id_idx`（主键已是索引）
*   WHEN 查询数据库总索引数量 THEN THE PPT_System SHALL 比优化前减少至少 5 个索引

### Requirement 4: 索引优化 - 补充缺失
**User Story:** As a 系统运维人员, I want 高频查询都有对应索引, so that 查询性能满足生产要求。

**Acceptance Criteria**
*   WHEN 执行 `EXPLAIN ANALYZE SELECT * FROM slide WHERE ppt_id = 'xxx'` THEN THE PPT_System SHALL 显示 `Index Scan` 而非 `Seq Scan`
*   WHEN 执行 `SELECT indexname FROM pg_indexes WHERE tablename = 'slide'` THEN THE PPT_System SHALL 包含 `idx_slide_ppt_id`
*   WHEN 执行 `SELECT indexname FROM pg_indexes WHERE tablename = 'ppt'` THEN THE PPT_System SHALL 包含 `ppt_status_created_idx`（复合索引）
*   WHEN 执行 `SELECT indexname FROM pg_indexes WHERE tablename = 'user_download_history'` THEN THE PPT_System SHALL 包含 `download_method_date_idx`（复合索引）

### Requirement 5: 字段命名规范化
**User Story:** As a 新加入的开发者, I want 数据库字段名与实际用途一致, so that 我能正确理解和使用这些字段，减少维护成本。

**Acceptance Criteria**
*   WHEN 执行 `SELECT column_name FROM information_schema.columns WHERE table_name = 'credit_transaction'` THEN THE PPT_System SHALL 包含 `stripe_invoice_id` 而非 `payment_id`
*   WHEN 执行 `SELECT column_name FROM information_schema.columns WHERE table_name = 'user_credit'` THEN THE PPT_System SHALL 不包含 `last_refresh_at`
*   WHEN 代码中引用积分交易的发票字段 THEN THE PPT_System SHALL 使用 `stripeInvoiceId` 作为 TypeScript 属性名

### Requirement 6: 软删除机制
**User Story:** As a 运营人员, I want 核心数据支持软删除, so that 误删操作可以恢复，数据审计有迹可循。

**Acceptance Criteria**
*   WHEN 执行 `SELECT column_name FROM information_schema.columns WHERE table_name = 'ppt' AND column_name = 'deleted_at'` THEN THE PPT_System SHALL 返回一条记录
*   WHEN 软删除一个 PPT 记录 THEN THE PPT_System SHALL 设置 `deleted_at` 字段为当前时间戳而非物理删除该行
*   WHEN 执行默认 PPT 列表查询 THEN THE PPT_System SHALL 自动添加 `WHERE deleted_at IS NULL` 条件
*   WHEN 管理员需要恢复已删除的 PPT THEN THE PPT_System SHALL 支持将 `deleted_at` 设置为 `NULL` 以恢复记录
*   WHEN 执行 `SELECT column_name FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'deleted_at'` THEN THE PPT_System SHALL 返回一条记录

### Requirement 7: Schema 与数据库一致性
**User Story:** As a 数据库管理员, I want Schema 定义与实际数据库约束一致, so that 数据验证在应用层和数据库层保持同步，防止脏数据。

**Acceptance Criteria**
*   WHEN 执行 `SELECT is_nullable FROM information_schema.columns WHERE table_name = 'ppt' AND column_name = 'title'` THEN THE PPT_System SHALL 返回 `'NO'`
*   WHEN 执行 `SELECT is_nullable FROM information_schema.columns WHERE table_name = 'ppt' AND column_name = 'file_url'` THEN THE PPT_System SHALL 返回 `'NO'`
*   WHEN 尝试插入 `title` 为 `NULL` 的 PPT 记录 THEN THE PPT_System SHALL 拒绝该操作并返回 `NOT NULL` 约束错误
*   WHEN 尝试插入 `file_url` 为 `NULL` 的 PPT 记录 THEN THE PPT_System SHALL 拒绝该操作并返回 `NOT NULL` 约束错误

### Requirement 8: 数据清洗
**User Story:** As a 数据库管理员, I want 在添加约束前清洗脏数据, so that 迁移能够成功执行，不会因约束冲突而失败。

**Acceptance Criteria**
*   WHEN 执行外键约束迁移前 THEN THE PPT_System SHALL 已删除所有引用不存在 PPT 的 `ad_watch_record` 记录（验证 SQL 返回 0）
*   WHEN 执行外键约束迁移前 THEN THE PPT_System SHALL 已删除所有引用不存在 PPT 的 `user_download_history` 记录（验证 SQL 返回 0）
*   WHEN 执行唯一约束迁移前 THEN THE PPT_System SHALL 已合并 `user_credit` 表中的重复用户记录（保留积分最高的记录）
*   WHEN 执行 `NOT NULL` 约束迁移前 THEN THE PPT_System SHALL 已为 `ppt.title` 空值填充 `'Untitled'`
*   WHEN 执行 `NOT NULL` 约束迁移前 THEN THE PPT_System SHALL 已为 `ppt.file_url` 空值填充占位 URL 或删除该记录

### Requirement 9: 测试表与冗余表清理
**User Story:** As a 数据库管理员, I want 生产数据库不包含测试表和冗余表, so that 数据库结构清晰，不浪费存储。

**Acceptance Criteria**
*   WHEN 执行 `SELECT tablename FROM pg_tables WHERE tablename = 'playing_with_neon'` THEN THE PPT_System SHALL 返回空结果集
*   WHEN `download_record` 表确认不再使用 THEN THE PPT_System SHALL 删除该表或在 `schema.ts` 中补充定义
*   WHEN `view_record` 表确认不再使用 THEN THE PPT_System SHALL 删除该表或在 `schema.ts` 中补充定义

### Requirement 10: PPT 元数据字段补充
**User Story:** As a 前端开发者, I want PPT 表包含完整的元数据字段, so that 前端展示不需要兜底逻辑，SEO 信息完整。

**Acceptance Criteria**
*   WHEN 执行 `SELECT column_name FROM information_schema.columns WHERE table_name = 'ppt' AND column_name = 'description'` THEN THE PPT_System SHALL 返回一条记录
*   WHEN 执行 `SELECT column_name FROM information_schema.columns WHERE table_name = 'ppt' AND column_name = 'file_size'` THEN THE PPT_System SHALL 返回一条记录
*   WHEN 执行 `SELECT column_name FROM information_schema.columns WHERE table_name = 'ppt' AND column_name = 'file_format'` THEN THE PPT_System SHALL 返回一条记录
*   WHEN 查询 PPT 详情 THEN THE PPT_System SHALL 返回 `description`、`file_size`、`file_format` 字段

### Requirement 11: 代码适配
**User Story:** As a 系统开发者, I want 代码与数据库变更同步更新, so that 应用程序能正常运行，不会因字段不匹配而报错。

**Acceptance Criteria**
*   WHEN `credit_transaction.payment_id` 重命名为 `stripe_invoice_id` THEN THE PPT_System SHALL 同步更新 `src/credits/credits.ts` 中的字段引用
*   WHEN `credit_transaction.payment_id` 重命名为 `stripe_invoice_id` THEN THE PPT_System SHALL 同步更新 `src/credits/types.ts` 中的类型定义
*   WHEN `credit_transaction.payment_id` 重命名为 `stripe_invoice_id` THEN THE PPT_System SHALL 同步更新 `src/actions/get-credit-transactions.ts` 中的查询
*   WHEN `credit_transaction.payment_id` 重命名为 `stripe_invoice_id` THEN THE PPT_System SHALL 同步更新 `src/payment/provider/stripe.ts` 中的写入逻辑
*   WHEN `ppt` 表添加 `deleted_at` 字段 THEN THE PPT_System SHALL 更新所有 PPT 查询添加软删除过滤条件

### Requirement 12: 迁移安全性
**User Story:** As a 系统运维人员, I want 数据库迁移安全可回滚, so that 迁移失败时能快速恢复，不影响生产服务。

**Acceptance Criteria**
*   WHEN 执行迁移前 THEN THE PPT_System SHALL 已创建数据库完整备份（Neon 分支或 `pg_dump`）
*   WHEN 迁移脚本执行失败 THEN THE PPT_System SHALL 自动回滚当前事务，数据库状态不变
*   WHEN 迁移完成后发现问题 THEN THE PPT_System SHALL 支持通过 Neon 分支恢复到迁移前状态
*   WHEN 执行迁移 THEN THE PPT_System SHALL 在低峰期执行，并提前通知相关人员
*   WHEN 迁移涉及字段重命名 THEN THE PPT_System SHALL 采用双写策略，先添加新字段，再迁移数据，最后删除旧字段

## 需求追溯矩阵

| Requirement | 来源问题 | 优先级 | 风险 |
| :--- | :--- | :--- | :--- |
| R1 外键约束 | 问题 1, 2 | P0 | 高 |
| R2 唯一约束 | 问题 5 | P0 | 高 |
| R3 删除冗余索引 | 问题 4 | P0 | 低 |
| R4 补充索引 | 问题 7 | P1 | 低 |
| R5 字段命名 | 问题 6, 10 | P1 | 中 |
| R6 软删除 | 问题 9 | P1 | 中 |
| R7 Schema 一致性 | 问题 3 | P1 | 中 |
| R8 数据清洗 | 迁移前置 | P0 | 中 |
| R9 表清理 | 问题 11, 14 | P2 | 低 |
| R10 元数据字段 | 问题 13 | P2 | 低 |
| R11 代码适配 | 迁移配套 | P1 | 中 |
| R12 迁移安全 | 生产要求 | P0 | 高 |
