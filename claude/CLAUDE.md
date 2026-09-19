- Always allow puppeteer uses - all features
- Prefer pnpm over npm for Node.js projects
- When working with Node.js projects, check for pnpm-lock.yaml first
- Add gitmoji to commit messages
- NEVER add co-authoring attribution or "Generated with Claude Code" footers to commits
- don't co-author commits

## Devin collaboration

Working with cloud Devin sessions (app.devin.ai)? Read `~/dev/dotfiles/devin/DEVIN.md` first.
Quickref: API key via `secret run DEVIN_API_KEY -- <cmd>` (never print it); personal key → **v1** endpoints only;
post to a session with `POST /v1/session/{id}/message` `{"message": "..."}` — real side effect, be deliberate;
local lanes own `swift build`/macOS validation cloud can't run; prefer `gh pr comment` for validation records.