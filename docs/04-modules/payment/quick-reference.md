# 支付和积分系统 - 快速参考指南

## 文件位置速查表

### 核心支付模块 (`/src/payment/`)
| 文件 | 行数 | 功能 |
|------|------|------|
| `provider/stripe.ts` | 1279 | Stripe 支付提供商实现 (主要逻辑) |
| `types.ts` | 220 | 支付相关类型定义 |
| `index.ts` | 94 | 支付模块入口和工厂函数 |

### 核心积分模块 (`/src/credits/`)
| 文件 | 行数 | 功能 |
|------|------|------|
| `credits.ts` | 578 | 积分核心管理 (添加、消费、过期) |
| `distribute.ts` | 792 | 积分分配引擎 (cron 任务) |
| `types.ts` | 54 | 积分相关类型定义 |
| `server.ts` | 20 | 服务端查询函数 |
| `client.ts` | 22 | 客户端查询函数 |

### Server Actions (`/src/actions/`)
| 文件 | 功能 |
|------|------|
| `create-credit-checkout-session.ts` | 创建积分包结账 |
| `consume-credits.ts` | 消费积分 |
| `get-credit-balance.ts` | 获取积分余额 |
| `get-credit-stats.ts` | 获取积分统计 (即将过期) |
| `get-credit-transactions.ts` | 获取交易历史 (分页/搜索) |

### React Hooks (`/src/hooks/`)
| 文件 | 功能 |
|------|------|
| `use-credits.ts` | 4 个积分相关 hooks (余额、统计、消费、交易) |
| `use-payment.ts` | 获取当前套餐信息 |
| `use-payment-completion.ts` | 检查支付完成状态 (polling) |

### Webhook 处理
| 路径 | 功能 |
|------|------|
| `/src/app/api/webhooks/stripe/route.ts` | Stripe webhook 路由入口 |

### 配置文件
| 文件 | 功能 |
|------|------|
| `/src/config/price-config.tsx` | 定价配置 (client hook) |
| `/src/config/website.tsx` | 网站全局配置 |

### 数据库 (`/src/db/`)
| 表 | 说明 |
|------|------|
| `payment` | 支付记录 (订阅、一次性、积分) |
| `userCredit` | 用户积分余额 |
| `creditTransaction` | 积分交易历史 (审计日志) |

### UI 组件 (`/src/components/`)
| 路径 | 功能 |
|------|------|
| `payment/payment-card.tsx` | 支付卡片 |
| `pricing/pricing-*.tsx` | 定价相关组件 |
| `settings/credits/*.tsx` | 积分设置相关组件 |
| `layout/credits-*.tsx` | 导航栏积分显示 |

---

## 关键函数速查

### 支付相关

```typescript
// 创建结账会话 (订阅/套餐)
await createCheckout({
  planId: string;
  priceId: string;
  customerEmail: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
  locale?: Locale;
});

// 创建积分包结账
await createCreditCheckout({
  packageId: string;
  priceId: string;
  customerEmail: string;
  // ... 其他参数同上
});

// 创建客户门户 (管理订阅)
await createCustomerPortal({
  customerId: string;
  returnUrl?: string;
  locale?: Locale;
});

// 处理 webhook 事件
await handleWebhookEvent(payload: string, signature: string);
```

### 积分相关

```typescript
// 查询用户积分
const balance = await getUserCredits(userId: string);

// 添加积分 (支持过期)
await addCredits({
  userId: string;
  amount: number;          // > 0
  type: string;            // CREDIT_TRANSACTION_TYPE
  description: string;
  paymentId?: string;
  expireDays?: number;
});

// 消费积分 (FIFO)
await consumeCredits({
  userId: string;
  amount: number;          // > 0
  description: string;
});

// 检查是否有足够积分
const hasEnough = await hasEnoughCredits({
  userId: string;
  requiredCredits: number;
});

// 处理过期积分
await processExpiredCredits(userId: string);

// 积分分配 (Cron 任务)
await distributeCreditsToAllUsers();
```

---

## Webhook 事件流程

### 订阅支付流程
```
1. checkout.session.completed
   └─ 创建 payment 记录 (paid=false)

2. customer.subscription.created
   └─ 仅记录日志

3. customer.subscription.updated (可多次)
   └─ 更新支付状态和周期

4. invoice.paid ★ 关键
   └─ UPDATE payment (paid=true)
   └─ addSubscriptionCredits() 分配积分
```

### 一次性支付流程
```
1. checkout.session.completed
   └─ 创建 payment 记录 (paid=false)

2. invoice.paid ★ 关键
   └─ UPDATE payment (paid=true)
   ├─ 如果是积分包 → addCredits()
   └─ 如果是终身计划 → addLifetimeMonthlyCredits() + 通知
```

---

## 数据库查询示例

### 查询用户的当前积分
```sql
SELECT current_credits FROM user_credit WHERE user_id = $1;
```

### 查询用户的活跃积分 (未过期且未消费)
```sql
SELECT COALESCE(SUM(remaining_amount), 0)
FROM credit_transaction
WHERE user_id = $1
  AND type NOT IN ('USAGE', 'EXPIRE')
  AND remaining_amount > 0
  AND (expiration_date IS NULL OR expiration_date > NOW());
```

### 查询用户30天内过期的积分
```sql
SELECT COALESCE(SUM(remaining_amount), 0)
FROM credit_transaction
WHERE user_id = $1
  AND type NOT IN ('USAGE', 'EXPIRE')
  AND remaining_amount > 0
  AND expiration_date > NOW()
  AND expiration_date <= NOW() + INTERVAL '30 days';
```

### 查询用户的支付历史 (最新)
```sql
SELECT *
FROM payment
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 1;
```

### 验证积分余额准确性
```sql
SELECT 
  u.user_id,
  u.current_credits,
  COALESCE(SUM(ct.remaining_amount), 0) as calculated_balance,
  CASE 
    WHEN u.current_credits = COALESCE(SUM(ct.remaining_amount), 0) 
    THEN 'OK'
    ELSE 'MISMATCH'
  END as status
FROM user_credit u
LEFT JOIN credit_transaction ct ON u.user_id = ct.user_id
  AND ct.type NOT IN ('USAGE', 'EXPIRE')
  AND ct.remaining_amount > 0
  AND (ct.expiration_date IS NULL OR ct.expiration_date > NOW())
GROUP BY u.user_id, u.current_credits
HAVING u.current_credits != COALESCE(SUM(ct.remaining_amount), 0);
```

---

## 环境变量检查清单

```bash
# Stripe API 配置 (必需)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 功能开关
ENABLE_CREDITS=true              # 是否启用积分系统
ENABLE_PAYMENT=true              # 是否启用支付

# 其他配置
CREDITS_EXPIRATION_DAYS=30       # 积分过期天数
PAYMENT_POLL_INTERVAL=2000       # 支付状态轮询间隔 (ms)
PAYMENT_RECORD_RETRY_ATTEMPTS=5  # webhook 重试次数
PAYMENT_RECORD_RETRY_DELAY=100   # webhook 重试延迟 (ms)
```

---

## 常见调试场景

### 场景 1: 支付完成但未分配积分
```typescript
// 1. 检查 payment 表
SELECT * FROM payment WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1;

// 2. 检查 paid 字段是否为 true
// 如果 paid = false，说明 invoice.paid webhook 未处理

// 3. 检查积分是否分配
SELECT * FROM credit_transaction 
WHERE user_id = $1 AND type LIKE 'SUBSCRIPTION%' 
ORDER BY created_at DESC LIMIT 1;

// 4. 检查余额
SELECT current_credits FROM user_credit WHERE user_id = $1;

// 解决方案:
// - 检查 Stripe webhook 是否已配置
// - 查看日志是否有 webhook 处理错误
// - 手动调用 addSubscriptionCredits() 进行补救
```

### 场景 2: 积分余额不一致
```typescript
// 验证余额
const balance = await getUserCredits(userId);
const calculated = await db
  .select({ total: sum(creditTransaction.remainingAmount) })
  .from(creditTransaction)
  .where(
    and(
      eq(creditTransaction.userId, userId),
      not(eq(creditTransaction.type, CREDIT_TRANSACTION_TYPE.USAGE)),
      not(eq(creditTransaction.type, CREDIT_TRANSACTION_TYPE.EXPIRE)),
      gt(creditTransaction.remainingAmount, 0),
      or(
        isNull(creditTransaction.expirationDate),
        gt(creditTransaction.expirationDate, new Date())
      )
    )
  );

// 如果不相等，说明有数据不一致
// 解决方案:
// 1. 检查是否有失败的消费操作 (部分成功)
// 2. 检查是否有过期处理失败的情况
// 3. 可能需要手动修正 userCredit.currentCredits
```

### 场景 3: Webhook 处理超时
```typescript
// 检查 webhook 日志
// 查看是否有 "Handle webhook event error" 日志

// 常见原因:
// 1. 数据库连接慢
// 2. Stripe API 调用慢
// 3. 积分分配计算慢 (用户很多)

// 优化建议:
// - 添加数据库连接池
// - 使用异步队列处理重型操作
// - 优化数据库查询 (添加索引)
```

### 场景 4: 消费积分失败
```typescript
// 常见错误:
// "Insufficient credits" - 检查余额
// "Invalid params" - 检查参数 (amount 必须 > 0)

// 调试步骤:
const balance = await getUserCredits(userId);
console.log('Current balance:', balance);

// 检查是否有待消费的积分
const transactions = await db
  .select()
  .from(creditTransaction)
  .where(
    and(
      eq(creditTransaction.userId, userId),
      gt(creditTransaction.remainingAmount, 0)
    )
  )
  .orderBy(asc(creditTransaction.expirationDate));

console.log('Available credits:', transactions);
```

---

## 性能优化建议

### 1. 数据库索引
```sql
-- 已有的索引
CREATE INDEX payment_user_id_idx ON payment(user_id);
CREATE INDEX payment_invoice_id_idx ON payment(invoice_id); -- UNIQUE
CREATE INDEX credit_transaction_user_id_idx ON credit_transaction(user_id);

-- 建议添加的索引
CREATE INDEX payment_paid_status_idx ON payment(paid, status);
CREATE INDEX payment_user_status_idx ON payment(user_id, status);
CREATE INDEX credit_transaction_user_type_idx ON credit_transaction(user_id, type);
CREATE INDEX credit_transaction_expiration_idx ON credit_transaction(expiration_date, remaining_amount);
```

### 2. 缓存策略
```typescript
// 缓存用户积分余额 (5 分钟)
const cacheKey = `credits:balance:${userId}`;
let balance = await redis.get(cacheKey);

if (!balance) {
  balance = await getUserCredits(userId);
  await redis.setex(cacheKey, 300, balance);
}

// 在消费或分配后失效缓存
await redis.del(cacheKey);
```

### 3. 批量操作
```typescript
// 不好: N+1 查询
for (const userId of userIds) {
  const balance = await getUserCredits(userId);
}

// 好: 批量查询
const balances = await db
  .select({ userId: userCredit.userId, balance: userCredit.currentCredits })
  .from(userCredit)
  .where(inArray(userCredit.userId, userIds));
```

---

## 测试清单

### 功能测试
- [ ] 创建订阅支付 (月度/年度)
- [ ] 订阅续费
- [ ] 订阅取消
- [ ] 购买积分包
- [ ] 消费积分
- [ ] 检查余额
- [ ] 积分过期
- [ ] 获取交易历史
- [ ] 管理订阅 (改计划、修改付款方式)

### Webhook 测试
- [ ] checkout.session.completed 处理
- [ ] customer.subscription.created 处理
- [ ] customer.subscription.updated 处理
- [ ] customer.subscription.deleted 处理
- [ ] invoice.paid 处理
- [ ] Race condition 场景 (invoice.paid 先到)

### 边界情况测试
- [ ] 积分不足消费
- [ ] 消费所有积分
- [ ] 部分过期积分消费
- [ ] 重复处理 webhook
- [ ] Webhook 处理失败重试

---

## 生产部署检查清单

### 配置检查
- [ ] Stripe API 密钥已配置
- [ ] Webhook secret 已配置
- [ ] 数据库已创建表 (payment, userCredit, creditTransaction)
- [ ] 数据库索引已创建

### 监控检查
- [ ] 支付成功率监控已设置
- [ ] Webhook 延迟监控已设置
- [ ] 积分余额准确性监控已设置
- [ ] 错误日志告警已设置

### 灾备检查
- [ ] 数据库备份已配置
- [ ] Webhook 失败重试机制已确认
- [ ] 错误日志保存完善
- [ ] 手动修复流程已文档化

### 安全检查
- [ ] Stripe webhook signature 已验证
- [ ] API key 未提交到版本控制
- [ ] 敏感信息已加密
- [ ] 速率限制已实现

---

## 常用命令

```bash
# 查看积分相关日志
grep -r "addCredits\|consumeCredits\|distribute" logs/

# 查看 webhook 处理日志
grep -r "webhook\|invoice.paid" logs/ | head -100

# 查看积分统计
psql $DATABASE_URL -c "
  SELECT type, COUNT(*) as count, SUM(amount) as total
  FROM credit_transaction
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY type;
"

# 检查待处理的支付记录
psql $DATABASE_URL -c "
  SELECT id, user_id, status, paid, created_at
  FROM payment
  WHERE paid = false AND created_at < NOW() - INTERVAL '1 hour'
  ORDER BY created_at DESC;
"
```

