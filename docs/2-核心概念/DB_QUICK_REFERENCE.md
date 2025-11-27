# MkSaaS 数据库快速参考指南

## 表概览速查表

### 1. user (用户表)
```
┌─────────────────────────────────────────────────────────┐
│ 用途: 核心用户数据存储                                    │
├─────────────────────────────────────────────────────────┤
│ 关键字段:                                               │
│  • id (PK): UUID，用户唯一标识                          │
│  • email (UQ): 邮箱，唯一                               │
│  • customerId: Stripe 客户 ID，支付关联                 │
│  • role: 用户角色 (admin, user)                         │
│  • banned: 是否被禁用                                   │
│                                                         │
│ 索引: id, customer_id, role                            │
│ 外键: ← session, account, payment, userCredit, creditTransaction │
└─────────────────────────────────────────────────────────┘
```

### 2. session (会话表)
```
┌─────────────────────────────────────────────────────────┐
│ 用途: 用户登录会话管理                                    │
├─────────────────────────────────────────────────────────┤
│ 关键字段:                                               │
│  • token (UQ): 会话令牌                                  │
│  • expiresAt: 过期时间 (需定期清理)                     │
│  • ipAddress/userAgent: 安全审计                       │
│  • userId (FK): 外键到 user                             │
│                                                         │
│ 索引: token (UQ), user_id                              │
│ 特点: 一个用户可有多个会话 (多设备登录)                 │
└─────────────────────────────────────────────────────────┘
```

### 3. account (登录方式表)
```
┌─────────────────────────────────────────────────────────┐
│ 用途: 管理多种登录方式 (邮密码、Google、GitHub)           │
├─────────────────────────────────────────────────────────┤
│ 关键字段:                                               │
│  • providerId: 'credentials' | 'google' | 'github'      │
│  • accountId: 社交提供商的用户 ID                        │
│  • password: 密码 hash (仅 credentials)                 │
│  • accessToken/refreshToken: OAuth tokens              │
│  • userId (FK): 外键到 user                             │
│                                                         │
│ 索引: user_id, account_id, provider_id                 │
│ 特点: 一个用户可有多个登录方式                          │
└─────────────────────────────────────────────────────────┘
```

### 4. verification (验证表)
```
┌─────────────────────────────────────────────────────────┐
│ 用途: 邮箱验证、密码重置等验证流程                        │
├─────────────────────────────────────────────────────────┤
│ 关键字段:                                               │
│  • identifier: 验证对象 (邮箱、手机)                     │
│  • value: 验证码/token                                  │
│  • expiresAt: 过期时间 (15-30分钟)                      │
│                                                         │
│ 索引: 【⚠️ 缺少索引】                                    │
│ 特点: 无外键，允许未注册邮箱验证                        │
│       需定期清理过期记录                                │
└─────────────────────────────────────────────────────────┘
```

### 5. payment (支付记录表)
```
┌─────────────────────────────────────────────────────────┐
│ 用途: Stripe 支付交易追踪，核心业务表                     │
├─────────────────────────────────────────────────────────┤
│ 关键字段:                                               │
│  • priceId: Stripe price ID                             │
│  • type: 'subscription' | 'one-time'                    │
│  • scene: 'lifetime' | 'credit' | 'subscription'        │
│  • status: 'pending' | 'active' | 'completed'           │
│  • paid: 支付完成标记 (false 或 true)                    │
│  • invoiceId (UQ): Stripe 发票 ID，防重关键字段         │
│  • sessionId: Checkout session ID                       │
│  • customerId: Stripe 客户 ID                           │
│  • subscriptionId: Stripe 订阅 ID                       │
│  • periodStart/periodEnd: 计费周期                      │
│  • trialStart/trialEnd: 试用期                          │
│  • userId (FK): 外键到 user                             │
│                                                         │
│ 索引 (10个): type, scene, status, paid, user_id, 等     │
│ 特点: 最复杂的表，完整的支付生命周期管理                │
│       invoiceId UNIQUE 防止重复支付                     │
└─────────────────────────────────────────────────────────┘
```

### 6. userCredit (用户积分表)
```
┌─────────────────────────────────────────────────────────┐
│ 用途: 快速查询用户当前积分余额                            │
├─────────────────────────────────────────────────────────┤
│ 关键字段:                                               │
│  • userId (FK+UQ): 与 user 1:1 关系                     │
│  • currentCredits: 当前有效积分数                       │
│  • updatedAt: 最后更新时间                              │
│                                                         │
│ 索引: user_id (UQ)                                      │
│ 特点: 1:1 关系，快速查询 O(1)                           │
│       积分详情通过 creditTransaction 查看               │
└─────────────────────────────────────────────────────────┘
```

### 7. creditTransaction (积分交易表)
```
┌─────────────────────────────────────────────────────────┐
│ 用途: 积分增减明细，完整的审计日志                        │
├─────────────────────────────────────────────────────────┤
│ 关键字段:                                               │
│  • type: 'add' | 'consume' | 'expire'                  │
│  • amount: 增减数量 (正数或负数)                         │
│  • remainingAmount: 交易后的余额                        │
│  • description: 交易描述                                │
│  • paymentId: 关联的 payment.invoiceId                  │
│  • expirationDate: 积分过期时间                         │
│  • expirationDateProcessedAt: 过期处理时间              │
│  • userId (FK): 外键到 user                             │
│                                                         │
│ 索引: user_id, type                                     │
│ 特点: Ledger Pattern，完整的历史审计                    │
│       支持积分到期、过期处理                            │
└─────────────────────────────────────────────────────────┘
```

---

## 常用查询速查

### 用户相关

```sql
-- 1. 获取用户完整信息（包括登录方式）
SELECT u.*, a.providerId 
FROM user u
LEFT JOIN account a ON u.id = a.userId
WHERE u.email = 'user@example.com';

-- 2. 获取用户的所有登录方式
SELECT providerId, accountId 
FROM account 
WHERE userId = $1;

-- 3. 获取用户的活跃会话（按设备识别）
SELECT id, token, ipAddress, userAgent, expiresAt 
FROM session 
WHERE userId = $1 
AND expiresAt > NOW()
ORDER BY createdAt DESC;

-- 4. 禁用/解禁用户
UPDATE user 
SET banned = true, banReason = '违反服务条款'
WHERE id = $1;
```

### 支付相关

```sql
-- 1. 获取用户最新的支付状态
SELECT * FROM payment 
WHERE userId = $1 
ORDER BY createdAt DESC LIMIT 1;

-- 2. 获取用户的所有有效订阅（Active）
SELECT * FROM payment 
WHERE userId = $1 
AND status = 'active'
AND paid = true;

-- 3. 获取待处理的支付（未完成）
SELECT * FROM payment 
WHERE paid = false 
AND createdAt < NOW() - INTERVAL '24 hours';

-- 4. 按支付场景统计收入
SELECT 
  scene,
  COUNT(*) as count,
  SUM(amount) as total -- 需要从 price 表获取
FROM payment 
WHERE paid = true 
AND status IN ('active', 'completed')
AND createdAt >= NOW() - INTERVAL '30 days'
GROUP BY scene;

-- 5. 检查是否存在重复支付
SELECT invoiceId, COUNT(*) 
FROM payment 
GROUP BY invoiceId 
HAVING COUNT(*) > 1;
```

### 积分相关

```sql
-- 1. 获取用户当前积分余额
SELECT currentCredits 
FROM userCredit 
WHERE userId = $1;

-- 2. 获取用户的积分交易历史
SELECT * FROM creditTransaction 
WHERE userId = $1 
ORDER BY createdAt DESC;

-- 3. 获取用户的待过期积分
SELECT SUM(amount) as expiring_credits
FROM creditTransaction 
WHERE userId = $1 
AND expirationDate IS NOT NULL
AND expirationDate < NOW()
AND expirationDateProcessedAt IS NULL;

-- 4. 处理过期的积分
UPDATE creditTransaction 
SET expirationDateProcessedAt = NOW()
WHERE userId = $1 
AND expirationDate < NOW()
AND expirationDateProcessedAt IS NULL;

-- 5. 统计用户的积分消费趋势
SELECT 
  DATE_TRUNC('day', createdAt) as date,
  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as added,
  SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as consumed
FROM creditTransaction 
WHERE userId = $1 
GROUP BY DATE_TRUNC('day', createdAt)
ORDER BY date DESC;
```

---

## 数据一致性检查清单

### 支付一致性检查

```sql
-- 检查：每个已支付的 payment 都有对应的 creditTransaction
SELECT p.id, p.userId, p.paid
FROM payment p
WHERE p.paid = true 
AND p.scene IN ('lifetime', 'credit', 'subscription')
AND NOT EXISTS (
  SELECT 1 FROM creditTransaction ct 
  WHERE ct.paymentId = p.invoiceId
);

-- 检查：userCredit 余额是否等于 creditTransaction 总和
SELECT 
  u.id,
  uc.currentCredits as recorded,
  COALESCE(SUM(ct.amount), 0) as calculated
FROM user u
LEFT JOIN userCredit uc ON u.id = uc.userId
LEFT JOIN creditTransaction ct ON u.id = ct.userId
GROUP BY u.id, uc.currentCredits
HAVING uc.currentCredits <> COALESCE(SUM(ct.amount), 0);

-- 检查：user.customerId 与 Stripe 是否同步
SELECT u.id, u.customerId, COUNT(p.id) as payment_count
FROM user u
LEFT JOIN payment p ON u.customerId = p.customerId
WHERE u.customerId IS NOT NULL
GROUP BY u.id, u.customerId;
```

### 会话清理

```sql
-- 删除过期会话
DELETE FROM session 
WHERE expiresAt < NOW();

-- 删除过期验证记录
DELETE FROM verification 
WHERE expiresAt < NOW();

-- 检查孤立记录（无对应用户）
SELECT 'session' as table_name, COUNT(*) as count
FROM session s
WHERE NOT EXISTS (SELECT 1 FROM user u WHERE u.id = s.userId)
UNION ALL
SELECT 'account', COUNT(*)
FROM account a
WHERE NOT EXISTS (SELECT 1 FROM user u WHERE u.id = a.userId)
UNION ALL
SELECT 'payment', COUNT(*)
FROM payment p
WHERE NOT EXISTS (SELECT 1 FROM user u WHERE u.id = p.userId);
```

---

## 性能优化建议汇总

### 立即添加索引

```sql
-- 1. verification 表 (缺索引，影响邮箱验证性能)
CREATE INDEX verification_identifier_idx ON verification(identifier);
CREATE INDEX verification_expires_at_idx ON verification(expiresAt);

-- 2. creditTransaction 表 (积分过期处理)
CREATE INDEX credit_expiration_idx ON creditTransaction(expirationDate)
WHERE expirationDate IS NOT NULL;

-- 3. 组合索引优化 payment 表
CREATE INDEX payment_user_status_idx ON payment(userId, status);
CREATE INDEX payment_customer_paid_idx ON payment(customerId, paid);

-- 4. session 过期清理
CREATE INDEX session_expires_at_idx ON session(expiresAt)
WHERE expiresAt < NOW();
```

### 定期维护任务 (Cron Jobs)

```
每天 03:00 - 清理过期会话
每天 04:00 - 清理过期验证记录
每天 00:00 - 处理过期积分
每周 01:00 - 索引维护和统计更新
```

---

## 字段值约定表

### payment.type
| 值 | 含义 | 说明 |
|----|------|------|
| subscription | 订阅 | 周期性支付，产生 subscriptionId |
| one-time | 单次 | 一次性支付 |

### payment.scene
| 值 | 含义 | 适用 | 积分分配 |
|----|------|------|---------|
| lifetime | 终身会员 | one-time | 高额+终身额外积分 |
| credit | 积分包 | one-time | 等额积分 |
| subscription | 订阅 | subscription | 月/年额定积分 |

### payment.status
| 值 | 含义 | 触发事件 |
|----|------|---------|
| pending | 待支付 | checkout session 创建 |
| active | 已激活 | invoice.paid (订阅) |
| trialing | 试用中 | trial 开始 |
| completed | 已完成 | invoice.paid (单次) |
| canceled | 已取消 | subscription.deleted |

### creditTransaction.type
| 值 | 含义 | amount | 说明 |
|----|------|--------|------|
| add | 增加 | 正数 | 支付、退款、赠送 |
| consume | 消费 | 负数 | 使用功能 |
| expire | 过期 | 负数 | 积分过期清算 |

---

## 故障排查决策树

```
支付/积分异常？
├─ 用户找不到支付记录？
│  ├─ 检查 payment 表 WHERE invoiceId = 'stripe_id'
│  └─ 检查 sessionId 是否正确传递
│
├─ 支付显示但未分配积分？
│  ├─ 检查 paid 字段是否为 true
│  ├─ 检查 creditTransaction 是否有对应记录
│  └─ 检查 userCredit 是否已更新
│
└─ 积分数量错误？
   ├─ SUM(creditTransaction.amount) = userCredit.currentCredits?
   ├─ 是否有过期未处理的积分？
   └─ 是否有并发消费导致的不一致？

用户无法登录？
├─ 检查 user 表 banned 字段
├─ 检查 account 表是否有对应登录方式
├─ 检查 session 是否过期 (expiresAt < NOW)
└─ 检查邮箱验证状态 (emailVerified)

会话异常？
├─ 检查 token 是否唯一 (可能被篡改)
├─ 检查 expiresAt 是否过期
├─ 检查 userId 是否有效
└─ 考虑删除过期会话并让用户重新登录
```

---

