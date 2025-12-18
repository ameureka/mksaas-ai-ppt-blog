#!/bin/bash

# clean_html.sh - Remove .html files from downloads directory
# Usage: ./clean_html.sh

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOWNLOADS_DIR="$PROJECT_ROOT/downloads"

if [ ! -d "$DOWNLOADS_DIR" ]; then
    echo "Downloads directory not found: $DOWNLOADS_DIR"
    exit 0
fi

echo "Cleaning .html files in $DOWNLOADS_DIR..."
find "$DOWNLOADS_DIR" -type f -name "*.html" -print -delete

echo "Cleanup complete."
