#!/usr/bin/env bash
# Wrapper to run daily MyOperator report for 'yesterday'
set -euo pipefail
cd "$(dirname "$0")/.."
YESTERDAY=$(date -d 'yesterday' +%Y-%m-%d)
LOGDIR="$(pwd)/reports"
mkdir -p "$LOGDIR"
/usr/bin/node scripts/generate_myoperator_report.js --type=daily --from="$YESTERDAY" --to="$YESTERDAY" >> "$LOGDIR/cron.log" 2>&1
exit 0
