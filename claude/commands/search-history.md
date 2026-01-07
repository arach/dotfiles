# /search-history - Search Previous Conversations

Search through previous Claude Code conversation summaries and messages.

## Usage

```
/search-history <query>
```

## Instructions

When the user runs this command with a search query:

### 1. Search conversation summaries (fast)

```bash
# Get all summaries matching the query
grep -rh '"type":"summary"' ~/.claude/projects/ 2>/dev/null | \
  grep -i "<QUERY>" | \
  python3 -c "
import sys, json
for line in sys.stdin:
    try:
        d = json.loads(line.strip())
        print(f\"- {d.get('summary', 'N/A')}\")
    except: pass
" | head -20
```

### 2. Search user messages in current project (if needed)

```bash
# Search actual user messages for the query
grep '"type":"user"' ~/.claude/projects/-Users-arach-dev-talkie/*.jsonl 2>/dev/null | \
  grep -v 'tool_result' | \
  grep -i "<QUERY>" | \
  python3 -c "
import sys, json
for line in sys.stdin:
    try:
        parts = line.split(':', 1)
        if len(parts) > 1:
            d = json.loads(parts[1].strip())
            msg = d.get('message', {})
            content = msg.get('content', '')
            if isinstance(content, str) and content:
                ts = d.get('timestamp', '')[:10]
                print(f\"[{ts}] {content[:100]}...\")
    except: pass
" | head -15
```

### 3. Format output

```markdown
## Search Results for "<query>"

### Summaries
- "TTS pod architecture exploration"
- "FluidAudio integration for speak step"

### Recent Messages
- [2026-01-02] "Can we wire up local TTS in the speak step?"
- [2026-01-01] "What's the memory footprint of the TTS pod?"
```

## Tips

- Summaries give a quick overview of conversation topics
- Message search finds specific discussions
- Recent files (modified today): `find ~/.claude/projects/ -name "*.jsonl" -mtime 0`
- Current project path uses `-Users-arach-dev-talkie` format
