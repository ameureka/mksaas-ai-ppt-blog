# PostgreSQL 数据治理与增强方案

> **文档状态**: ✅ 2025-12-06 迁移完成
> **基于**: `src/db/schema.ts` 静态分析
> **目标**: 优化现有 PostgreSQL 数据库架构，增强数据完整性，消除潜在风险。
> **迁移执行日期**: 2025-12-06
> **数据库**: Neon PostgreSQL (生产环境)

## 1. 现状与差距分析 (Current Status)

基于对 `src/db/schema.ts` 的全量分析，目前数据库设计总体成熟，但针对“生产级”一致性要求仍有以下提升空间：

| 维度 | 现状问题 | 潜在风险 | 优先级 |
| :--- | :--- | :--- | :--- |
| **外键约束** | `ad_watch_record.ppt_id` 和 `user_download_history.ppt_id` 为纯文本，无物理外键约束。 | **数据孤岛**: PPT 被删除后，相关的历史记录变为“僵尸数据”，统计分析失真。 | 高 |
| **字段命名** | `credit_transaction.payment_id` 实际上存储的是 `invoice_id` (代码注释明确指出)。 | **开发混淆**: 新手维护时极易误解，导致错误的联表查询。 | 中 |
| **废弃字段** | `user_credit.last_refresh_at` 标记为废弃但仍保留。 | **代码异味**: schema 显得冗余，干扰视线。 | 低 |
| **软删除** | 核心表 (`ppt`, `user`) 缺乏统一的 `deleted_at` 机制。 | **误删风险**: 运营误操作直接导致数据物理消失，无法恢复。 | 中 |

---

## 2. 实施目标 (Objectives)

1.  **完整性增强**: 为所有逻辑关联的 ID 字段添加物理外键约束 (`References`)。
2.  **语义清晰化**: 重构混淆字段，清理废弃字段。
3.  **数据安全**: 引入软删除机制，保障核心数据可回溯。

---

## 3. Schema 变更方案 (Schema Changes)

建议按以下顺序分批执行迁移：

### 3.1 阶段一：建立强关联 (Enforce Integrity)

**目标**: 确保所有引用 `ppt_id` 的地方都指向真实存在的 PPT。

```typescript
// src/db/schema.ts

// 1. ad_watch_record
export const adWatchRecord = pgTable("ad_watch_record", {
  // modify: 改为外键引用
  pptId: text("ppt_id").references(() => ppt.id, { onDelete: 'set null' }),
  // ...
});

// 2. user_download_history
export const userDownloadHistory = pgTable("user_download_history", {
  // modify: 改为外键引用
  pptId: text("ppt_id").notNull().references(() => ppt.id, { onDelete: 'cascade' }),
  // ...
});
```

> **注意**: 在执行迁移前，需先运行 SQL 清理现有脏数据 (即那些指向不存在 PPT 的记录)，否则 Migration 会失败。

### 3.2 阶段二：字段清洗 (Clean & Rename)

**目标**: 消除歧义。

```typescript
// src/db/schema.ts

export const creditTransaction = pgTable("credit_transaction", {
  // rename: paymentId -> stripeInvoiceId
  stripeInvoiceId: text("stripe_invoice_id"),
  // remove: lastRefreshAt (从 user_credit 表)
});
```

### 3.3 阶段三：软删除支持 (Soft Deletes)

**目标**: 增加数据容错。

```typescript
export const ppt = pgTable("ppt", {
  // add: 软删除标记
  deletedAt: timestamp("deleted_at"),
  // ...
});
```

---

## 4. Drizzle Studio 验证指南

使用可视化工具验证更改是否生效：

1.  **启动**: `pnpm db:studio`
2.  **验证步骤**:
    - 尝试删除一个被引用的 PPT。
    - 观察 `ad_watch_record` 中对应的 `ppt_id` 是否自动变为 `NULL` (Set Null)。
    - 观察 `user_download_history` 中对应的记录是否被自动删除 (Cascade)。

---

## 5. 执行路线图 (Roadmap)

1.  **数据清洗**: 编写脚本/SQL 扫描并删除现有的“僵尸”外键记录。
2.  **Schema 修改**: 更新 TypeScript 定义。
3.  **迁移生成**: `pnpm db:generate`。
4.  **迁移应用**: `pnpm db:migrate`。
5.  **代码适配**: 全局搜索替换重命名的字段 (`paymentId` -> `stripeInvoiceId`)。



---

## 6. 深度分析续写 (2025-12-06)

基于 Neon 数据库实际查询和 schema.ts 代码分析，补充以下发现：

### 6.1 数据库实际统计

| 指标 | 数量 |
|------|------|
| PPT 模板 | 1,471 |
| 幻灯片 | 36,497 |
| 分类 | 10 |
| 用户 | 6 |
| 下载记录 | 0 |

### 6.2 重复索引问题（需清理）

| 保留索引 (Drizzle 定义) | 删除索引 (手动创建) |
|------------------------|-------------------|
| ppt_category_idx | idx_ppt_category |
| ppt_language_idx | idx_ppt_language |
| ppt_created_at_idx | idx_ppt_created_at |
| import_batch_status_idx | idx_import_batch_status |

**清理 SQL**:
```sql
DROP INDEX IF EXISTS idx_ppt_category;
DROP INDEX IF EXISTS idx_ppt_language;
DROP INDEX IF EXISTS idx_ppt_created_at;
DROP INDEX IF EXISTS idx_import_batch_status;
```

### 6.3 冗余索引问题

| 表 | 索引 | 问题 |
|----|------|------|
| user | user_id_idx | 主键已是索引，重复 |
| session | session_token_idx | 已有 unique 约束 |

### 6.4 缺失索引（性能优化）

```sql
-- slide 表高频查询优化
CREATE INDEX idx_slide_ppt_id ON slide(ppt_id);
CREATE INDEX idx_slide_ppt_number ON slide(ppt_id, slide_number);
```

### 6.5 外键约束缺失（数据完整性）

当前 `ad_watch_record.ppt_id` 和 `user_download_history.ppt_id` 无外键约束。

**风险**: PPT 删除后产生孤儿数据。

**修复方案** (schema.ts):
```typescript
// ad_watch_record
pptId: text("ppt_id").references(() => ppt.id, { onDelete: 'set null' }),

// user_download_history
pptId: text("ppt_id").notNull().references(() => ppt.id, { onDelete: 'cascade' }),
```

### 6.6 执行优先级

| 优先级 | 任务 | 风险 |
|--------|------|------|
| P0 | 删除重复索引 | 无 |
| P0 | 添加 slide.ppt_id 索引 | 无 |
| P1 | 添加外键约束 | 需先清理孤儿数据 |
| P2 | 删除冗余索引 | 低 |
| P2 | 字段重命名 (paymentId→stripeInvoiceId) | 需代码配合 |

---

## 7. 下一步行动

1. **立即执行**: 清理重复索引 + 添加 slide 索引
2. **数据清洗**: 扫描孤儿 ppt_id 记录
3. **Schema 更新**: 添加外键约束
4. **代码适配**: 全局替换重命名字段



### 继续续写

• 综合梳理（基于三份文档：PostgreSQL数据治理与增强方案、数据库现状、数据库信息对话）

  - 现状概览
      - 表：核心 auth( user/session/account/verification )、支付(payment)、积分(user_credit/credit_transaction)、PPT 主表(ppt)、广告与下载(ad_watch_record/user_download_history)。download_record/view_record 有索引但数据为空，schema 中未定
        义 download_record。
      - 线上数据：ppt 约 1,471；slide 36k；用户 6；download/view 0。
      - 迁移：src/db/migrations/0000-0006 定义 auth/支付/积分；migrations/create_ad_tables.sql 仅建广告、下载两表（无 download_record）。
      - 数据质量：ppt.title/file_url 在实际库 nullable（schema 要求 notNull）；重复索引若干（ppt category/language/created_at，import_batch status 等）；测试表 playing_with_neon 存在。
  - 已识别问题
      - 外键缺失：ad_watch_record.ppt_id、user_download_history.ppt_id、import_record.ppt_id 未指向 ppt.id，存在孤儿数据风险。
      - 约束缺失：user_credit 无 user_id 唯一；download_record 未落库；credit_transaction.payment_id 语义混淆（实际 invoice_id）。
      - 索引冗余：ppt_* 与 idx_ppt_* 重复；import_batch_status_idx/idx_import_batch_status 重复；user_id_idx、session_token_idx 可能冗余。
      - 设计不一致：ppt.title/file_url 在库可空；ad/ppt 状态字段为 text，缺少枚举约束。
      - 统计/分表：download_record/view_record 空表或缺表，职责与 user_download_history 重叠未澄清。
      - 性能缺口：slide 无 ppt_id 及 (ppt_id, slide_number) 复合索引；ppt 缺全文/GIN title 搜索索引。
      - 软删除/数据安全：核心表无 deleted_at，误删不可恢复。
  - 优先改进建议（按风险/收益排序）
      1. 完整性：为广告/下载/import_record 的 ppt_id 加外键；新增 user_credit.user_id UNIQUE（先清洗重复）。
      2. 缺表/一致性：决定是否保留 download_record；若需要则建表，否则移除调用。补齐 ppt.title/file_url 非空约束与默认值校验。
      3. 索引清理：删除重复索引（保留 Drizzle 定义的 ppt_category_idx/ppt_language_idx/ppt_created_at_idx 及 import_batch_status_idx），清理 user_id_idx、session_token_idx 如确实冗余。
      4. 命名与字段：将 credit_transaction.payment_id 重命名/迁移为 invoice_id；移除废弃 last_refresh_at 或标注 deprecated。
      5. 性能补强：为 slide 添加 ppt_id、(ppt_id, slide_number) 索引；视需要为 ppt.title 建 GIN/全文索引。
      6. 软删除与容量：为 ppt/user 考虑 deleted_at；广告/下载历史按周期归档或分区。
      7. 约束枚举：将 status/language 等高频字段收敛为枚举/检查约束，减少脏值。
  - 执行顺序建议
      - 低风险即刻：删除重复索引；清理测试表；新增 slide 索引。
      - 中风险：外键 + user_credit 唯一约束（先数据清洗），补 download_record 决策，修正 nullable。
      - 需配合代码：重命名 payment_id→invoice_id、soft delete、枚举约束、统计表合并/改造。

数据库优化分析结论
🔴 阻断性问题 (必须立即修复)
外键缺失导致数据孤岛

ad_watch_record.ppt_id 和 user_download_history.ppt_id 没有外键约束
风险：删除 PPT 后，广告观看记录和下载历史变成僵尸数据，统计失真
代码影响：token-service.ts 和 download-status.ts 都在查询这些表，但无法保证 pptId 有效
Schema 与数据库不一致

ppt.title 和 ppt.file_url 在 schema 定义为 notNull()，但数据库实际允许 NULL
风险：可能插入无效 PPT 数据
重复索引浪费资源

ppt 表有 3 对完全重复的索引（Drizzle 定义 + 手动创建）
每次写入要维护两份，浪费约 200KB 存储
🟡 中优先级问题
字段命名歧义

credit_transaction.payment_id 实际存的是 invoice_id（代码注释明确说明）
新人维护容易误解
缺失关键索引

slide 表 36,497 条记录，缺少 ppt_id 索引
按 PPT 查幻灯片是高频操作，性能隐患
冗余索引

user.user_id_idx 重复（主键本身就是索引）
session.session_token_idx 重复（已有唯一约束）
软删除缺失

ppt 和 user 表没有 deleted_at 字段
误删数据无法恢复
🟢 低优先级建议
废弃字段未清理

user_credit.last_refresh_at 标记废弃但仍保留
数据类型可优化

ppt.status、ppt.language、ad_watch_record.status 用 text 存枚举值
建议改为 varchar 或 enum 约束
缺失元数据字段

ppt 表缺少 description、file_size、file_format
影响前端展示和 SEO
📊 数据链路分析
用户下载流程:
user → ad_watch_record(ppt_id❌无FK) → user_download_history(ppt_id❌无FK) → ppt

积分流程:
user → user_credit(无唯一约束⚠️) → credit_transaction(payment_id命名歧义⚠️)
核心问题：PPT 是数据中心，但下游表都没有外键约束，形成松散耦合，数据一致性完全依赖业务代码。

🛠️ 建议执行顺序
立即执行：清理重复索引、添加 slide.ppt_id 索引
本周执行：添加外键约束（先清洗孤儿数据）
下周执行：字段重命名、添加软删除
后续迭代：补充元数据字段、向量化准备



## 8. 迁移完成总结 (2025-12-06)

### 8.1 已完成优化项

| 优化项 | 状态 | 执行日期 | 备注 |
|--------|------|----------|------|
| 外键约束 - `ad_watch_record.ppt_id` | ✅ 完成 | 2025-12-06 | `ON DELETE SET NULL` |
| 外键约束 - `user_download_history.ppt_id` | ✅ 完成 | 2025-12-06 | `ON DELETE CASCADE` |
| 唯一约束 - `user_credit.user_id` | ✅ 完成 | 2025-12-06 | `user_credit_user_id_unique` |
| 字段重命名 - `payment_id` → `stripe_invoice_id` | ✅ 完成 | 2025-12-06 | 含代码适配 |
| 废弃字段删除 - `user_credit.last_refresh_at` | ✅ 完成 | 2025-12-06 | |
| 软删除字段 - `ppt.deleted_at` | ✅ 完成 | 2025-12-06 | |
| 软删除字段 - `user.deleted_at` | ✅ 完成 | 2025-12-06 | |
| 元数据字段 - `ppt.description` | ✅ 完成 | 2025-12-06 | |
| 元数据字段 - `ppt.file_size` | ✅ 完成 | 2025-12-06 | |
| 元数据字段 - `ppt.file_format` | ✅ 完成 | 2025-12-06 | 默认 `pptx` |
| 重复索引清理 | ✅ 完成 | 2025-12-06 | 删除 4 个重复索引 |
| slide 表索引优化 | ✅ 完成 | 2025-12-06 | `idx_slide_ppt_id`, `idx_slide_ppt_number` |
| 复合索引 - `ppt_status_created_idx` | ✅ 完成 | 2025-12-06 | |
| 复合索引 - `download_method_date_idx` | ✅ 完成 | 2025-12-06 | |
| 测试表清理 - `playing_with_neon` | ✅ 完成 | 2025-12-06 | |

### 8.2 代码适配清单

| 文件 | 修改内容 |
|------|----------|
| `src/db/schema.ts` | 完整 schema 更新 |
| `src/credits/credits.ts` | `paymentId` → `stripeInvoiceId` |
| `src/credits/types.ts` | 接口字段更新 |
| `src/actions/get-credit-transactions.ts` | 查询字段更新 |
| `src/payment/provider/stripe.ts` | Stripe 集成字段更新 |
| `src/lib/ppt/queries.ts` | 新增软删除查询工具 |
| `src/components/settings/credits/*` | UI 组件字段更新 |
| `messages/en.json`, `messages/zh.json` | 翻译键更新 |

### 8.3 软删除查询工具

新增 `src/lib/ppt/queries.ts`，提供以下函数：

- `getPptList(options)` - 获取 PPT 列表（默认排除软删除）
- `getPptById(pptId, includeDeleted)` - 获取单个 PPT
- `softDeletePpt(pptId)` - 软删除 PPT
- `restorePpt(pptId)` - 恢复软删除的 PPT
- `getDeletedPptList(limit, offset)` - 获取已删除的 PPT 列表
- `permanentDeletePpt(pptId)` - 永久删除 PPT

### 8.4 迁移脚本

| 脚本 | 用途 |
|------|------|
| `scripts/db-migration/phase0-prepare.ts` | 迁移前数据验证 |
| `scripts/db-migration/phase1-cleanup.ts` | 数据清洗 |
| `scripts/db-migration/run-migration.ts` | 执行迁移 |
| `scripts/db-migration/phase2-indexes.sql` | 索引优化 SQL |
| `scripts/db-migration/phase3-constraints.sql` | 约束增强 SQL |
| `scripts/db-migration/phase4-fields.sql` | 字段重构 SQL |

### 8.5 验证结果
✅ 孤儿数据: 0 ✅ 重复数据: 0 ✅ NULL 值违规: 0 ✅ PPT 记录: 1,471 ✅ pnpm build: 成功 ✅ pnpm lint: 通过 ✅ readyForMigration: true

### 8.6 数据链路（优化后）
用户下载流程: user → ad_watch_record(ppt_id ✅ FK SET NULL) → user_download_history(ppt_id ✅ FK CASCADE) → ppt

积分流程: user → user_credit(✅ user_id UNIQUE) → credit_transaction(✅ stripe_invoice_id)

--

## 9. 后续建议

| 优先级 | 建议 | 状态 |
|--------|------|------|
| P2 | 为 `ppt.title` 添加 GIN/全文索引 | 待定 |
| P2 | 将 `status`/`language` 改为枚举约束 | 待定 |
| P3 | 广告/下载历史按周期归档 | 待定 |
| P3 | 向量化准备（embedding 字段优化） | 待定 |



已在 Neon 数据库上完成的变更：

添加了 stripe_invoice_id 字段
添加了 ppt.deleted_at、user.deleted_at 软删除字段
添加了 ppt.description、file_size、file_format 元数据字段
添加了外键约束（ad_watch_record.ppt_id、user_download_history.ppt_id）
添加了唯一约束（user_credit.user_id）
你可以通过 pnpm db:studio 打开 Drizzle Studio 来可视化验证数据库结构。
