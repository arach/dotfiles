#!/usr/bin/env bun
/**
 * Simple Claude Code Status Line
 * Model | Context % | Git | Session | Path | Hooked
 */

import { execSync } from 'child_process';
import { homedir } from 'os';

interface ClaudeStatus {
  session_id?: string;
  cwd?: string;
  model?: { display_name?: string };
  context_window?: { used?: number; max?: number };
}

const c = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  green: '\x1b[32m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
};

function getGitBranch(cwd: string): string {
  try {
    return execSync('git branch --show-current', { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

function getHookedStatus(jsonInput: string): string {
  try {
    const result = execSync(
      `/Users/arach/.hooked/node_modules/.bin/tsx /Users/arach/.hooked/src/statusline.ts --widget`,
      { encoding: 'utf-8', input: jsonInput, stdio: ['pipe', 'pipe', 'pipe'], timeout: 1000 }
    ).trim();
    return result || '';
  } catch {
    return '';
  }
}

function formatPath(cwd: string): string {
  const home = homedir();
  if (cwd === home) return '~';
  if (cwd.startsWith(home + '/')) {
    return '~/' + cwd.slice(home.length + 1);
  }
  return cwd;
}

async function main() {
  let input: ClaudeStatus = {};
  let rawJson = '';
  if (!process.stdin.isTTY) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    rawJson = Buffer.concat(chunks).toString('utf-8');
    if (rawJson.trim()) {
      try { input = JSON.parse(rawJson); } catch {}
    }
  }

  const cwd = input.cwd || process.cwd();
  const model = input.model?.display_name || 'Claude';
  const sessionId = input.session_id || '';
  const pct = input.context_window?.used && input.context_window?.max
    ? Math.round((input.context_window.used / input.context_window.max) * 100) + '%'
    : '';
  const displayPath = formatPath(cwd);
  const branch = getGitBranch(cwd);
  const hooked = getHookedStatus(rawJson);

  // Build single line: Model | % | branch | session | path | hooked
  const parts: string[] = [];
  parts.push(`${c.cyan}${model}${c.reset}`);
  if (pct) parts.push(`${c.yellow}${pct}${c.reset}`);
  if (branch) parts.push(`${c.magenta}⎇ ${branch}${c.reset}`);
  if (sessionId) parts.push(`${c.dim}${sessionId}${c.reset}`);
  parts.push(`${c.blue}${displayPath}${c.reset}`);
  if (hooked) parts.push(`${c.green}${hooked}${c.reset}`);

  // Single line, no trailing newline
  process.stdout.write(parts.join(` ${c.dim}│${c.reset} `));
}

main().catch(() => process.stdout.write('status'));
