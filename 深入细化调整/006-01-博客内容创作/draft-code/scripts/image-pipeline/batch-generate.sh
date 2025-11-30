#!/bin/bash
# Gemini CLI 批量图片生成脚本
# 用法: bash scripts/image-pipeline/batch-generate.sh [--covers|--inlines|--all]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/../../data"
OUTPUT_DIR="$SCRIPT_DIR/../../generated-images"
LOG_DIR="$SCRIPT_DIR/../../logs"
TASKS_FILE="$DATA_DIR/image-tasks.json"

# 创建目录
mkdir -p "$OUTPUT_DIR" "$LOG_DIR"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查依赖
check_dependencies() {
  if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ 需要安装 jq: brew install jq${NC}"
    exit 1
  fi

  if ! command -v gemini &> /dev/null; then
    echo -e "${YELLOW}⚠️ Gemini CLI 未安装，将生成待处理清单供手工使用${NC}"
    return 1
  fi
  return 0
}

# 生成封面图
generate_covers() {
  echo -e "${GREEN}🎨 开始生成封面图...${NC}"

  local count=0
  local total=$(jq '[.tasks[] | select(.cover.status == "pending")] | length' "$TASKS_FILE")

  echo "待处理封面: $total 张"

  jq -c '.tasks[] | select(.cover.status == "pending")' "$TASKS_FILE" | while read -r task; do
    local slug=$(echo "$task" | jq -r '.slug')
    local filename=$(echo "$task" | jq -r '.cover.filename')
    local prompt=$(echo "$task" | jq -r '.cover.prompt')
    local output_path="$OUTPUT_DIR/$filename"

    count=$((count + 1))
    echo -e "\n${YELLOW}[$count/$total] 生成封面: $slug${NC}"

    # 调用 Gemini CLI
    if gemini generate-image \
      --prompt "$prompt" \
      --output "$output_path" \
      --size "1200x630" \
      2>&1 | tee -a "$LOG_DIR/${slug}.log"; then

      if [ -f "$output_path" ]; then
        echo -e "${GREEN}✅ 成功: $filename${NC}"
        # 更新状态
        update_cover_status "$slug" "generated"
      else
        echo -e "${RED}❌ 失败: 文件未生成${NC}"
      fi
    else
      echo -e "${RED}❌ 失败: Gemini CLI 错误${NC}"
    fi

    # 避免 rate limit
    sleep 3
  done

  echo -e "\n${GREEN}📊 封面生成完成${NC}"
}

# 生成内页图
generate_inlines() {
  echo -e "${GREEN}🖼️ 开始生成内页图...${NC}"

  jq -c '.tasks[]' "$TASKS_FILE" | while read -r task; do
    local slug=$(echo "$task" | jq -r '.slug')

    echo "$task" | jq -c '.inlineImages[] | select(.status == "pending")' | while read -r inline; do
      local filename=$(echo "$inline" | jq -r '.filename')
      local prompt=$(echo "$inline" | jq -r '.prompt')
      local output_path="$OUTPUT_DIR/$filename"

      echo -e "${YELLOW}生成内页: $filename${NC}"

      if gemini generate-image \
        --prompt "$prompt" \
        --output "$output_path" \
        --size "1000x600" \
        2>&1 | tee -a "$LOG_DIR/${slug}.log"; then

        if [ -f "$output_path" ]; then
          echo -e "${GREEN}✅ 成功: $filename${NC}"
          update_inline_status "$slug" "$filename" "generated"
        fi
      fi

      sleep 2
    done
  done

  echo -e "\n${GREEN}📊 内页生成完成${NC}"
}

# 更新封面状态
update_cover_status() {
  local slug="$1"
  local status="$2"
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  jq --arg slug "$slug" --arg status "$status" --arg ts "$timestamp" \
    '(.tasks[] | select(.slug == $slug) | .cover.status) = $status |
     (.tasks[] | select(.slug == $slug) | .cover.generatedAt) = $ts |
     (.tasks[] | select(.slug == $slug) | .updatedAt) = $ts' \
    "$TASKS_FILE" > "$TASKS_FILE.tmp" && mv "$TASKS_FILE.tmp" "$TASKS_FILE"
}

# 更新内页状态
update_inline_status() {
  local slug="$1"
  local filename="$2"
  local status="$3"
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  jq --arg slug "$slug" --arg filename "$filename" --arg status "$status" --arg ts "$timestamp" \
    '(.tasks[] | select(.slug == $slug) | .inlineImages[] | select(.filename == $filename) | .status) = $status |
     (.tasks[] | select(.slug == $slug) | .inlineImages[] | select(.filename == $filename) | .generatedAt) = $ts |
     (.tasks[] | select(.slug == $slug) | .updatedAt) = $ts' \
    "$TASKS_FILE" > "$TASKS_FILE.tmp" && mv "$TASKS_FILE.tmp" "$TASKS_FILE"
}

# 显示进度
show_progress() {
  echo -e "\n${GREEN}📊 当前进度${NC}"
  echo "================"

  local total=$(jq '.tasks | length' "$TASKS_FILE")
  local cover_pending=$(jq '[.tasks[] | select(.cover.status == "pending")] | length' "$TASKS_FILE")
  local cover_generated=$(jq '[.tasks[] | select(.cover.status == "generated")] | length' "$TASKS_FILE")
  local cover_done=$(jq '[.tasks[] | select(.cover.status == "approved" or .cover.status == "uploaded")] | length' "$TASKS_FILE")

  local inline_pending=$(jq '[.tasks[].inlineImages[] | select(.status == "pending")] | length' "$TASKS_FILE")
  local inline_generated=$(jq '[.tasks[].inlineImages[] | select(.status == "generated")] | length' "$TASKS_FILE")
  local inline_done=$(jq '[.tasks[].inlineImages[] | select(.status == "approved" or .status == "uploaded")] | length' "$TASKS_FILE")

  echo "封面: pending=$cover_pending, generated=$cover_generated, done=$cover_done / $total"
  echo "内页: pending=$inline_pending, generated=$inline_generated, done=$inline_done"
}

# 主函数
main() {
  echo -e "${GREEN}🚀 Gemini 图片批量生成${NC}"
  echo "========================"

  if [ ! -f "$TASKS_FILE" ]; then
    echo -e "${RED}❌ 任务文件不存在: $TASKS_FILE${NC}"
    echo "请先运行: npx tsx scripts/image-pipeline/generate-prompts.ts"
    exit 1
  fi

  local mode="${1:---all}"

  if ! check_dependencies; then
    echo -e "${YELLOW}⚠️ 请使用网页手工生成，参考 pending-prompts.md${NC}"
    exit 0
  fi

  case "$mode" in
    --covers)
      generate_covers
      ;;
    --inlines)
      generate_inlines
      ;;
    --all)
      generate_covers
      generate_inlines
      ;;
    --progress)
      show_progress
      ;;
    *)
      echo "用法: $0 [--covers|--inlines|--all|--progress]"
      exit 1
      ;;
  esac

  show_progress
}

main "$@"
