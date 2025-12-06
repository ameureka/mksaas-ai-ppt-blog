# 实施计划 (Implementation Plan)

- [x] 1. 修复 API Route 验证
  - 在 `src/app/api/ppts/route.ts` 中导入 `src/lib/constants/ppt` 中的 `PPT_CATEGORY_VALUES`（已完成）。
  - 用常量替换硬编码的 `VALID_CATEGORIES` 数组（已完成，常量裁剪为 12 项）。
  - _Requirements: 1.1, 1.2, 1.3_

- [ ]* 1.1 验证分类一致性
  - **Property 1: 分类一致性**
  - 验证 `PPT_CATEGORIES` 中的每个分类都能通过 API 的内部验证检查。（当前：满足，需随裁剪重验）
  - **Validates: Requirements 1.1**

- [x] 2. 修复 Server Action DTO 映射（部分）
  - 修改 `src/actions/ppt/ppt.ts` 中的 `toPPTDto`，映射 `tags`（已完成）。
  - 添加 `description` 回退（使用 `row.title`）（已完成）。
  - `file_size` 仍为空串，需后续回退或 DB 字段（未完成）。
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 2.1 编写属性测试: DTO 完整性
  - **Property 2: DTO 标签保留**
  - **Validates: Requirements 2.1**

- [x] 3. 增强搜索逻辑
  - 修改 `src/actions/ppt/ppt.ts` 中的 `buildWhere`（已扩展到 tags）。
  - _Requirements: 3.1, 3.2_

- [ ]* 3.1 编写属性测试: 搜索逻辑
  - **Property 3: 搜索召回**
  - **Property 4: 搜索大小写不敏感**
  - **Validates: Requirements 3.1, 3.2**

- [ ] 4. 前端落地/验证
  - 前端分类来源改用 `src/lib/constants/ppt.ts`，去除硬编码（首页/分类页/筛选/导航）。——首页/分类页已完成，筛选/导航待确认。
  - 确保编译通过，手动验证搜索/筛选行为符合预期。
