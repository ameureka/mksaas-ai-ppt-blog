#!/bin/bash
# 图片压缩脚本
# 用法: bash scripts/image-pipeline/compress-images.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INPUT_DIR="${1:-$SCRIPT_DIR/../../generated-images}"
OUTPUT_DIR="$SCRIPT_DIR/../../compressed"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

mkdir -p "$OUTPUT_DIR"

echo -e "${GREEN}🗜️ 开始压缩图片...${NC}"
echo "输入目录: $INPUT_DIR"
echo "输出目录: $OUTPUT_DIR"
echo ""

# 检查依赖
check_deps() {
  local missing=()

  if ! command -v convert &> /dev/null; then
    missing+=("ImageMagick (brew install imagemagick)")
  fi

  if ! command -v pngquant &> /dev/null; then
    missing+=("pngquant (brew install pngquant)")
  fi

  if [ ${#missing[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️ 缺少依赖:${NC}"
    for dep in "${missing[@]}"; do
      echo "  - $dep"
    done
    echo ""
    echo "将使用基础复制模式..."
    return 1
  fi
  return 0
}

# 压缩 JPG（封面）
compress_jpg() {
  local input="$1"
  local output="$2"

  if command -v convert &> /dev/null; then
    convert "$input" -quality 85 -resize "1200x630>" "$output"
  else
    cp "$input" "$output"
  fi
}

# 压缩 PNG（内页）
compress_png() {
  local input="$1"
  local output="$2"

  if command -v pngquant &> /dev/null; then
    pngquant --quality=65-80 --output "$output" "$input" 2>/dev/null || cp "$input" "$output"
  else
    cp "$input" "$output"
  fi
}

# 规范化文件名（小写、连字符）
normalize_filename() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | tr ' ' '-'
}

# 主处理
process_images() {
  local count=0
  local total_before=0
  local total_after=0

  # 处理封面（JPG）
  shopt -s nullglob
  for img in "$INPUT_DIR"/*-cover.{jpg,jpeg,JPG,JPEG}; do
    [ -f "$img" ] || continue

    local filename=$(basename "$img")
    local normalized=$(normalize_filename "${filename%.*}-cover.jpg")
    local output="$OUTPUT_DIR/$normalized"

    local before_size=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img")
    compress_jpg "$img" "$output"
    local after_size=$(stat -f%z "$output" 2>/dev/null || stat -c%s "$output")

    total_before=$((total_before + before_size))
    total_after=$((total_after + after_size))
    count=$((count + 1))

    local before_kb=$((before_size / 1024))
    local after_kb=$((after_size / 1024))
    echo -e "${GREEN}✅${NC} $normalized: ${before_kb}KB -> ${after_kb}KB"
  done

  # 处理内页（PNG）
  for img in "$INPUT_DIR"/*.png "$INPUT_DIR"/*.PNG; do
    [ -f "$img" ] || continue
    [[ "$img" == *"-cover"* ]] && continue

    local filename=$(basename "$img")
    local normalized=$(normalize_filename "$filename")
    local output="$OUTPUT_DIR/$normalized"

    local before_size=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img")
    compress_png "$img" "$output"
    local after_size=$(stat -f%z "$output" 2>/dev/null || stat -c%s "$output")

    total_before=$((total_before + before_size))
    total_after=$((total_after + after_size))
    count=$((count + 1))

    local before_kb=$((before_size / 1024))
    local after_kb=$((after_size / 1024))
    echo -e "${GREEN}✅${NC} $normalized: ${before_kb}KB -> ${after_kb}KB"
  done

  echo ""
  echo -e "${GREEN}📊 压缩完成${NC}"
  echo "处理文件: $count 个"

  if [ $total_before -gt 0 ]; then
    local before_mb=$((total_before / 1024 / 1024))
    local after_mb=$((total_after / 1024 / 1024))
    local saved=$((total_before - total_after))
    local saved_mb=$((saved / 1024 / 1024))
    local percent=$((saved * 100 / total_before))
    echo "压缩前: ${before_mb}MB"
    echo "压缩后: ${after_mb}MB"
    echo "节省: ${saved_mb}MB (${percent}%)"
  fi
}

# 主函数
main() {
  if [ ! -d "$INPUT_DIR" ] || [ -z "$(ls -A "$INPUT_DIR" 2>/dev/null)" ]; then
    echo -e "${YELLOW}⚠️ generated-images 目录为空${NC}"
    echo "请先生成图片"
    exit 0
  fi

  check_deps || true
  process_images
}

main
