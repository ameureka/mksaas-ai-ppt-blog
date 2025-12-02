#!/bin/bash
# 品牌统一处理主控脚本

set -e

BRAND_DIR="新品牌资源包"
BACKUP_DIR="深入细化调整/010-公共组件批量处理/backup"

echo "🚀 品牌统一处理 Pipeline"
echo "================================"
echo ""

# 检查品牌资源包
if [ ! -d "$BRAND_DIR" ]; then
  echo "❌ 错误: 未找到品牌资源包目录: $BRAND_DIR"
  echo "请先创建该目录并放入新品牌资源"
  exit 1
fi

if [ ! -f "$BRAND_DIR/brand-config.json" ]; then
  echo "❌ 错误: 未找到 brand-config.json"
  exit 1
fi

# 阶段 0: 备份
echo "📦 阶段 0: 创建备份..."
mkdir -p "$BACKUP_DIR"
git add . 2>/dev/null || true
git commit -m "backup: before brand unification" 2>/dev/null || true
git tag "backup-before-brand-$(date +%Y%m%d)" 2>/dev/null || true

cp -r content/author "$BACKUP_DIR/"
cp -r public/images/avatars "$BACKUP_DIR/"
cp -r public/images/authors "$BACKUP_DIR/"
cp public/logo*.png "$BACKUP_DIR/" 2>/dev/null || true

echo "✅ 备份完成"
echo ""

# 阶段 1: Logo 替换
echo "🎨 阶段 1: 替换核心品牌资产..."

if [ -f "$BRAND_DIR/logo.png" ]; then
  cp "$BRAND_DIR/logo.png" public/logo.png
  echo "  ✅ logo.png"
fi

if [ -f "$BRAND_DIR/logo-dark.png" ]; then
  cp "$BRAND_DIR/logo-dark.png" public/logo-dark.png
  echo "  ✅ logo-dark.png"
fi

if [ -f "$BRAND_DIR/og.png" ]; then
  cp "$BRAND_DIR/og.png" public/og.png
  pngquant --quality=70-80 --force --ext .png public/og.png 2>/dev/null || true
  echo "  ✅ og.png (已压缩)"
fi

echo "✅ 阶段 1 完成"
echo ""

# 阶段 2: 作者统一
echo "👤 阶段 2: 统一作者身份..."
npx tsx scripts/pipeline/02-unify-authors.ts
npx tsx scripts/pipeline/02-update-blog-authors.ts
echo "✅ 阶段 2 完成"
echo ""

# 阶段 3: 视觉资产
echo "🖼️ 阶段 3: 替换视觉资产..."

if [ -f "$BRAND_DIR/avatar-official.png" ]; then
  cp "$BRAND_DIR/avatar-official.png" public/images/avatars/official.png
  pngquant --quality=80-90 --force --ext .png public/images/avatars/official.png 2>/dev/null || true
  echo "  ✅ official.png"
fi

echo "✅ 阶段 3 完成"
echo ""

# 阶段 4: 配置更新
echo "⚙️ 阶段 4: 更新配置文件..."
npx tsx scripts/pipeline/04-update-configs.ts
echo "✅ 阶段 4 完成"
echo ""

# 阶段 5: SEO 优化
echo "🔍 阶段 5: 优化 SEO 资源..."
bash scripts/pipeline/05-update-llms.sh
echo "✅ 阶段 5 完成"
echo ""

# 阶段 6: 验证
echo "✅ 阶段 6: 验证处理结果..."
npx tsx scripts/pipeline/06-verify.ts

echo ""
echo "🎉 品牌统一处理完成！"
echo ""
echo "📋 下一步:"
echo "1. 运行 'pnpm dev' 启动开发服务器"
echo "2. 访问 http://localhost:3005 检查品牌显示"
echo "3. 检查博客页面作者信息"
echo "4. 运行 'pnpm build' 测试构建"
echo ""
echo "💡 如需回滚，运行:"
echo "   git reset --hard backup-before-brand-$(date +%Y%m%d)"
