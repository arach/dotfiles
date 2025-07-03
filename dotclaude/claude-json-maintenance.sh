#!/bin/bash
# Claude.json maintenance script - backup and clean periodically
# Version: 2.0

# Strict mode for safety
set -euo pipefail
IFS=$'\n\t'

# Usage/help function
usage() {
  echo "Usage: $0 {check|clean|backup|status|restore <backupfile>|validate|help}"
  echo ""
  echo "  check     - Check size and clean if needed"
  echo "  clean     - Clean .claude.json to essential settings"
  echo "  backup    - Create a backup of .claude.json"
  echo "  status    - Show status report"
  echo "  restore   - Restore from a backup file"
  echo "  validate  - Validate all backups for JSON integrity"
  echo "  help      - Show this help message"
}

# Check for jq
if ! command -v jq >/dev/null; then
  echo -e "\033[0;31m❌ jq is required but not installed. Please install jq.\033[0m"
  exit 1
fi

CLAUDE_JSON="$HOME/.claude.json"
BACKUP_DIR="$HOME/.claude-backups"
MAX_SIZE_MB=5
KEEP_BACKUPS=10

# Color codes for better visibility
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# Function to log with color (for interactive use)
log_color() {
    local color=$1
    shift
    if [ -t 1 ]; then
        echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] $*${NC}"
    else
        log "$*"
    fi
}

# Function to get file size in MB
get_size_mb() {
    local size_bytes=$(stat -f%z "$1" 2>/dev/null || stat -c%s "$1" 2>/dev/null || echo 0)
    echo $(( size_bytes / 1024 / 1024 ))
}

# Function to get human readable size
get_size_human() {
    local size_bytes=$(stat -f%z "$1" 2>/dev/null || stat -c%s "$1" 2>/dev/null || echo 0)
    if [ $size_bytes -lt 1024 ]; then
        echo "${size_bytes}B"
    elif [ $size_bytes -lt 1048576 ]; then
        echo "$((size_bytes / 1024))KB"
    else
        echo "$((size_bytes / 1024 / 1024))MB"
    fi
}

# Function to validate JSON
validate_json() {
    if jq empty "$1" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to backup claude.json
backup_claude_json() {
    log_color $BLUE "Starting backup process"
    
    if [ ! -f "$CLAUDE_JSON" ]; then
        log_color $RED "❌ No .claude.json file found at $CLAUDE_JSON"
        return 1
    fi
    
    # Validate JSON before backup
    if ! validate_json "$CLAUDE_JSON"; then
        log_color $YELLOW "⚠️  Warning: Current .claude.json has invalid JSON structure"
    fi
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/claude_${timestamp}.json"
    local original_size=$(get_size_human "$CLAUDE_JSON")
    
    log_color $BLUE "🔄 Backing up .claude.json (${original_size}) to $backup_file"
    cp "$CLAUDE_JSON" "$backup_file"
    
    # Compress the backup
    gzip "$backup_file"
    local compressed_size=$(get_size_human "${backup_file}.gz")
    log_color $GREEN "✅ Backup created: ${backup_file}.gz (${compressed_size})"
    
    # Keep only the last N backups
    local removed_count=$(ls -t "$BACKUP_DIR"/claude_*.json.gz 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | wc -l)
    ls -t "$BACKUP_DIR"/claude_*.json.gz 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm -f
    
    if [ $removed_count -gt 0 ]; then
        log_color $BLUE "🧹 Removed $removed_count old backup(s) (keeping last $KEEP_BACKUPS)"
    fi
}

# Function to clean/reset claude.json
clean_claude_json() {
    log_color $BLUE "Starting clean process"
    
    if [ ! -f "$CLAUDE_JSON" ]; then
        log_color $RED "❌ No .claude.json file found"
        return 1
    fi
    
    local original_size_mb=$(get_size_mb "$CLAUDE_JSON")
    local original_size_human=$(get_size_human "$CLAUDE_JSON")
    
    log_color $BLUE "🧹 Cleaning .claude.json (current size: ${original_size_human})"
    
    # Extract essential settings using jq with error handling
    local essential_config=$(jq '{
        autoUpdates: .autoUpdates,
        editorMode: .editorMode,
        installMethod: .installMethod,
        oauthAccount: .oauthAccount,
        theme: .theme,
        hasCompletedOnboarding: true,
        hasAvailableSubscription: .hasAvailableSubscription,
        mcpServers: .mcpServers,
        settings: .settings
    } | with_entries(select(.value != null))' "$CLAUDE_JSON" 2>/dev/null)
    
    if [ -z "$essential_config" ] || [ "$essential_config" = "null" ]; then
        log_color $RED "❌ Failed to extract essential config"
        return 1
    fi
    
    # Backup before cleaning
    backup_claude_json
    
    # Write minimal config with validation
    local temp_file="${CLAUDE_JSON}.tmp"
    if echo "$essential_config" | jq '.' > "$temp_file"; then
        # Validate the new file
        if validate_json "$temp_file"; then
            mv "$temp_file" "$CLAUDE_JSON"
            local new_size_mb=$(get_size_mb "$CLAUDE_JSON")
            local new_size_human=$(get_size_human "$CLAUDE_JSON")
            local reduction_percent=$(( (original_size_mb - new_size_mb) * 100 / (original_size_mb + 1) ))
            
            log_color $GREEN "✅ Reset .claude.json to essential settings"
            log_color $GREEN "📉 Reduced from ${original_size_human} to ${new_size_human} (${reduction_percent}% reduction)"
        else
            rm -f "$temp_file"
            log_color $RED "❌ Failed to create valid JSON, keeping original file"
            return 1
        fi
    else
        rm -f "$temp_file"
        log_color $RED "❌ Failed to write new config, keeping original file"
        return 1
    fi
}

# Function to check size and clean if needed
check_and_clean() {
    log_color $BLUE "Starting automatic maintenance check"
    
    if [ ! -f "$CLAUDE_JSON" ]; then
        log_color $YELLOW "⚠️  No .claude.json file found, nothing to check"
        return 0
    fi
    
    local size_mb=$(get_size_mb "$CLAUDE_JSON")
    local size_human=$(get_size_human "$CLAUDE_JSON")
    
    log_color $BLUE "📊 Current .claude.json size: ${size_human}"
    
    if [ "$size_mb" -ge "$MAX_SIZE_MB" ]; then
        log_color $YELLOW "⚠️  File exceeds ${MAX_SIZE_MB}MB threshold"
        clean_claude_json
    else
        log_color $GREEN "✅ File size is within limits (< ${MAX_SIZE_MB}MB)"
        
        # Still create a backup if we haven't done one today
        local today_backups=$(ls "$BACKUP_DIR"/claude_$(date +%Y%m%d)*.json.gz 2>/dev/null | wc -l)
        if [ "$today_backups" -eq 0 ]; then
            log_color $BLUE "📅 Creating daily backup"
            backup_claude_json
        fi
    fi
}

# Function to show status
show_status() {
    echo "Claude.json Status Report"
    echo "========================="
    echo ""
    
    if [ -f "$CLAUDE_JSON" ]; then
        local size_human=$(get_size_human "$CLAUDE_JSON")
        local size_mb=$(get_size_mb "$CLAUDE_JSON")
        local last_modified=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$CLAUDE_JSON" 2>/dev/null || \
                             stat -c "%y" "$CLAUDE_JSON" 2>/dev/null | cut -d'.' -f1)
        
        echo "📄 File: $CLAUDE_JSON"
        echo "📊 Size: $size_human"
        echo "📅 Last modified: $last_modified"
        echo "🎯 Threshold: ${MAX_SIZE_MB}MB"
        echo ""
        
        # Check JSON validity
        if validate_json "$CLAUDE_JSON"; then
            echo "✅ JSON structure is valid"
            
            # Show key counts
            local message_count=$(jq '.messages | length // 0' "$CLAUDE_JSON" 2>/dev/null)
            local history_count=$(jq '.history | length // 0' "$CLAUDE_JSON" 2>/dev/null)
            local session_count=$(jq '.sessions | length // 0' "$CLAUDE_JSON" 2>/dev/null)
            local mcp_count=$(jq '.mcpServers | length // 0' "$CLAUDE_JSON" 2>/dev/null)
            
            echo ""
            echo "Content Summary:"
            [ "$message_count" -gt 0 ] && echo "  💬 Messages: $message_count"
            [ "$history_count" -gt 0 ] && echo "  📜 History entries: $history_count"
            [ "$session_count" -gt 0 ] && echo "  🖥️  Sessions: $session_count"
            [ "$mcp_count" -gt 0 ] && echo "  🔌 MCP servers configured: $mcp_count"
        else
            echo "❌ JSON structure is invalid"
        fi
    else
        echo "❌ No .claude.json file found at $CLAUDE_JSON"
    fi
    
    echo ""
    echo "Backup Information:"
    echo "==================="
    local backup_count=$(ls "$BACKUP_DIR"/claude_*.json.gz 2>/dev/null | wc -l)
    if [ "$backup_count" -gt 0 ]; then
        echo "📦 Total backups: $backup_count"
        echo "📁 Backup location: $BACKUP_DIR"
        echo ""
        echo "Recent backups:"
        ls -lht "$BACKUP_DIR"/claude_*.json.gz 2>/dev/null | head -5 | while read -r line; do
            echo "  $line"
        done
    else
        echo "❌ No backups found"
    fi
}

# Function to validate all backups
validate_backups() {
    local all_valid=1
    for f in "$BACKUP_DIR"/claude_*.json.gz; do
        [ -e "$f" ] || continue
        gunzip -c "$f" | jq empty 2>/dev/null
        if [ $? -eq 0 ]; then
            log_color $GREEN "✅ Valid JSON: $f"
        else
            log_color $RED "❌ Invalid JSON: $f"
            all_valid=0
        fi
    done
    if [ $all_valid -eq 1 ]; then
        log_color $GREEN "All backups are valid."
    else
        log_color $RED "Some backups are invalid."
    fi
}

# Function to restore from a backup
restore_backup() {
    local backup_file="$1"
    if [ ! -f "$backup_file" ]; then
        log_color $RED "❌ Backup file not found: $backup_file"
        return 1
    fi
    gunzip -c "$backup_file" > "$CLAUDE_JSON"
    log_color $GREEN "✅ Restored $CLAUDE_JSON from $backup_file"
}

# Main entrypoint
case "${1:-}" in
  check)
    check_and_clean
    ;;
  clean)
    clean_claude_json
    ;;
  backup)
    backup_claude_json
    ;;
  status)
    show_status
    ;;
  restore)
    if [ -z "${2:-}" ]; then
      usage; exit 1;
    fi
    restore_backup "$2"
    ;;
  validate|test)
    validate_backups
    ;;
  help|-h|--help|"")
    usage
    ;;
  *)
    echo -e "\033[0;31mUnknown command: $1\033[0m"
    usage
    exit 1
    ;;
esac

# Summary message for interactive use
if [ -t 1 ]; then
  echo -e "\033[1;32m\n✨ Maintenance operation complete.\033[0m"
fi
