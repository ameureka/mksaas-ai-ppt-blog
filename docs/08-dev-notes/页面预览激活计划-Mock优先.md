# 页面预览激活计划 - Mock 数据优先
**创建日期**: 2025-11-26
**目标**: 实现所有页面可预览,基础交互基于 Mock 数据
**原则**: 不涉及数据库设计和复杂 API,只关注页面展示和交互

---

## 🎯 **核心目标**

```
✅ 1. 所有页面路径有效,可以访问
✅ 2. 所有页面可以正常预览(有内容显示)
✅ 3. 基础交互功能使用 Mock 数据实现
❌ 4. 暂不涉及数据库设计
❌ 5. 暂不涉及复杂的 Server Actions
⚠️ 6. 简单的 Server Actions 可以用于页面渲染
```

---

## 📊 **页面状态总览**

### 已发现的页面 (39 个)

```
✅ 完全可预览 (33 个)
⚠️ 部分可预览,需要改进 (4 个)
❌ 无法预览,需要修复 (2 个)
```

---

## 📄 **详细页面分析**

### 一、Marketing 页面 (公开访问) - 21 个

#### 🏠 主页和基础页面 (13 个)

| 路径 | 状态 | Mock 数据 | 交互功能 | 备注 |
|------|------|-----------|----------|------|
| `/` | ✅ | ✅ | ✅ | 首页,功能完整 |
| `/about` | ✅ | N/A | - | 关于页面,静态内容 |
| `/contact` | ✅ | ✅ | ⚠️ | 联系表单,需要简单 action |
| `/pricing` | ✅ | ✅ | ✅ | 价格页面,功能完整 |
| `/roadmap` | ✅ | ✅ | ✅ | 路线图,功能完整 |
| `/changelog` | ✅ | ✅ | ✅ | 更新日志,功能完整 |
| `/waitlist` | ✅ | ✅ | ⚠️ | 等候列表,需要简单 action |
| `/test` | ✅ | ✅ | ✅ | 测试页面 |
| `/magicui` | ✅ | ✅ | ✅ | MagicUI 展示 |
| `/terms` | ✅ | N/A | - | 服务条款,静态内容 |
| `/privacy` | ✅ | N/A | - | 隐私政策,静态内容 |
| `/cookie` | ✅ | N/A | - | Cookie 政策,静态内容 |
| `[...rest]` | ✅ | N/A | - | 404 捕获页 |

**小结**: ✅ **13/13 完全可预览**

---

#### 🤖 AI 功能页面 (5 个)

| 路径 | 状态 | Mock 数据 | 交互功能 | 备注 |
|------|------|-----------|----------|------|
| `/ai/image` | ✅ | API 调用 | ✅ | 图像生成,调用真实 API |
| `/ai/text` | ✅ | API 调用 | ✅ | 文本分析,调用真实 API |
| `/ai/chat` | ✅ | API 调用 | ✅ | 聊天功能,调用真实 API |
| `/ai/audio` | ✅ | ⚠️ | ⚠️ | 音频功能,需要检查 |
| `/ai/video` | ✅ | ⚠️ | ⚠️ | 视频功能,需要检查 |

**小结**: ✅ **5/5 可访问**, ⚠️ **2 个需要检查内容完整性**

---

#### 📝 博客系统 (2 个)

| 路径 | 状态 | Mock 数据 | 交互功能 | 备注 |
|------|------|-----------|----------|------|
| `/blog` | ✅ | MDX | ✅ | 博客列表,基于 Fumadocs |
| `/blog/[...slug]` | ✅ | MDX | ✅ | 博客详情,基于 Fumadocs |

**小结**: ✅ **2/2 完全可预览** (使用 MDX 内容)

---

#### 📄 PPT 功能页面 (3 个)

| 路径 | 状态 | Mock 数据 | 交互功能 | 问题 | 优先级 |
|------|------|-----------|----------|------|--------|
| `/ppt` | ✅ | ✅ 完整 | ✅ 完整 | 功能完整 | - |
| `/ppt/categories` | ✅ | ✅ 完整 | ✅ 完整 | 功能完整 | - |
| `/ppt/category/[name]` | ✅ | ✅ 完整 | ✅ 完整 | 功能完整,Mock 数据丰富 | - |

**详细分析 - `/ppt` 主页**:
```typescript
// ✅ 状态: 完全可预览
// 322 行代码,16.6 KB

Mock 数据:
✅ mockPPTs - 15 个样本数据
✅ categories - 8 个分类定义
✅ hotKeywordKeys - 8 个热门关键词

交互功能:
✅ 搜索功能 (本地过滤)
✅ 分类筛选
✅ 语言筛选
✅ 排序 (热门/最新)
✅ 分页显示
✅ 错误处理 (验证、速率限制、404)
✅ 移动端适配
✅ 侧边栏导航
✅ 广告展示

无需修改: 功能完整,可以直接预览
```

**详细分析 - `/ppt/categories` 分类页**:
```typescript
// ✅ 状态: 完全可预览
// 222 行代码,7.7 KB

Mock 数据:
✅ categories - 8 个分类详情
✅ 每个分类的详细信息 (平均页数、风格、难度)

交互功能:
✅ 分类卡片点击跳转
✅ FAQ 手风琴
✅ 面包屑导航
✅ 响应式布局

无需修改: 功能完整,可以直接预览
```

**详细分析 - `/ppt/category/[name]` 具体分类页**:
```typescript
// ✅ 状态: 完全可预览
// 322 行代码,13.2 KB

Mock 数据生成:
✅ generateMockPPT() - 单个 PPT 数据生成
✅ createMockList() - 批量生成列表
✅ 动态生成 3 个区域的数据:
   - hotPPTs (6 个)
   - featuredPPTs (9 个)
   - newPPTs (9 个)
   - allPPTs (32 个,支持分页)

交互功能:
✅ 排序 (popular/latest/rating)
✅ 筛选按钮
✅ 分页 (12 个/页)
✅ Loading 骨架屏
✅ 面包屑导航
✅ 卡片点击跳转
✅ FAQ 展示

无需修改: 功能完整,Mock 数据丰富
```

**小结**: ✅ **3/3 完全可预览**,Mock 数据完善

---

### 二、Protected 页面 (需要登录) - 11 个

#### 👤 用户中心 (7 个)

| 路径 | 状态 | Mock 数据 | 交互功能 | 备注 |
|------|------|-----------|----------|------|
| `/dashboard` | ✅ | ✅ | ✅ | 仪表板,功能完整 |
| `/settings/profile` | ✅ | ✅ | ✅ | 个人资料,表单完整 |
| `/settings/account` | ✅ | ✅ | ✅ | 账户设置 |
| `/settings/billing` | ✅ | ✅ | ✅ | 账单管理 |
| `/settings/credits` | ✅ | ✅ | ✅ | 积分管理 |
| `/settings/security` | ✅ | ✅ | ✅ | 安全设置 |
| `/settings/notifications` | ✅ | ✅ | ✅ | 通知设置 |

**小结**: ✅ **7/7 可预览**

---

#### 👨‍💼 Admin 管理页面 (3 个)

| 路径 | 状态 | Mock 数据 | 交互功能 | 问题 | 优先级 |
|------|------|-----------|----------|------|--------|
| `/admin/users` | ✅ | 真实数据 | ✅ | 功能完整 | - |
| `/admin/users-v0` | ⚠️ | ⚠️ 需要 Mock | ❌ 部分缺失 | 需要添加 Mock 数据和交互 | 高 |
| `/admin/ppts-v0` | ⚠️ | ❌ 空数据 | ❌ 缺失 | 需要添加 Mock 数据和交互 | 高 |

**详细分析 - `/admin/users-v0`**:
```typescript
// ⚠️ 状态: 部分可预览,需要改进
// 文件: src/app/[locale]/(protected)/admin/users-v0/page.tsx

当前问题:
❌ 是 Server Component,没有客户端交互
❌ 依赖 getUsersAction (需要数据库)
❌ 没有状态管理 (selectedIds, 删除等)

解决方案:
✅ 创建 Mock 数据生成函数
✅ 创建 Client Component 处理交互
✅ 保留 v0 UI 组件不变
```

**详细分析 - `/admin/ppts-v0`**:
```typescript
// ⚠️ 状态: 可访问但无内容
// 文件: src/app/[locale]/(protected)/admin/ppts-v0/page.tsx
// 代码: 26 行

当前问题:
❌ getPptsAction 不存在,返回空数组
❌ 没有 Mock 数据
❌ 没有交互逻辑 (onSelectionChange, onDelete 是空函数)

解决方案:
✅ 创建 Mock PPT 数据生成函数
✅ 创建 Client Component 处理交互
✅ 使用已有的 v0-ppt-list-table 组件
```

**小结**: ⚠️ **1/3 完整**, **2/3 需要添加 Mock 数据**

---

#### 💳 支付页面 (1 个)

| 路径 | 状态 | Mock 数据 | 交互功能 | 备注 |
|------|------|-----------|----------|------|
| `/payment` | ✅ | ✅ | ✅ | 支付处理页 |

**小结**: ✅ **1/1 可预览**

---

#### 🐛 调试页面 (1 个)

| 路径 | 状态 | Mock 数据 | 交互功能 | 备注 |
|------|------|-----------|----------|------|
| `/debug-session` | ✅ | ✅ | ✅ | Session 调试 |

**小结**: ✅ **1/1 可预览**

---

### 三、Auth 页面 (5 个)

| 路径 | 状态 | Mock 数据 | 交互功能 | 备注 |
|------|------|-----------|----------|------|
| `/auth/login` | ✅ | N/A | ✅ | 登录页,Better Auth |
| `/auth/register` | ✅ | N/A | ✅ | 注册页,Better Auth |
| `/auth/forgot-password` | ✅ | N/A | ✅ | 忘记密码 |
| `/auth/reset-password` | ✅ | N/A | ✅ | 重置密码 |
| `/auth/error` | ✅ | N/A | - | 错误页面 |

**小结**: ✅ **5/5 可预览** (依赖 Better Auth,已集成)

---

### 四、Docs 页面 (1 个)

| 路径 | 状态 | Mock 数据 | 交互功能 | 备注 |
|------|------|-----------|----------|------|
| `/docs/[[...slug]]` | ✅ | MDX | ✅ | 文档系统,Fumadocs |

**小结**: ✅ **1/1 完全可预览** (使用 MDX 内容)

---

## 🎯 **需要修复的页面清单**

### 优先级 1 - 高 (必须修复)

#### 1. `/admin/ppts-v0` - PPT 管理后台

**当前状态**: ⚠️ 可访问,但无数据显示

**问题**:
```typescript
// src/app/[locale]/(protected)/admin/ppts-v0/page.tsx
❌ getPptsAction 不存在
❌ 返回空数组 []
❌ 没有交互逻辑
```

**解决方案**:
```typescript
// 步骤 1: 创建 Mock 数据
// 新建: src/lib/mock-data/ppts.ts

export interface MockPPT {
  id: string
  title: string
  category: string
  status: 'draft' | 'published' | 'archived'
  downloads: number
  views: number
  updatedAt: string
  author?: string
  description?: string
}

export function generateMockPPTs(count: number): MockPPT[] {
  const categories = ['business', 'education', 'marketing', 'summary']
  const statuses = ['draft', 'published', 'archived']

  return Array.from({ length: count }, (_, i) => ({
    id: `ppt_${i + 1}`,
    title: `Mock PPT 模板 ${i + 1}`,
    category: categories[i % categories.length],
    status: statuses[i % statuses.length] as any,
    downloads: Math.floor(Math.random() * 5000),
    views: Math.floor(Math.random() * 10000),
    updatedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    author: `作者 ${i + 1}`,
    description: `这是 Mock PPT 模板 ${i + 1} 的描述`,
  }))
}

export const MOCK_PPTS = generateMockPPTs(50)
```

```typescript
// 步骤 2: 创建 Client Component
// 新建: src/components/admin/ppt/ppts-page-client.tsx

'use client'

import { useState } from 'react'
import { V0PptListTable } from './v0/v0-ppt-list-table'
import { useToast } from '@/hooks/use-toast'
import type { MockPPT } from '@/lib/mock-data/ppts'

interface PptsPageClientProps {
  initialPpts: MockPPT[]
}

export function PptsPageClient({ initialPpts }: PptsPageClientProps) {
  const [ppts, setPpts] = useState(initialPpts)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const { toast } = useToast()

  const handleDelete = (id: string) => {
    // Mock 删除逻辑
    setPpts((prev) => prev.filter((p) => p.id !== id))
    setSelectedIds((prev) => prev.filter((sid) => sid !== id))

    toast({
      title: '删除成功',
      description: `已删除 PPT: ${id}`,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">PPT 管理</h1>
        <div className="text-sm text-muted-foreground">
          共 {ppts.length} 个 PPT | 已选择 {selectedIds.length} 个
        </div>
      </div>

      <V0PptListTable
        ppts={ppts}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onDelete={handleDelete}
      />
    </div>
  )
}
```

```typescript
// 步骤 3: 修改页面使用 Mock 数据
// 修改: src/app/[locale]/(protected)/admin/ppts-v0/page.tsx

import { PptsPageClient } from '@/components/admin/ppt/ppts-page-client'
import { MOCK_PPTS } from '@/lib/mock-data/ppts'

export default async function PptsV0Page() {
  // 使用 Mock 数据
  const ppts = MOCK_PPTS

  return (
    <div className="p-6">
      <PptsPageClient initialPpts={ppts} />
    </div>
  )
}
```

**预计工时**: 1-2 小时

---

#### 2. `/admin/users-v0` - 用户管理后台 (v0 版本)

**当前状态**: ⚠️ 可访问,但交互不完整

**问题**:
```typescript
❌ 没有客户端交互 (是 Server Component)
❌ 没有状态管理
❌ 删除、编辑功能不可用
```

**解决方案**:
```typescript
// 步骤 1: 创建 Mock 数据
// 新建: src/lib/mock-data/users.ts

export interface MockUser {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  banned: boolean
  createdAt: string
  currentCredits?: number
}

export function generateMockUsers(count: number): MockUser[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `user_${i + 1}`,
    name: `用户 ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: i < 5 ? 'admin' : 'user',
    banned: i % 10 === 0,
    createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
    currentCredits: Math.floor(Math.random() * 1000),
  }))
}

export const MOCK_USERS = generateMockUsers(100)
```

```typescript
// 步骤 2: 创建 Client Component
// 新建: src/components/admin/users/users-page-client.tsx

'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { MockUser } from '@/lib/mock-data/users'

export function UsersPageClient({ initialUsers }: { initialUsers: MockUser[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const { toast } = useToast()

  const handleBan = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, banned: !u.banned } : u))
    )
    toast({ title: '操作成功' })
  }

  const handleAdjustCredits = (userId: string, amount: number) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, currentCredits: (u.currentCredits || 0) + amount }
          : u
      )
    )
    toast({ title: '积分调整成功', description: `${amount > 0 ? '+' : ''}${amount} 积分` })
  }

  return (
    // 使用 v0 用户管理组件,传入交互函数
    <div>...</div>
  )
}
```

**预计工时**: 1-2 小时

---

### 优先级 2 - 中 (可选补充)

#### 3. `/ai/audio` 和 `/ai/video` - AI 功能页面

**当前状态**: ✅ 可访问,⚠️ 内容完整性未知

**需要检查**:
- [ ] 页面是否有内容显示
- [ ] Mock 数据是否完整
- [ ] 交互功能是否正常

**解决方案**:
```bash
# 访问页面检查
http://localhost:3005/ai/audio
http://localhost:3005/ai/video

# 如果缺少内容,添加 Mock 数据和基础 UI
```

**预计工时**: 30 分钟 - 1 小时 (每个)

---

#### 4. 联系表单 `/contact` 和等候列表 `/waitlist`

**当前状态**: ✅ 可访问,⚠️ 表单提交需要简单 Action

**问题**:
```typescript
❌ 表单提交没有反馈
❌ 需要简单的 Server Action 处理
```

**解决方案**:
```typescript
// 新建: src/actions/marketing/submit-contact.ts
'use server'

export async function submitContactAction(formData: FormData) {
  const name = formData.get('name')
  const email = formData.get('email')
  const message = formData.get('message')

  // Mock 处理 - 只记录日志
  console.log('[Mock] Contact form submitted:', { name, email, message })

  // 模拟延迟
  await new Promise((resolve) => setTimeout(resolve, 500))

  return { success: true, message: '感谢您的留言!我们会尽快回复。' }
}
```

**预计工时**: 30 分钟 (两个页面合计)

---

## 📋 **执行计划**

### 阶段 1: 修复高优先级页面 (2-4 小时)

```bash
# 第 1 步: 创建 Mock 数据 (30 分钟)
✅ src/lib/mock-data/ppts.ts
✅ src/lib/mock-data/users.ts

# 第 2 步: 创建 Client Components (1.5 小时)
✅ src/components/admin/ppt/ppts-page-client.tsx
✅ src/components/admin/users/users-page-client.tsx

# 第 3 步: 修改页面使用 Mock 数据 (1 小时)
✅ src/app/[locale]/(protected)/admin/ppts-v0/page.tsx
✅ src/app/[locale]/(protected)/admin/users-v0/page.tsx

# 第 4 步: 测试页面预览 (30 分钟)
✅ 访问 http://localhost:3005/admin/ppts-v0
✅ 测试选择、删除等交互
✅ 访问 http://localhost:3005/admin/users-v0
✅ 测试封禁、积分调整等交互
```

---

### 阶段 2: 检查中优先级页面 (1-2 小时)

```bash
# 第 1 步: 检查 AI 页面 (30 分钟)
✅ 访问 /ai/audio 和 /ai/video
✅ 检查内容完整性
✅ 如需补充,添加 Mock 数据

# 第 2 步: 补充表单 Actions (30 分钟)
✅ 创建 submit-contact.ts
✅ 创建 join-waitlist.ts
✅ 测试表单提交反馈
```

---

### 阶段 3: 全面测试 (1 小时)

```bash
# 测试所有页面路径
[ ] Marketing 页面 (21 个)
[ ] Protected 页面 (11 个)
[ ] Auth 页面 (5 个)
[ ] Docs 页面 (1 个)

# 检查清单:
✅ 页面可以访问 (200 状态码)
✅ 页面有内容显示 (不是空白页)
✅ Mock 数据正常加载
✅ 基础交互功能正常
✅ 移动端响应式正常
```

---

## 📊 **完成进度跟踪**

### 当前状态
```
总页面数: 39

✅ 完全可预览:     33/39  (84.6%)
⚠️ 需要改进:       4/39   (10.3%)
❌ 无法预览:       2/39   (5.1%)
```

### 修复后预期
```
总页面数: 39

✅ 完全可预览:     39/39  (100%)
⚠️ 需要改进:       0/39   (0%)
❌ 无法预览:       0/39   (0%)
```

---

## 🎯 **关键原则**

### 1. Mock 数据优先
```typescript
// ✅ 推荐: 使用 Mock 数据
const MOCK_DATA = generateMockData(100)

// ❌ 避免: 依赖数据库
const data = await db.query.table.findMany()
```

### 2. Client Component 处理交互
```typescript
// ✅ 推荐: Client Component + useState
'use client'
export function PageClient({ initialData }) {
  const [data, setData] = useState(initialData)
  const handleAction = () => { setData(...) }
  return <Component data={data} onAction={handleAction} />
}

// ❌ 避免: Server Component + 复杂 Action
export default async function Page() {
  const data = await complexAction()
  return <Component data={data} />
}
```

### 3. 简单 Server Action 可用
```typescript
// ✅ 可以使用: 简单的数据转换
'use server'
export async function formatData(input) {
  return { formatted: true, data: input }
}

// ❌ 避免: 复杂的数据库操作
'use server'
export async function complexDatabaseAction() {
  await db.transaction(...)
  await db.query(...)
}
```

### 4. 保持 UI 组件不变
```typescript
// ✅ 推荐: 保留现有 v0 组件
import { V0PptListTable } from './v0/v0-ppt-list-table'

// 只改变数据来源和交互逻辑
<V0PptListTable
  ppts={MOCK_DATA}  // ← Mock 数据
  onDelete={handleMockDelete}  // ← Mock 处理
/>
```

---

## 📝 **文件创建清单**

### 需要新建的文件 (5 个)

```bash
src/lib/mock-data/
├── ppts.ts           # ← PPT Mock 数据
└── users.ts          # ← 用户 Mock 数据

src/components/admin/
├── ppt/
│   └── ppts-page-client.tsx    # ← PPT 管理 Client
└── users/
    └── users-page-client.tsx   # ← 用户管理 Client

src/actions/marketing/
├── submit-contact.ts   # ← 联系表单 Action
└── join-waitlist.ts    # ← 等候列表 Action
```

### 需要修改的文件 (2 个)

```bash
src/app/[locale]/(protected)/admin/
├── ppts-v0/page.tsx    # ← 使用 Mock 数据
└── users-v0/page.tsx   # ← 使用 Mock 数据
```

---

## ✅ **验收标准**

### 页面可访问性
- [ ] 所有 39 个页面路径返回 200 状态码
- [ ] 没有 404 或 500 错误
- [ ] 没有空白页面

### 页面内容完整性
- [ ] 所有页面有标题和内容显示
- [ ] Mock 数据正常渲染
- [ ] Loading 状态正常
- [ ] Error 状态有友好提示

### 交互功能正常
- [ ] 表单可以提交 (有反馈)
- [ ] 按钮可以点击 (有响应)
- [ ] 列表可以筛选/排序
- [ ] 分页功能正常
- [ ] 弹窗可以打开/关闭

### 响应式布局
- [ ] 桌面端显示正常
- [ ] 移动端显示正常
- [ ] 平板端显示正常

---

## 💡 **建议的开始步骤**

### 立即开始 (推荐顺序)

```bash
# 1. 创建 Mock 数据文件 (15 分钟)
创建 src/lib/mock-data/ppts.ts
创建 src/lib/mock-data/users.ts

# 2. 创建第一个 Client Component (30 分钟)
创建 src/components/admin/ppt/ppts-page-client.tsx

# 3. 修改页面使用 Mock 数据 (15 分钟)
修改 src/app/[locale]/(protected)/admin/ppts-v0/page.tsx

# 4. 测试第一个页面 (15 分钟)
启动 pnpm dev
访问 http://localhost:3005/admin/ppts-v0
测试交互功能

# 5. 重复步骤 2-4 完成其他页面
```

---

## 📈 **预计完成时间**

```
阶段 1 (高优先级): 2-4 小时
  ├─ Mock 数据创建: 30 分钟
  ├─ Client Components: 1.5 小时
  ├─ 页面修改: 1 小时
  └─ 测试: 30 分钟

阶段 2 (中优先级): 1-2 小时
  ├─ AI 页面检查: 30 分钟
  ├─ 表单 Actions: 30 分钟
  └─ 测试: 30 分钟

阶段 3 (全面测试): 1 小时

总计: 4-7 小时 (半天到一天)
```

---

## 🎉 **总结**

### 当前优势
✅ 大部分页面 (84.6%) 已经可以预览
✅ UI 组件完整,设计优美
✅ Mock 数据模式清晰
✅ 不需要修改数据库

### 需要补充 (15.4%)
⚠️ 2 个 Admin 页面需要 Mock 数据
⚠️ 2 个 AI 页面需要检查
⚠️ 2 个表单需要简单 Action

### 下一步行动
1. ✅ 创建 Mock 数据文件
2. ✅ 创建 Client Components
3. ✅ 修改页面使用 Mock
4. ✅ 全面测试预览

---

**文档创建时间**: 2025-11-26
**预计完成时间**: 2025-11-26 (当天可完成)
**原则**: Mock 优先,交互完整,页面可预览

