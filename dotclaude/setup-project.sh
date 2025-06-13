#!/bin/bash

# Script to set up Claude guidelines in a new project

echo "Setting up Claude guidelines for this project..."

# Create CLAUDE.md if it doesn't exist
if [ ! -f "CLAUDE.md" ]; then
    cp ~/.claude/CLAUDE_TEMPLATE.md CLAUDE.md
    echo "✅ Created CLAUDE.md from template"
else
    echo "⚠️  CLAUDE.md already exists, skipping..."
fi

# Create .gitmessage template for this project
cat > .gitmessage << 'EOF'
# Gitmoji Commit Message Template
# 
# <emoji> <description>
# 
# Common emojis:
# ✨ New feature
# 🐛 Bug fix  
# 📝 Documentation
# 💄 UI/style updates
# ♻️ Refactoring
# 🎨 Code structure
# ⚡️ Performance
# 🔧 Configuration
# 
# Example: ✨ Add user authentication system

EOF

# Configure git to use the template for this project
git config commit.template .gitmessage

echo "✅ Set up git commit template"
echo "🎉 Project configured for Claude and gitmoji!"