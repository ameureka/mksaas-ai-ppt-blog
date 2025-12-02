# Favicon 套件

生成时间：$(date +"%Y-%m-%d %H:%M:%S")

## 文件说明

### 标准 Favicon
- `favicon.ico` - 标准 ICO 格式（16x16, 32x32, 64x64）
- `favicon-16x16.png` - 浏览器标签页
- `favicon-32x32.png` - 浏览器标签页（高清）

### 移动端
- `apple-touch-icon.png` - iOS 主屏幕图标（180x180）
- `favicon-192x192.png` - Android Chrome（192x192）
- `favicon-512x512.png` - Android Chrome（512x512）

### 其他尺寸
- `favicon-64x64.png` - 书签栏
- `favicon-128x128.png` - Chrome Web Store
- `favicon-256x256.png` - Windows Tiles

### 配置文件
- `site.webmanifest` - PWA 配置
- `browserconfig.xml` - Windows Tiles 配置
- `favicon-html.txt` - HTML 代码片段

## 使用方法

### 1. 复制文件到 public 目录
```bash
cp brand-assets/favicon/* public/
```

### 2. 添加 HTML 代码到 <head>
将 `favicon-html.txt` 中的代码复制到网站的 `<head>` 标签中。

### 3. 验证
访问以下网站验证 Favicon：
- https://realfavicongenerator.net/favicon_checker
- https://www.favicon-checker.com/

## 文件大小

