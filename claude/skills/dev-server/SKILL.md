---
name: dev-server
description: Manage development servers during coding sessions. Use this skill when the user wants to start, stop, restart, or check on a dev server. Also use proactively when making UI changes that the user might want to preview.
---

# Dev Server Management

Manage dev servers for web projects during active coding sessions.

## Commands

| Command | Action |
|---------|--------|
| `/dev` | Start dev server and open browser |
| `/dev stop` | Stop the running dev server |
| `/dev restart` | Restart the dev server |
| `/dev status` | Check if server is running and on what port |
| `/dev open` | Open the current server URL in browser |
| `/dev open /path` | Open a specific route |

## Package Manager Detection

Check lock files in this order:
1. `bun.lock` or `bun.lockb` → `bun dev`
2. `pnpm-lock.yaml` → `pnpm dev`
3. `yarn.lock` → `yarn dev`
4. `package-lock.json` → `npm run dev`

## Starting the Server

```bash
# Kill existing on common ports first
pkill -f "astro dev\|vite\|next dev" 2>/dev/null

# Start in background
bun dev &
```

Use `run_in_background: true` on the Bash tool.

## Stopping the Server

```bash
pkill -f "astro dev\|vite\|next dev\|bun dev\|npm run dev"
```

## Port Detection

Common defaults by framework:
- Astro: 4321
- Vite: 5173
- Next.js: 3000
- Create React App: 3000

Check server output for actual port.

## Opening Browser

```bash
open http://localhost:<port>
open http://localhost:<port>/specific/path
```

## Proactive Use

When making changes to:
- UI components
- Styles/CSS
- Page layouts
- Visual elements

Offer to start/open the dev server so the user can preview changes.

## State Tracking

Remember the running server's:
- Port number
- Process ID (from background task)
- Package manager used

Reference these when stopping/restarting.
