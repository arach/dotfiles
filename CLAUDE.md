# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this dotfiles repository.

## Repository Overview

This is a personal dotfiles repository containing system configuration files, terminal settings, shell configurations, and tools for maintaining a consistent development environment across macOS machines.

## Key Components

### 1. Shell Configuration
- **`.zshrc`** - Zsh configuration with Oh My Zsh and Powerlevel10k
- **`.bashrc`** - Bash configuration (fallback)
- **`.vimrc`** - Vim editor configuration

### 2. Terminal & Editor
- **`iterm2/`** - iTerm2 profiles and configurations
  - `Arach.json` - Main iTerm2 profile
  - `Arach-solarized.json` - Solarized theme variant
- **`iterm2colors/`** - Color schemes for iTerm2
- **`karabiner.json`** - Keyboard customization configuration

### 3. Claude Development Assistant (`dotclaude/`)
- **`CLAUDE_TEMPLATE.md`** - Template for project-specific Claude instructions
- **`setup-project.sh`** - Quick setup script for new projects
- **`claude-json-maintenance.sh`** - Maintenance script for `.claude.json` file
- **`install-mcp-server.sh`** - MCP server installation automation
- **`settings.json`** - Claude Code configuration
- **`preferences.md`** - Personal preferences for Claude's behavior

## Development Guidelines

### Working with Dotfiles

1. **Testing Changes**
   - Always backup existing configs before testing changes
   - Test in a controlled environment first
   - Document any dependencies or requirements

2. **Symlink Management**
   ```bash
   # Create symlinks (example)
   ln -s ~/dotfiles/.zshrc ~/.zshrc
   ln -s ~/dotfiles/.vimrc ~/.vimrc
   ```

3. **Version Control**
   - Keep sensitive information out of version control
   - Use `.gitignore` for local-only configurations
   - Document any manual setup steps required

### Shell Configuration Best Practices

1. **Zsh Configuration**
   - Keep custom functions organized and commented
   - Document any custom aliases or functions
   - Ensure compatibility with Oh My Zsh plugins

2. **Path Management**
   - Use conditional logic for platform-specific paths
   - Keep PATH additions organized and documented
   - Avoid duplicate PATH entries

3. **Environment Variables**
   - Document what each custom environment variable does
   - Use descriptive names for custom variables
   - Keep secrets in separate, untracked files

### Script Development

When modifying or creating scripts in this repository:

1. **Shell Scripts**
   - Use strict mode: `set -euo pipefail`
   - Add proper error handling and logging
   - Include usage/help functions
   - Make scripts idempotent when possible

2. **Installation Scripts**
   - Check for dependencies before running
   - Provide clear progress indicators
   - Handle errors gracefully
   - Allow for dry-run modes when appropriate

3. **Maintenance Scripts**
   - Include status/check commands
   - Provide backup functionality
   - Log operations for debugging
   - Use color codes for better visibility

### Claude-Specific Tools

1. **Project Setup (`setup-project.sh`)**
   - Creates `CLAUDE.md` in target projects
   - Sets up gitmoji commit conventions
   - Configures project-specific guidelines

2. **JSON Maintenance (`claude-json-maintenance.sh`)**
   - Monitors `.claude.json` file size
   - Creates automatic backups
   - Cleans up when file exceeds 5MB
   - Validates JSON structure

3. **MCP Server Installation**
   - Automates installation of common MCP servers
   - Provides audio feedback for installation progress
   - Includes error handling and rollback

## Common Tasks

### Adding New Dotfiles
1. Add the file to this repository
2. Update the installation script or README
3. Document any special setup requirements
4. Test the symlink creation process

### Updating Shell Configuration
1. Make changes in the repository version
2. Test changes in a new shell session
3. Document any new functions or aliases
4. Commit with appropriate gitmoji

### Managing iTerm2 Profiles
1. Export profile from iTerm2 preferences
2. Place in `iterm2/` directory
3. Remove any sensitive information
4. Document any required fonts or plugins

### Setting Up New Machine
1. Clone this repository
2. Run installation scripts as needed
3. Create necessary symlinks
4. Install required dependencies
5. Configure machine-specific settings

## File Organization

```
dotfiles/
├── README.md                    # Main documentation
├── CLAUDE.md                    # This file
├── .zshrc                       # Zsh configuration
├── .bashrc                      # Bash configuration  
├── .vimrc                       # Vim configuration
├── karabiner.json              # Keyboard customization
├── homescreen.jpg              # Desktop preview
├── monochrome.png              # Theme preview
├── iterm2/                     # iTerm2 configurations
│   ├── Arach.json
│   └── Arach-solarized.json
├── iterm2colors/               # Color schemes
│   └── solarized.itermcolors
└── dotclaude/                  # Claude-specific tools
    ├── CLAUDE_TEMPLATE.md
    ├── setup-project.sh
    ├── claude-json-maintenance.sh
    ├── install-mcp-server.sh
    └── ...
```

## Testing & Validation

Before committing changes:

1. **Shell Scripts**
   - Run through shellcheck
   - Test on fresh environment
   - Verify idempotency

2. **Configuration Files**
   - Validate JSON/YAML syntax
   - Test in target application
   - Check for compatibility

3. **Documentation**
   - Update README if needed
   - Keep examples current
   - Document breaking changes

## Security Considerations

1. **Never commit**:
   - API keys or tokens
   - SSH private keys
   - Passwords or credentials
   - Personal information

2. **Use placeholders**:
   - `YOUR_API_KEY_HERE`
   - `<username>`
   - Environment variable references

3. **Document requirements**:
   - What secrets are needed
   - Where to obtain them
   - How to configure them safely

## Maintenance

Regular maintenance tasks:

1. **Update dependencies**
   - Check for Oh My Zsh updates
   - Update Powerlevel10k
   - Review plugin compatibility

2. **Clean up**
   - Remove unused configurations
   - Archive old versions
   - Update documentation

3. **Test compatibility**
   - Verify on latest macOS
   - Check shell compatibility
   - Test installation process

## Contributing Guidelines

When making changes:

1. **Follow existing patterns**
2. **Document your changes**
3. **Test thoroughly**
4. **Use descriptive commits with gitmoji**
5. **Update relevant documentation**

Remember: These are personal dotfiles that should work reliably across all your machines. Stability and compatibility are more important than cutting-edge features.