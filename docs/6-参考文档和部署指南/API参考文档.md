# API 参考文档

完整的 Server Actions 和 API Routes 参考，包括所有可用的端点、参数和响应格式。

---

## 快速导航

```
Server Actions (30+)          API Routes (15+)              Webhooks (5+)
├─ 认证相关 (5)               ├─ 用户 API (3)              ├─ Stripe (3)
├─ 用户数据 (8)               ├─ 博客 API (4)              ├─ 邮件 (1)
├─ 支付相关 (6)               ├─ 支付 API (3)              └─ 系统 (1)
├─ 博客相关 (7)               ├─ 上传 API (2)
└─ 管理员 (4)                 └─ Webhooks (3)
```

---

## Server Actions

### 认证相关

#### `signUp`

```typescript
/**
 * 用户注册
 * @param input { email, password, name }
 * @returns { success, user?, error? }
 */
export async function signUp(input: {
  email: string           // 邮箱地址 (必需)
  password: string        // 密码，至少 8 个字符 (必需)
  name: string           // 用户名字 (必需)
}): Promise<{
  success: boolean
  user?: User
  error?: string
}>
```

**权限:** 公开（任何人可调用）

**触发事件:**
- 用户创建
- 欢迎邮件发送
- 初始积分赠送 (100)

**错误处理:**
- `400` - 邮箱已存在
- `400` - 密码不符合要求
- `500` - 服务器错误

---

#### `signIn`

```typescript
export async function signIn(input: {
  email: string
  password: string
}): Promise<{
  success: boolean
  user?: User
  error?: string
}>
```

**权限:** 公开

**说明:**
- 验证邮箱和密码
- 创建 session
- 返回用户信息

---

#### `signOut`

```typescript
export async function signOut(): Promise<void>
```

**权限:** 认证用户

**说明:**
- 清除 session
- 清除 cookies

---

#### `resetPassword`

```typescript
export async function resetPassword(input: {
  email: string
}): Promise<{
  success: boolean
  message: string
}>
```

**权限:** 公开

**说明:**
- 生成重置 token
- 发送重置邮件
- Token 有效期 24 小时

---

#### `updatePassword`

```typescript
export async function updatePassword(input: {
  currentPassword: string
  newPassword: string
}): Promise<{
  success: boolean
  error?: string
}>
```

**权限:** 认证用户

---

### 用户数据

#### `updateProfile`

```typescript
export async function updateProfile(input: {
  name?: string
  bio?: string
  avatar?: string        // 图片 URL
}): Promise<{
  success: boolean
  user?: User
}>
```

**权限:** 认证用户

**验证:**
- name: 1-100 字符
- bio: 最多 500 字符

---

#### `getCurrentUser`

```typescript
export async function getCurrentUser(): Promise<User | null>
```

**权限:** 认证用户

**说明:**
- 获取当前登录用户信息
- 如果未登录返回 null

---

#### `getUserById`

```typescript
export async function getUserById(userId: string): Promise<User | null>
```

**权限:** 公开（返回公开信息）

---

#### `getUserStats`

```typescript
export async function getUserStats(userId: string): Promise<{
  postCount: number
  followerCount: number
  subscriptionStatus: 'free' | 'pro' | 'lifetime'
}>
```

**权限:** 认证用户

---

#### `updateEmailNotifications`

```typescript
export async function updateEmailNotifications(input: {
  marketing: boolean      // 营销邮件
  digest: boolean         // 周报
  replies: boolean        // 回复通知
}): Promise<void>
```

**权限:** 认证用户

---

#### `deleteAccount`

```typescript
export async function deleteAccount(input: {
  password: string        // 确认密码
}): Promise<void>
```

**权限:** 认证用户

**触发:**
- 删除所有用户数据
- 删除用户会话
- 取消订阅

---

#### `listUsers` (管理员)

```typescript
export async function listUsers(input: {
  page?: number
  limit?: number
  role?: 'user' | 'admin'
  banned?: boolean
}): Promise<{
  users: User[]
  total: number
  pages: number
}>
```

**权限:** 管理员

---

### 支付相关

#### `createCheckoutSession`

```typescript
export async function createCheckoutSession(input: {
  plan: 'pro-monthly' | 'pro-yearly' | 'lifetime'
  promoCode?: string
}): Promise<{
  sessionId: string
  url: string
}>
```

**权限:** 认证用户

**定价:**
- pro-monthly: $9.99/月
- pro-yearly: $79.99/年 (20% 优惠)
- lifetime: $299.99

**说明:**
- 返回 Stripe Checkout 链接
- 用户跳转到 Stripe 完成支付

---

#### `getSubscription`

```typescript
export async function getSubscription(): Promise<Payment | null>
```

**权限:** 认证用户

**返回:**
- 当前订阅信息
- 下一个计费日期
- 订阅状态

---

#### `cancelSubscription`

```typescript
export async function cancelSubscription(): Promise<{
  success: boolean
  cancelDate: Date
}>
```

**权限:** 认证用户

**说明:**
- 立即取消订阅
- 退款政策由 Stripe 处理
- 可在 Stripe 客户门户中恢复

---

#### `updatePaymentMethod`

```typescript
export async function updatePaymentMethod(): Promise<{
  url: string            // Stripe 客户门户 URL
}>
```

**权限:** 认证用户

**说明:**
- 返回 Stripe 客户门户
- 用户可管理支付方法、发票等

---

#### `applyPromoCode`

```typescript
export async function applyPromoCode(input: {
  code: string
}): Promise<{
  discount: number       // 折扣百分比
  discountAmount: number // 折扣金额
}>
```

**权限:** 认证用户

---

#### `getInvoices`

```typescript
export async function getInvoices(input: {
  page?: number
  limit?: number
}): Promise<{
  invoices: Invoice[]
  total: number
}>
```

**权限:** 认证用户

---

### 博客相关

#### `createPost`

```typescript
export async function createPost(input: {
  title: string
  content: string
  excerpt?: string
  tags?: string[]
  published?: boolean
}): Promise<{
  post: Post
}>
```

**权限:** 认证用户

**验证:**
- title: 1-200 字符
- content: 至少 10 字符
- tags: 最多 5 个

---

#### `updatePost`

```typescript
export async function updatePost(input: {
  postId: string
  title?: string
  content?: string
  excerpt?: string
  tags?: string[]
  published?: boolean
}): Promise<Post>
```

**权限:** 文章作者或管理员

---

#### `deletePost`

```typescript
export async function deletePost(postId: string): Promise<void>
```

**权限:** 文章作者或管理员

---

#### `publishPost`

```typescript
export async function publishPost(postId: string): Promise<Post>
```

**权限:** 文章作者或管理员

**说明:**
- 设置发布时间
- 触发社交分享通知

---

#### `getPost`

```typescript
export async function getPost(slug: string): Promise<Post | null>
```

**权限:** 公开

---

#### `listPosts`

```typescript
export async function listPosts(input: {
  page?: number
  limit?: number
  tag?: string
  userId?: string
  published?: boolean
}): Promise<{
  posts: Post[]
  total: number
}>
```

**权限:** 公开

---

#### `likePost`

```typescript
export async function likePost(postId: string): Promise<{
  liked: boolean
}>
```

**权限:** 认证用户

---

### 管理员专用

#### `banUser`

```typescript
export async function banUser(input: {
  userId: string
  reason: string
  expiresAt?: Date
}): Promise<void>
```

**权限:** 管理员

---

#### `unbanUser`

```typescript
export async function unbanUser(userId: string): Promise<void>
```

**权限:** 管理员

---

#### `updateUserCredits`

```typescript
export async function updateUserCredits(input: {
  userId: string
  amount: number
  reason: string
}): Promise<{
  newBalance: number
}>
```

**权限:** 管理员

---

#### `getSystemStats`

```typescript
export async function getSystemStats(): Promise<{
  totalUsers: number
  totalRevenue: number
  activeSubscriptions: number
  totalPosts: number
}>
```

**权限:** 管理员

---

## API Routes

### 用户 API

#### `GET /api/users?page=1&limit=10`

```typescript
// 获取用户列表（仅公开字段）
Response: {
  users: User[]
  total: number
  pages: number
}
```

---

#### `GET /api/users/[id]`

```typescript
// 获取用户信息
Response: User
```

---

#### `GET /api/users/[id]/posts`

```typescript
// 获取用户的文章列表
Response: {
  posts: Post[]
  total: number
}
```

---

### 博客 API

#### `GET /api/posts?page=1&limit=10&tag=tech`

```typescript
Response: {
  posts: Post[]
  total: number
  pages: number
}
```

---

#### `GET /api/posts/[slug]`

```typescript
Response: Post
```

---

#### `POST /api/posts`

```typescript
// 需要认证
Body: {
  title: string
  content: string
  tags?: string[]
}

Response: Post (201 Created)
```

---

#### `PATCH /api/posts/[id]`

```typescript
// 需要认证，作者或管理员
Body: {
  title?: string
  content?: string
}

Response: Post
```

---

### 支付 API

#### `POST /api/payments/checkout`

```typescript
Body: {
  plan: string
}

Response: {
  sessionId: string
  url: string
}
```

---

#### `GET /api/payments/subscription`

```typescript
// 需要认证
Response: Payment | null
```

---

#### `POST /api/payments/cancel`

```typescript
// 需要认证
Response: {
  success: boolean
}
```

---

### 上传 API

#### `POST /api/uploads`

```typescript
// FormData with file
// 需要认证

Response: {
  url: string
  filename: string
}
```

---

#### `DELETE /api/uploads/[id]`

```typescript
// 需要认证，上传者或管理员
Response: { success: boolean }
```

---

### Webhooks

#### `POST /api/webhooks/stripe`

```typescript
// Stripe Webhook 回调
// 需要签名验证

支持事件:
- checkout.session.completed
- invoice.payment_succeeded
- customer.subscription.deleted
- charge.refunded
```

---

## Webhook 事件

### Stripe Events

#### `checkout.session.completed`

```typescript
// 支付成功
{
  type: 'checkout.session.completed',
  data: {
    sessionId: string
    customerId: string
    subscriptionId: string
    amount: number
    plan: string
  }
}

处理:
- 创建/更新 Payment 记录
- 设置订阅为 active
- 发送确认邮件
```

---

#### `invoice.payment_succeeded`

```typescript
// 续费成功
{
  type: 'invoice.payment_succeeded',
  data: {
    invoiceId: string
    customerId: string
    amount: number
  }
}

处理:
- 更新支付记录
- 发送发票邮件
```

---

#### `customer.subscription.deleted`

```typescript
// 取消订阅
{
  type: 'customer.subscription.deleted',
  data: {
    subscriptionId: string
    customerId: string
  }
}

处理:
- 更新 Payment 为 canceled
- 通知用户
```

---

## 错误响应格式

### Server Actions

```typescript
// 成功
{
  success: true,
  data: {...}
}

// 失败
{
  success: false,
  error: "错误信息",
  code: "ERROR_CODE"
}
```

---

### API Routes

```typescript
// 200 - 成功
Response: { data: ... }

// 400 - 请求错误
Response: {
  error: "验证失败",
  code: "VALIDATION_ERROR",
  details: {...}
}

// 401 - 未认证
Response: { error: "未登录" }

// 403 - 权限不足
Response: { error: "无权执行此操作" }

// 404 - 不存在
Response: { error: "资源不存在" }

// 429 - 速率限制
Response: {
  error: "请求过于频繁",
  retryAfter: 60
}

// 500 - 服务器错误
Response: { error: "服务器错误" }
```

---

## 权限模型

```
┌─────────────────┬──────────┬──────────┬──────────┐
│ 操作            │ 未登录   │ 普通用户 │ 管理员   │
├─────────────────┼──────────┼──────────┼──────────┤
│ 注册/登录       │ ✅      │ -        │ -        │
│ 查看公开文章    │ ✅      │ ✅      │ ✅      │
│ 创建文章        │ ❌      │ ✅      │ ✅      │
│ 编辑自己的文章  │ ❌      │ ✅      │ ✅      │
│ 删除他人文章    │ ❌      │ ❌      │ ✅      │
│ 禁用用户        │ ❌      │ ❌      │ ✅      │
│ 修改他人数据    │ ❌      │ ❌      │ ✅      │
└─────────────────┴──────────┴──────────┴──────────┘
```

---

## 限流规则

```
操作                          限制
────────────────────────────────────
创建文章                    每小时 10 个
发送邮件                    每小时 5 个
API 请求（未认证）         每分钟 10 个
API 请求（认证用户）       每分钟 60 个
支付操作                    每小时 3 次
密码重置                    每小时 3 次
```

---

## 常用代码示例

### 调用 Server Action

```typescript
'use client'

import { updateProfile } from '@/actions/user'

export function UpdateProfileButton() {
  async function handleClick() {
    const result = await updateProfile({
      name: 'New Name',
      bio: 'New bio'
    })

    if (result.success) {
      alert('更新成功')
    } else {
      alert(result.error)
    }
  }

  return <button onClick={handleClick}>更新</button>
}
```

---

### 调用 API Route

```typescript
'use client'

export function CreatePostButton() {
  async function handleClick() {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'My Post',
        content: 'Post content...'
      })
    })

    if (response.ok) {
      const post = await response.json()
      console.log('Created:', post)
    }
  }

  return <button onClick={handleClick}>创建</button>
}
```

---

## 总结

✅ **30+ Server Actions** - 处理业务逻辑
✅ **15+ API Routes** - 提供 REST API
✅ **5+ Webhooks** - 处理第三方事件
✅ **完整权限模型** - 安全的数据访问
✅ **限流保护** - 防止滥用

---

**相关文档:**
- [3-开发指南/Server Actions详解](../3-开发指南/Server Actions详解.md)
- [3-开发指南/API Routes详解](../3-开发指南/API Routes详解.md)

**最后更新:** 2025-11-18
