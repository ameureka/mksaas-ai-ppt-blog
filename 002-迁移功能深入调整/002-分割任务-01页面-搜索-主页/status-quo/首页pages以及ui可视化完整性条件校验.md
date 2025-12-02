# 首页 Pages 及 UI 可视化完整性条件校验

> **生成时间**: 2025年11月28日
> **文档目的**: 在执行去 Mock 化重构前，全面核查“首页显示完整性”的必要条件，识别并记录潜在风险。

## 1. 核心目标
确保 `/ppt` 首页在接入真实数据库后，能够完整、稳定地展示内容，**零裂图、零布局错乱、零数据空白**。

## 2. 数据库字段与 UI 要素匹配度分析 (Database Audit)

| 页面 UI 要素 | 对应数据库字段 (`ppt` 表) | 状态 | 风险/对策 |
| :--- | :--- | :--- | :--- |
| **卡片标题** | `title` | ✅ 匹配 | - |
| **卡片封面** | `thumbnail_url` / `cover_image_url` | ✅ 匹配 | **高风险**: 链接有效性未知，需完善回退策略。 |
| **作者** | `author` | ✅ 匹配 | - |
| **下载量** | `download_count` | ✅ 匹配 | - |
| **浏览量** | `view_count` | ✅ 匹配 | - |
| **页数** | `slides_count` | ✅ 匹配 | - |
| **分类筛选** | `category` | ✅ 匹配 | **注意**: 需确保前端常量包含 DB 中的 slug 值。 |
| **语言筛选** | `language` | ✅ 匹配 | - |
| **标签** | `tags` | ✅ 匹配 | 需正确解析 `text[]` 类型。 |
| **文件大小** | ❌ 无 | ⚠️ 缺失 | DTO 需返回空串，前端 UI 需隐藏该字段展示。 |
| **简介** | ❌ 无 | ⚠️ 缺失 | DTO 需返回空串，前端 UI 需做空值处理。 |

## 3. 资源与配置完整性检查 (Resource Audit)

### 3.1 图片资源 (Images)
*   **占位符**: 代码中引用了 `/placeholder.svg`，但 **`public/` 根目录下不存在该文件**。
    *   **后果**: 图片加载失败时，回退逻辑会导致 404 裂图。
    *   **对策**: 需检查子目录或新生成一个 `placeholder.svg`。
*   **数据源**: 数据库样本显示图片来自 `aippt.guochunlin.com`。

### 3.2 域名配置 (Next.js Config)
*   **文件**: `next.config.ts`
*   **现状**: `remotePatterns` **未包含** `aippt.guochunlin.com`。
*   **风险**: 即使开启 `unoptimized: true`，使用 `Next.js` 的 `<Image>` 组件仍可能因域名未白名单化而报错或警告。
*   **对策**: 必须将该域名加入 `remotePatterns`。

## 4. 执行前置修复计划 (Pre-flight Checklist)

在启动后端重构代码之前，必须完成以下物理修复：

1.  **[资源] 补全占位图**:
    *   检查 `public/images` 或 `public/ppt` 是否有可用图。
    *   若无，生成标准 `public/placeholder.svg`。
2.  **[配置] 域名白名单**:
    *   修改 `next.config.ts`，添加 `aippt.guochunlin.com`。
3.  **[代码] 常量定义**:
    *   创建 `src/lib/constants/ppt.ts`，确保 `CATEGORIES` 覆盖数据库现有的 slug (`business`, `general`, `marketing` 等)。

## 5. 结论
基础架构满足实施条件，但**图片显示的稳定性存在重大隐患**。执行上述修复后，方可保证首页 UI 的可视化完整性。
