# PPTHub 品牌 - 下一步行动指南

> 更新时间：2025-12-02 17:40  
> 当前进度：Logo 已完成 ✅

---

## ✅ 已完成

1. ✅ 品牌名称确定：PPTHub
2. ✅ 域名选择：ppthub.shop
3. ✅ 品牌配置创建：brand-config.json
4. ✅ Logo 设计完成：ppthub-logo-full.png
5. ✅ Logo 标准化命名

---

## 🚀 立即行动（今天完成）

### 选项 A：手动制作 Logo 变体（推荐）⚡

**需要工具**：
- Figma（免费）：https://figma.com/
- 或 Photoshop
- 或在线工具：https://www.remove.bg/（去背景）

**步骤**：

#### 1. 裁剪图标版本（10 分钟）
```
打开：ppthub-logo-full.png
裁剪：只保留左侧图标部分（3 层幻灯片 + Hub 网络）
尺寸：512x512px（正方形）
保存为：ppthub-logo-icon.png
```

#### 2. 制作深浅模式版本（可选，10 分钟）
```
浅色模式：
- 背景：白色 #FFFFFF
- Logo：原色
- 保存为：ppthub-logo-full-light.png

深色模式：
- 背景：深色 #0F172A
- Logo：调亮颜色
- 保存为：ppthub-logo-full-dark.png
```

#### 3. 制作社交媒体头像（15 分钟）
```
使用裁剪后的图标（ppthub-logo-icon.png）

调整尺寸：
- 小红书：400x400px → xiaohongshu-avatar.png
- 抖音：200x200px → douyin-avatar.png
- 微信：200x200px → wechat-avatar.png
- 知乎：200x200px → zhihu-avatar.png

保存到：brand-assets/social/
```

**总耗时**：35 分钟

---

### 选项 B：安装工具自动生成（需要技术）

#### 1. 安装 ImageMagick
```bash
# macOS
brew install imagemagick pngquant

# 验证安装
convert --version
```

#### 2. 生成 Favicon 套件
```bash
cd /Users/ameureka/Desktop/mksaas-ai-ppt-blog/深入细化调整/011-品牌营销设计suit

./generate-favicon.sh brand-assets/logo/ppthub-logo-icon.png
```

**输出**：
- favicon.ico
- favicon-16x16.png
- favicon-32x32.png
- apple-touch-icon.png
- android-chrome-192x192.png
- android-chrome-512x512.png
- site.webmanifest
- browserconfig.xml

---

## 📅 本周完成

### 1. 域名注册 🔴 重要
```
平台：阿里云万网
网址：https://wanwang.aliyun.com/
域名：ppthub.shop
价格：¥12/年

步骤：
1. 搜索 ppthub.shop
2. 加入购物车
3. 完成支付
4. 配置 DNS（等待网站部署）
```

---

### 2. 社交媒体账号注册
```
平台清单：
- [ ] 小红书：@ppthub
- [ ] 抖音：@ppthub
- [ ] 微信公众号：PPTHub
- [ ] 知乎：ppthub
- [ ] 微博：@PPTHub

准备资料：
- Logo 图标（ppthub-logo-icon.png）
- 品牌介绍：AI 驱动的 PPT 模板快速下载站
- 联系邮箱：hello@ppthub.shop
```

---

### 3. 复制 Logo 到项目 public 目录
```bash
# 复制主 Logo
cp brand-assets/logo/ppthub-logo-full.png ../../public/logo.png

# 复制深色模式 Logo（如果已制作）
cp brand-assets/logo/ppthub-logo-full-dark.png ../../public/logo-dark.png

# 复制 Favicon（生成后）
cp brand-assets/favicon/* ../../public/
```

---

## 📋 下周完成

### 1. 品牌信息替换

#### 更新配置文件
```bash
# 1. 更新 src/config/website.tsx
# 替换：MkSaaS → PPTHub
# 替换：mksaas.me → ppthub.shop

# 2. 更新 package.json
{
  "name": "ppthub",
  "description": "AI 驱动的 PPT 模板下载站"
}

# 3. 更新 README.md
# 替换所有品牌引用
```

#### 更新国际化文件
```bash
# messages/en.json
# messages/zh.json
# 替换品牌名称和标语
```

#### 更新作者信息
```bash
# 创建新作者：ppthub-official
# 批量更新 204 篇博客的 author 字段
npx tsx scripts/update-blog-authors.ts
```

---

### 2. SEO 优化
```bash
# 1. 更新 Meta 标签
<title>PPTHub - AI 驱动的免费 PPT 模板下载站</title>
<meta name="description" content="...">

# 2. 更新 OG 图
public/og.png → 使用新的 PPTHub OG 图

# 3. 更新 llms.txt
public/llms.txt → 替换品牌名称
```

---

### 3. 测试验证
```bash
# 本地测试
pnpm dev

# 构建测试
pnpm build
pnpm start

# 检查项：
- [ ] Logo 显示正常
- [ ] Favicon 显示正常
- [ ] 深浅模式切换正常
- [ ] 所有页面品牌一致
```

---

## 🎯 优先级排序

### P0（必须今天完成）
1. ✅ Logo 重命名（已完成）
2. 🔲 裁剪图标版本
3. 🔲 制作社交媒体头像

### P1（本周完成）
4. 🔲 域名注册
5. 🔲 社交媒体账号注册
6. 🔲 复制 Logo 到 public 目录

### P2（下周完成）
7. 🔲 品牌信息替换
8. 🔲 SEO 优化
9. 🔲 测试验证

---

## 💡 快速参考

### 文件位置
```
Logo 源文件：
/Users/ameureka/Desktop/mksaas-ai-ppt-blog/深入细化调整/011-品牌营销设计suit/brand-assets/logo/

项目 public 目录：
/Users/ameureka/Desktop/mksaas-ai-ppt-blog/public/

配置文件：
/Users/ameureka/Desktop/mksaas-ai-ppt-blog/src/config/website.tsx
```

### 品牌信息
```
品牌名称：PPTHub
域名：ppthub.shop
标语：3 分钟找到完美模板
配色：科技蓝 #2563EB + 活力橙 #F59E0B
```

---

## 📞 需要帮助？

**我可以帮你**：
1. 生成 OG 图设计方案
2. 编写品牌替换脚本
3. 制作社交媒体素材模板
4. 优化 SEO 配置

**告诉我你需要什么！** 🚀
