#!/bin/bash

# start_crawl.sh - Run crawl job in background (nohup)
# Usage: ./start_crawl.sh [channel] [start_page] [end_page]

CHANNEL=${1:-ppt_xiazai}
START=${2:-1}
END=${3:-5}

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/crawl_${CHANNEL}_${TIMESTAMP}.log"

echo "Starting crawl for channel=$CHANNEL pages $START-$END..."
echo "Logs will be written to $LOG_FILE"

cd "$PROJECT_ROOT"

# Ensure built
if [ ! -d "dist" ]; then
    echo "Build not found. Running build..."
    npm run build
fi

# Run in background
nohup npm run crawl -- --channel="$CHANNEL" --start="$START" --end="$END" > "$LOG_FILE" 2>&1 &

echo "Process started. PID: $!"
echo "Tail log: tail -f $LOG_FILE"
