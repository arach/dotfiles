# Dotfiles

Personal configuration files and setup CLI for macOS.

## Quick Start

```bash
git clone git@github.com:arach/dotfiles.git ~/dotfiles
cd ~/dotfiles/cli
bun install
bun run src/index.ts install
```

## CLI

```bash
# Check what's installed
bun run src/index.ts status

# Install everything
bun run src/index.ts install

# Install specific components
bun run src/index.ts install zsh
bun run src/index.ts install claude
```

### Global Install (optional)

```bash
cd ~/dotfiles/cli
bun link
dotfiles status   # now available globally
```

## What's Included

### ZSH (`zsh/`)
- `.zshrc` - Shell config with aliases for git, docker, npm, etc.
- `.p10k.zsh` - Powerlevel10k theme (nerdfont, classic style)

The installer will set up:
- Oh My Zsh
- Powerlevel10k theme
- Symlinks to these configs

### Claude Code (`claude/`)
- `CLAUDE.md` - Personal preferences (gitmoji, pnpm, no co-authoring)
- `statusline/` - Custom statusline showing model, context %, git branch
- `commands/` - Slash commands: `/commit`, `/ship`, `/push`, etc.

The installer will configure:
- Statusline in settings.json
- Always thinking mode
- Swift LSP plugin

### iTerm2 (`iterm2/`)
- Custom color schemes and profiles
- AI assistant configuration

### Other Configs
- **Vim** - `.vimrc`
- **Karabiner** - `karabiner/`
- **dotclaude** - Templates for new projects (`dotclaude/setup-project.sh`)

## Status Check

```
$ dotfiles status

Dotfiles Status

  ✓ Bun                     (1.2.19)
  ✓ Oh My Zsh
  ✓ Powerlevel10k
  ✓ .zshrc                  (symlinked)
  ✓ Claude CLI
  ✓ Claude statusline
  ✓ Statusline configured
  ✓ Hooked CLI
  ✓ Always thinking
  ✓ Swift LSP plugin

All configured!
```

## Dependencies

- **Bun** - `brew install bun`
- **Nerd Font** - Required for Powerlevel10k icons
  ```bash
  brew tap homebrew/cask-fonts
  brew install font-meslo-lg-nerd-font
  ```
- [Oh My Zsh](https://ohmyz.sh/) - Installed automatically by CLI
- [Powerlevel10k](https://github.com/romkatv/powerlevel10k) - Installed automatically by CLI
- [iTerm2](https://iterm2.com/)

## Secrets

The `.zshrc` sources `~/.env.local` for API keys and tokens. This file is never committed.

Create it manually:
```bash
# ~/.env.local
export GITHUB_TOKEN="your_token"
export OBSIDIAN_API_KEY="your_key"
```

## License

MIT
