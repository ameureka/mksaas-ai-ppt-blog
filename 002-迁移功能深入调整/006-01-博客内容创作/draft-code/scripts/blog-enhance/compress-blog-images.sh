#!/bin/bash
# 压缩 public/images/blog/ppt/ 目录下的图片

set -e

TARGET_DIR="/Users/ameureka/Desktop/mksaas-ai-ppt-blog/public/images/blog/ppt"

echo "🗜️ 开始压缩图片..."
echo "目标目录: $TARGET_DIR"

total_before=0
total_after=0
count=0

for subdir in "$TARGET_DIR"/*/; do
  [ -d "$subdir" ] || continue
  echo ""
  echo "📁 处理: $(basename "$subdir")"
  
  for img in "$subdir"*.jpg "$subdir"*.png; do
    [ -f "$img" ] || continue
    
    before=$(stat -f%z "$img")
    sips -Z 1200 "$img" --out "$img" >/dev/null 2>&1
    after=$(stat -f%z "$img")
    
    total_before=$((total_before + before))
    total_after=$((total_after + after))
    count=$((count + 1))
    
    saved=$((before - after))
    if [ $saved -gt 10240 ]; then
      echo "✅ $(basename "$img"): $((before/1024))KB → $((after/1024))KB"
    fi
  done
done

echo ""
echo "📊 压缩完成: $count 个文件"
if [ $total_before -gt 0 ]; then
  echo "压缩前: $((total_before/1024/1024))MB"
  echo "压缩后: $((total_after/1024/1024))MB"
  echo "节省: $(((total_before-total_after)/1024/1024))MB ($(((total_before-total_after)*100/total_before))%)"
fi
