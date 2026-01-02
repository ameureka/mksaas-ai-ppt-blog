# ❓ 常见问题速查表 (FAQ)

最常见的开发问题和快速解决方案。

---

## 🔐 认证相关

### Q1: 如何添加新的 OAuth 提供商?

**场景**: 需要支持 Discord 或 Microsoft 登录

**解决方案**:
1. 在 `src/lib/auth.ts` 中注册新提供商:
```typescript
providers: [
  googleProvider(),
  githubProvider(),
  // 添加新提供商
  microsoftEntraIdProvider(),
]
```

2. 配置环境变量:
```bash
# .env.local
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
```

3. 在登录页面添加按钮 (如需要)

**更多信息**: 查看 [认证与注册流程](../01-architecture/01-architecture/diagrams/flows/5-用户认证与注册流程.md)

---

### Q2: 用户登录后页面没有刷新？

**症状**: 登录完成但首页仍显示"未登录"

**原因**: Session 状态未同步或缓存问题

**解决方案**:
1. 清除浏览器缓存: `Ctrl+Shift+Delete` (或 Cmd+Shift+Delete)
2. 检查 `.env.local` 中的 `BETTER_AUTH_SECRET`
3. 确保 `BETTER_AUTH_URL` 正确设置:
```bash
BETTER_AUTH_URL=http://localhost:3005
```

4. 重启开发服务器: `pnpm dev`

---

### Q3: 邮件验证链接过期了怎么办？

**场景**: 用户收到验证邮件，但链接在 1 小时后失效

**解决方案**:
- 用户可以在登录页面点击"重新发送验证邮件"
- 如果没有该选项，可以直接使用密码登录（假设邮箱已验证过）

**配置方式** (在 `src/lib/auth.ts`):
```typescript
// 调整邮件验证链接过期时间
emailAndPassword: {
  enabled: true,
  // autoSignInAfterVerification: true,
  sendVerificationEmail: true,
}
```

---

## 💰 支付相关

### Q4: 测试支付流程，用什么信用卡？

**场景**: 需要在本地测试 Stripe 支付

**解决方案**:

使用 Stripe 官方测试卡号:
| 卡号 | 情况 | 有效期 | CVV |
|------|------|--------|-----|
| `4242 4242 4242 4242` | 支付成功 | 任意未来日期 | 任意 3 位 |
| `4000 0000 0000 0002` | 支付失败 | 任意未来日期 | 任意 3 位 |
| `5555 5555 5555 4444` | Mastercard | 任意未来日期 | 任意 3 位 |

**步骤**:
1. 访问 http://localhost:3005/pricing
2. 选择付款计划，点击"升级"
3. 进入 Stripe Checkout，输入测试卡号
4. 完成付款

**检查结果**:
- 数据库 `payment` 表中应出现新记录
- 用户账户应更新为 "Pro" 或 "Lifetime"
- 如无反应，检查 Webhook 日志

**更多信息**: 查看 [支付、积分、权限流程](../01-architecture/01-architecture/diagrams/flows/7-8-9-支付积分权限流程.md)

---

### Q5: Webhook 收不到 Stripe 事件？

**症状**: 支付完成后，用户订阅状态未更新

**原因**: Stripe Webhook 未正确配置或 Endpoint 不可访问

**解决方案**:

**本地开发**:
1. 使用 Stripe CLI:
```bash
# 安装 Stripe CLI (如未安装)
brew install stripe/stripe-cli/stripe

# 登录 Stripe 账户
stripe login

# 转发 Webhook 事件到本地
stripe listen --forward-to localhost:3005/api/webhooks/stripe

# 获取 Webhook 密钥
# 复制到 .env.local: STRIPE_WEBHOOK_SECRET=whsec_...
```

2. 测试支付后，应在终端看到:
```
2024-11-18 10:30:45   --> charge.succeeded [evt_xxxx]
2024-11-18 10:30:50   <-- [200] POST /api/webhooks/stripe
```

**生产环境**:
1. 访问 Stripe Dashboard → Webhooks
2. 添加 Endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. 选择事件: `checkout.session.completed`, `invoice.payment_succeeded`
4. 复制 Webhook 密钥到生产 `.env`

**检查代码**: `src/app/api/webhooks/stripe/route.ts`

---

### Q6: 升级后没有立即生效？

**症状**: 用户升级到 Pro，但功能仍未解锁

**原因**: 权限检查缓存或数据库未同步

**解决方案**:
1. 打开 Drizzle Studio 检查数据:
```bash
pnpm db:studio
# 查看 user 表中的 tier 字段
```

2. 如数据正确，清除客户端缓存:
   - 打开浏览器开发者工具: F12
   - 应用标签 → 清除所有数据
   - 刷新页面

3. 如仍未生效，检查权限检查代码:
```typescript
// 在 src/actions/ 中搜索 tier 检查
if (user.tier !== 'pro') {
  throw new Error('需要 Pro 订阅')
}
```

---

## 🎁 积分相关

### Q7: 如何手动为用户增加积分?

**场景**: 赠送积分或作为奖励

**解决方案**:

**通过数据库** (开发用):
```bash
pnpm db:studio
# 打开 userCredit 表，编辑用户的 balance 字段
# 或在 creditTransaction 表添加记录
```

**通过代码** (生产推荐):

创建 Server Action (在 `src/actions/credits.ts`):
```typescript
import { db } from '@/db'
import { userCredit, creditTransaction } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function addCreditToUser(userId: string, amount: number) {
  // 更新用户积分
  await db
    .update(userCredit)
    .set({ balance: db.raw(`balance + ${amount}`) })
    .where(eq(userCredit.userId, userId))

  // 记录交易
  await db.insert(creditTransaction).values({
    userId,
    amount,
    type: 'admin_grant',
    reason: '管理员赠送',
  })
}
```

---

### Q8: 积分过期如何处理?

**场景**: 积分有有效期限制

**解决方案**:

当前项目未实现积分过期机制。如需添加:

1. 在 `src/db/schema.ts` 添加字段:
```typescript
export const userCredit = pgTable('user_credit', {
  // ... 现有字段
  expiresAt: timestamp('expires_at'),
})
```

2. 生成迁移:
```bash
pnpm db:generate
pnpm db:migrate
```

3. 在检查积分时验证:
```typescript
// 在 src/lib/credits.ts 添加
export function isExpired(expiresAt: Date) {
  return new Date() > expiresAt
}
```

**更多信息**: 查看 [支付、积分、权限流程](../01-architecture/01-architecture/diagrams/flows/7-8-9-支付积分权限流程.md)

---

## 💾 数据库相关

### Q9: 如何添加新数据表?

**场景**: 需要为新功能创建数据表

**解决方案**:

**步骤 1**: 定义 Schema (在 `src/db/schema.ts`):
```typescript
export const myNewTable = pgTable('my_new_table', {
  id: text('id').primaryKey().default(sql`uuid_generate_v4()`),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})
```

**步骤 2**: 生成迁移文件:
```bash
pnpm db:generate
```

**步骤 3**: 检查生成的迁移文件 (`drizzle/xxxx_create_my_new_table.sql`)

**步骤 4**: 应用迁移:
```bash
pnpm db:migrate
```

**步骤 5**: 验证表创建成功:
```bash
pnpm db:studio
```

**注意**: 不要手动修改 SQL 迁移文件，始终从 Schema 生成

---

### Q10: 本地数据库无法连接？

**症状**: 错误 `Error: connect ECONNREFUSED 127.0.0.1:5432`

**解决方案**:

**检查 PostgreSQL 是否运行**:
```bash
# macOS (Homebrew)
brew services start postgresql

# Linux (systemd)
sudo systemctl start postgresql

# Docker
docker run -d \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:latest
```

**检查 DATABASE_URL**:
```bash
# .env.local 应该类似
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mksaas_blog"
```

**创建数据库** (如不存在):
```bash
# psql -U postgres
# CREATE DATABASE mksaas_blog;
```

**重试连接**:
```bash
pnpm db:studio
# 或
pnpm db:migrate
```

---

## 🚀 开发流程相关

### Q11: 如何快速修改和测试样式?

**场景**: TailwindCSS 样式不生效

**解决方案**:

1. **确保 dev 服务器运行**:
```bash
pnpm dev
```

2. **检查 Tailwind 配置** (`tailwind.config.ts`):
```typescript
content: [
  './src/**/*.{js,ts,jsx,tsx}',  // 确保包含所有文件
  './content/**/*.{md,mdx}',
],
```

3. **清除缓存并重启**:
```bash
rm -rf .next      # 删除 .next 缓存
pnpm dev          # 重启开发服务器
```

4. **使用 DevTools 检查**:
   - F12 打开开发者工具
   - 右键选择元素，检查是否应用了 Tailwind 类
   - 在 Elements 标签页查看 computed styles

---

### Q12: TypeScript 错误 "类型不匹配"?

**症状**: 编译时出现类型错误，但代码逻辑正确

**常见原因和解决**:

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| `Cannot find module '@/*'` | 路径别名未配置 | 检查 `tsconfig.json` |
| `Property 'xxx' does not exist on type` | 类型定义缺失 | 导入正确的类型定义或添加 `@ts-ignore` |
| `Object is possibly 'null'` | 未检查 null | 添加 null 检查: `if (obj) { ... }` |
| `Type 'X' is not assignable to type 'Y'` | 类型不兼容 | 使用 `as` 类型转换或修改代码 |

**快速修复**:
```bash
pnpm lint         # 检查并自动修复代码
pnpm format       # 格式化代码
```

---

### Q13: 提交代码前需要做什么检查?

**检查清单**:

```bash
# 1. 运行 lint 和 format
pnpm lint
pnpm format

# 2. 生成最新的 MDX 内容类型
pnpm content

# 3. 验证数据库迁移已应用
pnpm db:migrate

# 4. 本地构建测试
pnpm build

# 5. 检查 git 状态
git status

# 6. 提交代码
git add .
git commit -m "feat: add new feature"

# 7. 推送到远程
git push origin <branch-name>
```

**如果构建失败**: 查看 [常见问题速查](常用命令.md#-常见问题速查)

---

## 📝 内容和博客相关

### Q14: 如何创建新的博客文章?

**步骤**:

1. **创建 MDX 文件**:
```bash
# 文件名会自动成为 URL slug
touch content/blog/my-first-post.mdx
```

2. **添加 Front Matter** (在文件顶部):
```yaml
---
title: "我的第一篇博客"
description: "文章描述，用于预览"
date: 2024-11-18
author: "Your Name"
image: "/images/blog/cover.jpg"
tags: ["tech", "guide"]
published: true
---
```

3. **编写内容** (MDX 格式):
```markdown
# 简介

这是文章的开头...

## 第一部分

更多内容...

## 代码示例

\`\`\`typescript
const hello = () => {
  console.log('Hello, World!')
}
\`\`\`
```

4. **重新生成内容类型**:
```bash
pnpm content
```

5. **访问文章**:
```
http://localhost:3005/blog/my-first-post
```

**更多信息**: 查看 [博客列表与文章详情页布局](../01-architecture/01-architecture/diagrams/pages/15-博客列表与文章详情页布局.md)

---

### Q15: 博客文章不显示在列表中?

**症状**: 已创建 MDX 文件，但列表页面没有显示

**原因和解决**:

| 原因 | 检查方法 | 解决方案 |
|------|---------|---------|
| Front Matter 缺失 | 检查文件顶部 | 添加完整的 Front Matter |
| `published: false` | 检查 `published` 字段 | 改为 `published: true` |
| MDX 内容未重新生成 | 查看错误信息 | 运行 `pnpm content` |
| 缓存问题 | 刷新页面 | 清除 `.next` 目录: `rm -rf .next` |

**快速修复**:
```bash
# 检查文件是否有效
pnpm content

# 重启开发服务器
pnpm dev
```

---

## 🔧 部署相关

### Q16: 如何在生产环境配置环境变量?

**步骤**:

1. **复制 `.env.example` 作为参考**:
```bash
cat env.example
```

2. **配置以下必要变量**:

```bash
# 数据库
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# 认证
BETTER_AUTH_SECRET="生成随机密钥"
BETTER_AUTH_URL="https://yourdomain.com"

# OAuth (Google)
AUTH_GOOGLE_ID="xxx.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="xxx"

# OAuth (GitHub)
AUTH_GITHUB_ID="xxx"
AUTH_GITHUB_SECRET="xxx"

# Stripe
STRIPE_SECRET_KEY="sk_live_xxx"
STRIPE_PUBLISHABLE_KEY="pk_live_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"

# 邮件 (Resend)
RESEND_API_KEY="re_xxx"

# AWS S3 (可选)
AWS_ACCESS_KEY_ID="xxx"
AWS_SECRET_ACCESS_KEY="xxx"
AWS_S3_BUCKET="xxx"
```

3. **验证配置**:
```bash
# 本地测试生产构建
pnpm build
pnpm start
```

---

### Q17: 生产环境性能优化有哪些建议?

**检查清单**:

```bash
# 1. 优化图片
# - 使用 Next.js Image 组件
# - 确保提供了 width/height
# - 使用 WebP 格式

# 2. 代码分割
# - 使用 dynamic() 导入重量级组件
# - 检查 bundle 大小
pnpm build  # 查看输出中的大小信息

# 3. 数据库优化
# - 在常用查询字段添加索引
# - 使用连接池 (推荐 PgBouncer)

# 4. 缓存策略
# - 配置 ISR (Incremental Static Regeneration)
# - 使用 Redis 缓存热数据

# 5. 监控和日志
# - 配置应用监控 (Sentry, DataDog 等)
# - 设置日志聚合
```

---

## 🐛 故障排除流程图

```
遇到问题
  │
  ├─→ 检查控制台错误信息
  │     ├─→ "Cannot find module" → 检查导入路径或安装依赖
  │     ├─→ "Connection refused" → 检查数据库连接
  │     └─→ "Type error" → 检查 TypeScript 定义
  │
  ├─→ 清除缓存和临时文件
  │     └─→ rm -rf .next && pnpm dev
  │
  ├─→ 检查 .env.local 配置
  │     └─→ 确保所有必要变量已设置
  │
  ├─→ 查看相关文档
  │     └─→ 本 FAQ 或详细文档
  │
  └─→ 仍未解决？
        └─→ 查看项目的 GitHub Issues 或日志
```

---

## 📚 快速链接

| 需求 | 文档 | 耗时 |
|------|------|------|
| 了解整体架构 | [整体五层架构](../01-architecture/01-architecture/diagrams/architecture/1-整体五层架构.md) | 15 分钟 |
| 理解认证流程 | [用户认证与注册流程](../01-architecture/01-architecture/diagrams/flows/5-用户认证与注册流程.md) | 20 分钟 |
| 理解支付流程 | [支付、积分、权限流程](../01-architecture/01-architecture/diagrams/flows/7-8-9-支付积分权限流程.md) | 25 分钟 |
| 查看数据库设计 | [数据库关系图](../01-architecture/01-architecture/diagrams/architecture/2-数据库关系图.md) | 20 分钟 |
| 学习开发流程 | [开发流程](./开发流程.md) | 15 分钟 |
| 查找命令 | [常用命令](./常用命令.md) | 5 分钟 |

---

## 💡 最后的建议

1. **遇到问题先读文档** - 节省时间
2. **使用 Drizzle Studio** - 可视化检查数据库
3. **定期运行 lint** - 保持代码质量
4. **提交前构建测试** - 避免部署失败
5. **查看错误堆栈** - 不要只看标题，看完整错误信息

---

**最后更新**: 2025-11-18
**反馈**: 有新问题？提交 GitHub Issue 或补充这个 FAQ
