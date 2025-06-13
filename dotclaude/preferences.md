# Personal Preferences for Claude Code

## Tool Usage
- Prefer MCP tools (like mcp__puppeteer) over custom scripts when available
- For rm/rmdir commands: explain context and purpose, wait for approval before proceeding
- Always use puppeteer with proper viewport settings (1440x900 or as needed)

## Development Workflow
- When referencing other repos for design inspiration, actually analyze and incorporate their specific patterns, not generic interpretations
- Ensure code runs without errors before committing (test builds, check for syntax errors)
- Write detailed, multi-line commit messages documenting all changes
- When making file structure changes, update all import paths accordingly
- Prefer editing existing files over creating new ones unless explicitly needed

## Communication Style
- Be direct and action-oriented
- When user says "let's do X", proceed immediately without asking for confirmation
- Keep responses concise and focused on the task
- Avoid over-explaining unless user asks for details
- When showing screenshots or results, let the output speak for itself

## Code Quality
- Follow existing code conventions in the project
- Maintain consistent styling and formatting
- Ensure TypeScript types are properly defined
- Keep components modular and reusable

## Git Best Practices
- Use descriptive branch names when needed
- Stage only relevant files (avoid test scripts, temporary files)
- Write commit messages that explain the "why" not just the "what"
- Check git status before committing to ensure clean commits

## Project Understanding
- Read and understand existing documentation (README, CLAUDE.md) before making changes
- Consider the user's end goals when implementing features
- Maintain awareness of the full project structure and how changes impact other parts