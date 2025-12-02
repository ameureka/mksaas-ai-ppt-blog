# 品牌资产包

> 创建时间：2025-12-02  
> 品牌名称：SlideAI / 快模板

---

## 📁 目录结构

```
brand-assets/
├── logo/                    # Logo 文件
│   ├── logo-full.svg       # 主 Logo（矢量）
│   ├── logo-full.png       # 主 Logo（PNG）
│   ├── logo-icon.svg       # 图标 Logo
│   ├── logo-icon.png       # 图标 Logo（PNG）
│   ├── logo-light.svg      # 浅色模式
│   ├── logo-dark.svg       # 深色模式
│   └── logo-monochrome.svg # 单色版
│
├── favicon/                 # Favicon 套件
│   ├── favicon.ico         # 标准 Favicon
│   ├── favicon-*.png       # 各尺寸 PNG
│   ├── apple-touch-icon.png
│   ├── site.webmanifest
│   └── browserconfig.xml
│
├── social/                  # 社交媒体资源
│   ├── avatar-512x512.png  # 社交头像
│   ├── cover-1500x500.png  # 封面图
│   └── share-card.png      # 分享卡片
│
├── og-images/               # Open Graph 图片
│   ├── og-default.png      # 默认 OG 图（1200x630）
│   ├── og-home.png         # 首页 OG 图
│   └── og-blog.png         # 博客 OG 图
│
├── templates/               # 设计模板
│   ├── figma-template.fig  # Figma 设计文件
│   ├── ppt-template.pptx   # PPT 模板
│   └── social-post.psd     # 社交媒体海报模板
│
└── README.md               # 本文件
```

---

## 🎨 Logo 使用规范

### 主 Logo（Full Logo）
**文件**：`logo/logo-full.svg`  
**用途**：网站 Header、宣传物料、文档  
**尺寸**：180x40px（推荐）  
**格式**：SVG（优先）、PNG（备用）

**使用场景**：
- ✅ 网站导航栏
- ✅ 邮件签名
- ✅ 文档页眉
- ✅ 宣传海报

**禁止**：
- ❌ 不得拉伸变形
- ❌ 不得改变配色
- ❌ 不得旋转角度
- ❌ 不得添加阴影/描边

---

### 图标 Logo（Icon Logo）
**文件**：`logo/logo-icon.svg`  
**用途**：Favicon、App 图标、社交头像  
**尺寸**：512x512px（推荐）  
**格式**：SVG、PNG

**使用场景**：
- ✅ 浏览器标签页图标
- ✅ 社交媒体头像
- ✅ App 图标
- ✅ 水印

---

### 深浅模式变体
**浅色模式**：`logo/logo-light.svg`（白色背景）  
**深色模式**：`logo/logo-dark.svg`（深色背景）

**使用规则**：
- 浅色模式：Logo 使用深色（#1E293B）
- 深色模式：Logo 使用浅色（#F8FAFC）
- 自动切换：根据系统主题自动切换

**CSS 示例**：
```css
/* 浅色模式 */
@media (prefers-color-scheme: light) {
  .logo {
    content: url('/logo-light.svg');
  }
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .logo {
    content: url('/logo-dark.svg');
  }
}
```

---

## 🌐 Favicon 使用

### 安装步骤

1. **复制文件到 public 目录**：
```bash
cp brand-assets/favicon/* public/
```

2. **添加 HTML 代码到 <head>**：
```html
<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#2563EB">
```

3. **验证**：
- 访问 https://realfavicongenerator.net/favicon_checker
- 输入网站 URL
- 检查各平台显示效果

---

## 📱 社交媒体资源

### 头像（Avatar）
**文件**：`social/avatar-512x512.png`  
**尺寸**：512x512px  
**用途**：微信、微博、小红书、抖音、知乎

**平台要求**：
- 微信公众号：200x200px（最小）
- 微博：180x180px（推荐）
- 小红书：400x400px（推荐）
- 抖音：200x200px（最小）
- 知乎：200x200px（推荐）

**使用方法**：
```bash
# 生成各平台尺寸
convert social/avatar-512x512.png -resize 200x200 social/avatar-wechat.png
convert social/avatar-512x512.png -resize 400x400 social/avatar-xiaohongshu.png
```

---

### 封面图（Cover）
**文件**：`social/cover-1500x500.png`  
**尺寸**：1500x500px  
**用途**：微信公众号封面、知乎专栏封面

**平台要求**：
- 微信公众号：900x500px（首图）
- 知乎专栏：1200x600px
- 微博：560x260px

---

### 分享卡片（Share Card）
**文件**：`social/share-card.png`  
**尺寸**：800x418px  
**用途**：微信分享、朋友圈分享

**设计要素**：
- Logo + 品牌名称
- 核心标语："3 分钟找到完美模板"
- 二维码（可选）
- 背景：渐变色

---

## 🖼️ Open Graph 图片

### 默认 OG 图
**文件**：`og-images/og-default.png`  
**尺寸**：1200x630px  
**用途**：网站默认分享图

**HTML 代码**：
```html
<meta property="og:image" content="https://yourdomain.com/og-default.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="SlideAI - AI 驱动的免费 PPT 模板下载站">
```

---

### 页面专属 OG 图
**首页**：`og-images/og-home.png`  
**博客**：`og-images/og-blog.png`  
**分类页**：`og-images/og-category-{name}.png`

**动态生成**：
```typescript
// 使用 @vercel/og 动态生成
import { ImageResponse } from '@vercel/og';

export async function GET(request: Request) {
  return new ImageResponse(
    (
      <div style={{
        background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <h1 style={{ fontSize: 60, color: 'white' }}>
          SlideAI
        </h1>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

---

## 📐 尺寸规范

### Logo 尺寸

| 场景 | 宽度 | 高度 | 格式 |
|-----|------|------|------|
| 网站 Header | 180px | 40px | SVG |
| 移动端 Header | 120px | 28px | SVG |
| Favicon | 32px | 32px | ICO/PNG |
| 社交头像 | 512px | 512px | PNG |
| OG 图 Logo | 200px | 200px | PNG |
| 印刷品 | 50mm | 50mm | SVG/PDF |

### 最小尺寸
- 数字媒体：32x32px
- 印刷品：20mm x 20mm

### 安全区
- Logo 周围留白 = Logo 高度的 1/4
- 示例：40px 高的 Logo，周围留白 10px

---

## 🎨 配色规范

### 主色调
```css
/* 科技蓝 */
--primary: #2563EB;
--primary-light: #60A5FA;
--primary-dark: #1E40AF;

/* 活力橙 */
--secondary: #F59E0B;
--secondary-light: #FCD34D;
--secondary-dark: #D97706;

/* 渐变 */
--gradient: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%);
```

### 中性色
```css
/* 文字 */
--text-primary: #1E293B;
--text-secondary: #64748B;
--text-tertiary: #94A3B8;

/* 背景 */
--bg-primary: #FFFFFF;
--bg-secondary: #F8FAFC;
--bg-tertiary: #F1F5F9;

/* 边框 */
--border: #E2E8F0;
```

---

## 📝 文件命名规范

### Logo 文件
```
logo-{type}-{mode}.{ext}

示例：
- logo-full-light.svg
- logo-icon-dark.png
- logo-text-monochrome.svg
```

### 社交媒体文件
```
{platform}-{type}-{size}.{ext}

示例：
- wechat-avatar-200x200.png
- xiaohongshu-cover-1500x500.png
- douyin-share-card-800x418.png
```

### OG 图文件
```
og-{page}-{variant}.png

示例：
- og-home-default.png
- og-blog-featured.png
- og-category-business.png
```

---

## 🔄 更新日志

### 2025-12-02
- ✅ 创建品牌资产目录结构
- ✅ 编写使用规范文档
- ⏳ 待生成 Logo 文件
- ⏳ 待生成 Favicon 套件
- ⏳ 待生成社交媒体资源

---

## 📞 联系方式

如有品牌资产使用问题，请联系：
- 邮箱：hello@slideai.com
- 设计负责人：[待定]

---

## 📚 参考资源

### 设计工具
- Figma：https://figma.com/
- Canva：https://canva.com/
- RealFaviconGenerator：https://realfavicongenerator.net/

### 验证工具
- Favicon Checker：https://www.favicon-checker.com/
- Contrast Checker：https://webaim.org/resources/contrastchecker/
- OG Image Validator：https://www.opengraph.xyz/

### 学习资源
- Logo 设计原则：https://www.logodesignlove.com/
- 品牌视觉规范：https://brandingstyleguides.com/
- 配色方案：https://coolors.co/
