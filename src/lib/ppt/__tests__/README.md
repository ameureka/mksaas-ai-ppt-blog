# PPT Migration Property Tests

这些属性测试验证 v0-ppt-migration 项目的迁移质量和一致性。

## 测试概述

| Property | 文件 | 验证需求 | 测试数量 |
|----------|------|----------|----------|
| Property 1 | `toast-api-consistency.test.ts` | 3.4, 4.1, 4.2, 4.3 | 5 |
| Property 2 | `auth-api-consistency.test.ts` | 5.1, 5.4 | 7 |
| Property 3 | `layout-consistency.test.ts` | 6.1, 6.2, 6.3, 6.4 | 8 |
| Property 4 | `i18n-routes-consistency.test.ts` | 7.3, 7.4 | 9 |
| Property 5 | `image-paths-consistency.test.ts` | 10.2 | 8 |
| Property 6 | `compile-correctness.test.ts` | 1.3 | 6 |

**总计: 43 个测试**

## 运行测试

```bash
# 运行所有属性测试
pnpm vitest run src/lib/ppt/__tests__/

# 运行单个测试文件
pnpm vitest run src/lib/ppt/__tests__/toast-api-consistency.test.ts

# 监视模式
pnpm vitest src/lib/ppt/__tests__/
```

## 属性说明

### Property 1: Toast API 一致性
验证所有组件都正确使用 sonner toast API，不再使用旧的 shadcn/ui toast。

### Property 2: Auth API 一致性
验证所有认证相关组件都使用 Better Auth API，保持认证状态的一致性。

### Property 3: 布局组件一致性
验证所有页面都移除了旧的布局组件，使用一致的新布局结构。

### Property 4: 国际化路由一致性
验证所有 PPT 路由都正确支持国际化，使用正确的路由组件和常量。

### Property 5: 图片路径一致性
验证所有 PPT 相关图片都使用正确的路径前缀，图片文件实际存在。

### Property 6: 编译正确性
验证所有迁移的文件都能正确编译，没有类型错误。

## 依赖

- `vitest`: 测试框架
- `fast-check`: 属性测试库
