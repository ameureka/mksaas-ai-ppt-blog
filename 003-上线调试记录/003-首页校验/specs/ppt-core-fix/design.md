# 功能设计：PPT 核心链路修复

## 概述
本设计旨在解决系统分析中发现的数据链路断裂问题。它统一了 API 验证逻辑与共享常量库，实现了数组类型（标签）的正确 DTO 映射，并将搜索查询范围扩展到包含标签。

## 架构

无重大架构变更。数据流保持不变：
`Frontend (前端) -> API Route (路由) -> Server Action (服务端操作/Drizzle ORM) -> Database (数据库)`

## 组件与接口

### 1. 共享常量 (`src/lib/constants/ppt.ts`)
现有组件。将被 API Route 引用。

### 2. 服务端操作 (`src/actions/ppt/ppt.ts`)

#### DTO 映射更新
`toPPTDto` 函数需要显式处理 `tags` 的映射和回退值 (fallback values)。

```typescript
// 数据模型参考 (DB Schema)
interface DB_PPT_Row {
  id: string;
  title: string;
  tags: string[] | null; // Drizzle 可能会根据驱动返回 null 或 []
  // ... 其他字段
}

// 输出接口 (Frontend)
interface PPT {
  // ...
  tags: string[];
  description: string;
  file_size: string;
}
```

#### 搜索查询更新
`buildWhere` 函数需要构建更复杂的 `OR` 子句。

```typescript
// 逻辑伪代码
or(
  ilike(table.title, `%${keyword}%`),
  ilike(table.author, `%${keyword}%`),
  sql`array_to_string(${table.tags}, ',') ILIKE ${`%${keyword}%`}` // Postgres 特有写法
)
```

## 正确性属性 (Correctness Properties)

### 属性 1: 分类一致性 (Category Consistency)
*For any* (对于任何) 在 `PPT_CATEGORIES` 中定义的分类 `c`，API Route 的验证逻辑都应该接受 `c` 作为有效的筛选参数。

**验证需求: 1.1, 1.2**

### 属性 2: DTO 标签保留 (DTO Tag Preservation)
*For any* (对于任何) 具有非空标签列表的数据库行 `r`，转换后的 `PPT_DTO` 必须包含一个与 `r.tags` 深度相等的 `tags` 数组。

**验证需求: 2.1**

### 属性 3: 搜索召回 (Search Recall)
*For any* (对于任何) 具有特定标签 `t` 的 PPT 记录 `p`，对 `t` 的搜索查询结果集应该包含 `p`。

**验证需求: 3.1**

### 属性 4: 搜索大小写不敏感 (Search Case Insensitivity)
*For any* (对于任何) 标题为 `T` 的 PPT 记录 `p`，搜索 `lowercase(T)` (小写) 或 `uppercase(T)` (大写) 都应该在结果集中包含 `p`。

**验证需求: 3.2**

## 测试策略

### 单元测试
- 测试 `toPPTDto` 在各种 DB 行状态下（标签为 null、标签为空、描述缺失）的表现。
- 测试 `buildWhere` 生成正确的搜索 SQL 结构。

### 属性测试 (使用 `fast-check`)
- **DTO 完整性**: 生成随机 DB 行并验证 DTO 字段是否匹配。
- **搜索逻辑**: (Mock DB) 生成 PPT 列表，随机选择标签，验证筛选逻辑是否保留了该 PPT。

## 错误处理
- 如果 DB `tags` 为 null，DTO `tags` 应为 `[]`。
- 如果 `description` 缺失，回退使用标题，防止 UI Hydration 错误。
