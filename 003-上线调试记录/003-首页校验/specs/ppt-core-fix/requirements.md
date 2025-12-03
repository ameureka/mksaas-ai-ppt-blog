# 需求文档：PPT 核心链路修复

## 简介

本文档规定了修复 PPT 核心业务流程数据链路的需求。目标是将 API 验证逻辑与统一常量对齐，确保从数据库到前端的数据传输（如标签）完整，并增强搜索能力。

## 术语表

- **PPT_DTO**: 用于将 PPT 数据发送到前端的数据传输对象 (Data Transfer Object)。
- **Centralized_Constants** (统一常量): 定义有效分类和语言的单一事实来源配置文件 (`src/lib/constants/ppt.ts`)。
- **Search_Keyword** (搜索关键词): 用户提供的用于筛选 PPT 的文本字符串。

## 需求 (Requirements)

### 1. API 分类验证

**用户故事:** 作为开发人员，我希望 API 能识别项目常量中定义的所有有效分类，这样我就不必每次添加新分类时都手动更新 API 代码。

#### 验收标准 (Acceptance Criteria)

1. **THE** (该) API **SHALL** (必须) 使用 **Centralized_Constants** 中的 `PPT_CATEGORIES` 列表来验证 `category` 查询参数。
2. **IF** (如果) 一个分类参数与 `PPT_CATEGORIES` 中的某个值匹配，**THEN THE** (那么该) API **SHALL** (必须) 将其传递给后端查询服务。
3. **IF** (如果) 一个分类参数与 `PPT_CATEGORIES` 中的任何值都不匹配，**THEN THE** (那么该) API **SHALL** (必须) 忽略该参数（视为“全部”）。

### 2. DTO 数据完整性

**用户故事:** 作为用户，我希望看到每个 PPT 的标签和描述，以便我能更好地理解内容。

#### 验收标准 (Acceptance Criteria)

1. **THE** (该) 系统 **SHALL** (必须) 将数据库的 `tags` 数组 (text[]) 映射到 **PPT_DTO** 的 `tags` 字段。
2. **WHERE** (当) 数据库的 `description` 字段缺失或为空时，**THE** (该) 系统 **SHALL** (必须) 将 **PPT_DTO** 的 `description` 字段映射为 PPT 标题或空字符串。
3. **WHERE** (当) 数据库的 `file_size` 字段缺失或为空时，**THE** (该) 系统 **SHALL** (必须) 将 **PPT_DTO** 的 `file_size` 字段映射为默认值（例如 "未知"）。

### 3. 增强搜索逻辑

**用户故事:** 作为用户，我希望使用可能出现在标签中的关键词来搜索 PPT，而不仅仅是标题，这样我可以更容易地找到相关内容。

#### 验收标准 (Acceptance Criteria)

1. **WHERE** (当) 提供了 **Search_Keyword** (搜索关键词) 时，**THE** (该) 系统 **SHALL** (必须) 返回 `title` (标题) **OR** (或) `author` (作者) **OR** (或) `tags` (标签) 中包含该关键词的 PPT。
2. **THE** (该) 搜索匹配 **SHALL** (必须) 不区分大小写。
