# QA-5.0 API设计和数据模型

## 📋 问题
项目的具体的API设计和数据模型？

## ✅ 回答

项目采用了 **Next.js App Router** 架构，结合 **Server Actions** 和 **API Routes** 实现完整的 API 设计。

### 🔧 API 架构设计

#### 1. Server Actions（优先使用）

**位置**: `src/actions/`

**设计原则**:
- 使用 `next-safe-action` 确保安全性
- Zod schema 验证输入
- 三层权限：public、user、admin
- 自动序列化和类型安全

**权限层级**:
```typescript
// 1. 公开 Action
export const actionClient = createSafeActionClient();

// 2. 用户 Action（需要登录）
export const userActionClient = actionClient.use(async ({ next }) => {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized', { code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { userId: session.user.id, user: session.user } });
});

// 3. 管理员 Action（需要管理员权限）
export const adminActionClient = userActionClient.use(async ({ next, ctx }) => {
  if (ctx.user.role !== 'admin' && !isDemoWebsite()) {
    throw new Error('Unauthorized', { code: 'UNAUTHORIZED' });
  }
  return next({ ctx });
});
```

**来源**: `src/lib/safe-action.ts`

#### 2. API Routes

**位置**: `src/app/api/`

**路由设计**:
```typescript
/api/
├── auth/[...all]/              // Better Auth 所有认证路由
├── chat/                       // AI 聊天
├── generate-images/            // AI 图片生成
├── analyze-content/            // 网页内容分析
├── search/                     // 文档搜索
├── storage/upload/             // 文件上传
├── webhooks/stripe/            // Stripe Webhook
├── distribute-credits/         // Cron Job
└── ping/                       // 健康检查
```

**来源**: `src/app/api/` 目录结构

### 📡 详细 API 设计

#### 认证 API

**Better Auth 自动路由**:
```typescript
// 基础路由
POST   /api/auth/sign-in/email          // 邮箱登录
POST   /api/auth/sign-up/email          // 邮箱注册
POST   /api/auth/sign-out               // 登出
GET    /api/auth/get-session            // 获取会话

// OAuth 路由
GET    /api/auth/sign-in/github         // GitHub 登录
GET    /api/auth/sign-in/google         // Google 登录
GET    /api/auth/callback/github        // GitHub 回调
GET    /api/auth/callback/google        // Google 回调

// 邮箱验证
POST   /api/auth/verify-email           // 发送验证邮件
POST   /api/auth/verify-email/verify    // 验证邮箱

// 密码管理
POST   /api/auth/forget-password        // 忘记密码
POST   /api/auth/reset-password         // 重置密码

// 管理员 API
POST   /api/auth/admin/ban-user         // 封禁用户
POST   /api/auth/admin/unban-user       // 解封用户
POST   /api/auth/admin/set-role         // 设置角色
POST   /api/auth/admin/impersonate      // 模拟登录
```

**来源**: `src/app/api/auth/[...all]/route.ts`, Better Auth 文档

#### 支付 Server Actions

```typescript
// 创建订阅/计划结账
createCheckoutAction
  输入: { planId: string, priceId: string, userId?: string }
  输出: { url: string, sessionId: string }
  文件: src/actions/create-checkout-session.ts:12-57

// 创建积分包结账
createCreditCheckoutAction
  输入: { packageId: string, userId?: string }
  输出: { url: string, sessionId: string }
  文件: src/actions/create-credit-checkout-session.ts:11-38

// 创建客户门户
createCustomerPortalAction
  输入: { returnUrl: string }
  输出: { url: string }
  文件: src/actions/create-customer-portal-session.ts:7-18

// 获取当前计划
getCurrentPlanAction
  输入: { userId: string }
  输出: { plan: PricePlan, payment: Payment }
  文件: src/actions/get-current-plan.ts:33-82

// 检查支付完成
checkPaymentCompletionAction
  输入: { sessionId: string }
  输出: { success: boolean, status: string }
  文件: src/actions/check-payment-completion.ts:35-75
```

**来源**: `src/actions/create-checkout-session.ts` 等

#### 积分 Server Actions

```typescript
// 获取积分余额
getCreditBalanceAction
  输入: { userId: string }
  输出: { currentCredits: number }
  文件: src/actions/get-credit-balance.ts:9-24

// 消费积分
consumeCreditsAction
  输入: { userId: string, amount: number, description: string }
  输出: { success: boolean, remainingCredits: number }
  文件: src/actions/consume-credits.ts:13-45

// 获取积分交易历史
getCreditTransactionsAction
  输入: { userId: string, limit?: number, offset?: number }
  输出: { transactions: CreditTransaction[], total: number }
  文件: src/actions/get-credit-transactions.ts:11-48

// 获取积分统计
getCreditStatsAction
  输入: { userId: string }
  输出: { total: number, used: number, remaining: number, expiringCount: number }
  文件: src/actions/get-credit-stats.ts:9-58
```

**来源**: `src/actions/get-credit-balance.ts` 等

#### 用户管理 Server Actions

```typescript
// 获取用户列表（管理员）
getUsersAction
  输入: void
  输出: { users: User[], total: number }
  权限: adminActionClient
  文件: src/actions/get-users.ts:6-29
```

**来源**: `src/actions/get-users.ts`

#### 时事通讯 Server Actions

```typescript
// 订阅时事通讯
subscribeNewsletterAction
  输入: { email: string }
  输出: { success: boolean }
  文件: src/actions/subscribe-newsletter.ts:10-28

// 取消订阅
unsubscribeNewsletterAction
  输入: { email: string }
  输出: { success: boolean }
  文件: src/actions/unsubscribe-newsletter.ts:10-28

// 检查订阅状态
checkNewsletterStatusAction
  输入: { email: string }
  输出: { subscribed: boolean }
  文件: src/actions/check-newsletter-status.ts:7-20
```

**来源**: `src/actions/subscribe-newsletter.ts` 等

#### AI API Routes

**1. 聊天 API**:
```typescript
POST /api/chat
请求体: {
  messages: UIMessage[],
  model: string,
  webSearch: boolean
}
响应: Stream (Server-Sent Events)
  - 文本块
  - 推理过程
  - 来源信息
超时: 30 秒
文件: src/app/api/chat/route.ts
```

**2. 图片生成 API**:
```typescript
POST /api/generate-images
请求体: {
  prompt: string,
  provider: 'openai' | 'fireworks' | 'replicate' | 'fal',
  modelId: string,
  options?: {
    size?: string,
    aspectRatio?: string,
    numImages?: number
  }
}
响应: {
  images: string[],
  timestamp: number,
  warnings?: string[]
}
超时: 55 秒
文件: src/app/api/generate-images/route.ts
```

**3. 内容分析 API**:
```typescript
POST /api/analyze-content
请求体: {
  url: string,
  prompt?: string
}
响应: {
  analysis: string,
  extractedContent: string
}
文件: src/app/api/analyze-content/route.ts
```

**来源**: `src/app/api/` 目录

#### Webhook API

**Stripe Webhook**:
```typescript
POST /api/webhooks/stripe
Headers: {
  'stripe-signature': string
}
请求体: Stripe Event
处理的事件:
  - checkout.session.completed
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.paid
  - invoice.payment_failed
响应: { received: true }
文件: src/app/api/webhooks/stripe/route.ts
```

**来源**: `src/app/api/webhooks/stripe/route.ts`

#### 其他 API

**1. 文档搜索**:
```typescript
GET /api/search?query=<keyword>&locale=<en|zh>
响应: SearchResult[]
限制: 最多 20 个结果
文件: src/app/api/search/route.ts
```

**2. 文件上传**:
```typescript
POST /api/storage/upload
Content-Type: multipart/form-data
Body: FormData { file: File }
限制:
  - 最大 4MB
  - 类型: image/jpeg, image/png, image/webp
响应: {
  url: string,
  key: string
}
文件: src/app/api/storage/upload/route.ts
```

**3. Cron Job**:
```typescript
GET /api/distribute-credits
Headers: {
  Authorization: 'Basic <credentials>'
}
响应: {
  success: boolean,
  distributed: number
}
文件: src/app/api/distribute-credits/route.ts
```

**4. 健康检查**:
```typescript
GET /api/ping
响应: { status: 'ok', timestamp: number }
文件: src/app/api/ping/route.ts
```

**来源**: `src/app/api/` 相关文件

### 📊 完整数据模型

#### 核心实体

**1. User（用户）**:
```typescript
interface User {
  id: string;                    // 主键
  name: string;
  email: string;                 // 唯一
  emailVerified: boolean;
  image: string | null;
  role: string | null;           // 'admin' | 'user'
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
  customerId: string | null;     // Stripe 客户 ID
  createdAt: Date;
  updatedAt: Date;
}
```

**2. Session（会话）**:
```typescript
interface Session {
  id: string;
  token: string;                 // 唯一
  userId: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  impersonatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**3. Account（账户链接）**:
```typescript
interface Account {
  id: string;
  accountId: string;             // OAuth 提供商的用户 ID
  providerId: string;            // 'github' | 'google'
  userId: string;
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  accessTokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
  scope: string | null;
  password: string | null;       // 密码哈希
  createdAt: Date;
  updatedAt: Date;
}
```

**4. Payment（支付）**:
```typescript
interface Payment {
  id: string;
  priceId: string;
  type: 'subscription' | 'one_time';
  scene: 'lifetime' | 'credit' | 'subscription';
  userId: string;
  customerId: string;
  subscriptionId: string | null;
  status: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing' | 'unpaid' | 'incomplete_expired' | 'paused';
  paid: boolean;
  periodStart: Date | null;
  periodEnd: Date | null;
  trialStart: Date | null;
  trialEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  invoiceId: string | null;      // 唯一
  createdAt: Date;
  updatedAt: Date;
}
```

**5. UserCredit（用户积分）**:
```typescript
interface UserCredit {
  id: string;
  userId: string;                // 唯一
  currentCredits: number;
  lastRefreshAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**6. CreditTransaction（积分交易）**:
```typescript
interface CreditTransaction {
  id: string;
  userId: string;
  type: 'purchase' | 'usage' | 'gift' | 'monthly' | 'lifetime_monthly' | 'refund';
  amount: number;                // 正数=充值，负数=消费
  remainingAmount: number;
  description: string | null;
  paymentId: string | null;
  expirationDate: Date | null;
  expirationDateProcessedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**7. Verification（验证）**:
```typescript
interface Verification {
  id: string;
  identifier: string;            // 邮箱或用户 ID
  value: string;                 // 验证码/令牌
  expiresAt: Date;
  createdAt: Date | null;
  updatedAt: Date | null;
}
```

**来源**: `src/db/schema.ts`

#### 类型定义

**支付类型**:
```typescript
enum PaymentTypes {
  SUBSCRIPTION = 'subscription',
  ONE_TIME = 'one_time'
}

enum PlanIntervals {
  MONTH = 'month',
  YEAR = 'year'
}

enum PaymentScenes {
  LIFETIME = 'lifetime',
  CREDIT = 'credit',
  SUBSCRIPTION = 'subscription'
}
```

**来源**: `src/payment/types.ts`

**定价模型**:
```typescript
interface Price {
  type: PaymentType;
  priceId: string;
  amount: number;                // 美分
  currency: string;
  interval?: PlanInterval;
  trialPeriodDays?: number;
  allowPromotionCode?: boolean;
}

interface PricePlan {
  id: string;
  name?: string;
  description?: string;
  features?: string[];
  prices: Price[];
  isFree: boolean;
  isLifetime: boolean;
  popular?: boolean;
  credits?: {
    enable: boolean;
    amount: number;
    expireDays: number;
  };
}
```

**来源**: `src/payment/types.ts`

### 🔗 API 调用流程示例

#### 用户订阅流程

```
1. 前端调用 createCheckoutAction
   ↓
2. Server Action 创建 Stripe Checkout Session
   ↓
3. 返回 checkout URL，前端跳转
   ↓
4. 用户在 Stripe 页面完成支付
   ↓
5. Stripe 发送 webhook 到 /api/webhooks/stripe
   ↓
6. Webhook 处理器:
   - 验证签名
   - 创建/更新 payment 记录
   - 更新 user.customerId
   - 发放积分
   - 发送通知
   ↓
7. 前端轮询 checkPaymentCompletionAction
   ↓
8. 确认支付成功，跳转到仪表板
```

**来源**: `src/actions/create-checkout-session.ts`, `src/app/api/webhooks/stripe/route.ts`

### 📍 信息来源
- `src/actions/` - Server Actions 实现
- `src/app/api/` - API Routes 实现
- `src/db/schema.ts` - 数据模型定义
- `src/payment/types.ts` - 支付类型定义
- `src/lib/safe-action.ts` - 安全 Action 客户端
- Better Auth 官方文档 - 认证路由
