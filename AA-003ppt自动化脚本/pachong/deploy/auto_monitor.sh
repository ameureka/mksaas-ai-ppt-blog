#!/bin/bash

# auto_monitor.sh - Automatically run subsequent batches after the current one finishes
# Usage: ./auto_monitor.sh [CURRENT_PID]

CURRENT_PID=$1

if [ -z "$CURRENT_PID" ]; then
    echo "Usage: ./auto_monitor.sh [CURRENT_PID]"
    exit 1
fi

echo "=== Auto Monitor Started ==="
echo "Monitoring PID: $CURRENT_PID"
echo "Waiting for current batch (ppt_xiazai 451-634) to finish..."

# 1. Wait for the current process to finish
while ps -p $CURRENT_PID > /dev/null; do
    sleep 30
done

echo "Batch 4 finished! Starting Phase 2..."

# Function to run a batch and wait for it
run_batch() {
    CHANNEL=$1
    START=$2
    END=$3
    echo ">>> Starting Batch: $CHANNEL $START-$END"
    
    # Run start_crawl.sh in background but capture its PID from the output is tricky if we run it directly.
    # Instead, we can just run the command that start_crawl.sh runs, OR run start_crawl.sh and grep the PID?
    # Actually, start_crawl.sh uses nohup and returns immediately.
    # Let's modify start_crawl.sh slightly or just parse the output?
    # No, simpler: We can just execute the npm command directly here, synchronously!
    # That way we don't need to monitor PIDs, we just wait for the command to return.
    
    # However, start_crawl.sh handles log rotation which is nice.
    # Use absolute path to start_crawl.sh
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    "$SCRIPT_DIR/start_crawl.sh" $CHANNEL $START $END > /tmp/last_crawl_launch.log 2>&1
    
    # Extract PID from log: "Process started. PID: 12345"
    # Actually start_crawl.sh prints to stdout.
    
    # Let's try a different approach:
    # Since start_crawl.sh puts it in background, we can just find the new process.
    sleep 5
    NEW_PID=$(pgrep -f "src/crawlChannel.ts --channel=$CHANNEL --start=$START")
    
    if [ -z "$NEW_PID" ]; then
        echo "Error: Failed to start batch $CHANNEL $START-$END"
        exit 1
    fi
    
    echo "Batch running with PID: $NEW_PID. Waiting..."
    while ps -p $NEW_PID > /dev/null; do
        sleep 30
    done
    echo ">>> Batch $CHANNEL $START-$END Completed!"
    echo "----------------------------------------"
}

# --- Phase 2: PPT Moban ---
# run_batch ppt_moban 1 150
# run_batch ppt_moban 151 281

# --- Phase 3: Hangye & Jieri ---
# run_batch ppt_hangye 1 282
run_batch ppt_jieri 1 305

echo "=== ALL PHASES COMPLETED! ==="
