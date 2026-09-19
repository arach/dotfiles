# Devin Collaboration

How local agents on this machine work with cloud Devin sessions (app.devin.ai).
The short version: cloud sessions write code and push to PRs; local lanes run
the things cloud can't — `swift build`, `xcodebuild`, signed-bundle builds,
permission-gated macOS paths — and report back through the API.

## API access

- Base: `https://api.devin.ai`
- Auth: `Authorization: Bearer $DEVIN_AIR_TOKEN` — a **service-user** token
  (`cog_…`) scoped to the org below. It lives in the macOS keychain via the
  `secret` CLI.

### The injection trap (this cost us a day)

`secret run` injects the variable into the *child* process. If the parent
shell expands `$DEVIN_AIR_TOKEN` while building the command — as in
`secret run DEVIN_AIR_TOKEN -- curl -H "Bearer $DEVIN_AIR_TOKEN"` — the
expansion happens **before** injection and sends an empty Bearer. The API's
answer (`403 {"detail":"Unauthorized"}`) is identical to a dead key, so the
key looks broken when nothing was ever sent.

Always expand inside the injected child:

```bash
secret run DEVIN_AIR_TOKEN -- sh -c \
  'curl -s "https://api.devin.ai/v3/organizations/$ORG/sessions" \
     -H "Authorization: Bearer $DEVIN_AIR_TOKEN"'
```

or `TOKEN=$(secret get DEVIN_AIR_TOKEN)` in a subshell. Never echo, log, or
commit the value.

### Key types, for the record

| Prefix | Type | Works on |
|---|---|---|
| `cog_` | service user | v3 (`/v3/organizations/...`, `/v3/enterprise/...`) |
| `apk_user_` | legacy personal | v1, v2 only — deprecated, silently expirable |
| `apk_` | legacy service | v1 only |

v1/v2 still work during deprecation but `apk_user_` keys can expire while
still *looking* active in the app: the UI's visible prefix is
`apk_user_` + base64(user id) — identical for every key on the account, so it
cannot distinguish a live key from a revoked predecessor. Prefer `cog_` + v3.

## Endpoints that matter (v3)

Org id: `org-ce67e767b69d4477aa00562125d24f19`

```bash
# List sessions
GET  /v3/organizations/{org}/sessions

# Session detail (returns status, title, pr_url, acus_consumed…)
GET  /v3/organizations/{org}/sessions/{devin_id}

# Post a message into a session's feed
POST /v3/organizations/{org}/sessions/{devin_id}/messages
     {"message": "..."}
```

- `devin_id` is the 32-hex session id — e.g. `01afb9b5f8514d859beedae3f32eb943`
  = the "Achieve macOS Web Parity" LIN-041 session (also written
  `devin-01afb9b5f8514d859beedae3f32eb943` on v1).
- Posting a message is a **real side effect**: it lands in the session as a
  user message and steers/wakes the cloud agent (status flips to `claimed`
  while it processes). Send only deliberate content.
- Sessions auto-resume when messaged while suspended.

## Finding the right session

- `GET /v3/organizations/{org}/sessions` and match `title`, or sort by
  `updated_at` for the live one.
- Locally, `devin list` shows sessions attached to the current directory
  (only under the directory they were launched from — check the right cwd).
- Don't guess session IDs from URLs seen in screenshots — resolve via the API.

## The local-validation pattern

Cloud Devin sessions cannot run macOS builds. The standing arrangement:

1. Cloud session pushes a branch/PR and asks for validation.
2. Local lane builds in a **clean worktree** (`git worktree add`), never the
   shared dirty tree.
3. Local lane reports back — via the messages endpoint (goes to the session)
   or `gh pr comment` (goes to the canonical artifact; prefer this for
   validation matrices so other lanes see it too).
4. Report exact commands, head SHA, warnings vs failures. Never claim a PR is
   merged or green based on local success alone — only GitHub state is
   authoritative for merge status.

## Known good state (as of 2026-09-19)

- `cog_` token verified: `GET /v3/organizations/{org}/sessions/{id}` → 200
  with real session data; `POST .../messages` → 200.
- Org id: `org-ce67e767b69d4477aa00562125d24f19`
- User id: `user-2e933ba2648f4ff4aabe8f59e475c8ef`
- Devin CLI config: `~/.local/share/devin/cli/config.json`; credentials file
  `~/.local/share/devin/credentials.toml` holds a *session token* — it does
  NOT authenticate the public API. Only the keychain `DEVIN_AIR_TOKEN` works.
- The retired `apk_user_` key remains in the keychain as `DEVIN_API_KEY`;
  it is legacy (v1-only) — do not use it for new work.

## Fallback (avoid)

If the API is unreachable, driving the user's Chrome via the Action MCP
(focus-window, OCR, cliclick) works but is fragile: clicks are screen-coord,
key events need Accessibility permission, and `exec` calls steal window
focus. Use only when the API path genuinely fails.

## Don'ts

- Don't print the token — not even a prefix, in normal operation (a 4-char
  `cog_`/`apk_` type check is acceptable when diagnosing auth).
- Don't POST to sessions speculatively; each message is a user-level
  instruction to a running agent.
- Don't expand the secret variable in the parent shell — wrap in `sh -c`.
- Don't trust the app's key prefix to identify *which* key it is — it's the
  user id, constant across regenerations.
- Don't confuse the CLI session token (`credentials.toml`) with the API
  token (`cog_…`).
