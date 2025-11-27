# 支付和积分系统 - 流程图和架构图

## 1. 完整支付流程图

```
┌─────────────────────────────────────────────────────────────────────┐
│                       用户支付全流程                                  │
└─────────────────────────────────────────────────────────────────────┘

1. 用户发起支付
   │
   ├─ 选择套餐 (Free/Pro/Lifetime)
   ├─ 或选择积分包
   └─ 点击"购买"/"升级"按钮
       │
       ▼
2. 创建结账会话 (Server Action)
   │
   ├─ 验证套餐/价格存在
   ├─ 创建/获取 Stripe 客户
   └─ 创建 Stripe Checkout Session
       │
       ▼
3. 重定向到 Stripe
   │
   └─ 用户输入支付信息
       │
       ▼
4. Stripe 处理支付
   │
   ├─ 验证支付方式
   ├─ 扣款
   └─ 返回成功
       │
       ▼
5. Webhook: checkout.session.completed
   │
   ├─ 创建 payment 记录
   ├─ paid = false (等待 invoice.paid)
   └─ 保存 sessionId 和 invoiceId
       │
       ▼
6. Webhook: 订阅相关事件 (仅订阅)
   │
   ├─ customer.subscription.created
   ├─ customer.subscription.updated
   └─ 更新订阅信息
       │
       ▼
7. Webhook: invoice.paid (关键!)
   │
   ├─ 查找 payment 记录 (有重试机制)
   ├─ 更新: paid = true, status = 'completed'
   │
   ├─ 如果是订阅:
   │  └─ addSubscriptionCredits() 分配积分
   │
   ├─ 如果是一次性:
   │  ├─ 是积分购买? → addCredits() 分配
   │  └─ 是终身计划? → addLifetimeMonthlyCredits() + 通知
   │
   └─ 用户获得权益/积分
       │
       ▼
8. 用户重定向回应用
   │
   └─ 支付完成，显示成功页面
```

---

## 2. 积分消费流程

```
┌────────────────────────────────────────┐
│       用户消费积分流程                   │
└────────────────────────────────────────┘

1. 用户执行需要积分的操作
   │
   ├─ 例: 生成图片、翻译文本等
   └─ 前端调用 consumeCreditsAction
       │
       ▼
2. 验证阶段
   │
   ├─ 获取用户当前余额
   ├─ 检查: balance >= 需要消费的积分?
   │
   ├─ NO → 返回错误 "Insufficient credits"
   │
   └─ YES → 继续
       │
       ▼
3. FIFO 消费策略
   │
   ├─ 查询用户的所有积分交易
   │  ├─ 排除 USAGE 和 EXPIRE 记录
   │  ├─ 只选 remainingAmount > 0
   │  └─ 只选未过期的 (expirationDate > now)
   │
   ├─ 按过期时间排序 (最先过期的优先)
   ├─ 再按创建时间排序 (FIFO)
   │
   └─ 依次消费:
       │
       for transaction in sortedTransactions:
         │
         ├─ remainingInThisTransaction = transaction.remainingAmount
         ├─ amountToDeduct = min(remainingInThisTransaction, stillNeedToDeduct)
         │
         ├─ UPDATE creditTransaction
         │  └─ remainingAmount -= amountToDeduct
         │
         └─ stillNeedToDeduct -= amountToDeduct
           │
           ├─ stillNeedToDeduct == 0? → 停止
           └─ 继续处理下一笔
       │
       ▼
4. 更新用户积分余额
   │
   ├─ newBalance = currentCredits - 需要消费的积分
   └─ UPDATE userCredit SET currentCredits = newBalance
       │
       ▼
5. 记录消费交易
   │
   ├─ INSERT INTO creditTransaction
   │  ├─ type = 'USAGE'
   │  ├─ amount = -<needed_amount>
   │  ├─ remainingAmount = NULL (消费记录不跟踪)
   │  └─ description = '<用户指定的描述>'
   │
   └─ 操作完成
```

---

## 3. 积分分配流程 (Cron Job)

```
┌──────────────────────────────────────────────────────┐
│    distributeCreditsToAllUsers() - 每月执行一次       │
└──────────────────────────────────────────────────────┘

1. 处理过期积分 (先)
   │
   └─ batchProcessExpiredCredits()
       │
       ├─ 查找所有用户中有过期积分的
       ├─ 按 batch 处理 (100 用户/批)
       │
       for userId in batch:
         │
         ├─ 查找所有过期了的交易
         │  ├─ expirationDate < now
         │  ├─ expirationDateProcessedAt IS NULL
         │  └─ remainingAmount > 0
         │
         ├─ 更新交易: remainingAmount = 0, expirationDateProcessedAt = now
         ├─ 减少用户余额
         └─ 记录 EXPIRE 交易
       │
       └─ 完成
           │
           ▼
2. 分类所有用户
   │
   ├─ 查询所有 active 用户 + 他们的最新支付记录
   │
   for user in allUsers:
     │
     ├─ 有有效支付记录?
     │  │
     │  ├─ status = 'active' OR 'trialing'? → 有订阅
     │  ├─ status = 'completed'? → 有终身/一次性
     │  └─ NO 支付? → 免费用户
     │
     ├─ 判断套餐类型:
     │  │
     │  ├─ isLifetime? → lifetimeUsers.push(userId, priceId)
     │  ├─ yearly subscription? → yearlyUsers.push(userId, priceId)
     │  └─ NO subscription? → freeUsers.push(userId)
     │
     └─ 分类完成
           │
           ▼
3. 分配免费用户月度积分
   │
   └─ batchAddMonthlyFreeCredits(freeUserIds)
       │
       for batch in freeUserIds (每 100 个):
         │
         ├─ 获取免费套餐配置
         │  └─ 检查: isFree && credits.enable?
         │
         ├─ 确定可领取的用户
         │  │
         │  for userId in batch:
         │    │
         │    └─ canAddCreditsByType(userId, MONTHLY_REFRESH)?
         │       ├─ 检查该用户本月是否已领过
         │       └─ 没领过 → 加入 eligibleUserIds
         │
         ├─ 批量插入交易记录
         │  └─ INSERT creditTransaction (批量)
         │
         ├─ 批量更新用户积分
         │  ├─ 新用户: INSERT userCredit
         │  └─ 老用户: UPDATE userCredit (每个单独更新)
         │
         └─ 下一批
           │
           ▼
4. 分配终身用户月度积分
   │
   └─ batchAddLifetimeMonthlyCredits(lifetimeUsers)
       │
       ├─ 按 priceId 分组 (支持多个终身计划)
       │
       for priceId in priceIds:
         │
         ├─ 获取该 priceId 对应的套餐配置
         │  └─ 检查: isLifetime && credits.enable?
         │
         ├─ 对该 priceId 的所有用户进行分配
         │  │
         │  for batch in userIds (每 100 个):
         │    │
         │    ├─ 确定可领取的用户 (本月未领过)
         │    ├─ 批量插入交易记录
         │    └─ 更新用户积分
         │
         └─ 下一个 priceId
           │
           ▼
5. 分配年度订阅用户月度积分
   │
   └─ batchAddYearlyUsersMonthlyCredits(yearlyUsers)
       │
       ├─ 按 priceId 分组
       │
       for priceId in priceIds:
         │
         ├─ 获取套餐配置
         ├─ 分配积分 (类似终身流程)
         │
         └─ 下一个 priceId
           │
           ▼
6. 完成
   │
   └─ 返回统计信息
      ├─ 处理的用户数
      ├─ 错误数
      └─ 过期的积分总数
```

---

## 4. Stripe Webhook 处理流程

```
┌────────────────────────────────────────────────────┐
│     POST /api/webhooks/stripe                      │
└────────────────────────────────────────────────────┘

1. 接收请求
   │
   ├─ payload = request.body (raw text)
   ├─ signature = headers['stripe-signature']
   │
   ├─ 验证:
   │  ├─ payload 存在?
   │  └─ signature 存在?
   │
   └─ YES → 继续
       │
       ▼
2. 验证签名并解析事件
   │
   ├─ event = stripe.webhooks.constructEvent(payload, signature, secret)
   ├─ eventType = event.type
   │
   └─ 分发处理
       │
       ├─────────────────────────┬────────────────────────┬──────────────────┐
       │                         │                        │                  │
       ▼                         ▼                        ▼                  ▼
   订阅相关                  发票相关                  Checkout 相关
   
   3a. customer.subscription.created
       │
       └─ onCreateSubscription()
           └─ 仅记录日志

   3b. customer.subscription.updated
       │
       └─ onUpdateSubscription()
           │
           ├─ 获取 subscription 信息
           ├─ 构建 update 字段
           │  ├─ priceId
           │  ├─ status
           │  ├─ periodStart/periodEnd
           │  ├─ cancelAtPeriodEnd
           │  ├─ trialStart/trialEnd
           │  └─ interval
           │
           └─ UPDATE payment WHERE subscriptionId = subscription.id

   3c. customer.subscription.deleted
       │
       └─ onDeleteSubscription()
           │
           └─ UPDATE payment (status = 'canceled')

   3d. invoice.paid (关键!)
       │
       └─ onInvoicePaid()
           │
           ├─ findPaymentRecordWithRetry(invoice)
           │  │
           │  for attempt = 1 to MAX_ATTEMPTS:
           │    │
           │    ├─ 按 invoiceId 查找
           │    ├─ 找到? → 返回
           │    ├─ 找不到? → 
           │    │  └─ attempt < MAX_ATTEMPTS?
           │    │     └─ 延迟后重试
           │    │
           │    └─ attempt == MAX_ATTEMPTS → 返回 null (错误)
           │
           ├─ paymentRecord 存在? → 继续，否则抛错
           │
           ├─ 判断支付类型
           │  │
           │  ├─ type == SUBSCRIPTION?
           │  │  │
           │  │  └─ updateSubscriptionPayment(invoice, paymentRecord)
           │  │     │
           │  │     ├─ 获取 Stripe Subscription 详情
           │  │     ├─ UPDATE payment: paid = true, 其他信息
           │  │     └─ processSubscriptionPurchase()
           │  │        └─ addSubscriptionCredits()
           │  │
           │  └─ type == ONE_TIME?
           │     │
           │     └─ updateOneTimePayment(invoice, paymentRecord)
           │        │
           │        ├─ UPDATE payment: paid = true, status = 'completed'
           │        ├─ 检查 metadata.type
           │        │
           │        ├─ type == 'credit_purchase'?
           │        │  └─ processCreditPurchase()
           │        │     └─ addCredits() 分配积分
           │        │
           │        └─ 是终身计划?
           │           └─ processLifetimePlanPurchase()
           │              ├─ addLifetimeMonthlyCredits()
           │              └─ sendNotification()

   3e. checkout.session.completed
       │
       └─ onCheckoutCompleted()
           │
           ├─ session.mode == 'subscription'?
           │  │
           │  └─ createSubscriptionPaymentRecord()
           │     │
           │     ├─ 获取 Stripe Subscription 信息
           │     ├─ INSERT payment (paid = false)
           │     └─ 保存 subscriptionId, invoiceId 等
           │
           └─ session.mode == 'payment'?
              │
              └─ createOneTimePaymentRecord()
                 │
                 ├─ 从 metadata 获取 priceId
                 ├─ 确定 scene (credit 或 lifetime)
                 └─ INSERT payment (paid = false)

       │
       ▼
4. 返回响应
   │
   ├─ 成功 → HTTP 200 { received: true }
   └─ 失败 → HTTP 400 { error: '...' }
```

---

## 5. 系统数据流

```
┌──────────────────────────────────────────────────────────────┐
│                 数据流向                                      │
└──────────────────────────────────────────────────────────────┘

用户端
  │
  ├─ createCheckoutSession (Server Action)
  │  └─ → Stripe API → Checkout Session URL
  │
  ├─ consumeCreditsAction (Server Action)
  │  └─ → Database: update userCredit, insert creditTransaction
  │
  ├─ getCreditBalanceAction (Server Action)
  │  └─ ← Database: query userCredit.currentCredits
  │
  ├─ getCreditStatsAction (Server Action)
  │  └─ ← Database: sum(creditTransaction.remainingAmount)
  │
  └─ getCreditTransactionsAction (Server Action)
     └─ ← Database: query creditTransaction with pagination/search

前端 (React Hooks)
  │
  ├─ useCreditBalance()
  │  └─ useQuery → getCreditBalanceAction
  │
  ├─ useConsumeCredits()
  │  └─ useMutation → consumeCreditsAction
  │     └─ onSuccess: invalidateQueries
  │
  ├─ useCreditTransactions()
  │  └─ useQuery → getCreditTransactionsAction
  │
  ├─ useCurrentPlan()
  │  └─ useQuery → getCurrentPlanAction
  │
  └─ usePaymentCompletion()
     └─ useQuery (polling) → checkPaymentCompletionAction

后台 (Webhook)
  │
  └─ Stripe Webhooks
     │
     ├─ checkout.session.completed
     │  └─ → INSERT payment
     │
     ├─ customer.subscription.* events
     │  └─ → UPDATE payment
     │
     └─ invoice.paid (关键)
        │
        ├─ → UPDATE payment (paid = true)
        ├─ → addSubscriptionCredits/addCredits/addLifetimeMonthlyCredits
        │  └─ → UPDATE userCredit, INSERT creditTransaction
        └─ → sendNotification()

后台 (Cron Job)
  │
  └─ distributeCreditsToAllUsers() (每月执行)
     │
     ├─ → batchProcessExpiredCredits()
     │  └─ → UPDATE creditTransaction, UPDATE userCredit
     │
     ├─ → batchAddMonthlyFreeCredits()
     │  └─ → INSERT creditTransaction, UPDATE/INSERT userCredit
     │
     ├─ → batchAddLifetimeMonthlyCredits()
     │  └─ → INSERT creditTransaction, UPDATE/INSERT userCredit
     │
     └─ → batchAddYearlyUsersMonthlyCredits()
        └─ → INSERT creditTransaction, UPDATE/INSERT userCredit
```

---

## 6. 数据库关系图

```
┌──────────────────────────────────────────────────────────────┐
│              数据表关系                                       │
└──────────────────────────────────────────────────────────────┘

                    ┌─────────────┐
                    │    user     │
                    │  (Already)  │
                    │             │
                    │ - id (PK)   │
                    │ - email     │
                    │ - name      │
                    │ - customerId(FK) ──┐
                    └────────┬────┘      │
                             │          │
              ┌──────────────┼──────────┬─────────────┐
              │              │          │             │
              ▼              ▼          ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐
        │ payment  │  │userCredit│  │creditTx  │  │   Stripe    │
        │          │  │          │  │          │  │  Customer   │
        ├──────────┤  ├──────────┤  ├──────────┤  └─────────────┘
        │id (PK)   │  │id (PK)   │  │id (PK)   │
        │priceId   │  │userId(FK)───→userId(FK)───→userId(FK)
        │type      │  │currentCr │  │type      │
        │scene     │  │lastRefresh│  │amount    │
        │interval  │  │createdAt │  │remaining │
        │userId(FK)───→         │  │paymentId │
        │customerId│  │updatedAt │  │expiresAt │
        │subscriptId│ └──────────┘  │processedAt│
        │sessionId │              └──────────┘
        │invoiceId │ (unique)
        │status    │              (Stripe)
        │paid      │         ┌─────────────────┐
        │periodStart│         │  Subscription   │
        │periodEnd │         │  (in Stripe)    │
        │cancelAt.. │         │                 │
        │trialStart │         │ - status        │
        │trialEnd  │         │ - period_start  │
        │createdAt │         │ - period_end    │
        │updatedAt │         │ - cancel_at...  │
        └──────────┘         │ - trial_start   │
                             │ - trial_end     │
        Indexes:             └─────────────────┘
        - payment_user_id_idx
        - payment_invoice_id_idx (UNIQUE)
        - payment_subscription_id_idx
        - payment_status_idx
        - payment_paid_idx

        Indexes:
        - credit_transaction_user_id_idx
        - credit_transaction_type_idx
```

---

## 7. 支付状态机

```
┌────────────────────────────────────────────────────────────┐
│         支付记录的生命周期 (payment 表的状态)                │
└────────────────────────────────────────────────────────────┘

订阅支付:
    
    [new payment]
         │
         ├─ checkout.session.completed
         │  ├─ status = subscription.status (trialing/incomplete/active)
         │  ├─ paid = false
         │  └─ [Waiting for invoice.paid]
         │
         ├─ customer.subscription.updated (可选, 多次)
         │  └─ 更新 status, periodStart/periodEnd 等
         │
         └─ invoice.paid (关键!)
            ├─ paid = true
            ├─ status = 'active' | 'trialing' | ...
            └─ 积分已分配

    续费时:
    [existing payment with status='active']
         │
         ├─ customer.subscription.updated
         │  └─ 更新周期
         │
         └─ invoice.paid
            ├─ 更新周期
            ├─ 分配续费积分
            └─ status 保持不变

    取消时:
    [existing payment]
         │
         ├─ customer.subscription.updated
         │  ├─ cancel_at_period_end = true
         │  └─ status 保持 'active' (直到周期结束)
         │
         └─ customer.subscription.deleted (在周期结束时)
            ├─ status = 'canceled'
            └─ 用户失去权限

一次性支付:
    
    [new payment]
         │
         ├─ checkout.session.completed
         │  ├─ status = 'completed'
         │  ├─ paid = false
         │  └─ [Waiting for invoice.paid]
         │
         └─ invoice.paid
            ├─ paid = true
            ├─ status = 'completed'
            ├─ 分配积分或权限
            └─ [终态]
```

---

## 8. 积分余额追踪

```
┌────────────────────────────────────────────────────────────┐
│         用户积分余额的变化                                   │
└────────────────────────────────────────────────────────────┘

时间轴:

[用户注册]
  │
  ├─ userCredit.currentCredits = 0
  └─ creditTransaction [REGISTER_GIFT]: +100, remaining=100
         │
         └─ userCredit.currentCredits = 100 ✓

[用户订阅 Pro (月度)]
  │
  ├─ invoice.paid event
  ├─ addSubscriptionCredits()
  └─ creditTransaction [SUBSCRIPTION_RENEWAL]: +50, remaining=50
         │
         └─ userCredit.currentCredits = 150 ✓

[用户消费 10 积分]
  │
  ├─ consumeCredits(10)
  ├─ FIFO: 从最早的积分开始消费
  │  ├─ 如果是 [REGISTER_GIFT: remaining=100]
  │  │  └─ UPDATE remaining: 100 → 90
  │  └─ 减少 10 不必要的消费
  │
  ├─ creditTransaction [USAGE]: -10, remaining=NULL
  └─ userCredit.currentCredits = 140 ✓

[检查余额]
  │
  ├─ SELECT sum(remainingAmount) 
  │  └─ from creditTransaction 
  │     where type != 'USAGE' AND type != 'EXPIRE'
  │     AND expirationDate IS NULL OR expirationDate > NOW()
  │
  └─ 结果: 90 (REGISTER_GIFT) + 50 (SUBSCRIPTION) = 140 ✓

[积分过期处理 (30 天后)]
  │
  ├─ processExpiredCredits()
  ├─ 如果 REGISTER_GIFT 超过 30 天
  │  └─ UPDATE [REGISTER_GIFT]: remaining = 100 → 0
  │
  ├─ creditTransaction [EXPIRE]: -90, remaining=NULL
  └─ userCredit.currentCredits = 50 ✓

最终:
  userCredit.currentCredits = 50
  │
  ├─ 实际来源:
  │  └─ SUBSCRIPTION_RENEWAL: remaining = 50
  │
  └─ 验证:
     SELECT SUM(CASE 
       WHEN type IN ('REGISTER_GIFT', 'SUBSCRIPTION_RENEWAL') 
            AND expirationDate > NOW()
       THEN remainingAmount
       ELSE 0
     END) = 50 ✓
```

---

## 9. 错误处理和重试机制

```
┌────────────────────────────────────────────────────────────┐
│    Webhook 处理中的重试机制                                  │
└────────────────────────────────────────────────────────────┘

invoice.paid event 处理失败的场景:

场景 1: Race Condition (正常)
   Timeline:
   T0: invoice.paid event 发送
   T1: invoice.paid webhook 处理开始
        └─ 查找 payment 记录
           └─ 找不到! (checkout.session.completed 还未处理)
   T2: checkout.session.completed webhook 处理开始
        └─ INSERT payment 成功
   
   Solution: invoice.paid handler 有重试机制
   ├─ Attempt 1: 找不到
   ├─ Wait 100ms
   ├─ Attempt 2: 找不到
   ├─ Wait 100ms
   ├─ Attempt 3: 找不到
   ├─ Wait 100ms
   ├─ Attempt 4: 找不到
   ├─ Wait 100ms
   ├─ Attempt 5: 找到!
   └─ 处理成功

场景 2: 数据库连接失败
   │
   └─ 整个异常抛给 Stripe
      └─ Stripe 将自动重试 (exponential backoff)

场景 3: 业务逻辑错误
   │
   ├─ 例: 积分分配失败
   │  │
   │  └─ 日志记录详细错误信息
   │  └─ 异常抛给 Stripe (返回 4xx/5xx)
   │
   └─ 后续可手动重试或修复

场景 4: 重复处理 (已处理过)
   │
   ├─ 检查: payment.paid == true?
   │  └─ 已处理过 → 不再分配积分
   │
   ├─ OR 检查 invoiceId unique constraint
   │  └─ 若重复插入会违反约束
   │
   └─ 安全的 idempotent 操作
```

---

## 10. 关键指标和监控

```
┌────────────────────────────────────────────────────────────┐
│    应该监控的关键指标                                        │
└────────────────────────────────────────────────────────────┘

支付相关:
  ├─ 支付成功率
  │  ├─ Metric: payment_success_rate
  │  ├─ Target: > 99.5%
  │  └─ Alert: < 99%
  │
  ├─ Webhook 处理延迟
  │  ├─ Metric: webhook_processing_latency_ms
  │  ├─ Alert: > 5000ms (P95)
  │  └─ Watch: invoice.paid vs checkout.session.completed 间隔
  │
  ├─ 失败的 payment 记录查询次数
  │  ├─ Metric: payment_record_lookup_failures
  │  ├─ Alert: > 5 per day
  │  └─ Indicates: potential race condition issues
  │
  └─ Stripe 同步差异
     ├─ Metric: payment_stripe_mismatch
     ├─ Check: payment.status vs stripe.subscription.status
     └─ Alert: any mismatch

积分相关:
  ├─ 积分消费成功率
  │  ├─ Metric: credit_consumption_success_rate
  │  ├─ Target: 100%
  │  └─ Alert: < 99.9%
  │
  ├─ 余额准确性
  │  ├─ Metric: user_credit_balance_accuracy
  │  ├─ Calculation:
  │  │  userCredit.currentCredits 
  │  │  == 
  │  │  SUM(remainingAmount) 
  │  │    FROM creditTransaction 
  │  │    WHERE type NOT IN ('USAGE', 'EXPIRE')
  │  │    AND (expirationDate IS NULL OR expirationDate > NOW())
  │  │
  │  └─ Alert: any mismatch = data corruption!
  │
  ├─ 分配任务执行时间
  │  ├─ Metric: credit_distribution_duration_ms
  │  ├─ Alert: > 5 minutes (abnormal)
  │  └─ Watch: especially for large user bases
  │
  ├─ 过期积分处理
  │  ├─ Metric: expired_credits_count
  │  ├─ Alert: if not processed within expected time
  │  └─ Track: total expired vs processed
  │
  └─ 积分余额分布
     ├─ Metric: user_credit_balance_percentiles
     ├─ p50, p75, p95, p99
     └─ Helps: understand usage patterns

业务指标:
  ├─ 订阅转换率
  │  ├─ Metric: subscription_conversion_rate
  │  ├─ Calculation: active_subscriptions / checkout_sessions
  │  └─ Target: > 5%
  │
  ├─ 积分包购买频率
  │  ├─ Metric: credit_package_purchases_per_month
  │  ├─ Track: by package size
  │  └─ ARPU: average revenue per user
  │
  ├─ 用户留存率
  │  ├─ Metric: subscription_churn_rate
  │  ├─ Alert: > 10% monthly
  │  └─ Analyze: which cohorts churn
  │
  └─ 免费用户活跃度
     ├─ Metric: free_user_monthly_active_rate
     └─ Target: > 20% (of free users)
```

