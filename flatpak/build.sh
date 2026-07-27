#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

BUNDLE="${1:-../dist/bundle/Riff-Diff.flatpak}"

mkdir -p "$(dirname "$BUNDLE")"

flatpak-builder --force-clean --install-deps-from=flathub build-dir com.andiman5000.riffdiff.yml
flatpak build-export export-dir build-dir
flatpak build-bundle export-dir "$BUNDLE" com.andiman5000.riffdiff
echo "Done: $BUNDLE"
