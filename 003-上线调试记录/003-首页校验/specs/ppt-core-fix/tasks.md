# 实施计划 (Implementation Plan)

- [ ] 1. 修复 API Route 验证
  - 在 `src/app/api/ppts/route.ts` 中导入 `src/lib/constants/ppt` 中的 `PPT_CATEGORIES`。
  - 用从 `PPT_CATEGORIES` 映射出的值替换硬编码的 `VALID_CATEGORIES` 数组。
  - _Requirements: 1.1, 1.2, 1.3_

- [ ]* 1.1 验证分类一致性
  - **Property 1: 分类一致性**
  - 验证 `PPT_CATEGORIES` 中的每个分类都能通过 API 的内部验证检查。
  - **Validates: Requirements 1.1**

- [ ] 2. 修复 Server Action DTO 映射
  - 修改 `src/actions/ppt/ppt.ts` 中的 `toPPTDto`。
  - 确保 `tags` 从 `row.tags` 映射（处理 null/undefined -> []）。
  - 添加 `description` 的回退（使用 `row.title` 或空字符串）。
  - 添加 `file_size` 的回退（使用 "未知"）。
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 2.1 编写属性测试: DTO 完整性
  - **Property 2: DTO 标签保留**
  - **Validates: Requirements 2.1**

- [ ] 3. 增强搜索逻辑
  - 修改 `src/actions/ppt/ppt.ts` 中的 `buildWhere`。
  - 实现 Drizzle `or()` 条件，使其包含对标题、作者 **以及** 标签的 `ilike` 搜索。
  - 注意：对于 Postgres 中的数组列，如果 `arrayContains` 或类似方法不足以支持部分文本搜索，请使用 `sql` 操作符或 `array_to_string` 方法。
  - _Requirements: 3.1, 3.2_

- [ ]* 3.1 编写属性测试: 搜索逻辑
  - **Property 3: 搜索召回**
  - **Property 4: 搜索大小写不敏感**
  - **Validates: Requirements 3.1, 3.2**

- [ ] 4. Checkpoint - 验证修复
  - 确保编译通过。
  - 验证前端的手动搜索行为符合预期。
