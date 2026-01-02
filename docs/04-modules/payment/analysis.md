# MkSaaS 支付和积分系统深度分析报告

## 目录
1. [系统架构概览](#系统架构概览)
2. [Stripe 支付集成](#stripe-支付集成)
3. [定价配置](#定价配置)
4. [积分系统](#积分系统)
5. [数据库设计](#数据库设计)
6. [支付流程](#支付流程)
7. [积分分配和消费](#积分分配和消费)
8. [Webhook 处理](#webhook-处理)
9. [Server Actions 和 Hooks](#server-actions-和-hooks)
10. [UI 组件](#ui-组件)
11. [改进建议](#改进建议)

---

## 系统架构概览

### 核心组件构成
```
┌─────────────────────────────────────────┐
│     支付和积分系统架构                     │
├─────────────────────────────────────────┤
│                                          │
│  ┌─────────────────────────────────┐   │
│  │   Stripe 支付提供商              │   │
│  │ (payment/provider/stripe.ts)    │   │
│  └────────────┬────────────────────┘   │
│               │                         │
│  ┌────────────▼────────────────────┐   │
│  │   支付处理层                      │   │
│  │ (src/payment/index.ts)          │   │
│  └────────────┬────────────────────┘   │
│               │                         │
│    ┌──────────┴────────────┬──────────┐ │
│    │                       │          │ │
│ ┌──▼──────┐  ┌──────────┐ │  ┌──────▼─┐│
│ │ 订阅支付 │  │一次性支付 │ │  │积分支付 ││
│ └─────────┘  └──────────┘ │  └────────┘│
│    │                       │          │ │
│ ┌──▼────────────────────────┴──────┬──▼─┐
│ │      积分系统                      │    │
│ │ (src/credits/)                   │    │
│ │ - Credits Management            │    │
│ │ - Distribution Engine           │    │
│ │ - Transaction Tracking          │    │
│ └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │   数据库层 (PostgreSQL)          │   │
│  │ (payment, userCredit, credit    │   │
│  │  Transaction tables)            │   │
│  └─────────────────────────────────┘   │
│                                          │
└─────────────────────────────────────────┘
```

---

## Stripe 支付集成

### 文件位置
- **主实现**: `/src/payment/provider/stripe.ts` (1279 行)
- **类型定义**: `/src/payment/types.ts`
- **入口点**: `/src/payment/index.ts`

### Stripe 初始化
```typescript
class StripeProvider implements PaymentProvider {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    this.stripe = new Stripe(apiKey);
    this.webhookSecret = webhookSecret;
  }
}
```

### 支持的支付类型

#### 1. **订阅支付 (SUBSCRIPTION)**
```typescript
PaymentTypes.SUBSCRIPTION = 'subscription'  // 定期递归支付
PlanIntervals.MONTH = 'month'              // 月度计费
PlanIntervals.YEAR = 'year'                // 年度计费
```

特性:
- 支持免费试用期 (trialPeriodDays)
- 支持优惠券代码
- 自动续费管理
- 支持取消和暂停

#### 2. **一次性支付 (ONE_TIME)**
```typescript
PaymentTypes.ONE_TIME = 'one_time'         // 一次性支付
```

特性:
- 终身计划购买
- 积分包购买
- 支持优惠券代码

### Stripe 客户管理

```typescript
private async createOrGetCustomer(
  email: string,
  name?: string
): Promise<string>
```

功能:
1. 查询现有客户
2. 创建新客户 (如不存在)
3. 数据一致性修复 (处理 email-only 用户)
4. 关联 `customerId` 到用户记录

### 三大支付场景 (PaymentScenes)

```typescript
enum PaymentScenes {
  LIFETIME = 'lifetime',      // 终身计划购买
  CREDIT = 'credit',          // 积分包购买
  SUBSCRIPTION = 'subscription' // 订阅计划
}
```

---

## 定价配置

### 文件位置
- `/src/config/price-config.tsx` (client hook)
- `/src/config/website.tsx` (websiteConfig)

### 三层套餐体系

```typescript
interface PricePlan {
  id: string;                    // 唯一标识符: 'free', 'pro', 'lifetime'
  name?: string;                 // 显示名称
  description?: string;          // 功能描述
  features?: string[];           // 功能列表
  limits?: string[];             // 限制列表
  prices: Price[];               // 价格选项 (可多个)
  isFree: boolean;              // 是否免费套餐
  isLifetime: boolean;           // 是否终身套餐
  popular?: boolean;             // 是否标记为热门
  disabled?: boolean;            // 是否在UI中禁用
  credits?: Credits;             // 积分配置
}
```

### 价格定义

```typescript
interface Price {
  type: PaymentType;             // 'subscription' 或 'one_time'
  priceId: string;               // Stripe Price ID
  amount: number;                // 价格 (美元等)
  currency: string;              // 货币代码
  interval?: PlanInterval;       // 'month' 或 'year'
  trialPeriodDays?: number;      // 试用期天数
  allowPromotionCode?: boolean;  // 允许优惠券
  disabled?: boolean;            // 禁用此价格
}
```

### 积分配置

```typescript
interface Credits {
  enable: boolean;               // 是否启用积分
  amount: number;                // 每月/终身积分数
  expireDays?: number;           // 过期天数 (undefined = 永不过期)
}
```

### 三种套餐详情

#### **Free 套餐**
- 免费使用
- 支持月度积分刷新
- 可设置每月赠送积分数
- 积分可设置过期期限

#### **Pro 套餐**
- 支持月度和年度计费选项
- 按需要设置试用期
- 每月或每年获得定量积分
- 可设置积分过期期限

#### **Lifetime 套餐**
- 一次性付款
- 获得终身访问权限
- 每月获得固定积分 (终身有效)
- 支持按年续费机制

---

## 积分系统

### 核心文件
```
src/credits/
├── types.ts              # 类型定义
├── credits.ts            # 核心积分管理
├── server.ts             # 服务端查询函数
├── client.ts             # 客户端查询函数
└── distribute.ts         # 积分分配引擎 (cron 任务)
```

### 积分类型 (CREDIT_TRANSACTION_TYPE)

```typescript
enum CREDIT_TRANSACTION_TYPE {
  MONTHLY_REFRESH = 'MONTHLY_REFRESH',           // 免费用户月度刷新
  REGISTER_GIFT = 'REGISTER_GIFT',               // 注册赠送
  PURCHASE_PACKAGE = 'PURCHASE_PACKAGE',         // 购买积分包
  SUBSCRIPTION_RENEWAL = 'SUBSCRIPTION_RENEWAL', // 订阅续费获得
  LIFETIME_MONTHLY = 'LIFETIME_MONTHLY',         // 终身计划月度分配
  USAGE = 'USAGE',                               // 积分消费
  EXPIRE = 'EXPIRE',                             // 积分过期
}
```

### 核心函数

#### 1. **查询余额**
```typescript
async function getUserCredits(userId: string): Promise<number>
// 返回用户当前积分余额
```

#### 2. **添加积分**
```typescript
async function addCredits({
  userId: string;
  amount: number;          // 必须 > 0
  type: string;            // 交易类型
  description: string;
  paymentId?: string;
  expireDays?: number;
}): Promise<void>
```

流程:
1. 验证参数
2. 获取或创建 `userCredit` 记录
3. 更新余额
4. 创建 `creditTransaction` 记录

#### 3. **消费积分 (FIFO 策略)**
```typescript
async function consumeCredits({
  userId: string;
  amount: number;          // 必须 > 0
  description: string;
}): Promise<void>
```

消费策略:
- **FIFO (先进先出)**: 优先消费最早的积分
- **过期优先**: 优先消费即将过期的积分
- **检查余额**: 消费前必须检查是否有足够积分
- **跟踪剩余**: 每笔交易跟踪剩余额度

实现细节:
```typescript
// 选择要消费的积分
const transactions = await db.select()
  .from(creditTransaction)
  .where(
    and(
      eq(creditTransaction.userId, userId),
      // 排除消费和过期记录
      not(eq(creditTransaction.type, CREDIT_TRANSACTION_TYPE.USAGE)),
      not(eq(creditTransaction.type, CREDIT_TRANSACTION_TYPE.EXPIRE)),
      // 只选择有剩余额度的
      gt(creditTransaction.remainingAmount, 0),
      // 只选择未过期的
      or(
        isNull(creditTransaction.expirationDate),
        gt(creditTransaction.expirationDate, now)
      )
    )
  )
  .orderBy(
    asc(creditTransaction.expirationDate),  // 先按过期时间
    asc(creditTransaction.createdAt)        // 再按创建时间
  );

// FIFO 消费
let remainingToDeduct = amount;
for (const transaction of transactions) {
  if (remainingToDeduct <= 0) break;
  const deductFromThis = Math.min(
    transaction.remainingAmount || 0,
    remainingToDeduct
  );
  // 更新交易的剩余额度
  await db.update(creditTransaction)
    .set({
      remainingAmount: remainingAmount - deductFromThis,
      updatedAt: new Date()
    })
    .where(eq(creditTransaction.id, transaction.id));
  remainingToDeduct -= deductFromThis;
}
```

#### 4. **积分过期处理**
```typescript
async function processExpiredCredits(userId: string): Promise<void>
// 处理单个用户的过期积分
```

过期流程:
1. 查找所有有过期日期的交易
2. 检查是否超过过期日期
3. 将剩余额度设为 0
4. 更新用户余额
5. 创建 EXPIRE 类型的交易记录

---

## 数据库设计

### 表结构

#### 1. **payment 表** (支付记录)
```typescript
export const payment = pgTable("payment", {
  id: text("id").primaryKey(),           // UUID
  priceId: text('price_id').notNull(),   // Stripe Price ID
  type: text('type').notNull(),          // 'subscription' | 'one_time'
  scene: text('scene'),                  // 'lifetime' | 'credit' | 'subscription'
  interval: text('interval'),            // 'month' | 'year'
  
  userId: text('user_id').references(user.id),
  customerId: text('customer_id'),       // Stripe Customer ID
  subscriptionId: text('subscription_id'),  // Stripe Subscription ID
  sessionId: text('session_id'),         // Stripe Checkout Session ID
  invoiceId: text('invoice_id').unique(), // Stripe Invoice ID (防重)
  
  status: text('status').notNull(),      // 支付状态
  paid: boolean('paid').default(false),  // 是否已支付
  
  // 订阅相关
  periodStart: timestamp('period_start'),
  periodEnd: timestamp('period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end'),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 索引优化
indexes: [
  payment_type_idx,
  payment_scene_idx,
  payment_price_id_idx,
  payment_user_id_idx,
  payment_customer_id_idx,
  payment_status_idx,
  payment_paid_idx,
  payment_subscription_id_idx,
  payment_session_id_idx,
  payment_invoice_id_idx,
]
```

#### 2. **userCredit 表** (用户积分余额)
```typescript
export const userCredit = pgTable("user_credit", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(user.id),
  currentCredits: integer("current_credits").default(0),
  lastRefreshAt: timestamp("last_refresh_at"), // 已弃用
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 索引
indexes: [user_credit_user_id_idx]
```

#### 3. **creditTransaction 表** (积分交易历史)
```typescript
export const creditTransaction = pgTable("credit_transaction", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(user.id),
  type: text("type").notNull(),          // 交易类型
  description: text("description"),      // 交易描述
  amount: integer("amount").notNull(),   // 交易额度 (+ 或 -)
  remainingAmount: integer("remaining_amount"), // 该笔积分的剩余额度
  paymentId: text("payment_id"),         // 关联的发票ID
  
  expirationDate: timestamp("expiration_date"), // 过期日期
  expirationDateProcessedAt: timestamp("expiration_date_processed_at"), // 过期处理时间
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 索引
indexes: [
  credit_transaction_user_id_idx,
  credit_transaction_type_idx,
]
```

### 数据关系图

```
user (1) ──────┬────────────────────┬──────────────── (many) payment
               │                    │
               │                    ├──────────────── (many) userCredit
               │                    │
               └──────────────────── (many) creditTransaction

payment (1) ──────────────────────────────── (1) Stripe Customer
              └──────────────────────────────── (0..1) Stripe Subscription
              └──────────────────────────────── (many) Stripe Invoices
```

---

## 支付流程

### 流程图

```
                 ┌─────────────────────────┐
                 │  用户点击购买/订阅       │
                 └────────────┬────────────┘
                              │
                 ┌────────────▼────────────┐
                 │ createCheckout/         │
                 │ createCreditCheckout    │
                 └────────────┬────────────┘
                              │
        ┌─────────────────────┴──────────────────────┐
        │                                            │
    ┌───▼────────────┐                  ┌──────────▼──────────┐
    │ 创建客户记录    │                  │ 获取/创建 Stripe   │
    │ (user table)   │                  │ Customer          │
    └───┬────────────┘                  └──────────┬──────────┘
        │                                          │
        └──────────────────┬───────────────────────┘
                           │
                ┌──────────▼──────────┐
                │ Stripe Checkout     │
                │ Session 创建        │
                └──────────┬──────────┘
                           │
                ┌──────────▼──────────────────┐
                │ 用户在 Stripe 页面支付      │
                └──────────┬──────────────────┘
                           │
    ┌──────────────────────┴──────────────────────┐
    │          Webhook 事件序列                    │
    │                                             │
    │  1. checkout.session.completed              │
    │     └─> 创建 payment 记录 (paid=false)      │
    │                                             │
    │  2. customer.subscription.created (仅订阅)  │
    │     └─> 记录日志                            │
    │                                             │
    │  3. customer.subscription.updated (可选)    │
    │     └─> 更新支付状态和周期                  │
    │                                             │
    │  4. invoice.paid                            │
    │     └─> 查找 payment 记录                   │
    │     └─> 更新 payment (paid=true)            │
    │     └─> 分配积分                            │
    │     └─> 发送通知                            │
    │                                             │
    └──────────────────────────────────────────────┘
                           │
                ┌──────────▼────────────┐
                │ 支付完成               │
                │ 用户获得积分/权限       │
                └───────────────────────┘
```

### 核心支付流程实现

#### A. 创建结账会话

```typescript
public async createCheckout(
  params: CreateCheckoutParams
): Promise<CheckoutResult> {
  // 1. 验证计划和价格
  const plan = findPlanByPlanId(planId);
  const price = findPriceInPlan(planId, priceId);

  // 2. 创建/获取 Stripe 客户
  const customerId = await this.createOrGetCustomer(
    customerEmail,
    userName
  );

  // 3. 创建 Checkout Session
  const checkoutParams: Stripe.Checkout.SessionCreateParams = {
    line_items: [{ price: priceId, quantity: 1 }],
    mode: price.type === PaymentTypes.SUBSCRIPTION ? 'subscription' : 'payment',
    customer: customerId,
    metadata: { planId, priceId, ...metadata },
    allow_promotion_codes: price.allowPromotionCode ?? false,
  };

  // 4. 添加订阅特定数据
  if (price.type === PaymentTypes.SUBSCRIPTION) {
    checkoutParams.subscription_data = {
      metadata: customMetadata,
      trial_period_days: price.trialPeriodDays,
    };
  }

  // 5. 创建会话并返回
  const session = await this.stripe.checkout.sessions.create(checkoutParams);
  return { url: session.url!, id: session.id };
}
```

#### B. Webhook 处理 - Checkout 完成

```typescript
private async onCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  // 根据支付类型分发处理
  if (session.mode === 'subscription') {
    await this.createSubscriptionPaymentRecord(session);
  } else if (session.mode === 'payment') {
    await this.createOneTimePaymentRecord(session);
  }
}

// 创建支付记录 (paid=false，等待 invoice.paid 事件)
private async createSubscriptionPaymentRecord(
  session: Stripe.Checkout.Session
): Promise<void> {
  const subscription = await this.stripe.subscriptions.retrieve(
    session.subscription as string
  );

  await db.insert(payment).values({
    id: randomUUID(),
    type: PaymentTypes.SUBSCRIPTION,
    scene: PaymentScenes.SUBSCRIPTION,
    userId: session.metadata?.userId!,
    customerId: session.customer as string,
    subscriptionId: session.subscription as string,
    sessionId: session.id,
    invoiceId: session.invoice as string | null,
    paid: false, // 标记为未支付，等待 invoice.paid
    status: this.mapSubscriptionStatusToPaymentStatus(subscription.status),
    // ... 其他字段
  });
}
```

#### C. Webhook 处理 - 发票已支付

```typescript
private async onInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  // 1. 使用重试机制查找 payment 记录
  // (处理 race condition: invoice.paid 可能比 checkout.session.completed 更早到达)
  const paymentRecord = await this.findPaymentRecordWithRetry(invoice);

  // 2. 根据支付类型处理
  if (paymentRecord.type === PaymentTypes.SUBSCRIPTION) {
    await this.updateSubscriptionPayment(invoice, paymentRecord);
  } else {
    await this.updateOneTimePayment(invoice, paymentRecord);
  }
}

// 更新订阅支付记录
private async updateSubscriptionPayment(
  invoice: Stripe.Invoice,
  paymentRecord: Payment
): Promise<void> {
  // 获取订阅详情
  const subscription = await this.stripe.subscriptions.retrieve(
    paymentRecord.subscriptionId!
  );

  // 更新支付记录为已支付
  await db.update(payment)
    .set({
      paid: true,
      status: this.mapSubscriptionStatusToPaymentStatus(subscription.status),
      periodStart: this.getPeriodStart(subscription),
      periodEnd: this.getPeriodEnd(subscription),
      // ... 其他字段
    })
    .where(eq(payment.id, paymentRecord.id));

  // 处理订阅权益 (分配积分)
  await this.processSubscriptionPurchase(userId, priceId);
}

// 处理订阅权益
private async processSubscriptionPurchase(
  userId: string,
  priceId: string
): Promise<void> {
  if (websiteConfig.credits?.enableCredits) {
    await addSubscriptionCredits(userId, priceId);
  }
}
```

### 支付状态转换

```
checkout.session.completed
    │
    ├─> payment.status = 'trialing'|'incomplete'|'active' (根据订阅状态)
    ├─> payment.paid = false
    │
invoice.paid event
    │
    └─> payment.paid = true
    └─> payment.status = 'completed'|'active' (一次性或订阅)
    └─> 分配积分
    └─> 发送通知
```

---

## 积分分配和消费

### 分配策略

积分分配由 `src/credits/distribute.ts` 管理，设计为 **cron 任务** 调用：

```typescript
export async function distributeCreditsToAllUsers() {
  // 1. 批量处理过期积分
  await batchProcessExpiredCredits();

  // 2. 分类用户
  const freeUsers = [];        // 免费用户
  const lifetimeUsers = [];    // 终身用户
  const yearlyUsers = [];      // 年度订阅用户

  // 3. 按类型分发
  await batchAddMonthlyFreeCredits(freeUsers);      // 免费积分
  await batchAddLifetimeMonthlyCredits(lifetimeUsers); // 终身积分
  await batchAddYearlyUsersMonthlyCredits(yearlyUsers); // 年度订阅积分
}
```

#### A. 免费用户月度积分

```typescript
async function addMonthlyFreeCredits(
  userId: string,
  planId: string
): Promise<void> {
  // 1. 验证免费套餐配置
  const pricePlan = findPlanByPlanId(planId);
  if (!pricePlan.isFree || !pricePlan.credits?.enable) return;

  // 2. 检查本月是否已领取 (防重)
  const canAdd = await canAddCreditsByType(
    userId,
    CREDIT_TRANSACTION_TYPE.MONTHLY_REFRESH
  );
  if (!canAdd) return; // 已在本月领取过

  // 3. 添加积分
  const credits = pricePlan.credits.amount;
  const expireDays = pricePlan.credits.expireDays;
  await addCredits({
    userId,
    amount: credits,
    type: CREDIT_TRANSACTION_TYPE.MONTHLY_REFRESH,
    description: `Free monthly credits: ${credits} for 2024-11`,
    expireDays,
  });
}
```

#### B. 订阅续费积分

当 invoice.paid 事件到达时:

```typescript
async function addSubscriptionCredits(
  userId: string,
  priceId: string
): Promise<void> {
  // 1. 获取套餐配置
  const pricePlan = findPlanByPriceId(priceId);
  if (!pricePlan.credits?.enable) return;

  // 2. 检查本月是否已领取
  const canAdd = await canAddCreditsByType(
    userId,
    CREDIT_TRANSACTION_TYPE.SUBSCRIPTION_RENEWAL
  );
  if (!canAdd) return;

  // 3. 添加积分
  const credits = pricePlan.credits.amount;
  const expireDays = pricePlan.credits.expireDays;
  await addCredits({
    userId,
    amount: credits,
    type: CREDIT_TRANSACTION_TYPE.SUBSCRIPTION_RENEWAL,
    description: `Subscription renewal credits: ${credits}`,
    expireDays,
  });
}
```

#### C. 终身计划积分

购买终身计划后获得初始积分 + 每月积分:

```typescript
// 购买时 (webhook 中)
await addLifetimeMonthlyCredits(userId, priceId);

// Cron 任务中每月分配
async function addLifetimeMonthlyCredits(
  userId: string,
  priceId: string
): Promise<void> {
  const pricePlan = findPlanByPriceId(priceId);
  if (!pricePlan.isLifetime || !pricePlan.credits?.enable) return;

  const canAdd = await canAddCreditsByType(
    userId,
    CREDIT_TRANSACTION_TYPE.LIFETIME_MONTHLY
  );
  if (!canAdd) return;

  await addCredits({
    userId,
    amount: pricePlan.credits.amount,
    type: CREDIT_TRANSACTION_TYPE.LIFETIME_MONTHLY,
    description: `Lifetime monthly credits: ${pricePlan.credits.amount}`,
    expireDays: pricePlan.credits.expireDays,
  });
}
```

#### D. 批量分配优化

```typescript
async function batchAddMonthlyFreeCredits(userIds: string[]) {
  // 使用事务保证数据一致性
  await db.transaction(async (tx) => {
    // 1. 查询所有用户积分记录
    const userCredits = await tx
      .select()
      .from(userCredit)
      .where(inArray(userCredit.userId, userIds));

    // 2. 确定哪些用户可以领取 (本月未领过)
    const eligibleUserIds = [];
    for (const userId of userIds) {
      const canAdd = await canAddCreditsByType(
        userId,
        CREDIT_TRANSACTION_TYPE.MONTHLY_REFRESH
      );
      if (canAdd) eligibleUserIds.push(userId);
    }

    // 3. 批量插入交易记录
    const transactions = eligibleUserIds.map(userId => ({
      id: randomUUID(),
      userId,
      type: CREDIT_TRANSACTION_TYPE.MONTHLY_REFRESH,
      amount: credits,
      remainingAmount: credits,
      expirationDate: expirationDate,
      createdAt: now,
    }));
    await tx.insert(creditTransaction).values(transactions);

    // 4. 插入新的用户积分记录 (如不存在)
    if (newUserIds.length > 0) {
      await tx.insert(userCredit).values(newRecords);
    }

    // 5. 更新现有用户积分余额
    for (const userId of existingUserIds) {
      const newBalance = currentCredits + credits;
      await tx.update(userCredit)
        .set({ currentCredits: newBalance })
        .where(eq(userCredit.userId, userId));
    }
  });
}
```

### 消费流程

```typescript
await consumeCreditsAction({
  amount: 10,  // 消费 10 积分
  description: 'Generate image'
});

// 内部处理:
// 1. 检查余额: balance >= 10
// 2. FIFO 消费: 从最早的积分开始
// 3. 更新交易记录的 remainingAmount
// 4. 减少 userCredit.currentCredits
// 5. 记录 USAGE 类型交易
```

---

## Webhook 处理

### Webhook 事件处理流程

#### 文件位置
`/src/app/api/webhooks/stripe/route.ts`

#### 路由处理

```typescript
export async function POST(req: NextRequest): Promise<NextResponse> {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature') || '';

  try {
    // 验证签名并构造事件
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    // 分发处理
    await handleWebhookEvent(payload, signature);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error in webhook route:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}
```

### 事件处理架构

```typescript
async handleWebhookEvent(payload: string, signature: string) {
  const event = stripe.webhooks.constructEvent(payload, signature, secret);

  switch (event.type) {
    // ════════════════════════════════════════════════════
    // 订阅相关事件
    // ════════════════════════════════════════════════════
    case 'customer.subscription.created':
      await onCreateSubscription(event.data.object);
      break;

    case 'customer.subscription.updated':
      await onUpdateSubscription(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await onDeleteSubscription(event.data.object);
      break;

    // ════════════════════════════════════════════════════
    // 发票相关事件 (关键: 这是支付完成的标志)
    // ════════════════════════════════════════════════════
    case 'invoice.paid':
      await onInvoicePaid(event.data.object);
      break;

    // ════════════════════════════════════════════════════
    // Checkout 相关事件 (创建初始支付记录)
    // ════════════════════════════════════════════════════
    case 'checkout.session.completed':
      await onCheckoutCompleted(event.data.object);
      break;
  }
}
```

### 关键事件详解

#### 1. **checkout.session.completed**

**触发时机**: 用户成功在 Stripe 页面完成结账

**处理流程**:
```typescript
private async onCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  if (session.mode === 'subscription') {
    // 创建订阅支付记录
    await this.createSubscriptionPaymentRecord(session);
  } else {
    // 创建一次性支付记录
    await this.createOneTimePaymentRecord(session);
  }
}
```

**创建的记录状态**:
- `paid = false`: 等待 invoice.paid 事件
- `status`: 订阅状态 (trialing, incomplete, active 等) 或 'completed'
- 保存 `sessionId`、`invoiceId` 用于后续查找

**重要**: 这个阶段还不知道支付是否真正完成，只是创建占位符。

#### 2. **customer.subscription.created**

**触发时机**: 订阅第一次创建

**处理**: 仅记录日志，实际处理在 subscription.updated 中

#### 3. **customer.subscription.updated**

**触发时机**: 
- 订阅续费
- 订阅计划变更
- 订阅取消

**处理内容**:
```typescript
private async onUpdateSubscription(
  subscription: Stripe.Subscription
): Promise<void> {
  // 更新支付记录中的订阅信息
  await db.update(payment)
    .set({
      priceId,
      status,
      periodStart,
      periodEnd,
      cancelAtPeriodEnd,
      trialStart,
      trialEnd,
    })
    .where(eq(payment.subscriptionId, subscription.id));
}
```

#### 4. **invoice.paid** (最关键!)

**触发时机**: 发票已支付 (支付完成的真实标志)

**处理流程**:
```
invoice.paid
  │
  ├─ 1. 查找关联的 payment 记录 (使用重试机制)
  │      └─ 使用 invoiceId 或 subscriptionId 查找
  │      └─ 如果找不到，自动重试 (最多 5 次，间隔 100ms)
  │
  ├─ 2. 判断是订阅还是一次性支付
  │      └─ 查看 payment.type 字段
  │
  ├─ 3a. 如果是订阅支付 (SUBSCRIPTION)
  │      ├─ 获取 Stripe 订阅详情
  │      ├─ 更新支付记录: paid = true
  │      ├─ 分配订阅积分
  │      └─ 记录日志
  │
  ├─ 3b. 如果是一次性支付 (ONE_TIME)
  │      ├─ 更新支付记录: paid = true, status = 'completed'
  │      ├─ 根据 metadata.type 判断是否是积分购买
  │      ├─ 如果是积分购买: 调用 processCreditPurchase()
  │      ├─ 如果是终身计划: 调用 processLifetimePlanPurchase()
  │      │  ├─ 分配终身月度积分
  │      │  └─ 发送通知
  │      └─ 记录日志
  │
  └─ 4. 返回 200 OK
```

**重试机制的必要性**:

在高并发场景下，webhook 事件的到达顺序可能是:
```
场景 1: 正常顺序
  checkout.session.completed → invoice.paid  ✓

场景 2: 反序到达 (race condition)
  invoice.paid → checkout.session.completed  ✗
  └─> 需要重试查找 payment 记录
```

实现:
```typescript
private async findPaymentRecordWithRetry(
  invoice: Stripe.Invoice
): Promise<Payment | null> {
  for (let attempt = 1; attempt <= PAYMENT_RECORD_RETRY_ATTEMPTS; attempt++) {
    const paymentRecord = await this.findPaymentRecord(invoice);

    if (paymentRecord) {
      console.log(`Found on attempt ${attempt}`);
      return paymentRecord;
    }

    if (attempt < PAYMENT_RECORD_RETRY_ATTEMPTS) {
      // 延迟后重试
      await new Promise((resolve) =>
        setTimeout(resolve, PAYMENT_RECORD_RETRY_DELAY)
      );
    }
  }

  return null; // 仍未找到，记录错误
}
```

---

## Server Actions 和 Hooks

### Server Actions (服务端函数)

#### 1. **createCreditCheckoutSession**
**文件**: `/src/actions/create-credit-checkout-session.ts`

功能: 创建积分包结账会话

```typescript
export const createCreditCheckoutSession = userActionClient
  .schema(creditCheckoutSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { packageId, priceId, metadata } = parsedInput;
    const currentUser = (ctx as { user: User }).user;

    // 验证积分包存在
    const creditPackage = getCreditPackageById(packageId);
    if (!creditPackage) return { success: false, error: '...' };

    // 添加 metadata 标记为积分购买
    const customMetadata = {
      ...metadata,
      type: 'credit_purchase',
      packageId,
      credits: creditPackage.amount.toString(),
      userId: currentUser.id,
    };

    // 创建 Stripe checkout session
    const result = await createCreditCheckout({
      packageId,
      priceId,
      customerEmail: currentUser.email,
      metadata: customMetadata,
      successUrl,
      cancelUrl,
      locale,
    });

    return { success: true, data: result };
  });
```

#### 2. **consumeCreditsAction**
**文件**: `/src/actions/consume-credits.ts`

功能: 消费用户积分

```typescript
export const consumeCreditsAction = userActionClient
  .schema(consumeSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { amount, description } = parsedInput;
    const currentUser = (ctx as { user: User }).user;

    try {
      await consumeCredits({
        userId: currentUser.id,
        amount,
        description: description || `Consume credits: ${amount}`,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
```

#### 3. **getCreditBalanceAction**
**文件**: `/src/actions/get-credit-balance.ts`

功能: 获取用户当前积分余额

```typescript
export const getCreditBalanceAction = userActionClient.action(
  async ({ ctx }) => {
    const currentUser = (ctx as { user: User }).user;
    const credits = await getUserCredits(currentUser.id);
    return { success: true, credits };
  }
);
```

#### 4. **getCreditStatsAction**
**文件**: `/src/actions/get-credit-stats.ts`

功能: 获取积分统计 (即将过期积分)

```typescript
export const getCreditStatsAction = userActionClient.action(async ({ ctx }) => {
  const currentUser = (ctx as { user: User }).user;
  const now = new Date();
  const expirationDaysFromNow = addDays(now, CREDITS_EXPIRATION_DAYS);

  // 查询 30 天内过期的积分
  const expiringCreditsResult = await db
    .select({
      totalAmount: sum(creditTransaction.remainingAmount),
    })
    .from(creditTransaction)
    .where(
      and(
        eq(creditTransaction.userId, currentUser.id),
        isNotNull(creditTransaction.expirationDate),
        gte(creditTransaction.expirationDate, now),
        lte(creditTransaction.expirationDate, expirationDaysFromNow)
      )
    );

  return {
    success: true,
    data: {
      expiringCredits: {
        amount: Number(expiringCreditsResult[0]?.totalAmount) || 0,
      },
    },
  };
});
```

#### 5. **getCreditTransactionsAction**
**文件**: `/src/actions/get-credit-transactions.ts`

功能: 获取积分交易历史 (支持分页、搜索、排序、过滤)

```typescript
export const getCreditTransactionsAction = userActionClient
  .schema(getCreditTransactionsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { pageIndex, pageSize, search, sorting, filters } = parsedInput;
    const currentUser = (ctx as { user: User }).user;

    // 构建 WHERE 条件
    const whereConditions = [eq(creditTransaction.userId, currentUser.id)];

    // 搜索逻辑
    if (search) {
      const searchConditions = [
        ilike(creditTransaction.type, `%${search}%`),
        ilike(creditTransaction.description, `%${search}%`),
      ];
      // 如果是数字，也搜索金额
      const numericSearch = Number.parseInt(search, 10);
      if (!Number.isNaN(numericSearch)) {
        searchConditions.push(
          eq(creditTransaction.amount, numericSearch),
          eq(creditTransaction.remainingAmount, numericSearch)
        );
      }
      whereConditions.push(or(...searchConditions));
    }

    // 执行查询
    const [items, [{ count }]] = await Promise.all([
      db.select().from(creditTransaction)
        .where(and(...whereConditions))
        .orderBy(sortDirection(sortField))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: countFn() })
        .from(creditTransaction)
        .where(and(...whereConditions)),
    ]);

    return {
      success: true,
      data: { items, total: Number(count) },
    };
  });
```

### React Hooks (客户端)

#### 1. **useCreditBalance**
```typescript
export function useCreditBalance() {
  return useQuery({
    queryKey: creditsKeys.balance(),
    queryFn: async () => {
      const result = await getCreditBalanceAction();
      if (!result?.data?.success) throw new Error(result?.data?.error);
      return result.data.credits || 0;
    },
  });
}

// 使用
const { data: balance, isLoading } = useCreditBalance();
```

#### 2. **useConsumeCredits**
```typescript
export function useConsumeCredits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, description }) => {
      const result = await consumeCreditsAction({ amount, description });
      if (!result?.data?.success) throw new Error(result?.data?.error);
      return result.data;
    },
    onSuccess: () => {
      // 失效缓存，触发重新获取
      queryClient.invalidateQueries({
        queryKey: creditsKeys.balance(),
      });
      queryClient.invalidateQueries({
        queryKey: creditsKeys.stats(),
      });
    },
  });
}

// 使用
const { mutate: consumeCredits } = useConsumeCredits();
consumeCredits({ amount: 10, description: 'Generate image' });
```

#### 3. **useCreditTransactions**
```typescript
export function useCreditTransactions(
  pageIndex: number,
  pageSize: number,
  search: string,
  sorting: SortingState,
  filters: SimpleFilter[]
) {
  return useQuery({
    queryKey: creditsKeys.transactionsList({
      pageIndex,
      pageSize,
      search,
      sorting,
      filters,
    }),
    queryFn: async () => {
      const result = await getCreditTransactionsAction({
        pageIndex,
        pageSize,
        search,
        sorting,
        filters,
      });
      if (!result?.data?.success) throw new Error(result?.data?.error);
      return {
        items: result.data.data?.items || [],
        total: result.data.data?.total || 0,
      };
    },
    placeholderData: keepPreviousData,
  });
}

// 使用
const { data: { items, total } } = useCreditTransactions(
  0,      // pageIndex
  10,     // pageSize
  search, // 搜索词
  sorting, // 排序
  filters  // 过滤
);
```

#### 4. **useCurrentPlan**
```typescript
export function useCurrentPlan(userId: string | undefined) {
  return useQuery({
    queryKey: paymentKeys.currentPlan(userId || ''),
    queryFn: async (): Promise<{
      currentPlan: PricePlan | null;
      subscription: Subscription | null;
    }> => {
      if (!userId) throw new Error('User ID is required');
      const result = await getCurrentPlanAction({ userId });
      if (!result?.data?.success) throw new Error(result?.data?.error);
      return result.data.data || {
        currentPlan: getAllPricePlans().find(p => p.isFree) || null,
        subscription: null,
      };
    },
    enabled: !!userId,
    refetchOnWindowFocus: true,
  });
}

// 使用
const { data: { currentPlan, subscription } } = useCurrentPlan(userId);
```

#### 5. **usePaymentCompletion**
```typescript
export function usePaymentCompletion(
  sessionId: string | null,
  enablePolling = false
) {
  return useQuery({
    queryKey: paymentCompletionKeys.session(sessionId || ''),
    queryFn: async () => {
      if (!sessionId) return { isPaid: false };
      const result = await checkPaymentCompletionAction({ sessionId });
      if (!result?.data?.success) throw new Error(result?.data?.error);
      return { isPaid: result.data.isPaid };
    },
    enabled: !!sessionId,
    refetchInterval: enablePolling ? PAYMENT_POLL_INTERVAL : false,
    refetchIntervalInBackground: true,
  });
}

// 使用 (支付完成后重定向)
const { data: { isPaid } } = usePaymentCompletion(sessionId, true);
useEffect(() => {
  if (isPaid) {
    redirect('/dashboard'); // 支付完成，跳转
  }
}, [isPaid]);
```

---

## UI 组件

### 组件树

```
src/components/
├── payment/
│   └── payment-card.tsx             # 支付卡片组件
│
├── pricing/
│   ├── pricing-table.tsx            # 定价表格
│   └── pricing-card.tsx             # 单个套餐卡片
│
├── blocks/pricing/
│   └── pricing.tsx                  # 定价区块
│
├── settings/
│   └── credits/
│       ├── credits-card.tsx         # 积分卡片 (显示余额)
│       ├── credit-packages.tsx       # 积分包列表
│       ├── credit-checkout-button.tsx # 购买按钮
│       ├── credit-transactions-table.tsx # 交易历史表格
│       ├── credit-detail-viewer.tsx  # 交易详情查看器
│       └── credits-page-client.tsx  # 积分页面主组件
│
├── layout/
│   ├── credits-balance-button.tsx   # 顶部积分显示按钮
│   ├── credits-balance-menu.tsx     # 积分菜单 (带购买链接)
│   └── credits-provider.tsx         # 积分 Provider (全局状态)
│
└── test/
    └── consume-credits-card.tsx     # 积分消费测试组件
```

### 关键组件

#### 1. **creditsBalanceButton** (顶部导航栏)
- 显示当前积分余额
- 点击打开积分菜单

#### 2. **creditsBalanceMenu** (积分下拉菜单)
- 显示详细余额信息
- 链接到积分购买页面
- 显示即将过期的积分

#### 3. **creditCheckoutButton** (购买按钮)
```typescript
// 流程:
// 1. 用户点击购买
// 2. 调用 createCreditCheckoutSession
// 3. 获取 Stripe checkout URL
// 4. 重定向到 Stripe
// 5. 用户在 Stripe 页面支付
// 6. 支付完成后 webhook 处理
```

#### 4. **creditTransactionsTable** (交易历史表)
- 支持分页
- 支持搜索 (类型、描述、金额)
- 支持排序 (日期、金额、类型等)
- 支持过滤 (交易类型)

---

## 改进建议

### 1. **性能优化**

#### A. 数据库查询优化
```typescript
// 当前: N+1 查询
for (const userId of userIds) {
  const canAdd = await canAddCreditsByType(userId, type);
  // 每次都查询一次
}

// 改进: 批量查询
const transactions = await db
  .select({
    userId: creditTransaction.userId,
    hasTransaction: sql`COUNT(*) > 0`,
  })
  .from(creditTransaction)
  .where(
    and(
      inArray(creditTransaction.userId, userIds),
      eq(creditTransaction.type, type),
      sql`EXTRACT(MONTH FROM created_at) = ${currentMonth}`
    )
  )
  .groupBy(creditTransaction.userId);

const usersWithTransaction = new Set(
  transactions.map(t => t.userId)
);
const eligibleUserIds = userIds.filter(
  id => !usersWithTransaction.has(id)
);
```

#### B. 缓存策略
```typescript
// 添加 Redis 缓存用户积分余额
const cacheKey = `credit:balance:${userId}`;
let balance = await redis.get(cacheKey);

if (!balance) {
  balance = await db
    .select({ currentCredits: userCredit.currentCredits })
    .from(userCredit)
    .where(eq(userCredit.userId, userId));
  
  // 缓存 5 分钟
  await redis.setex(cacheKey, 300, balance);
}
```

#### C. 索引优化
```typescript
// 添加复合索引
CREATE INDEX idx_credit_transaction_user_type_date 
ON credit_transaction(user_id, type, created_at DESC);

CREATE INDEX idx_payment_user_status 
ON payment(user_id, status, paid);
```

### 2. **可靠性改进**

#### A. 幂等性保证
```typescript
// 使用 invoiceId 唯一约束防止重复处理
// 目前已实现 ✓
invoiceId: text('invoice_id').unique()

// 改进: 也可以添加复合唯一约束
UNIQUE(subscription_id, invoice_id)
```

#### B. 完整的重试机制
```typescript
// 改进: 添加全局重试中间件
class RetryableWebhookHandler {
  async handle(event: Stripe.Event, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.processEvent(event);
        break;
      } catch (error) {
        if (attempt === maxRetries) throw error;
        
        // 指数退避
        const delay = Math.pow(2, attempt) * 1000;
        await sleep(delay);
      }
    }
  }
}
```

#### C. 死信队列 (DLQ)
```typescript
// 添加失败的 webhook 到队列进行后续处理
class WebhookProcessor {
  async handleWebhook(event: Stripe.Event) {
    try {
      await processEvent(event);
    } catch (error) {
      // 记录到 DLQ，稍后重试
      await deadLetterQueue.push({
        eventId: event.id,
        eventType: event.type,
        payload: event,
        error: error.message,
        timestamp: Date.now(),
      });
      
      // 返回 200 告诉 Stripe 已收到，但稍后重试
      return { received: true };
    }
  }
}
```

### 3. **功能增强**

#### A. 积分有效期预警
```typescript
// 添加即将过期通知
export async function notifyExpiringCredits(userId: string) {
  const db = await getDb();
  const warningDate = addDays(new Date(), 7); // 7 天内过期

  const expiringCredits = await db
    .select({ amount: sum(creditTransaction.remainingAmount) })
    .from(creditTransaction)
    .where(
      and(
        eq(creditTransaction.userId, userId),
        between(creditTransaction.expirationDate, new Date(), warningDate)
      )
    );

  if (expiringCredits[0]?.amount > 0) {
    // 发送邮件或推送通知
    await sendNotification(userId, {
      type: 'credit_expiring_soon',
      amount: expiringCredits[0].amount,
    });
  }
}
```

#### B. 积分转让/共享
```typescript
interface CreditTransfer {
  fromUserId: string;
  toUserId: string;
  amount: number;
  reason: string;
  createdAt: Date;
}

export async function transferCredits({
  fromUserId,
  toUserId,
  amount,
}: CreditTransfer) {
  // 验证: 源用户有足够积分
  // 执行转账
  // 记录交易 (类型: TRANSFER_OUT / TRANSFER_IN)
}
```

#### C. 积分折扣/促销
```typescript
interface CreditPromotion {
  code: string;
  bonusCredits: number;
  maxUses: number;
  expiryDate: Date;
}

export async function applyCreditPromotion(
  userId: string,
  code: string
) {
  const promotion = await getPromotion(code);
  if (!promotion) throw new Error('Invalid promo code');

  // 验证未使用过
  // 添加奖励积分
  // 记录使用
}
```

#### D. 积分消费分析
```typescript
export async function getCreditAnalytics(userId: string) {
  const db = await getDb();
  
  return {
    // 本月消费
    monthlyUsage: await db
      .select({ total: sum(creditTransaction.amount) })
      .from(creditTransaction)
      .where(
        and(
          eq(creditTransaction.userId, userId),
          eq(creditTransaction.type, CREDIT_TRANSACTION_TYPE.USAGE),
          isCurrentMonth(creditTransaction.createdAt)
        )
      ),
    
    // 消费趋势 (最近 6 个月)
    trend: await db
      .select({
        month: sql`DATE_TRUNC('month', created_at)`,
        spent: sum(
          sql`CASE WHEN amount < 0 THEN -amount ELSE 0 END`
        ),
      })
      .from(creditTransaction)
      .where(
        and(
          eq(creditTransaction.userId, userId),
          gte(creditTransaction.createdAt, subMonths(new Date(), 6))
        )
      )
      .groupBy(sql`DATE_TRUNC('month', created_at)`),
    
    // 最常使用的功能
    topFeatures: await getTopFeatures(userId),
  };
}
```

### 4. **监控和日志**

#### A. 详细的审计日志
```typescript
interface PaymentAuditLog {
  id: string;
  eventType: string;          // 'checkout_started', 'payment_completed', etc.
  userId: string;
  paymentId: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

// 每个关键步骤记录
await recordAudit({
  eventType: 'invoice_paid',
  userId: paymentRecord.userId,
  paymentId: invoice.id,
  details: {
    amount: invoice.amount_paid,
    status: invoice.status,
    creditsAwarded: credits,
  },
});
```

#### B. 指标收集
```typescript
// 使用 Prometheus 或类似工具
const paymentCounter = new Counter({
  name: 'payments_total',
  help: 'Total number of payments',
  labelNames: ['type', 'status', 'scene'],
});

const creditGauge = new Gauge({
  name: 'user_credits_total',
  help: 'Total credits across all users',
});

// 在关键位置记录
paymentCounter.inc({
  type: payment.type,
  status: payment.status,
  scene: payment.scene,
});
```

#### C. 告警规则
```typescript
// 告警: 支付失败率过高
if (failedPayments / totalPayments > 0.05) {
  await alertTeam({
    severity: 'high',
    message: 'Payment failure rate exceeds 5%',
    details: { failedCount, totalCount },
  });
}

// 告警: Webhook 处理缓慢
if (webhookLatency > 5000) {
  await alertTeam({
    severity: 'medium',
    message: 'Webhook processing latency high',
    details: { latency: webhookLatency },
  });
}
```

### 5. **安全性改进**

#### A. 速率限制
```typescript
// 防止暴力消费积分
const createRateLimiter = () => {
  const limits = new Map<string, { count: number; resetAt: number }>();

  return async (userId: string) => {
    const now = Date.now();
    const limit = limits.get(userId) || { count: 0, resetAt: now + 60000 };

    if (now > limit.resetAt) {
      limit.count = 0;
      limit.resetAt = now + 60000; // 1 分钟
    }

    if (limit.count >= 100) { // 每分钟最多 100 次
      throw new Error('Rate limit exceeded');
    }

    limit.count++;
    limits.set(userId, limit);
  };
};
```

#### B. 输入验证强化
```typescript
// 使用 Zod 的更严格验证
const consumeCreditsSchema = z.object({
  amount: z.number()
    .int('Amount must be integer')
    .positive('Amount must be positive')
    .max(10000, 'Single transaction limited to 10000'),
  description: z.string()
    .min(1)
    .max(500)
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Invalid characters'),
});
```

#### C. 加密敏感字段
```typescript
// 加密保存发票 ID 等敏感信息
const encryptedInvoiceId = await encrypt(invoice.id);
await db.update(payment)
  .set({ invoiceId: encryptedInvoiceId })
  .where(eq(payment.id, paymentId));
```

### 6. **测试覆盖**

#### A. Webhook 事件测试
```typescript
describe('Stripe Webhook Handler', () => {
  it('should handle checkout.session.completed', async () => {
    const event = mockStripeEvent('checkout.session.completed', {
      // ... mock session data
    });

    await handleWebhookEvent(event.data.toString(), event.signature);

    // 验证 payment 记录已创建
    const payment = await db.query.payment.findFirst({
      where: eq(payment.sessionId, 'cs_test_...')
    });
    expect(payment).toBeDefined();
    expect(payment.paid).toBe(false);
  });

  it('should handle invoice.paid and award credits', async () => {
    // 1. 创建支付记录
    // 2. 模拟 invoice.paid 事件
    // 3. 验证支付更新为 paid=true
    // 4. 验证积分已分配
  });

  it('should retry finding payment record on race condition', async () => {
    // 1. 发送 invoice.paid (但 payment 还未创建)
    // 2. 验证重试机制
    // 3. 延迟创建 payment 记录
    // 4. 验证最终成功处理
  });
});
```

#### B. 积分系统集成测试
```typescript
describe('Credit System', () => {
  it('should use FIFO strategy when consuming credits', async () => {
    // 1. 添加多笔积分 (不同过期日期)
    // 2. 消费积分
    // 3. 验证消费顺序 (先过期的先消费)
  });

  it('should prevent over-spending', async () => {
    // 1. 添加 10 积分
    // 2. 尝试消费 20 积分
    // 3. 验证异常
  });

  it('should handle expired credits correctly', async () => {
    // 1. 添加有过期日期的积分
    // 2. 模拟时间推进
    // 3. 调用过期处理
    // 4. 验证积分从余额中移除
  });
});
```

---

## 总结

### 系统强点
1. **清晰的架构**: 分层设计，职责明确
2. **完整的支付流程**: 支持订阅、一次性、积分多种模式
3. **可靠的 Webhook 处理**: 包含重试机制和幂等性保证
4. **灵活的积分系统**: FIFO 消费、过期管理、多源分配
5. **国际化支持**: 支持多语言和货币
6. **充分的类型安全**: TypeScript + Zod 验证

### 主要改进方向
1. **性能**: 批量查询、缓存策略、索引优化
2. **可靠性**: 死信队列、更完善的错误恢复
3. **功能**: 积分转让、促销码、详细分析
4. **可观测性**: 审计日志、性能指标、告警机制
5. **安全性**: 速率限制、更强验证、敏感字段加密
6. **测试**: 完整的集成测试覆盖

### 关键 KPI
- 支付成功率: 目标 > 99.5%
- Webhook 处理延迟: < 1000ms (P95)
- 积分准确率: 100% (无丢失)
- 系统可用性: > 99.9%

