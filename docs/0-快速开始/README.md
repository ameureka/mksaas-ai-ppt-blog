# 🚀 快速开始指南

欢迎来到 **mk-saas-blog** 项目！本指南将帮助你在 5-10 分钟内快速理解和开始开发。

---

## ⚡ 5 分钟快速认知

### 项目是什么？

**mk-saas-blog** 是一个完整的 **SaaS 模板**，包含：

```
完整的功能:
├─ 🔐 用户认证     (邮箱/OAuth)
├─ 💳 支付系统     (Stripe 集成)
├─ 💰 积分系统     (计费管理)
├─ 📚 博客系统     (MDX 内容)
├─ 👥 管理后台     (用户管理)
├─ 📊 仪表板       (数据展示)
├─ ⚙️  用户设置    (个人中心)
└─ 🌐 国际化       (多语言)

技术栈:
├─ Framework:      Next.js 15 + React 19
├─ Database:       PostgreSQL + Drizzle ORM
├─ Auth:          Better Auth
├─ Payment:       Stripe API
├─ Styling:       TailwindCSS + Radix UI
└─ Deployment:    Vercel Ready
```

### 核心概念

```
用户流程:
用户 → 注册/登录 → 仪表板 → 选择计划/购买 → 使用功能 → 消费积分

架构分层:
UI 层 (Pages & Components)
  ↓
Hook 层 (React Query + Zustand)
  ↓
Server Actions 层 (权限 + 业务逻辑)
  ↓
Service 层 (认证、支付、积分、邮件等)
  ↓
数据库层 (PostgreSQL + Drizzle ORM)
```

---

## 🎯 新开发者入门计划

### Step 1: 了解项目结构 (5 分钟)

**阅读文档**:
1. 本文件 (README.md) - 你正在阅读
2. [CHECKPOINT.md](../../CHECKPOINT.md) - 项目进度和计划
3. [docs/diagrams/README.md](../diagrams/README.md) - 所有图表导航

**查看项目目录**:
```bash
ls -la
# 关键目录:
# ├─ src/app/        - Next.js 路由和页面
# ├─ src/components/ - React 组件
# ├─ src/actions/    - Server Actions (API)
# ├─ src/lib/        - 工具函数和服务
# ├─ src/db/         - 数据库 Schema
# ├─ docs/diagrams/  - 系统图表集合
# └─ docs/0-快速开始/ - 你现在所在的位置
```

---

### Step 2: 理解关键概念 (10 分钟)

**必读的 3 个图表**:

1. **[整体五层架构](../diagrams/architecture/1-整体五层架构.md)** (5 分钟)
   - 了解系统如何分层
   - 数据怎样在各层流动
   - 关键的技术选择

2. **[用户认证与注册流程](../diagrams/flows/5-用户认证与注册流程.md)** (5 分钟)
   - 用户如何注册和登录
   - 邮件验证流程
   - OAuth 集成

3. **[支付、积分、权限流程](../diagrams/flows/7-8-9-支付积分权限流程.md)** (5 分钟)
   - 支付如何运作
   - 积分如何管理
   - 权限如何检查

**总时间**: ~15 分钟 (包括理解时间)

---

### Step 3: 本地开发环境 (15 分钟)

**环境要求**:
- Node.js 18+
- PostgreSQL 14+
- Git

**启动步骤**:

```bash
# 1. 克隆项目
git clone <repo-url>
cd mksaas-blog

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp env.example .env.local
# 编辑 .env.local，填入你的数据库和 API 密钥

# 4. 数据库设置
pnpm db:push

# 5. 启动开发服务器
pnpm dev

# 6. 打开浏览器
# http://localhost:3005
```

**常用命令**:
```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm db:studio    # 打开数据库管理界面
pnpm lint         # 检查代码质量
pnpm format       # 格式化代码
```

详见 [常用命令.md](./常用命令.md)

---

### Step 4: 浏览应用 (10 分钟)

**推荐的浏览顺序**:

1. **首页** (`http://localhost:3005`)
   - 看营销页面的设计
   - 查看价格表

2. **注册和登录** (`/auth/register` → `/auth/login`)
   - 测试用户认证
   - 看表单验证

3. **仪表板** (`/dashboard`)
   - 登录后看用户界面
   - 查看当前计划和积分

4. **设置页面** (`/settings/*`)
   - 个人资料、账单、积分、安全设置

5. **博客** (`/blog`)
   - 浏览博客文章
   - 查看 MDX 渲染

6. **管理员界面** (`/admin/users` - 需要管理员账户)
   - 用户管理表
   - 操作和过滤

---

## 🗺️ 快速导航

### 我想要...

| 需求 | 查看 |
|------|------|
| **了解系统架构** | [整体五层架构](../diagrams/architecture/1-整体五层架构.md) |
| **理解数据库设计** | [数据库关系图](../diagrams/architecture/2-数据库关系图.md) |
| **学习认证流程** | [认证与注册流程](../diagrams/flows/5-用户认证与注册流程.md) |
| **了解支付系统** | [支付、积分、权限流程](../diagrams/flows/7-8-9-支付积分权限流程.md) |
| **查看页面布局** | [页面布局文档](../diagrams/pages/) |
| **学习开发步骤** | [开发流程.md](./开发流程.md) |
| **查看常用命令** | [常用命令.md](./常用命令.md) |
| **回答常见问题** | [FAQ.md](./FAQ.md) |
| **查看所有图表** | [docs/diagrams/README.md](../diagrams/README.md) |

---

## 🎓 学习路径

### 新手 (0-1 周)

**目标**: 理解项目基础，可以运行项目

```
Day 1:
├─ 阅读本文档 (README.md)
├─ 阅读 3 个关键图表
├─ 启动本地开发环境
└─ 浏览应用界面

Day 2-3:
├─ 阅读 [开发流程.md](./开发流程.md)
├─ 尝试修改一个页面
├─ 修改一个组件样式
└─ 学习提交代码

Day 4-7:
├─ 深入阅读感兴趣的模块
├─ 理解 Server Actions
├─ 理解数据库查询
└─ 参考代码完成第一个小任务
```

### 中级 (1-4 周)

**目标**: 可以独立开发新功能

```
Week 1-2:
├─ 完整阅读所有图表
├─ 研究 Server Actions 的写法
├─ 研究组件的设计
└─ 理解权限检查机制

Week 3-4:
├─ 完成一个小功能 (如: 修改个人资料)
├─ 完成一个中等功能 (如: 添加新的积分交易类型)
└─ 理解整个支付流程
```

### 高级 (1-3 月)

**目标**: 可以独立设计和实现复杂功能

```
Month 1:
├─ 完整掌握所有核心模块
├─ 理解性能优化策略
└─ 理解安全最佳实践

Month 2-3:
├─ 参与架构设计决策
├─ 优化关键路径性能
└─ 指导其他开发者
```

---

## 📞 寻求帮助

### 问题排查流程

```
遇到问题:
  ├─ 查看 [FAQ.md](./FAQ.md)
  ├─ 搜索相关的图表和文档
  ├─ 查看项目的 issue
  └─ 询问团队成员

找不到答案:
  ├─ 创建一个详细的 Issue
  ├─ 包含错误信息和复现步骤
  ├─ 标注相关的标签
  └─ 等待反馈
```

### 常见问题快速查询

- ❓ 如何启动项目? → [常用命令.md](./常用命令.md)
- ❓ 如何添加新用户? → [FAQ.md](./FAQ.md) #用户认证
- ❓ 如何处理支付? → [FAQ.md](./FAQ.md) #支付系统
- ❓ 如何管理积分? → [FAQ.md](./FAQ.md) #积分系统
- ❓ 如何修改样式? → [开发流程.md](./开发流程.md) #修改样式

---

## 🚀 你的第一个任务

### 建议任务 1: 修改用户头像

**目标**: 学会基本的开发流程

**步骤**:
1. 打开 `src/components/settings/profile/update-avatar-card.tsx`
2. 修改头像显示样式 (大小或形状)
3. 在 `/settings/profile` 页面测试
4. 提交 PR

**预计时间**: 15 分钟

**学到的**:
- 如何找到相关文件
- 如何修改组件
- 如何本地测试
- 如何提交代码

---

### 建议任务 2: 添加新的页面

**目标**: 学会创建新页面

**步骤**:
1. 在 `src/app/[locale]/(marketing)/(pages)/` 创建新文件夹
2. 创建 `page.tsx` 文件
3. 添加基本的页面内容
4. 测试页面加载
5. 提交 PR

**预计时间**: 30 分钟

**学到的**:
- Next.js 路由结构
- 页面创建和组件组成
- 国际化路由

---

## 📋 核心文件速查

### 最常修改的文件

| 文件 | 用途 | 修改频率 |
|------|------|---------|
| `src/components/` | React 组件 | ⭐⭐⭐⭐⭐ |
| `src/app/` | 页面和路由 | ⭐⭐⭐⭐⭐ |
| `src/actions/` | Server Actions | ⭐⭐⭐⭐ |
| `src/db/schema.ts` | 数据库模式 | ⭐⭐⭐ |
| `src/lib/` | 工具函数 | ⭐⭐⭐ |
| `src/config/` | 配置文件 | ⭐⭐ |
| `src/styles/` | 全局样式 | ⭐ |

### 最常使用的库

| 库 | 用途 | 文档链接 |
|----|------|----------|
| Next.js | 框架 | [nextjs.org](https://nextjs.org) |
| React | UI 库 | [react.dev](https://react.dev) |
| Drizzle ORM | 数据库 | [orm.drizzle.team](https://orm.drizzle.team) |
| Stripe | 支付 | [stripe.com/docs](https://stripe.com/docs) |
| TailwindCSS | 样式 | [tailwindcss.com](https://tailwindcss.com) |
| Radix UI | 组件库 | [radix-ui.com](https://radix-ui.com) |

---

## ✨ 项目特色

### 为什么选择这个项目

```
优点:
✅ 完整的 SaaS 功能 - 无需从零开始
✅ 现代技术栈 - Next.js 15, React 19
✅ 清晰的代码结构 - 容易维护和扩展
✅ 详细的文档 - 快速学习和参考
✅ 生产就绪 - 可以直接部署
✅ 可扩展性 - 易于添加新功能

开发体验:
✅ TypeScript 类型安全
✅ 快速的热重载 (HMR)
✅ 清晰的错误提示
✅ 自动格式化 (Biome)
✅ 国际化支持
```

---

## 🎉 准备好了吗？

### 下一步

1. **环境设置** → 按照 Step 3 启动本地开发环境
2. **理解架构** → 阅读 3 个关键图表
3. **浏览应用** → 按照 Step 4 浏览应用
4. **读文档** → 查看 [开发流程.md](./开发流程.md)
5. **开始开发** → 尝试你的第一个任务

**预计总时间**: 1-2 小时

---

## 📚 继续学习

完成快速开始后，继续阅读：

- **[开发流程.md](./开发流程.md)** - 详细的开发步骤和最佳实践
- **[常用命令.md](./常用命令.md)** - 所有 pnpm 命令参考
- **[FAQ.md](./FAQ.md)** - 常见问题和解答
- **[docs/diagrams/README.md](../diagrams/README.md)** - 所有系统图表导航
- **[docs/1-架构与设计/](../1-架构与设计/)** - 深度架构文档

---

## 💡 提示

- 💬 有问题？查看 [FAQ.md](./FAQ.md)
- 🔍 找不到东西？使用 [docs/diagrams/README.md](../diagrams/README.md) 中的快速查询表
- 📖 想深入学习？阅读完整的图表文档
- 🚀 准备好开发？查看 [开发流程.md](./开发流程.md)

---

**祝你学习愉快！🎉**

如有任何问题或建议，欢迎反馈。

