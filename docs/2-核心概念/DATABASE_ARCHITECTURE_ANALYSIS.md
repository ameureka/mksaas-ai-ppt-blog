# MkSaaS 项目数据库架构分析报告

## 一、项目概览

**项目类型**：Next.js 15 全栈 SaaS 应用  
**数据库**：PostgreSQL + Drizzle ORM  
**部署方案**：支持 Supabase、Neon、本地 PostgreSQL  
**认证框架**：Better Auth  
**支付系统**：Stripe 集成

---

## 二、数据库架构总体设计

### 2.1 架构分层

```
┌─────────────────────────────────────────────────────────┐
│              应用层 (Next.js Server Actions)             │
├─────────────────────────────────────────────────────────┤
│                   业务逻辑层                              │
│  ├── 支付模块 (src/payment)                             │
│  ├── 积分模块 (src/credits)                             │
│  ├── 认证模块 (Better Auth)                             │
│  └── 核心操作 (src/actions)                             │
├─────────────────────────────────────────────────────────┤
│                 Drizzle ORM 层                           │
│              (类型安全的 SQL 构建)                        │
├─────────────────────────────────────────────────────────┤
│              PostgreSQL 数据库                           │
│        (基础表、索引、约束、外键)                         │
└─────────────────────────────────────────────────────────┘
```

### 2.2 表关系图 (ER 图)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          核心认证模块                                 │
├─────────────────────────────────────────────────────────────────────┤
│
│                           ┌──────────────┐
│                           │    user      │  (主表)
│                           ├──────────────┤
│                           │ id (PK)      │
│                           │ email (UQ)   │
│                           │ name         │
│                           │ role         │
│                           │ banned       │
│                           │ customerId   │──┐
│                           │ ...          │  │
│                           └──────────────┘  │
│                                  ▲          │
│                   ┌──────────────┼──────────┼──────────────┐
│                   │              │          │              │
│        ┌──────────┴────┐  ┌──────┴──┐  ┌───┴──────────┐  ┌┴──────────────┐
│        │    session   │  │ account  │  │   payment    │  │  userCredit   │
│        ├──────────────┤  ├──────────┤  ├──────────────┤  ├───────────────┤
│        │ id (PK)      │  │ id (PK)  │  │ id (PK)      │  │ id (PK)       │
│        │ userId (FK)  │  │ userId   │  │ userId (FK)  │  │ userId (FK)   │
│        │ token (UQ)   │  │ (FK)     │  │ customerId   │  │ currentCredits│
│        │ expiresAt    │  │ provider │  │ priceId      │  │ createdAt     │
│        │ ipAddress    │  │ Id       │  │ status       │  │ updatedAt     │
│        │ userAgent    │  │ password │  │ paid         │  └───────────────┘
│        │ ...          │  │ ...      │  │ scene        │         ▲
│        └──────────────┘  └──────────┘  │ sessionId    │         │
│                                         │ invoiceId    │         │
│                                         │ (UQ)         │         │
│                                         │ ...          │         │
│                                         └──────────────┘         │
│                                                 │                │
│                                         ┌───────┴────────┐       │
│                                         │                │       │
│                                   ┌─────┴──────┐   ┌────┴────────┐
│                                   │verification│   │credit_      │
│                                   │            │   │transaction  │
│                                   ├────────────┤   ├─────────────┤
│                                   │ id (PK)    │   │ id (PK)     │
│                                   │ identifier │   │ userId (FK) │
│                                   │ value      │   │ type        │
│                                   │ expiresAt  │   │ amount      │
│                                   │ ...        │   │ paymentId   │
│                                   └────────────┘   │ expireDate  │
│                                                    │ ...         │
│                                                    └─────────────┘
└─────────────────────────────────────────────────────────────────────┘

FK = Foreign Key (外键)
UQ = Unique (唯一约束)
PK = Primary Key (主键)
```

---

## 三、详细表结构分析

### 3.1 认证模块表

#### 3.1.1 user 表 (用户表)

**业务含义**：核心用户表，存储所有注册用户的基本信息

```sql
CREATE TABLE "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified BOOLEAN NOT NULL,
  image TEXT,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL,
  role TEXT,                    -- 用户角色: admin, user 等
  banned BOOLEAN,               -- 是否被禁用
  banReason TEXT,               -- 禁用原因
  banExpires TIMESTAMP,         -- 禁用过期时间
  customerId TEXT               -- Stripe 客户ID (支付关联)
)
```

**字段解释**：
- `id`: UUID，Better Auth 生成的唯一标识
- `email`: 邮箱地址，设置了唯一约束，确保一个邮箱对应一个用户
- `emailVerified`: 邮箱验证状态，用于邮件验证流程
- `role`: 基于 Better Auth 的 admin 插件，支持用户角色管理
- `banned`: 用于实现用户禁用功能（Better Auth admin 插件）
- `customerId`: Stripe 客户 ID，建立用户与支付系统的关联

**索引**：
```
user_id_idx:          ON (id)           -- PK 已有隐式索引
user_customer_id_idx: ON (customer_id)  -- 快速查询 Stripe 客户
user_role_idx:        ON (role)         -- 按角色筛选用户
```

**使用场景**：
1. 用户登录/注册
2. 用户信息展示
3. 支付系统中获取用户对应的 Stripe 客户 ID
4. 管理员查询特定角色的用户

---

#### 3.1.2 session 表 (会话表)

**业务含义**：管理用户会话，追踪登录状态和会话安全

```sql
CREATE TABLE "session" (
  id TEXT PRIMARY KEY,
  expiresAt TIMESTAMP NOT NULL,
  token TEXT NOT NULL UNIQUE,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL,
  ipAddress TEXT,              -- IP 地址 (安全审计)
  userAgent TEXT,               -- 用户代理 (设备识别)
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE cascade,
  impersonatedBy TEXT           -- 管理员模拟用户 ID
)
```

**字段解释**：
- `token`: 会话令牌，设置唯一约束，用于识别特定会话
- `expiresAt`: 会话过期时间，系统需定期清理过期会话
- `ipAddress`: 记录登录 IP，用于异常登录检测
- `userAgent`: 记录设备信息，用于多设备登录管理
- `impersonatedBy`: 支持管理员模拟用户功能（Better Auth admin 插件）

**索引**：
```
session_token_idx:    ON (token)     -- 快速令牌查找
session_user_id_idx:  ON (userId)    -- 快速查询用户会话
```

**级联删除**：用户删除时自动删除其所有会话

---

#### 3.1.3 account 表 (账户/社交登录表)

**业务含义**：管理用户的多个登录方式（邮密码、Google、GitHub 等）

```sql
CREATE TABLE "account" (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,              -- 社交提供商的用户 ID
  providerId TEXT NOT NULL,             -- 提供商: google, github, credentials
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE cascade,
  accessToken TEXT,                     -- OAuth access token
  refreshToken TEXT,                    -- OAuth refresh token (自动刷新)
  idToken TEXT,                         -- OpenID token
  accessTokenExpiresAt TIMESTAMP,       -- token 过期时间
  refreshTokenExpiresAt TIMESTAMP,
  scope TEXT,                           -- OAuth scope 权限范围
  password TEXT,                        -- 本地密码 (仅 credentials)
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL
)
```

**字段解释**：
- `providerId`: 支持 'credentials'(邮密码)、'google'、'github' 等多个提供商
- `accountId`: 社交提供商返回的唯一用户 ID
- `accessToken/refreshToken`: OAuth 令牌，用于调用第三方 API
- `password`: 仅在 credentials 提供商中使用，采用加密存储

**索引**：
```
account_user_id_idx:     ON (userId)     -- 快速查询用户的所有账户
account_account_id_idx:  ON (accountId)  -- 防止重复链接
account_provider_id_idx: ON (providerId) -- 按提供商类型筛选
```

**特点**：
- 一个用户可以有多个账户（邮箱 + Google + GitHub）
- 用户删除时级联删除其所有账户

---

#### 3.1.4 verification 表 (验证表)

**业务含义**：管理各类验证码和验证流程（邮箱验证、密码重置等）

```sql
CREATE TABLE "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,             -- 验证对象: email、phone 等
  value TEXT NOT NULL,                  -- 验证值: token、code 等
  expiresAt TIMESTAMP NOT NULL,         -- 过期时间 (通常 15-30 分钟)
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
)
```

**使用场景**：
1. 邮箱验证码 (identifier: email, value: 6位数字码)
2. 密码重置令牌 (identifier: email, value: 长 token)
3. 邮箱变更验证

**特点**：
- 无外键约束，允许未注册邮箱的验证流程
- 需要定期清理过期验证记录

---

### 3.2 支付系统模块表

#### 3.2.1 payment 表 (支付记录表)

**业务含义**：核心支付交易记录，跟踪所有 Stripe 相关的支付动作

```sql
CREATE TABLE "payment" (
  id TEXT PRIMARY KEY,
  priceId TEXT NOT NULL,                -- Stripe price ID (关联价格方案)
  type TEXT NOT NULL,                   -- 'one-time' | 'subscription'
  scene TEXT,                           -- 'lifetime' | 'credit' | 'subscription'
  interval TEXT,                        -- 'month' | 'year' (订阅周期)
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE cascade,
  customerId TEXT NOT NULL,             -- Stripe customer ID
  subscriptionId TEXT,                  -- Stripe subscription ID (仅订阅)
  sessionId TEXT,                       -- Stripe checkout session ID
  invoiceId TEXT UNIQUE,                -- Stripe invoice ID (防重重复)
  status TEXT NOT NULL,                 -- 'pending' | 'active' | 'trialing' | 'completed' | 'canceled'
  paid BOOLEAN NOT NULL DEFAULT false,  -- 是否已支付 (由 invoice.paid 事件设置)
  periodStart TIMESTAMP,                -- 计费周期开始
  periodEnd TIMESTAMP,                  -- 计费周期结束
  cancelAtPeriodEnd BOOLEAN,            -- 是否在周期结束时取消
  trialStart TIMESTAMP,                 -- 试用开始
  trialEnd TIMESTAMP,                   -- 试用结束
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
)
```

**字段详解**：

| 字段 | 类型 | 含义 | 示例值 |
|------|------|------|--------|
| `type` | TEXT | 支付类型 | 'one-time' (单次), 'subscription' (订阅) |
| `scene` | TEXT | 业务场景 | 'lifetime' (终身), 'credit' (积分), 'subscription' (订阅) |
| `interval` | TEXT | 订阅周期 | 'month', 'year' |
| `status` | TEXT | 支付状态 | 'pending' 待支付, 'active' 激活, 'trialing' 试用中, 'completed' 已完成, 'canceled' 已取消 |
| `paid` | BOOLEAN | 支付完成标记 | false (待支付), true (已支付) |

**索引（共10个，全面覆盖查询）**：
```
payment_type_idx:            ON (type)            -- 区分单次/订阅支付
payment_scene_idx:           ON (scene)           -- 按业务场景分类
payment_price_id_idx:        ON (priceId)        -- 关联价格方案
payment_user_id_idx:         ON (userId)         -- 快速查询用户支付
payment_customer_id_idx:     ON (customerId)     -- Stripe 客户查询
payment_status_idx:          ON (status)         -- 支付状态筛选
payment_paid_idx:            ON (paid)           -- 已支付/未支付统计
payment_subscription_id_idx: ON (subscriptionId) -- 订阅管理
payment_session_id_idx:      ON (sessionId)      -- checkout 会话追踪
payment_invoice_id_idx:      ON (invoiceId)      -- 防重检查 (使用 UNIQUE)
```

**设计亮点**：

1. **invoiceId 唯一约束**：防止 Stripe webhook 重复触发导致的重复支付
   ```
   当 Stripe 发送 invoice.paid 事件多次时，通过 invoiceId 的唯一约束
   确保相同发票只被处理一次
   ```

2. **支付场景分类**：
   - `'lifetime'`: 终身会员，需分配额外的终身积分
   - `'credit'`: 购买积分包
   - `'subscription'`: 订阅制

3. **支付状态流转**：
   ```
   pending ──支付完成──> active (订阅激活)
        或                 ↓
      completed (单次)   trialing (试用中)
        或                 ↓
       canceled        active 或 canceled
   ```

---

#### 3.2.2 userCredit 表 (用户积分表)

**业务含义**：记录每个用户当前的积分余额

```sql
CREATE TABLE "user_credit" (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE cascade,
  currentCredits INTEGER NOT NULL DEFAULT 0,  -- 当前积分余额
  lastRefreshAt TIMESTAMP,                    -- 上次刷新时间 (已弃用)
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
)
```

**字段说明**：
- `currentCredits`: 当前有效积分数，用于功能消费
- `lastRefreshAt`: 标记为已弃用，历史字段

**索引**：
```
user_credit_user_id_idx: ON (userId) -- 一对一关系，快速查询
```

**关键特性**：
- 一个用户对应一条记录（1:1 关系）
- 通过 creditTransaction 表跟踪积分的增减明细
- 支持实时积分消费

---

#### 3.2.3 creditTransaction 表 (积分交易记录表)

**业务含义**：记录所有积分的增减操作，形成完整的积分交易审计日志

```sql
CREATE TABLE "credit_transaction" (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE cascade,
  type TEXT NOT NULL,                        -- 'add' | 'consume' | 'expire'
  description TEXT,                         -- 交易描述
  amount INTEGER NOT NULL,                  -- 交易数量 (+ 增加, - 消费)
  remainingAmount INTEGER,                  -- 交易后的剩余积分
  paymentId TEXT,                           -- 关联的 payment invoiceId
  expirationDate TIMESTAMP,                 -- 积分过期时间
  expirationDateProcessedAt TIMESTAMP,      -- 过期处理时间
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
)
```

**字段详解**：

| 字段 | 说明 | 示例 |
|------|------|------|
| `type` | 交易类型 | 'add' (增加), 'consume' (消费), 'expire' (过期) |
| `description` | 交易描述 | "订阅 Pro 年付赠送", "使用 AI 功能", "积分过期" |
| `amount` | 交易数量 | 100 (增加), -10 (消费) |
| `remainingAmount` | 交易后余额 | 用于审计和对账 |
| `paymentId` | 关联支付 | 对应 payment 表的 invoiceId |
| `expirationDate` | 过期时间 | 某些积分有过期期限 |

**索引**：
```
credit_transaction_user_id_idx: ON (userId) -- 查询用户交易历史
credit_transaction_type_idx:    ON (type)   -- 按交易类型统计
```

**设计模式**：
- **积分差不多法 (Ledger Pattern)**：通过每笔交易记录维护审计日志
- **余额快速查询**：userCredit 表快速查询当前余额，creditTransaction 表提供历史审计

---

## 四、数据库设计分析

### 4.1 关键设计决策

#### 4.1.1 认证设计 (Better Auth)

**优点**：
1. **开源安全**：Better Auth 是专业的认证框架，安全性有保障
2. **多提供商支持**：内置 Google、GitHub、邮密码等多种认证方式
3. **管理员功能**：admin 插件支持用户管理、禁用等功能
4. **标准化**：遵循 OAuth 2.0、OpenID Connect 标准

**表设计特点**：
- `user` 和 `account` 的一对多关系支持多种登录方式
- `session` 表完整记录会话信息（IP、User-Agent），便于安全审计
- `verification` 表支持通用验证流程，灵活性高

---

#### 4.1.2 支付系统设计

**核心原则**：事件驱动 + 异步处理

```
Stripe Webhook Event ──> 验证签名 ──> 查询/更新 payment 表
    (invoice.paid)         ✓          (设置 paid=true)
                                      ✓
                           发送积分  ──> creditTransaction 增加
                           ✓
                           更新用户 ──> userCredit.currentCredits 增加
```

**防重设计（Double Payment Prevention）**：
1. 使用 `invoiceId` 唯一约束
2. `paid` 布尔字段标记支付完成状态
3. 在 webhook 处理时先检查 invoiceId 是否已存在

**支付场景分类**：
- **subscription**: 订阅制，周期性续费
- **lifetime**: 一次性终身购买
- **credit**: 积分包购买

---

#### 4.1.3 积分系统设计

**两表模式**：

```
┌────────────────┐                 ┌──────────────────────┐
│  userCredit    │                 │ creditTransaction    │
├────────────────┤                 ├──────────────────────┤
│ userId (UQ)    │                 │ userId               │
│ currentCredits │◄───关联─────────│ type                 │
│                │  最终状态        │ amount               │
│ updated_at     │                 │ remainingAmount      │
└────────────────┘                 │ createdAt (完整历史) │
                                   └──────────────────────┘

快速查询：SELECT * FROM userCredit WHERE userId = $1
审计跟踪：SELECT * FROM creditTransaction WHERE userId = $1 ORDER BY createdAt DESC
```

**优点**：
1. **性能**：userCredit 直接存储当前余额，O(1) 查询
2. **审计**：creditTransaction 提供完整历史，支持对账和调试
3. **过期处理**：expirationDate 字段支持积分自动过期机制
4. **灵活扩展**：可轻松添加积分分类、过期规则等

---

### 4.2 索引策略分析

**总索引数**：17 个 B-tree 索引 + 1 个唯一约束

**分类统计**：

| 表名 | 索引数 | 主要索引 |
|------|--------|---------|
| user | 3 | id, customer_id, role |
| session | 2 | token (UQ), user_id |
| account | 3 | user_id, account_id, provider_id |
| payment | 10 | type, scene, status, paid, user_id, subscription_id 等 |
| userCredit | 1 | user_id |
| creditTransaction | 2 | user_id, type |
| verification | 0 | (无索引) |

**索引优化评估**：

✅ **优秀设计**：
- payment 表索引齐全，覆盖所有主要查询维度
- 外键字段都有索引（支持 JOIN 性能）
- 唯一约束字段也是索引（如 session.token, user.email）

⚠️ **可优化之处**：
- verification 表无索引，查询可能较慢
- userCredit 和 user 是 1:1 关系，可考虑合并（待评估）

---

### 4.3 外键约束设计

**级联删除策略**：
```sql
FOREIGN KEY (userId) REFERENCES user(id) ON DELETE cascade
```

**影响范围**：
- 删除用户时，自动删除其所有关联数据
- 表包括：session, account, payment, userCredit, creditTransaction

**优缺点**：
✅ 自动维护数据一致性  
⚠️ 级联删除可能导致大量数据被删除，需谨慎

---

## 五、迁移历史分析

### 5.1 演化过程

```
0000_fine_sir_ram.sql
├─ 创建核心表：user, session, account, payment, verification
└─ 业务：基础认证和支付功能

0001_woozy_jigsaw.sql
├─ 创建表：userCredit, creditTransaction
└─ 业务：积分系统支持

0002_left_grandmaster.sql
├─ 创建 17 个索引，全面覆盖查询优化
└─ 性能优化阶段

0003_loving_risque.sql
├─ payment 表 + session_id 列
├─ 创建 payment_session_id_idx 索引
└─ 业务：跟踪 Stripe checkout session

0004_clever_molly_hayes.sql
├─ payment 表 + invoice_id 列 (UNIQUE)
├─ 创建 payment_invoice_id_idx 索引
└─ 业务：防重设计，确保幂等性

0005_thankful_wolf_cub.sql
├─ payment 表 + paid 列 (BOOLEAN DEFAULT false)
├─ 创建 payment_paid_idx 索引
└─ 业务：明确标记支付完成状态

0006_ambitious_annihilus.sql
├─ payment 表 + scene 列
├─ 创建 payment_scene_idx 索引
└─ 业务：区分支付场景（lifetime/credit/subscription）
```

### 5.2 关键演化事件

| 迁移 | 时间线 | 新增功能 |
|------|--------|---------|
| 0000 | 初期 | 核心认证、支付基础设施 |
| 0001 | early | 积分系统完整实装 |
| 0002 | 性能优化 | 索引优化（关键！） |
| 0003-0006 | 支付优化 | 防重、状态管理、场景分类 |

---

## 六、业务流程与数据流

### 6.1 用户注册流程

```
用户输入邮箱和密码
    ↓
[1] user 表 INSERT
    ├─ id: UUID
    ├─ email: 邮箱 (UNIQUE)
    ├─ emailVerified: false
    └─ role: NULL (默认普通用户)
    ↓
[2] account 表 INSERT
    ├─ providerId: 'credentials'
    ├─ accountId: UUID
    ├─ password: hash(密码)
    └─ userId: 外键指向新用户
    ↓
[3] verification 表 INSERT
    ├─ identifier: 邮箱
    ├─ value: 随机 token
    ├─ expiresAt: now + 24 hours
    └─ 发送邮件验证链接
    ↓
用户点击验证链接
    ↓
[4] user 表 UPDATE emailVerified = true
    ↓
[5] verification 表 DELETE (验证完成，清理记录)
```

### 6.2 支付流程

```
用户选择订阅方案 (e.g., Pro Annual)
    ↓
[1] 调用 Stripe.checkout.sessions.create()
    ├─ priceId: STRIPE_PRICE_PRO_YEARLY
    ├─ customerId: 从 user 表获取或创建
    └─ sessionId: Stripe 返回
    ↓
[2] payment 表 INSERT (status='pending', paid=false)
    ├─ sessionId: 对应 checkout session
    ├─ priceId: PRO_YEARLY
    ├─ type: 'subscription'
    └─ scene: 'subscription'
    ↓
用户完成支付 (Stripe 处理扣款)
    ↓
[3] Stripe 发送 invoice.paid webhook
    ├─ 验证签名
    ├─ 查询 payment 记录 (invoiceId)
    └─ 检查 UNIQUE(invoiceId) 防重
    ↓
[4] payment 表 UPDATE
    ├─ paid = true
    ├─ status = 'active'
    ├─ invoiceId: Stripe 发票 ID
    └─ periodStart/periodEnd: 自动设置
    ↓
[5] 分配订阅积分
    ├─ creditTransaction INSERT
    │  ├─ type: 'add'
    │  ├─ amount: 100 (年付 Pro)
    │  └─ description: 'Pro subscription annual bonus'
    │
    ├─ userCredit UPDATE
    │  └─ currentCredits += 100
    │
    └─ 发送欢迎邮件
```

### 6.3 积分消费流程

```
用户使用 AI 功能 (e.g., 图片生成)
    ↓
[1] 检查 creditTransaction 统计
    SELECT SUM(amount) FROM creditTransaction 
    WHERE userId = $1 AND type IN ('add', 'consume')
    ↓
[2] 检查用户积分是否足够
    SELECT currentCredits FROM userCredit WHERE userId = $1
    ↓
如果积分充足：
    [3] creditTransaction INSERT
        ├─ type: 'consume'
        ├─ amount: -10 (消费)
        ├─ description: 'AI image generation'
        └─ remainingAmount: userCredit.currentCredits - 10
    ↓
    [4] userCredit UPDATE
        └─ currentCredits -= 10
    ↓
    [5] 执行实际功能 (调用 AI API)

否则：
    提示积分不足，建议购买
```

---

## 七、性能分析与优化

### 7.1 查询性能评估

#### High-Performance Queries (O(1))

```javascript
// 1. 获取用户当前积分 - 极快
SELECT currentCredits FROM userCredit WHERE userId = $1
        ↑ Index: user_credit_user_id_idx

// 2. 验证会话有效性
SELECT * FROM session WHERE token = $1
        ↑ Index: session_token_idx (UNIQUE)

// 3. 查询用户最新支付状态
SELECT * FROM payment WHERE userId = $1 AND paid = true
ORDER BY createdAt DESC LIMIT 1
        ↑ Index: (payment_user_id_idx, payment_paid_idx)
```

#### Potential Bottlenecks

```javascript
// 1. 验证表查询（无索引）
SELECT * FROM verification WHERE identifier = $1
  // 问题：identifier 无索引，全表扫描
  // 优化：CREATE INDEX verification_identifier_idx ON verification(identifier)

// 2. 积分到期处理（JOIN+批处理）
SELECT * FROM creditTransaction 
WHERE userId = $1 AND expirationDate < NOW()
AND expirationDateProcessedAt IS NULL
  // 问题：expirationDate 无索引，月度 cron 处理大量数据
  // 优化：CREATE INDEX credit_expiration_idx ON creditTransaction(expirationDate)

// 3. 订阅续费查询（复杂 JOIN）
SELECT u.*, p.* FROM user u
LEFT JOIN payment p ON u.id = p.userId
WHERE p.status = 'active' AND p.type = 'subscription'
  // 问题：LEFT JOIN 可能需要全表扫描，处理大量用户时较慢
  // 优化：预先构建物化视图，或使用组合索引
```

### 7.2 索引建议

**新增索引（改进性能）**：

```sql
-- 1. verification 表：加速邮箱验证、密码重置
CREATE INDEX verification_identifier_idx ON verification(identifier);
CREATE INDEX verification_expires_at_idx ON verification(expiresAt);
-- 原因：webhook 处理需快速查询和清理过期记录

-- 2. creditTransaction 表：加速过期处理
CREATE INDEX credit_expiration_idx ON creditTransaction(expirationDate)
WHERE expirationDate IS NOT NULL;
-- 原因：月度 cron 任务需快速定位到期积分

-- 3. payment 表：组合索引优化分布式查询
CREATE INDEX payment_user_status_idx ON payment(userId, status);
CREATE INDEX payment_customer_paid_idx ON payment(customerId, paid);
-- 原因：常见查询模式：按用户查支付 + 按客户查支付状态

-- 4. session 表：清理过期会话
CREATE INDEX session_expires_at_idx ON session(expiresAt)
WHERE expiresAt < NOW();
-- 原因：定期清理过期会话时快速定位
```

### 7.3 表大小预估

假设 SaaS 应用运营 2 年，1 万活跃用户：

| 表名 | 预估行数 | 大小 | 增长率 |
|------|---------|------|--------|
| user | 50K | ~10 MB | 月增 5K |
| session | 150K | ~20 MB | 每天重建 |
| account | 60K | ~12 MB | 月增 5K |
| payment | 100K | ~25 MB | 月增 500-2K |
| creditTransaction | 500K | ~80 MB | 月增 10K-50K |
| verification | 50K | ~8 MB | 需定期清理 |

**总计**：~155 MB（小型应用，适合单体 PostgreSQL）

---

## 八、安全性分析

### 8.1 认证安全

✅ **优秀实践**：
- 密码加密：account.password 使用加密（Better Auth）
- 会话管理：session 表记录 IP、User-Agent 用于异常检测
- 邮箱验证：verification 表支持邮箱验证流程
- 社交登录：支持 OAuth 2.0，减少密码泄露风险

### 8.2 支付安全

✅ **防护措施**：
- Webhook 签名验证：Stripe 签名必须验证，防止伪造
- 幂等性设计：invoiceId 唯一约束，防止重复支付
- 状态机：paid 字段防止在支付前扣费

⚠️ **潜在风险**：
1. **Race Condition**：多个 webhook 同时到达时
   ```javascript
   // 危险：检查-操作非原子
   let payment = await db.query('SELECT * FROM payment WHERE invoiceId = ?', [id]);
   if (!payment.invoiceId) {
       await db.insert('payment', {...});  // 可能重复
   }
   ```
   **修复**：使用 UPSERT 或 INSERT ON CONFLICT
   ```sql
   INSERT INTO payment (...) VALUES (...)
   ON CONFLICT (invoiceId) DO NOTHING;
   ```

2. **customerId 同步**：user.customerId 与 Stripe 不同步时
   ```typescript
   // 见 stripe.ts 第 86-94 行，有修复逻辑
   // 但并非最佳实践，建议增加同步 cron job
   ```

### 8.3 数据隐私

✅ **实现**：
- 级联删除：删除用户时自动清理所有相关数据
- IP 隐私：会话 IP 仅用于审计，未用于广告

⚠️ **GDPR 合规**：
- 缺乏数据导出功能（Data Export）
- 缺乏删除审计日志（需加密或脱敏）

---

## 九、常见问题与故障排查

### Q1：用户反映不能登录

**诊断步骤**：
```sql
-- 1. 检查用户是否被禁用
SELECT * FROM user WHERE email = 'user@example.com';
-- 检查 banned 和 banExpires 字段

-- 2. 检查会话是否过期
SELECT * FROM session WHERE userId = 'user_id' 
ORDER BY createdAt DESC LIMIT 5;
-- 检查 expiresAt 是否在 NOW() 之前

-- 3. 检查账户是否存在
SELECT * FROM account WHERE userId = 'user_id';
-- 检查是否有对应的登录方式（credentials 或 OAuth）

-- 4. 清理过期会话
DELETE FROM session WHERE expiresAt < NOW();
```

### Q2：支付未到账，用户未获得积分

**诊断步骤**：
```sql
-- 1. 检查 payment 是否有对应记录
SELECT * FROM payment WHERE invoiceId = 'stripe_invoice_id';

-- 2. 检查 paid 状态是否为 true
SELECT id, paid, status FROM payment WHERE userId = 'user_id'
ORDER BY createdAt DESC LIMIT 10;

-- 3. 检查 creditTransaction 是否有对应增加记录
SELECT * FROM creditTransaction WHERE userId = 'user_id'
ORDER BY createdAt DESC LIMIT 10;

-- 4. 检查 userCredit 是否更新
SELECT currentCredits FROM userCredit WHERE userId = 'user_id';

-- 修复：如果 paid=false 但实际已支付，手动修复
BEGIN;
UPDATE payment SET paid = true WHERE id = 'payment_id';
INSERT INTO creditTransaction (...) VALUES (...);
UPDATE userCredit SET currentCredits = currentCredits + 100 WHERE userId = 'user_id';
COMMIT;
```

### Q3：日志显示 "duplicate invoiceId" 错误

**原因**：Stripe webhook 重复发送导致  
**解决**：
```sql
-- 检查是否真的重复
SELECT invoiceId, COUNT(*) FROM payment 
GROUP BY invoiceId HAVING COUNT(*) > 1;

-- 删除重复记录（仅在确认后）
DELETE FROM payment WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY invoiceId ORDER BY id DESC) 
    AS rn FROM payment
  ) WHERE rn > 1
);
```

---

## 十、最佳实践与改进建议

### 10.1 立即行动的改进

**优先级：高**

1. **添加缺失索引**
   ```sql
   CREATE INDEX verification_identifier_idx ON verification(identifier);
   CREATE INDEX verification_expires_at_idx ON verification(expiresAt);
   ```

2. **添加会话清理 Cron Job**
   ```typescript
   // 每天 3 点执行
   cron('0 3 * * *', async () => {
     const db = await getDb();
     await db.delete(session).where(lt(session.expiresAt, new Date()));
   });
   ```

3. **添加验证表清理**
   ```typescript
   cron('0 4 * * *', async () => {
     const db = await getDb();
     await db.delete(verification)
       .where(lt(verification.expiresAt, new Date()));
   });
   ```

### 10.2 中期优化

**优先级：中**

1. **使用事务处理支付**
   ```typescript
   // 确保原子性
   await db.transaction(async (tx) => {
     await tx.update(payment).set({ paid: true });
     await tx.insert(creditTransaction).values({...});
     await tx.update(userCredit).set({
       currentCredits: sql`current_credits + ${amount}`
     });
   });
   ```

2. **添加积分过期 Cron Job**
   ```typescript
   cron('0 0 * * *', async () => {
     const expiredTransactions = await db
       .select()
       .from(creditTransaction)
       .where(and(
         lt(creditTransaction.expirationDate, new Date()),
         isNull(creditTransaction.expirationDateProcessedAt)
       ));
     
     // 批量更新
     for (const tx of expiredTransactions) {
       await db.update(creditTransaction)
         .set({ expirationDateProcessedAt: new Date() })
         .where(eq(creditTransaction.id, tx.id));
       
       await db.update(userCredit)
         .set({
           currentCredits: sql`current_credits - ${tx.amount}`
         })
         .where(eq(userCredit.userId, tx.userId));
     }
   });
   ```

3. **客户端缓存优化**
   ```typescript
   // userCredit 变化不频繁，可以缓存 5 分钟
   const credit = await cache(
     () => getUserCredit(userId),
     { key: `credit:${userId}`, ttl: 300 }
   );
   ```

### 10.3 长期架构优化

**优先级：低**

1. **积分系统独立**
   - 考虑将 creditTransaction 分库到独立的 OLAP 系统
   - 保持 userCredit 在线 OLTP 库中

2. **加入消息队列**
   ```
   Stripe Webhook ──> MQ ──> 消费者处理积分分配
   (可靠投递)         (异步解耦)
   ```

3. **缓存层**
   ```
   Redis Cache ──┐
                ├── userCredit (读多写少)
   PostgreSQL ──┘
   ```

4. **GDPR 合规**
   - 添加 user_audit_log 表，记录数据变更
   - 实现数据导出接口
   - 实现数据匿名化逻辑

---

## 十一、ER 图完整版（文本格式）

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    MkSaaS 数据库完整关系图                                 │
├──────────────────────────────────────────────────────────────────────────┤
│
│  认证子系统                           支付子系统
│  ───────────────────────────────────────────────────────────────
│
│                      ┌─────────────────┐
│                      │     user        │ ◄─────────────────┐
│                      ├─────────────────┤                   │
│                      │ id (PK)         │                   │
│                      │ email (UQ)      │                   │
│                      │ name            │                   │
│                      │ role            │                   │
│                      │ banned          │                   │
│                      │ customer_id ────┼────────────┐      │
│                      │ created_at      │            │      │
│                      │ updated_at      │            │      │
│                      └────────┬────────┘            │      │
│                               │                     │      │
│              ┌────────────────┼────────────────┐    │      │
│              │                │                │    │      │
│         ┌────▼────────┐  ┌────▼────────┐ ┌────▼──────────┐│
│         │  session    │  │  account    │ │   payment    ││
│         ├─────────────┤  ├─────────────┤ ├──────────────┤│
│         │ id (PK)     │  │ id (PK)     │ │ id (PK)      ││
│         │ user_id(FK) │  │ user_id(FK) │ │ user_id(FK) ─┼┘
│         │ token (UQ)  │  │ provider_id │ │ customer_id  │
│         │ ip_address  │  │ account_id  │ │ price_id     │
│         │ user_agent  │  │ password    │ │ stripe_data* │
│         │ expires_at  │  │ *_token     │ │ status       │
│         └─────────────┘  └─────────────┘ │ paid (idx)   │
│                                          │ scene        │
│                                          │ session_id   │
│         ┌──────────────┐                 │ invoice_id   │
│         │verification │                 │   (UNIQUE)   │
│         ├──────────────┤                 └──────┬───────┘
│         │ id (PK)      │                        │
│         │ identifier   │                        │
│         │ value        │                   ┌────▼──────────────┐
│         │ expires_at   │                   │creditTransaction  │
│         └──────────────┘                   ├───────────────────┤
│                                            │ id (PK)           │
│                                            │ user_id(FK)       │
│                                            │ type              │
│                                            │ amount            │
│                                            │ payment_id(FK)    │
│                                            │ expiration_date   │
│                                            └────┬──────────────┘
│                                                 │
│                                                 │ 关联
│                                                 │
│                                            ┌────▼──────────────┐
│                                            │   userCredit      │
│                                            ├───────────────────┤
│                                            │ id (PK)           │
│                                            │ user_id(FK+UQ)    │
│                                            │ current_credits   │
│                                            │ updated_at        │
│                                            └───────────────────┘
│
│ FK = Foreign Key (外键)     PK = Primary Key (主键)
│ UQ = Unique (唯一约束)      idx = Index (有索引)
│ * = Stripe 相关字段
│
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 十二、总结与评分

### 数据库设计质量评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 规范化程度 | 8/10 | 正常化良好，个别可优化（userCredit + user 合并） |
| 性能设计 | 7/10 | 索引覆盖全面，部分表缺索引需优化 |
| 可扩展性 | 8/10 | 支付场景分类清晰，积分系统可独立扩展 |
| 安全性 | 7/10 | 认证完善，支付有防重，缺 GDPR 合规 |
| 可维护性 | 8/10 | 表设计清晰，缺乏文档和审计日志 |
| **总体** | **7.6/10** | 优秀的中型 SaaS 架构，有改进空间 |

### 核心优势

✅ Better Auth 的企业级认证  
✅ Stripe 防重的幂等性设计  
✅ 积分系统的 Ledger Pattern  
✅ 全面的索引覆盖  
✅ 级联删除的数据一致性

### 改进空间

⚠️ 缺少 GDPR 审计日志  
⚠️ 验证表缺索引  
⚠️ 缺乏消息队列解耦  
⚠️ customerId 同步逻辑不够可靠  
⚠️ 缺乏完整数据导出接口

---

