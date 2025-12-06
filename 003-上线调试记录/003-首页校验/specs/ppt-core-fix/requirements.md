# 需求文档：PPT 核心链路修复

## 简介

本文档规定了修复 PPT 核心业务流程数据链路的需求。目标是：
1. 建立单一数据源（SSOT）架构，统一分类定义（常量裁剪为 12 类，前后端已落地）
2. 将 API 验证逻辑与统一常量对齐（✅ 已对齐）
3. 确保从数据库到前端的数据传输完整（tags/language/description 回填已接入，file_size 仍为空）
4. 前端页面引用统一常量，消除硬编码（✅ 已落地）
5. 清理重复的类型定义文件（⏳ 待清理）
6. 增强搜索能力（⏳ tags 未加入搜索/前端筛选）

## 术语表

- **PPT_DTO**: 用于将 PPT 数据发送到前端的数据传输对象 (Data Transfer Object)。
- **SSOT** (Single Source of Truth): 单一数据源，指 `src/lib/constants/ppt.ts` 作为分类定义的唯一来源。
- **Centralized_Constants** (统一常量): 定义有效分类和语言的单一事实来源配置文件 (`src/lib/constants/ppt.ts`)。
- **Search_Keyword** (搜索关键词): 用户提供的用于筛选 PPT 的文本字符串。
- **Category_Slug**: 分类的英文标识符（如 `business`、`education`），用于 URL 和 API 参数。
- **Frontend_Page**: 前端页面组件，包括首页 (`ppt/page.tsx`) 和分类页 (`ppt/categories/page.tsx`)。

## 需求 (Requirements)

### 1. API 分类验证

**用户故事:** 作为开发人员，我希望 API 能识别项目常量中定义的所有有效分类，这样我就不必每次添加新分类时都手动更新 API 代码。

#### 验收标准 (Acceptance Criteria)

1. **THE** API **SHALL** 使用 **Centralized_Constants** 中的 `PPT_CATEGORIES` 列表来验证 `category` 查询参数。（当前：已实现，常量为 12 项）
2. **IF** 一个分类参数与 `PPT_CATEGORIES` 中的某个值匹配，**THEN THE** API **SHALL** 将其传递给后端查询服务。（当前：满足）
3. **IF** 一个分类参数与 `PPT_CATEGORIES` 中的任何值都不匹配，**THEN THE** API **SHALL** 忽略该参数（视为“全部”）。（当前：满足）

### 2. DTO 数据完整性

**用户故事:** 作为用户，我希望看到每个 PPT 的标签和描述，以便我能更好地理解内容。

#### 验收标准 (Acceptance Criteria)

1. **THE** 系统 **SHALL** 将数据库的 `tags` 数组 (text[]) 映射到 **PPT_DTO** 的 `tags` 字段。（当前：已实现）
2. **WHERE** 数据库的 `description` 字段缺失或为空时，**THE** 系统 **SHALL** 将 **PPT_DTO** 的 `description` 字段映射为 PPT 标题或空字符串。（当前：已回填标题）
3. **WHERE** 数据库的 `file_size` 字段缺失或为空时，**THE** 系统 **SHALL** 将 **PPT_DTO** 的 `file_size` 字段映射为默认值（例如 "未知"）。（当前：回填“未知”，建议后续补字段）

### 3. 增强搜索逻辑

**用户故事:** 作为用户，我希望使用可能出现在标签中的关键词来搜索 PPT，而不仅仅是标题，这样我可以更容易地找到相关内容。

#### 验收标准 (Acceptance Criteria)

1. **WHERE** 提供了 **Search_Keyword** 时，**THE** 系统 **SHALL** 返回 `title` **OR** `author` **OR** `tags` 中包含该关键词的 PPT。（当前：后端已覆盖 tags，前端筛选待同步）
2. **THE** 搜索匹配 **SHALL** 不区分大小写。（当前：title/author 满足）
