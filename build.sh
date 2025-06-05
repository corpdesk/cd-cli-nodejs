#!/bin/bash
set -euo pipefail

echo "🧹 Cleaning dist directory..."
rm -rf dist
echo "✅ dist directory removed."

echo "🛠️ Building TypeScript project..."
tsc --project tsconfig.json
echo "✅ TypeScript compilation complete."

echo "🔧 Running .js extension appender..."
node ./append-js-extension.mjs
echo "✅ All build steps completed successfully."
