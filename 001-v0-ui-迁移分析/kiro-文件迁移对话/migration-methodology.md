# v0 → mksaas 迁移方法论

## 概述

本文档基于实际迁移经验，总结了一套完整的v0项目迁移到mksaas的方法论。
核心原则：**不只是"搬运"，更要"适配"**。

---

## 一、迁移前准备阶段

### 1.1 完整文件清单

**目标**：统计v0项目所有文件，判断迁移策略

**已完成文档**：
- `v0-complete-file-inventory.md` - v0项目185个文件完整清单
- `precise-file-status.md` - 每个文件的迁移状态

**方法**：
1. 扫描v0项目所有目录
2. 判断每个文件类型（配置/类型/组件/页面/资源）
3. 检查mksaas是否已有对应文件
4. 决定迁移策略（直接复制/需适配/不迁移）

### 1.2 依赖图分析

**目标**：构建完整的依赖树，明确哪些文件必须一起迁移

**已完成文档**：
- `v0-dependency-analysis.md` - 7层依赖层级图


**依赖层级**：
```
Layer 7: 页面层 (app/page.tsx)
    ↓
Layer 6: 布局层 (MksaasPublicLayout)
    ↓
Layer 5: 业务组件层 (PPTCard, SearchSidebar)
    ↓
Layer 4: Hooks层 (useAuth, useToast)
    ↓
Layer 3: Actions层 (server actions)
    ↓
Layer 2: 常量/工具层 (routes, i18n, utils)
    ↓
Layer 1: 类型定义层 (types/ppt.ts)
```

**迁移顺序**：从底层到顶层，确保依赖先于被依赖者迁移

### 1.3 API兼容性检测

**目标**：检测v0和mksaas的API差异，提前准备适配方案

**已完成文档**：
- `adaptation-analysis-toast.md` - Toast API差异
- `adaptation-analysis-auth.md` - Auth系统差异
- `adaptation-analysis-i18n.md` - 国际化差异
- `adaptation-analysis-layout.md` - 布局组件差异
- `adaptation-analysis-routes.md` - 路由差异

**五大适配点**：

| 适配点 | v0 | mksaas | 适配方案 |
|-------|-----|--------|---------|
| Toast | `@/hooks/use-toast` | `sonner` | 替换import |
| Auth | 自定义useAuth | Better Auth | 使用authClient |
| i18n | 常量对象 | next-intl | 保留常量，后续优化 |
| 布局 | MksaasPublicLayout | (marketing)/layout | 删除包裹 |
| 路由 | `/categories` | `/ppt/categories` | 更新路由常量 |

---

## 二、导入路径映射

### 2.1 路径映射表

迁移时需要更新的导入路径：

| v0路径 | mksaas路径 |
|-------|-----------|
| `@/lib/types/ppt` | `@/lib/types/ppt/ppt` |
| `@/lib/types/user` | `@/lib/types/ppt/user` |
| `@/lib/types/admin` | `@/lib/types/ppt/admin` |
| `@/lib/types/api` | `@/lib/types/ppt/api` |
| `@/lib/constants/routes` | `@/lib/constants/ppt-routes` |
| `@/lib/constants/i18n` | `@/lib/constants/ppt-i18n` |
| `@/lib/hooks/use-auth` | `@/lib/auth-client` |
| `@/hooks/use-toast` | `sonner` |
| `@/components/mksaas-public-layout` | 删除 |
| `@/components/mksaas-preview-layout` | 删除 |
| `@/components/mksaas-dashboard-header` | `@/components/dashboard/dashboard-header` |

### 2.2 组件路径映射

| v0组件路径 | mksaas组件路径 |
|-----------|---------------|
| `@/components/ppt-card` | `@/components/ppt/ppt-card` |
| `@/components/search-sidebar` | `@/components/ppt/search-sidebar` |
| `@/components/search-filters` | `@/components/ppt/search-filters` |
| `@/components/ads/*` | `@/components/ppt/ads/*` |
| `@/components/admin/*` | `@/components/ppt/admin/*` |
| `@/components/download/*` | `@/components/ppt/download/*` |

---

## 三、增量迁移策略

### 3.1 分批迁移顺序

| 批次 | 内容 | 文件数 | 依赖 | 验证点 |
|-----|------|-------|------|-------|
| **Phase 1** | 类型定义 + schemas | 10个 | 无 | tsc编译 |
| **Phase 2** | 常量 + 工具函数 | 5个 | Phase 1 | tsc编译 |
| **Phase 3** | Hooks + Actions | 18个 | Phase 2 | tsc编译 |
| **Phase 4** | 业务组件 | 18个 | Phase 3 | tsc编译 + 组件渲染 |
| **Phase 5** | 页面文件 | 11个 | Phase 4 | 页面访问测试 |
| **Phase 6** | 资源文件 | 31个 | 无 | 图片加载 |

### 3.2 每批次执行流程

```
1. 复制文件到目标位置
2. 更新导入路径
3. 应用API适配（toast/auth/i18n）
4. 运行 tsc --noEmit 验证
5. 修复编译错误
6. Git commit
7. 进入下一批次
```

---

## 四、编译验证循环

### 4.1 验证命令

```bash
# 类型检查
pnpm tsc --noEmit

# 代码检查
pnpm lint

# 开发服务器
pnpm dev
```

### 4.2 验证时机

| 时机 | 验证内容 |
|-----|---------|
| 每批次完成后 | tsc --noEmit |
| 组件迁移后 | 组件能否正常渲染 |
| 页面迁移后 | 页面能否正常访问 |
| 全部完成后 | 完整功能测试 |

### 4.3 错误处理原则

- **立即修复**：发现错误立即修复，不累积
- **记录问题**：无法立即修复的问题记录到待办
- **回滚机制**：严重问题可以git reset到上一个稳定点

---

## 五、回滚机制

### 5.1 Git分支策略

```bash
# 迁移前创建分支
git checkout -b feature/ppt-migration

# 每个Phase完成后commit
git add .
git commit -m "Phase 1: 迁移类型定义"

# 出现问题可以回滚
git reset --hard HEAD~1
```

### 5.2 备份策略

- 原始文件保留`.bak`后缀
- 重要修改前先commit
- 保持main分支稳定

---

## 六、运行时验证

### 6.1 页面访问测试

| 页面 | URL | 验证点 |
|-----|-----|-------|
| PPT首页 | `/ppt` | 搜索、分类展示 |
| 分类列表 | `/ppt/categories` | 分类卡片 |
| 分类详情 | `/ppt/category/商务汇报` | PPT列表 |
| PPT详情 | `/ppt/123` | 详情展示、下载 |
| Admin Dashboard | `/admin/ppt` | 统计卡片 |
| PPT列表 | `/admin/ppt/list` | 表格、操作 |
| 用户管理 | `/admin/users` | 用户列表 |
| 统计分析 | `/admin/stats` | 图表 |
| 系统设置 | `/admin/settings` | 表单 |

### 6.2 功能测试

| 功能 | 测试点 |
|-----|-------|
| 搜索 | 输入关键词，显示结果 |
| 分类筛选 | 点击分类，过滤结果 |
| 下载 | 点击下载，弹出模态框 |
| 登录跳转 | 未登录时跳转登录页 |
| Toast提示 | 操作后显示提示 |

---

## 七、完整性报告

### 7.1 报告模板

```markdown
# 迁移完整性报告

## 编译状态
- ✅ 编译通过的文件: X个
- ❌ 编译失败的文件: Y个
- ⚠️ 需要手动处理: Z个

## 页面访问状态
- ✅ 正常访问: X个
- ❌ 访问失败: Y个

## 功能测试状态
- ✅ 通过: X个
- ❌ 失败: Y个

## 待处理问题
1. [问题描述] - [修复方案]
2. ...
```

### 7.2 状态标记

| 标记 | 含义 |
|-----|------|
| ✅ | 完成，无问题 |
| ⚠️ | 完成，有警告 |
| ❌ | 失败，需要修复 |
| 🔄 | 进行中 |
| ⏳ | 待开始 |

---

## 八、已完成的分析文档

| 文档 | 内容 | 状态 |
|-----|------|------|
| `v0-complete-file-inventory.md` | v0项目185个文件完整清单 | ✅ |
| `precise-file-status.md` | 每个文件的迁移状态 | ✅ |
| `v0-dependency-analysis.md` | 7层依赖层级图 | ✅ |
| `adaptation-analysis-toast.md` | Toast API适配 | ✅ |
| `adaptation-analysis-auth.md` | Auth系统适配 | ✅ |
| `adaptation-analysis-i18n.md` | 国际化适配 | ✅ |
| `adaptation-analysis-layout.md` | 布局组件适配 | ✅ |
| `adaptation-analysis-routes.md` | 路由适配 | ✅ |
| `adaptation-summary.md` | 五大适配点汇总 | ✅ |
| `migration-plan.md` | 迁移计划 | 需更新 |

---

## 九、执行清单

### Phase 1: 类型定义 + Schemas (无依赖)

- [ ] 复制 `lib/types/*.ts` → `src/lib/types/ppt/`
- [ ] 复制 `lib/schemas/*.ts` → `src/lib/ppt/schemas/`
- [ ] 运行 tsc --noEmit
- [ ] Git commit

### Phase 2: 常量 + 工具函数

- [ ] 复制 `lib/constants/routes.ts` → `src/lib/constants/ppt-routes.ts`
- [ ] 更新路由路径（添加/ppt前缀等）
- [ ] 复制 `lib/constants/i18n.ts` → `src/lib/constants/ppt-i18n.ts`
- [ ] 复制 `lib/query-keys.ts` → `src/lib/ppt/query-keys.ts`
- [ ] 运行 tsc --noEmit
- [ ] Git commit

### Phase 3: Hooks + Actions

- [ ] 复制 `hooks/*.ts` → `src/hooks/ppt/`
- [ ] 更新导入路径
- [ ] 适配toast调用（sonner）
- [ ] 复制 `lib/actions/*.ts` → `src/actions/ppt/`
- [ ] 运行 tsc --noEmit
- [ ] Git commit

### Phase 4: 业务组件

- [ ] 复制 `components/ppt-card.tsx` → `src/components/ppt/`
- [ ] 复制 `components/search-*.tsx` → `src/components/ppt/`
- [ ] 复制 `components/ads/*.tsx` → `src/components/ppt/ads/`
- [ ] 复制 `components/admin/*.tsx` → `src/components/ppt/admin/`
- [ ] 复制 `components/download/*.tsx` → `src/components/ppt/download/`
- [ ] 更新所有导入路径
- [ ] 适配toast/auth/i18n
- [ ] 运行 tsc --noEmit
- [ ] Git commit

### Phase 5: 页面文件

- [ ] 更新 `(marketing)/ppt/page.tsx` 的导入路径
- [ ] 更新 `(marketing)/ppt/categories/page.tsx`
- [ ] 更新 `(marketing)/ppt/category/[name]/page.tsx`
- [ ] 更新 `(marketing)/ppt/[id]/page.tsx`
- [ ] 更新 `(protected)/admin/ppt/page.tsx`
- [ ] 为admin页面添加DashboardHeader
- [ ] 运行 tsc --noEmit
- [ ] 启动dev server测试页面
- [ ] Git commit

### Phase 6: 资源文件

- [ ] 复制 `public/*.png` → `public/ppt/`
- [ ] 更新组件中的图片路径
- [ ] 验证图片加载
- [ ] Git commit

---

## 十、总结

### 核心原则

1. **先分析，再执行** - 完整的文件清单和依赖分析
2. **增量迁移** - 分批次，每批验证
3. **立即修复** - 发现错误立即处理
4. **回滚机制** - Git分支保护
5. **运行时验证** - 不只是编译通过，还要功能正常

### 方法论流程

```
文件清单 → 依赖分析 → API兼容性检测 → 路径映射
    ↓
增量迁移（Phase 1-6）
    ↓
每批次：复制 → 适配 → 验证 → 提交
    ↓
完整性报告
```
