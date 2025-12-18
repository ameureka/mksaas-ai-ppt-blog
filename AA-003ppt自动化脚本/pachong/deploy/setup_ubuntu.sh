#!/bin/bash

# setup_ubuntu.sh - Environment Setup for Ubuntu
# Run as root (sudo) or user with sudo privileges

set -e

echo "=== 1. System Update ==="
sudo apt-get update
sudo apt-get install -y curl unzip git

echo "=== 2. Install Node.js (v20) ==="
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js is already installed: $(node -v)"
fi

echo "=== 3. Install pnpm ==="
if ! command -v pnpm &> /dev/null; then
    sudo npm install -g pnpm
else
    echo "pnpm is already installed: $(pnpm -v)"
fi

echo "=== 4. Project Dependencies ==="
# Navigate to project root (assuming script is in deploy/)
cd "$(dirname "$0")/.."

if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Are you in the right directory?"
    exit 1
fi

pnpm install

echo "=== 5. Playwright Browsers ==="
# Install system dependencies for Playwright
npx playwright install-deps
npx playwright install chromium

echo "=== Setup Complete! ==="
echo "You can now run 'npm run build' and then 'npm run crawl'."
