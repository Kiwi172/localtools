#!/usr/bin/env bash
# Sets the Monero address and source URL used across every page.
# Usage: ./set-donation.sh <monero-address> [github-repo-url]
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: $0 <monero-address> [github-repo-url]" >&2
  exit 1
fi

ADDR="$1"
REPO="${2:-}"
FILE="shared/site.js"

if [ ! -f "$FILE" ]; then
  echo "run this from the repository root" >&2
  exit 1
fi

# Monero addresses are 95 characters (standard/subaddress) or 106 (integrated).
LEN=${#ADDR}
if [ "$LEN" -ne 95 ] && [ "$LEN" -ne 106 ]; then
  echo "warning: '$ADDR' is $LEN characters; Monero addresses are usually 95 or 106" >&2
fi

python3 - "$ADDR" "$REPO" <<'PY'
import re, sys
addr, repo = sys.argv[1], sys.argv[2]
p = "shared/site.js"
s = open(p, encoding="utf-8").read()
s = re.sub(r'var MONERO_ADDRESS = "[^"]*";', 'var MONERO_ADDRESS = "%s";' % addr, s, count=1)
if repo:
    s = re.sub(r'var SOURCE_URL     = "[^"]*";', 'var SOURCE_URL     = "%s";' % repo, s, count=1)
open(p, "w", encoding="utf-8").write(s)
print("updated", p)
PY

echo "Done. Every page now shows the donation link."
echo "Tip: use a dedicated subaddress, not your primary address."
