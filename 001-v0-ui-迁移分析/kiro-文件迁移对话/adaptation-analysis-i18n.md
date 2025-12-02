# 国际化i18n适配点深度分析

## 一、两套系统对比

### v0的i18n系统（常量对象）

```typescript
// 文件: vo-ui-code-pro/v0mksaaspptsite/lib/constants/i18n.ts

export const ADMIN_I18N = {
  common: {
    cancel: "取消",
    confirm: "确认",
    save: "保存",
    // ...
  },
  ppt: {
    titleLabel: "标题",
    deleteSuccess: "PPT已删除",
    // ...
  },
  // ...
}

// 使用方式
import { ADMIN_I18N } from '@/lib/constants/i18n'
<span>{ADMIN_I18N.ppt.titleLabel}</span>
toast.success(ADMIN_I18N.ppt.deleteSuccess)
```

**特点**：
- 纯TypeScript常量对象
- 只支持中文（硬编码）
- 无动态切换语言能力
- 类型安全（TypeScript推断）

### mksaas的i18n系统（next-intl）

```typescript
// 文件: messages/zh.json + messages/en.json

// 使用方式
import { useTranslations } from 'next-intl'
const t = useTranslations('Dashboard.admin.users')
<span>{t('pageTitle')}</span>
toast.success(t('deleteSuccess'))
```

**特点**：
- 基于next-intl库
- 支持多语言（中文/英文）
- 动态切换语言
- JSON配置文件
- 支持参数插值 `{count}`

---

## 二、迁移思路

### 核心原则

**将v0的i18n常量转换为mksaas的next-intl格式**

### 两种方案

#### 方案A：完全转换为next-intl（推荐）

将v0的`ADMIN_I18N`常量转换为`messages/zh.json`和`messages/en.json`中的条目。

**优点**：
- 统一技术栈
- 支持多语言
- 与mksaas现有代码一致

**缺点**：
- 需要修改所有使用i18n的文件
- 需要翻译英文版本

#### 方案B：保留常量对象，仅用于PPT模块

保留`ADMIN_I18N`常量，PPT模块内部使用。

**优点**：
- 改动最小
- 快速迁移

**缺点**：
- 技术栈不统一
- 不支持多语言切换

---

## 三、受影响的文件

| # | 文件 | i18n使用次数 | 使用模式 |
|---|-----|-------------|---------|
| 1 | `components/admin/ppt-edit-form.tsx` | 30+ | ADMIN_I18N.ppt.*, ADMIN_I18N.common.* |
| 2 | `components/admin/ppt-delete-dialog.tsx` | 15+ | ADMIN_I18N.ppt.*, ADMIN_I18N.common.* |
| 3 | `components/admin/user-list-table.tsx` | 10+ | ADMIN_I18N.user.*, ADMIN_I18N.validation.* |
| 4 | `components/admin/stats-card.tsx` | 3 | ADMIN_I18N.stats.* |
| 5 | `components/admin/download-trend-chart.tsx` | 2 | ADMIN_I18N.stats.* |
| 6 | `components/admin/top-ppt-list.tsx` | 2 | ADMIN_I18N.stats.*, ADMIN_I18N.common.* |
| 7 | `app/(admin)/admin/ppt/users/page.tsx` | 20+ | ADMIN_I18N.user.* |
| 8 | `app/(admin)/admin/ppt/stats/page.tsx` | 15+ | ADMIN_I18N.stats.* |
| 9 | `app/(admin)/admin/ppt/settings/page.tsx` | 20+ | ADMIN_I18N.settings.* |
| 10 | `app/(admin)/admin/ppt/list/page.tsx` | 10+ | ADMIN_I18N.ppt.* |

**总计**：约10个文件，100+处i18n调用

---

## 四、转换映射

### v0常量 → mksaas JSON路径

```
ADMIN_I18N.common.cancel → PPT.admin.common.cancel
ADMIN_I18N.ppt.titleLabel → PPT.admin.ppt.titleLabel
ADMIN_I18N.user.pageTitle → PPT.admin.user.pageTitle
ADMIN_I18N.stats.totalDownloads → PPT.admin.stats.totalDownloads
ADMIN_I18N.settings.pageTitle → PPT.admin.settings.pageTitle
```

### 代码转换示例

```typescript
// 修改前 (v0)
import { ADMIN_I18N } from '@/lib/constants/i18n'
<span>{ADMIN_I18N.ppt.titleLabel}</span>
toast.success(ADMIN_I18N.ppt.deleteSuccess)

// 修改后 (mksaas)
import { useTranslations } from 'next-intl'
const t = useTranslations('PPT.admin')
<span>{t('ppt.titleLabel')}</span>
toast.success(t('ppt.deleteSuccess'))
```

---

## 五、JSON结构设计

### 在messages/zh.json中添加PPT模块

```json
{
  "PPT": {
    "admin": {
      "common": {
        "cancel": "取消",
        "confirm": "确认",
        "save": "保存",
        "saveChanges": "保存更改",
        "saving": "保存中...",
        "loading": "加载中...",
        "success": "操作成功",
        "error": "操作失败",
        "delete": "删除",
        "deleting": "删除中...",
        "confirmDelete": "确认删除",
        "edit": "编辑",
        "viewDetails": "查看详情",
        "actions": "操作",
        "noData": "暂无数据",
        "times": "次",
        "pages": "页",
        "chars": "字符"
      },
      "ppt": {
        "titleLabel": "标题",
        "titlePlaceholder": "请输入PPT标题",
        "categoryLabel": "分类",
        "deleteSuccess": "PPT已删除",
        "deleteError": "删除失败，请重试",
        "updateSuccess": "PPT信息已更新",
        "updateError": "更新失败，请重试"
      },
      "user": {
        "pageTitle": "用户管理",
        "pageDesc": "管理平台用户、调整积分、封禁用户",
        "totalUsers": "总用户数",
        "activeUsers": "活跃用户",
        "bannedUsers": "封禁用户"
      },
      "stats": {
        "pageTitle": "统计分析",
        "totalDownloads": "总下载量",
        "downloadTrend": "下载趋势",
        "last7Days": "最近7天"
      },
      "settings": {
        "pageTitle": "系统设置",
        "pageDesc": "配置系统参数和功能开关"
      }
    },
    "public": {
      "search": {
        "hotKeywords": "热门搜索",
        "recommendedCategories": "推荐分类",
        "recentDownloads": "最近下载"
      }
    }
  }
}
```

### 在messages/en.json中添加英文版本

```json
{
  "PPT": {
    "admin": {
      "common": {
        "cancel": "Cancel",
        "confirm": "Confirm",
        "save": "Save",
        "saveChanges": "Save Changes",
        "saving": "Saving...",
        "loading": "Loading...",
        "success": "Success",
        "error": "Error",
        "delete": "Delete",
        "deleting": "Deleting...",
        "confirmDelete": "Confirm Delete"
      },
      "ppt": {
        "titleLabel": "Title",
        "deleteSuccess": "PPT deleted",
        "deleteError": "Delete failed, please retry"
      }
    }
  }
}
```

---

## 六、执行步骤

### Step 1: 创建JSON翻译文件

将v0的`ADMIN_I18N`常量转换为JSON格式，添加到：
- `messages/zh.json` - 中文
- `messages/en.json` - 英文

### Step 2: 修改组件代码

对每个受影响的文件：

```typescript
// 1. 修改import
// 删除
import { ADMIN_I18N } from '@/lib/constants/i18n'
// 添加
import { useTranslations } from 'next-intl'

// 2. 添加hook调用
const t = useTranslations('PPT.admin')

// 3. 替换所有ADMIN_I18N调用
// ADMIN_I18N.ppt.titleLabel → t('ppt.titleLabel')
// ADMIN_I18N.common.cancel → t('common.cancel')
```

### Step 3: 处理非组件文件

对于schema验证等非组件文件，需要特殊处理：

```typescript
// v0的schema使用
const pptEditSchema = z.object({
  title: z.string().min(1, ADMIN_I18N.validation.titleRequired)
})

// mksaas方案：使用getTranslations（服务端）或保留常量
// 方案1: 服务端获取
import { getTranslations } from 'next-intl/server'
const t = await getTranslations('PPT.admin.validation')

// 方案2: 保留常量用于验证消息（简单方案）
const VALIDATION_MESSAGES = {
  titleRequired: "标题不能为空",
  // ...
}
```

---

## 七、工作量评估

| 任务 | 工作量 |
|-----|-------|
| 创建JSON翻译文件 | 1小时 |
| 修改10个组件文件 | 3小时 |
| 处理schema验证 | 1小时 |
| 测试验证 | 1小时 |
| **总计** | **约6小时** |

---

## 八、决策点

| # | 决策项 | 选项 | 建议 |
|---|-------|-----|------|
| 1 | 迁移方案 | A.完全转换 / B.保留常量 | **A**（统一技术栈） |
| 2 | 英文翻译 | 立即翻译 / 后续补充 | **后续补充**（先用中文） |
| 3 | schema验证消息 | 转换 / 保留常量 | **保留常量**（简单） |

---

## 九、简化方案（推荐）

考虑到工作量，建议采用**渐进式迁移**：

### 第一阶段：保留常量，仅修改路径

```typescript
// 将v0的i18n.ts复制到mksaas
// 路径: src/lib/constants/ppt-i18n.ts

// 组件中只需修改import路径
import { ADMIN_I18N } from '@/lib/constants/ppt-i18n'
```

**优点**：改动最小，快速完成迁移

### 第二阶段：后续转换为next-intl

迁移完成后，再逐步将常量转换为next-intl格式。

---

## 十、已确认决定

| 决策项 | 决定 |
|-------|------|
| 迁移方案 | ✅ **第一阶段：保留常量，修改import路径** |
| 英文翻译 | ❌ 迁移时不做，后续任务 |
| next-intl转换 | ❌ 迁移时不做，后续任务 |

### 迁移时执行

```typescript
// 将v0的i18n.ts复制到mksaas
// 路径: src/lib/constants/ppt-i18n.ts

// 组件中只需修改import路径
import { ADMIN_I18N } from '@/lib/constants/ppt-i18n'
```

### 后续任务记录

| # | 任务 | 优先级 | 预计工作量 |
|---|-----|-------|-----------|
| 1 | 将ADMIN_I18N转换为next-intl JSON格式 | 中 | 2小时 |
| 2 | 修改组件使用useTranslations | 中 | 3小时 |
| 3 | 添加英文翻译 | 低 | 2小时 |
| 4 | 处理schema验证消息国际化 | 低 | 1小时 |

这些任务记录在迁移完成后的优化清单中。
