# MkSaaS 快速参考指南

## 项目概览

**MkSaaS** 是一个完整的 SaaS 平台示例，包含：
- 博客内容管理系统
- AI 功能集成（图像、文本、聊天）
- 用户认证和权限管理
- 支付和学分系统
- 多语言支持

---

## 核心代码位置速查表

### 1. 博客系统

| 功能 | 文件位置 | 说明 |
|-----|--------|------|
| 内容源加载 | `src/lib/source.ts` | Fumadocs 配置，定义所有内容加载器 |
| 博客首页 | `src/app/[locale]/(marketing)/blog/(blog)/page.tsx` | 博客列表，支持分页 |
| 博客详情 | `src/app/[locale]/(marketing)/blog/[...slug]/page.tsx` | 单篇文章，含高级保护 |
| 博客卡片 | `src/components/blog/blog-card.tsx` | 博客卡片组件 |
| 博客网格 | `src/components/blog/blog-grid.tsx` | 响应式网格布局 |
| MDX 内容 | `content/blog/*.mdx` | 博客文章（支持双语） |
| 作者定义 | `content/author/*.mdx` | 作者信息 |
| 分类定义 | `content/category/*.mdx` | 博客分类 |

**关键函数：**
- `blogSource.getPages(locale)` - 获取本地化文章
- `authorSource.getPage([author], locale)` - 获取作者信息
- `categorySource.getPages(locale)` - 获取分类

### 2. 文档系统

| 功能 | 文件位置 | 说明 |
|-----|--------|------|
| 文档路由 | `src/app/[locale]/docs/` | 文档首页和内容页面 |
| i18n 配置 | `src/lib/docs/i18n.ts` | Fumadocs 国际化配置 |
| MDX 内容 | `content/docs/**/*.mdx` | 文档内容文件 |

**关键配置：**
```typescript
source.getPages(locale)      // 获取本地化文档
source.getPage(slug, locale) // 获取单页文档
```

### 3. AI 功能模块

#### 3.1 图像生成

| 功能 | 文件位置 | 说明 |
|-----|--------|------|
| 提供商配置 | `src/ai/image/lib/provider-config.ts` | 所有 AI 提供商的配置 |
| 图像类型 | `src/ai/image/lib/image-types.ts` | TypeScript 类型定义 |
| 生成 Hook | `src/ai/image/hooks/use-image-generation.ts` | React Hook 用于状态管理 |
| API 路由 | `src/app/api/generate-images/route.ts` | 图像生成的 API |
| 主组件 | `src/ai/image/components/ImagePlayground.tsx` | 图像生成主界面 |

**支持的提供商：**
- Replicate (13 个模型)
- OpenAI (DALL-E 2/3)
- Fireworks (7 个模型)
- FAL AI (9 个模型)

**使用示例：**
```typescript
// 在组件中使用
const { images, errors, startGeneration, isLoading } = useImageGeneration();

await startGeneration(prompt, ['replicate', 'openai'], {
  replicate: 'black-forest-labs/flux-1.1-pro',
  openai: 'dall-e-3'
});
```

#### 3.2 文本分析

| 功能 | 文件位置 | 说明 |
|-----|--------|------|
| 类型定义 | `src/ai/text/utils/web-content-analyzer.ts` | 类型和 Zod schemas |
| 组件 | `src/ai/text/components/web-content-analyzer.tsx` | 文本分析主组件 |
| 配置 | `src/ai/text/utils/web-content-analyzer-config.ts` | 配置文件 |

**支持的提供商：**
- OpenAI
- Google Gemini
- DeepSeek
- OpenRouter

#### 3.3 聊天

| 功能 | 文件位置 | 说明 |
|-----|--------|------|
| API 路由 | `src/app/api/chat/route.ts` | 聊天 API 端点 |
| 聊天组件 | `src/ai/chat/components/ChatBot.tsx` | 聊天界面 |

**特性：**
- 支持多个 LLM 模型
- 可选网络搜索（Perplexity）
- 流式响应

### 4. 学分系统

| 功能 | 文件位置 | 说明 |
|-----|--------|------|
| 核心逻辑 | `src/credits/credits.ts` | 所有学分操作函数 |
| 类型定义 | `src/credits/types.ts` | 学分类型和枚举 |
| 分发逻辑 | `src/credits/distribute.ts` | 自动分发逻辑 |

**核心函数：**
```typescript
getUserCredits(userId)                  // 获取余额
addCredits({userId, amount, type, ...}) // 添加学分
consumeCredits({userId, amount, ...})  // 消耗学分
hasEnoughCredits({userId, requiredCredits})  // 检查余额
```

**学分类型：**
```typescript
REGISTER_GIFT           // 注册赠送
MONTHLY_REFRESH         // 月度刷新（免费计划）
SUBSCRIPTION_RENEWAL    // 订阅续期（Pro计划）
LIFETIME_MONTHLY        // 终身月度
USAGE                   // 使用消耗
EXPIRE                  // 过期
```

### 5. 支付系统

| 功能 | 文件位置 | 说明 |
|-----|--------|------|
| 支付逻辑 | `src/payment/index.ts` | 支付提供商初始化 |
| Stripe 集成 | `src/payment/provider/stripe.ts` | Stripe 具体实现 |
| 类型定义 | `src/payment/types.ts` | 支付相关类型 |

**支付流程：**
1. 用户选择套餐
2. 创建 Stripe Checkout Session
3. 用户完成支付
4. Webhook 验证并更新数据库
5. 分配学分/权限

### 6. 认证系统

| 功能 | 文件位置 | 说明 |
|-----|--------|------|
| 认证配置 | `src/lib/auth.ts` | Better Auth 配置 |
| 客户端认证 | `src/lib/auth-client.ts` | 客户端认证客户端 |
| 会话获取 | `src/lib/server.ts` | 服务器端获取会话 |
| Hook | `src/hooks/use-session.ts` | React Hook 获取会话 |

**使用示例：**
```typescript
// 服务端
const session = await getSession();
const userId = session?.user?.id;

// 客户端
const { data: session } = useSession();
```

### 7. 国际化

| 功能 | 文件位置 | 说明 |
|-----|--------|------|
| 路由配置 | `src/i18n/routing.ts` | 支持的语言配置 |
| 翻译文件 | `messages/en.json` | 英文翻译 |
| | `messages/zh.json` | 中文翻译 |

**支持的语言：**
- `en` - 英文（默认）
- `zh` - 中文

---

## 数据库模型

### 关键表

```sql
-- 用户表
user (id, name, email, emailVerified, image, role, customerId, ...)

-- 支付表
payment (id, userId, priceId, type, status, paid, subscriptionId, ...)

-- 用户学分
user_credit (id, userId, currentCredits, createdAt, updatedAt)

-- 学分交易记录
credit_transaction (id, userId, type, amount, remainingAmount, expirationDate, ...)

-- 会话表（Better Auth）
session (id, userId, token, expiresAt, ...)

-- 第三方账号（Better Auth）
account (id, userId, providerId, accessToken, ...)

-- 验证令牌（Better Auth）
verification (id, identifier, value, expiresAt, ...)
```

---

## 常见操作

### 添加博客文章

1. **创建 MDX 文件**
```
content/blog/my-article.mdx
content/blog/my-article.zh.mdx
```

2. **添加 Front Matter**
```yaml
---
title: "My Article"
description: "Article description"
date: "2025-08-30"
published: true
premium: false
categories: ["product"]
author: "mksaas"
image: "/images/blog/my-article.png"
---

Content goes here...
```

3. **重新生成内容**
```bash
pnpm content
```

### 添加用户学分

```typescript
import { addCredits } from '@/credits/credits';

await addCredits({
  userId: 'user-id',
  amount: 100,
  type: 'REGISTER_GIFT',
  description: 'Registration bonus',
  expireDays: 30  // optional
});
```

### 创建支付

```typescript
import { payment } from '@/payment';

const session = await payment.createCheckoutSession({
  userId: 'user-id',
  priceId: 'stripe-price-id'
});
```

### 消耗学分

```typescript
import { consumeCredits } from '@/credits/credits';

await consumeCredits({
  userId: 'user-id',
  amount: 10,
  description: 'Image generation'
});
```

### 检查高级访问

```typescript
import { checkPremiumAccess } from '@/lib/premium-access';

const hasPremium = await checkPremiumAccess(userId);
```

---

## 路由速查表

### 博客路由

```
/blog                           博客首页
/blog/page/2                    第 2 页
/blog/category/ai               AI 分类
/blog/category/ai/page/2        AI 分类第 2 页
/blog/my-article-slug           文章详情
```

### 文档路由

```
/docs                           文档首页
/docs/getting-started           文档页面
/docs/installation              另一个页面
```

### 语言路由

```
/blog                           英文博客
/zh/blog                        中文博客
/docs                           英文文档
/zh/docs                        中文文档
```

### API 路由

```
POST /api/generate-images       生成图像
POST /api/chat                  聊天
POST /api/upload                文件上传
POST /api/payment/create-checkout      创建支付
POST /api/webhook/stripe               Stripe Webhook
```

---

## 配置文件位置

| 配置 | 文件 | 说明 |
|-----|------|------|
| 网站配置 | `src/config/website.tsx` | 网站全局配置 |
| TypeScript | `tsconfig.json` | TS 配置（有路径别名） |
| Drizzle | `drizzle.config.ts` | 数据库配置 |
| Biome | `biome.json` | 代码格式化配置 |
| 环境变量 | `.env.example` | 环境变量模板 |

---

## 路径别名（导入快捷方式）

```typescript
@/*           → src/*
@/components  → src/components
@/lib         → src/lib
@/db          → src/db
@/ai          → src/ai
@/credits     → src/credits
@/hooks       → src/hooks
@/stores      → src/stores
```

**使用示例：**
```typescript
import { blogSource } from '@/lib/source';
import { addCredits } from '@/credits/credits';
import BlogCard from '@/components/blog/blog-card';
```

---

## 常见问题

### Q: 如何添加新的 AI 提供商？

A: 编辑 `src/ai/image/lib/provider-config.ts`:
1. 在 `PROVIDERS` 中添加新提供商
2. 更新 `MODEL_CONFIGS` 的性能/质量模式
3. 更新 `PROVIDER_ORDER`
4. 在 `src/app/api/generate-images/route.ts` 中添加提供商配置

### Q: 如何修改学分消耗逻辑？

A: 编辑 `src/credits/credits.ts` 中的 `consumeCredits()` 函数。
当前使用 FIFO 策略（先过期的优先消耗）。

### Q: 如何添加新的支付套餐？

A: 
1. 在 Stripe 创建新的 Price
2. 在 `src/lib/price-plan.ts` 中添加套餐定义
3. 在网站配置中更新价格

### Q: 如何创建高级内容？

A: 在 MDX front matter 中设置 `premium: true`：
```yaml
---
title: "Premium Article"
premium: true
---
```

然后使用 `PremiumGuard` 组件包装内容。

### Q: 如何支持新的语言？

A: 
1. 在 `src/i18n/routing.ts` 中添加语言代码
2. 创建 `messages/xx.json` 翻译文件
3. 创建 `content/blog/**/*.xx.mdx` 内容文件

---

## 性能优化建议

1. **图像优化**
   - 使用 Next.js Image 组件
   - 启用 Webpack 图像优化

2. **缓存策略**
   - 使用 Redis 缓存用户学分
   - 缓存频繁查询的文档

3. **数据库优化**
   - 已有的 13 个 payment 表索引效率高
   - 考虑为 credit_transaction 添加复合索引

4. **代码分割**
   - AI 组件已动态加载
   - 使用 `dynamic()` 导入重型组件

---

## 开发命令

```bash
# 开发
pnpm dev

# 构建
pnpm build

# 启动生产
pnpm start

# Linting
pnpm lint

# 格式化
pnpm format

# 数据库相关
pnpm db:generate    # 生成迁移
pnpm db:migrate     # 执行迁移
pnpm db:push        # 同步 schema（开发）
pnpm db:studio      # 打开 Drizzle Studio

# 内容相关
pnpm content        # 处理 MDX 内容
pnpm email          # 邮件模板开发服务器
```

---

## 部署检查清单

- [ ] 环境变量已配置（数据库、API 密钥、Stripe、等）
- [ ] 数据库迁移已运行
- [ ] 内容已生成 (`pnpm content`)
- [ ] 静态资源已优化
- [ ] Stripe webhooks 已配置
- [ ] 邮件服务已配置（Resend）
- [ ] 存储已配置（S3）
- [ ] SEO 元标签已验证
- [ ] Lighthouse 性能评分检查

---

## 资源链接

- **Next.js**: https://nextjs.org
- **Fumadocs**: https://fumadocs.dev
- **Drizzle ORM**: https://orm.drizzle.team
- **Stripe**: https://stripe.com
- **Better Auth**: https://www.better-auth.com
- **Vercel AI SDK**: https://sdk.vercel.ai
- **Resend**: https://resend.com

