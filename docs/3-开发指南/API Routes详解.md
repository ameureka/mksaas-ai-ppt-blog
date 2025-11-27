# API Routes 详解

API Routes 用于创建 RESTful API 端点。本指南讲解如何设计和实现 API，处理请求、验证、认证和错误。

---

## 快速概览

```
何时使用 API Routes:
✅ 第三方集成 (Stripe, Slack 等)
✅ Webhook 回调
✅ 移动应用 API
✅ 公开 API
✅ 需要自定义 HTTP 方法

何时使用 Server Actions:
✅ 内部业务逻辑 (更简单、更安全)
✅ CRUD 操作
✅ 表单提交
```

---

## 文件组织

### 推荐结构

```
src/app/api/
├── [lang]/                    # 国际化 API (可选)
│   ├── posts/
│   │   ├── route.ts          # GET /api/[lang]/posts
│   │   └── [id]/
│   │       └── route.ts      # GET /api/[lang]/posts/[id]
│   └── users/
│       └── route.ts
├── webhooks/
│   ├── stripe/
│   │   └── route.ts          # POST /api/webhooks/stripe
│   └── github/
│       └── route.ts
├── uploads/
│   └── route.ts              # POST /api/uploads (文件上传)
└── health/
    └── route.ts              # GET /api/health (健康检查)
```

---

## 基础 API Route

### GET 端点

```typescript
// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'

/**
 * 获取文章列表
 * GET /api/posts?page=1&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 解析查询参数
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // 2. 验证参数
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: '无效的分页参数' },
        { status: 400 }
      )
    }

    // 3. 查询数据库
    const offset = (page - 1) * limit
    const posts = await db.query.post.findMany({
      limit,
      offset,
      orderBy: (post) => desc(post.createdAt),
    })

    const total = await db.query.post.findMany()
    const totalCount = total.length

    // 4. 返回响应
    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('获取文章列表失败:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
```

---

### POST 端点

```typescript
// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/db'

// 定义请求 Schema
const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10).max(10000),
  tags: z.array(z.string()).optional(),
})

/**
 * 创建新文章
 * POST /api/posts
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 身份验证
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: '未认证' },
        { status: 401 }
      )
    }

    // 2. 解析请求体
    const body = await request.json()

    // 3. 验证数据
    const validData = createPostSchema.parse(body)

    // 4. 业务逻辑（权限检查）
    if (session.user.role !== 'admin' && !session.user.canCreatePost) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    // 5. 创建数据库记录
    const newPost = await db
      .insert(post)
      .values({
        id: generateId(),
        title: validData.title,
        content: validData.content,
        userId: session.user.id,
        tags: validData.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    // 6. 返回响应（201 Created）
    return NextResponse.json(
      {
        success: true,
        data: newPost[0],
      },
      { status: 201 }
    )
  } catch (error) {
    // 错误处理
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: '验证失败',
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    console.error('创建文章失败:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
```

---

## 动态路由

### 获取单个资源

```typescript
// src/app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { post } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * 获取单个文章
 * GET /api/posts/123
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const foundPost = await db.query.post.findFirst({
      where: eq(post.id, id),
    })

    if (!foundPost) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: foundPost,
    })
  } catch (error) {
    console.error('获取文章失败:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

/**
 * 更新文章
 * PATCH /api/posts/123
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: '未认证' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()

    // 检查资源所有权
    const existingPost = await db.query.post.findFirst({
      where: eq(post.id, id),
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      )
    }

    if (existingPost.userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    // 更新
    const updated = await db
      .update(post)
      .set(body)
      .where(eq(post.id, id))
      .returning()

    return NextResponse.json({
      success: true,
      data: updated[0],
    })
  } catch (error) {
    console.error('更新文章失败:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

/**
 * 删除文章
 * DELETE /api/posts/123
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: '未认证' },
        { status: 401 }
      )
    }

    const { id } = params

    // 权限检查
    const existingPost = await db.query.post.findFirst({
      where: eq(post.id, id),
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      )
    }

    if (existingPost.userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    // 删除
    await db.delete(post).where(eq(post.id, id))

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('删除文章失败:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
```

---

## Webhook 处理

### Stripe Webhook

```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Stripe } from 'stripe'
import { headers } from 'next/headers'
import { db } from '@/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/**
 * Stripe Webhook 处理
 * POST /api/webhooks/stripe
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 获取请求体和签名
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: '缺少签名' },
        { status: 400 }
      )
    }

    // 2. 验证 Webhook 签名
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (error) {
      console.error('Webhook 签名验证失败:', error)
      return NextResponse.json(
        { error: '签名无效' },
        { status: 401 }
      )
    }

    // 3. 处理不同的事件类型
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      default:
        console.log(`未处理的事件类型: ${event.type}`)
    }

    // 4. 返回 200 表示成功处理
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook 处理失败:', error)
    return NextResponse.json(
      { error: '处理失败' },
      { status: 500 }
    )
  }
}

// 事件处理函数
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('处理 checkout.session.completed')

  const metadata = session.metadata || {}
  const userId = metadata.userId as string

  // 更新用户订阅
  await db.update(payment).set({
    status: 'active',
    stripeCustomerId: session.customer as string,
    stripeSubscriptionId: session.subscription as string,
    currentPeriodEnd: new Date(Number(session.expires_at) * 1000),
  })
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('处理 invoice.payment_succeeded')

  // 发送感谢邮件
  // 更新支付记录
  // 等等
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('处理 customer.subscription.deleted')

  // 更新用户订阅状态为已取消
  await db.update(payment).set({
    status: 'canceled',
    cancelledAt: new Date(),
  })
}
```

---

### 本地 Webhook 测试

```bash
# 安装 Stripe CLI
brew install stripe/stripe-cli/stripe

# 登录
stripe login

# 监听事件并转发到本地
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 触发测试事件
stripe trigger payment_intent.succeeded
```

---

## 文件上传

```typescript
// src/app/api/uploads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuid } from 'uuid'

/**
 * 处理文件上传
 * POST /api/uploads
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 身份验证
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: '未认证' },
        { status: 401 }
      )
    }

    // 2. 解析 FormData
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: '未上传文件' },
        { status: 400 }
      )
    }

    // 3. 验证文件
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件类型' },
        { status: 400 }
      )
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '文件过大' },
        { status: 400 }
      )
    }

    // 4. 保存文件
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const filename = `${uuid()}-${file.name}`
    const uploadDir = join(process.cwd(), 'public', 'uploads')

    // 确保目录存在
    await mkdir(uploadDir, { recursive: true })

    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // 5. 返回文件信息
    return NextResponse.json({
      success: true,
      url: `/uploads/${filename}`,
      filename,
    })
  } catch (error) {
    console.error('文件上传失败:', error)
    return NextResponse.json(
      { error: '上传失败' },
      { status: 500 }
    )
  }
}
```

---

## 速率限制

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h'), // 每小时 100 个请求
})

/**
 * 受速率限制的 API
 */
export async function GET(request: NextRequest) {
  // 使用 IP 地址作为标识
  const ip = request.ip || 'anonymous'
  const { success, pending, limit, reset, remaining } = await ratelimit.limit(ip)

  // 设置响应头
  const response = NextResponse.json(
    { success, remaining, limit, reset },
    {
      status: success ? 200 : 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    }
  )

  return response
}
```

---

## CORS 处理

```typescript
// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // 处理预检请求 (CORS)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      headers: {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  // 实际处理
  const response = NextResponse.json({ data: [] })

  // 添加 CORS 响应头
  response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*')

  return response
}
```

---

## 错误处理最佳实践

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

class APIError extends Error {
  constructor(
    public message: string,
    public status: number,
    public code: string
  ) {
    super(message)
  }
}

export async function GET(request: NextRequest) {
  try {
    // 业务逻辑...

    throw new APIError('资源不存在', 404, 'NOT_FOUND')
  } catch (error) {
    // 统一错误处理
    if (error instanceof APIError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.status }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: '验证失败',
          code: 'VALIDATION_ERROR',
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    // 未知错误
    console.error('未处理的错误:', error)
    return NextResponse.json(
      {
        error: '服务器错误',
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    )
  }
}
```

---

## HTTP 状态码参考

| 状态码 | 含义 | 用途 |
|--------|------|------|
| **200** | OK | 成功请求 |
| **201** | Created | 成功创建资源 |
| **204** | No Content | 成功但无响应内容 |
| **400** | Bad Request | 请求格式错误 |
| **401** | Unauthorized | 需要认证 |
| **403** | Forbidden | 权限不足 |
| **404** | Not Found | 资源不存在 |
| **409** | Conflict | 资源冲突（如重复） |
| **429** | Too Many Requests | 超过速率限制 |
| **500** | Internal Server Error | 服务器错误 |

---

## 总结

**何时使用 API Routes:**
- ✅ Webhook 回调（Stripe, GitHub等）
- ✅ 公开 API（给移动应用、第三方）
- ✅ 自定义 HTTP 方法需求
- ✅ 复杂的请求处理（文件上传、流式数据）

**最佳实践:**
1. 验证所有输入
2. 检查身份验证和权限
3. 使用正确的 HTTP 状态码
4. 返回结构化响应
5. 实施速率限制
6. 详细的错误日志

---

**相关文档:**
- [Server Actions 详解](./Server Actions详解.md)
- [表单处理完全指南](./表单处理完全指南.md)

**最后更新:** 2025-11-18
