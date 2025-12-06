# PPT 分类系统重构方案 - 单一数据源设计

**日期**: 2025年12月3日
**更新**: 2025年12月7日 (基于数据库优化 R1-R10 校验)
**状态**: 🟡 部分已实施，DTO 映射待修复

---

## 一、现状分析 (2025-12-07 更新)

### 1.1 数据库实际数据

| 分类 slug | 数量 | 占比 |
|-----------|------|------|
| business | 743 | 50.5% |
| education | 550 | 37.4% |
| technology | 73 | 5.0% |
| design | 44 | 3.0% |
| marketing | 28 | 1.9% |
| hr | 15 | 1.0% |
| medical | 14 | 1.0% |
| finance | 3 | 0.2% |
| general | 1 | 0.1% |

**总计**: 9 个分类有数据，1,471 条 PPT 记录，36,497 条 Slide 记录

### 1.2 数据库 ppt 表字段 (R10 已优化)

| 字段 | 类型 | 状态 | 说明 |
|------|------|------|------|
| description | text | ✅ 已添加 | R10 SEO 描述 |
| file_size | **integer** | ✅ 已添加 | R10 文件大小（字节） |
| file_format | text | ✅ 已添加 | R10 默认 'pptx' |
| deleted_at | timestamp | ✅ 已添加 | R6 软删除 |
| category | text | ⚠️ 无约束 | 应用层校验 |

### 1.3 代码现状

| 模块 | 状态 | 问题 |
|------|------|------|
| 分类常量 | ✅ 已统一 | 12 类，SSOT |
| API 校验 | ✅ 已落地 | 引用常量 |
| 类型定义 | ⚠️ 需修复 | file_size 应为 number |
| DTO 映射 | 🔴 需修复 | 未使用 DB 字段 |
| 重复文件 | 🔴 待清理 | 3 个文件 |

---

## 二、目标分类体系 (12类)

| # | slug | 中文名 | 英文名 | DB 数据 |
|---|------|--------|--------|---------|
| 1 | business | 商务汇报 | Business | ✅ 743条 |
| 2 | education | 教育培训 | Education | ✅ 550条 |
| 3 | technology | 科技互联网 | Technology | ✅ 73条 |
| 4 | design | 设计创意 | Design | ✅ 44条 |
| 5 | marketing | 产品营销 | Marketing | ✅ 28条 |
| 6 | hr | 人力资源 | HR | ✅ 15条 |
| 7 | medical | 医疗健康 | Medical | ✅ 14条 |
| 8 | finance | 金融财务 | Finance | ✅ 3条 |
| 9 | general | 通用模板 | General | ✅ 1条 |
| 10 | summary | 年终总结 | Summary | 🆕 待填充 |
| 11 | report | 述职报告 | Report | 🆕 待填充 |
| 12 | plan | 工作计划 | Plan | 🆕 待填充 |

---

## 三、架构设计

### 3.1 数据流架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           单一数据源架构                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  src/lib/constants/ppt.ts (SSOT - 12类)                                    │
│         │                                                                   │
│         ├──→ src/lib/types/ppt/ppt.ts (类型推导) ✅                         │
│         │                                                                   │
│         ├──→ src/actions/ppt/ppt.ts (Server Action) ⚠️ DTO 待修复          │
│         │         │                                                         │
│         │         └──→ src/app/api/ppts/route.ts (API) ✅                   │
│         │                                                                   │
│         └──→ 前端组件 (首页/分类页) ✅                                       │
│                                                                             │
│  数据库 ppt 表                                                              │
│         ├── description (text) ✅ R10                                       │
│         ├── file_size (integer) ✅ R10                                      │
│         ├── file_format (text) ✅ R10                                       │
│         └── deleted_at (timestamp) ✅ R6                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 验证逻辑位置

| 层级 | 验证方式 | 说明 |
|------|----------|------|
| 数据库 | ❌ 不验证 | category 为 text，保持灵活 |
| API Route | ✅ 验证 | 使用 `PPT_CATEGORY_VALUES` |
| Server Action | ✅ 验证 | 同上 |
| 前端组件 | ✅ 类型约束 | TypeScript 编译时检查 |

---

## 四、核心代码修复

### 4.1 DTO 映射修复 (P0) 🔴

**文件**: `src/actions/ppt/ppt.ts`

```typescript
const toPPTDto = (row: typeof pptTable.$inferSelect): PPT => ({
  id: row.id,
  title: row.title,
  category: (row.category ?? 'general') as PPT['category'],
  author: row.author ?? 'Unknown',
  // ✅ 修复: 使用 DB 字段
  description: row.description ?? row.title ?? '',
  tags: row.tags ?? [],
  language: row.language ?? '',
  slides_count: row.slidesCount ?? 0,
  // ✅ 修复: 使用 DB 字段 (integer)
  file_size: row.fileSize ?? 0,
  file_url: row.fileUrl,
  preview_url: row.thumbnailUrl ?? row.coverImageUrl ?? undefined,
  downloads: row.downloadCount ?? 0,
  views: row.viewCount ?? 0,
  status: (row.status ?? 'draft') as PPT['status'],
  uploaded_at: row.createdAt?.toISOString() ?? '',
  created_at: row.createdAt?.toISOString() ?? '',
  updated_at: row.updatedAt?.toISOString() ?? '',
});
```

### 4.2 类型定义修复 (P0) 🔴

**文件**: `src/lib/types/ppt/ppt.ts`

```typescript
export interface PPT {
  id: string;
  title: string;
  category: PPTCategory;
  author: string;
  description?: string;
  tags?: string[];
  language?: string;
  slides_count: number;
  // ✅ 修复: 改为 number，与 DB integer 对应
  file_size: number;
  file_url: string;
  preview_url?: string;
  downloads: number;
  views: number;
  status?: PPTStatus;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}
```

### 4.3 查询过滤软删除 (P1) 🟡

**文件**: `src/actions/ppt/ppt.ts`

```typescript
import { isNull } from 'drizzle-orm';

const buildWhere = (params?: PPTListParams) => {
  const conditions = [];
  
  // ✅ 过滤软删除记录
  conditions.push(isNull(pptTable.deletedAt));
  
  if (params?.search?.trim()) {
    // ... 搜索条件
  }
  
  if (params?.category) {
    conditions.push(eq(pptTable.category, params.category));
  }
  
  // ... 其他条件
  
  return conditions.length ? and(...conditions) : undefined;
};
```

### 4.4 文件清理 (P1) 🟡

```bash
# 1. 迁移 query-keys 引用
# src/lib/query-keys.ts: @/types/ppt → @/lib/types/ppt/ppt

# 2. 删除重复文件
rm src/types/ppt.ts
rm src/schemas/ppt.ts

# 3. 同步 Zod 枚举 (可选)
# src/lib/ppt/schemas/ppt.ts: 8类 → 12类
```

---

## 五、实施步骤

### 阶段 1：DTO 与类型修复 (10分钟) 🔴

| 步骤 | 操作 | 文件 |
|------|------|------|
| 1.1 | 修改 file_size 类型为 number | `src/lib/types/ppt/ppt.ts` |
| 1.2 | 更新 toPPTDto 映射 description | `src/actions/ppt/ppt.ts` |
| 1.3 | 更新 toPPTDto 映射 file_size | `src/actions/ppt/ppt.ts` |

### 阶段 2：查询优化 (5分钟) 🟡

| 步骤 | 操作 | 文件 |
|------|------|------|
| 2.1 | buildWhere 添加 deleted_at 过滤 | `src/actions/ppt/ppt.ts` |

### 阶段 3：文件清理 (10分钟) 🟡

| 步骤 | 操作 | 文件 |
|------|------|------|
| 3.1 | 迁移 query-keys 引用 | `src/lib/query-keys.ts` |
| 3.2 | 删除 src/types/ppt.ts | - |
| 3.3 | 删除 src/schemas/ppt.ts | - |
| 3.4 | 同步 Zod 枚举 (可选) | `src/lib/ppt/schemas/ppt.ts` |

### 阶段 4：验证 (10分钟)

| 步骤 | 操作 |
|------|------|
| 4.1 | `pnpm lint` 通过 |
| 4.2 | `pnpm build` 成功 |
| 4.3 | 手动测试首页/分类/搜索 |

---

## 六、风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| file_size 类型变更 | 前端显示 | 低 | 前端格式化为可读字符串 |
| 软删除过滤 | 查询结果变化 | 低 | 当前无软删除数据 |
| 重复文件删除 | 编译失败 | 中 | 先迁移引用再删除 |

---

## 七、预期收益

### 技术收益

| 收益 | 说明 |
|------|------|
| 数据库与代码同步 | DTO 使用真实 DB 字段 |
| 类型安全 | file_size 类型正确 |
| 代码简化 | 删除 3 个重复文件 |
| 软删除支持 | 查询自动过滤 |

### 业务收益

| 收益 | 说明 |
|------|------|
| SEO 优化 | description 字段可用 |
| 文件信息 | file_size 真实显示 |
| 数据完整性 | 软删除不影响统计 |

---

## 八、检查清单

### 已完成 ✅

- [x] 分类常量统一 (12类)
- [x] API 校验引用常量
- [x] 类型定义从常量推导
- [x] 前端引用常量
- [x] 数据库添加 description 字段 (R10)
- [x] 数据库添加 file_size 字段 (R10)
- [x] 数据库添加 deleted_at 字段 (R6)

### 待完成 ⏳

- [ ] toPPTDto 映射 description
- [ ] toPPTDto 映射 file_size
- [ ] PPT 接口 file_size 改为 number
- [ ] buildWhere 过滤 deleted_at
- [ ] 迁移 query-keys 引用
- [ ] 删除 src/types/ppt.ts
- [ ] 删除 src/schemas/ppt.ts
- [ ] 同步 Zod 枚举为 12 类

---

## 九、数据库与代码同步状态

```
数据库 (已完善)              代码 (待同步)
─────────────────────────────────────────────
ppt.description ✅      →   toPPTDto 未映射 ❌
ppt.file_size ✅        →   toPPTDto 未映射 ❌
ppt.file_format ✅      →   接口未定义 ⚠️
ppt.deleted_at ✅       →   查询未过滤 ⚠️
重复文件                →   待清理 ❌
```

**目标**: 完成代码同步后，数据库设计与应用层完全对齐。
