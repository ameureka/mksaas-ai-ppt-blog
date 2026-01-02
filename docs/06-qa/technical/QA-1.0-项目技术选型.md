# QA-1.0 项目技术选型

## 📋 问题
项目技术选型是什么？

## ✅ 回答

本项目是一个现代化的 Next.js 15 全栈 SaaS 应用，采用了以下核心技术选型：

### 🎯 核心框架
- **Next.js 15.2.1** - 全栈框架，使用 App Router
- **React 19.0.0** - 前端框架
- **TypeScript 5.8.3** - 类型安全

### 🔐 认证系统
- **Better Auth 1.1.19** - 现代化认证解决方案
  - 支持邮箱/密码登录
  - 支持 GitHub OAuth
  - 支持 Google OAuth
  - 内置管理员插件（用户管理、封禁功能）
  - 会话管理和账户链接

**来源**: `package.json`, `src/lib/auth.ts`

### 💳 支付系统
- **Stripe 17.6.0** - 支付集成
  - 订阅支付
  - 一次性支付
  - 积分包购买
  - 客户门户
  - Webhook 处理

**来源**: `package.json`, `src/payment/provider/stripe.ts`

### 📧 邮件服务
- **Resend 4.4.1** - 邮件发送服务
  - 邮件验证
  - 密码重置
  - 时事通讯订阅
  - React Email 模板

**来源**: `package.json`, `src/config/website.tsx`, `env.example`

### 💾 数据库
- **PostgreSQL** - 主数据库
- **Drizzle ORM 0.39.3** - 数据库 ORM
- **drizzle-kit 0.30.4** - 数据库迁移工具

**来源**: `package.json`, `drizzle.config.ts`

### 📦 对象存储
- **s3mini 0.2.0** - S3 兼容存储客户端
  - 支持 AWS S3
  - 支持 Cloudflare R2
  - 支持其他 S3 兼容服务

**来源**: `package.json`, `src/storage/provider/s3.ts`, `env.example`

### 🤖 AI 集成（多提供商）
- **ai 5.0.0** - Vercel AI SDK 核心库
- **@ai-sdk/openai 2.0.0** - OpenAI 集成
- **@ai-sdk/google 2.0.0** - Google Gemini 集成
- **@ai-sdk/replicate 1.0.0** - Replicate 集成
- **@ai-sdk/fireworks 1.0.0** - Fireworks AI 集成
- **@ai-sdk/fal 1.0.0** - FAL 集成
- **@ai-sdk/deepseek 1.0.0** - DeepSeek 集成
- **@openrouter/ai-sdk-provider 1.0.0-beta.6** - OpenRouter 多模型集成
- **@mendable/firecrawl-js 1.29.1** - 网页内容抓取分析

**来源**: `package.json`, `env.example`

### 🎨 UI 组件库
- **Radix UI** - 无样式组件库（20+ 子包）
- **TailwindCSS 4.0.14** - CSS 框架
- **Lucide React 0.483.0** - 图标库
- **Motion 12.4.3** - 动画库（Framer Motion 继任者）

**来源**: `package.json`

### 🌐 国际化
- **next-intl 4.0.0** - Next.js 国际化
  - 支持英文（en）
  - 支持中文（zh）

**来源**: `package.json`, `src/i18n/routing.ts`, `messages/en.json`, `messages/zh.json`

### 📊 数据管理
- **Zustand 5.0.3** - 轻量级状态管理
- **TanStack React Query 5.85.5** - 数据获取和缓存
- **TanStack React Table 8.21.2** - 表格组件

**来源**: `package.json`

### 📝 内容管理
- **Fumadocs Core 16.0.4** - 文档框架
- **Fumadocs MDX 13.0.2** - MDX 内容处理
- **Fumadocs UI 16.0.4** - 文档 UI

**来源**: `package.json`

### 🔒 安全与验证
- **next-safe-action 7.10.4** - 安全的 Server Actions
- **Zod 4.0.17** - 运行时验证
- **@marsidev/react-turnstile 1.1.0** - Cloudflare Turnstile 人机验证

**来源**: `package.json`

### 📈 分析与监控
- **PostHog 1.261.7** - 用户行为分析
- **Vercel Analytics 1.5.0** - 性能分析
- **Vercel Speed Insights 1.2.0** - 速度监控
- 支持多种第三方分析服务（Google Analytics, Umami, OpenPanel, Plausible 等）

**来源**: `package.json`, `env.example`

### 🛠️ 开发工具
- **Biome 1.9.4** - 代码格式化和 Linting（ESLint + Prettier 替代品）
- **tsx 4.19.3** - TypeScript 执行器
- **React Email 3.0.7** - 邮件模板开发

**来源**: `package.json`

### 🚀 部署选项
- **Vercel** - 默认部署平台
- **Cloudflare Workers** - 支持通过 OpenNext.js
- **Docker** - 支持容器化部署

**来源**: `next.config.ts`, `package.json`

## 🎯 选型特点

1. **现代化技术栈** - 使用最新的 Next.js 15 和 React 19
2. **类型安全** - 全面使用 TypeScript
3. **多提供商架构** - 支付、存储、邮件、AI 都支持多提供商
4. **企业级功能** - 完整的认证、支付、分析、监控
5. **开发体验优先** - Biome、Safe Actions、Zod 验证
6. **灵活部署** - 支持 Vercel、Cloudflare、Docker

## 📍 信息来源
- `package.json` - 所有依赖版本
- `src/config/website.tsx` - 应用配置
- `env.example` - 环境变量配置
- `src/lib/auth.ts` - 认证配置
- `src/payment/` - 支付集成
- `src/storage/` - 存储集成
