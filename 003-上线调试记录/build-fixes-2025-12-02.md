# 生产环境构建修复记录

**日期**: 2025-12-02
**任务**: 准备 Vercel 部署

## ✅ 构建状态

生产环境构建**成功** ✓

```bash
pnpm build
```

## 🔧 修复的问题

### 1. PPT 页面类型错误

**文件**: `src/app/[locale]/(marketing)/ppt/page.tsx`

**问题**: `SearchSidebar` 组件的 `onCategoryClick` 回调传递的是字符串,但处理函数试图将其作为对象访问 `.slug` 属性。

**修复**:
```typescript
// 修复前
onCategoryClick={(c) => handleCategoryClick(c.slug ?? c)}

// 修复后
onCategoryClick={handleCategoryClick}
```

### 2. API 路由参数类型错误

**文件**: `src/app/api/ppts/route.ts`

**问题**: URL 查询参数是字符串类型,但 `getPPTs` 函数期望 `PPTCategory` 和 `PPTStatus` 类型。

**修复**: 添加类型验证逻辑
```typescript
import type { PPTCategory, PPTStatus } from '@/lib/types/ppt/ppt';

const VALID_CATEGORIES: PPTCategory[] = [
  'business', 'product', 'education', 'technology',
  'creative', 'marketing', 'medical', 'finance',
  'hr', 'lifestyle', 'general',
];

const VALID_STATUSES: PPTStatus[] = ['draft', 'published', 'archived'];

// 验证 category 参数
const categoryParam = searchParams.get('category');
category: categoryParam && VALID_CATEGORIES.includes(categoryParam as PPTCategory)
  ? (categoryParam as PPTCategory)
  : undefined,

// 验证 status 参数
const statusParam = searchParams.get('status');
status: statusParam && VALID_STATUSES.includes(statusParam as PPTStatus)
  ? (statusParam as PPTStatus)
  : undefined,
```

### 3. 缺失的 PPTCategory翻译

**文件**: `src/lib/constants/ppt-i18n.ts`

**问题**: `ADMIN_I18N.categories` 只定义了 5 个类别,但 `PPTCategory` 类型包含 11 个类别。

**修复**: 添加所有缺失的类别翻译
```typescript
categories: {
  business: '商业',
  product: '产品',
  education: '教育',
  technology: '技术',      // ← 新增
  creative: '创意',         // ← 新增
  marketing: '营销',
  medical: '医疗',          // ← 新增
  finance: '金融',          // ← 新增
  hr: '人力资源',           // ← 新增
  lifestyle: '生活方式',    // ← 新增
  general: '通用',
},
```

### 4. PPT 编辑表单类型不完整

**文件**: `src/components/ppt/admin/ppt-edit-form.tsx`

**问题**: `pptEditSchema` 和 `categoryLabels` 只包含部分类别。

**修复**: 更新 schema 枚举和 labels 对象,包含所有 11 个类别。

### 5. TypeScript 编译范围问题

**文件**: `tsconfig.json`

**问题**: TypeScript 尝试编译 `深入细化调整` 等草稿目录中的代码,导致重复导出错误。

**修复**: 在 `exclude` 中添加草稿目录
```json
"exclude": [
  "node_modules",
  "vo-ui-code-pro",
  "scripts",
  "深入细化调整",
  "分析过程",
  "验证方案"
]
```

## 📊 构建输计

- **总包大小**: ~113 kB (First Load JS shared)
- **Middleware**: 46.8 kB
- **静态页面**: 多个预渲染页面
- **动态路由**: PPT 相关页面使用 SSR

## 🚀 部署准备

### 环境变量检查

确保在 Vercel 中配置以下环境变量:

```bash
# 数据库
DATABASE_URL=postgresql://...

# 认证
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=...

# Stripe (如果启用)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...

# AI 服务
OPENAI_API_KEY=...
# ... 其他 AI 密钥

# 文件存储
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
```

参考: `env.example`

### 部署方式

#### 方式 1: Git 集成部署 (推荐)

1. 提交更改到 Git:
```bash
git add .
git commit -m "fix: resolve build errors for production"
git push origin main
```

2. Vercel 会自动触发部署

#### 方式 2: Vercel CLI 部署

```bash
# 安装 Vercel CLI (如未安装)
pnpm install -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

## ✅ 验证清单

- [x] 本地 `pnpm build` 成功
- [x] 类型检查通过
- [x] Linting 通过
- [ ] 环境变量已在 Vercel 配置
- [ ] 数据库迁移已执行
- [ ] 生产环境测试通过

## 📝 注意事项

1. **数据库迁移**: 首次部署前,确保在生产数据库运行 `pnpm db:migrate`

2. **环境变量**: 检查 `env.example`,确保所有必需的环境变量都已在 Vercel 中配置

3. **图片优化**: `next.config.ts` 中已设置 `unoptimized: true`,避免 Vercel 图片优化限制

4. **函数超时**: `vercel.json` 中 API 路由配置了 300 秒超时

5. **本地开发**: 本地开发服务器运行在端口 3005:
   ```bash
   pnpm dev
   ```
