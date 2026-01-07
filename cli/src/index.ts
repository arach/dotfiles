#!/usr/bin/env bun
/**
 * Dotfiles CLI - Personal setup and configuration tool
 * Usage: dotfiles [command]
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, symlinkSync, unlinkSync, statSync } from 'fs';
import { execSync, spawnSync } from 'child_process';
import { homedir } from 'os';
import { dirname, join, resolve } from 'path';

const HOME = homedir();
const DOTFILES_DIR = resolve(dirname(dirname(import.meta.path)));

// Colors
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg: string) => console.log(`${c.blue}info${c.reset}  ${msg}`),
  ok: (msg: string) => console.log(`${c.green}ok${c.reset}    ${msg}`),
  warn: (msg: string) => console.log(`${c.yellow}warn${c.reset}  ${msg}`),
  error: (msg: string) => console.log(`${c.red}error${c.reset} ${msg}`),
  step: (msg: string) => console.log(`${c.cyan}=>${c.reset}    ${msg}`),
};

// ============================================================================
// Utilities
// ============================================================================

function commandExists(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function isSymlink(path: string): boolean {
  try {
    return statSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

function readJson(path: string): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return {};
  }
}

function writeJson(path: string, data: Record<string, unknown>) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(
        (result[key] as Record<string, unknown>) || {},
        source[key] as Record<string, unknown>
      );
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function prompt(question: string): boolean {
  process.stdout.write(`${question} [y/N] `);
  const buf = Buffer.alloc(1);
  const fd = require('fs').openSync('/dev/tty', 'r');
  require('fs').readSync(fd, buf, 0, 1, null);
  require('fs').closeSync(fd);
  // Read rest of line
  try {
    const lineBuf = Buffer.alloc(100);
    const fd2 = require('fs').openSync('/dev/tty', 'r');
    require('fs').readSync(fd2, lineBuf, 0, 100, null);
    require('fs').closeSync(fd2);
  } catch {}
  console.log();
  return buf.toString().toLowerCase() === 'y';
}

function safeLink(src: string, dest: string, description: string): boolean {
  if (existsSync(dest)) {
    try {
      const linkTarget = readFileSync(dest, 'utf-8').slice(0, 100);
      const srcContent = readFileSync(src, 'utf-8').slice(0, 100);
      if (linkTarget === srcContent || statSync(dest).isSymbolicLink()) {
        log.ok(`${description} already linked`);
        return true;
      }
    } catch {}

    log.warn(`${description} exists at ${dest}`);
    if (!prompt(`  Backup and replace?`)) {
      log.info('Skipped');
      return false;
    }

    const backup = `${dest}.backup.${Date.now()}`;
    execSync(`mv "${dest}" "${backup}"`);
    log.info(`Backed up to ${backup}`);
  }

  mkdirSync(dirname(dest), { recursive: true });
  symlinkSync(src, dest);
  log.ok(`Linked ${description}`);
  return true;
}

// ============================================================================
// Status Check
// ============================================================================

interface CheckResult {
  name: string;
  installed: boolean;
  details?: string;
  category: 'prerequisites' | 'shell' | 'claude' | 'extras';
  installHint?: string;
}

function getVersion(cmd: string): string | undefined {
  try {
    return execSync(`${cmd} --version 2>/dev/null`, { encoding: 'utf-8' }).trim().split('\n')[0];
  } catch {
    return undefined;
  }
}

function checkInventory(): CheckResult[] {
  const checks: CheckResult[] = [];
  const claudeSettings = readJson(join(HOME, '.claude/settings.json'));

  // ========== Prerequisites ==========
  checks.push({
    name: 'Homebrew',
    category: 'prerequisites',
    installed: commandExists('brew'),
    details: commandExists('brew') ? 'installed' : undefined,
    installHint: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
  });

  checks.push({
    name: 'Git',
    category: 'prerequisites',
    installed: commandExists('git'),
    details: getVersion('git')?.replace('git version ', ''),
  });

  checks.push({
    name: 'Bun',
    category: 'prerequisites',
    installed: commandExists('bun'),
    details: getVersion('bun'),
    installHint: 'brew install bun',
  });

  checks.push({
    name: 'Nerd Font',
    category: 'prerequisites',
    installed: existsSync('/Library/Fonts/MesloLGSNerdFont-Regular.ttf') ||
               existsSync(join(HOME, 'Library/Fonts/MesloLGSNerdFont-Regular.ttf')) ||
               existsSync(join(HOME, 'Library/Fonts/MesloLGS NF Regular.ttf')),
    details: 'for Powerlevel10k icons',
    installHint: 'brew install font-meslo-lg-nerd-font',
  });

  // ========== Shell ==========
  checks.push({
    name: 'Oh My Zsh',
    category: 'shell',
    installed: existsSync(join(HOME, '.oh-my-zsh')),
    installHint: 'dotfiles install zsh',
  });

  const p10kPath = join(HOME, '.oh-my-zsh/custom/themes/powerlevel10k');
  checks.push({
    name: 'Powerlevel10k',
    category: 'shell',
    installed: existsSync(p10kPath),
    installHint: 'dotfiles install zsh',
  });

  const zshrcPath = join(HOME, '.zshrc');
  const zshrcExists = existsSync(zshrcPath);
  const zshrcIsSymlink = zshrcExists && isSymlink(zshrcPath);
  const zshrcHasP10k = zshrcExists && !zshrcIsSymlink &&
    readFileSync(zshrcPath, 'utf-8').includes('powerlevel10k');
  checks.push({
    name: '.zshrc',
    category: 'shell',
    installed: zshrcIsSymlink || zshrcHasP10k,
    details: zshrcIsSymlink ? 'symlinked' : zshrcHasP10k ? 'configured' : zshrcExists ? 'exists (not linked)' : undefined,
    installHint: 'dotfiles install zsh',
  });

  const p10kZshPath = join(HOME, '.p10k.zsh');
  checks.push({
    name: '.p10k.zsh',
    category: 'shell',
    installed: existsSync(p10kZshPath),
    details: isSymlink(p10kZshPath) ? 'symlinked' : existsSync(p10kZshPath) ? 'configured' : undefined,
    installHint: 'dotfiles install zsh',
  });

  const envLocalPath = join(HOME, '.env.local');
  checks.push({
    name: '.env.local',
    category: 'shell',
    installed: existsSync(envLocalPath),
    details: 'secrets file',
    installHint: 'Create manually with GITHUB_TOKEN, OBSIDIAN_API_KEY',
  });

  // ========== Claude ==========
  checks.push({
    name: 'Claude CLI',
    category: 'claude',
    installed: existsSync(join(HOME, '.claude/local/claude')) || commandExists('claude'),
    installHint: 'npm install -g @anthropic-ai/claude-code',
  });

  checks.push({
    name: 'CLAUDE.md',
    category: 'claude',
    installed: existsSync(join(HOME, '.claude/CLAUDE.md')),
    details: isSymlink(join(HOME, '.claude/CLAUDE.md')) ? 'symlinked' : undefined,
    installHint: 'dotfiles install claude',
  });

  checks.push({
    name: 'Statusline script',
    category: 'claude',
    installed: existsSync(join(HOME, '.claude/statusline/index.ts')),
    installHint: 'dotfiles install claude',
  });

  checks.push({
    name: 'Statusline configured',
    category: 'claude',
    installed: !!(claudeSettings as any)?.statusLine?.command,
    details: (claudeSettings as any)?.statusLine ? 'in settings.json' : undefined,
    installHint: 'dotfiles install claude',
  });

  checks.push({
    name: 'Always thinking',
    category: 'claude',
    installed: (claudeSettings as any)?.alwaysThinkingEnabled === true,
    installHint: 'dotfiles install claude',
  });

  checks.push({
    name: 'Swift LSP plugin',
    category: 'claude',
    installed: !!(claudeSettings as any)?.enabledPlugins?.['swift-lsp@claude-plugins-official'],
    installHint: 'dotfiles install claude',
  });

  // Count commands
  const commandsDir = join(HOME, '.claude/commands');
  let commandCount = 0;
  if (existsSync(commandsDir)) {
    try {
      commandCount = execSync(`ls "${commandsDir}"/*.md 2>/dev/null | wc -l`, { encoding: 'utf-8' }).trim();
    } catch {}
  }
  checks.push({
    name: 'Slash commands',
    category: 'claude',
    installed: parseInt(commandCount as any) > 0,
    details: parseInt(commandCount as any) > 0 ? `${commandCount} installed` : undefined,
    installHint: 'dotfiles install claude',
  });

  // ========== Extras ==========
  checks.push({
    name: 'Hooked CLI',
    category: 'extras',
    installed: existsSync(join(HOME, '.hooked')),
    details: 'Claude notifications',
    installHint: 'dotfiles install hooked',
  });

  checks.push({
    name: 'iTerm2',
    category: 'extras',
    installed: existsSync('/Applications/iTerm.app'),
    installHint: 'brew install --cask iterm2',
  });

  return checks;
}

function printInventory() {
  console.log(`\n${c.bold}Dotfiles Inventory${c.reset}`);
  console.log(`${c.dim}Checking what's installed on this machine...${c.reset}\n`);

  const checks = checkInventory();

  const categories = [
    { key: 'prerequisites', label: 'Prerequisites', required: true },
    { key: 'shell', label: 'Shell (ZSH + Powerlevel10k)' },
    { key: 'claude', label: 'Claude Code' },
    { key: 'extras', label: 'Extras' },
  ];

  let totalInstalled = 0;
  let totalMissing = 0;
  const missingItems: CheckResult[] = [];

  for (const cat of categories) {
    const items = checks.filter(c => c.category === cat.key);
    const installed = items.filter(c => c.installed);
    const missing = items.filter(c => !c.installed);

    totalInstalled += installed.length;
    totalMissing += missing.length;
    missingItems.push(...missing);

    const status = missing.length === 0
      ? `${c.green}✓ all set${c.reset}`
      : `${c.yellow}${missing.length} missing${c.reset}`;

    console.log(`${c.bold}${cat.label}${c.reset} ${c.dim}(${installed.length}/${items.length})${c.reset} ${status}`);

    const maxLen = Math.max(...items.map(i => i.name.length));
    for (const item of items) {
      const icon = item.installed
        ? `${c.green}✓${c.reset}`
        : `${c.red}✗${c.reset}`;
      const name = item.name.padEnd(maxLen + 2);
      const details = item.details ? `${c.dim}${item.details}${c.reset}` : '';
      console.log(`  ${icon} ${name} ${details}`);
    }
    console.log();
  }

  // Summary
  console.log(`${c.dim}─────────────────────────────────${c.reset}`);
  console.log(`${c.bold}Summary:${c.reset} ${c.green}${totalInstalled} installed${c.reset}, ${totalMissing > 0 ? c.yellow : c.dim}${totalMissing} missing${c.reset}`);

  if (missingItems.length > 0) {
    console.log(`\n${c.bold}Quick fixes:${c.reset}`);

    // Group by install hint
    const hints = new Map<string, string[]>();
    for (const item of missingItems) {
      if (item.installHint) {
        const existing = hints.get(item.installHint) || [];
        existing.push(item.name);
        hints.set(item.installHint, existing);
      }
    }

    for (const [hint, items] of hints) {
      if (hint.startsWith('dotfiles')) {
        console.log(`  ${c.cyan}${hint}${c.reset} ${c.dim}→ ${items.join(', ')}${c.reset}`);
      } else {
        console.log(`  ${c.dim}${hint}${c.reset}`);
      }
    }

    console.log(`\n${c.yellow}Run 'dotfiles install' to set up all missing components${c.reset}`);
  } else {
    console.log(`\n${c.green}All configured! Your dotfiles are fully set up.${c.reset}`);
  }
  console.log();
}

// Keep old function for compatibility
function printStatus() {
  printInventory();
}

// ============================================================================
// Installation
// ============================================================================

async function installZsh() {
  log.step('Setting up ZSH...');

  // Oh My Zsh
  if (!existsSync(join(HOME, '.oh-my-zsh'))) {
    log.info('Installing Oh My Zsh...');
    execSync('sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended', {
      stdio: 'inherit',
    });
  } else {
    log.ok('Oh My Zsh installed');
  }

  // Powerlevel10k
  const p10kPath = join(HOME, '.oh-my-zsh/custom/themes/powerlevel10k');
  if (!existsSync(p10kPath)) {
    log.info('Installing Powerlevel10k...');
    execSync(`git clone --depth=1 https://github.com/romkatv/powerlevel10k.git "${p10kPath}"`, {
      stdio: 'inherit',
    });
  } else {
    log.ok('Powerlevel10k installed');
  }

  // Link configs
  safeLink(
    join(DOTFILES_DIR, 'zsh/.zshrc'),
    join(HOME, '.zshrc'),
    '.zshrc'
  );

  safeLink(
    join(DOTFILES_DIR, 'zsh/.p10k.zsh'),
    join(HOME, '.p10k.zsh'),
    '.p10k.zsh'
  );

  // Create .env.local template if missing
  const envLocal = join(HOME, '.env.local');
  if (!existsSync(envLocal)) {
    writeFileSync(envLocal, `# Local secrets - DO NOT COMMIT
# export GITHUB_TOKEN="your_token"
# export OBSIDIAN_API_KEY="your_key"
`);
    log.ok('Created ~/.env.local template');
  }
}

async function installClaude() {
  log.step('Setting up Claude Code...');

  const claudeDir = join(HOME, '.claude');
  mkdirSync(claudeDir, { recursive: true });
  mkdirSync(join(claudeDir, 'commands'), { recursive: true });
  mkdirSync(join(claudeDir, 'statusline'), { recursive: true });

  // CLAUDE.md
  safeLink(
    join(DOTFILES_DIR, 'claude/CLAUDE.md'),
    join(claudeDir, 'CLAUDE.md'),
    'CLAUDE.md'
  );

  // Statusline
  safeLink(
    join(DOTFILES_DIR, 'claude/statusline/index.ts'),
    join(claudeDir, 'statusline/index.ts'),
    'statusline'
  );

  // Commands
  const commandsDir = join(DOTFILES_DIR, 'claude/commands');
  if (existsSync(commandsDir)) {
    const commands = execSync(`ls "${commandsDir}"/*.md 2>/dev/null || true`, { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(Boolean);

    for (const cmd of commands) {
      const name = cmd.split('/').pop()!;
      safeLink(cmd, join(claudeDir, 'commands', name), `command: ${name.replace('.md', '')}`);
    }
  }

  // Configure settings.json (merge, don't replace)
  await configureClaudeSettings();
}

async function configureClaudeSettings() {
  log.step('Configuring Claude settings...');

  const settingsPath = join(HOME, '.claude/settings.json');
  const existing = readJson(settingsPath);

  const additions: Record<string, unknown> = {
    statusLine: {
      type: 'command',
      command: `bun ${join(HOME, '.claude/statusline/index.ts')}`,
    },
    alwaysThinkingEnabled: true,
    enabledPlugins: {
      'swift-lsp@claude-plugins-official': true,
    },
  };

  // Check what needs to be added
  const merged = deepMerge(existing, additions);

  if (JSON.stringify(existing) === JSON.stringify(merged)) {
    log.ok('Claude settings already configured');
    return;
  }

  console.log(`\n  Settings to add/update:`);
  if (!existing.statusLine) console.log(`    ${c.cyan}+ statusLine${c.reset}`);
  if (!existing.alwaysThinkingEnabled) console.log(`    ${c.cyan}+ alwaysThinkingEnabled${c.reset}`);
  if (!(existing.enabledPlugins as any)?.['swift-lsp@claude-plugins-official']) {
    console.log(`    ${c.cyan}+ Swift LSP plugin${c.reset}`);
  }
  console.log();

  if (prompt('  Apply these settings?')) {
    writeJson(settingsPath, merged);
    log.ok('Updated Claude settings');
  }
}

async function installHooked() {
  log.step('Setting up Hooked...');

  const hookedDir = join(HOME, '.hooked');

  if (existsSync(hookedDir)) {
    log.ok('Hooked already installed');
    return;
  }

  log.info('Hooked not found. Visit https://github.com/your-hooked-repo to install.');
  log.info('Or run: git clone <hooked-repo> ~/.hooked && cd ~/.hooked && pnpm install');
}

async function runInstall(components?: string[]) {
  console.log(`\n${c.bold}Dotfiles Installer${c.reset}\n`);

  const all = !components || components.length === 0 || components.includes('all');

  if (all || components?.includes('zsh')) {
    await installZsh();
    console.log();
  }

  if (all || components?.includes('claude')) {
    await installClaude();
    console.log();
  }

  if (all || components?.includes('hooked')) {
    await installHooked();
    console.log();
  }

  console.log(`${c.green}Done!${c.reset} Restart your terminal or run: source ~/.zshrc\n`);
}

// ============================================================================
// Claude-Assisted Setup
// ============================================================================

function generateClaudePrompt(): string {
  const checks = checkInventory();
  const missing = checks.filter(c => !c.installed);

  if (missing.length === 0) {
    return '';
  }

  const lines: string[] = [
    `# Dotfiles Setup Request`,
    ``,
    `Please help me set up my dotfiles on this new machine. Here's what's missing:`,
    ``,
  ];

  // Group by category
  const byCategory = new Map<string, CheckResult[]>();
  for (const item of missing) {
    const existing = byCategory.get(item.category) || [];
    existing.push(item);
    byCategory.set(item.category, existing);
  }

  const categoryLabels: Record<string, string> = {
    prerequisites: 'Prerequisites',
    shell: 'Shell Setup',
    claude: 'Claude Code',
    extras: 'Extras',
  };

  for (const [category, items] of byCategory) {
    lines.push(`## ${categoryLabels[category] || category}`);
    for (const item of items) {
      lines.push(`- [ ] ${item.name}${item.details ? ` (${item.details})` : ''}`);
    }
    lines.push('');
  }

  lines.push(`## Context`);
  lines.push(`- Dotfiles repo is at: ~/dotfiles`);
  lines.push(`- Home directory: ${HOME}`);
  lines.push(`- The dotfiles include configs for: zsh, powerlevel10k, Claude Code statusline, slash commands`);
  lines.push(``);
  lines.push(`## Instructions`);
  lines.push(`1. Install any missing prerequisites (brew, bun, nerd font)`);
  lines.push(`2. For shell setup: install Oh My Zsh, then Powerlevel10k, then symlink the configs from ~/dotfiles/zsh/`);
  lines.push(`3. For Claude: symlink configs from ~/dotfiles/claude/, update ~/.claude/settings.json to enable statusline and plugins`);
  lines.push(`4. Create ~/.env.local for secrets if it doesn't exist`);
  lines.push(``);
  lines.push(`Please proceed step by step, showing me what you're doing.`);

  return lines.join('\n');
}

function printClaudePrompt() {
  const checks = checkInventory();
  const missing = checks.filter(c => !c.installed);

  if (missing.length === 0) {
    console.log(`\n${c.green}Everything is already installed!${c.reset}\n`);
    console.log(`No Claude prompt needed - your dotfiles are fully configured.`);
    return;
  }

  console.log(`\n${c.bold}Claude Setup Prompt${c.reset}`);
  console.log(`${c.dim}Copy this prompt and paste it to Claude to set up your dotfiles:${c.reset}\n`);
  console.log(`${c.dim}${'─'.repeat(60)}${c.reset}`);
  console.log(generateClaudePrompt());
  console.log(`${c.dim}${'─'.repeat(60)}${c.reset}\n`);

  console.log(`${c.cyan}Tip:${c.reset} You can pipe this directly to your clipboard:`);
  console.log(`  ${c.dim}dotfiles prompt | pbcopy${c.reset}\n`);
}

// ============================================================================
// CLI
// ============================================================================

function printHelp() {
  console.log(`
${c.bold}dotfiles${c.reset} - Personal setup and configuration tool

${c.bold}Usage:${c.reset}
  dotfiles [command]

${c.bold}Commands:${c.reset}
  status              Show what's installed and configured
  install [component] Install everything or specific component
  prompt              Generate a prompt for Claude to set things up

${c.bold}Components:${c.reset}
  zsh                 Oh My Zsh + Powerlevel10k + configs
  claude              Claude Code statusline + commands + settings
  hooked              Hooked CLI for Claude notifications
  all                 Everything (default)

${c.bold}Examples:${c.reset}
  dotfiles                     Check current setup
  dotfiles install             Install everything
  dotfiles install zsh         Just ZSH stuff
  dotfiles prompt              Get a Claude-ready prompt
  dotfiles prompt | pbcopy     Copy prompt to clipboard
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'status':
    case 's':
      printStatus();
      break;

    case 'install':
    case 'i':
      await runInstall(args.slice(1));
      break;

    case 'prompt':
    case 'p':
      printClaudePrompt();
      break;

    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;

    case undefined:
      printStatus();
      break;

    default:
      log.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
