# OG 图（Open Graph）设计指南

> 品牌：PPTHub  
> 创建时间：2025-12-02

---

## 一、什么是 OG 图？

**Open Graph 图片**是在社交媒体（微信、微博、Twitter、Facebook）分享链接时显示的预览图。

### 显示场景
- 微信分享链接
- 微博分享链接
- Twitter Card
- Facebook 分享
- LinkedIn 分享

### 重要性
- ✅ 提高点击率（有图比无图点击率高 3 倍）
- ✅ 传达品牌形象
- ✅ 增加专业度

---

## 二、尺寸规范

### 标准尺寸
- **推荐**：1200x630px（Facebook/Twitter 标准）
- **最小**：600x315px
- **比例**：1.91:1

### 文件要求
- **格式**：PNG 或 JPG
- **大小**：< 8MB（推荐 < 300KB）
- **质量**：72-90 DPI

### 安全区域
```
┌─────────────────────────────────────┐
│ ← 40px →                  ← 40px → │
│ ↑                                 ↑ │
│ 40px    【内容安全区域】        40px│
│ ↓                                 ↓ │
│ ← 40px →                  ← 40px → │
└─────────────────────────────────────┘

内容安全区域：1120x550px
避免重要内容被裁剪
```

---

## 三、设计方案

### 🏆 方案 A：品牌标语型（推荐）

**布局**：
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  ╔═══╗                                         │
│ ╔═══╗║                                         │
│╔═══╗║║  ⚪                                     │
│║   ║║║ 🔵   PPTHub                            │
│╚═══╝╝╝  ⚪                                     │
│                                                 │
│         3 分钟找到完美模板                      │
│         30 分钟完成专业 PPT                     │
│                                                 │
│         AI 驱动 · 免费下载 · 海量资源          │
│                                                 │
└─────────────────────────────────────────────────┘
```

**元素**：
- Logo 图标（左上角，200x200px）
- 品牌名称（大字体，60-80px）
- 核心标语（中字体，40-50px）
- 特点标签（小字体，24-30px）
- 渐变背景（蓝紫渐变）

**适用**：
- 首页 OG 图
- 默认 OG 图

---

### 方案 B：功能展示型

**布局**：
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  PPTHub - AI 驱动的 PPT 模板平台               │
│                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ 🤖 AI   │  │ 📦 800+ │  │ ⚡ 3分钟 │       │
│  │ 智能推荐 │  │ 模板库  │  │ 快速找到 │       │
│  └─────────┘  └─────────┘  └─────────┘       │
│                                                 │
│  商业 · 教育 · 政府 · 营销 · 提案 · 汇报      │
│                                                 │
└─────────────────────────────────────────────────┘
```

**元素**：
- 标题（顶部）
- 3 个核心功能卡片
- 分类标签（底部）
- 简洁背景

**适用**：
- 关于页面
- 功能介绍页

---

### 方案 C：博客文章型

**布局**：
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  【文章标题】                                   │
│  如何用 AI 快速制作专业 PPT                     │
│                                                 │
│  ┌─────────────────────────────────┐          │
│  │                                 │          │
│  │     【文章配图或截图】           │          │
│  │                                 │          │
│  └─────────────────────────────────┘          │
│                                                 │
│  PPTHub · 2025-12-02 · 5 分钟阅读             │
│                                                 │
└─────────────────────────────────────────────────┘
```

**元素**：
- 文章标题（大字体）
- 文章配图（居中）
- 元信息（底部）
- Logo 水印（角落）

**适用**：
- 博客文章页
- 教程页面

---

## 四、设计规范

### 配色方案

**主背景**：
```css
/* 渐变背景（推荐） */
background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%);

/* 或纯色背景 */
background: #2563EB;

/* 或白色背景 + 彩色元素 */
background: #FFFFFF;
```

**文字颜色**：
```css
/* 深色背景 */
color: #FFFFFF; /* 主标题 */
color: rgba(255, 255, 255, 0.9); /* 副标题 */
color: rgba(255, 255, 255, 0.7); /* 辅助文字 */

/* 浅色背景 */
color: #1E293B; /* 主标题 */
color: #475569; /* 副标题 */
color: #64748B; /* 辅助文字 */
```

---

### 字体规范

**中文字体**：
- 主标题：思源黑体 Bold / 阿里巴巴普惠体 Bold
- 副标题：思源黑体 Medium
- 正文：思源黑体 Regular

**英文字体**：
- 主标题：Inter Bold / Poppins Bold
- 副标题：Inter SemiBold
- 正文：Inter Regular

**字号建议**：
```
主标题：60-80px
副标题：40-50px
正文：24-30px
小字：18-20px
```

---

### 布局原则

1. **视觉层级**
   - 主标题最大最醒目
   - 副标题次之
   - 辅助信息最小

2. **留白充足**
   - 周围留白 40px
   - 元素间距 20-30px
   - 避免拥挤

3. **对齐规范**
   - 左对齐或居中对齐
   - 避免右对齐
   - 保持一致性

4. **品牌元素**
   - Logo 必须出现
   - 品牌色必须使用
   - 保持品牌调性

---

## 五、制作方法

### 方法 1：使用 Figma（推荐）⭐⭐⭐⭐⭐

**步骤**：

1. **创建画布**
   ```
   打开 Figma
   Frame → 1200x630px
   命名：og-default
   ```

2. **添加背景**
   ```
   矩形工具（R）
   尺寸：1200x630px
   填充：渐变（#2563EB → #7C3AED，135°）
   ```

3. **添加 Logo**
   ```
   导入 ppthub-logo-icon.png
   位置：左上角（40px, 40px）
   尺寸：150x150px
   ```

4. **添加文字**
   ```
   文本工具（T）
   
   主标题：
   - 内容："PPTHub"
   - 字体：Inter Bold
   - 大小：72px
   - 颜色：#FFFFFF
   - 位置：Logo 右侧或居中
   
   副标题：
   - 内容："3 分钟找到完美模板"
   - 字体：思源黑体 Medium
   - 大小：48px
   - 颜色：rgba(255,255,255,0.9)
   
   标签：
   - 内容："AI 驱动 · 免费下载 · 海量资源"
   - 字体：Inter Regular
   - 大小：24px
   - 颜色：rgba(255,255,255,0.7)
   ```

5. **调整布局**
   ```
   选中所有元素
   对齐：居中或左对齐
   间距：均匀分布
   检查安全区域
   ```

6. **导出**
   ```
   选中 Frame
   Export → PNG
   尺寸：1x（1200x630px）
   质量：90%
   点击 Export
   ```

---

### 方法 2：使用 Canva（简单）⭐⭐⭐⭐

**步骤**：

1. **创建设计**
   ```
   打开 Canva
   Create a design → Custom size
   输入：1200 x 630 px
   ```

2. **选择模板（可选）**
   ```
   搜索："Social Media"
   选择喜欢的模板
   或从空白开始
   ```

3. **添加背景**
   ```
   Elements → Gradients
   选择蓝紫渐变
   或自定义渐变
   ```

4. **添加 Logo**
   ```
   Uploads → Upload files
   选择 ppthub-logo-icon.png
   拖拽到画布
   调整位置和大小
   ```

5. **添加文字**
   ```
   Text → Add a heading
   输入："PPTHub"
   调整字体、大小、颜色
   
   重复添加副标题和标签
   ```

6. **导出**
   ```
   Share → Download
   格式：PNG
   质量：推荐
   点击 Download
   ```

---

### 方法 3：使用代码生成（自动化）⭐⭐⭐⭐⭐

**使用 @vercel/og**：

```typescript
// app/api/og/route.tsx
import { ImageResponse } from '@vercel/og';

export async function GET(request: Request) {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
        }}
      >
        {/* Logo */}
        <img
          src="https://ppthub.shop/logo-icon.png"
          width="150"
          height="150"
          style={{ marginBottom: '30px' }}
        />
        
        {/* 主标题 */}
        <h1
          style={{
            fontSize: '72px',
            fontWeight: 'bold',
            color: '#FFFFFF',
            margin: '0',
          }}
        >
          PPTHub
        </h1>
        
        {/* 副标题 */}
        <p
          style={{
            fontSize: '48px',
            color: 'rgba(255, 255, 255, 0.9)',
            margin: '20px 0',
          }}
        >
          3 分钟找到完美模板
        </p>
        
        {/* 标签 */}
        <p
          style={{
            fontSize: '24px',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: '0',
          }}
        >
          AI 驱动 · 免费下载 · 海量资源
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

**优点**：
- ✅ 自动化生成
- ✅ 动态内容（文章标题等）
- ✅ 无需手动设计

---

## 六、不同页面的 OG 图

### 1. 首页 OG 图
```
文件名：og-home.png
内容：
- Logo + 品牌名称
- 核心标语
- 3 个特点标签
```

### 2. 博客列表 OG 图
```
文件名：og-blog.png
内容：
- "PPT 制作教程"
- "200+ 实用技巧"
- Logo 水印
```

### 3. 博客文章 OG 图（动态）
```
文件名：动态生成
内容：
- 文章标题
- 分类标签
- 发布日期
- Logo 水印
```

### 4. 分类页 OG 图
```
文件名：og-category-{name}.png
内容：
- 分类名称（如"商业报告"）
- 分类图标
- 模板数量
- Logo
```

---

## 七、质量检查清单

### 设计检查
- [ ] Logo 清晰可见
- [ ] 文字清晰易读
- [ ] 配色符合品牌规范
- [ ] 布局平衡美观
- [ ] 留白充足

### 技术检查
- [ ] 尺寸：1200x630px
- [ ] 格式：PNG 或 JPG
- [ ] 大小：< 300KB
- [ ] 质量：72-90 DPI

### 平台测试
- [ ] 微信分享预览
- [ ] 微博分享预览
- [ ] Twitter Card 验证
- [ ] Facebook Debugger 验证

---

## 八、测试工具

### 1. Facebook Sharing Debugger
```
网址：https://developers.facebook.com/tools/debug/
用途：测试 OG 图显示效果
步骤：
1. 输入网站 URL
2. 点击 Debug
3. 查看预览效果
4. 点击 Scrape Again 刷新缓存
```

### 2. Twitter Card Validator
```
网址：https://cards-dev.twitter.com/validator
用途：测试 Twitter Card
步骤：
1. 输入网站 URL
2. 点击 Preview card
3. 查看预览效果
```

### 3. 微信开发者工具
```
用途：测试微信分享
步骤：
1. 打开微信开发者工具
2. 输入网站 URL
3. 查看分享预览
```

---

## 九、HTML 代码

### 基础 OG 标签
```html
<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://ppthub.shop/" />
<meta property="og:title" content="PPTHub - AI 驱动的免费 PPT 模板下载站" />
<meta property="og:description" content="3 分钟找到完美模板，30 分钟完成专业 PPT" />
<meta property="og:image" content="https://ppthub.shop/og-default.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="PPTHub Logo" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content="https://ppthub.shop/" />
<meta name="twitter:title" content="PPTHub - AI 驱动的免费 PPT 模板下载站" />
<meta name="twitter:description" content="3 分钟找到完美模板，30 分钟完成专业 PPT" />
<meta name="twitter:image" content="https://ppthub.shop/og-default.png" />
```

---

## 十、快速开始

### 最简单的方法（10 分钟）

1. **使用 Canva**
   - 打开 https://canva.com/
   - 创建 1200x630px 设计
   - 添加渐变背景
   - 添加 Logo 和文字
   - 导出 PNG

2. **保存文件**
   ```
   brand-assets/og-images/og-default.png
   ```

3. **复制到 public 目录**
   ```bash
   cp brand-assets/og-images/og-default.png ../../public/og.png
   ```

**完成！** ✅

---

**准备好开始设计了吗？告诉我你选择哪种方法！** 🎨
