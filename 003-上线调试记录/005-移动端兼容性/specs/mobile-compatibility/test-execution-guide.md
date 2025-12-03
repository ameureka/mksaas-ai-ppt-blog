# Test Execution Guide - Task 9

## 测试文件已创建

### 1. 属性测试 (Playwright)
**文件**: `e2e/mobile-compatibility.spec.ts`

**包含测试：**
- Property 1: 移动端最小字体 14px (4 个视口)
- Property 2: 社交图标 44x44px
- Property 3: 社交图标间距 ≥8px
- Property 4: 320px 无横向滚动
- Property 5: 链接垂直间距 ≥12px
- Property 6: 链接触摸目标 ≥44px
- Property 8: 响应式布局 (1/2/6列)

**运行命令：**
```bash
# 首先安装 Playwright 浏览器
npx playwright install

# 运行移动端兼容性测试
npx playwright test e2e/mobile-compatibility.spec.ts

# 运行并查看报告
npx playwright test e2e/mobile-compatibility.spec.ts --reporter=html
npx playwright show-report
```

### 2. 单元测试 (Vitest)
**文件**: `src/components/layout/__tests__/footer.test.tsx`

**包含测试：**
- 渲染所有导航区域
- 渲染品牌区域和统计数据
- 渲染社交图标
- 验证响应式 Tailwind 类
- 验证移动端字体大小 (text-sm)
- 验证链接间距 (space-y-3)
- 验证社交图标尺寸 (h-11 w-11)

**运行命令：**
```bash
# 需要在 package.json 添加 test 脚本
# "test": "vitest"

# 然后运行
npm run test src/components/layout/__tests__/footer.test.tsx

# 或直接使用 vitest
npx vitest src/components/layout/__tests__/footer.test.tsx
```

## 配置要求

### package.json 添加测试脚本
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### Playwright 配置
项目需要 `playwright.config.ts`，如果不存在，创建：

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3005',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3005',
    reuseExistingServer: !process.env.CI,
  },
});
```

## 测试覆盖率

### 需求覆盖
- ✅ Requirements 1.1, 1.3: 字体大小
- ✅ Requirements 2.1, 2.2: 社交图标
- ✅ Requirements 3.1, 3.2: 链接间距和触摸目标
- ✅ Requirements 4.1, 4.2, 4.3: 响应式布局
- ✅ Requirements 1.4, 4.4: 无横向滚动

### 未覆盖的需求
- ⏳ Requirements 3.3: 对比度测试 (需要颜色对比度库)
- ⏳ Requirements 5.x: 核心页面验证 (Task 10)
- ⏳ Requirements 6.x: 性能测试 (Task 11)

## 预期结果

### 成功标准
- 所有 Playwright 测试通过 (7 个属性测试)
- 所有 Vitest 单元测试通过 (10 个测试用例)
- 无测试失败或错误

### 失败处理
如果测试失败：
1. 检查失败的具体测试和断言
2. 验证 Footer 组件代码是否正确修改
3. 检查浏览器兼容性问题
4. 查看 Playwright 截图和追踪
5. 修复问题后重新运行测试

## 状态
✅ 测试文件已创建
⏳ 等待配置 package.json 和 playwright.config.ts
⏳ 等待运行测试验证

## 下一步
1. 添加测试脚本到 package.json
2. 安装 Playwright 浏览器
3. 运行属性测试
4. 运行单元测试
5. 验证所有测试通过
