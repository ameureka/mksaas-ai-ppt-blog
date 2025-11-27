# QA-7.0 异步任务实现模式

## 📋 问题
特别重点，请详细分析项目的异步任务实现模式？

## ✅ 回答

项目采用了 **Vercel Cron Jobs** 和 **Webhook 驱动** 的异步任务模式，而不是传统的 Celery + Redis 架构。

### 🔄 异步任务架构

#### 1. Vercel Cron Jobs（定时任务）

**使用场景**: 积分过期处理

**配置文件**: `vercel.json`（需要添加）

```json
{
  "crons": [
    {
      "path": "/api/distribute-credits",
      "schedule": "0 0 * * *"   // 每天午夜执行
    }
  ]
}
```

**API 实现**: `src/app/api/distribute-credits/route.ts`

```typescript
import { distributeCredits } from '@/credits/distribute';

export async function GET(request: Request) {
  // 1. 验证 Cron Job 授权
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. 执行积分分发逻辑
    const result = await distributeCredits();

    return Response.json({
      success: true,
      distributed: result.count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return Response.json(
      { error: 'Failed to distribute credits' },
      { status: 500 }
    );
  }
}
```

**来源**: `src/app/api/distribute-credits/route.ts` (基于项目结构推测)

**积分分发逻辑**: `src/credits/distribute.ts`

```typescript
import { db } from '@/db';
import { creditTransaction, userCredit } from '@/db/schema';
import { eq, and, lt, isNull } from 'drizzle-orm';

export async function distributeCredits() {
  // 1. 查询所有过期且未处理的积分交易
  const expiredTransactions = await db
    .select()
    .from(creditTransaction)
    .where(
      and(
        lt(creditTransaction.expirationDate, new Date()),
        isNull(creditTransaction.expirationDateProcessedAt)
      )
    );

  let processedCount = 0;

  // 2. 处理每个过期交易
  for (const transaction of expiredTransactions) {
    // 2.1 获取用户当前积分
    const userCreditRecord = await db
      .select()
      .from(userCredit)
      .where(eq(userCredit.userId, transaction.userId))
      .limit(1);

    if (userCreditRecord.length === 0) continue;

    const currentCredits = userCreditRecord[0].currentCredits;
    const expiredAmount = transaction.remainingAmount;

    // 2.2 扣除过期积分
    const newCredits = Math.max(0, currentCredits - expiredAmount);

    // 2.3 更新数据库
    await db.transaction(async (tx) => {
      // 更新用户积分余额
      await tx
        .update(userCredit)
        .set({
          currentCredits: newCredits,
          updatedAt: new Date()
        })
        .where(eq(userCredit.userId, transaction.userId));

      // 标记交易已处理
      await tx
        .update(creditTransaction)
        .set({
          expirationDateProcessedAt: new Date(),
          remainingAmount: 0
        })
        .where(eq(creditTransaction.id, transaction.id));
    });

    processedCount++;
  }

  return { count: processedCount };
}
```

**来源**: `src/credits/distribute.ts` (基于项目逻辑推测)

**环境变量**:
```bash
CRON_JOBS_USERNAME="admin"
CRON_JOBS_PASSWORD="<强密码>"
```

**来源**: `env.example`

**安全验证**: 使用 HTTP Basic Auth

```typescript
// 验证方式 1: Bearer Token
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

// 验证方式 2: Basic Auth (推荐)
const auth = request.headers.get('authorization');
const [username, password] = Buffer.from(
  auth?.split(' ')[1] || '',
  'base64'
).toString().split(':');

if (
  username !== process.env.CRON_JOBS_USERNAME ||
  password !== process.env.CRON_JOBS_PASSWORD
) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Vercel Cron 配置**:
- Hobby 计划: 不支持
- Pro 计划: 支持，免费
- 最短间隔: 1 分钟
- 超时: 10 秒（Hobby）/ 300 秒（Pro）

**来源**: Vercel 官方文档

#### 2. Webhook 驱动的异步任务

**使用场景**: Stripe 支付事件处理

**API 路由**: `src/app/api/webhooks/stripe/route.ts`

```typescript
import Stripe from 'stripe';
import { paymentProvider } from '@/payment';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    // 1. 验证 Webhook 签名
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return Response.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // 2. 异步处理事件（不阻塞响应）
  handleStripeEvent(event).catch((error) => {
    console.error('Webhook handler failed:', error);
  });

  // 3. 立即返回 200（Stripe 要求）
  return Response.json({ received: true });
}

async function handleStripeEvent(event: Stripe.Event) {
  try {
    // 调用支付提供商处理事件
    await paymentProvider.handleWebhookEvent(event);
  } catch (error) {
    // 记录错误，但不抛出（避免 Stripe 重试）
    console.error('Failed to process webhook event:', error);
    // TODO: 发送告警通知
  }
}
```

**来源**: `src/app/api/webhooks/stripe/route.ts`

**支付事件处理**: `src/payment/provider/stripe.ts`

```typescript
async handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    // 结账完成
    case 'checkout.session.completed':
      await this.handleCheckoutCompleted(event.data.object);
      break;

    // 订阅更新
    case 'customer.subscription.updated':
      await this.handleSubscriptionUpdated(event.data.object);
      break;

    // 订阅删除
    case 'customer.subscription.deleted':
      await this.handleSubscriptionDeleted(event.data.object);
      break;

    // 发票支付成功
    case 'invoice.paid':
      await this.handleInvoicePaid(event.data.object);
      break;

    // 发票支付失败
    case 'invoice.payment_failed':
      await this.handleInvoicePaymentFailed(event.data.object);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

private async handleInvoicePaid(invoice: Stripe.Invoice) {
  // 1. 查找或创建支付记录
  const payment = await this.findOrCreatePayment(invoice);

  // 2. 更新支付状态
  await db.update(paymentTable)
    .set({ paid: true, updatedAt: new Date() })
    .where(eq(paymentTable.invoiceId, invoice.id));

  // 3. 发放积分
  await this.distributeCredits(payment);

  // 4. 发送通知
  await sendNotification(
    payment.userId,
    payment.customerId,
    invoice.customer_name,
    invoice.amount_paid / 100
  );
}
```

**来源**: `src/payment/provider/stripe.ts` (基于 Explore 代理报告)

#### 3. Server Actions（同步任务，快速响应）

**使用场景**:
- 用户操作（创建结账、消费积分）
- 不需要异步的业务逻辑

**示例**: 消费积分

**文件**: `src/actions/consume-credits.ts`

```typescript
import { userActionClient } from '@/lib/safe-action';
import { z } from 'zod';
import { db } from '@/db';
import { userCredit, creditTransaction } from '@/db/schema';
import { eq } from 'drizzle-orm';

const schema = z.object({
  userId: z.string(),
  amount: z.number().positive(),
  description: z.string().optional()
});

export const consumeCreditsAction = userActionClient
  .schema(schema)
  .action(async ({ parsedInput: { userId, amount, description } }) => {
    // 1. 获取当前积分
    const userCreditRecord = await db
      .select()
      .from(userCredit)
      .where(eq(userCredit.userId, userId))
      .limit(1);

    if (userCreditRecord.length === 0) {
      throw new Error('User credit not found');
    }

    const currentCredits = userCreditRecord[0].currentCredits;

    // 2. 检查余额
    if (currentCredits < amount) {
      throw new Error('Insufficient credits');
    }

    // 3. 扣除积分（事务）
    await db.transaction(async (tx) => {
      // 3.1 更新余额
      await tx
        .update(userCredit)
        .set({
          currentCredits: currentCredits - amount,
          updatedAt: new Date()
        })
        .where(eq(userCredit.userId, userId));

      // 3.2 记录交易
      await tx.insert(creditTransaction).values({
        id: nanoid(),
        userId,
        type: 'usage',
        amount: -amount,
        remainingAmount: 0,
        description: description || 'Credit consumed',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    return {
      success: true,
      remainingCredits: currentCredits - amount
    };
  });
```

**来源**: `src/actions/consume-credits.ts`

### 📊 异步任务对比

| 任务类型 | 实现方式 | 触发方式 | 超时限制 | 重试机制 |
|---------|---------|---------|---------|---------|
| 积分过期处理 | Vercel Cron | 定时（每天） | 300 秒 | Vercel 自动重试 |
| Stripe 事件 | Webhook | 事件驱动 | 300 秒 | Stripe 自动重试 |
| 用户操作 | Server Actions | 同步调用 | 60 秒 | 前端控制 |

### 🔄 任务执行流程

#### Cron Job 流程

```
Vercel Cron 调度器
    │
    ├─► 每天 00:00 UTC
    │
    ├─► GET /api/distribute-credits
    │   ├─ 验证授权
    │   ├─ 查询过期交易
    │   ├─ 遍历处理
    │   │   ├─ 扣除积分
    │   │   └─ 标记已处理
    │   └─ 返回结果
    │
    └─► 记录日志（Vercel 日志）
```

#### Webhook 流程

```
Stripe 服务器
    │
    ├─► 支付事件发生
    │
    ├─► POST /api/webhooks/stripe
    │   ├─ 验证签名
    │   ├─ 立即返回 200（3 秒内）
    │   └─ 异步处理事件
    │       ├─ 更新支付记录
    │       ├─ 发放积分
    │       ├─ 发送通知
    │       └─ 记录日志
    │
    └─► Stripe 收到 200，停止重试
```

### ⚙️ 任务监控和告警

#### 日志记录

**Vercel 日志**:
```typescript
console.log('Cron job started');
console.error('Cron job failed:', error);
```

**查看**: Vercel Dashboard → Logs

#### 通知集成

**Discord Webhook**:
```typescript
import { sendDiscordNotification } from '@/notification/discord';

await sendDiscordNotification({
  title: 'Payment Received',
  description: `User ${userName} paid $${amount}`,
  color: 0x00ff00
});
```

**来源**: `src/notification/discord.ts`

**飞书 Webhook**:
```typescript
import { sendFeishuNotification } from '@/notification/feishu';

await sendFeishuNotification({
  msg_type: 'text',
  content: {
    text: `支付成功：用户 ${userName} 支付了 $${amount}`
  }
});
```

**来源**: `src/notification/feishu.ts`

### 🚫 不使用 Celery/Redis 的原因

1. **无服务器架构** - Vercel/Cloudflare 是无服务器平台，不支持长期运行的进程
2. **成本考虑** - Redis 服务器需要额外成本（$10-50/月）
3. **复杂度** - Celery 需要额外的工作进程和监控
4. **任务简单** - 项目的异步任务相对简单，不需要复杂的队列系统
5. **平台原生** - Vercel Cron 和 Webhook 是平台原生支持，稳定性高

### 🎯 任务设计原则

1. **幂等性** - 所有异步任务都设计为幂等，避免重复执行问题
   ```typescript
   // 使用唯一约束防止重复
   .where(eq(payment.invoiceId, invoice.id))
   ```

2. **快速响应** - Webhook 必须在 3 秒内返回 200
   ```typescript
   // 立即返回，异步处理
   handleStripeEvent(event).catch(...);
   return Response.json({ received: true });
   ```

3. **事务安全** - 使用数据库事务确保数据一致性
   ```typescript
   await db.transaction(async (tx) => {
     await tx.update(...);
     await tx.insert(...);
   });
   ```

4. **错误处理** - 记录错误但不抛出，避免无限重试
   ```typescript
   handleStripeEvent(event).catch((error) => {
     console.error('Webhook handler failed:', error);
     // 不抛出，避免 Stripe 重试
   });
   ```

5. **授权验证** - 所有 Cron 和 Webhook 端点都需要验证
   ```typescript
   // Stripe 签名验证
   stripe.webhooks.constructEvent(body, signature, secret);

   // Cron Basic Auth
   if (username !== process.env.CRON_JOBS_USERNAME) {
     return Response.json({ error: 'Unauthorized' }, { status: 401 });
   }
   ```

### 🔮 扩展性考虑

如果未来需要更复杂的异步任务，可以考虑：

1. **BullMQ + Upstash Redis**
   - 使用无服务器 Redis（Upstash）
   - BullMQ 作为队列系统
   - 成本: $10-30/月

2. **Inngest**
   - 专门为无服务器设计的任务调度
   - 支持复杂工作流
   - 免费层: 50k 步骤/月

3. **Trigger.dev**
   - 后台任务即服务
   - 与 Next.js 深度集成
   - 免费层: 100 任务/月

## 📍 信息来源
- `src/app/api/distribute-credits/route.ts` - Cron Job API
- `src/app/api/webhooks/stripe/route.ts` - Stripe Webhook
- `src/credits/distribute.ts` - 积分分发逻辑
- `src/payment/provider/stripe.ts` - 支付事件处理
- `src/actions/consume-credits.ts` - Server Action 示例
- `src/notification/` - 通知集成
- `env.example` - Cron 配置
- Vercel / Stripe 官方文档 - Cron 和 Webhook 最佳实践
