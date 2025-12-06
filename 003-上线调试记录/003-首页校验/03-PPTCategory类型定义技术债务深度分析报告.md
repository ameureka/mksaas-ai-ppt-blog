# PPTCategory 类型定义技术债务深度分析报告

**日期**: 2025年12月3日
**更新**: 2025年12月7日 (基于数据库优化 R1-R10 校验)
**状态**: 🟡 部分待清理

---

## 一、问题全景图

### 1.1 发现的所有 PPTCategory 定义位置

| # | 文件路径 | 定义方式 | 分类值 | 被引用情况 | 状态 |
|---|----------|----------|--------|------------|------|
| 1 | `src/lib/constants/ppt.ts` | const array + 推导类型 | **12个** | ✅ SSOT - API/类型/前端 | ✅ 保留 |
| 2 | `src/lib/types/ppt/ppt.ts` | 从常量推导 | 12个 | ✅ 主要使用 | ✅ 保留 |
| 3 | `src/types/ppt.ts` | 从常量推导 | 12个 | ⚠️ 仅 query-keys 引用 | ❌ 待删除 |
| 4 | `src/schemas/ppt.ts` | Zod enum | **8个** (含 other) | ❌ 无引用 | ❌ 待删除 |
| 5 | `src/lib/ppt/schemas/ppt.ts` | Zod enum | **8个** (含 other) | ⚠️ 仅测试引用 | ⚠️ 待同步 |

### 1.2 数据库 category 字段设计

根据 `src/db/schema.ts`：

```typescript
category: text("category"), // 无约束，任意字符串
```

**设计说明**:
- 数据库层不做枚举约束，保持灵活性
- 应用层通过 `PPT_CATEGORY_VALUES` 校验
- 这是**有意设计**，便于后续扩展分类

---

## 二、分类值对比矩阵 (2025-12-07 更新)

```
                    constants  types/ppt  schemas/ppt  lib/ppt/schemas  DB
business            ✅          ✅         ✅           ✅               text
education           ✅          ✅         ✅           ✅               text
technology          ✅          ✅         ✅           ✅               text
design              ✅          ✅         ❌           ❌               text
marketing           ✅          ✅         ✅           ✅               text
hr                  ✅          ✅         ❌           ❌               text
medical             ✅          ✅         ❌           ❌               text
finance             ✅          ✅         ❌           ❌               text
general             ✅          ✅         ❌           ❌               text
summary             ✅          ✅         ✅           ✅               text
report              ✅          ✅         ✅           ✅               text
plan                ✅          ✅         ✅           ✅               text
other               ❌          ❌         ✅           ✅               text
```

**问题**: Zod Schema 枚举与常量不一致（8类 vs 12类，且多了 `other`）

---

## 三、数据流链路分析

### 3.1 正确链路 (已落地) ✅

```
src/lib/constants/ppt.ts (SSOT - 12类)
    │
    ├──→ src/lib/types/ppt/ppt.ts (类型推导)
    │         │
    │         ├──→ src/actions/ppt/ppt.ts (Server Action)
    │         │
    │         └──→ src/app/api/ppts/route.ts (API 校验)
    │
    └──→ src/app/[locale]/(marketing)/ppt/page.tsx (首页分类)
```

### 3.2 问题链路 (待清理) ❌

```
src/types/ppt.ts (重复)
    └──→ src/lib/query-keys.ts (唯一引用，需迁移)

src/schemas/ppt.ts (重复，8类)
    └──→ (无引用，直接删除)

src/lib/ppt/schemas/ppt.ts (8类，不同步)
    └──→ (仅测试引用，需同步为12类)
```

---

## 四、关键问题诊断 (2025-12-07 更新)

### ✅ 已解决: 分类源统一
- API/类型/首页/分类页均引用 `src/lib/constants/ppt.ts`

### 🔴 待解决: 重复文件未清理

| 文件 | 问题 | 操作 |
|------|------|------|
| `src/types/ppt.ts` | 与 `src/lib/types/ppt/ppt.ts` 重复 | 迁移引用后删除 |
| `src/schemas/ppt.ts` | 无引用，8类枚举过时 | 直接删除 |
| `src/lib/ppt/schemas/ppt.ts` | 8类枚举，与常量不同步 | 同步为12类或删除 |

### 🔴 待解决: query-keys 引用旧路径

```typescript
// 当前 (src/lib/query-keys.ts)
import type { PPTListParams } from '@/types/ppt';

// 应改为
import type { PPTListParams } from '@/lib/types/ppt/ppt';
```

---

## 五、根因分析

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              技术债务根因                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. 迁移/重构不彻底                                                         │
│     └──→ src/types/ 和 src/lib/types/ 并存                                 │
│     └──→ src/schemas/ 和 src/lib/ppt/schemas/ 并存                         │
│     └──→ 旧文件未清理                                                       │
│                                                                             │
│  2. Zod Schema 未与常量同步                                                 │
│     └──→ 常量扩展到 12 类后，Zod 枚举未更新                                 │
│     └──→ Zod 仍包含 `other`，常量已移除                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 六、修复建议（优先级排序）

### P0 - 立即修复

| # | 问题 | 修复方案 | 文件 |
|---|------|----------|------|
| 1 | query-keys 引用旧路径 | 改为 `@/lib/types/ppt/ppt` | `src/lib/query-keys.ts` |
| 2 | 删除重复类型文件 | 直接删除 | `src/types/ppt.ts` |
| 3 | 删除重复 Schema 文件 | 直接删除 | `src/schemas/ppt.ts` |

### P1 - 短期清理

| # | 问题 | 修复方案 | 文件 |
|---|------|----------|------|
| 4 | Zod 枚举不同步 | 改为 12 类，移除 `other` | `src/lib/ppt/schemas/ppt.ts` |

### P2 - 可选优化

| # | 问题 | 修复方案 |
|---|------|----------|
| 5 | 数据库无分类约束 | 可考虑添加 CHECK 约束（非必须） |

---

## 七、文件清理计划

### 删除文件

```bash
# 1. 删除重复类型文件
rm src/types/ppt.ts

# 2. 删除重复 Schema 文件
rm src/schemas/ppt.ts
```

### 迁移引用

```typescript
// src/lib/query-keys.ts
- import type { PPTListParams } from '@/types/ppt';
+ import type { PPTListParams } from '@/lib/types/ppt/ppt';
```

### 同步 Zod 枚举

```typescript
// src/lib/ppt/schemas/ppt.ts
export const pptCategoryEnum = z.enum([
  'business',
  'education',
  'technology',
  'design',      // 新增
  'marketing',
  'hr',          // 新增
  'medical',     // 新增
  'finance',     // 新增
  'general',     // 新增
  'summary',
  'report',
  'plan',
  // 移除 'other'
]);
```

---

## 八、结论

### 当前状态

| 维度 | 状态 | 说明 |
|------|------|------|
| 分类常量 | ✅ 已统一 | 12 类，SSOT |
| API 校验 | ✅ 已落地 | 引用常量 |
| 类型定义 | ✅ 已落地 | 从常量推导 |
| 前端引用 | ✅ 已落地 | 首页/分类页 |
| 重复文件 | ❌ 待清理 | 3 个文件 |
| Zod 枚举 | ❌ 待同步 | 8类 vs 12类 |

### 清理后的目标架构

```
src/lib/constants/ppt.ts (SSOT - 唯一分类定义)
    │
    ├──→ src/lib/types/ppt/ppt.ts (类型推导)
    │
    ├──→ src/lib/ppt/schemas/ppt.ts (Zod 从常量推导)
    │
    ├──→ src/actions/ppt/ppt.ts
    │
    ├──→ src/app/api/ppts/route.ts
    │
    └──→ 前端组件
```

---

## 九、附录：文件引用关系图 (清理后)

```
src/lib/constants/ppt.ts (SSOT)
    ├── src/lib/types/ppt/ppt.ts
    │       ├── src/actions/ppt/ppt.ts
    │       ├── src/app/api/ppts/route.ts
    │       ├── src/hooks/ppt/*.ts
    │       ├── src/components/ppt/admin/*.tsx
    │       └── src/lib/query-keys.ts (迁移后)
    │
    └── src/lib/ppt/schemas/ppt.ts (同步后)

已删除:
    ├── src/types/ppt.ts ❌
    └── src/schemas/ppt.ts ❌
```
