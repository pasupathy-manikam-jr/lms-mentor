#!/usr/bin/env bash
#
# Staging deploy (run ON the server): https://ui.staging.oriclabdev.com/lms-mentor
#
#   Usage:  cd ~/lms-mentor && bash scripts/deploy.sh
#
# Pulls the checked-out branch, installs dependencies, migrates, rebuilds the
# frontend for the /lms-mentor subfolder and refreshes Laravel's caches.
#
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# The app is served from a subfolder; building without this breaks every link and image.
PREFIX="${APP_PATH_PREFIX:-lms-mentor}"

echo "==> Pulling $(git branch --show-current)"
# --ff-only: stops instead of merging if someone hand-edited tracked files on the server.
git pull --ff-only

echo "==> Installing PHP dependencies"
composer install --no-interaction --no-progress --optimize-autoloader

echo "==> Migrating"
php artisan migrate --force

echo "==> Building frontend for /$PREFIX"
npm ci --no-audit --no-fund
APP_PATH_PREFIX="$PREFIX" npm run build

echo "==> Refreshing caches"
php artisan optimize:clear
php artisan config:cache
php artisan view:cache
php artisan event:cache

echo "==> Deployed $(git log --oneline -1)"
