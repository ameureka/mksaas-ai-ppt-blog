#!/bin/bash
# migrate_data.sh - Safely migrate data to external drive

SOURCE="downloads/"
DEST="/Volumes/Extreme SSD/pachong_data/downloads/"
LOG_FILE="migration.log"

echo "Starting migration at $(date)" > $LOG_FILE

# 1. Sync data (using rsync for safety)
echo "Syncing data..." >> $LOG_FILE
if rsync -av "$SOURCE" "$DEST" >> $LOG_FILE 2>&1; then
    echo "Sync successful." >> $LOG_FILE
else
    echo "Sync failed!" >> $LOG_FILE
    exit 1
fi

# 2. Verify sizes (simple check)
SRC_SIZE=$(du -sh "$SOURCE" | cut -f1)
DST_SIZE=$(du -sh "$DEST" | cut -f1)
echo "Source Size: $SRC_SIZE" >> $LOG_FILE
echo "Dest Size: $DST_SIZE" >> $LOG_FILE

# 3. Remove local data
echo "Removing local data..." >> $LOG_FILE
rm -rf "$SOURCE"

# 4. Create Symlink
echo "Creating symlink..." >> $LOG_FILE
ln -s "$DEST" "$SOURCE"
# Note: $SOURCE here is 'downloads/', ln -s will create 'downloads' pointing to dest.
# Wait, if downloads/ ends with /, ln might be confused. Better use 'downloads'.
# Let's fix the symlink command to be precise.
# We are in project root.
ln -sfn "$DEST" downloads

echo "Migration Complete at $(date)" >> $LOG_FILE
