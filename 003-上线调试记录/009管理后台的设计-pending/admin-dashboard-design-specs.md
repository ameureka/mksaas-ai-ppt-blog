# 管理员后台 (Admin Dashboard) 深度功能设计与实现方案

**生成时间**: 2025-12-12
**核心目标**: 从“Mock 演示版”转型为具备**用户全生命周期管理**、**业务健康监控**和**内容运营干预**能力的实战型后台。

---

## 一、 现状扫描与问题定义

| 模块 | 现状描述 | 真实度 | 评价 | 改进方向 |
| :--- | :--- | :--- | :--- | :--- |
| **PPT 内容管理** | 功能完备，支持 CRUD 及向量生成。 | ✅ **真实** | **优秀** | 保持现状。 |
| **用户管理** | 列表为 Mock 数据，无法搜索/封禁。 | ❌ **Mock** | **不可用** | **P0 级重构**：连接真实数据库。 |
| **数据统计** | 总数真实，但趋势图为静态假数据。 | ⚠️ **混合** | **误导** | **P2 级优化**：基于时间轴的真实聚合。 |
| **运营工具** | 数据库有表但无界面 (搜索日志/热词)。 | ⬜ **空白** | **缺失** | **P1 级新增**：热词配置与少结果词监控。 |
| **客服能力** | 无法处理用户投诉（如补发积分）。 | ⬜ **空白** | **缺失** | **P0 级新增**：人工调分功能。 |

---

## 二、 详细功能设计方案

### 🛠️ 模块一：用户管理重构 (User Management 2.0)

**目标**: 废弃 `mockUsers`，连接真实的 `user` 表与 `user_credit` 表，赋予管理员“上帝视角”。

#### 1. 数据聚合层 (Server Action)
**文件**: `src/actions/admin/user.ts` (新建)
**逻辑**: 关联查询用户基础信息、积分余额及会员状态。

```typescript
// 伪代码逻辑
export async function getAdminUsers({ page, pageSize, search }) {
  // 1. 构建过滤 (支持邮箱/姓名模糊搜素)
  const whereClause = search ? or(ilike(email, search), ilike(name, search)) : undefined;

  // 2. 联表查询 User + Credit
  const users = await db.select({
    user: user,
    credits: userCredit.currentCredits
  })
  .from(user)
  .leftJoin(userCredit, eq(user.id, userCredit.userId))
  .where(whereClause)
  .limit(pageSize).offset(offset);
  
  return { users, total };
}
```

#### 2. 前端界面 (UI)
**页面**: `/admin/users/page.tsx`
**组件**: `UserTable`
*   **列定义**: User (Avatar+Name+Email), Credits (🪙 Number), Status (Badge), Joined At.
*   **操作列**:
    *   `Ban/Unban`: 封禁/解封用户。
    *   `Adjust Credits`: 唤起调分弹窗。

---

### 🛠️ 模块二：人工调分与补偿 (Manual Credit Adjustment)

**目标**: 赋予管理员直接修改用户积分的能力，用于活动赠送或客诉处理，必须留痕。

#### 1. 后端逻辑 (Server Action)
**文件**: `src/actions/admin/credits.ts` (新建)
**逻辑**: 复用核心积分服务，新增 `ADMIN_ADJUSTMENT` 交易类型。

```typescript
export async function adminAdjustCredits(userId, amount, reason) {
  // 1. 鉴权: 确保 session.user.role === 'admin'
  // 2. 调用 addCredits
  await addCredits({
    userId,
    amount, // 正数加分，负数扣分
    type: 'ADMIN_ADJUSTMENT', // 需在 types.ts 中新增此枚举
    description: `Admin: ${reason}`,
    expireDays: 365 // 管理员赠送积分默认有效期较长
  });
}
```

#### 2. 前端交互 (Dialog)
**组件**: `AdjustCreditDialog`
*   **输入**: 调整类型 (+/-), 数量, 原因 (必填)。
*   **反馈**: 成功后 Toast 提示并刷新列表。

---

### 🛠️ 模块三：搜索与内容运营 (Search Operations)

**目标**: 利用已有的 `search_log` 和 `hot_keywords` 表，提供数据洞察与干预能力。

#### 1. 搜索日志看板 (`/admin/search-logs`)
**逻辑**: 聚合查询，不展示流水，只展示趋势。
*   **Top Queries**: `GROUP BY keyword ORDER BY count DESC` (看用户想找什么)。
*   **Zero Results**: `WHERE result_count = 0` (看我们缺什么)。这直接指导内容生产。

#### 2. 热词配置 (`/admin/hot-keywords`)
**逻辑**: 对 `pinned_keywords` 表进行 CRUD。
*   **功能**: 管理员手动置顶关键词（如“年终总结”），直接干预前台搜索框下的推荐词。

---

## 三、 技术实现路径与 ASCII 预览

### 1. ASCII 界面预览：用户管理列表

```text
+-----------------------------------------------------------------------+
| User Management                                    [🔍 Search Email ] |
+-----------------------------------------------------------------------+
| User                | Role  | Credits | Status  | Actions             |
+---------------------+-------+---------+---------+---------------------+
| 👤 Alice (Pro)      | user  | 🪙 1200 | ✅ Active| [✏️ Edit] [🚫 Ban]   |
| alice@example.com   |       |         |         | [💰 Add Credits]    |
+---------------------+-------+---------+---------+---------------------+
| 👤 Bob (Free)       | user  | 🪙 50   | ❌ Banned| [✏️ Edit] [✅ Unban]|
| bob@example.com     |       |         |         |                     |
+---------------------+-------+---------+---------+---------------------+
```

### 2. 数据库变更
无重大 Schema 变更，仅需在 `src/credits/types.ts` 中增加常量：
```typescript
export const CREDIT_TRANSACTION_TYPE = {
  // ... existing types
  ADMIN_ADJUSTMENT: 'admin_adjustment',
};
```

---

## 四、 实施优先级 (Roadmap)

1.  **Phase 1 (P0 - 核心可用)**:
    *   重构 `getAdminUsers` Action。
    *   改造 `/admin/users` 页面，接入真实数据。
    *   实现 `adminAdjustCredits` Action 及前端弹窗。
2.  **Phase 2 (P1 - 运营增强)**:
    *   开发 `/admin/search-logs` 页面 (重点关注零结果词)。
    *   开发 `/admin/hot-keywords` 配置页。
3.  **Phase 3 (P2 - 视觉优化)**:
    *   接入 Recharts 实现真实的用户增长与营收趋势图。

---

## 五、 总结

本方案将管理员后台从一个“Mock 演示页”升级为**真正的业务控制台**。
通过**连接真实用户数据**和**提供人工干预能力**，管理员将能够有效地处理线上问题（如充值不到账）并指导内容生产（通过搜索日志），这是系统上线运营的必要条件。
