# 补充设计报告：AI Workspace 与 运营服务体系

**生成时间**: 2025-12-12
**核心定位**: 资源站（流量底座） + AI 工具（增值变现）

---

## 一、 AI 创作工作台 (AI Workspace) 深度设计

这是产品从“下载工具”进化为“生产力工具”的核心。

### 1.1 交互流程设计 (User Flow)

我们将 AI 生成流程拆解为 **“三步走”**，降低用户认知负担，同时增加付费触点。

*   **Step 1: 意图输入 (The Prompt)**
    *   **入口**: 首页显著位置的 "Generate with AI" 按钮，或 Dashboard 的 "New Project"。
    *   **交互**:
        *   **Topic Input**: 一个类似 Google 搜索的大输入框，“你想做什么 PPT？”。
        *   **辅助选项**: 风格 (Business/Creative/Minimal)、页数 (5/10/15)、语言 (Auto/EN/ZH)。
    *   **门槛**: 免费用户可用，但限制次数。

*   **Step 2: 大纲生成与确认 (Outline Editor)**
    *   **交互**:
        *   AI 快速生成 5-10 页的 PPT 大纲（标题 + 核心要点）。
        *   **用户干预**: 用户可以拖拽调整顺序、修改标题、删除/新增页面。**这是 AI 最好用的地方——人机协作**。
    *   **付费点**: 此时尚未生成 PPT 文件，用户修改满意后，点击“生成 PPT”，系统检查积分。

*   **Step 3: 最终生成与交付 (Delivery)**
    *   **状态反馈**: 进入一个 Loading 页面，显示进度条和趣味文案（"AI 正在排版..."）。
    *   **结果页**:
        *   **预览**: 提供 Web 端预览（图片轮播）。
        *   **下载**: 提供 `.pptx` 格式下载。
        *   **在线编辑 (V2)**: 未来支持简单的文字替换。

### 1.2 数据库支持 (Schema)

我们需要记录用户的生成历史，既为了“我的作品”列表，也为了 Prompt 优化。

```typescript
// src/db/schema.ts (补充)

export const aiGeneration = pgTable("ai_generation", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  prompt: text("prompt").notNull(),  // 用户输入的 Topic
  options: jsonb("options"),         // 风格、页数等配置
  outline: jsonb("outline"),         // 生成的大纲 JSON
  status: text("status").notNull(),  // 'pending', 'completed', 'failed'
  resultUrl: text("result_url"),     // 最终 PPTX 文件地址
  creditsCost: integer("credits_cost"), // 消耗积分
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## 二、 站内通知系统 (In-App Notifications)

填补邮件触达的空白，增强即时互动。

### 2.1 场景定义
1.  **AI 任务完成**: "您的 '2025年终总结' PPT 已生成完毕，点击查看。"
2.  **资产变动**: "每日签到成功！获得 +5 积分。"
3.  **系统公告**: "春节期间服务不打烊。"

### 2.2 数据库支持

```typescript
// src/db/schema.ts (补充)

export const notification = pgTable("notification", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  type: text("type").notNull(), // 'system', 'asset', 'ai_task'
  title: text("title").notNull(),
  content: text("content"),
  link: text("link"),           // 点击跳转链接
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 2.3 UI 实现
*   **Navbar**: 增加铃铛图标 🔔。
    *   红点: `count(where is_read = false) > 0`。
*   **Dropdown**: 点击展开最近 5 条消息，支持“一键已读”。

---

## 三、 用户反馈闭环 (Feedback Loop)

### 3.1 极简工单系统
不依赖复杂的第三方客服，用最轻量的方式解决问题。

*   **入口**: Dashboard 侧边栏 -> "Help & Support"。
*   **交互**: 一个简单的表单。
    *   类型: [充值问题 / 下载失败 / 建议 / 其他]
    *   描述: Textarea
    *   附件: Image Upload (可选)
*   **后台**: Admin Dashboard 增加 `/admin/tickets` 页面，管理员后台回复，回复内容通过 **站内通知** + **邮件** 发送给用户。

---

## 四、 转化漏斗优化 (Conversion Optimization)

### 4.1 全局付费拦截 (Global Pricing Modal)
不要让用户离开当前页面去付费。

*   **设计**: 封装一个 `NotEnoughCreditsModal` 组件。
*   **逻辑**: 当用户点击“下载”或“生成”，且 `credits < cost` 时触发。
*   **内容**:
    *   "积分不足，还需要 10 分"。
    *   选项 A: **快速充值 $5** (Stripe Link)。
    *   选项 B: **升级 Pro (无限下载)**。
    *   选项 C: **看广告 (+5 分)** (挽留免费用户)。

---

## 五、 总结与演进路线

基于这份补充文档，我们的产品形态将更加立体：

*   **V1.0 (资源站基座)**: 
    *   完善 User/Admin Dashboards (下载/收藏/充值)。
    *   上线基本的站内通知 (Notification)。
*   **V1.5 (AI 试水)**: 
    *   上线 "AI 大纲生成器" (Step 1 & 2)，先不生成 PPT 文件，只生成大纲文本，验证需求。
*   **V2.0 (AI Workspace)**: 
    *   打通 PPT 文件生成能力 (Step 3)。
    *   上线 `ai_generation` 记录管理。

这份文档补全了从“工具”到“服务”的关键拼图。
