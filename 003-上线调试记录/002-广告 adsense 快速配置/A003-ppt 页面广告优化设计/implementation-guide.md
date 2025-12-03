# PPT 页面广告集成实施指南

**创建日期**: 2025-12-04
**更新日期**: 2025-12-04
**版本**: 2.0

---

## 一、前置准备

### Step 0: 迁移原生广告组件

**源文件**: `vo-ui-code-pro/v0mksaaspptsite/components/ads/native-ad-card.tsx`
**目标文件**: `src/components/ads/native-ad-card.tsx`

复制组件文件并更新 `src/components/ads/index.ts` 导出。

---

## 二、实施步骤

### Step 1: PPT 详情页修改

**文件**: `src/app/[locale]/(marketing)/ppt/[id]/page.tsx`

1. 添加导入: `BlogBannerAd`, `MultiplexAd`, `NativeAdCard`
2. 替换占位符广告为 `<BlogBannerAd className="my-12" />`
3. 推荐模板网格第 4 位插入 `NativeAdCard`
4. 推荐模板后添加 `<MultiplexAd className="my-8" />`

### Step 2: PPT 首页修改

**文件**: `src/app/[locale]/(marketing)/ppt/page.tsx`

1. 热门分类后添加 `<BlogBannerAd />`
2. 精选模板网格第 5 位插入 `NativeAdCard`
3. 搜索结果上方添加 `<BlogBannerAd />`
4. 搜索结果网格第 5、11 位插入 `NativeAdCard`

### Step 3: PPT 分类页修改

**文件**: `src/app/[locale]/(marketing)/ppt/category/[name]/page.tsx`

1. Hero 后添加 `<BlogBannerAd />`
2. 精选 PPT 网格第 6 位插入 `NativeAdCard`
3. 全部 PPT 网格第 6 位插入 `NativeAdCard`

### Step 4: PPT 分类总览页修改

**文件**: `src/app/[locale]/(marketing)/ppt/categories/page.tsx`

1. 分类网格后添加 `<BlogBannerAd />`
2. 精选模板网格第 6 位插入 `NativeAdCard`

---

## 三、原生广告插入代码模板

```tsx
// 通用插入逻辑
const items = [...ppts];
if (items.length >= position - 1) {
  items.splice(position - 1, 0, null);
}

// 渲染
{items.map((ppt, index) => {
  if (ppt === null) {
    return (
      <NativeAdCard
        key={`native-ad-${index}`}
        ad={mockNativeAd}
        position={`page_section_${position}`}
        onImpression={(adId) => console.log('Impression:', adId)}
        onClick={(adId) => console.log('Click:', adId)}
      />
    );
  }
  return <PPTCard key={ppt.id} {...ppt} />;
})}
```

---

## 四、验证检查点

| 页面 | 横幅广告 | 原生广告位置 |
|------|----------|--------------|
| PPT 首页 | 热门分类下方, 搜索结果上方 | 精选第5位, 搜索第5/11位 |
| PPT 详情页 | 评价上方, 推荐下方(Multiplex) | 推荐第4位 |
| PPT 分类页 | Hero下方 | 精选第6位, 全部第6位 |
| 分类总览 | 分类网格下方 | 精选第6位 |

---

## 五、回滚方案

```bash
git checkout -- src/app/[locale]/(marketing)/ppt/
rm src/components/ads/native-ad-card.tsx
```
