#!/bin/bash
set -e

echo "🔄 开始替换博文..."

# 1. 备份模板示例
echo "📦 备份模板示例..."
mkdir -p content/blog/_template-examples
mv content/blog/algorithm.* content/blog/_template-examples/ 2>/dev/null || true
mv content/blog/creem.* content/blog/_template-examples/ 2>/dev/null || true
mv content/blog/directory.* content/blog/_template-examples/ 2>/dev/null || true
mv content/blog/dokploy.* content/blog/_template-examples/ 2>/dev/null || true
mv content/blog/email.* content/blog/_template-examples/ 2>/dev/null || true
mv content/blog/haitang.* content/blog/_template-examples/ 2>/dev/null || true
mv content/blog/obsidian.* content/blog/_template-examples/ 2>/dev/null || true
mv content/blog/premium.* content/blog/_template-examples/ 2>/dev/null || true
mv content/blog/shijing.* content/blog/_template-examples/ 2>/dev/null || true

echo "✅ 备份完成"

# 2. 验证新博文
echo "🔍 验证新博文..."
blog_count=$(find content/blog/ppt -name "*.mdx" | wc -l | xargs)
echo "博文数量: $blog_count"

if [ "$blog_count" -ne 400 ]; then
  echo "❌ 博文数量不正确，预期 400，实际 $blog_count"
  exit 1
fi

# 3. 检查图片
echo "🖼️  检查图片..."
image_count=$(find public/images/blog/ppt -type f 2>/dev/null | wc -l | xargs)
echo "图片数量: $image_count"

# 4. 统计分类
echo ""
echo "📊 分类统计:"
for dir in content/blog/ppt/*/; do 
  [ -d "$dir" ] && echo "  $(basename "$dir"): $(find "$dir" -name "*.mdx" | wc -l | xargs) 个"
done

echo ""
echo "✅ 替换完成！"
echo ""
echo "📋 下一步："
echo "1. 运行 pnpm dev 启动开发服务器"
echo "2. 访问 http://localhost:3005/blog 检查博客列表"
echo "3. 测试几篇博文详情页"
echo "4. 检查中英文切换"
echo ""
echo "💡 如需回滚，运行:"
echo "   mv content/blog/_template-examples/* content/blog/"
