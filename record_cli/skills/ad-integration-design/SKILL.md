---
name: ad-integration-design
description: 为网站页面设计和实施广告集成方案，包括横幅广告、原生广告、多元广告的规划、组件开发、位置优化和追踪实现。适用于需要增加广告收益、优化广告体验或扩展广告覆盖的场景。
version: "1.0.0"
---

# Ad Integration Design Skill

## 概述

这个技能帮助你系统化地为网站页面设计和实施广告集成方案，通过结构化的分析、设计和实施流程，生成包含广告位规划、组件开发、追踪实现的完整方案。

**核心价值**:
- 系统化的广告位规划流程
- 原生广告与内容融合设计
- 展示/点击追踪实现
- SSR/CSR 兼容性处理
- 暗色主题适配

**适用场景**:
- 新页面广告集成
- 广告系统扩展
- 原生广告开发
- 广告效果优化

---

## 执行流程

### 阶段 1: 需求分析 (Discovery)

**目标**: 分析现有广告系统和目标页面

**执行步骤**:

1. **现状分析**
   - 盘点已有广告组件
   - 分析已实施的广告位
   - 识别可复用的组件和模式

2. **目标页面分析**
   - 确定需要集成广告的页面
   - 分析页面结构和内容流
   - 识别适合放置广告的位置

3. **广告类型选择**
   - 横幅广告 (Banner): 显眼位置，标准格式
   - 原生广告 (Native): 融入内容流，不突兀
   - 多元广告 (Multiplex): 推荐样式，页面底部

4. **经验教训回顾**
   - 回顾之前遇到的问题
   - 识别需要避免的坑
   - 确定技术约束

**输出**: 需求分析文档 (requirements.md)

**文档模板**:
```markdown
# 广告集成需求文档

## 一、背景分析
### 1.1 当前状态
| 页面 | 横幅广告 | 原生广告 | 状态 |
|------|----------|----------|------|

### 1.2 广告类型说明
### 1.3 之前犯过的错误

## 二、需求规格
### 需求 N: [页面名称]广告集成
**User Story**: 作为...我希望...以便...
**验收标准**:
1. WHEN ... THEN 系统 SHALL ...

## 三、技术约束
## 四、广告位汇总
```

---

### 阶段 2: 广告位设计 (Design)

**目标**: 设计详细的广告位布局和组件架构

**执行步骤**:

1. **组件架构设计**
   ```
   src/components/ads/
   ├── display-ad.tsx      # 横幅广告基础组件
   ├── native-ad-card.tsx  # 原生广告组件
   ├── anchor-ad.tsx       # 锚定广告组件
   └── index.ts            # 统一导出
   ```

2. **原生广告组件设计**
   ```typescript
   interface NativeAdData {
     id: string;
     imageUrl: string;
     headline: string;
     description: string;
     advertiser: string;
     logoUrl?: string;
     clickUrl: string;
     callToAction: string;
   }

   interface NativeAdCardProps {
     ad: NativeAdData;
     position?: string;
     onImpression?: (adId: string) => void;
     onClick?: (adId: string) => void;
   }
   ```

3. **页面广告布局设计**
   - 使用 ASCII 图表示广告位置
   - 标注广告类型和编号
   - 说明插入逻辑

4. **广告插入逻辑设计**
   ```typescript
   // 通用插入逻辑
   const items = [...originalItems];
   if (items.length >= position - 1) {
     items.splice(position - 1, 0, null);
   }
   ```

**输出**: 设计文档 (design.md)

**设计文档模板**:
```markdown
# 广告集成设计文档

## 一、系统架构
### 1.1 广告组件架构
### 1.2 原生广告组件设计

## 二、广告位规划
### 2.1 [页面名称]
[ASCII 布局图]

## 三、详细设计
### 3.1 原生广告组件迁移
### 3.2 原生广告插入逻辑
### 3.3 各页面修改详情

## 四、错误预防措施
### 4.1 SSR/CSR 兼容性
### 4.2 暗色主题适配
### 4.3 广告标识

## 五、测试验证
## 六、风险评估
```

---

### 阶段 3: 任务规划 (Planning)

**目标**: 制定详细的实施任务清单

**执行步骤**:

1. **任务分解**
   - 按页面分组任务
   - 每个任务包含具体步骤
   - 标注优先级和依赖关系

2. **代码变更清单**
   - 列出所有需要修改的文件
   - 说明变更类型和内容

3. **验证检查清单**
   - 每个页面的验证项
   - 原生广告追踪验证
   - 主题适配验证

**输出**: 任务清单 (tasks.md)

**任务清单模板**:
```markdown
# 广告集成任务清单

## 任务列表

### 任务 N: [页面名称]广告集成
- [ ] N.1 导入广告组件
- [ ] N.2 添加横幅广告
- [ ] N.3 插入原生广告
- [ ] N.4 验证广告显示

## 代码变更清单
| 文件 | 变更类型 | 变更内容 |

## 验证检查清单
### [页面名称]
- [ ] 横幅广告显示
- [ ] 原生广告位置正确
- [ ] 暗色主题适配
```

---

### 阶段 4: 组件开发 (Development)

**目标**: 开发和迁移广告组件

**执行步骤**:

1. **原生广告组件开发**
   ```typescript
   'use client';

   export function NativeAdCard({
     ad,
     position,
     onImpression,
     onClick,
   }: NativeAdCardProps) {
     const cardRef = useRef<HTMLDivElement>(null);
     const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

     // 展示追踪 - IntersectionObserver
     useEffect(() => {
       if (!cardRef.current || hasTrackedImpression) return;

       const observer = new IntersectionObserver(
         (entries) => {
           entries.forEach((entry) => {
             if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
               onImpression?.(ad.id);
               setHasTrackedImpression(true);
               observer.disconnect();
             }
           });
         },
         { threshold: 0.5 }
       );

       observer.observe(cardRef.current);
       return () => observer.disconnect();
     }, [ad.id, hasTrackedImpression, onImpression]);

     // 点击追踪
     const handleClick = () => {
       onClick?.(ad.id);
       window.open(ad.clickUrl, '_blank', 'noopener,noreferrer');
     };

     return (
       <Card ref={cardRef} onClick={handleClick}>
         {/* 广告标识 */}
         <Badge className="absolute left-2 top-2">广告</Badge>
         {/* 广告内容 */}
       </Card>
     );
   }
   ```

2. **组件导出更新**
   ```typescript
   // src/components/ads/index.ts
   export { NativeAdCard, mockNativeAd } from './native-ad-card';
   export type { NativeAdData, NativeAdCardProps } from './native-ad-card';
   ```

3. **Mock 数据准备**
   ```typescript
   export const mockNativeAd: NativeAdData = {
     id: 'ad_001',
     imageUrl: 'https://placehold.co/320x200/1a1a2e/ffffff?text=Ad+Image',
     headline: '提升团队协作效率的最佳工具',
     description: '超过100万团队正在使用，免费试用30天',
     advertiser: 'Notion',
     logoUrl: 'https://placehold.co/40x40/4a90d9/ffffff?text=N',
     clickUrl: 'https://example.com/landing',
     callToAction: '免费试用',
   };
   ```

**输出**: 广告组件代码

---

### 阶段 5: 页面集成 (Integration)

**目标**: 在各页面集成广告组件

**执行步骤**:

1. **导入广告组件**
   ```typescript
   import { BlogBannerAd, MultiplexAd, NativeAdCard, mockNativeAd } from '@/components/ads';
   ```

2. **添加横幅广告**
   ```tsx
   <section className="container mx-auto mb-8 px-4">
     <BlogBannerAd />
   </section>
   ```

3. **插入原生广告**
   ```tsx
   {(() => {
     const items = [...ppts];
     if (items.length >= 4) {
       items.splice(4, 0, null);
     }
     return items.map((ppt, index) => {
       if (ppt === null) {
         return (
           <NativeAdCard
             key={`native-ad-${index}`}
             ad={mockNativeAd}
             position={`page_section_${index}`}
             onImpression={(adId) => console.log('Impression:', adId)}
             onClick={(adId) => console.log('Click:', adId)}
           />
         );
       }
       return <PPTCard key={ppt.id} ppt={ppt} />;
     });
   })()}
   ```

**输出**: 集成后的页面代码

---

### 阶段 6: 验证测试 (Verification)

**目标**: 验证广告集成效果

**执行步骤**:

1. **启动开发服务器**
   ```bash
   pnpm dev
   ```

2. **页面验证**
   - 访问各目标页面
   - 验证广告位置正确
   - 验证广告样式一致

3. **追踪验证**
   - 打开浏览器控制台
   - 滚动使原生广告 50% 可见
   - 验证展示追踪输出
   - 点击原生广告验证点击追踪

4. **主题验证**
   - 切换暗色主题
   - 验证所有广告可见
   - 验证样式适配

5. **响应式验证**
   - 切换移动端视图
   - 验证广告布局正确

**输出**: 验证报告

---

### 阶段 7: 问题修复 (Bug Fixing)

**目标**: 修复验证中发现的问题

**常见问题及解决方案**:

1. **原生广告图片不显示**
   - 原因: 本地 placeholder 不支持参数
   - 解决: 使用 placehold.co 等在线服务
   ```typescript
   imageUrl: 'https://placehold.co/320x200/1a1a2e/ffffff?text=Ad+Image',
   ```

2. **分页器显示过多页码**
   - 原因: 直接渲染所有页码
   - 解决: 实现智能分页逻辑
   ```typescript
   // 智能分页: 显示首页、末页、当前页附近
   if (totalPages > 7) {
     // 省略中间页码，用 ... 表示
   }
   ```

3. **SSR/CSR Hydration 不匹配**
   - 原因: 服务端和客户端渲染结果不一致
   - 解决: 使用 mounted 状态
   ```typescript
   const [mounted, setMounted] = useState(false);
   useEffect(() => setMounted(true), []);
   if (!mounted) return null;
   ```

4. **暗色主题下不可见**
   - 原因: 使用硬编码颜色
   - 解决: 使用主题感知类
   ```typescript
   // ❌ 错误
   className="bg-gray-100"
   // ✅ 正确
   className="bg-muted"
   ```

**输出**: 修复后的代码

---

### 阶段 8: 经验总结 (Lessons Learned)

**目标**: 总结经验教训，形成最佳实践

**执行步骤**:

1. **问题归档**
   - 记录遇到的问题
   - 记录解决方案
   - 分析根本原因

2. **最佳实践提炼**
   - 广告组件开发规范
   - SSR/CSR 兼容性处理
   - 主题适配规范

3. **检查清单更新**
   - 新增广告位检查清单
   - 原生广告检查清单

**输出**: 经验教训文档 (lessons-learned.md)

---

## 最佳实践

### 1. 广告组件开发

```typescript
// ✅ 正确: 使用 'use client' 指令
'use client';

// ✅ 正确: 懒加载广告
useEffect(() => {
  const observer = new IntersectionObserver(/* ... */);
  // ...
}, []);

// ✅ 正确: CLS 防护
<div className="min-h-[90px]">
  <AdComponent />
</div>

// ✅ 正确: 测试模式占位符
if (ADSENSE_CONFIG.testMode) {
  return <Placeholder />;
}
```

### 2. SSR/CSR 兼容性

```typescript
// ✅ 正确: 使用 mounted 状态
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) return null;

// ✅ 正确: 在 useEffect 中访问浏览器 API
useEffect(() => {
  const value = sessionStorage.getItem('key');
  // ...
}, []);
```

### 3. 主题适配

```typescript
// ✅ 正确: 使用主题感知类
<div className="bg-card border-border">
<div className="bg-muted text-muted-foreground">

// ❌ 错误: 硬编码颜色
<div className="bg-gray-100 border-gray-200">
```

### 4. 原生广告追踪

```typescript
// ✅ 正确: 50% 可见触发展示追踪
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        onImpression?.(ad.id);
        observer.disconnect();
      }
    });
  },
  { threshold: 0.5 }
);

// ✅ 正确: 只追踪一次
if (hasTrackedImpression) return;
```

### 5. 广告标识

```tsx
// ✅ 正确: 必须显示广告标识
<Badge
  variant="secondary"
  className="absolute left-2 top-2 bg-black/60 text-white text-xs"
>
  广告
</Badge>
```

---

## 文档输出规范

### 文件结构

```
广告集成设计/
├── requirements.md      # 需求文档
├── design.md            # 设计文档
├── tasks.md             # 任务清单
├── implementation-guide.md  # 实施指南
├── lessons-learned.md   # 经验教训
└── verification-report.md   # 验证报告
```

---

## 检查清单

### 新增广告位检查清单

- [ ] 导入正确的广告组件
- [ ] 设置合适的 className (间距、宽度)
- [ ] 验证开发模式占位符显示
- [ ] 验证暗色主题适配
- [ ] 验证移动端响应式
- [ ] 检查 CLS 问题
- [ ] 检查 hydration 错误

### 原生广告检查清单

- [ ] 设置正确的 position 标识
- [ ] 实现展示追踪回调
- [ ] 实现点击追踪回调
- [ ] 验证 "广告" 标识显示
- [ ] 验证与内容卡片样式一致
- [ ] 验证 50% 可见触发展示追踪

---

## 故障排查

### 问题: 广告不显示

**检查**:
1. 是否正确导入组件?
2. 测试模式是否开启?
3. slot 配置是否正确?

**解决**:
```typescript
// 检查配置
console.log(ADSENSE_CONFIG);

// 检查 slot
if (!slot && !ADSENSE_CONFIG.testMode) {
  console.warn('Missing ad slot');
}
```

### 问题: 原生广告图片不显示

**检查**:
1. 图片 URL 是否可访问?
2. 是否有 CORS 问题?

**解决**:
```typescript
// 使用可靠的占位图服务
imageUrl: 'https://placehold.co/320x200/1a1a2e/ffffff?text=Ad+Image',
```

### 问题: Hydration 错误

**检查**:
1. 是否在服务端访问了浏览器 API?
2. 是否有条件渲染导致不一致?

**解决**:
```typescript
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
```

---

## 版本历史

- **v1.0.0** (2025-12-04): 初始版本
  - 完整的 8 阶段广告集成流程
  - 原生广告组件开发规范
  - SSR/CSR 兼容性处理
  - 暗色主题适配
  - 追踪实现

---

## 参考资源

### 相关文件

| 文件 | 说明 |
|------|------|
| `src/components/ads/display-ad.tsx` | 横幅广告组件 |
| `src/components/ads/native-ad-card.tsx` | 原生广告组件 |
| `src/components/ads/anchor-ad.tsx` | 锚定广告组件 |
| `src/lib/config/adsense.ts` | AdSense 配置 |

### 外部资源

- Google AdSense 文档: https://support.google.com/adsense
- IntersectionObserver API: https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver

---

**准备好开始广告集成了吗?告诉我你的目标页面，我们开始吧!** 🚀
