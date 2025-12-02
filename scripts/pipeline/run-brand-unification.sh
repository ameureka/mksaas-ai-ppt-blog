#!/bin/bash
# scripts/pipeline/run-brand-unification.sh

set -e

echo "🚀 Starting PPTHub Brand Unification Pipeline"
echo "============================================"

# 0. Backup
echo "📦 Stage 0: Creating Backup..."
BACKUP_DIR="backup_pre_brand_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r content "$BACKUP_DIR/"
cp -r public "$BACKUP_DIR/"
cp src/config/website.tsx "$BACKUP_DIR/"
cp package.json "$BACKUP_DIR/"
echo "  ✅ Backup created at $BACKUP_DIR"

# 1. Assets
bash scripts/pipeline/01-replace-assets.sh

# 2. Authors
# Use npx tsx to run typescript scripts
npx tsx scripts/pipeline/02-unify-authors.ts

# 3. Configs
npx tsx scripts/pipeline/03-update-configs.ts

# 4. SEO
bash scripts/pipeline/04-update-seo.sh

echo "============================================"
echo "🎉 Brand Unification Pipeline Completed Successfully!"
echo "👉 Please run 'pnpm dev' to verify the changes."
