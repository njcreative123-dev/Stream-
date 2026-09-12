#!/bin/bash
# Extract the browser JS payload (APP_JS String.raw template) from the worker source
set -e
SRC="${1:-src/workers/index.js}"
START=$(rg -n 'const APP_JS = String.raw`' "$SRC" | head -1 | cut -d: -f1)
CLOSE=$(awk -v s="$START" 'NR>=s && /^`;$/ {print NR; exit}' "$SRC")
{ sed -n "${START}p" "$SRC" | sed 's/^const APP_JS = String.raw`//'; sed -n "$((START+1)),$((CLOSE-1))p" "$SRC"; } > /tmp/browser.js
echo "browser payload: $((CLOSE-START-1)) lines (start $START close $CLOSE)"
