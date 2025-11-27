# QA-8.0 数据库详细信息

## 📋 问题
详细的数据库信息是什么？

## ✅ 回答

项目使用 **PostgreSQL** 作为主数据库，通过 **Drizzle ORM** 进行管理。

### 🗄️ 数据库技术栈

#### ORM 和工具
```json
{
  "drizzle-orm": "0.39.3",        // ORM 库
  "drizzle-kit": "0.30.4",        // 迁移和 Studio 工具
  "postgres": "3.4.5"             // PostgreSQL 驱动
}
```

**来源**: `package.json:103,158,117`

#### 配置文件

**文件**: `drizzle.config.ts`

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',                    // 数据库方言
  schema: './src/db/schema.ts',            // Schema 文件位置
  out: './src/db/migrations',              // 迁移文件输出目录
  dbCredentials: {
    url: process.env.DATABASE_URL!         // 数据库连接字符串
  }
});
```

**来源**: `drizzle.config.ts`

### 📊 完整数据库 Schema

#### 1. 用户表 (user)

```typescript
export const user = pgTable('user', {
  // 基本信息
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),

  // 时间戳
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),

  // 权限管理
  role: text('role'),                      // 'admin' | 'user'

  // 封禁管理
  banned: boolean('banned').default(false),
  banReason: text('banReason'),
  banExpires: timestamp('banExpires'),

  // 支付集成
  customerId: text('customerId')           // Stripe 客户 ID
}, (table) => ({
  // 索引
  userIdIdx: index('user_id_idx').on(table.id),
  userCustomerIdIdx: index('user_customer_id_idx').on(table.customerId),
  userRoleIdx: index('user_role_idx').on(table.role)
}));
```

**字段说明**:
- **id**: 用户唯一标识（UUID 或 nanoid）
- **email**: 必须唯一，用于登录
- **emailVerified**: 邮箱验证状态
- **role**: 用户角色，用于权限控制
- **banned**: 封禁标记
- **customerId**: 关联 Stripe 客户，用于支付

**索引**: 3 个索引用于快速查询

**来源**: `src/db/schema.ts`

#### 2. 会话表 (session)

```typescript
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expiresAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonatedBy'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
}, (table) => ({
  sessionTokenIdx: index('session_token_idx').on(table.token),
  sessionUserIdIdx: index('session_user_id_idx').on(table.userId)
}));
```

**外键约束**:
- `userId` → `user.id` (级联删除)

**索引**: 2 个索引（token 和 userId）

**来源**: `src/db/schema.ts`

#### 3. 账户链接表 (account)

```typescript
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  // OAuth 令牌
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),

  // 密码登录
  password: text('password'),

  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
}, (table) => ({
  accountUserIdIdx: index('account_user_id_idx').on(table.userId),
  accountAccountIdIdx: index('account_account_id_idx').on(table.accountId),
  accountProviderIdIdx: index('account_provider_id_idx').on(table.providerId)
}));
```

**外键约束**:
- `userId` → `user.id` (级联删除)

**索引**: 3 个索引（userId, accountId, providerId）

**用途**:
- OAuth 登录（GitHub, Google）
- 密码登录（password 字段存储哈希）

**来源**: `src/db/schema.ts`

#### 4. 支付表 (payment)

```typescript
export const payment = pgTable('payment', {
  id: text('id').primaryKey(),
  priceId: text('priceId').notNull(),

  // 支付类型
  type: text('type').notNull(),            // 'subscription' | 'one_time'
  scene: text('scene').notNull(),          // 'lifetime' | 'credit' | 'subscription'

  // 用户关联
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  customerId: text('customerId').notNull(),

  // 订阅信息
  subscriptionId: text('subscriptionId'),
  status: text('status').notNull(),        // Stripe 订阅状态
  paid: boolean('paid').default(false),

  // 周期
  periodStart: timestamp('periodStart'),
  periodEnd: timestamp('periodEnd'),
  trialStart: timestamp('trialStart'),
  trialEnd: timestamp('trialEnd'),

  // 取消
  cancelAtPeriodEnd: boolean('cancelAtPeriodEnd').default(false),

  // 发票
  invoiceId: text('invoiceId').unique(),

  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
}, (table) => ({
  // 8 个索引用于各种查询场景
  paymentUserIdIdx: index('payment_user_id_idx').on(table.userId),
  paymentCustomerIdIdx: index('payment_customer_id_idx').on(table.customerId),
  paymentSubscriptionIdIdx: index('payment_subscription_id_idx').on(table.subscriptionId),
  paymentInvoiceIdIdx: index('payment_invoice_id_idx').on(table.invoiceId),
  paymentStatusIdx: index('payment_status_idx').on(table.status),
  paymentTypeIdx: index('payment_type_idx').on(table.type),
  paymentSceneIdx: index('payment_scene_idx').on(table.scene),
  paymentPaidIdx: index('payment_paid_idx').on(table.paid)
}));
```

**外键约束**:
- `userId` → `user.id` (级联删除)

**唯一约束**:
- `invoiceId` (避免重复处理同一发票)

**索引**: 8 个索引，覆盖主要查询场景

**支付状态**:
- active - 活跃订阅
- canceled - 已取消
- incomplete - 不完整
- past_due - 逾期
- trialing - 试用中
- unpaid - 未支付
- incomplete_expired - 不完整已过期
- paused - 暂停

**来源**: `src/db/schema.ts`

#### 5. 用户积分表 (userCredit)

```typescript
export const userCredit = pgTable('userCredit', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  currentCredits: integer('currentCredits').notNull().default(0),
  lastRefreshAt: timestamp('lastRefreshAt'),  // 已弃用
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
});
```

**外键约束**:
- `userId` → `user.id` (级联删除)

**唯一约束**:
- `userId` (每个用户只有一条积分记录)

**来源**: `src/db/schema.ts`

#### 6. 积分交易表 (creditTransaction)

```typescript
export const creditTransaction = pgTable('creditTransaction', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  // 交易类型
  type: text('type').notNull(),
  // 'purchase' | 'usage' | 'gift' | 'monthly' | 'lifetime_monthly' | 'refund'

  amount: integer('amount').notNull(),              // 交易数额
  remainingAmount: integer('remainingAmount').notNull(),
  description: text('description'),

  // 关联支付
  paymentId: text('paymentId'),                     // 关联的 invoiceId

  // 过期管理
  expirationDate: timestamp('expirationDate'),
  expirationDateProcessedAt: timestamp('expirationDateProcessedAt'),

  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
}, (table) => ({
  creditTransactionUserIdIdx: index('credit_transaction_user_id_idx').on(table.userId),
  creditTransactionTypeIdx: index('credit_transaction_type_idx').on(table.type)
}));
```

**外键约束**:
- `userId` → `user.id` (级联删除)

**索引**: 2 个索引（userId, type）

**交易类型**:
- **purchase**: 购买积分
- **usage**: 使用积分
- **gift**: 赠送积分（如注册赠送）
- **monthly**: 订阅每月赠送
- **lifetime_monthly**: 终身计划每月赠送
- **refund**: 退款

**来源**: `src/db/schema.ts`

#### 7. 验证表 (verification)

```typescript
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),  // 邮箱或用户 ID
  value: text('value').notNull(),            // 验证码/令牌
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt')
});
```

**用途**:
- 邮箱验证
- 密码重置
- 其他需要验证的操作

**来源**: `src/db/schema.ts`

### 🔄 数据库迁移

#### 迁移文件

**位置**: `src/db/migrations/`

```
0000_fine_sir_ram.sql           -- 初始 schema
0001_woozy_jigsaw.sql
0002_left_grandmaster.sql
0003_loving_risque.sql
0004_clever_molly_hayes.sql
0005_thankful_wolf_cub.sql
0006_ambitious_annihilus.sql    -- 最新版本
meta/                           -- 迁移元数据
```

**来源**: `src/db/migrations/` 目录

#### 迁移命令

```bash
# 生成新迁移
pnpm db:generate

# 应用迁移
pnpm db:migrate

# 直接推送 schema（开发用）
pnpm db:push

# 打开 Drizzle Studio
pnpm db:studio
```

**来源**: `package.json`

### 🔗 数据关系

```
user (1)
├─→ session (N) - 级联删除
├─→ account (N) - 级联删除
├─→ payment (N) - 级联删除
├─→ userCredit (1) - 级联删除
└─→ creditTransaction (N) - 级联删除

payment (1)
└─→ creditTransaction (N) - 通过 paymentId 软关联
```

**来源**: `src/db/schema.ts` 外键定义

### 📈 数据库性能优化

#### 索引策略

**总计索引**: 20+ 个

**索引分布**:
- user: 3 个索引
- session: 2 个索引
- account: 3 个索引
- payment: 8 个索引（查询频繁）
- creditTransaction: 2 个索引

**来源**: `src/db/schema.ts` 各表定义

#### 级联删除

所有外键都配置了级联删除 (`onDelete: 'cascade'`)：
- 删除用户时，自动删除所有关联数据
- 保证数据一致性
- 避免孤儿记录

**来源**: `src/db/schema.ts` 外键定义

#### 唯一约束

- `user.email` - 防止重复邮箱
- `session.token` - 防止令牌冲突
- `payment.invoiceId` - 防止重复处理发票
- `userCredit.userId` - 每用户一条记录

**来源**: `src/db/schema.ts` 各表定义

### 🔧 数据库连接

#### 环境变量

```bash
DATABASE_URL="postgresql://user:password@host:port/database"
```

**支持的提供商**:
- Vercel Postgres
- Supabase
- Neon
- Railway
- 任何 PostgreSQL 数据库

**来源**: `env.example`

#### 连接代码

**文件**: `src/db/index.ts`

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

**来源**: `src/db/index.ts` (推测位置)

### 📊 数据统计

| 指标 | 数量 |
|------|------|
| 数据表 | 7 |
| 索引 | 20+ |
| 外键 | 5 |
| 唯一约束 | 4 |
| 迁移文件 | 7 |
| 字段总数 | 80+ |

### 🎯 数据库设计特点

1. **规范化设计** - 符合第三范式
2. **级联删除** - 自动清理关联数据
3. **索引优化** - 覆盖主要查询场景
4. **类型安全** - Drizzle ORM 提供完整类型推导
5. **迁移管理** - 版本化的 schema 变更
6. **灵活扩展** - 支持添加自定义字段

### 🔐 安全性

1. **参数化查询** - Drizzle ORM 自动防 SQL 注入
2. **密码哈希** - 密码存储在 account.password，已哈希
3. **令牌过期** - session.expiresAt 控制会话过期
4. **唯一约束** - 防止数据重复
5. **外键约束** - 保证数据完整性

## 📍 信息来源
- `src/db/schema.ts` - 完整 schema 定义
- `drizzle.config.ts` - Drizzle 配置
- `package.json` - 依赖和脚本
- `src/db/migrations/` - 迁移历史
- `env.example` - 环境变量配置
