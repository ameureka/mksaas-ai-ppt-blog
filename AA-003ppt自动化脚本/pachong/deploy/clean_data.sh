#!/bin/bash

# clean_data.sh - Reset database and downloads
# Use with caution!

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA_DIR="$PROJECT_ROOT/data"
DOWNLOADS_DIR="$PROJECT_ROOT/downloads"

echo "WARNING: This will delete ALL data in:"
echo "  - $DATA_DIR"
echo "  - $DOWNLOADS_DIR"
read -p "Are you sure? (y/N) " confirm

if [[ "$confirm" != "y" ]]; then
    echo "Aborted."
    exit 0
fi

echo "Cleaning data..."
rm -rf "$DATA_DIR"
rm -rf "$DOWNLOADS_DIR"

echo "Data cleared. Next crawl will start fresh."
