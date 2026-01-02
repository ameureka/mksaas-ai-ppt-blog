# QA-2.0 项目技术栈和约束条件

## 📋 问题
项目技术栈是什么，有没有什么约束条件？

## ✅ 回答

### 🏗️ 完整技术栈

#### 前端技术栈
- **框架**: Next.js 15.2.1 (App Router)
- **UI 库**: React 19.0.0
- **语言**: TypeScript 5.8.3
- **样式**: TailwindCSS 4.0.14
- **组件库**: Radix UI (无样式组件)
- **动画**: Motion 12.4.3
- **状态管理**: Zustand 5.0.3
- **数据获取**: TanStack React Query 5.85.5
- **表单**: React Hook Form 7.62.0 + Zod 4.0.17
- **国际化**: next-intl 4.0.0

**来源**: `package.json`

#### 后端技术栈
- **运行时**: Node.js (通过 Next.js)
- **数据库**: PostgreSQL
- **ORM**: Drizzle ORM 0.39.3
- **认证**: Better Auth 1.1.19
- **支付**: Stripe 17.6.0
- **邮件**: Resend 4.4.1
- **存储**: S3 兼容服务 (s3mini 0.2.0)
- **安全**: next-safe-action 7.10.4

**来源**: `package.json`

#### AI 技术栈
- **核心**: Vercel AI SDK 5.0.0
- **提供商**: OpenAI, Google Gemini, Replicate, Fireworks, FAL, DeepSeek, OpenRouter
- **工具**: Firecrawl (网页分析)

**来源**: `package.json`

### ⚠️ 技术约束条件

#### 1. 平台限制

##### Vercel 限制（如果部署到 Vercel）
```typescript
// 图片优化限制
unoptimized: true  // 避免每月 1000 张图片优化限制
```
**来源**: `next.config.ts`, `env.example`

```json
// API 函数执行时间限制
{
  "functions": {
    "src/app/api/**/*": {
      "maxDuration": 300  // 最大 5 分钟（需要 Pro 计划）
    }
  }
}
```
**来源**: `vercel.json`

##### 文件上传限制
```typescript
const MAX_FILE_SIZE = 4 * 1024 * 1024;  // 4MB (Vercel 限制)
```
**来源**: `src/lib/constants.ts`

```typescript
// 支持的文件类型
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
```
**来源**: `src/app/api/storage/upload/route.ts`

#### 2. 数据库约束

##### PostgreSQL 要求
- 必须使用 PostgreSQL 数据库
- 数据库 URL 格式要求：`postgresql://user:password@host:port/database`
- 支持的部署：Vercel Postgres, Supabase, Neon, Railway 等

**来源**: `drizzle.config.ts`, `env.example`

##### 数据模型约束
```typescript
// 用户积分过期限制
credits: {
  registerGiftCredits: {
    enable: true,
    amount: 50,
    expireDays: 30  // 注册赠送积分 30 天过期
  }
}
```
**来源**: `src/config/website.tsx`

#### 3. SaaS 服务成本约束

##### 免费层配置

**Resend (邮件)**
- 免费层：100 封/天
- 限制：1 封/秒
```typescript
// 延迟发送避免超限
setTimeout(async () => {
  const subscribed = await subscribe(user.email);
}, 2000);  // 延迟 2 秒
```
**来源**: `src/lib/auth.ts`, Resend 官方文档

**Stripe (支付)**
- 免费账户可用
- 测试模式无限制
- 生产模式收取手续费（2.9% + $0.30/笔）

**来源**: 集成在 `src/payment/provider/stripe.ts`

**PostHog (分析)**
- 免费层：1M 事件/月
- 可选启用

**来源**: `package.json`, `env.example`

**Cloudflare R2 (存储)**
- 免费层：10GB 存储
- 免费层：1M Class A 操作/月
- 免费层：10M Class B 操作/月
- 无流量费用

**来源**: `src/storage/provider/s3.ts`, Cloudflare 官方文档

**Vercel (部署)**
- Hobby 计划免费
- 限制：
  - 100GB 带宽/月
  - 无服务器函数执行时间：10 秒（Hobby）
  - 图片优化：1000 张/月（已禁用）

**来源**: `vercel.json`, `next.config.ts`

#### 4. AI 服务约束

##### API 超时限制
```typescript
// 聊天 API
export const maxDuration = 30;  // 30 秒超时

// 图片生成 API
const timeout = 55;  // 55 秒超时
```
**来源**: `src/app/api/chat/route.ts`, `src/app/api/generate-images/route.ts`

##### 成本考虑
- OpenAI：按 token 计费
- Replicate：按推理时间计费
- FAL：按生成次数计费
- Fireworks：按 token 计费

建议使用**积分系统**管理成本：
```typescript
credits: {
  enableCredits: false,  // 可启用积分系统
  packages: {
    basic: { amount: 100, price: { amount: 990 } },     // $9.90
    standard: { amount: 200, price: { amount: 1490 } }, // $14.90
    premium: { amount: 500, price: { amount: 3990 } },  // $39.90
    enterprise: { amount: 1000, price: { amount: 6990 } } // $69.90
  }
}
```
**来源**: `src/config/website.tsx`

#### 5. 性能约束

##### 支付轮询限制
```typescript
const PAYMENT_POLL_INTERVAL = 2000;      // 2 秒轮询一次
const PAYMENT_MAX_POLL_TIME = 60000;     // 最大 60 秒
const PAYMENT_RECORD_RETRY_ATTEMPTS = 30; // 最大 30 次重试
const PAYMENT_RECORD_RETRY_DELAY = 2000;  // 2 秒重试延迟
```
**来源**: `src/lib/constants.ts`

##### 搜索结果限制
```typescript
// Fumadocs 搜索限制
limit: 20  // 最多返回 20 个结果
```
**来源**: `src/app/api/search/route.ts`

#### 6. 安全约束

##### 认证要求
```typescript
// 必须启用邮箱验证
emailAndPassword: {
  requireEmailVerification: true
}
```
**来源**: `src/lib/auth.ts`

##### 会话管理
```typescript
session: {
  expiresIn: 60 * 60 * 24 * 7,      // 7 天过期
  updateAge: 60 * 60 * 24,          // 24 小时更新一次
  cookieCache: {
    enabled: true,
    maxAge: 60 * 60                 // 1 小时缓存
  }
}
```
**来源**: `src/lib/auth.ts`

##### CORS 和安全头
- 使用 Better Auth 内置安全措施
- Stripe Webhook 签名验证
- Server Actions 使用 next-safe-action

**来源**: `src/lib/safe-action.ts`, `src/app/api/webhooks/stripe/route.ts`

#### 7. 开发约束

##### 代码质量工具
```json
{
  "lint": "biome check --write .",
  "format": "biome format --write ."
}
```
- 必须使用 Biome 进行代码格式化
- 单引号、尾随逗号
- 行宽 80 字符

**来源**: `package.json`, `biome.json`

##### TypeScript 严格模式
- 路径别名：`@/*` → `src/*`
- 严格类型检查

**来源**: `tsconfig.json`

#### 8. 国际化约束

##### 支持语言
```typescript
locales: {
  en: { flag: '🇺🇸', name: 'English', hreflang: 'en' },
  zh: { flag: '🇨🇳', name: '中文', hreflang: 'zh-CN' }
}
```
- 当前仅支持英文和中文
- 需要在 `messages/` 目录维护翻译文件

**来源**: `src/config/website.tsx`, `messages/en.json`, `messages/zh.json`

#### 9. 内容约束

##### 博客分页
```typescript
blog: {
  paginationSize: 12,        // 每页 12 篇文章
  relatedPostsSize: 3        // 相关文章 3 篇
}
```
**来源**: `src/config/website.tsx`

### 📊 约束总结

| 约束类型 | 关键限制 | 解决方案 |
|---------|---------|---------|
| 文件上传 | 4MB (Vercel) | 使用对象存储；限制文件类型 |
| API 超时 | 10-300 秒 | 异步处理；分批执行 |
| 邮件发送 | 1 封/秒 (Resend) | 延迟发送；队列处理 |
| 图片优化 | 1000 张/月 (Vercel) | 禁用优化；使用 CDN |
| 数据库 | 仅支持 PostgreSQL | 使用 Drizzle ORM 抽象 |
| AI 成本 | 按使用计费 | 积分系统；多提供商 |
| 会话 | 7 天过期 | 自动刷新；记住我功能 |

## 📍 信息来源
- `package.json` - 技术栈依赖
- `next.config.ts` - Next.js 配置
- `vercel.json` - Vercel 部署配置
- `src/config/website.tsx` - 应用配置
- `src/lib/constants.ts` - 常量限制
- `src/lib/auth.ts` - 认证配置
- `env.example` - 环境变量说明
- `biome.json` - 代码规范
