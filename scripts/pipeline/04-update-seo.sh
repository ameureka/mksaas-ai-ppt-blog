#!/bin/bash
# scripts/pipeline/04-update-seo.sh

echo "🔍 Stage 4: Updating SEO Resources..."

LLMS_FILE="public/llms.txt"

if [ -f "$LLMS_FILE" ]; then
    # Simple sed replacement for macOS
    sed -i '' 's/MkSaaS/PPTHub/g' "$LLMS_FILE"
    sed -i '' 's/Indie Maker Fox/PPTHub Team/g' "$LLMS_FILE"
    echo "  ✅ Updated $LLMS_FILE"
else
    echo "  ⚠️ $LLMS_FILE not found."
fi

# Note: OG Image generation is complex and usually requires a node script with canvas or similar.
# For now, we assume the user will manually place the new OG image or we use a placeholder if available.
# If a new OG image exists in assets, copy it.
NEW_OG="深入细化调整/011-品牌营销设计suit/brand-assets/og-images/og-default.png"
if [ -f "$NEW_OG" ]; then
    cp "$NEW_OG" "public/og.png"
    echo "  ✅ Updated public/og.png"
fi

echo "✅ SEO update complete."
