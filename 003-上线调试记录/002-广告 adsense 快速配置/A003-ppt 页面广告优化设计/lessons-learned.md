# 广告系统开发经验教训

**创建日期**: 2025-12-04
**更新日期**: 2025-12-04
**来源**: 博客广告系统开发 + PPT 广告系统设计

---

## 一、已解决的问题

### 问题 1: DisplayAd 不显示

**症状**: 开发模式下广告占位符不显示

**根本原因**: slot 检查顺序问题

**错误代码**:
```typescript
// ❌ 错误: 空 slot 时直接返回 null，测试模式也不显示
if (!slot) return null;
if (!ADSENSE_CONFIG.enabled && !ADSENSE_CONFIG.testMode) return null;
```

**修复代码**:
```typescript
// ✅ 正确: 先检查是否禁用，再检查 slot
if (!ADSENSE_CONFIG.enabled && !ADSENSE_CONFIG.testMode) {
  return null;
}
if (!slot && !ADSENSE_CONFIG.testMode) {
  return null;
}
if (ADSENSE_CONFIG.testMode) {
  return <占位符 />;
}
```

**教训**: 检查顺序很重要，测试模式应该优先于 slot 检查

---

### 问题 2: AnchorAd SSR/CSR Hydration 不匹配

**症状**: 控制台报 hydration 错误，广告不显示

**根本原因**: 服务端和客户端渲染结果不一致

**修复代码**:
```typescript
const [mounted, setMounted] = useState(false);
const [dismissed, setDismissed] = useState(false);

useEffect(() => {
  const isDismissed = sessionStorage.getItem('anchor-ad-dismissed') === 'true';
  setDismissed(isDismissed);
  setMounted(true);
}, []);

if (!mounted) return null;
```

**教训**: 使用浏览器 API 时必须处理 SSR/CSR 差异

---

### 问题 3: 暗色主题下样式不可见

**症状**: 暗色主题下广告占位符看不见

**修复代码**:
```typescript
// ✅ 正确: 使用主题感知的 CSS 类
<div className="bg-card border-border">
// 或
<div className="bg-muted/30 border-muted-foreground/30">
```

**教训**: 始终使用 Tailwind 的主题感知类，避免硬编码颜色

---

## 二、广告类型对比

### 2.1 横幅广告 vs 原生广告

| 特性 | 横幅广告 (Banner) | 原生广告 (Native) |
|------|-------------------|-------------------|
| 组件 | BlogBannerAd, MultiplexAd | NativeAdCard |
| 位置 | 页面顶部/中部/底部 | 内容流中 |
| 样式 | 标准 AdSense 样式 | 与 PPTCard 一致 |
| 用户体验 | 中等影响 | 影响小 |
| 收益潜力 | 中等 | 高 (点击率高) |
| 实现复杂度 | 低 | 中 |

### 2.2 原生广告优势

1. **融入内容**: 与 PPTCard 样式一致，不突兀
2. **高点击率**: 用户更容易点击
3. **低干扰**: 不影响用户浏览体验
4. **可追踪**: 支持展示和点击追踪

### 2.3 最佳实践

- **组合使用**: 横幅广告 + 原生广告
- **控制密度**: 每页不超过 2-3 个原生广告
- **位置选择**: 原生广告放在内容流中间位置
- **追踪分析**: 对比不同位置的效果

---

## 三、原生广告实现要点

### 3.1 展示追踪

使用 IntersectionObserver 实现 50% 可见触发：

```typescript
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
```

### 3.2 广告标识

必须显示 "广告" 标识，符合广告法规：

```tsx
<Badge
  variant="secondary"
  className="absolute left-2 top-2 bg-black/60 text-white text-xs"
>
  广告
</Badge>
```

### 3.3 插入逻辑

通用的原生广告插入函数：

```typescript
const insertNativeAd = (items, position) => {
  const result = [...items];
  if (result.length >= position - 1) {
    result.splice(position - 1, 0, null);
  }
  return result;
};
```

---

## 四、最佳实践

### 4.1 广告组件开发

1. **懒加载**: 使用 IntersectionObserver 延迟加载
2. **CLS 防护**: 设置 minHeight/minWidth 占位
3. **测试模式**: 开发环境显示占位符
4. **错误处理**: 捕获广告加载错误

### 4.2 SSR/CSR 兼容

1. **使用 mounted 状态**: 处理浏览器 API
2. **避免直接访问 window/document**: 在 useEffect 中访问
3. **使用 'use client' 指令**: 明确标记客户端组件

### 4.3 主题适配

1. **使用主题感知类**: `bg-card`, `bg-muted`, `border-border`
2. **避免硬编码颜色**: 不使用 `bg-gray-100` 等
3. **测试两种主题**: 开发时切换主题验证

### 4.4 代码组织

1. **统一导出**: 从 `@/components/ads` 导入所有广告组件
2. **预设组件**: 为常用场景创建预设组件
3. **配置集中**: 所有配置放在 `src/lib/config/adsense.ts`

---

## 五、检查清单

### 新增广告位时的检查清单

- [ ] 导入正确的广告组件
- [ ] 设置合适的 className (间距、宽度)
- [ ] 验证开发模式占位符显示
- [ ] 验证暗色主题适配
- [ ] 验证移动端响应式
- [ ] 检查 CLS 问题
- [ ] 检查 hydration 错误

### 新增原生广告时的检查清单

- [ ] 设置正确的 position 标识
- [ ] 实现展示追踪回调
- [ ] 实现点击追踪回调
- [ ] 验证 "广告" 标识显示
- [ ] 验证与内容卡片样式一致
- [ ] 验证 50% 可见触发展示追踪

---

## 六、参考资源

### 相关文件

| 文件 | 说明 |
|------|------|
| `src/components/ads/display-ad.tsx` | 横幅广告组件 |
| `src/components/ads/anchor-ad.tsx` | 锚定广告组件 |
| `src/components/ads/native-ad-card.tsx` | 原生广告组件 |
| `src/lib/config/adsense.ts` | AdSense 配置 |

### 相关文档

| 文档 | 位置 |
|------|------|
| PPT 广告需求文档 | `003-上线调试记录/002-广告 adsense 快速配置/ppt 页面广告优化设计/requirements.md` |
| PPT 广告设计文档 | `003-上线调试记录/002-广告 adsense 快速配置/ppt 页面广告优化设计/design.md` |
| PPT 广告实施指南 | `003-上线调试记录/002-广告 adsense 快速配置/ppt 页面广告优化设计/implementation-guide.md` |
