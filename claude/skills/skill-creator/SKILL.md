---
name: skill-creator
description: Create Claude Code skills or slash commands. Use when the user asks to "make a skill", "create a command", "add a slash command", or wants to automate a Claude Code workflow.
---

# Skill Creator

Create skills or slash commands for Claude Code.

**Official docs**: https://code.claude.com/docs/en/skills.md

When in doubt, fetch the official docs for the latest spec.

## Determine Type

Ask the user (or infer from context):

| Type | Best For | Location |
|------|----------|----------|
| **Slash Command** | Simple prompts, explicit invocation (`/name`) | `~/.claude/commands/name.md` |
| **Skill** | Complex workflows, auto-discovery by Claude | `~/.claude/skills/name/SKILL.md` |

**Rule of thumb**: If it's "run this command" or "do this specific thing" → slash command. If it's "a capability Claude should know about" → skill.

## Creating a Slash Command

Single markdown file:

```bash
# ~/.claude/commands/my-command.md
```

```markdown
# /my-command - Short Description

Description of what this command does.

## Instructions

When the user runs `/my-command`:

1. Step one
2. Step two
3. Step three

## Example Usage

User: /my-command
Assistant: [what happens]
```

## Creating a Skill

Directory with SKILL.md:

```bash
mkdir -p ~/.claude/skills/my-skill
```

```markdown
# ~/.claude/skills/my-skill/SKILL.md
---
name: my-skill
description: What this does and when Claude should use it automatically.
---

# My Skill

## Instructions

1. Step one
2. Step two

## Examples

[Concrete examples]
```

### Optional: Restrict Tools

```yaml
---
name: read-only-skill
description: Description here
allowed-tools: Read, Grep, Glob
---
```

### Optional: Supporting Files

```
my-skill/
├── SKILL.md        # Main instructions
├── reference.md    # Detailed docs (loaded when needed)
└── scripts/        # Helper scripts
```

## After Creating

Remind user: "Restart Claude Code for the new skill/command to be available."
