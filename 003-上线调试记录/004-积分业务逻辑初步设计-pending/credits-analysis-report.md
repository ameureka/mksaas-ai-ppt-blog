# 积分业务逻辑深度分析与诊断报告

**生成时间**: 2025-12-12
**核心模块**: `src/credits/*`, `src/payment/*`

---

## 一、 现状分析 (Status Quo)

### 1.1 数据模型 (Data Model)
*   **双表结构**: `user_credit` (快照余额) + `credit_transaction` (流水明细)。
*   **FIFO 消费**: 实现了先进先出逻辑，优先扣除即将过期的积分 (`consumeCredits`)。
*   **有效期管理**: 每笔入账都有独立的 `expirationDate`，支持不同来源不同有效期（如赠送积分 30 天，购买积分永久）。

### 1.2 积分来源 (Sources)
目前实现了以下获取渠道：
1.  **注册赠送**: `REGISTER_GIFT` (在 `auth.ts` 的 `onCreateUser` 钩子中触发)。
2.  **每月免费**: `MONTHLY_REFRESH` (Free 用户每月重置)。
3.  **订阅分发**: `SUBSCRIPTION_RENEWAL` (订阅用户每月自动发放)。
4.  **一次性购买**: `PURCHASE_PACKAGE` (通过 `stripeInvoiceId` 关联)。
5.  **看广告**: `AD_REWARD` (虽然代码有逻辑，但前端入口被关闭)。

### 1.3 分发机制 (Distribution Mechanism)
目前的分发逻辑在 `src/credits/distribute.ts` 中，主要依赖 **Cron Job (定时任务)**。
*   `distributeCreditsToAllUsers`: 这是一个**极其消耗资源**的大函数。
    *   它会拉取全量用户 + 全量支付记录。
    *   在内存中匹配用户状态。
    *   批量写入数据库。
*   **风险**: 随着用户量增长，这个函数会迅速遇到内存溢出 (OOM) 或超时问题。

---

## 二、 核心缺陷与痛点 (Pain Points)

### 🚨 1. 支付与积分的“即时性”脱节
*   **现象**: 用户在 Stripe 付款成功购买了 Credit Package，回到网站后，积分可能**不会立即到账**。
*   **原因**: 目前似乎依赖 Webhook 或定时任务来写入积分，缺乏一个**支付成功后同步写入积分**的强一致性回调逻辑。如果 Webhook 延迟，用户就会焦虑。

### 🚨 2. “每月自动发放”的触发机制脆弱
*   **现象**: Pro 用户的每月积分依赖 `distributeCreditsToAllUsers` 定时运行。如果定时任务挂了（Cron 失败），或者脚本超时，用户当月的积分就没了。
*   **原因**: 被动式分发（Push）。更好的做法是**“懒加载”式分发（Pull）**：当用户在每个月**首次登录**或**首次请求积分接口**时，检查是否已发，未发则补发。

### 🚨 3. 缺乏“退款/撤销”机制
*   **现象**: 如果 Stripe 发生退款 (Refund) 或争议 (Dispute)，已发放的积分**不会自动扣回**。
*   **原因**: 现在的逻辑只有“加分”和“消费”，没有处理 Stripe `charge.refunded` 事件来触发“负向交易”。

---

## 三、 改进方案设计 (Improvement Plan)

我们需要从“定时任务驱动”转向**“事件驱动 + 懒加载”**的混合模式。

### 3.1 方案 A：支付即时到账 (Real-time Payment)
在 Stripe Webhook (`checkout.session.completed`) 中，直接调用 `addCredits`。

*   **逻辑**:
    1.  收到 Webhook。
    2.  解析 `metadata` (包含 `userId`, `creditAmount`)。
    3.  写入 `payment` 表 (status=paid)。
    4.  **同步**写入 `credit_transaction` (type=PURCHASE)。
    5.  更新 `user_credit`。

### 3.2 方案 B：订阅积分“懒发放” (Lazy Distribution)
废弃沉重的 `distributeCreditsToAllUsers` Cron Job。

*   **逻辑**:
    1.  用户登录或访问 Dashboard。
    2.  调用 `checkAndDistributeMonthlyCredits(userId)`。
    3.  检查：
        *   用户是否是 Pro/Lifetime？
        *   本月 (`YYYY-MM`) 是否已有 `SUBSCRIPTION_RENEWAL` 类型的记录？
    4.  如果符合条件且未发 -> **立即补发** -> 返回最新余额。
*   **优势**: 流量削峰，从集中式压力变为分散式压力，且用户感知度更强（“登录领积分”）。

### 3.3 方案 C：退款自动扣除 (Refund Handling)
*   **逻辑**:
    1.  监听 Stripe `charge.refunded` Webhook。
    2.  找到对应的 `paymentId` (即 `stripeInvoiceId`)。
    3.  查询该 Payment 对应的积分交易。
    4.  执行 `consumeCredits` (扣除等额积分)，如果余额不足，则允许扣成负数（作为惩罚/追债）。

---

## 四、 总结

目前的积分系统**“能用但脆弱”**。它在小规模数据下运行良好，但随着用户量和并发量的增加，**定时任务分发**将成为最大的瓶颈。

**建议优先级**:
1.  **P0**: 确保 Stripe Webhook **实时**触发积分入账 (解决“买了没到账”的问题)。
2.  **P1**: 实现 **“懒发放”** 逻辑，替代全量 Cron Job (解决性能隐患)。
3.  **P2**: 处理退款逻辑 (闭环商业逻辑)。
