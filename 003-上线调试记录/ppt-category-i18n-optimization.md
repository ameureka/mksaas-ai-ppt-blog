# PPT 分类国际化优化

## 问题描述

在 PPT 页面的分类导航栏，英文环境下显示的分类名称过长，导致文字重叠。

![问题截图](file:///Users/ameureka/.gemini/antigravity/brain/1e1b9359-53c6-4652-bfeb-648268bf6ec3/uploaded_image_1764675990804.png)

原有分类名称：
- Business Report (商务汇报)
- Education & Training (教育培训)
- Product Marketing (产品营销)
- Paid Templates & Search (付费模板和搜索)
- Project Proposal (项目提案)
- Performance Report (绩效报告)
- Year-End Summary (年终总结)

## 解决方案

### 1. 添加国际化支持

在 `messages/en.json` 和 `messages/zh.json` 中添加 PPT 分类翻译配置：

**英文翻译（简化版）**:
```json
"PPTPage": {
  "categories": {
    "business": "Business",
    "education": "Education",
    "marketing": "Marketing",
    "general": "General",
    "creative": "Creative",
    "training": "Training",
    "report": "Report",
    "plan": "Plan"
  }
}
```

**中文翻译**:
```json
"PPTPage": {
  "categories": {
    "business": "商务",
    "education": "教育",
    "marketing": "营销",
    "general": "通用",
    "creative": "创意",
    "training": "培训",
    "report": "报告",
    "plan": "方案"
  }
}
```

### 2. 更新 PPT 页面组件

在 `src/app/[locale]/(marketing)/ppt/page.tsx` 中：

1. **导入 `useTranslations` 钩子**:
```typescript
import { useTranslations } from 'next-intl';
```

2. **在组件中使用翻译**:
```typescript
export default function SearchHomePage() {
  const t = useTranslations('PPTPage.categories');

  // ... 其他代码

  // Categories using translations
  const categories = useMemo(() => [
    {
      name: t('business'),
      slug: 'business',
      count: 12345,
      icon: Briefcase,
      preview: '/ppt/business-presentation-template.png',
    },
    {
      name: t('education'),
      slug: 'education',
      count: 8234,
      icon: GraduationCap,
      preview: '/ppt/education-training-template.jpg',
    },
    // ... 其他分类
  ], [t]);
}
```

3. **移除硬编码的分类数组**（之前在组件外部定义的）

## 优化效果

### 英文环境下的分类名称简化：
- ✅ **Business** (原：Business Report)
- ✅ **Education** (原：Education & Training)
- ✅ **Marketing** (原：Product Marketing)
- ✅ **General** (原：General Tips)
- ✅ **Creative** (原：Project Proposal)
- ✅ **Training** (原：Paid Templates & Search)
- ✅ **Report** (原：Performance Report)
- ✅ **Plan** (原：Year-End Summary)

### 中文环境下保持简洁：
- ✅ 商务
- ✅ 教育
- ✅ 营销
- ✅ 通用
- ✅ 创意
- ✅ 培训
- ✅ 报告
- ✅ 方案

## 额外改进

1. **性能优化**: 使用 `useMemo` 钩子避免分类数组在每次渲染时重新创建
2. **类型安全**: 保持 TypeScript 类型完整性
3. **国际化最佳实践**: 分类名称现在完全支持多语言切换

## 文件修改列表

- ✅ `messages/en.json` - 添加英文分类翻译
- ✅ `messages/zh.json` - 添加中文分类翻译
- ✅ `src/app/[locale]/(marketing)/ppt/page.tsx` - 实现国际化支持

## 测试建议

运行开发服务器测试：

```bash
pnpm dev
```

访问以下 URL 验证：
- 英文环境: `http://localhost:3005/en/ppt`
- 中文环境: `http://localhost:3005/zh/ppt`

检查分类导航栏是否正常显示，文字无重叠。

## 注意事项

1. 英文翻译已最大化简化,避免文字过长导致布局问题
2. 中文翻译保持简洁易懂
3. 分类 slug 保持不变,确保 URL 兼容性
4. 图标和预览图路径保持不变
