# Devin Collaboration

How local agents on this machine work with cloud Devin sessions (app.devin.ai).
The short version: cloud sessions write code and push to PRs; local lanes run
the things cloud can't — `swift build`, `xcodebuild`, signed-bundle builds,
permission-gated macOS paths — and report back through the API.

## API access

- Base: `https://api.devin.ai`
- Auth: `Authorization: Bearer $DEVIN_API_KEY`
- The key lives in the macOS keychain via the `secret` CLI. Inject it into a
  command's env without printing:

  ```bash
  secret run DEVIN_API_KEY -- curl -s "https://api.devin.ai/v1/sessions" \
    -H "Authorization: Bearer $DEVIN_API_KEY"
  ```

  or `KEY=$(secret get DEVIN_API_KEY)` in a subshell. Never echo, log, or
  commit the value.

- Scope: the stored key is a **personal** key (`apk_user_…`). It works on the
  **v1** endpoints. v3 org/enterprise endpoints (`/v3/organizations/...`) return
  403 for personal keys — those require a service-user key with
  `ManageOrgSessions`, which does not exist yet. Use v1.

## Endpoints that matter (v1)

```bash
# List sessions (id, title, status, updated_at)
GET  /v1/sessions

# Session detail
GET  /v1/session/{session_id}

# Post a message into a session's feed
POST /v1/session/{session_id}/message
     {"message": "..."}
```

- `session_id` looks like `devin-<32 hex>` (e.g.
  `devin-01afb9b5f8514d859beedae3f32eb943` = the "Achieve macOS Web Parity"
  LIN-041 session).
- Posting a message is a **real side effect**: it lands in the session as a
  user message and steers/wakes the cloud agent. Send only deliberate content.
- Sessions auto-resume when messaged while suspended.

## Finding the right session

- `GET /v1/sessions` and match `title`, or check `updated_at` for the live one.
- Locally, `devin list` shows sessions attached to the current directory.
- Don't guess session IDs from URLs seen in screenshots — resolve via the API.

## The local-validation pattern

Cloud Devin sessions cannot run macOS builds. The standing arrangement:

1. Cloud session pushes a branch/PR and asks for validation.
2. Local lane builds in a **clean worktree** (`git worktree add`), never the
   shared dirty tree.
3. Local lane reports back — via `POST /v1/session/{id}/message` (goes to the
   session) or `gh pr comment` (goes to the canonical artifact; prefer this for
   validation matrices so other lanes see it too).
4. Report exact commands, head SHA, warnings vs failures. Never claim a PR is
   merged or green based on local success alone — only GitHub state is
   authoritative for merge status.

## Known good state (as of 2026-09-19)

- Key verified: `GET /v1/sessions` returns real data; the message route
  validates (`422 Field required` on empty body = endpoint exists).
- Org id (for future v3/service-user use): `org-ce67e767b69d4477aa00562125d24f19`
- User id: `user-2e933ba2648f4ff8aabe8f59e475c8ef`
- Devin CLI config: `~/.local/share/devin/cli/config.json`;
  credentials file `~/.local/share/devin/credentials.toml` holds a *session
  token* — it does NOT authenticate the public API. Only `DEVIN_API_KEY` from
  the keychain works.

## Fallback (avoid)

If the API is unreachable, driving the user's Chrome via the Action MCP
(focus-window, OCR, cliclick) works but is fragile: clicks are screen-coord,
key events need Accessibility permission, and `exec` calls steal window focus.
Use only when the API path genuinely fails.

## Don'ts

- Don't print the key — not even a prefix, in normal operation.
- Don't POST to sessions speculatively; each message is a user-level
  instruction to a running agent.
- Don't hit v3 endpoints with the personal key and retry-loop on the 403.
- Don't confuse the CLI session token (`credentials.toml`,
  `devin-sessio…`) with the API key (`apk_user_…`).
