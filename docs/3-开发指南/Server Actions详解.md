# Server Actions 详解

在 mk-saas-blog 中，Server Actions 是实现服务器端业务逻辑的标准方式。本指南详细讲解如何定义、使用和优化 Server Actions。

---

## 快速概览

```typescript
// Server Action 最小示例
'use server'

import { db } from '@/db'
import { user } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function updateUserName(newName: string) {
  // 1. 验证输入
  if (!newName || newName.trim().length === 0) {
    throw new Error('名字不能为空')
  }

  // 2. 获取当前用户
  const session = await auth()
  if (!session) {
    throw new Error('未登录')
  }

  // 3. 更新数据库
  const updated = await db
    .update(user)
    .set({ name: newName })
    .where(eq(user.id, session.user.id))
    .returning()

  return {
    success: true,
    user: updated[0],
  }
}
```

**特性:**
- ✅ 在服务器上执行
- ✅ 类型安全
- ✅ 自动 CSRF 防护
- ✅ 无需创建 API 端点
- ✅ 直接访问数据库

---

## 基础概念

### Server Action 是什么?

Server Action 是一个标有 `'use server'` directive 的异步函数，可以：
- 在服务器上执行
- 从客户端或服务器组件直接调用
- 访问服务器资源（数据库、环境变量等）
- 自动处理网络传输（序列化/反序列化）

---

### 执行流程

```
Client Component
  ↓
import { updateUserName } from '@/actions/user'
  ↓
<button onClick={() => updateUserName(newName)}>
  ↓ (网络请求)
  ↓
Server Action 执行
  ├─ 验证输入
  ├─ 权限检查
  ├─ 数据库操作
  └─ 返回结果
  ↓ (网络响应)
  ↓
Client 接收结果
  ↓
更新 UI
```

---

## 文件组织

### 推荐结构

```
src/actions/
├── index.ts              # 导出所有 actions
├── auth.ts               # 认证相关 actions
├── user.ts               # 用户相关 actions
├── payment.ts            # 支付相关 actions
├── post.ts               # 博客文章相关 actions
└── utils.ts              # 共享 utility 函数
```

---

### src/actions/user.ts 示例

```typescript
'use server'

import { db } from '@/db'
import { user } from '@/db/schema'
import { auth } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

// 定义数据验证 Schema
const updateNameSchema = z.object({
  name: z.string().min(1).max(100),
})

type UpdateNameInput = z.infer<typeof updateNameSchema>

/**
 * 更新用户名字
 * @param input - { name: string }
 * @returns 更新后的用户对象
 * @throws 验证错误、权限错误或数据库错误
 */
export async function updateUserName(input: UpdateNameInput) {
  // 1. 验证输入
  const validInput = updateNameSchema.parse(input)

  // 2. 权限检查
  const session = await auth()
  if (!session?.user) {
    throw new Error('未登录')
  }

  // 3. 业务逻辑
  const updated = await db
    .update(user)
    .set({
      name: validInput.name,
      updatedAt: new Date(),
    })
    .where(eq(user.id, session.user.id))
    .returning()

  return {
    success: true,
    user: updated[0],
  }
}

/**
 * 更新用户邮箱
 */
export async function updateUserEmail(input: { email: string }) {
  // 类似模式...
}

/**
 * 删除用户账户
 */
export async function deleteUserAccount() {
  // 类似模式...
}
```

---

### src/actions/index.ts 导出

```typescript
'use server'

export * from './auth'
export * from './user'
export * from './payment'
export * from './post'
```

---

## 完整示例：用户注册

### 定义 Schema 和类型

```typescript
// src/actions/auth.ts
'use server'

import { z } from 'zod'
import { db } from '@/db'
import { user } from '@/db/schema'
import { auth } from '@/lib/auth'
import { eq } from 'drizzle-orm'

// 定义注册表单 Schema
const signUpSchema = z.object({
  email: z.string().email('无效的邮箱'),
  password: z.string().min(8, '密码至少 8 个字符'),
  name: z.string().min(1, '名字不能为空').max(100),
})

type SignUpInput = z.infer<typeof signUpSchema>

type SignUpResponse = {
  success: boolean
  user?: typeof user.$inferSelect
  error?: string
}

// 异步验证器：检查邮箱是否已存在
async function checkEmailExists(email: string): Promise<boolean> {
  const existing = await db.query.user.findFirst({
    where: eq(user.email, email),
  })
  return !!existing
}

// 扩展 Schema 加上异步验证
const signUpSchemaWithAsyncValidation = signUpSchema.refine(
  async (data) => {
    const exists = await checkEmailExists(data.email)
    return !exists
  },
  {
    message: '邮箱已被使用',
    path: ['email'],
  }
)
```

---

### 实现 Server Action

```typescript
/**
 * 用户注册
 * @param input - { email, password, name }
 * @returns 新用户对象或错误
 */
export async function signUp(input: SignUpInput): Promise<SignUpResponse> {
  try {
    // 1. 验证输入（包括异步验证）
    const validInput = await signUpSchemaWithAsyncValidation.parseAsync(input)

    // 2. 权限检查（防止已登录用户再次注册）
    const session = await auth()
    if (session?.user) {
      return {
        success: false,
        error: '您已经登录',
      }
    }

    // 3. 创建用户
    const hashedPassword = await hashPassword(validInput.password)
    const newUser = await db
      .insert(user)
      .values({
        id: generateId(),
        email: validInput.email,
        name: validInput.name,
        password: hashedPassword,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    // 4. 发送验证邮件
    await sendVerificationEmail(newUser[0].email, newUser[0].id)

    // 5. 返回成功响应
    return {
      success: true,
      user: newUser[0],
    }
  } catch (error) {
    // 6. 错误处理
    console.error('注册失败:', error)

    // 区分不同类型的错误
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || '验证失败',
      }
    }

    return {
      success: false,
      error: '注册失败，请稍后重试',
    }
  }
}
```

---

## 在客户端使用

### 基本用法

```typescript
// src/components/SignUpForm.tsx
'use client'

import { useState } from 'react'
import { signUp } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SignUpForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await signUp({
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        name: formData.get('name') as string,
      })

      if (result.success) {
        // 成功：重定向或显示消息
        alert('注册成功，请检查邮箱验证账户')
        // router.push('/auth/verify-email')
      } else {
        setError(result.error || '注册失败')
      }
    } catch (err) {
      setError('发生错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        name="email"
        type="email"
        placeholder="邮箱"
        required
        disabled={loading}
      />
      <Input
        name="password"
        type="password"
        placeholder="密码"
        required
        disabled={loading}
      />
      <Input
        name="name"
        placeholder="名字"
        required
        disabled={loading}
      />
      {error && <div className="text-red-500">{error}</div>}
      <Button type="submit" disabled={loading}>
        {loading ? '注册中...' : '注册'}
      </Button>
    </form>
  )
}
```

---

### 使用 React Hook Form 和 next-safe-action

```typescript
// 更推荐的方式：使用 next-safe-action 获得完整类型安全

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { signUp } from '@/actions/auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
})

export function SignUpForm() {
  const { execute, isExecuting, result } = useAction(signUp)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  })

  async function onSubmit(data: z.infer<typeof schema>) {
    await execute(data)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* 表单字段 */}
      {result?.serverError && (
        <div className="text-red-500">{result.serverError}</div>
      )}
      <button disabled={isExecuting}>
        {isExecuting ? '注册中...' : '注册'}
      </button>
    </form>
  )
}
```

---

## 进阶用法

### 1. 乐观更新（Optimistic Updates）

```typescript
'use client'

import { updateUserName } from '@/actions/user'
import { useOptimistic, useState } from 'react'

export function EditUserName({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName)

  // 乐观更新：立即更新 UI，同时发送请求
  const [optimisticName, setOptimisticName] = useOptimistic(
    name,
    (state, newName: string) => newName
  )

  async function handleSave(newName: string) {
    // 立即更新 UI
    setOptimisticName(newName)

    try {
      // 后台发送请求
      const result = await updateUserName(newName)
      // 服务器确认后更新状态
      setName(result.user.name)
    } catch (error) {
      // 失败：回滚 UI
      setOptimisticName(name)
    }
  }

  return (
    <div>
      <p>当前名字: {optimisticName}</p>
      <button onClick={() => handleSave('新名字')}>
        修改名字
      </button>
    </div>
  )
}
```

---

### 2. 超时处理

```typescript
'use server'

// 设置 timeout 防止长时间运行
export async function longRunningAction() {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('操作超时')), 30000) // 30 秒超时
  )

  try {
    const result = await Promise.race([
      performHeavyComputation(),
      timeoutPromise,
    ])
    return result
  } catch (error) {
    throw new Error('操作失败或超时')
  }
}
```

---

### 3. 批量操作

```typescript
'use server'

const deleteUsersSchema = z.object({
  userIds: z.array(z.string()).min(1),
})

export async function deleteUsers(input: z.infer<typeof deleteUsersSchema>) {
  const validInput = deleteUsersSchema.parse(input)

  // 权限检查：只有管理员可以删除
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    throw new Error('权限不足')
  }

  // 批量删除
  const result = await db
    .delete(user)
    .where(inArray(user.id, validInput.userIds))
    .returning()

  return {
    deletedCount: result.length,
  }
}
```

---

## 安全考虑

### 1. 输入验证

```typescript
'use server'

import { z } from 'zod'

const createPostSchema = z.object({
  title: z.string()
    .min(1, '标题不能为空')
    .max(200, '标题不能超过200个字符')
    .transform(s => s.trim()), // 自动去除空格
  content: z.string()
    .min(10, '内容不能少于10个字符')
    .max(10000, '内容不能超过10000个字符'),
  tags: z.array(z.string()).max(5, '最多5个标签'),
})

export async function createPost(input: z.infer<typeof createPostSchema>) {
  // Zod 会自动验证所有字段
  const validInput = createPostSchema.parse(input)
  // validInput 类型安全，所有字段都已验证
}
```

---

### 2. 权限检查

```typescript
'use server'

export async function deletePost(postId: string) {
  // 步骤 1: 身份验证
  const session = await auth()
  if (!session?.user) {
    throw new Error('未登录')
  }

  // 步骤 2: 资源所有权
  const post = await db.query.post.findFirst({
    where: eq(post.id, postId),
  })

  if (!post) {
    throw new Error('文章不存在')
  }

  if (post.userId !== session.user.id && session.user.role !== 'admin') {
    throw new Error('无权删除此文章')
  }

  // 步骤 3: 执行操作
  await db.delete(post).where(eq(post.id, postId))

  return { success: true }
}
```

---

### 3. 速率限制

```typescript
'use server'

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 h'), // 每小时5次
})

export async function sendVerificationEmail(email: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('未登录')
  }

  // 检查速率限制
  const { success } = await ratelimit.limit(`email-${session.user.id}`)
  if (!success) {
    throw new Error('请求过于频繁，请稍后再试')
  }

  // 发送邮件...
}
```

---

## 错误处理模式

### 结构化错误响应

```typescript
'use server'

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: Record<string, string>
  }
}

export async function safeUpdateUser(
  input: UpdateUserInput
): Promise<ActionResult<typeof user.$inferSelect>> {
  try {
    // 验证
    const validInput = updateUserSchema.parse(input)

    // 权限检查
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: {
          message: '未登录',
          code: 'UNAUTHENTICATED',
        },
      }
    }

    // 执行
    const result = await db.update(user).set(validInput).returning()

    return {
      success: true,
      data: result[0],
    }
  } catch (error) {
    // 日志记录
    console.error('更新用户失败:', error)

    // 返回错误
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: '验证失败',
          code: 'VALIDATION_ERROR',
          details: error.flatten().fieldErrors as Record<string, string>,
        },
      }
    }

    return {
      success: false,
      error: {
        message: '服务器错误',
        code: 'INTERNAL_SERVER_ERROR',
      },
    }
  }
}
```

---

## 常见错误和解决方案

### ❌ 错误 1: 在 Server Action 中使用 React Hooks

```typescript
// ❌ 错误
'use server'

export async function badAction() {
  const [state, setState] = useState(0) // 错误！
}

// ✅ 正确
'use client'

export function GoodComponent() {
  const [state, setState] = useState(0) // 正确
}
```

---

### ❌ 错误 2: 暴露敏感信息

```typescript
// ❌ 错误
export async function badAction() {
  return {
    apiKey: process.env.STRIPE_SECRET_KEY, // 永远不要返回！
  }
}

// ✅ 正确
export async function goodAction() {
  // 在服务器上使用，不要返回给客户端
  const response = await stripe.charges.create({...})
  return {
    chargeId: response.id, // 只返回公开信息
  }
}
```

---

### ❌ 错误 3: 忘记验证输入

```typescript
// ❌ 错误
export async function badAction(email: string) {
  // 直接使用，没有验证！
  await sendEmail(email)
}

// ✅ 正确
const emailSchema = z.string().email()

export async function goodAction(input: { email: string }) {
  const validInput = emailSchema.parse(input.email)
  await sendEmail(validInput)
}
```

---

## 性能优化

### 1. 批量操作而不是循环

```typescript
// ❌ 低效：N + 1 查询
export async function deleteAllPosts(userIds: string[]) {
  for (const userId of userIds) {
    const posts = await db.query.post.findMany({
      where: eq(post.userId, userId),
    })
    for (const post of posts) {
      await db.delete(post)
    }
  }
}

// ✅ 高效：一次查询，一次删除
export async function deleteAllPosts(userIds: string[]) {
  await db.delete(post).where(inArray(post.userId, userIds))
}
```

---

### 2. 避免在循环中调用 Server Action

```typescript
// ❌ 低效：10 个网络请求
export function UserDeleteForm({ userIds }: { userIds: string[] }) {
  return (
    <button onClick={() => {
      userIds.forEach(id => deleteUser(id)) // 错误！
    }}>
      删除用户
    </button>
  )
}

// ✅ 高效：1 个网络请求
export async function deleteUsers(userIds: string[]) {
  // 在服务器上批量删除
  await db.delete(user).where(inArray(user.id, userIds))
}
```

---

## 总结

✅ **何时使用 Server Action:**
- 处理数据库操作
- 访问环境变量或 API 密钥
- 验证和权限检查
- 实时数据操作

❌ **何时不使用 Server Action:**
- 实时用户交互（使用客户端 state）
- 仅需要第三方 API（考虑 API Route）
- 大量数据传输（使用分页）

🎯 **最佳实践:**
1. 总是验证输入（使用 Zod）
2. 检查权限和身份验证
3. 使用 try-catch 处理错误
4. 返回结构化响应
5. 记录错误用于调试

---

**相关文档:**
- [API Routes 详解](./API Routes详解.md)
- [表单处理完全指南](./表单处理完全指南.md)
- [2-核心概念/概念澄清](../2-核心概念/概念澄清.md)

**最后更新:** 2025-11-18
