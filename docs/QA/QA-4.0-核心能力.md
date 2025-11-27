# QA-4.0 项目核心能力

## 📋 问题
项目有没有核心能力？

## ✅ 回答

项目具备多项核心能力，特别突出的是 **AI 集成能力** 和 **完整的 SaaS 商业化能力**。

### 🤖 核心能力 1: 多提供商 AI 集成

#### 1.1 AI 聊天对话

**功能描述**: 支持流式 AI 对话，可选集成网页搜索

**技术实现**:
```typescript
// API 路由
POST /api/chat

// 核心特性
- 流式响应（Server-Sent Events）
- 支持多模型切换
- 可选 Web Search（Perplexity Sonar）
- 显示推理过程
- 引用来源显示
- 对话历史管理
```

**支持的模型**:
- OpenAI (GPT-4, GPT-3.5)
- Google Gemini
- DeepSeek
- OpenRouter (访问 100+ 模型)

**来源**: `src/app/api/chat/route.ts`, `src/ai/chat/components/ChatBot.tsx`

#### 1.2 AI 图片生成

**功能描述**: 多提供商图片生成，支持不同尺寸和模型

**技术实现**:
```typescript
// API 路由
POST /api/generate-images

// 支持的提供商
providers: {
  openai: {
    models: ['dall-e-3', 'dall-e-2'],
    sizes: ['1024x1024', '1024x1792', '1792x1024']
  },
  fireworks: {
    models: ['stable-diffusion-xl-1024-v1-0'],
    aspectRatio: ['1:1', '16:9', '9:16']
  },
  replicate: {
    models: ['flux-schnell', 'flux-dev'],
    aspectRatio: ['1:1', '16:9', '9:16', '21:9', '3:2', '2:3', '4:5', '5:4']
  },
  fal: {
    models: ['flux/schnell', 'flux/dev', 'flux-pro'],
    sizes: ['square_hd', 'landscape_4_3', 'portrait_4_3', 'landscape_16_9', 'portrait_16_9']
  }
}
```

**高级特性**:
- 超时处理（55 秒）
- 请求追踪（requestId）
- 错误重试
- 多张图片生成
- 结果缓存展示

**来源**: `src/app/api/generate-images/route.ts`, `src/ai/image/lib/provider-config.ts`

#### 1.3 网页内容分析

**功能描述**: 使用 AI 分析网页内容

**技术实现**:
```typescript
// API 路由
POST /api/analyze-content

// 使用 Firecrawl 爬取网页
- 提取网页文本
- AI 智能分析
- 结构化输出
```

**来源**: `src/app/api/analyze-content/route.ts`, `src/ai/text/`

### 💳 核心能力 2: 完整支付和订阅系统

#### 2.1 多层级定价

**免费计划**:
```typescript
free: {
  id: 'free',
  isFree: true,
  credits: { amount: 50, expireDays: 30 }
}
```

**Pro 计划**:
```typescript
pro: {
  monthly: { amount: 990 },   // $9.90/月
  yearly: { amount: 9900 },   // $99.00/年
  credits: { amount: 1000, expireDays: 30 }
}
```

**终身计划**:
```typescript
lifetime: {
  amount: 19900,              // $199.00 一次性
  credits: { amount: 1000, expireDays: 30 }
}
```

**来源**: `src/config/website.tsx`

#### 2.2 积分包系统

```typescript
packages: {
  basic: { amount: 100, price: 990 },      // $9.90
  standard: { amount: 200, price: 1490 },  // $14.90
  premium: { amount: 500, price: 3990 },   // $39.90
  enterprise: { amount: 1000, price: 6990 } // $69.90
}
```

**积分管理**:
- 购买积分（purchase）
- 消费积分（usage）
- 赠送积分（gift）
- 订阅赠送（monthly）
- 过期处理

**来源**: `src/config/website.tsx`, `src/credits/`

#### 2.3 Stripe 集成

**核心功能**:
- 创建 Checkout 会话
- 订阅管理
- 客户门户（用户自助管理）
- Webhook 事件处理
- 支付状态同步

**处理的事件**:
```typescript
webhookEvents: [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed'
]
```

**来源**: `src/payment/provider/stripe.ts`, `src/app/api/webhooks/stripe/route.ts`

### 🔐 核心能力 3: 企业级认证系统

#### 3.1 多种登录方式

```typescript
authMethods: {
  email: {
    password: true,
    requireEmailVerification: true,
    passwordReset: true
  },
  oauth: {
    github: true,
    google: true
  },
  accountLinking: {
    enabled: true,
    trustedProviders: ['google', 'github']
  }
}
```

**来源**: `src/lib/auth.ts`

#### 3.2 用户管理

**管理员功能**:
- 用户列表查看
- 封禁用户
- 设置封禁原因和过期时间
- 角色管理
- 模拟登录（impersonation）

```typescript
adminPlugin: {
  defaultBanExpiresIn: undefined,
  bannedUserMessage: 'You have been banned...'
}
```

**来源**: `src/lib/auth.ts`, `src/app/[locale]/(protected)/admin/users/page.tsx`

#### 3.3 会话管理

```typescript
session: {
  expiresIn: 60 * 60 * 24 * 7,      // 7 天
  updateAge: 60 * 60 * 24,          // 24 小时更新
  cookieCache: {
    enabled: true,
    maxAge: 60 * 60                 // 1 小时缓存
  }
}
```

**来源**: `src/lib/auth.ts`

### 📧 核心能力 4: 邮件营销系统

#### 4.1 事务邮件

**支持的邮件类型**:
- 邮箱验证
- 密码重置
- 欢迎邮件
- 支付确认

**多语言支持**: 根据用户语言发送对应邮件

**来源**: `src/mail/templates/`, `src/lib/auth.ts`

#### 4.2 时事通讯

**功能**:
- 订阅/取消订阅
- 自动订阅（注册时）
- 订阅状态检查
- Resend Audience 集成

```typescript
newsletter: {
  enable: true,
  provider: 'resend',
  autoSubscribeAfterSignUp: true
}
```

**来源**: `src/config/website.tsx`, `src/actions/subscribe-newsletter.ts`

### 🌐 核心能力 5: 国际化支持

#### 5.1 多语言路由

```typescript
// 路由结构
/[locale]/...

// 支持语言
locales: {
  en: { name: 'English', hreflang: 'en' },
  zh: { name: '中文', hreflang: 'zh-CN' }
}
```

**来源**: `src/i18n/routing.ts`, `src/config/website.tsx`

#### 5.2 完整翻译

**翻译范围**:
- UI 组件
- 邮件模板
- 错误消息
- SEO 元数据
- 定价说明

**来源**: `messages/en.json`, `messages/zh.json`

### 📝 核心能力 6: 内容管理系统

#### 6.1 MDX 博客

**功能**:
- MDX 格式文章
- 分类管理
- 分页
- 相关文章推荐
- SEO 优化

```typescript
blog: {
  enable: true,
  paginationSize: 12,
  relatedPostsSize: 3
}
```

**来源**: `src/config/website.tsx`, `content/blog/`

#### 6.2 Fumadocs 文档

**功能**:
- 文档搜索（中文分词支持）
- 多语言文档
- 代码高亮
- 自动目录
- 响应式侧边栏

**来源**: `src/app/api/search/route.ts`, `content/docs/`

### 📊 核心能力 7: 多分析提供商集成

**支持的分析工具**:
- PostHog - 用户行为分析
- Vercel Analytics - 性能分析
- Google Analytics - 流量分析
- Umami - 隐私友好分析
- OpenPanel - 开源分析
- Plausible - 简单分析
- Ahrefs - SEO 分析
- DataFast - 收入追踪
- Clarity - 热力图

**来源**: `env.example`, `src/app/[locale]/layout.tsx`

### ☁️ 核心能力 8: 对象存储集成

**支持的存储**:
- Cloudflare R2
- AWS S3
- 任何 S3 兼容服务

**功能**:
```typescript
storage: {
  upload: {
    maxSize: 4 * 1024 * 1024,     // 4MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  operations: ['upload', 'delete']
}
```

**来源**: `src/storage/`, `src/app/api/storage/upload/route.ts`

### 🔔 核心能力 9: 通知系统

**支持的通知渠道**:
- Discord Webhook
- 飞书（Feishu）Webhook

**触发场景**:
- 新用户注册
- 支付成功
- 订阅变更

```typescript
async function sendNotification(sessionId, customerId, userName, amount) {
  await Promise.all([
    sendDiscordNotification(...),
    sendFeishuNotification(...)
  ]);
}
```

**来源**: `src/notification/`

### 🎨 核心能力 10: 丰富的 UI 组件库

**组件数量**: 150+ 个组件

**分类**:
- 基础 UI（Radix UI）
- 动画组件（animate-ui/）
- AI 元素（ai-elements/）
- 页面块（blocks/）
- 仪表板（dashboard/）
- 数据表格（data-table/）

**来源**: `src/components/`

## 🎯 核心能力总结

| 能力 | 成熟度 | 亮点 |
|------|--------|------|
| AI 集成 | ⭐⭐⭐⭐⭐ | 多提供商、流式响应、Web Search |
| 支付订阅 | ⭐⭐⭐⭐⭐ | Stripe、积分系统、多层级定价 |
| 认证系统 | ⭐⭐⭐⭐⭐ | 多 OAuth、管理员、会话管理 |
| 邮件营销 | ⭐⭐⭐⭐ | 事务邮件、时事通讯、多语言 |
| 国际化 | ⭐⭐⭐⭐ | 完整翻译、SEO、路由 |
| 内容管理 | ⭐⭐⭐⭐ | MDX 博客、Fumadocs 文档 |
| 分析监控 | ⭐⭐⭐⭐ | 9+ 分析工具、通知系统 |
| 对象存储 | ⭐⭐⭐⭐ | S3 兼容、多提供商 |
| UI 组件 | ⭐⭐⭐⭐⭐ | 150+ 组件、动画、响应式 |

## 💡 独特价值

1. **AI First** - 深度集成多个 AI 提供商，不依赖单一服务
2. **商业化就绪** - 完整的支付、订阅、积分系统
3. **企业级架构** - 认证、授权、用户管理、审计日志
4. **开发者友好** - TypeScript、类型安全、模块化设计
5. **可扩展性** - 提供商模式、插件架构

## 📍 信息来源
- `src/ai/` - AI 功能实现
- `src/payment/` - 支付系统
- `src/lib/auth.ts` - 认证系统
- `src/config/website.tsx` - 核心配置
- `src/components/` - UI 组件
- `src/storage/` - 存储集成
- `src/notification/` - 通知系统
- `messages/` - 国际化翻译
