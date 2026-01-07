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
}

function checkStatus(): CheckResult[] {
  const checks: CheckResult[] = [];

  // Bun
  checks.push({
    name: 'Bun',
    installed: commandExists('bun'),
    details: commandExists('bun') ? execSync('bun --version', { encoding: 'utf-8' }).trim() : undefined,
  });

  // Oh My Zsh
  checks.push({
    name: 'Oh My Zsh',
    installed: existsSync(join(HOME, '.oh-my-zsh')),
  });

  // Powerlevel10k
  const p10kPath = join(HOME, '.oh-my-zsh/custom/themes/powerlevel10k');
  checks.push({
    name: 'Powerlevel10k',
    installed: existsSync(p10kPath),
  });

  // .zshrc linked
  const zshrcPath = join(HOME, '.zshrc');
  const zshrcLinked = existsSync(zshrcPath) &&
    (isSymlink(zshrcPath) || readFileSync(zshrcPath, 'utf-8').includes('powerlevel10k'));
  checks.push({
    name: '.zshrc',
    installed: zshrcLinked,
    details: isSymlink(zshrcPath) ? 'symlinked' : 'configured',
  });

  // Claude CLI
  checks.push({
    name: 'Claude CLI',
    installed: existsSync(join(HOME, '.claude/local/claude')) || commandExists('claude'),
  });

  // Claude statusline
  checks.push({
    name: 'Claude statusline',
    installed: existsSync(join(HOME, '.claude/statusline/index.ts')),
  });

  // Claude settings has statusline configured
  const claudeSettings = readJson(join(HOME, '.claude/settings.json'));
  checks.push({
    name: 'Statusline configured',
    installed: !!(claudeSettings as any)?.statusLine?.command,
  });

  // Hooked
  checks.push({
    name: 'Hooked CLI',
    installed: existsSync(join(HOME, '.hooked')),
  });

  // Always thinking
  checks.push({
    name: 'Always thinking',
    installed: (claudeSettings as any)?.alwaysThinkingEnabled === true,
  });

  // Swift LSP
  checks.push({
    name: 'Swift LSP plugin',
    installed: !!(claudeSettings as any)?.enabledPlugins?.['swift-lsp@claude-plugins-official'],
  });

  return checks;
}

function printStatus() {
  console.log(`\n${c.bold}Dotfiles Status${c.reset}\n`);

  const checks = checkStatus();
  const maxLen = Math.max(...checks.map(c => c.name.length));

  for (const check of checks) {
    const icon = check.installed ? `${c.green}✓${c.reset}` : `${c.dim}○${c.reset}`;
    const name = check.name.padEnd(maxLen + 2);
    const details = check.details ? `${c.dim}(${check.details})${c.reset}` : '';
    console.log(`  ${icon} ${name} ${details}`);
  }

  const missing = checks.filter(c => !c.installed);
  if (missing.length > 0) {
    console.log(`\n${c.yellow}Run 'dotfiles install' to set up missing components${c.reset}\n`);
  } else {
    console.log(`\n${c.green}All configured!${c.reset}\n`);
  }
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

${c.bold}Components:${c.reset}
  zsh                 Oh My Zsh + Powerlevel10k + configs
  claude              Claude Code statusline + commands + settings
  hooked              Hooked CLI for Claude notifications
  all                 Everything (default)

${c.bold}Examples:${c.reset}
  dotfiles status          Check current setup
  dotfiles install         Install everything
  dotfiles install zsh     Just ZSH stuff
  dotfiles install claude  Just Claude stuff
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
