#!/bin/bash
# scripts/pipeline/01-replace-assets.sh

set -e

echo "🎨 Stage 1: Replacing Brand Assets..."

# Source Directories
ASSETS_DIR="深入细化调整/011-品牌营销设计suit/brand-assets"
LOGO_DIR="$ASSETS_DIR/logo"

# Target Directories
PUBLIC_DIR="public"
AVATAR_DIR="public/images/avatars"

# Ensure target directories exist
mkdir -p "$AVATAR_DIR"

# 1. Replace Logos
echo "  - Replacing Logos..."
# Backup original logos if not already backed up
if [ ! -f "$PUBLIC_DIR/logo.png.bak" ]; then
    mv "$PUBLIC_DIR/logo.png" "$PUBLIC_DIR/logo.png.bak" 2>/dev/null || true
    mv "$PUBLIC_DIR/logo-dark.png" "$PUBLIC_DIR/logo-dark.png.bak" 2>/dev/null || true
fi

# Copy new logos
# Assuming ppthub-logo-full.png is the main logo
cp "$LOGO_DIR/ppthub-logo-full.png" "$PUBLIC_DIR/logo.png"

# If dark mode logo exists, copy it, otherwise use the same one for now (or generate it later)
if [ -f "$LOGO_DIR/ppthub-logo-full-dark.png" ]; then
    cp "$LOGO_DIR/ppthub-logo-full-dark.png" "$PUBLIC_DIR/logo-dark.png"
else
    echo "    ⚠️ Dark mode logo not found, using light mode logo as placeholder."
    cp "$LOGO_DIR/ppthub-logo-full.png" "$PUBLIC_DIR/logo-dark.png"
fi

# 2. Replace Avatars
echo "  - Replacing Avatars..."
# We use the icon version for the official avatar
if [ -f "$LOGO_DIR/ppthub-logo-icon.png" ]; then
    cp "$LOGO_DIR/ppthub-logo-icon.png" "$AVATAR_DIR/ppthub-official.png"
    echo "    ✅ Created ppthub-official.png"
else
    echo "    ⚠️ Icon logo not found, skipping avatar creation."
fi

# 3. Replace Favicons
echo "  - Replacing Favicons..."
FAVICON_SOURCE="$ASSETS_DIR/favicon"
if [ -d "$FAVICON_SOURCE" ]; then
    cp -r "$FAVICON_SOURCE/"* "$PUBLIC_DIR/"
    echo "    ✅ Copied favicon assets to $PUBLIC_DIR"
else
    echo "    ⚠️ Favicon source directory not found: $FAVICON_SOURCE"
fi

echo "✅ Asset replacement complete."
