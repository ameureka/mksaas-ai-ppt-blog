# 组件库文档

完整的可复用组件库，包括 UI 基础组件、功能组件和布局组件。

---

## 快速导航

```
UI 基础组件 (15+)         功能组件 (8+)           布局组件 (5+)
├─ Button                 ├─ UserCard            ├─ Header
├─ Input                  ├─ LoginForm           ├─ Sidebar
├─ Form                   ├─ SignUpForm          ├─ Footer
├─ Card                   ├─ PostList            ├─ Container
├─ Modal                  ├─ PaymentCard         ├─ Grid
├─ Select                 ├─ SubscriptionCard
├─ Checkbox               ├─ UploadZone
├─ Radio                  ├─ LoadingSpinner
├─ Textarea
├─ Badge
├─ Alert
├─ Tabs
├─ Pagination
├─ Dropdown
└─ Avatar
```

---

## UI 基础组件

### Button

```typescript
// src/components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Button({ variant = 'primary', size = 'md', ...props }: ButtonProps)
```

**用法:**
```typescript
<Button variant="primary" size="lg">提交</Button>
<Button variant="secondary" isLoading>加载中...</Button>
<Button variant="danger" onClick={handleDelete}>删除</Button>
```

**变体:**
- `primary` - 蓝色，主要操作
- `secondary` - 灰色，次要操作
- `danger` - 红色，危险操作
- `ghost` - 透明，链接风格

---

### Input

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
}

export function Input({ label, error, helperText, ...props }: InputProps)
```

**用法:**
```typescript
<Input
  label="邮箱"
  type="email"
  error={errors.email}
  helperText="我们不会分享你的邮箱"
/>
```

---

### Form

```typescript
interface FormProps {
  children: React.ReactNode
  onSubmit: (e: React.FormEvent) => void
  isSubmitting?: boolean
}

export function Form({ children, onSubmit, isSubmitting }: FormProps)
```

**用法:**
```typescript
<Form onSubmit={handleSubmit} isSubmitting={isSubmitting}>
  <Input name="email" />
  <Input name="password" type="password" />
  <Button type="submit">登录</Button>
</Form>
```

---

### Card

```typescript
interface CardProps {
  title?: string
  description?: string
  footer?: React.ReactNode
  hoverable?: boolean
  children: React.ReactNode
}

export function Card({ title, description, footer, children }: CardProps)
```

**用法:**
```typescript
<Card title="用户信息" hoverable>
  <p>邮箱: user@example.com</p>
</Card>
```

---

### Modal

```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  footer?: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps)
```

**用法:**
```typescript
const [isOpen, setIsOpen] = useState(false)

<button onClick={() => setIsOpen(true)}>打开</button>
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="确认">
  <p>确定要删除吗？</p>
  <Button onClick={() => setIsOpen(false)}>确认</Button>
</Modal>
```

---

### Select

```typescript
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
  error?: string
}

export function Select({ label, options, error, ...props }: SelectProps)
```

**用法:**
```typescript
<Select
  label="选择计划"
  options={[
    { value: 'free', label: '免费' },
    { value: 'pro', label: '专业版' }
  ]}
/>
```

---

### Badge

```typescript
interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger'
  children: React.ReactNode
}

export function Badge({ variant = 'primary', children }: BadgeProps)
```

**用法:**
```typescript
<Badge variant="success">已验证</Badge>
<Badge variant="danger">已过期</Badge>
```

---

### Alert

```typescript
interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  children: React.ReactNode
  onClose?: () => void
}

export function Alert({ type, title, children }: AlertProps)
```

**用法:**
```typescript
<Alert type="success" title="成功">
  操作已完成
</Alert>
```

---

### Tabs

```typescript
interface TabProps {
  tabs: { label: string; id: string; content: React.ReactNode }[]
  defaultTab?: string
  onChange?: (tabId: string) => void
}

export function Tabs({ tabs, defaultTab, onChange }: TabProps)
```

**用法:**
```typescript
<Tabs
  tabs={[
    { label: '个人', id: 'personal', content: <PersonalTab /> },
    { label: '设置', id: 'settings', content: <SettingsTab /> }
  ]}
/>
```

---

### Pagination

```typescript
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps)
```

**用法:**
```typescript
<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
/>
```

---

## 功能组件

### UserCard

```typescript
interface UserCardProps {
  user: User
  variant?: 'compact' | 'full'
  onClick?: () => void
}

export function UserCard({ user, variant = 'full' }: UserCardProps)
```

**展示:**
```
┌─────────────────────┐
│  👤 John Doe        │
│  john@example.com   │
│  Pro 用户 • 100 积分 │
└─────────────────────┘
```

---

### LoginForm

```typescript
interface LoginFormProps {
  onSuccess?: (user: User) => void
  redirectTo?: string
}

export function LoginForm({ onSuccess }: LoginFormProps)
```

**特性:**
- ✅ 邮箱和密码验证
- ✅ 记住我功能
- ✅ 忘记密码链接
- ✅ 加载状态

---

### SignUpForm

```typescript
interface SignUpFormProps {
  onSuccess?: (user: User) => void
}

export function SignUpForm({ onSuccess }: SignUpFormProps)
```

**特性:**
- ✅ 邮箱验证（不能已注册）
- ✅ 密码强度提示
- ✅ 同意条款检查
- ✅ 邮件验证链接

---

### PostList

```typescript
interface PostListProps {
  posts: Post[]
  loading?: boolean
  onLoadMore?: () => void
  variant?: 'list' | 'grid'
}

export function PostList({ posts, loading, variant = 'list' }: PostListProps)
```

**支持:**
- ✅ 列表和网格视图
- ✅ 加载骨架屏
- ✅ 加载更多
- ✅ 过滤和排序

---

### PaymentCard

```typescript
interface PaymentCardProps {
  plan: 'pro-monthly' | 'pro-yearly' | 'lifetime'
  isSelected?: boolean
  onSelect?: () => void
}

export function PaymentCard({ plan, isSelected }: PaymentCardProps)
```

**展示:**
```
┌──────────────────────┐
│ Pro 年度版           │
│ $79.99 / 年          │
│ 节省 20%             │
│ [选择计划]           │
└──────────────────────┘
```

---

### SubscriptionCard

```typescript
interface SubscriptionCardProps {
  subscription?: Payment
  onUpgrade?: () => void
  onCancel?: () => void
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps)
```

**展示:**
- 当前计划
- 下次计费日期
- 管理选项

---

### UploadZone

```typescript
interface UploadZoneProps {
  onUpload: (files: File[]) => Promise<void>
  accept?: string
  maxSize?: number
  loading?: boolean
}

export function UploadZone({ onUpload, maxSize = 5242880 }: UploadZoneProps)
```

**特性:**
- ✅ 拖放上传
- ✅ 点击选择
- ✅ 文件验证
- ✅ 进度显示

---

### LoadingSpinner

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary'
  fullScreen?: boolean
}

export function LoadingSpinner({ size = 'md', fullScreen }: LoadingSpinnerProps)
```

**用法:**
```typescript
{isLoading && <LoadingSpinner />}
{isLoading && <LoadingSpinner fullScreen />}
```

---

## 布局组件

### Header

```typescript
interface HeaderProps {
  variant?: 'light' | 'dark'
  sticky?: boolean
}

export function Header({ variant = 'light', sticky }: HeaderProps)
```

**包含:**
- Logo
- 导航菜单
- 用户菜单
- 语言切换

---

### Sidebar

```typescript
interface SidebarProps {
  items: SidebarItem[]
  activeId?: string
  onSelect?: (id: string) => void
}

export function Sidebar({ items, activeId }: SidebarProps)
```

**示例:**
```typescript
const items = [
  { id: 'dashboard', label: '仪表板', icon: '📊' },
  { id: 'posts', label: '文章', icon: '📝' },
  { id: 'settings', label: '设置', icon: '⚙️' }
]

<Sidebar items={items} activeId={activeId} />
```

---

### Footer

```typescript
interface FooterProps {
  variant?: 'light' | 'dark'
}

export function Footer({ variant = 'light' }: FooterProps)
```

**包含:**
- 版权信息
- 相关链接
- 社交媒体
- 联系方式

---

### Container

```typescript
interface ContainerProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Container({ maxWidth = 'lg', children }: ContainerProps)
```

**用法:**
```typescript
<Container maxWidth="lg">
  <h1>标题</h1>
  <p>内容</p>
</Container>
```

---

### Grid

```typescript
interface GridProps {
  columns?: 1 | 2 | 3 | 4 | 6
  gap?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Grid({ columns = 3, gap = 'md', children }: GridProps)
```

**用法:**
```typescript
<Grid columns={3} gap="lg">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
  <Card>Card 3</Card>
</Grid>
```

---

## 导入方式

### 从 UI 文件夹导入

```typescript
// 推荐: 从 ui 文件夹导入
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
```

### 从功能文件夹导入

```typescript
// 导入功能组件
import { UserCard } from '@/components/features/user/UserCard'
import { LoginForm } from '@/components/features/auth/LoginForm'
import { PostList } from '@/components/features/post/PostList'
```

### 批量导入

```typescript
// 创建 index.ts 便于批量导入
export * from './Button'
export * from './Input'
export * from './Card'

// 使用
import { Button, Input, Card } from '@/components/ui'
```

---

## 组件最佳实践

### ✅ Do's

- 使用 TypeScript 定义 Props
- 提供 variant 和 size 选项
- 支持 HTML attributes 传递
- 编写清晰的错误消息
- 使用 displayName 便于调试

### ❌ Don'ts

- 不要创建过于复杂的组件
- 不要硬编码样式值
- 不要忽视无障碍属性
- 不要忘记 PropTypes 或 TypeScript

---

## Storybook 集成

```bash
# 安装 Storybook
pnpm add -D @storybook/react @storybook/addon-essentials

# 创建故事文件
src/components/ui/Button.stories.tsx
```

```typescript
import { Button } from './Button'
import type { Meta, StoryObj } from '@storybook/react'

const meta = {
  component: Button,
  tags: ['autodocs'],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
  },
}

export const Secondary: Story = {
  args: {
    children: 'Button',
    variant: 'secondary',
  },
}
```

---

## 总结

✅ **15+ UI 基础组件** - 快速构建 UI
✅ **8+ 功能组件** - 复杂业务逻辑
✅ **5+ 布局组件** - 页面结构
✅ **完整的文档** - 每个组件都有用法示例
✅ **类型安全** - 所有组件都是 TypeScript

---

**相关文档:**
- [03-guides/组件设计指南](../03-guides/组件设计指南.md)

**最后更新:** 2025-11-18
