# 管理后台与核心业务页面深度分析报告

**生成时间**: 2025-12-12
**分析范围**: 管理后台 (Admin), 用户设置 (Settings), 支付流程 (Payment)

---

## 一、 核心配置与常量定义

### 1.1 全局配置
- **位置**: `src/config/website.tsx`
- **关键控制**:
  - `credits.enableCredits`: 积分系统总开关 (决定 `settings/credits` 是否可用)。
  - `payment.provider`: 支付提供商 (目前仅支持 `stripe`)。
  - `price.plans`: 价格方案定义 (Free, Pro, Lifetime)。

### 1.2 业务常量
- **位置**: `src/lib/constants/`
- **I18N 映射**: `src/lib/constants/ppt-i18n.ts` (定义了 Admin 界面大量硬编码的中文文案，这部分**未完全**走 `messages/*.json`，是一个潜在的国际化一致性问题)。

---

## 二、 数据库核心 Schema 分析

### 2.1 用户与鉴权 (`user`)
- **表名**: `user`
- **状态**: 基础字段完备 (`id`, `email`, `role`, `banned`)。
- **关联**: 被 `session`, `account` (OAuth), `payment`, `credit_transaction` 等表通过外键引用。

### 2.2 积分系统 (`user_credit`, `credit_transaction`)
- **设计模式**: 复式记账 (Snapshot + Ledger)。
- **表结构**:
  - `user_credit`: 存储当前余额快照 (`current_credits`)，用于快速读取。
  - `credit_transaction`: 存储流水，包含过期时间 (`expiration_date`) 和 关联发票 (`stripe_invoice_id`)。
- **优点**: 读写分离，快照表提供高性能读取，流水表保证数据可追溯。

### 2.3 内容管理 (`ppt`)
- **特色**: 集成向量搜索。
- **关键字段**: `embedding` (vector 1024), `embedding_status`, `download_count`.
- **索引**: 针对 `status`, `created_at`, `download_count` 建有复合索引，优化排序查询。

---

## 三、 各模块数据链路深度追踪

### 3.1 👥 用户管理 (Admin - Users)
- **页面**: `src/app/[locale]/(protected)/admin/users/page.tsx`
- **现状**: **❌ 严重依赖 Mock 数据**
- **数据链路**:
  1. **Hook**: `useGetUsers` (React Query)
  2. **Action**: `getUsers` (`src/actions/ppt/user.ts`)
  3. **逻辑**:
     - 代码中直接引用 `mockUsers`。
     - 包含 `await delay(500)` 模拟延迟。
     - **没有**连接真实数据库。
- **SQL 分析**: 无 (纯内存操作)。

### 3.2 📊 统计看板 (Admin - Stats)
- **页面**: `src/app/[locale]/(protected)/admin/stats/page.tsx`
- **现状**: **⚠️ 混合模式 (Real Summary + Mock Charts)**
- **数据链路**:
  1. **摘要数据 (Real)**: 调用 `getDashboardStats` (`src/actions/ppt/stats.ts`)。
     - **SQL**:
       ```sql
       SELECT COUNT(*) as totalPPTs, SUM(download_count) as totalDownloads, SUM(view_count) as totalViews FROM ppt;
       SELECT COUNT(*) as totalUsers FROM user;
       ```
  2. **图表数据 (Mock)**: 直接导入 `mockStats` (下载趋势、分类分布均为假数据)。

### 3.3 📂 PPT 内容管理 (Admin - PPT)
- **页面**: `src/app/[locale]/(protected)/admin/ppt/page.tsx` (推测，基于 Action 分析)
- **现状**: **✅ 真实数据**
- **Action**: `getPPTs` (`src/actions/ppt/ppt.ts`)
- **逻辑**:
  - 自动处理中文搜索变体 (`getChineseVariants`)。
  - 强制过滤软删除 (`deleted_at IS NULL`)。
  - **亮点**: 创建/更新 PPT 时，异步触发 `generateAndPersist` 生成向量 Embedding。
- **SQL 示例**:
  ```sql
  SELECT * FROM ppt 
  WHERE deleted_at IS NULL 
    AND (title ILIKE '%关键词%' OR description ILIKE '%关键词%')
  ORDER BY download_count DESC, id DESC 
  LIMIT 12 OFFSET 0;
  ```

### 3.4 💰 积分与交易 (Settings - Credits)
- **页面**: `src/app/[locale]/(protected)/settings/credits/page.tsx`
- **现状**: **✅ 真实数据**
- **Action**: `getCreditTransactionsAction` (`src/actions/get-credit-transactions.ts`)
- **逻辑**:
  - 使用 `zod` 严格校验分页和过滤参数。
  - 支持多字段排序 (`sorting` 参数映射到 `drizzle` 字段)。
  - 搜索逻辑覆盖了 `type`, `description` (文本) 和 `amount` (数值)。

### 3.5 💳 支付状态轮询 (Payment)
- **页面**: `src/app/[locale]/(protected)/payment/page.tsx`
- **现状**: **✅ 真实数据**
- **Action**: `checkPaymentCompletionAction`
- **逻辑**:
  - 前端 `usePaymentCompletion` 进行轮询 (Interval)。
  - 后端查询 `payment` 表的 `paid` 字段。
  - 支付成功后，前端自动清理 React Query 缓存 (`invalidateQueries`) 并跳转。

---

## 四、 架构数据流图

```mermaid
graph TD
    User[用户] --> |访问| Page[Next.js Page Component]
    Page --> |调用| Hook[Custom Hook / React Query]
    Hook --> |请求| ServerAction[Server Action (use server)]
    
    subgraph "Backend Layer"
        ServerAction --> |校验| Zod[Zod Schema Validation]
        Zod --> |ORM调用| Drizzle[Drizzle ORM]
        Drizzle --> |SQL| DB[(PostgreSQL)]
    end

    subgraph "Special Flows"
        ActionPPT[Create/Update PPT] --> |Async| VectorService[Embedding Service]
        VectorService --> |Update| DB
        
        PaymentPage --> |Poll| CheckPayment[Check Payment Status]
        CheckPayment --> |Query| DB
    end

    subgraph "Mock Gaps"
        ActionUser[getUsers Action] -.-> |Mock Data| MockUser[mockUsers Array]
        PageStats[Stats Page] -.-> |Mock Data| MockChart[mockStats Object]
    end
```

---

## 五、 优缺点与风险分析

### ✅ 优点
1.  **类型安全**: 全面使用 TypeScript + Zod，前后端接口定义清晰。
2.  **ORM 封装优秀**: Drizzle 查询构建清晰，利用了 `userActionClient` 统一处理错误和上下文。
3.  **异步向量生成**: PPT 创建流程并未阻塞 Embedding 生成，用户体验好。
4.  **支付闭环**: 支付状态轮询 + 缓存自动失效机制，保证了用户付款后 UI 的即时一致性。

### ⚠️ 潜在风险 & 缺点
1.  **用户管理是假的**: Admin 后台看到的“用户列表”完全是 Mock 数据，无法管理真实注册用户。上线后管理员将无法封禁用户或查看真实注册量。
2.  **统计图表误导**: 首页 Dashboard 的趋势图是假的，无法反映真实运营状况。
3.  **I18N 分裂**: Admin 部分文案定义在 `constants/ppt-i18n.ts`，未走标准的 `messages/*.json` 流程，导致多语言支持不完整。

---

## 六、 改进建议 (Action Plan)

### 🚀 短期 (上线前必做)
1.  **重构用户管理 Action**: 将 `src/actions/ppt/user.ts` 中的 `getUsers`, `banUser` 等方法替换为真实 Drizzle 查询，连接 `user` 表。
2.  **对接真实统计图表**: 修改 `src/actions/ppt/stats.ts`，增加按天聚合 (`GROUP BY date_trunc('day', created_at)`) 的查询，替换 `mockStats`。

### 📅 中期 (优化)
1.  **统一 I18N**: 将 `src/lib/constants/ppt-i18n.ts` 内容迁移至 `messages/zh.json` 和 `en.json`。
2.  **性能优化**: `useGetUsers` 目前设计为全量或简单分页，如果用户量大，需确保数据库索引 `(email)`, `(username)` 命中。

---

## 七、 相关文件清单
- `src/app/[locale]/(protected)/admin/users/page.tsx`
- `src/actions/ppt/user.ts` (**需重构**)
- `src/app/[locale]/(protected)/admin/stats/page.tsx`
- `src/actions/ppt/stats.ts`
- `src/app/[locale]/(protected)/settings/credits/page.tsx`
- `src/actions/get-credit-transactions.ts`
- `src/db/schema.ts`
