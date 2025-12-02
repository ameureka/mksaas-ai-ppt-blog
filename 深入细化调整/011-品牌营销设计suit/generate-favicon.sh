#!/bin/bash

# Favicon 生成脚本
# 用途：从 Logo 图片生成完整的 Favicon 套件
# 依赖：ImageMagick, pngquant
# 使用：./generate-favicon.sh <logo.png>

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查参数
if [ $# -eq 0 ]; then
    echo -e "${RED}错误：请提供 Logo 图片路径${NC}"
    echo "使用方法：./generate-favicon.sh <logo.png>"
    exit 1
fi

INPUT_FILE="$1"

# 检查文件是否存在
if [ ! -f "$INPUT_FILE" ]; then
    echo -e "${RED}错误：文件不存在 $INPUT_FILE${NC}"
    exit 1
fi

# 检查依赖
command -v convert >/dev/null 2>&1 || {
    echo -e "${RED}错误：需要安装 ImageMagick${NC}"
    echo "安装命令："
    echo "  macOS: brew install imagemagick"
    echo "  Ubuntu: sudo apt-get install imagemagick"
    exit 1
}

command -v pngquant >/dev/null 2>&1 || {
    echo -e "${YELLOW}警告：未安装 pngquant，将跳过压缩步骤${NC}"
    echo "安装命令："
    echo "  macOS: brew install pngquant"
    echo "  Ubuntu: sudo apt-get install pngquant"
    SKIP_COMPRESS=true
}

# 创建输出目录
OUTPUT_DIR="brand-assets/favicon"
mkdir -p "$OUTPUT_DIR"

echo -e "${GREEN}🎨 开始生成 Favicon 套件...${NC}"
echo "输入文件：$INPUT_FILE"
echo "输出目录：$OUTPUT_DIR"
echo ""

# 生成各种尺寸的 PNG
echo -e "${YELLOW}📐 生成各尺寸 PNG...${NC}"

sizes=(16 32 64 128 192 256 512)
for size in "${sizes[@]}"; do
    output_file="$OUTPUT_DIR/favicon-${size}x${size}.png"
    echo "  生成 ${size}x${size}px..."
    convert "$INPUT_FILE" -resize ${size}x${size} -background none -gravity center -extent ${size}x${size} "$output_file"
done

# 生成 Apple Touch Icon (180x180)
echo "  生成 Apple Touch Icon (180x180px)..."
convert "$INPUT_FILE" -resize 180x180 -background none -gravity center -extent 180x180 "$OUTPUT_DIR/apple-touch-icon.png"

# 生成 ICO 文件（包含多个尺寸）
echo -e "${YELLOW}🔷 生成 favicon.ico...${NC}"
convert "$OUTPUT_DIR/favicon-16x16.png" "$OUTPUT_DIR/favicon-32x32.png" "$OUTPUT_DIR/favicon-64x64.png" "$OUTPUT_DIR/favicon.ico"

# 压缩 PNG 文件
if [ "$SKIP_COMPRESS" != true ]; then
    echo -e "${YELLOW}🗜️  压缩 PNG 文件...${NC}"
    for file in "$OUTPUT_DIR"/*.png; do
        echo "  压缩 $(basename "$file")..."
        pngquant --quality=80-90 --force --ext .png "$file" 2>/dev/null || true
    done
fi

# 生成 site.webmanifest
echo -e "${YELLOW}📄 生成 site.webmanifest...${NC}"
cat > "$OUTPUT_DIR/site.webmanifest" << 'EOF'
{
  "name": "PPTHub",
  "short_name": "PPTHub",
  "description": "AI 驱动的免费 PPT 模板下载站",
  "icons": [
    {
      "src": "/favicon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/favicon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#2563EB",
  "background_color": "#FFFFFF",
  "display": "standalone",
  "start_url": "/"
}
EOF

# 生成 browserconfig.xml (Windows Tiles)
echo -e "${YELLOW}📄 生成 browserconfig.xml...${NC}"
cat > "$OUTPUT_DIR/browserconfig.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/favicon-256x256.png"/>
      <TileColor>#2563EB</TileColor>
    </tile>
  </msapplication>
</browserconfig>
EOF

# 生成 HTML 代码
echo -e "${YELLOW}📄 生成 HTML 代码...${NC}"
cat > "$OUTPUT_DIR/favicon-html.txt" << 'EOF'
<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#2563EB">
EOF

# 生成文件清单
echo -e "${YELLOW}📋 生成文件清单...${NC}"
cat > "$OUTPUT_DIR/README.md" << 'EOF'
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

EOF

# 添加文件大小信息
for file in "$OUTPUT_DIR"/*.{png,ico} 2>/dev/null; do
    if [ -f "$file" ]; then
        size=$(du -h "$file" | cut -f1)
        echo "- $(basename "$file"): $size" >> "$OUTPUT_DIR/README.md"
    fi
done

# 统计总大小
total_size=$(du -sh "$OUTPUT_DIR" | cut -f1)

# 输出结果
echo ""
echo -e "${GREEN}✅ Favicon 套件生成完成！${NC}"
echo ""
echo "输出目录：$OUTPUT_DIR"
echo "总大小：$total_size"
echo ""
echo "生成的文件："
ls -lh "$OUTPUT_DIR" | grep -v "^d" | awk '{print "  " $9 " (" $5 ")"}'
echo ""
echo -e "${YELLOW}下一步：${NC}"
echo "1. 复制文件到 public 目录："
echo "   cp $OUTPUT_DIR/* public/"
echo ""
echo "2. 添加 HTML 代码到网站 <head>："
echo "   查看 $OUTPUT_DIR/favicon-html.txt"
echo ""
echo "3. 验证 Favicon："
echo "   https://realfavicongenerator.net/favicon_checker"
echo ""
