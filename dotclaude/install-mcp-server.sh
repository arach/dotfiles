#!/bin/bash


export PATH="/Users/arach/.claude/local:$PATH"

# Sound cues (macOS system sounds)
START_SOUND="/System/Library/Sounds/Glass.aiff"  # longer chime to signal start
STEP_SOUND="/System/Library/Sounds/Morse.aiff"    # short pop after each install
# Define success and error sounds
SUCCESS_SOUND="$STEP_SOUND"                     # success chime (short)
ERROR_SOUND="/System/Library/Sounds/Basso.aiff"  # error alert
END_SOUND="$START_SOUND"                         # wrap-up sound, same as start

# Color codes and helper functions
GREEN="\033[1;32m"
CYAN="\033[1;96m"   # bright cyan for user-facing messages
GRAY="\033[0;90m"
RED="\033[1;31m"
NC="\033[0m"

info()   { echo -e "${CYAN}⏳ $*${NC}"; }
cmd()    { echo -e "${GRAY}$*${NC}"; }
success(){ echo -e "${GREEN}✅ $*${NC}"; }
error_msg(){ echo -e "${RED}❌ $*${NC}"; }

# Intro banner (high-visibility)
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}   Claude MCP Server Installation 🚀${NC}"
echo -e "${CYAN}============================================${NC}"

# Play the start sound
afplay "$START_SOUND"

# Sequential Thinking
info "Installing Sequential Thinking ..."
cmd "claude mcp add sequential-thinking -s user -- npx -y u/modelcontextprotocol/server-sequential-thinking"
claude mcp add sequential-thinking -s user -- npx -y u/modelcontextprotocol/server-sequential-thinking \
  && { afplay "$SUCCESS_SOUND"; success "Sequential Thinking installed"; } \
  || { afplay "$ERROR_SOUND"; error_msg "Sequential Thinking failed"; exit 1; }

# Filesystem
info "Installing Filesystem ..."
cmd "claude mcp add filesystem -s user -- npx -y u/modelcontextprotocol/server-filesystem ~/Documents ~/Desktop ~/Downloads ~/Projects"
claude mcp add filesystem -s user -- npx -y u/modelcontextprotocol/server-filesystem ~/Documents ~/Desktop ~/Downloads ~/Projects \
  && { afplay "$SUCCESS_SOUND"; success "Filesystem installed"; } \
  || { afplay "$ERROR_SOUND"; error_msg "Filesystem failed"; exit 1; }

# Puppeteer
info "Installing Puppeteer ..."
cmd "claude mcp add puppeteer -s user -- npx -y u/modelcontextprotocol/server-puppeteer"
claude mcp add puppeteer -s user -- npx -y u/modelcontextprotocol/server-puppeteer \
  && { afplay "$SUCCESS_SOUND"; success "Puppeteer installed"; } \
  || { afplay "$ERROR_SOUND"; error_msg "Puppeteer failed"; exit 1; }

# Web Fetching
info "Installing Web Fetching ..."
cmd "claude mcp add fetch -s user -- npx -y u/kazuph/mcp-fetch"
claude mcp add fetch -s user -- npx -y u/kazuph/mcp-fetch \
  && { afplay "$SUCCESS_SOUND"; success "Web Fetching installed"; } \
  || { afplay "$ERROR_SOUND"; error_msg "Web Fetching failed"; exit 1; }

# Browser Tools
info "Installing Browser Tools ..."
cmd "claude mcp add browser-tools -s user -- npx -y u/agentdeskai/browser-tools-mcp@1.2.1"
claude mcp add browser-tools -s user -- npx -y u/agentdeskai/browser-tools-mcp@1.2.1 \
  && { afplay "$SUCCESS_SOUND"; success "Browser Tools installed"; } \
  || { afplay "$ERROR_SOUND"; error_msg "Browser Tools failed"; exit 1; }

# Check whats been installed
info "Listing installed MCP servers ..."
cmd "claude mcp list"
claude mcp list \
  && { afplay "$END_SOUND"; success "All MCP servers installed successfully! 🎉"; } \
  || { afplay "$ERROR_SOUND"; error_msg "Installation finished with errors."; exit 1; }
