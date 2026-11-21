#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="${1:-my-planfo-site}"
REF="${2:-main}"

echo ""
echo "⚡ Installing a fresh Planfo CMS project into ./${PROJECT_NAME}..."
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js (v20+) is required. Please install it from https://nodejs.org/"
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "❌ Git is required. Please install Git first."
  exit 1
fi

TMP_SCRIPT="$(mktemp)"
trap 'rm -f "$TMP_SCRIPT"' EXIT

curl -fsSL "https://raw.githubusercontent.com/pixoptimo/planfo/${REF}/scripts/install.mjs" -o "$TMP_SCRIPT"
node "$TMP_SCRIPT" "$PROJECT_NAME" --branch "$REF"
