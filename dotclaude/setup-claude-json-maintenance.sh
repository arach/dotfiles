#!/bin/bash
# Setup script for Claude JSON maintenance

set -e

# Colors
GREEN="\033[1;32m"
RED="\033[1;31m"
CYAN="\033[1;96m"
NC="\033[0m"

info()    { echo -e "${CYAN}ℹ️  $*${NC}"; }
success() { echo -e "${GREEN}✅ $*${NC}"; }
error()   { echo -e "${RED}❌ $*${NC}"; }

echo -e "${CYAN}=============================="
echo -e " Claude JSON Maintenance Setup "
echo -e "==============================${NC}"

# Check for source script
SCRIPT_DIR="$(dirname "$0")"
SRC="$SCRIPT_DIR/claude-json-maintenance.sh"
DEST="$HOME/bin/claude-json-maintenance.sh"

if [ ! -f "$SRC" ]; then
  error "Source script not found: $SRC"
  exit 1
fi

# Ensure directories
mkdir -p "$HOME/bin" "$HOME/.claude-backups"

# Copy and set permissions
cp "$SRC" "$DEST"
chmod +x "$DEST"
success "Installed maintenance script to ~/bin"

# Setup cron job
CRON_LOG="$HOME/.claude-backups/maintenance.log"
CRON_JOB="0 3 * * * $DEST check >> $CRON_LOG 2>&1"

if ! command -v crontab >/dev/null; then
  error "crontab not found. Please install cron."
  exit 1
fi

if crontab -l 2>/dev/null | grep -q "claude-json-maintenance"; then
  info "Cron job already exists"
else
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  success "Added cron job (daily 3 AM)"
fi

# Test run
info "Running initial check..."
"$DEST" check

success "Claude JSON maintenance is active!"
echo "  Auto-cleanup: Daily at 3 AM if > 5MB"
echo "  Manual clean: claude-json-maintenance clean"
echo "  Logs: $CRON_LOG"
