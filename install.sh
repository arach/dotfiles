#!/bin/bash
# Dotfiles Installation Script
# Run: ./install.sh [--all|--zsh|--claude|--iterm]

set -e

DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$HOME/.dotfiles-backup/$(date +%Y%m%d_%H%M%S)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[x]${NC} $1"; }

backup_file() {
    if [[ -e "$1" && ! -L "$1" ]]; then
        mkdir -p "$BACKUP_DIR"
        cp -r "$1" "$BACKUP_DIR/"
        warn "Backed up $1 to $BACKUP_DIR/"
    fi
}

link_file() {
    local src="$1"
    local dest="$2"

    if [[ -L "$dest" ]]; then
        rm "$dest"
    elif [[ -e "$dest" ]]; then
        backup_file "$dest"
        rm -rf "$dest"
    fi

    ln -s "$src" "$dest"
    log "Linked $dest -> $src"
}

install_zsh() {
    log "Installing ZSH configs..."

    # Oh My Zsh
    if [[ ! -d "$HOME/.oh-my-zsh" ]]; then
        log "Installing Oh My Zsh..."
        sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
    else
        log "Oh My Zsh already installed"
    fi

    # Powerlevel10k
    P10K_DIR="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k"
    if [[ ! -d "$P10K_DIR" ]]; then
        log "Installing Powerlevel10k..."
        git clone --depth=1 https://github.com/romkatv/powerlevel10k.git "$P10K_DIR"
    else
        log "Powerlevel10k already installed"
    fi

    # Link configs
    link_file "$DOTFILES_DIR/zsh/.zshrc" "$HOME/.zshrc"
    link_file "$DOTFILES_DIR/zsh/.p10k.zsh" "$HOME/.p10k.zsh"

    # Create empty .env.local if missing
    if [[ ! -f "$HOME/.env.local" ]]; then
        cat > "$HOME/.env.local" << 'EOF'
# Local environment variables - DO NOT COMMIT TO GIT
# Add your secrets here:
# export GITHUB_TOKEN="your_token"
# export OBSIDIAN_API_KEY="your_key"
EOF
        log "Created template ~/.env.local (add your secrets here)"
    fi

    log "ZSH installation complete!"
}

install_claude() {
    log "Installing Claude Code configs..."

    mkdir -p "$HOME/.claude"
    mkdir -p "$HOME/.claude/commands"
    mkdir -p "$HOME/.claude/skills"
    mkdir -p "$HOME/.claude/statusline"

    # CLAUDE.md
    link_file "$DOTFILES_DIR/claude/CLAUDE.md" "$HOME/.claude/CLAUDE.md"

    # Settings (merge if exists, otherwise link)
    if [[ -f "$HOME/.claude/settings.json" ]]; then
        warn "~/.claude/settings.json exists - manual merge may be needed"
        cp "$DOTFILES_DIR/claude/settings.json" "$HOME/.claude/settings.dotfiles.json"
        log "Saved dotfiles version as settings.dotfiles.json for reference"
    else
        link_file "$DOTFILES_DIR/claude/settings.json" "$HOME/.claude/settings.json"
    fi

    # Statusline
    link_file "$DOTFILES_DIR/claude/statusline/index.ts" "$HOME/.claude/statusline/index.ts"

    # Commands
    for cmd in "$DOTFILES_DIR/claude/commands"/*.md; do
        if [[ -f "$cmd" ]]; then
            link_file "$cmd" "$HOME/.claude/commands/$(basename "$cmd")"
        fi
    done

    # Skills
    for skill_dir in "$DOTFILES_DIR/claude/skills"/*/; do
        if [[ -d "$skill_dir" ]]; then
            skill_name="$(basename "$skill_dir")"
            mkdir -p "$HOME/.claude/skills/$skill_name"
            if [[ -f "$skill_dir/SKILL.md" ]]; then
                link_file "$skill_dir/SKILL.md" "$HOME/.claude/skills/$skill_name/SKILL.md"
            fi
        fi
    done

    log "Claude Code installation complete!"
}

install_iterm() {
    log "Installing iTerm2 config..."

    if [[ ! -d "/Applications/iTerm.app" ]]; then
        warn "iTerm2 not found - skipping"
        return
    fi

    # Close iTerm2 if running
    if pgrep -x "iTerm2" > /dev/null; then
        warn "iTerm2 is running. Please close it first."
        read -p "Press Enter after closing iTerm2..."
    fi

    ITERM_PLIST="$HOME/Library/Preferences/com.googlecode.iterm2.plist"
    backup_file "$ITERM_PLIST"

    # Import settings
    cp "$DOTFILES_DIR/iterm2/com.googlecode.iterm2.plist" "$ITERM_PLIST"
    plutil -convert binary1 "$ITERM_PLIST"

    log "iTerm2 config imported!"
    warn "Note: You'll need to add your OpenAI API key in iTerm2 Settings > AI"
}

show_help() {
    echo "Dotfiles Installation Script"
    echo ""
    echo "Usage: ./install.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --all      Install everything"
    echo "  --zsh      Install ZSH + Oh My Zsh + Powerlevel10k"
    echo "  --claude   Install Claude Code configs"
    echo "  --iterm    Import iTerm2 settings"
    echo "  --help     Show this help"
    echo ""
    echo "Without options, interactive mode is used."
}

interactive_install() {
    echo "=== Dotfiles Installer ==="
    echo ""
    echo "What would you like to install?"
    echo "  1) Everything"
    echo "  2) ZSH configs (Oh My Zsh + Powerlevel10k)"
    echo "  3) Claude Code configs"
    echo "  4) iTerm2 settings"
    echo "  5) Exit"
    echo ""
    read -p "Choice [1-5]: " choice

    case $choice in
        1) install_zsh; install_claude; install_iterm ;;
        2) install_zsh ;;
        3) install_claude ;;
        4) install_iterm ;;
        5) exit 0 ;;
        *) error "Invalid choice"; exit 1 ;;
    esac
}

# Main
case "${1:-}" in
    --all)    install_zsh; install_claude; install_iterm ;;
    --zsh)    install_zsh ;;
    --claude) install_claude ;;
    --iterm)  install_iterm ;;
    --help)   show_help ;;
    "")       interactive_install ;;
    *)        error "Unknown option: $1"; show_help; exit 1 ;;
esac

echo ""
log "Done! Restart your terminal or run: source ~/.zshrc"
