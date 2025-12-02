# PPTHub Logo 资产

> 创建时间：2025-12-02  
> 品牌名称：PPTHub  
> 域名：ppthub.shop

---

## 📁 文件清单

### 主 Logo
- **ppthub-logo-full.png** - 完整 Logo（图标 + 文字）
  - 用途：网站 Header、宣传物料、文档
  - 尺寸：原始尺寸
  - 格式：PNG

### 图标 Logo
- **ppthub-logo-icon.png** - 图标 Logo（仅图标部分）
  - 用途：Favicon、App 图标、社交头像
  - 尺寸：建议裁剪为正方形
  - 格式：PNG

---

## 🎨 Logo 特点

### 设计元素
- ✅ 3 层叠加的幻灯片（象征 PPT）
- ✅ Hub 网络连接图案（象征资源中心）
- ✅ 蓝紫渐变配色（#2563EB → #7C3AED）
- ✅ 现代简洁风格

### 品牌调性
- 专业、高效、科技感
- 符合目标用户（大学生、公务员、职场小白）
- 国际化友好

---

## 📋 待完成任务

### 1. Favicon 生成 ⏳
需要安装 ImageMagick：
```bash
# macOS
brew install imagemagick pngquant

# 然后执行
cd /Users/ameureka/Desktop/mksaas-ai-ppt-blog/深入细化调整/011-品牌营销设计suit
./generate-favicon.sh brand-assets/logo/ppthub-logo-icon.png
```

**输出文件**：
- favicon.ico
- favicon-16x16.png
- favicon-32x32.png
- favicon-64x64.png
- apple-touch-icon.png
- android-chrome-192x192.png
- android-chrome-512x512.png
- site.webmanifest
- browserconfig.xml

---

### 2. Logo 变体制作 ⏳

#### 需要创建的变体：

**深色模式版本**：
- ppthub-logo-full-dark.png
- 背景：深色 #0F172A
- Logo 颜色：调亮（#60A5FA → #A78BFA）

**浅色模式版本**：
- ppthub-logo-full-light.png
- 背景：白色 #FFFFFF
- Logo 颜色：原色（#2563EB → #7C3AED）

**单色版本**：
- ppthub-logo-monochrome-black.png（纯黑）
- ppthub-logo-monochrome-white.png（纯白）

---

### 3. 社交媒体资源 ⏳

**需要创建的尺寸**：
- 小红书头像：400x400px
- 抖音头像：200x200px
- 微信公众号头像：200x200px
- 知乎头像：200x200px
- 微博头像：180x180px

**保存位置**：
```
brand-assets/social/
├── xiaohongshu-avatar-400x400.png
├── douyin-avatar-200x200.png
├── wechat-avatar-200x200.png
├── zhihu-avatar-200x200.png
└── weibo-avatar-180x180.png
```

---

### 4. OG 图设计 ⏳

**需要创建**：
- og-default.png（1200x630px）
- og-home.png（1200x630px）
- og-blog.png（1200x630px）

**设计要求**：
- 包含 Logo
- 包含品牌标语："3 分钟找到完美模板"
- 蓝紫渐变背景
- 文字清晰可读

**保存位置**：
```
brand-assets/og-images/
├── og-default.png
├── og-home.png
└── og-blog.png
```

---

## 🚀 下一步行动

### 立即可做（手动）

1. **裁剪图标版本**
   - 使用图片编辑工具（Photoshop/Figma/在线工具）
   - 裁剪 ppthub-logo-icon.png 为正方形
   - 只保留左侧图标部分
   - 尺寸：512x512px

2. **制作深浅模式版本**
   - 复制 ppthub-logo-full.png
   - 调整背景色和 Logo 颜色
   - 保存为对应文件名

3. **制作社交媒体头像**
   - 使用裁剪后的图标
   - 调整为各平台所需尺寸
   - 保存到 brand-assets/social/

---

### 需要工具支持

4. **安装 ImageMagick**（用于 Favicon 生成）
   ```bash
   brew install imagemagick pngquant
   ```

5. **生成 Favicon 套件**
   ```bash
   ./generate-favicon.sh brand-assets/logo/ppthub-logo-icon.png
   ```

---

## 📐 使用规范

### 最小尺寸
- 数字媒体：32x32px
- 印刷品：20mm

### 安全区
- Logo 周围留白 = Logo 高度的 1/4

### 禁用示例
- ❌ 不得拉伸变形
- ❌ 不得改变配色（除深浅模式版本）
- ❌ 不得添加阴影/描边
- ❌ 不得旋转角度

---

## 🎨 配色参考

### 主色调
```css
/* 科技蓝 */
--primary: #2563EB;
--primary-light: #60A5FA;
--primary-dark: #1E40AF;

/* 活力橙（Hub 中心点） */
--secondary: #F59E0B;
--secondary-light: #FCD34D;
--secondary-dark: #D97706;

/* 渐变 */
--gradient: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%);
```

---

**当前状态**：主 Logo 已就绪，等待变体制作和 Favicon 生成 ✅
