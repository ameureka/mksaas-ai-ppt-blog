#!/bin/bash
# S3 上传脚本
# 用法: bash scripts/image-pipeline/upload-to-s3.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPRESSED_DIR="$SCRIPT_DIR/../../compressed"
PUBLIC_DIR="$SCRIPT_DIR/../../../../public/images/blog"
DATA_DIR="$SCRIPT_DIR/../../data"
TASKS_FILE="$DATA_DIR/image-tasks.json"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}☁️ 图片上传流程${NC}"
echo "===================="
echo ""

# 步骤 1: 复制到 public 目录
copy_to_public() {
  echo -e "${GREEN}📁 步骤 1: 复制到 public/images/blog/${NC}"

  mkdir -p "$PUBLIC_DIR"

  if [ ! -d "$COMPRESSED_DIR" ] || [ -z "$(ls -A "$COMPRESSED_DIR" 2>/dev/null)" ]; then
    echo -e "${YELLOW}⚠️ compressed 目录为空，尝试从 generated-images 复制${NC}"
    COMPRESSED_DIR="$SCRIPT_DIR/../../generated-images"
  fi

  if [ ! -d "$COMPRESSED_DIR" ] || [ -z "$(ls -A "$COMPRESSED_DIR" 2>/dev/null)" ]; then
    echo -e "${RED}❌ 没有可复制的图片${NC}"
    return 1
  fi

  local count=0
  for img in "$COMPRESSED_DIR"/*.{jpg,jpeg,png,JPG,JPEG,PNG} 2>/dev/null; do
    [ -f "$img" ] || continue
    local filename=$(basename "$img")
    cp "$img" "$PUBLIC_DIR/$filename"
    count=$((count + 1))
  done

  echo "✅ 已复制 $count 个文件到 public/images/blog/"
  echo ""
}

# 步骤 2: 上传到 S3
upload_to_s3() {
  echo -e "${GREEN}☁️ 步骤 2: 上传到 S3${NC}"

  # 检查环境变量
  if [ -z "$STORAGE_BUCKET_NAME" ]; then
    echo -e "${YELLOW}⚠️ STORAGE_BUCKET_NAME 未设置${NC}"
    echo "请在 .env.local 中配置 S3 相关环境变量"
    echo "跳过 S3 上传..."
    return 0
  fi

  if ! command -v aws &> /dev/null; then
    echo -e "${YELLOW}⚠️ AWS CLI 未安装${NC}"
    echo "安装: brew install awscli"
    echo "跳过 S3 上传..."
    return 0
  fi

  local S3_BUCKET="$STORAGE_BUCKET_NAME"
  local S3_PREFIX="public/images/blog"

  echo "Bucket: $S3_BUCKET"
  echo "Prefix: $S3_PREFIX"
  echo ""

  # 同步到 S3
  aws s3 sync "$PUBLIC_DIR/" "s3://${S3_BUCKET}/${S3_PREFIX}/" \
    --acl public-read \
    --cache-control "max-age=31536000" \
    --exclude "*.DS_Store" \
    --exclude ".gitkeep"

  echo ""
  echo "✅ S3 上传完成"
}

# 步骤 3: 更新任务状态
update_status() {
  echo -e "${GREEN}📝 步骤 3: 更新任务状态${NC}"

  if [ ! -f "$TASKS_FILE" ]; then
    echo -e "${YELLOW}⚠️ 任务文件不存在，跳过状态更新${NC}"
    return 0
  fi

  if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️ jq 未安装，跳过状态更新${NC}"
    return 0
  fi

  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # 将所有 approved 状态更新为 uploaded
  jq --arg ts "$timestamp" '
    .tasks |= map(
      if .cover.status == "approved" then .cover.status = "uploaded" | .cover.uploadedAt = $ts else . end |
      .inlineImages |= map(
        if .status == "approved" then .status = "uploaded" | .uploadedAt = $ts else . end
      ) |
      .updatedAt = $ts |
      # 重新计算 mediaStatus
      if (.cover.status == "uploaded") and ([.inlineImages[] | select(.status == "uploaded")] | length >= 3)
      then .mediaStatus = "done"
      elif (.cover.status == "uploaded") or ([.inlineImages[] | select(.status == "uploaded")] | length > 0)
      then .mediaStatus = "partial"
      else .mediaStatus = "none"
      end
    )
  ' "$TASKS_FILE" > "$TASKS_FILE.tmp" && mv "$TASKS_FILE.tmp" "$TASKS_FILE"

  echo "✅ 状态已更新"
}

# 主函数
main() {
  copy_to_public
  upload_to_s3
  update_status

  echo ""
  echo -e "${GREEN}🎉 上传流程完成${NC}"
  echo ""
  echo "下一步:"
  echo "  1. 运行 npx tsx scripts/image-pipeline/update-mdx.ts 更新 MDX 文件"
  echo "  2. 运行 npx tsx scripts/image-pipeline/show-progress.ts 查看进度"
}

main
