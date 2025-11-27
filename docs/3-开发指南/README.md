# 开发指南

完整的开发教程和最佳实践，涵盖在 mk-saas-blog 中实现各类功能的步骤。

---

## 快速导航

本章包含 7 个详细指南，按推荐学习顺序排列：

```
0️⃣ 基础概念回顾
  ↓
1️⃣ Server Actions      ← 最常用，推荐首先掌握
  ↓
2️⃣ API Routes          ← 当需要公开 API 时
  ↓
3️⃣ 页面设计            ← 理解路由和布局
  ↓
4️⃣ 组件设计            ← 构建可重用 UI
  ↓
5️⃣ 自定义 Hooks       ← 提取可重用逻辑
  ↓
6️⃣ 表单处理            ← 复杂表单完整解决方案
```

---

## 学习路径推荐

### 🟢 新手开发者（0-1 个月）

```
周 1: 学习基础架构 (docs/1-架构与设计/)
周 2: 学习核心概念 (docs/2-核心概念/)
周 3-4: 学习本章 3.1-3.3 (Server Actions, API Routes, 页面)
```

**目标:** 能独立实现一个简单的用户功能（如用户资料编辑）

**关键步骤:**
1. 创建数据库表和 Schema
2. 编写 Server Action 处理逻辑
3. 创建页面和表单 UI
4. 验证和错误处理

---

### 🟡 中级开发者（1-3 个月）

```
从新手基础出发
+ 学习 3.4-3.5 (组件设计, 自定义 Hooks)
+ 学习 3.6 (表单处理)
```

**目标:** 能构建复杂功能（如支付流程、权限管理）

**关键技能:**
- 组件复合和状态管理
- 表单验证和错误处理
- 异步操作和数据同步

---

### 🔴 高级开发者（3+ 个月）

```
掌握所有基础指南
+ 参考源代码 (src/) 中的高级模式
+ 探索性能优化和扩展性设计
```

**目标:** 能设计和实现大型功能模块

**关键能力:**
- 架构决策和模式选择
- 性能优化和监控
- 团队协作和代码审查

---

## 各章详情

### 1️⃣ Server Actions 详解

**用途:** 服务器端业务逻辑，最常用的数据操作方式

**覆盖内容:**
- 定义和导入 Server Action
- 参数验证 (Zod Schema)
- 数据库操作 (CRUD)
- 权限检查和错误处理
- 返回值和错误消息
- 异步处理和超时
- 安全考虑 (CSRF, 输入验证)

**实战例子:**
- ✅ 创建用户账户
- ✅ 更新用户资料
- ✅ 删除用户数据
- ✅ 处理支付回调

**文件:** `Server Actions详解.md`

---

### 2️⃣ API Routes 详解

**用途:** 创建 RESTful API，用于第三方集成或移动应用

**覆盖内容:**
- 路由文件结构 (`route.ts`)
- GET 和 POST 处理
- 请求验证和响应格式
- 认证和权限管理
- 错误处理和状态码
- Webhook 实现
- 性能优化 (缓存, 速率限制)

**实战例子:**
- ✅ 获取用户列表 (公开 API)
- ✅ 创建订单 (认证 API)
- ✅ Webhook 回调 (Stripe)
- ✅ 文件上传端点

**文件:** `API Routes详解.md`

---

### 3️⃣ 页面设计指南

**用途:** 创建用户界面页面，理解 Next.js App Router

**覆盖内容:**
- 页面文件结构 (`page.tsx`)
- 动态路由 (`[id]`, `[...slug]`)
- 布局和嵌套 (`layout.tsx`)
- 元数据和 SEO (`generateMetadata`)
- 错误处理 (`error.tsx`, `not-found.tsx`)
- 国际化路由 (`[lang]/`)
- 页面加载状态和骨架屏

**实战例子:**
- ✅ 创建仪表板主页
- ✅ 创建动态博客页面 (`/blog/[slug]`)
- ✅ 创建管理员列表页面（分页）
- ✅ 创建国际化页面

**文件:** `页面设计指南.md`

---

### 4️⃣ 组件设计指南

**用途:** 创建可重用的 React 组件

**覆盖内容:**
- 展示组件 (Presentational)
- 容器组件 (Container)
- Server Component vs Client Component
- Props 和类型定义
- 组件复合和插槽 (Composition)
- 可访问性 (a11y)
- 性能优化 (React.memo, useMemo)
- Storybook 和组件文档

**实战例子:**
- ✅ 创建按钮组件（各种状态）
- ✅ 创建卡片组件（展示组件）
- ✅ 创建用户列表（容器组件）
- ✅ 创建数据表格（复杂复合）

**文件:** `组件设计指南.md`

---

### 5️⃣ 自定义 Hooks 指南

**用途:** 提取和重用组件逻辑

**覆盖内容:**
- Hook 规则和最佳实践
- 状态 Hook (useState)
- 副作用 Hook (useEffect)
- 自定义 Hook 设计
- useCallback 和 useRef
- Server Action 集成
- 错误处理和加载状态
- Hook 测试

**实战例子:**
- ✅ `useUser` - 获取当前用户信息
- ✅ `useForm` - 表单状态管理
- ✅ `useFetch` - 数据获取和缓存
- ✅ `useDebounce` - 防抖输入
- ✅ `useLocalStorage` - 本地存储

**文件:** `自定义Hooks.md`

---

### 6️⃣ 表单处理完全指南

**用途:** 复杂表单验证、提交和错误处理

**覆盖内容:**
- React Hook Form 基础
- Zod Schema 定义
- 字段注册和验证
- 嵌套对象和数组表单
- 条件字段和动态表单
- 异步验证 (自定义验证器)
- 错误消息和展示
- 文件上传和多部分表单
- 自动保存和草稿功能
- 性能优化 (debounce, lazy validation)

**实战例子:**
- ✅ 用户注册表单
- ✅ 用户资料编辑表单
- ✅ 支付信息表单
- ✅ 多步骤注册流程
- ✅ 文件上传表单

**文件:** `表单处理完全指南.md`

---

## 核心技术栈

| 技术 | 用途 | 链接 |
|------|------|------|
| **Next.js App Router** | 路由和页面 | [官方文档](https://nextjs.org/docs/app) |
| **React Server Components** | 服务器端渲染 | [RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md) |
| **Server Actions** | 服务器端函数 | [Next.js 文档](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions) |
| **Zod** | Schema 验证 | [官方文档](https://zod.dev) |
| **React Hook Form** | 表单管理 | [官方文档](https://react-hook-form.com) |
| **Drizzle ORM** | 数据库查询 | [官方文档](https://orm.drizzle.team) |
| **next-safe-action** | 类型安全的 Actions | [GitHub](https://github.com/TheEdoRan/next-safe-action) |

---

## 设计原则

### 1. 🏗️ 架构一致性

遵循五层架构：

```
UI Layer        (page.tsx, components/)
  ↓
Logic Layer     (Server Actions, Hooks)
  ↓
API Layer       (api/routes, 可选)
  ↓
Service Layer   (lib/, utilities)
  ↓
Database Layer  (Drizzle ORM)
```

每一层职责清晰，避免跨层访问。

---

### 2. 🔒 安全优先

- ✅ 在 Server Action 中进行权限检查
- ✅ 验证所有输入 (使用 Zod)
- ✅ 不要在客户端存储敏感信息
- ✅ 使用 HTTPS 和安全 Cookie
- ✅ 实施速率限制 (关键操作)

---

### 3. 📦 类型安全

- ✅ 所有函数都有类型签名
- ✅ 避免 `any` 类型
- ✅ 使用 `satisfies` 进行编译时检查
- ✅ 从数据库 Schema 推导类型

---

### 4. 🎨 用户体验

- ✅ 加载状态和骨架屏
- ✅ 清晰的错误消息
- ✅ 乐观更新 (UI 即时反馈)
- ✅ 可访问性 (WCAG 2.1)

---

### 5. 🔄 代码可维护性

- ✅ DRY (Don't Repeat Yourself)
- ✅ 单一职责原则
- ✅ 清晰的命名约定
- ✅ 注释说明复杂逻辑

---

## 常见开发任务

### 🟢 简单任务（< 30 分钟）

- 添加新的 UI 字段
- 修改样式
- 修复 bug
- 更新文本和标签

**推荐:** 只需修改相关组件或页面

---

### 🟡 中等任务（30 分钟 - 2 小时）

- 创建新页面
- 添加新的 Server Action
- 实现新的表单
- 修改数据库字段

**推荐:** 按顺序参考本章指南（页面 → 组件 → Actions）

---

### 🔴 复杂任务（2+ 小时）

- 新增整个功能模块
- 支付或认证集成
- 复杂的多步流程
- 性能优化

**推荐:**
1. 阅读相关的核心概念文档 (2-核心概念/)
2. 设计架构和数据模型
3. 按步骤实现，参考本章指南
4. 编写测试和文档

---

## 开发工作流

### 标准开发流程

```
1. 设计 (Design)
   ├─ 确定需求
   ├─ 设计数据模型
   └─ 设计 UI 草图

2. 实现数据层 (Database)
   ├─ 创建或修改 Schema
   ├─ 生成迁移文件
   └─ 应用迁移

3. 实现逻辑层 (Business Logic)
   ├─ 编写 Server Actions
   ├─ 编写验证逻辑
   └─ 编写测试

4. 实现 UI 层 (User Interface)
   ├─ 创建页面
   ├─ 创建组件
   └─ 集成 Server Actions

5. 测试和优化 (Testing)
   ├─ 手动测试功能
   ├─ 性能测试
   └─ 浏览器兼容性测试

6. 上线 (Deploy)
   ├─ 代码审查
   ├─ 部署到暂存环境
   └─ 部署到生产环境
```

---

## 快速参考

### 创建一个完整的用户功能

```
目标: 创建一个"修改用户名"功能

⏱️ 预计时间: 30 分钟

步骤:
1. 创建 Server Action: src/actions/user.ts
   - 参数: newName (字符串)
   - 验证: 长度 1-100 字符
   - 操作: 更新数据库
   - 权限: 检查用户身份

2. 创建表单组件: src/components/UserNameForm.tsx
   - 使用 React Hook Form
   - 集成 Server Action
   - 展示加载状态和错误

3. 在页面中使用: src/app/[lang]/settings/profile/page.tsx
   - 导入组件
   - 展示用户当前名字
   - 集成表单

4. 测试:
   - 修改名字 → 检查数据库
   - 输入无效 → 检查验证错误
   - 不登录 → 检查权限错误
```

---

## 常见问题

### Q: Server Action 和 API Route 如何选择?

**A:**
- **Server Action:** 90% 的情况 (内部业务逻辑)
  - 类型安全
  - 自动 CSRF 防护
  - 简单调用

- **API Route:** 10% 的情况 (第三方集成)
  - Webhook 回调
  - 移动应用 API
  - 公开 API

---

### Q: 何时应该创建自定义 Hook?

**A:** 当逻辑被复用 2+ 次时：
- 数据获取逻辑 → `useQuery`
- 表单状态 → `useForm`
- 本地状态 → `useLocalStorage`

避免过度抽象，简单逻辑可以内联。

---

### Q: 如何处理表单的异步验证?

**A:** 使用 Zod 的 `.refine()` 或 `.superRefine()`：

```typescript
const schema = z.object({
  email: z.string().email(),
}).refine(
  async (data) => {
    const exists = await checkEmailExists(data.email)
    return !exists // 返回 true 表示验证通过
  },
  {
    message: "邮箱已被使用",
    path: ["email"],
  }
)
```

---

### Q: 性能优化的首要任务是什么?

**A:** 按优先级：
1. **数据库查询优化** (最高ROI)
   - 添加索引
   - 避免 N+1 查询

2. **组件优化**
   - React.memo (避免不必要重渲染)
   - useMemo 缓存计算

3. **资源优化**
   - 图片懒加载
   - 代码分割
   - 字体优化

---

## 学习资源

### 官方文档
- [Next.js 官方文档](https://nextjs.org/docs)
- [React 官方文档](https://react.dev)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)

### 最佳实践
- [Web.dev by Google](https://web.dev)
- [Web Fundamentals](https://web.dev/learn/)

### 工具和库
- [Zod Documentation](https://zod.dev)
- [React Hook Form](https://react-hook-form.com)
- [Drizzle ORM](https://orm.drizzle.team)

---

## 总结

本章提供了在 mk-saas-blog 中开发各类功能的完整指南：

✅ **Server Actions** - 处理业务逻辑的标准方式
✅ **API Routes** - 构建第三方集成的接口
✅ **页面和组件** - 构建用户界面
✅ **Hooks** - 提取可重用逻辑
✅ **表单处理** - 复杂表单的完整解决方案

遵循这些指南和最佳实践，你将能够高效地实现各类功能。

---

**相关章节:**
- [1-架构与设计](../1-架构与设计/)
- [2-核心概念](../2-核心概念/)

**最后更新:** 2025-11-18
