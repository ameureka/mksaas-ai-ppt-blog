# 📸 Playwright 截图执行计划

**阶段**: 4 (Playwright 截图)
**目标**: 15+ 个关键用户流程的截图
**预计时间**: 1-2 小时
**优先级**: 高

---

## 📋 截图场景规划

### 场景分类

```
认证流程 (3 个场景)
支付流程 (3 个场景)
用户仪表板 (3 个场景)
设置页面 (4 个场景)
管理后台 (1 个场景)
博客系统 (2 个场景)
━━━━━━━━━━━━━━━
总计: 16 个场景
```

---

## 🎬 详细的 16 个截图场景

### 一、认证流程 (3 个)

#### 场景 1: 登录页面 - `/auth/login`
**描述**: 完整的登录页面，展示表单和 OAuth 按钮
**截图包含**:
- 页面标题和描述
- 邮箱/密码输入框
- OAuth 按钮 (Google, GitHub)
- 记住我复选框
- 登录按钮
- 注册和忘记密码链接

**视口**: Desktop (1920x1080)
**关键元素**:
- 输入框状态 (空)
- 按钮状态 (可点击)
- 社交登录按钮清晰可见

**保存位置**: `docs/images/auth/01-login-page.png`

---

#### 场景 2: 注册页面 - `/auth/register`
**描述**: 完整的注册页面
**截图包含**:
- 多个输入框 (邮箱、密码、确认密码)
- 可选的用户名字段
- OAuth 按钮
- 条款同意复选框
- 注册按钮
- 已有账户链接

**视口**: Desktop (1920x1080)
**关键特征**:
- 密码强度提示 (如果有)
- 实时验证提示 (空状态)
- 清晰的流程指导

**保存位置**: `docs/images/auth/02-register-page.png`

---

#### 场景 3: 忘记密码页面 - `/auth/forgot-password`
**描述**: 密码重置请求页面
**截图包含**:
- 邮箱输入框
- 发送重置链接按钮
- 返回登录链接
- 说明文本

**视口**: Desktop (1920x1080)

**保存位置**: `docs/images/auth/03-forgot-password.png`

---

### 二、支付流程 (3 个)

#### 场景 4: 价格页面 - `/pricing`
**描述**: 完整的价格表展示三层计划
**截图包含**:
- 页面标题: "Simple, Transparent Pricing"
- 三层价格卡片:
  - Free (当前计划)
  - Pro (Monthly/Yearly)
  - Lifetime
- 功能对比表 (如果有)
- FAQ 部分
- CTA 按钮

**视口**: Desktop (1920x1080)
**要点**:
- "当前计划" 标记在 Free 上
- 升级按钮清晰可见
- 价格和功能清晰

**保存位置**: `docs/images/pricing/04-pricing-page.png`

---

#### 场景 5: 用户仪表板 - `/dashboard`
**描述**: 用户主仪表板展示关键信息
**截图包含**:
- 导航栏 (Navbar)
- 侧边栏菜单
- 当前计划卡片
- 积分余额卡片
- KPI 数据卡片 (如果有)
- 图表 (如果有)

**视口**: Desktop (1920x1080)
**要点**:
- 显示完整的左侧边栏
- KPI 卡片清晰
- 用户信息可见

**保存位置**: `docs/images/dashboard/05-dashboard-full.png`

---

#### 场景 6: 账单管理页面 - `/settings/billing`
**描述**: 账单和订阅管理
**截图包含**:
- 当前订阅信息卡片
- 订阅续期日期
- 支付方式
- 最近发票列表
- 管理订阅按钮

**视口**: Desktop (1920x1080)
**要点**:
- 清晰的计划信息
- 发票列表可见
- 操作按钮清晰

**保存位置**: `docs/images/settings/06-billing-page.png`

---

### 三、用户仪表板 (3 个)

#### 场景 7: 仪表板侧边栏展开 - `/dashboard`
**描述**: 侧边栏完全展开的仪表板
**截图包含**:
- 完整的侧边栏菜单
- 所有菜单项清晰可见
- 当前页面高亮 (Dashboard)
- 用户信息卡片
- Upgrade 卡片
- Discord 卡片

**视口**: Desktop (1920x1080)

**保存位置**: `docs/images/dashboard/07-sidebar-expanded.png`

---

#### 场景 8: 仪表板移动端视图 - `/dashboard`
**描述**: 移动设备上的仪表板（响应式）
**截图包含**:
- 移动端汉堡菜单
- 卡片堆叠布局
- 优化的触摸目标
- 清晰的移动 UI

**视口**: Mobile (375x812)
**特点**:
- 展示响应式设计
- 一列布局
- 菜单图标清晰

**保存位置**: `docs/images/dashboard/08-mobile-responsive.png`

---

#### 场景 9: 仪表板带错误状态 - `/dashboard`
**描述**: 展示错误提示或加载状态
**可能包含**:
- 加载骨架屏
- 错误提示
- 空状态提示

**视口**: Desktop (1920x1080)

**保存位置**: `docs/images/dashboard/09-dashboard-loading.png`

---

### 四、设置页面 (4 个)

#### 场景 10: 个人资料设置 - `/settings/profile`
**描述**: 用户个人信息编辑页面
**截图包含**:
- 用户头像
- 名字编辑表单
- 邮箱显示
- 生物信息编辑 (如果有)
- 语言/主题选择
- 保存按钮

**视口**: Desktop (1920x1080)

**保存位置**: `docs/images/settings/10-profile-settings.png`

---

#### 场景 11: 积分管理页面 - `/settings/credits`
**描述**: 积分余额和交易记录
**截图包含**:
- 当前积分余额 (大显示)
- 积分进度条
- 积分包购买选项
- 交易历史表格
- 分页控制

**视口**: Desktop (1920x1080)
**要点**:
- 积分余额清晰
- 购买按钮清晰
- 交易表格可读

**保存位置**: `docs/images/settings/11-credits-page.png`

---

#### 场景 12: 安全设置页面 - `/settings/security`
**描述**: 密码和会话管理
**截图包含**:
- 修改密码部分
- 活跃会话列表
- 设备信息
- 登出其他会话按钮
- 删除账户警告 (如果有)

**视口**: Desktop (1920x1080)

**保存位置**: `docs/images/settings/12-security-settings.png`

---

#### 场景 13: 通知设置页面 - `/settings/notifications`
**描述**: 邮件通知偏好设置
**截图包含**:
- 邮件订阅开关
- 通知类型复选框
- 频率选择
- 保存按钮

**视口**: Desktop (1920x1080)

**保存位置**: `docs/images/settings/13-notifications-settings.png`

---

### 五、管理后台 (1 个)

#### 场景 14: 用户管理表 - `/admin/users`
**描述**: 管理员用户列表表格
**截图包含**:
- 用户表格
- 搜索框和筛选选项
- 用户列表 (5-10 行)
- 操作按钮 (编辑、禁用)
- 分页控制
- 选择复选框

**视口**: Desktop (1920x1080)
**要点**:
- 表格清晰可读
- 操作按钮清晰
- 分页可见

**保存位置**: `docs/images/admin/14-users-table.png`

---

### 六、博客系统 (2 个)

#### 场景 15: 博客列表页 - `/blog`
**描述**: 博客文章列表
**截图包含**:
- 页面标题: "Our Blog"
- 分类筛选选项
- 博客卡片网格 (6-9 个)
- 每个卡片展示:
  - 文章图片
  - 标题
  - 发布日期
  - 分类标签
  - 阅读时间
  - 喜欢数
- 分页控制

**视口**: Desktop (1920x1080)
**特点**:
- Grid 布局清晰
- 卡片设计精美
- 分类筛选可见

**保存位置**: `docs/images/blog/15-blog-list.png`

---

#### 场景 16: 博客文章详情 - `/blog/[slug]`
**描述**: 完整的博客文章页面
**截图包含**:
- 文章标题
- 发布日期和作者
- 文章图片
- 文章内容 (MDX 渲染)
- 目录导航 (侧边栏)
- 作者信息卡片
- 相关文章推荐
- 评论部分 (如果有)

**视口**: Desktop (1920x1080)
**特点**:
- 两列布局清晰
- 内容可读
- 目录导航可见

**保存位置**: `docs/images/blog/16-article-detail.png`

---

## 🛠️ 技术实现细节

### Playwright 脚本框架

```typescript
// scripts/take-screenshots.ts

import { chromium, Browser, Page } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '../docs/images');

interface ScreenshotConfig {
  name: string;
  url: string;
  viewport: { width: number; height: number };
  waitFor?: string; // CSS selector to wait for
  actions?: (page: Page) => Promise<void>;
}

const scenarios: ScreenshotConfig[] = [
  {
    name: 'auth/01-login-page',
    url: '/en/auth/login',
    viewport: { width: 1920, height: 1080 },
  },
  {
    name: 'auth/02-register-page',
    url: '/en/auth/register',
    viewport: { width: 1920, height: 1080 },
  },
  // ... 更多场景
];

async function takeScreenshot(browser: Browser, config: ScreenshotConfig) {
  const page = await browser.newPage();
  page.setViewportSize(config.viewport);

  await page.goto(`${BASE_URL}${config.url}`);

  if (config.waitFor) {
    await page.waitForSelector(config.waitFor);
  }

  if (config.actions) {
    await config.actions(page);
  }

  await page.waitForTimeout(500); // 等待动画完成

  const dir = path.dirname(path.join(SCREENSHOTS_DIR, config.name));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, `${config.name}.png`),
    fullPage: false,
  });

  await page.close();
  console.log(`✅ Screenshot saved: ${config.name}`);
}

async function main() {
  const browser = await chromium.launch();

  for (const scenario of scenarios) {
    try {
      await takeScreenshot(browser, scenario);
    } catch (error) {
      console.error(`❌ Failed: ${scenario.name}`, error);
    }
  }

  await browser.close();
  console.log('✅ All screenshots completed!');
}

main();
```

### 需要的先决条件

- [ ] Playwright 已安装
- [ ] 应用可以在本地运行
- [ ] 创建 `docs/images/` 目录
- [ ] 每个子目录 (auth, pricing, dashboard, settings, admin, blog)

### 执行步骤

```bash
# 1. 安装 Playwright (如果还未安装)
pnpm add -D @playwright/test

# 2. 启动开发服务器
pnpm dev

# 3. 在另一个终端运行脚本
pnpm playwright:screenshots

# 4. 检查生成的截图
ls -la docs/images/
```

---

## 📊 截图组织结构

```
docs/images/
├── auth/
│   ├── 01-login-page.png
│   ├── 02-register-page.png
│   └── 03-forgot-password.png
│
├── pricing/
│   └── 04-pricing-page.png
│
├── dashboard/
│   ├── 05-dashboard-full.png
│   ├── 07-sidebar-expanded.png
│   ├── 08-mobile-responsive.png
│   └── 09-dashboard-loading.png
│
├── settings/
│   ├── 06-billing-page.png
│   ├── 10-profile-settings.png
│   ├── 11-credits-page.png
│   ├── 12-security-settings.png
│   └── 13-notifications-settings.png
│
├── admin/
│   └── 14-users-table.png
│
└── blog/
    ├── 15-blog-list.png
    └── 16-article-detail.png
```

---

## ✅ 质量检查清单

取每个截图后，验证以下内容:

- [ ] **清晰度**: 文字清晰可读，没有模糊
- [ ] **完整性**: 展示了页面的关键部分
- [ ] **状态**: 展示了合理的默认状态 (非加载、非错误)
- [ ] **对齐**: UI 元素对齐良好
- [ ] **颜色**: 颜色准确，暗/亮模式一致
- [ ] **文件名**: 按照命名约定保存
- [ ] **大小**: 文件大小合理 (< 500KB/image)

---

## 📝 后续工作

取完所有截图后:

1. ✅ 将截图集成到相关的文档中
   - 在 04-modules 文档中引用
   - 在各个功能说明中嵌入

2. ✅ 创建截图索引
   - 生成 `docs/images/README.md`
   - 列出所有截图和说明

3. ✅ 性能优化
   - 压缩所有 PNG 文件
   - 生成缩略图 (如需要)

---

## ⏱️ 时间估算

```
前置准备:        15 分钟
  ├─ 确保应用可运行
  ├─ 创建脚本
  └─ 启动开发服务器

截图执行:        45 分钟
  ├─ 16 个场景，平均 2-3 分钟/场景
  └─ 处理偶尔的超时或加载问题

质量检查:        20 分钟
  ├─ 检查每个截图
  └─ 重新拍摄不满意的

文件整理:        10 分钟
  ├─ 压缩文件
  ├─ 生成索引
  └─ 提交到 Git

总计:             100 分钟 (~1.5-2 小时)
```

---

## 🚀 开始执行

**准备好了吗?** 让我们开始取第一批截图！

下一步:
1. ✅ 确保应用在 localhost:3005 (或配置的端口) 运行
2. ✅ 创建 Playwright 脚本
3. ✅ 执行截图
4. ✅ 验证并整理

**预计完成时间**: 1-2 小时

