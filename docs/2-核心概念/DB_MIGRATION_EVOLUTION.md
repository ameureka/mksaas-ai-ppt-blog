# MkSaaS 数据库迁移演化历程

## 迁移时间线

```
2024年初期开发
    │
    ├─ 0000: 核心表创建 (认证 + 支付基础)
    │   └─ 创建时间: 项目启动
    │
    ├─ 0001: 积分系统上线
    │   └─ 创建时间: 功能迭代早期
    │
    ├─ 0002: 性能优化（索引全覆盖）
    │   └─ 创建时间: 性能调优阶段
    │
    ├─ 0003: Checkout 会话追踪
    │   └─ 创建时间: 支付流程完善
    │
    ├─ 0004: 防重设计（invoiceId）
    │   └─ 创建时间: 支付安全加强
    │
    ├─ 0005: 支付状态标记（paid 字段）
    │   └─ 创建时间: 支付流程规范化
    │
    └─ 0006: 支付场景分类（scene）
        └─ 创建时间: 业务模式多样化
```

---

## 各迁移详细分析

### 迁移 0000: `fine_sir_ram.sql` - 核心表初始化

**时间**：项目启动期  
**规模**：5 张表  
**目标**：建立完整的认证和支付基础设施

#### 创建的表

1. **user** - 核心用户表
   ```sql
   CREATE TABLE "user" (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     email TEXT NOT NULL UNIQUE,
     emailVerified BOOLEAN NOT NULL,
     image TEXT,
     createdAt TIMESTAMP NOT NULL,
     updatedAt TIMESTAMP NOT NULL,
     role TEXT,
     banned BOOLEAN,
     banReason TEXT,
     banExpires TIMESTAMP,
     customerId TEXT  -- Stripe 支付关联
   );
   ```
   
   **设计特点**：
   - UUID 作为主键（Better Auth 标准）
   - email UNIQUE 约束（一邮一号）
   - customerId 预留 (Stripe 集成)
   - role 字段支持权限管理 (Better Auth admin)

2. **session** - 会话管理
   ```sql
   CREATE TABLE "session" (
     id TEXT PRIMARY KEY,
     expiresAt TIMESTAMP NOT NULL,
     token TEXT NOT NULL UNIQUE,
     createdAt TIMESTAMP NOT NULL,
     updatedAt TIMESTAMP NOT NULL,
     ipAddress TEXT,        -- 安全审计
     userAgent TEXT,         -- 设备识别
     userId TEXT NOT NULL,
     impersonatedBy TEXT     -- 管理员模拟
   );
   ```
   
   **设计特点**：
   - token UNIQUE 防止会话冲突
   - 记录 IP 和 User-Agent 用于异常检测
   - impersonatedBy 支持管理员模拟用户

3. **account** - 多种登录方式
   ```sql
   CREATE TABLE "account" (
     id TEXT PRIMARY KEY,
     accountId TEXT NOT NULL,       -- OAuth provider 的用户 ID
     providerId TEXT NOT NULL,      -- 'credentials', 'google', 'github'
     userId TEXT NOT NULL,
     accessToken TEXT,
     refreshToken TEXT,
     idToken TEXT,
     accessTokenExpiresAt TIMESTAMP,
     refreshTokenExpiresAt TIMESTAMP,
     scope TEXT,
     password TEXT,                 -- 仅 credentials 提供商
     createdAt TIMESTAMP NOT NULL,
     updatedAt TIMESTAMP NOT NULL
   );
   ```
   
   **设计特点**：
   - 支持一个用户多种登录方式
   - password 仅在 credentials 类型使用
   - 存储 OAuth tokens 用于续期和 API 调用

4. **payment** - 支付记录（初版）
   ```sql
   CREATE TABLE "payment" (
     id TEXT PRIMARY KEY,
     priceId TEXT NOT NULL,
     type TEXT NOT NULL,            -- 'subscription', 'one-time'
     interval TEXT,                 -- 'month', 'year'
     userId TEXT NOT NULL,
     customerId TEXT NOT NULL,
     subscriptionId TEXT,           -- Stripe subscription
     sessionId TEXT,                -- Stripe checkout session (后加)
     status TEXT NOT NULL,          -- 'pending', 'active', 'completed'
     period_start TIMESTAMP,
     period_end TIMESTAMP,
     cancel_at_period_end BOOLEAN,
     trial_start TIMESTAMP,
     trial_end TIMESTAMP,
     createdAt TIMESTAMP DEFAULT now(),
     updatedAt TIMESTAMP DEFAULT now()
   );
   ```
   
   **注意**：
   - 此版本还没有 `invoiceId`、`paid` 等防重字段
   - 支持订阅周期管理 (periodStart/End)
   - 支持试用期管理 (trialStart/End)

5. **verification** - 邮箱验证、密码重置
   ```sql
   CREATE TABLE "verification" (
     id TEXT PRIMARY KEY,
     identifier TEXT NOT NULL,     -- 邮箱或其他标识
     value TEXT NOT NULL,          -- 验证码或 token
     expiresAt TIMESTAMP NOT NULL,
     createdAt TIMESTAMP,
     updatedAt TIMESTAMP
   );
   ```
   
   **设计特点**：
   - 无外键约束（支持未注册邮箱的验证）
   - 灵活的 identifier/value 设计

#### 外键关系（级联删除）

```sql
ALTER TABLE account 
ADD CONSTRAINT account_user_id_user_id_fk 
FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE cascade;

ALTER TABLE payment 
ADD CONSTRAINT payment_user_id_user_id_fk 
FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE cascade;

ALTER TABLE session 
ADD CONSTRAINT session_user_id_user_id_fk 
FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE cascade;
```

**原则**：删除用户时级联删除其所有关联数据

---

### 迁移 0001: `woozy_jigsaw.sql` - 积分系统

**时间**：早期功能开发  
**规模**：2 张表  
**目标**：实现完整的积分管理系统

#### 创建的表

1. **userCredit** - 用户积分余额
   ```sql
   CREATE TABLE "user_credit" (
     id TEXT PRIMARY KEY,
     userId TEXT NOT NULL REFERENCES user(id) ON DELETE cascade,
     currentCredits INTEGER NOT NULL DEFAULT 0,
     lastRefreshAt TIMESTAMP,      -- 已弃用字段
     createdAt TIMESTAMP DEFAULT now(),
     updatedAt TIMESTAMP DEFAULT now()
   );
   ```
   
   **设计思路**：
   - **快速查询**：O(1) 获取用户当前积分
   - **1:1 关系**：一个用户对应一条记录
   - `lastRefreshAt` 是历史遗留，标记为已弃用
   
   **查询场景**：
   ```sql
   -- 检查用户是否有足够积分
   SELECT currentCredits FROM userCredit 
   WHERE userId = $1;
   ```

2. **creditTransaction** - 积分交易记录
   ```sql
   CREATE TABLE "credit_transaction" (
     id TEXT PRIMARY KEY,
     userId TEXT NOT NULL REFERENCES user(id) ON DELETE cascade,
     type TEXT NOT NULL,              -- 'add', 'consume', 'expire'
     description TEXT,
     amount INTEGER NOT NULL,         -- 正数或负数
     remainingAmount INTEGER,
     paymentId TEXT,                  -- 关联 payment.invoiceId
     expirationDate TIMESTAMP,        -- 积分过期时间
     expirationDateProcessedAt TIMESTAMP,  -- 过期处理时间
     createdAt TIMESTAMP DEFAULT now(),
     updatedAt TIMESTAMP DEFAULT now()
   );
   ```
   
   **设计思路**：
   - **Ledger Pattern**：完整的交易历史审计
   - **多维记录**：记录增加、消费、过期三种类型
   - `remainingAmount` 用于快速验证对账
   - `expirationDate` 支持积分过期机制
   
   **查询场景**：
   ```sql
   -- 获取用户积分交易历史
   SELECT * FROM creditTransaction 
   WHERE userId = $1 
   ORDER BY createdAt DESC;
   
   -- 统计用户本月消费
   SELECT SUM(ABS(amount)) FROM creditTransaction
   WHERE userId = $1 AND type = 'consume'
   AND createdAt >= DATE_TRUNC('month', NOW());
   ```

#### 设计模式解析

**两表模式 (Dual-Table Pattern)**：

```
┌─────────────────────────────────────────────────────────┐
│ 传统单表模式（易出错）                                    │
├─────────────────────────────────────────────────────────┤
│ UPDATE userCredit                                       │
│ SET currentCredits = 100                                │
│ -- 问题：历史数据丢失，无法审计                          │
└─────────────────────────────────────────────────────────┘

         vs

┌─────────────────────────────────────────────────────────┐
│ MkSaaS 双表模式（推荐）                                   │
├─────────────────────────────────────────────────────────┤
│ userCredit (快速查询)  ←←← creditTransaction (完整审计)   │
│ currentCredits = 100        type: 'add', amount: 50     │
│ updated_at: 2024-01-15      type: 'consume', amount: -10│
│                              type: 'add', amount: 60     │
│                                                         │
│ 优势：                                                   │
│ ✓ O(1) 快速查询当前积分                                 │
│ ✓ 完整审计日志，支持对账                                │
│ ✓ 灵活支持过期、到期等复杂逻辑                          │
│ ✓ 支持时间序列分析                                      │
└─────────────────────────────────────────────────────────┘
```

---

### 迁移 0002: `left_grandmaster.sql` - 性能索引优化

**时间**：性能调优阶段  
**规模**：17 个索引  
**目标**：全面覆盖关键查询路径，提升数据库性能

#### 创建的索引清单

| 表 | 索引名 | 字段 | 目的 |
|----|--------|------|------|
| **account** | account_user_id_idx | user_id | 快速查询用户的所有登录方式 |
| | account_account_id_idx | account_id | 防止社交账户重复关联 |
| | account_provider_id_idx | provider_id | 按提供商类型筛选 |
| **creditTransaction** | credit_transaction_user_id_idx | user_id | 查询用户交易历史 |
| | credit_transaction_type_idx | type | 按类型统计（add/consume/expire） |
| **payment** | payment_type_idx | type | 区分支付类型 |
| | payment_price_id_idx | price_id | 关联价格方案 |
| | payment_user_id_idx | user_id | 快速查询用户支付 |
| | payment_customer_id_idx | customer_id | Stripe 客户查询 |
| | payment_status_idx | status | 支付状态筛选 |
| | payment_subscription_id_idx | subscription_id | 订阅管理 |
| **session** | session_token_idx | token | 快速令牌查找（UQ） |
| | session_user_id_idx | user_id | 查询用户会话 |
| **user** | user_id_idx | id | 显式 PK 索引 |
| | user_customer_id_idx | customer_id | Stripe 客户查询 |
| | user_role_idx | role | 角色筛选 |
| **userCredit** | user_credit_user_id_idx | user_id | 1:1 查询 |

#### 性能提升分析

**索引前 (无索引)**：
```sql
SELECT * FROM payment WHERE user_id = $1
-- 执行时间: Full Table Scan ~1000ms (假设 100K 行)
```

**索引后**：
```sql
SELECT * FROM payment WHERE user_id = $1
-- 执行时间: Index Scan ~10ms
-- 性能提升: 100 倍
```

#### 索引设计原则

1. **外键字段必须索引**
   ```sql
   CREATE INDEX payment_user_id_idx ON payment(user_id);
   -- 支持 JOIN 性能优化
   ```

2. **频繁过滤字段需索引**
   ```sql
   CREATE INDEX payment_status_idx ON payment(status);
   -- WHERE status = 'active' 快速查询
   ```

3. **唯一字段隐含索引**
   ```sql
   UNIQUE (email)  -- 自动创建索引
   UNIQUE (token)  -- 自动创建索引
   ```

---

### 迁移 0003: `loving_risque.sql` - Checkout 会话追踪

**时间**：支付流程完善  
**规模**：1 列 + 1 索引  
**目标**：追踪 Stripe Checkout Session，改进支付体验

#### 变更内容

```sql
ALTER TABLE payment ADD COLUMN session_id text;
CREATE INDEX payment_session_id_idx ON payment(session_id);
```

#### 业务背景

在 Stripe 的支付流程中：

```
用户在前端启动支付
    ↓
调用 Stripe.checkout.sessions.create()
    ├─ 返回 sessionId
    └─ 用户跳转到 Stripe 支付页面
    ↓
payment 表 INSERT
    ├─ sessionId: Stripe 返回的值
    └─ status: 'pending'
    ↓
用户完成支付后
    ↓
Stripe 发送 webhook (invoice.paid)
    └─ payment 表 UPDATE status = 'active/completed'
```

#### 问题解决

**问题**：无法关联前端启动的 checkout session 与后端的 payment 记录

**解决**：
```javascript
// 前端
const session = await stripe.checkout.sessions.create({
  success_url: ...,
  cancel_url: ...
});
// 返回 session.id 给前端

// 后端：记录 session_id
await db.insert(payment, {
  sessionId: session.id,
  ...
});

// 后续追踪
SELECT * FROM payment WHERE sessionId = $1;
```

#### 使用场景

```
- 用户支付未完成时，通过 sessionId 查询 payment 状态
- 支付中断后，获取之前的会话重新完成
- 支付分析：关联用户行为和支付转化
```

---

### 迁移 0004: `clever_molly_hayes.sql` - 防重设计

**时间**：支付安全加强  
**规模**：1 列 (UNIQUE) + 1 索引  
**目标**：防止 Stripe Webhook 重复触发导致的重复支付

#### 变更内容

```sql
ALTER TABLE payment ADD COLUMN invoice_id text;
CREATE INDEX payment_invoice_id_idx ON payment(invoice_id);
ALTER TABLE payment ADD CONSTRAINT payment_invoice_id_unique 
UNIQUE(invoice_id);
```

#### 问题背景

**问题场景**：

```
Stripe invoice.paid 事件
    ├─ 第一次发送 → 处理 → 积分已分配 ✓
    ├─ 网络延迟或超时
    ├─ 重新发送 → 处理 → 积分重复分配！❌
    └─ ...可能发送多次
```

**后果**：用户获得 3 倍的积分，导致商业损失

#### 解决方案

**使用 invoiceId UNIQUE 约束实现幂等性**：

```sql
-- Webhook 处理逻辑
INSERT INTO payment (id, invoiceId, paid, ...)
VALUES (uuid(), 'stripe_invoice_123', true, ...)
ON CONFLICT (invoiceId) DO NOTHING;
-- 即使 webhook 发送 3 次，也只会成功一次
```

#### 设计原理

```
┌─────────────────────────────────────────┐
│ Webhook #1 (发票 #123)                  │
├─────────────────────────────────────────┤
│ INSERT INTO payment (invoiceId='123')   │
│ ↓                                       │
│ 成功 ✓                                   │
│ createdAt: 2024-01-15 10:00:00          │
└─────────────────────────────────────────┘
         
         (网络延迟)

┌─────────────────────────────────────────┐
│ Webhook #2 (重试，发票 #123)            │
├─────────────────────────────────────────┤
│ INSERT INTO payment (invoiceId='123')   │
│ ↓                                       │
│ 违反 UNIQUE 约束 ✗                       │
│ → 忽略 (ON CONFLICT DO NOTHING)          │
└─────────────────────────────────────────┘
```

#### 最佳实践

```typescript
// ✅ 幂等处理
async function handleStripeWebhook(event) {
  const invoiceId = event.data.object.id;
  
  await db
    .insert(payment)
    .values({ invoiceId, paid: true, ... })
    .onConflict('invoiceId')
    .doNothing();  // 重复的 webhook 被安全忽略
}

// ❌ 危险处理（可能导致重复）
async function handleStripeWebhook(event) {
  const payment = await db.query(
    'SELECT * FROM payment WHERE invoiceId = ?', 
    [invoiceId]
  );
  if (!payment) {
    await db.insert(payment, {...});  // Race condition!
  }
}
```

---

### 迁移 0005: `thankful_wolf_cub.sql` - 支付状态标记

**时间**：支付流程规范化  
**规模**：1 列 (BOOLEAN) + 1 索引  
**目标**：明确标记支付完成状态，简化业务逻辑

#### 变更内容

```sql
ALTER TABLE payment 
ADD COLUMN paid boolean NOT NULL DEFAULT false;

CREATE INDEX payment_paid_idx ON payment(paid);
```

#### 业务含义

**payment.status vs payment.paid**：

| 字段 | 含义 | 更新时机 | 业务含义 |
|------|------|---------|---------|
| `status` | 支付流程状态 | 多个阶段 | 描述当前阶段 |
| `paid` | 金钱是否到账 | invoice.paid | 是否可分配积分 |

#### 状态转换示意

```
支付流程：
  pending ──→ active/completed ──→ canceled
  (初始)      (已收款)             (已取消)

付款标记：
  paid=false ──→ paid=true (invoice.paid event)
  (未到账)       (已到账可用)
```

#### 查询优化

```sql
-- 问题：如何获取已支付的订阅？
-- 之前：需要检查多个条件
SELECT * FROM payment 
WHERE status IN ('active', 'completed')
AND subscriptionId IS NOT NULL;

-- 改进：直接检查 paid 字段
SELECT * FROM payment 
WHERE paid = true 
AND subscriptionId IS NOT NULL;
-- 通过 paid 索引快速定位
```

---

### 迁移 0006: `ambitious_annihilus.sql` - 支付场景分类

**时间**：业务模式多样化  
**规模**：1 列 + 1 索引  
**目标**：区分不同的支付场景，支持灵活的积分分配策略

#### 变更内容

```sql
ALTER TABLE payment ADD COLUMN scene text;
CREATE INDEX payment_scene_idx ON payment(scene);
```

#### 支付场景分类

```
支付场景系统设计
├─ subscription (订阅制)
│  ├─ 周期：月/年
│  ├─ 续费：自动续期
│  ├─ 积分：月/年额定积分
│  └─ 例：Pro 年付送 1200 积分
│
├─ lifetime (终身会员)
│  ├─ 周期：一次性
│  ├─ 续费：无需续期
│  ├─ 积分：高额+终身额外积分
│  └─ 例：Lifetime 送 5000 积分 + 终身每月 50 额外
│
└─ credit (积分包)
   ├─ 周期：一次性
   ├─ 续费：需要重新购买
   ├─ 积分：等额积分
   └─ 例：100 积分包 = 100 积分
```

#### 业务应用场景

**根据 scene 区分积分分配策略**：

```javascript
async function distributeCredits(payment) {
  switch (payment.scene) {
    case 'subscription':
      // 月/年订阅，按周期分配
      const months = calculateMonths(payment.interval);
      const monthlyCredit = 100;
      await addCredits(payment.userId, months * monthlyCredit);
      break;
      
    case 'lifetime':
      // 终身会员，分配高额积分
      await addCredits(payment.userId, 5000);
      // 并设置每月额外积分
      setupMonthlyBonus(payment.userId, 50);
      break;
      
    case 'credit':
      // 积分包，直接对应关系
      const amount = getPackageAmount(payment.priceId);
      await addCredits(payment.userId, amount);
      break;
  }
}
```

#### 统计分析

```sql
-- 按场景统计支付情况
SELECT 
  scene,
  COUNT(*) as count,
  COUNT(CASE WHEN paid = true THEN 1 END) as paid_count,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
FROM payment 
WHERE createdAt >= NOW() - INTERVAL '30 days'
GROUP BY scene;

-- 输出示例：
-- scene         count  paid_count  active_count
-- subscription  150    145         142
-- lifetime      25     24          24
-- credit        320    315         0
```

---

## 迁移决策树

```
开发流程中的数据库变更需求
    │
    ├─ 【0000】第一次启动？
    │  └─ 创建核心表 (user, session, account, verification, payment)
    │
    ├─ 【0001】需要支持积分系统？
    │  └─ 添加积分表 (userCredit, creditTransaction)
    │
    ├─ 【0002】性能遇到瓶颈？
    │  └─ 添加索引优化 (17 个精心设计的索引)
    │
    ├─ 【0003】支付流程无法追踪？
    │  └─ 添加 sessionId 列，关联 Stripe checkout session
    │
    ├─ 【0004】Webhook 重复导致重复支付？
    │  └─ 添加 invoiceId UNIQUE 约束，实现幂等性
    │
    ├─ 【0005】支付完成标记不清晰？
    │  └─ 添加 paid 布尔字段，简化状态判断
    │
    └─ 【0006】支付模式需要区分？
       └─ 添加 scene 字段，支持多种计费模式
```

---

## 演化特征分析

### 时间维度

```
迁移周期：
├─ 密集期 (0000-0002): 核心功能和性能 (快速迭代)
└─ 优化期 (0003-0006): 细节完善和扩展 (稳定迭代)
```

### 设计哲学

```
MkSaaS 数据库迭代的三大原则：

1️⃣ 早期完整 (0000-0001)
   ─ 一次性设计完整的表结构
   ─ 避免频繁的破坏性迁移
   
2️⃣ 中期优化 (0002)
   ─ 性能索引全覆盖
   ─ 无结构改动，低风险
   
3️⃣ 后期完善 (0003-0006)
   ─ 逐列添加新字段
   ─ 每个字段都有明确的业务目标
   ─ 遵循 Add Only 原则（不删不改，只加）
```

### 迁移风险等级

| 迁移 | 风险 | 原因 | 影响 |
|------|------|------|------|
| 0000 | 低 | 新表创建 | 无影响 |
| 0001 | 低 | 新表创建 | 无影响 |
| 0002 | 低 | 仅索引 | 性能提升 |
| 0003 | 低 | 列添加 + 索引 | 无影响 |
| 0004 | 低 | 列添加 + UNIQUE | 低风险 |
| 0005 | 低 | 列添加 + DEFAULT | 无影响 |
| 0006 | 低 | 列添加 + 索引 | 无影响 |

**总体评价**：所有迁移都遵循 "Add Only" 原则，零破坏性，线上可安全执行

---

## 最佳实践总结

### 迁移管理

✅ **好的迁移**：
- 一次性完成核心结构 (0000-0001)
- 逐步添加非结构字段 (0003-0006)
- 索引优化单独迁移 (0002)
- 每个迁移有明确的业务目标

⚠️ **避免的做法**：
- 频繁删除/修改列
- 大表的数据类型变更
- 多个无关变更混在一个迁移中

### 迁移命名规范

当前规范：`<序号>_<生成的随机名称>.sql`

建议改进：`<序号>_<功能简述>_<时间戳>.sql`

示例：
```
0000_initial_auth_payment_20240115.sql
0001_credit_system_20240120.sql
0002_performance_indexes_20240125.sql
0003_stripe_session_tracking_20240201.sql
0004_idempotent_invoice_id_20240205.sql
0005_payment_status_flag_20240210.sql
0006_payment_scene_classification_20240215.sql
```

---

## 未来演化预测

### 可能需要的迁移

```
如果项目继续发展：

【可能的 0007】
需求：支持订阅升级/降级
内容：添加 previousSubscriptionId, upgradeDate 等字段

【可能的 0008】
需求：支持分期付款
内容：创建 installmentPlan 表

【可能的 0009】
需求：GDPR 合规
内容：添加 user_audit_log 表

【可能的 0010】
需求：支持优惠券/折扣
内容：创建 coupon, discount 表
```

---

