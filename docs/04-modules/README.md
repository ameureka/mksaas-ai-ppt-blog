# 4. 功能模块文档

本目录包含 mk-saas-blog 所有核心功能模块的文档。

---

## 📦 功能模块

| 模块 | 说明 | 文档 |
|------|------|------|
| **支付系统** | Stripe 支付、订阅、积分 | [payment/overview.md](./payment/overview.md) |
| **PPT 系统** | 模板管理、搜索、下载 | [ppt/overview.md](./ppt/overview.md) |
| **广告系统** | 激励广告、积分奖励 | [ads/overview.md](./ads/overview.md) |
| **搜索系统** | 文档搜索、热词管理 | [search/overview.md](./search/overview.md) |
| **通信系统** | 邮件、Newsletter | [communication/](./communication/) |
| **存储系统** | S3 文件上传 | [storage/](./storage/) |

---

## 📸 Playwright 截图文档 (Playwright 截图)

本目录包含 mk-saas-blog 所有关键功能模块的视觉文档。所有截图通过 Playwright 自动化生成，确保文档始终保持最新。

---

## 📸 截图总览

### 生成的截图 (16 个场景)

| # | 场景 | 描述 | 路径 | 访问权限 |
|----|------|------|------|---------|
| 01 | 登录页 | 用户登录界面 | `/auth/login` | 公开 ✅ |
| 02 | 注册页 | 新用户注册界面 | `/auth/register` | 公开 ✅ |
| 03 | 忘记密码 | 密码重置请求 | `/auth/forgot-password` | 公开 ✅ |
| 04 | 定价页 | 订阅和定价选项 | `/pricing` | 公开 ✅ |
| 05 | 仪表板 | 主要用户仪表板 | `/dashboard` | 认证 🔒 |
| 06 | 侧边栏展开 | 侧边栏导航展开 | `/dashboard` | 认证 🔒 |
| 07 | 移动响应式 | 移动端仪表板 | `/dashboard` | 认证 🔒 |
| 08 | 个人资料设置 | 用户资料编辑 | `/settings/profile` | 认证 🔒 |
| 09 | 积分管理 | 积分购买和管理 | `/settings/credits` | 认证 🔒 |
| 10 | 安全设置 | 密码和 2FA 管理 | `/settings/security` | 认证 🔒 |
| 11 | 通知设置 | 邮件和推送通知 | `/settings/notifications` | 认证 🔒 |
| 12 | 用户管理 | 管理员用户表 | `/admin/users` | 管理员 🔐 |
| 13 | 博客列表 | 文章列表和分类 | `/blog` | 公开 ✅ |
| 14 | 文章详情 | 单篇文章详细页 | `/blog/[slug]` | 公开 ✅ |
| 15 | 首页 | 营销首页 | `/` | 公开 ✅ |
| 16 | 平板响应式 | 平板设备视图 | `/` | 公开 ✅ |

---

## 🚀 运行 Playwright 截图

### 前置条件

```bash
# 1. 确保 Playwright 已安装
pnpm list @playwright/test

# 2. 启动开发服务器 (自动启动，但确保无冲突)
# pnpm dev  # 可选，Playwright 会自动启动

# 3. 确保数据库已初始化
pnpm db:migrate
```

### 生成所有截图

```bash
# 运行所有 Playwright 测试
pnpm exec playwright test e2e/screenshots.spec.ts

# 输出: ✅ 8-10 个截图会被生成到 docs/images/ 目录
```

### 生成特定截图

```bash
# 仅生成登录页面
pnpm exec playwright test e2e/screenshots.spec.ts --grep "Login"

# 仅生成博客相关
pnpm exec playwright test e2e/screenshots.spec.ts --grep "Blog"

# 仅生成认证页面
pnpm exec playwright test e2e/screenshots.spec.ts --grep "Auth"
```

### 以 UI 模式运行 (推荐)

```bash
# 交互式运行，可以逐步观察
pnpm exec playwright test --ui
```

### 调试模式

```bash
# 以调试模式运行，可以检查每一步
pnpm exec playwright test e2e/screenshots.spec.ts --debug

# 或使用 Inspector
PWDEBUG=1 pnpm exec playwright test e2e/screenshots.spec.ts
```

---

## 📁 生成的文件

所有截图保存到: `docs/images/`

```
docs/images/
├── 01-auth-login.png              ✅ 公开
├── 02-auth-register.png           ✅ 公开
├── 03-auth-forgot-password.png    ✅ 公开
├── 04-pricing.png                 ✅ 公开
├── 05-dashboard-full.png          🔒 需要认证
├── 06-dashboard-sidebar.png       🔒 需要认证
├── 07-dashboard-mobile.png        🔒 需要认证
├── 08-settings-profile.png        🔒 需要认证
├── 09-settings-credits.png        🔒 需要认证
├── 10-settings-security.png       🔒 需要认证
├── 11-settings-notifications.png  🔒 需要认证
├── 12-admin-users.png             🔐 需要管理员
├── 13-blog-list.png               ✅ 公开
├── 14-blog-article.png            ✅ 公开
├── 15-homepage.png                ✅ 公开
└── 16-responsive-tablet.png       ✅ 公开
```

---

## 🔐 处理需要认证的页面

对于需要登录的页面 (仪表板、设置等)，有两种方法:

### 方法 1: 使用测试账户登录

修改 `e2e/screenshots.spec.ts` 中的测试:

```typescript
test('05-Dashboard-Full Page', async ({ page }) => {
  // 1. 导航到登录页
  await page.goto('/auth/login')

  // 2. 输入测试账户凭证
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'test-password')

  // 3. 提交登录
  await page.click('button:has-text("Sign In")')

  // 4. 等待重定向到仪表板
  await page.waitForURL('/dashboard')

  // 5. 取截图
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, '05-dashboard-full.png'),
    fullPage: true,
  })
})
```

### 方法 2: 使用 API 认证

```typescript
test('08-Settings-Profile Page', async ({ page, context }) => {
  // 通过 API 登录获取 token
  const response = await context.request.post('/api/auth/signin', {
    data: {
      email: 'test@example.com',
      password: 'test-password',
    },
  })

  // 使用返回的 cookie
  const cookies = await context.cookies()

  // 访问受保护页面
  await page.goto('/settings/profile')
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, '08-settings-profile.png'),
    fullPage: true,
  })
})
```

---

## 🎯 最佳实践

### 1. 定期更新截图

```bash
# 在 UI 有重大变化后，重新生成截图
pnpm exec playwright test e2e/screenshots.spec.ts

# 提交新截图
git add docs/images/
git commit -m "chore: update Playwright screenshots after UI changes"
```

### 2. 验证截图质量

- ✅ 页面完全加载 (`waitForLoadState('networkidle')`)
- ✅ 没有加载骨架 (skeleton loaders)
- ✅ 响应式布局正确
- ✅ 深色模式支持 (如果适用)

### 3. 处理动态内容

如果页面包含随机数据或时间戳，使用 `mask` 隐藏:

```typescript
await page.screenshot({
  path: '...',
  mask: [
    page.locator('[data-dynamic]'),  // 隐藏动态元素
  ],
})
```

### 4. 截图命名约定

遵循以下格式:

```
[序号]-[类别]-[描述].png

示例:
01-auth-login.png        # 序号-类别-描述
05-dashboard-full.png    # 序号-类别-full/mobile/sidebar
```

---

## 📊 集成到文档

### 在 Markdown 中使用截图

```markdown
## 登录页面

![登录页面](/docs/images/01-auth-login.png)

用户可以通过以下方式登录:
- 邮箱/密码
- Google OAuth
- GitHub OAuth
```

### 创建截图对比

```markdown
### 响应式设计

| 桌面 | 平板 | 移动 |
|------|------|------|
| ![](/docs/images/15-homepage.png) | ![](/docs/images/16-responsive-tablet.png) | ... |
```

---

## 🔧 配置文件

### `playwright.config.ts`

主要配置参数:

```typescript
{
  baseURL: 'http://localhost:3005',        // 应用 URL
  use: {
    screenshot: 'only-on-failure',         // 仅在失败时截图
    trace: 'on-first-retry',              // 记录跟踪信息
  },
  workers: 1,                              // 单线程运行 (防止冲突)
}
```

### `e2e/screenshots.spec.ts`

主要测试配置:

```typescript
- fullPage: true                           // 完整页面高度
- waitForLoadState('networkidle')         // 等待网络空闲
- viewport 设置 (375x667, 768x1024)       // 响应式尺寸
```

---

## 🐛 常见问题

### Q1: Playwright 无法启动开发服务器?

**解决方案**:
```bash
# 手动启动开发服务器
pnpm dev

# 在另一个终端运行测试
pnpm exec playwright test e2e/screenshots.spec.ts --config=playwright.config.ts
```

### Q2: 认证相关的截图失败?

**原因**: 需要有效的测试账户

**解决方案**:
1. 创建测试账户: `test@example.com`
2. 修改测试代码添加登录逻辑
3. 或使用 `test.skip(true, '需要认证')` 跳过

### Q3: 截图分辨率过低或过高?

修改 `setViewportSize`:

```typescript
// 调整视口大小
await page.setViewportSize({ width: 1920, height: 1080 })  // 更大
await page.setViewportSize({ width: 1024, height: 768 })   // 标准
```

### Q4: 如何在 CI/CD 中运行?

```yaml
# GitHub Actions 示例
- name: Run Playwright Tests
  run: pnpm exec playwright test e2e/screenshots.spec.ts

- name: Upload Screenshots
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-screenshots
    path: docs/images/
```

---

## 📈 性能优化

### 快速测试

```bash
# 跳过某些测试
pnpm exec playwright test e2e/screenshots.spec.ts --grep -v "Dashboard|Admin"

# 或在 test 中使用 test.skip()
test.skip(isCI, 'Skip in CI environment')
```

### 并行测试 (高级)

修改 `playwright.config.ts`:

```typescript
workers: process.env.CI ? 1 : 4,  // CI 中单线程，本地并行
```

---

## 📚 相关文档

- [整体五层架构](../01-architecture/01-architecture/diagrams/architecture/1-整体五层架构.md) - 系统架构
- [页面布局图](../01-architecture/01-architecture/diagrams/pages/) - UI 设计参考
- [常用命令](../00-getting-started/常用命令.md) - 开发命令

---

## 🎓 学习资源

- [Playwright 官方文档](https://playwright.dev)
- [Playwright 截图指南](https://playwright.dev/docs/api/class-page#page-screenshot)
- [最佳实践](https://playwright.dev/docs/best-practices)

---

**最后更新**: 2025-11-18
**维护者**: AI Assistant
**反馈**: 有问题？提交 GitHub Issue 或改进建议
