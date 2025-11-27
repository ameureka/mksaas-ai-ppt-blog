# QA-9.0 收益模式

## 📋 问题
项目的建立收益模式是什么？

## ✅ 回答

项目建立了 **完整的 SaaS 收益模式**，包括**订阅付费**、**一次性购买**和**积分系统**，并预留了**联盟营销**和**广告集成**接口。

### 💰 核心收益来源

#### 1. 订阅计划（主要收益）

**配置**: `src/config/website.tsx`

**定价结构**:

```typescript
price: {
  plans: {
    // 免费计划
    free: {
      id: 'free',
      isFree: true,
      prices: [],
      credits: {
        enable: true,
        amount: 50,          // 注册赠送 50 积分
        expireDays: 30       // 30 天过期
      }
    },

    // Pro 计划（月付/年付）
    pro: {
      id: 'pro',
      popular: true,
      prices: [
        {
          type: 'subscription',
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
          amount: 990,       // $9.90/月
          interval: 'month'
        },
        {
          type: 'subscription',
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY,
          amount: 9900,      // $99.00/年（节省 $19.80，约 17% 折扣）
          interval: 'year'
        }
      ],
      credits: {
        enable: true,
        amount: 1000,        // 每月 1000 积分
        expireDays: 30
      }
    },

    // 终身计划（一次性付费）
    lifetime: {
      id: 'lifetime',
      isLifetime: true,
      prices: [
        {
          type: 'one_time',
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME,
          amount: 19900,     // $199.00 一次性
          allowPromotionCode: true  // 支持优惠码
        }
      ],
      credits: {
        enable: true,
        amount: 1000,        // 每月 1000 积分（终身）
        expireDays: 30
      }
    }
  }
}
```

**来源**: `src/config/website.tsx`

**收益预测**:

| 用户规模 | 免费用户 | Pro 月付 | Pro 年付 | 终身 | 月收入估算 |
|---------|---------|---------|---------|------|-----------|
| 1,000 | 900 (90%) | 50 (5%) | 30 (3%) | 20 (2%) | $990 |
| 10,000 | 9,000 (90%) | 500 (5%) | 300 (3%) | 200 (2%) | $9,900 |
| 100,000 | 90,000 (90%) | 5,000 (5%) | 3,000 (3%) | 2,000 (2%) | $99,000 |

**计算公式**:
```
月收入 = (Pro月付用户 × $9.90) + (Pro年付用户 × $99/12) + (终身用户 × $0)
```

**注意**: 终身用户不计入月经常性收入（MRR），但计入年度经常性收入（ARR）。

#### 2. 积分包（辅助收益）

**配置**: `src/config/website.tsx`

```typescript
credits: {
  enableCredits: false,           // 默认禁用，可启用
  enablePackagesForFreePlan: false,
  registerGiftCredits: {
    enable: true,
    amount: 50,
    expireDays: 30
  },
  packages: {
    // 基础包
    basic: {
      id: 'basic',
      amount: 100,
      expireDays: 30,
      price: {
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDITS_BASIC,
        amount: 990,             // $9.90
        allowPromotionCode: true
      }
    },

    // 标准包（推荐）
    standard: {
      id: 'standard',
      popular: true,
      amount: 200,
      expireDays: 30,
      price: {
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDITS_STANDARD,
        amount: 1490,            // $14.90
        allowPromotionCode: true
      }
    },

    // 高级包
    premium: {
      id: 'premium',
      amount: 500,
      expireDays: 30,
      price: {
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDITS_PREMIUM,
        amount: 3990,            // $39.90
        allowPromotionCode: true
      }
    },

    // 企业包
    enterprise: {
      id: 'enterprise',
      amount: 1000,
      expireDays: 30,
      price: {
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDITS_ENTERPRISE,
        amount: 6990,            // $69.90
        allowPromotionCode: true
      }
    }
  }
}
```

**来源**: `src/config/website.tsx`

**使用场景**:
- 免费用户积分用完后购买
- Pro 用户额外购买（月度积分不够）
- 大量使用 AI 功能的用户

**收益潜力**:
```
假设 10% 的免费用户每月购买 1 次基础包
10,000 免费用户 × 10% × $9.90 = $9,900/月
```

#### 3. 联盟营销（预留，可选）

**支持的平台**:

**Affonso**:
```typescript
features: {
  enableAffonsoAffiliate: false  // 默认禁用
}
```

**环境变量**:
```bash
NEXT_PUBLIC_AFFILIATE_AFFONSO_ID=""
```

**来源**: `src/config/website.tsx`, `env.example`

**PromoteKit**:
```typescript
features: {
  enablePromotekitAffiliate: false  // 默认禁用
}
```

**环境变量**:
```bash
NEXT_PUBLIC_AFFILIATE_PROMOTEKIT_ID=""
```

**来源**: `src/config/website.tsx`, `env.example`

**组件**: `src/components/affiliate/`

```
affiliate/
├── affonso.tsx       // Affonso 集成
└── promotekit.tsx    // PromoteKit 集成
```

**来源**: `src/components/affiliate/`

**收益模式**:
- 推荐用户获得佣金（通常 20-30%）
- 建立推广者网络
- 低成本获客

**潜在收益**:
```
假设通过联盟营销获取 20% 的付费用户，支付 25% 佣金
500 付费用户 × $9.90 × 20% × 25% = $247.50/月（佣金支出）
净收益 = 500 × $9.90 × 20% × 75% = $742.50/月
```

#### 4. 邮箱营销（用户增长）

**时事通讯系统**:

```typescript
newsletter: {
  enable: true,
  provider: 'resend',
  autoSubscribeAfterSignUp: true  // 自动订阅新用户
}
```

**来源**: `src/config/website.tsx`

**功能**:
- ✅ 自动订阅新用户
- ✅ Resend Audience 管理
- ✅ 订阅/取消订阅 API

**Server Actions**:
```typescript
src/actions/
├── subscribe-newsletter.ts      // 订阅
├── unsubscribe-newsletter.ts    // 取消订阅
└── check-newsletter-status.ts   // 检查状态
```

**来源**: `src/actions/`

**收益潜力**:
- 产品更新通知
- 新功能推广
- 促销活动（如限时折扣）
- 用户教育（提高留存）

**转化提升**:
```
假设邮箱营销提高 5% 的免费到付费转化率
10,000 免费用户 × 5% × $9.90 = $4,950/月
```

### 📊 收益模式对比

| 收益来源 | 类型 | 启用状态 | 收益潜力 | 实施难度 |
|---------|------|---------|---------|---------|
| 订阅计划 | 经常性收入 | ✅ 已启用 | 高 | 已完成 |
| 积分包 | 一次性收入 | 🔄 可选 | 中 | 已完成 |
| 终身计划 | 一次性收入 | ✅ 已启用 | 中 | 已完成 |
| 联盟营销 | 推广佣金 | 🔄 可选 | 中 | 已预留 |
| 邮箱营销 | 转化提升 | ✅ 已启用 | 中 | 已完成 |
| 广告集成 | 展示广告 | ❌ 未实施 | 低 | 未实施 |

### 💡 高级收益功能

#### 1. 优惠码支持

```typescript
prices: [
  {
    type: 'one_time',
    amount: 19900,
    allowPromotionCode: true  // Stripe 优惠码支持
  }
]
```

**使用场景**:
- 限时促销
- 推广活动
- VIP 折扣

**来源**: `src/config/website.tsx`

#### 2. 收入追踪（DataFast）

```typescript
features: {
  enableDatafastRevenueTrack: false  // 默认禁用
}
```

**环境变量**:
```bash
NEXT_PUBLIC_DATAFAST_WEBSITE_ID=""
NEXT_PUBLIC_DATAFAST_DOMAIN=""
```

**来源**: `src/config/website.tsx`, `env.example`

**功能**:
- 收入归因
- 用户价值分析
- 营销 ROI 追踪

#### 3. Stripe 客户门户

**功能**: 用户自助管理订阅

**Server Action**: `src/actions/create-customer-portal-session.ts`

```typescript
createCustomerPortalAction
  输入: { returnUrl: string }
  输出: { url: string }
```

**功能**:
- ✅ 查看订阅状态
- ✅ 更新支付方式
- ✅ 取消订阅
- ✅ 查看发票历史
- ✅ 下载发票

**来源**: `src/actions/create-customer-portal-session.ts`

**好处**: 降低客服成本，提高用户满意度

### 📈 收益增长策略

#### 1. 免费到付费转化

**策略**:
- 赠送注册积分（50 积分）
- 积分过期机制（30 天）
- 升级提示（Upgrade Card）
- 功能限制（如 AI 次数）

**配置**:
```typescript
features: {
  enableUpgradeCard: false  // 升级卡片提示
}
```

**来源**: `src/config/website.tsx`

#### 2. 年付鼓励

**策略**:
- 年付折扣（$99/年 vs $118.80/年，节省 17%）
- 一次性支付便利
- 长期承诺

**计算**:
```
月付年总价: $9.90 × 12 = $118.80
年付价格: $99.00
节省: $19.80 (17% 折扣)
```

#### 3. 终身计划

**策略**:
- 高价值感知（$199）
- 长期用户锁定
- 口碑传播

**LTV 分析**:
```
假设用户平均使用 3 年
月付 LTV: $9.90 × 36 = $356.40
年付 LTV: $99.00 × 3 = $297.00
终身 LTV: $199.00（一次性）

终身计划相当于 20 个月的 Pro 月付
```

#### 4. 积分消费模式

**设计**:
- AI 聊天：1 积分/消息
- AI 图片生成：5 积分/张
- 网页分析：2 积分/次

**目标**: 鼓励用户购买更多积分或升级

### 💳 支付处理

**提供商**: Stripe

**功能**:
- ✅ 信用卡支付
- ✅ 自动扣款（订阅）
- ✅ 发票生成
- ✅ 退款处理
- ✅ Webhook 事件
- ✅ 客户门户

**Webhook 处理**: `src/app/api/webhooks/stripe/route.ts`

**处理的事件**:
- `checkout.session.completed` - 支付成功
- `customer.subscription.updated` - 订阅更新
- `customer.subscription.deleted` - 订阅取消
- `invoice.paid` - 发票支付
- `invoice.payment_failed` - 支付失败

**来源**: `src/app/api/webhooks/stripe/route.ts`

### 🎯 收益优化建议

1. **启用积分系统** - 为 AI 功能计费
2. **A/B 测试定价** - 优化价格点
3. **添加企业计划** - $49-99/月，更多功能
4. **实施推荐计划** - 双方奖励
5. **季度付费选项** - $27/季（$9/月）
6. **团队计划** - 多用户共享

### 📊 财务健康指标

**关键指标**:
- **MRR** (月经常性收入) - 订阅收入总和
- **ARR** (年经常性收入) - MRR × 12
- **ARPU** (平均每用户收入) - MRR / 活跃付费用户
- **LTV** (客户终身价值) - ARPU × 平均订阅月数
- **CAC** (客户获取成本) - 营销支出 / 新客户数
- **LTV/CAC** - 理想比例 > 3:1
- **流失率** - 每月取消订阅的用户百分比
- **扩展收入** - 升级和追加销售

**目标**:
- MRR 增长率: > 20%/月（早期）
- 流失率: < 5%/月
- LTV/CAC: > 3:1
- 付费转化率: > 2%

## 📍 信息来源
- `src/config/website.tsx` - 定价和功能配置
- `src/payment/` - 支付集成
- `src/credits/` - 积分系统
- `src/actions/` - 支付相关 Server Actions
- `src/app/api/webhooks/stripe/route.ts` - Webhook 处理
- `env.example` - 支付和营销配置
- `src/components/affiliate/` - 联盟营销组件
