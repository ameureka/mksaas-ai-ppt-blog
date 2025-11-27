# Auth系统适配点深度分析

## 一、目标

**将v0的所有Auth相关代码全部适配到mksaas的Better Auth系统**

---

## 二、两套系统对比

### v0的Auth系统（自定义mock实现）

```typescript
// 文件: vo-ui-code-pro/v0mksaaspptsite/lib/hooks/use-auth.tsx

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  requireAuth: (callback: () => void) => boolean
}

// 使用方式
const { user, login, register, logout } = useAuth()
```

**特点**：
- 基于React Context的自定义实现
- 使用localStorage存储用户状态
- Mock数据，无真实后端
- 需要`<AuthProvider>`包裹

### mksaas的Auth系统（Better Auth）

```typescript
// 文件: src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react'
export const authClient = createAuthClient({ ... })

// 使用方式
const { data: session, isPending } = authClient.useSession()
const currentUser = session?.user
```

**特点**：
- 基于Better Auth库
- 真实的后端认证
- 支持OAuth（Google、GitHub等）
- 支持邮箱验证
- 内置admin插件

---

## 三、API映射表

| v0 API | mksaas API | 说明 |
|--------|-----------|------|
| `useAuth()` | `authClient.useSession()` | 获取用户状态 |
| `user` | `session?.user` | 当前用户对象 |
| `isLoading` | `isPending` | 加载状态 |
| `login(email, password)` | `authClient.signIn.email()` | 邮箱登录 |
| `register(...)` | `authClient.signUp.email()` | 邮箱注册 |
| `logout()` | `authClient.signOut()` | 退出登录 |
| `requireAuth()` | 路由中间件/条件渲染 | 权限检查 |
| `user.credits` | 需要从credits系统获取 | 积分信息 |
| `user.role` | `session?.user?.role` | 用户角色 |

---

## 四、受影响的文件

| # | 文件 | useAuth用法 | 需要修改 |
|---|-----|------------|---------|
| 1 | `components/navigation-header.tsx` | `user, logout` | ✅ |
| 2 | `components/auth/login-modal.tsx` | `login, register` | ✅ |
| 3 | `components/download-flow/download-modal.tsx` | `user` | ✅ |
| 4 | `lib/hooks/use-admin-auth.tsx` | `user, isLoading` | ✅ |
| 5 | `components/download/download-options-modal.tsx` | 注释掉的 | ❌ 无需修改 |

**实际需要修改：4个文件**

---

## 五、迁移思路

### 核心原则

**不迁移v0的use-auth.tsx，直接使用mksaas的Better Auth**

### 具体步骤

#### Step 1: 删除v0的Auth相关文件

```
不迁移的文件：
- lib/hooks/use-auth.tsx (v0的自定义auth)
- components/providers/auth-provider.tsx (如果有)
```

#### Step 2: 修改import语句

```typescript
// 修改前 (v0)
import { useAuth } from '@/lib/hooks/use-auth'
const { user, logout } = useAuth()

// 修改后 (mksaas)
import { authClient } from '@/lib/auth-client'
const { data: session } = authClient.useSession()
const user = session?.user
```

#### Step 3: 修改登录/注册逻辑

```typescript
// 修改前 (v0)
const { login, register } = useAuth()
await login(email, password)
await register(username, email, password)

// 修改后 (mksaas)
import { authClient } from '@/lib/auth-client'

// 登录
await authClient.signIn.email({
  email,
  password,
})

// 注册
await authClient.signUp.email({
  email,
  password,
  name: username,
})
```

#### Step 4: 修改登出逻辑

```typescript
// 修改前 (v0)
const { logout } = useAuth()
logout()

// 修改后 (mksaas)
import { authClient } from '@/lib/auth-client'
await authClient.signOut()
```

---

## 六、具体文件修改方案

### 6.1 navigation-header.tsx

```typescript
// 修改前
import { useAuth } from '@/lib/hooks/use-auth'
const { user, logout } = useAuth()

// 修改后
import { authClient } from '@/lib/auth-client'
const { data: session } = authClient.useSession()
const user = session?.user

const handleLogout = async () => {
  await authClient.signOut()
  toast.success("已退出登录")
}
```

### 6.2 login-modal.tsx

```typescript
// 修改前
import { useAuth } from '@/lib/hooks/use-auth'
const { login, register } = useAuth()
await login(loginEmail, loginPassword)
await register(registerUsername, registerEmail, registerPassword)

// 修改后
import { authClient } from '@/lib/auth-client'

// 登录
const result = await authClient.signIn.email({
  email: loginEmail,
  password: loginPassword,
})
if (result.error) {
  toast.error('登录失败，请检查邮箱和密码')
} else {
  toast.success('登录成功')
}

// 注册
const result = await authClient.signUp.email({
  email: registerEmail,
  password: registerPassword,
  name: registerUsername,
})
if (result.error) {
  toast.error('注册失败，请稍后重试')
} else {
  toast.success('注册成功')
}
```

### 6.3 download-modal.tsx

```typescript
// 修改前
import { useAuth } from '@/lib/hooks/use-auth'
const { user } = useAuth()

// 修改后
import { authClient } from '@/lib/auth-client'
const { data: session } = authClient.useSession()
const user = session?.user
```

### 6.4 use-admin-auth.tsx

```typescript
// 修改前
import { useAuth } from '@/lib/hooks/use-auth'
const { user, isLoading } = useAuth()

// 修改后
import { authClient } from '@/lib/auth-client'
const { data: session, isPending: isLoading } = authClient.useSession()
const user = session?.user
```

---

## 七、User类型适配

### v0的User类型

```typescript
interface User {
  id: string
  username: string
  email: string
  avatar?: string
  credits: number
  role: 'user' | 'vip' | 'admin'
  createdAt: string
}
```

### mksaas的User类型

```typescript
// Better Auth的用户类型
interface User {
  id: string
  name: string | null
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: Date
  updatedAt: Date
  role?: string
  banned?: boolean
  banReason?: string | null
  banExpires?: Date | null
}
```

### 字段映射

| v0字段 | mksaas字段 | 处理方式 |
|-------|-----------|---------|
| `username` | `name` | 直接映射 |
| `email` | `email` | 直接映射 |
| `avatar` | `image` | 直接映射 |
| `credits` | - | 从credits系统单独获取 |
| `role` | `role` | 直接映射 |
| `createdAt` | `createdAt` | 类型不同(string vs Date) |

### credits处理

v0的`user.credits`需要从mksaas的credits系统获取：

```typescript
// mksaas中获取积分
import { useCredits } from '@/hooks/use-credits'
const { credits } = useCredits()
```

---

## 八、不需要迁移的文件

| 文件 | 原因 |
|-----|------|
| `lib/hooks/use-auth.tsx` | 使用mksaas的Better Auth替代 |
| `lib/api/services/auth.service.ts` | 使用mksaas的auth API替代 |
| `lib/api/mock/auth.mock.ts` | mock数据不需要 |

---

## 九、执行清单

### 自动化可执行

1. ✅ 修改import语句（4个文件）
2. ✅ 修改user获取方式
3. ✅ 修改logout调用
4. ✅ 运行TypeScript类型检查

### 需要人工review

1. ⚠️ login-modal.tsx的登录/注册逻辑需要完整重写
2. ⚠️ credits字段的获取方式需要确认
3. ⚠️ 是否需要保留v0的User类型定义（用于PPT业务）

---

## 十、决策点

| # | 决策项 | 选项 | 建议 |
|---|-------|-----|------|
| 1 | v0的use-auth.tsx | 迁移/不迁移 | **不迁移** |
| 2 | login-modal.tsx | 重写/适配 | **重写**（使用Better Auth API） |
| 3 | User类型 | 统一/分开 | **分开**（PPT业务用PPTUser，认证用Better Auth User） |
| 4 | credits获取 | 从user/单独获取 | **单独获取**（使用useCredits） |

---

## 十一、总结

### Auth适配的核心思路

```
v0的useAuth() → mksaas的authClient.useSession()
v0的login() → mksaas的authClient.signIn.email()
v0的register() → mksaas的authClient.signUp.email()
v0的logout() → mksaas的authClient.signOut()
```

### 工作量评估

| 项目 | 工作量 |
|-----|-------|
| 修改import语句 | 4个文件，简单 |
| 修改user获取 | 4个文件，简单 |
| 重写login-modal | 1个文件，中等 |
| 类型适配 | 需要review |
| **总计** | **约2小时** |

---

## 十二、已确认决定

| 决策项 | 决定 |
|-------|------|
| v0的use-auth.tsx | ❌ 不迁移，使用mksaas的Better Auth |
| login-modal.tsx | ❌ 不迁移，直接跳转到mksaas现有登录页 |
| credits字段 | ✅ 全部遵循mksaas的credits系统 |

### 最终方案

1. **登录/注册**：不使用v0的login-modal，直接跳转到mksaas的`/auth/sign-in`页面
2. **用户状态**：使用`authClient.useSession()`获取
3. **积分系统**：使用mksaas的`useCredits()`获取

### 简化后的修改

```typescript
// 需要登录时，直接跳转
import { useLocaleRouter } from '@/lib/navigation'
const router = useLocaleRouter()
router.push('/auth/sign-in')
```

这样可以**删除login-modal.tsx**，大大简化迁移工作。
