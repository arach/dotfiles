# Dotfiles & Machine Setup

Full machine bootstrap for macOS - start from nothing, end fully configured.

## Quick Start (New Machine)

```bash
# 1. Install Xcode CLI tools
xcode-select --install

# 2. Clone dotfiles
git clone git@github.com:arach/dotfiles.git ~/dotfiles

# 3. Run the CLI
cd ~/dotfiles/cli && bun install
bun run src/index.ts              # See what's missing
bun run src/index.ts prompt       # Get Claude to set it up
```

## What's Included

```
dotfiles/
├── cli/                 # TypeScript installer CLI
├── brew/
│   └── Brewfile        # All brew packages, casks, VS Code extensions
├── macos/
│   └── defaults.sh     # System preferences (keyboard, Dock, Finder)
├── zsh/
│   ├── .zshrc          # Shell config + aliases
│   └── .p10k.zsh       # Powerlevel10k theme
├── claude/
│   ├── CLAUDE.md       # Personal preferences
│   ├── statusline/     # Custom statusline
│   └── commands/       # Slash commands
├── editors/
│   └── cursor/         # Cursor settings + keybindings
├── iterm2/             # iTerm2 config + colors
├── karabiner/          # Keyboard remapping
└── dotclaude/          # Claude project templates
```

## CLI Commands

```bash
dotfiles                 # Show inventory (what's installed vs missing)
dotfiles install         # Install shell configs + Claude
dotfiles install zsh     # Just ZSH stuff
dotfiles install claude  # Just Claude stuff
dotfiles prompt          # Generate prompt for Claude to do setup
```

## Manual Steps

### Brew Packages
```bash
brew bundle install --file=~/dotfiles/brew/Brewfile
```

### macOS Defaults
```bash
~/dotfiles/macos/defaults.sh
```

### Cursor Settings
```bash
cp ~/dotfiles/editors/cursor/*.json ~/Library/Application\ Support/Cursor/User/
```

## Secrets

Never committed. Create manually:

```bash
# ~/.env.local
export GITHUB_TOKEN="your_token"
export OBSIDIAN_API_KEY="your_key"
```

## License

MIT
