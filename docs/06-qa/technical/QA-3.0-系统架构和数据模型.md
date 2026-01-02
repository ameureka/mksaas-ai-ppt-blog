# QA-3.0 系统架构图和数据模型

## 📋 问题
项目整体提供了完整的系统架构图和数据模型？

## ✅ 回答

### 🏛️ 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        客户端层 (Client)                          │
├─────────────────────────────────────────────────────────────────┤
│  • Next.js 15 App Router (React 19)                             │
│  • 国际化路由 ([locale]/)                                         │
│  • 主题系统 (dark/light)                                          │
│  • TanStack Query (数据缓存)                                      │
│  • Zustand (状态管理)                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                      应用层 (Application)                         │
├─────────────────────────────────────────────────────────────────┤
│  Server Components              │  Server Actions                │
│  • 页面渲染                      │  • 安全操作 (next-safe-action)  │
│  • 数据预取                      │  • Zod 验证                     │
│  • SEO 优化                      │  • 错误处理                     │
│                                  │                                │
│  API Routes (/api/*)             │  Middleware                   │
│  • RESTful 端点                  │  • 国际化                       │
│  • Webhook 处理                  │  • 认证检查                     │
│  • 流式响应                      │                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                      服务层 (Services)                            │
├─────────────────────────────────────────────────────────────────┤
│  认证服务           支付服务          存储服务        AI 服务       │
│  Better Auth       Stripe           S3/R2          Vercel AI SDK │
│  • 多提供商登录     • 订阅管理        • 文件上传      • 多模型支持   │
│  • 会话管理         • Webhook        • 对象存储      • 流式响应    │
│  • 用户管理         • 积分系统                                     │
│                                                                   │
│  邮件服务           时事通讯          分析服务        通知服务      │
│  Resend            Resend           PostHog等       Discord/飞书  │
│  • 验证邮件         • 订阅管理        • 用户追踪      • 支付通知    │
│  • 密码重置         • 群发邮件        • 性能监控                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                      数据层 (Data)                                │
├─────────────────────────────────────────────────────────────────┤
│  Drizzle ORM                                                     │
│  • Schema 定义                                                    │
│  • 迁移管理                                                       │
│  • 类型安全                                                       │
│                                                                   │
│  PostgreSQL 数据库                                                │
│  • user (用户)                                                    │
│  • session (会话)                                                 │
│  • account (账户链接)                                             │
│  • payment (支付)                                                 │
│  • userCredit (用户积分)                                          │
│  • creditTransaction (积分交易)                                   │
│  • verification (验证)                                            │
└─────────────────────────────────────────────────────────────────┘
```

**来源**: 综合分析 `src/app/`, `src/actions/`, `src/lib/`, `src/db/`

### 🗄️ 完整数据模型

#### 核心数据表结构

```sql
-- ============================================================================
-- 1. 用户表 (user)
-- ============================================================================
CREATE TABLE user (
    id TEXT PRIMARY KEY,                    -- 用户唯一标识
    name TEXT NOT NULL,                     -- 用户名
    email TEXT NOT NULL UNIQUE,             -- 邮箱（唯一）
    emailVerified BOOLEAN NOT NULL DEFAULT false,  -- 邮箱验证状态
    image TEXT,                             -- 头像 URL
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 角色和权限
    role TEXT,                              -- 用户角色（admin/user）

    -- 封禁管理
    banned BOOLEAN DEFAULT false,           -- 是否被封禁
    banReason TEXT,                         -- 封禁原因
    banExpires TIMESTAMP,                   -- 封禁过期时间

    -- 支付集成
    customerId TEXT                         -- Stripe 客户 ID
);

-- 索引
CREATE INDEX user_id_idx ON user(id);
CREATE INDEX user_customer_id_idx ON user(customerId);
CREATE INDEX user_role_idx ON user(role);
```

```sql
-- ============================================================================
-- 2. 会话表 (session)
-- ============================================================================
CREATE TABLE session (
    id TEXT PRIMARY KEY,                    -- 会话 ID
    token TEXT NOT NULL UNIQUE,             -- 会话令牌（唯一）
    expiresAt TIMESTAMP NOT NULL,           -- 过期时间
    ipAddress TEXT,                         -- IP 地址
    userAgent TEXT,                         -- 用户代理
    userId TEXT NOT NULL,                   -- 关联用户
    impersonatedBy TEXT,                    -- 管理员模拟用户
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX session_token_idx ON session(token);
CREATE INDEX session_user_id_idx ON session(userId);
```

```sql
-- ============================================================================
-- 3. 账户链接表 (account) - OAuth 登录
-- ============================================================================
CREATE TABLE account (
    id TEXT PRIMARY KEY,
    accountId TEXT NOT NULL,                -- OAuth 提供商的用户 ID
    providerId TEXT NOT NULL,               -- 提供商（github/google）
    userId TEXT NOT NULL,                   -- 关联用户

    -- OAuth 令牌
    accessToken TEXT,
    refreshToken TEXT,
    idToken TEXT,
    accessTokenExpiresAt TIMESTAMP,
    refreshTokenExpiresAt TIMESTAMP,
    scope TEXT,

    -- 密码登录
    password TEXT,

    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX account_user_id_idx ON account(userId);
CREATE INDEX account_account_id_idx ON account(accountId);
CREATE INDEX account_provider_id_idx ON account(providerId);
```

```sql
-- ============================================================================
-- 4. 支付表 (payment)
-- ============================================================================
CREATE TABLE payment (
    id TEXT PRIMARY KEY,
    priceId TEXT NOT NULL,                  -- Stripe Price ID

    -- 支付类型
    type TEXT NOT NULL,                     -- subscription | one_time
    scene TEXT NOT NULL,                    -- lifetime | credit | subscription

    -- 用户和客户信息
    userId TEXT NOT NULL,
    customerId TEXT NOT NULL,               -- Stripe 客户 ID

    -- 订阅信息
    subscriptionId TEXT,                    -- Stripe 订阅 ID
    status TEXT NOT NULL,                   -- active, canceled, incomplete 等
    paid BOOLEAN DEFAULT false,             -- 是否已支付

    -- 周期信息
    periodStart TIMESTAMP,
    periodEnd TIMESTAMP,
    trialStart TIMESTAMP,
    trialEnd TIMESTAMP,

    -- 取消管理
    cancelAtPeriodEnd BOOLEAN DEFAULT false,

    -- 发票
    invoiceId TEXT UNIQUE,                  -- Stripe 发票 ID（唯一）

    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

-- 索引（8 个用于快速查询）
CREATE INDEX payment_user_id_idx ON payment(userId);
CREATE INDEX payment_customer_id_idx ON payment(customerId);
CREATE INDEX payment_subscription_id_idx ON payment(subscriptionId);
CREATE INDEX payment_invoice_id_idx ON payment(invoiceId);
CREATE INDEX payment_status_idx ON payment(status);
CREATE INDEX payment_type_idx ON payment(type);
CREATE INDEX payment_scene_idx ON payment(scene);
CREATE INDEX payment_paid_idx ON payment(paid);
```

```sql
-- ============================================================================
-- 5. 用户积分表 (userCredit)
-- ============================================================================
CREATE TABLE userCredit (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL UNIQUE,            -- 用户 ID（唯一）
    currentCredits INTEGER NOT NULL DEFAULT 0,  -- 当前积分余额
    lastRefreshAt TIMESTAMP,                -- 最后刷新时间（已弃用）
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);
```

```sql
-- ============================================================================
-- 6. 积分交易表 (creditTransaction)
-- ============================================================================
CREATE TABLE creditTransaction (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,                   -- 用户 ID

    -- 交易类型
    type TEXT NOT NULL,                     -- purchase, usage, gift, monthly 等
    amount INTEGER NOT NULL,                -- 交易数额（正数=充值，负数=消费）
    remainingAmount INTEGER NOT NULL,       -- 剩余数额
    description TEXT,                       -- 交易描述

    -- 关联支付
    paymentId TEXT,                         -- 关联的 invoiceId

    -- 过期管理
    expirationDate TIMESTAMP,               -- 过期日期
    expirationDateProcessedAt TIMESTAMP,    -- 过期处理时间

    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX credit_transaction_user_id_idx ON creditTransaction(userId);
CREATE INDEX credit_transaction_type_idx ON creditTransaction(type);
```

```sql
-- ============================================================================
-- 7. 验证表 (verification) - 邮箱验证/密码重置
-- ============================================================================
CREATE TABLE verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,               -- 邮箱或用户 ID
    value TEXT NOT NULL,                    -- 验证码/令牌
    expiresAt TIMESTAMP NOT NULL,           -- 过期时间
    createdAt TIMESTAMP,
    updatedAt TIMESTAMP
);
```

**来源**: `src/db/schema.ts`

### 📊 数据关系图（ER 图）

```
┌─────────────┐
│    user     │
│─────────────│
│ id (PK)     │◄──────┐
│ email       │       │
│ customerId  │       │
│ role        │       │
│ banned      │       │
└─────────────┘       │
       ▲              │
       │              │
       │ 1:N          │ 1:N
       │              │
┌──────┴──────┐  ┌────┴──────────┐
│   session   │  │   account     │
│─────────────│  │───────────────│
│ id (PK)     │  │ id (PK)       │
│ token       │  │ providerId    │
│ userId (FK) │  │ userId (FK)   │
│ expiresAt   │  │ accessToken   │
└─────────────┘  └───────────────┘

       ▲
       │ 1:N
       │
┌──────┴──────┐
│   payment   │
│─────────────│
│ id (PK)     │
│ userId (FK) │
│ customerId  │
│ type        │
│ scene       │
│ status      │
│ invoiceId   │
└─────────────┘
       ▲
       │ 1:1
       │
┌──────┴──────────────┐
│   userCredit        │
│─────────────────────│
│ id (PK)             │
│ userId (FK, UNIQUE) │
│ currentCredits      │
└─────────────────────┘
       ▲
       │ 1:N
       │
┌──────┴──────────────────┐
│   creditTransaction     │
│─────────────────────────│
│ id (PK)                 │
│ userId (FK)             │
│ type                    │
│ amount                  │
│ paymentId               │
│ expirationDate          │
└─────────────────────────┘
```

**来源**: 基于 `src/db/schema.ts` 的外键关系分析

### 🔄 数据流转图

```
用户注册
   │
   ├──► 创建 user 记录
   ├──► 创建 account 记录（如果 OAuth）
   ├──► 发送验证邮件（创建 verification 记录）
   ├──► 自动订阅时事通讯
   └──► 赠送注册积分（创建 userCredit 和 creditTransaction）

用户登录
   │
   └──► 创建/更新 session 记录

用户订阅 Pro 计划
   │
   ├──► Stripe Checkout 会话创建
   ├──► 支付成功 → Webhook
   ├──► 创建/更新 payment 记录
   ├──► 更新 user.customerId
   ├──► 发放订阅积分（更新 userCredit）
   └──► 发送通知（Discord/飞书）

用户购买积分包
   │
   ├──► Stripe Checkout 会话创建
   ├──► 支付成功 → Webhook
   ├──► 创建 payment 记录
   ├──► 创建 creditTransaction 记录（type: purchase）
   └──► 更新 userCredit.currentCredits

用户使用 AI 功能
   │
   ├──► 检查积分余额（查询 userCredit）
   ├──► 消费积分（创建 creditTransaction, type: usage）
   ├──► 更新 userCredit.currentCredits
   └──► 调用 AI API（OpenAI/Replicate 等）

管理员封禁用户
   │
   ├──► 更新 user.banned = true
   ├──► 设置 user.banReason
   ├──► 设置 user.banExpires
   └──► 删除所有活跃 session（级联删除）

Cron Job - 积分过期处理
   │
   ├──► 查询过期的 creditTransaction
   ├──► 扣除过期积分
   ├──► 更新 userCredit.currentCredits
   └──► 标记 expirationDateProcessedAt
```

**来源**: `src/actions/`, `src/app/api/webhooks/stripe/route.ts`, `src/credits/`

### 🔧 数据库迁移版本

```
src/db/migrations/
├── 0000_fine_sir_ram.sql           -- 初始 schema
├── 0001_woozy_jigsaw.sql           -- 修改
├── 0002_left_grandmaster.sql       -- 修改
├── 0003_loving_risque.sql          -- 修改
├── 0004_clever_molly_hayes.sql     -- 修改
├── 0005_thankful_wolf_cub.sql      -- 修改
└── 0006_ambitious_annihilus.sql    -- 最新版本
```

**来源**: `src/db/migrations/`

### 📈 数据统计字段

项目中的关键数据点：

- **7 张核心表**
- **20+ 索引** 用于查询优化
- **5 个外键关系** 确保数据完整性
- **级联删除** 自动清理关联数据
- **唯一约束** 防止重复（email, token, invoiceId）
- **时间戳** 所有表都有 createdAt/updatedAt

**来源**: `src/db/schema.ts` 全面分析

### 🎯 架构特点

1. **分层清晰** - 客户端、应用层、服务层、数据层明确分离
2. **模块化设计** - 每个服务独立封装（认证、支付、存储、AI）
3. **提供商模式** - 支持多提供商切换（支付、存储、邮件）
4. **类型安全** - Drizzle ORM 提供端到端类型安全
5. **可扩展性** - 索引优化、级联删除、事务支持
6. **安全性** - 外键约束、唯一索引、数据验证

## 📍 信息来源
- `src/db/schema.ts` - 完整数据模型定义
- `src/db/migrations/` - 数据库迁移历史
- `src/app/` - 应用路由结构
- `src/actions/` - 服务端操作
- `src/lib/` - 核心服务
- `drizzle.config.ts` - ORM 配置
