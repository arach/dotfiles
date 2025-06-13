# CLAUDE.md Template

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Universal Guidelines (Apply to All Projects)

### Git Commit Style

Always use [gitmoji](https://gitmoji.dev/) for commit messages. Start each commit with an appropriate emoji:

- ✨ `:sparkles:` - New feature
- 🐛 `:bug:` - Bug fix
- 📝 `:memo:` - Documentation
- 💄 `:lipstick:` - UI/style updates
- ♻️ `:recycle:` - Refactoring
- 🎨 `:art:` - Improving structure/format
- ⚡️ `:zap:` - Performance improvements
- 🔧 `:wrench:` - Configuration files
- 🚀 `:rocket:` - Deployments
- ✅ `:white_check_mark:` - Tests
- 🔒 `:lock:` - Security fixes
- ⬆️ `:arrow_up:` - Upgrading dependencies
- 🏗️ `:building_construction:` - Architectural changes
- 💚 `:green_heart:` - Fixing CI
- 🔀 `:twisted_rightwards_arrows:` - Merging branches
- 🔖 `:bookmark:` - Release/Version tags

### Code Style Preferences

- **Readability First**: Prioritize readable code over clever optimizations
- **Type Safety**: Use TypeScript strictly, avoid `any` types
- **Functional Approach**: Prefer functional components and hooks in React
- **Clean Architecture**: Keep business logic separated from UI logic
- **Error Handling**: Always handle errors gracefully with proper user feedback
- **Comments**: Write comments for complex logic, not obvious code

### Development Workflow

1. **Understand First**: Always read existing code patterns before implementing
2. **Test Everything**: Run tests and type checking before commits
3. **Document Changes**: Update README and inline docs for new features
4. **Atomic Commits**: One logical change per commit
5. **Code Review Mindset**: Write code as if someone else will review it

### Quality Checklist Before Commits

- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Tests pass (if applicable)
- [ ] Feature tested manually in the app
- [ ] Code follows existing patterns
- [ ] Commit message uses gitmoji
- [ ] Documentation updated if needed

**Important**: ALWAYS run `npm run type-check` before committing. This catches errors early and ensures clean commits.

### Architecture Patterns

- **Window Management**: For multi-window apps, each window needs its own capability in `tauri.conf.json`
- **State Management**: Use Zustand for global state, React hooks for local state
- **Component Organization**: 
  - Shared components in `/components`
  - Page-specific components in `/pages`
  - Reusable business logic in `/hooks`
  - Type definitions in `/types`

### Common Gotchas & Solutions

1. **Tauri Window Permissions**: If getting "not allowed" errors, add window-specific capabilities
2. **Vite Multi-Page Setup**: Add new HTML entry points to `vite.config.ts` rollupOptions
3. **TypeScript Paths**: Use absolute imports from `src/` to avoid ../../../ chains
4. **Cross-Window Communication**: Use Tauri events, not direct window references

### UI/UX Principles

- **Keyboard First**: Every feature should be keyboard accessible
- **Visual Feedback**: Show loading states, success confirmations, error messages
- **Minimal Clicks**: Common actions should be 1-2 clicks/keystrokes max
- **Consistency**: Follow existing patterns for similar features
- **Edge Cases**: Consider what happens when lists are empty, actions fail, etc.

### Debugging Commands

```bash
# Type checking
npm run type-check

# Find TypeScript errors
npx tsc --noEmit --pretty

# Check bundle size
npm run build && du -sh dist

# Test Tauri commands
npm run tauri dev -- --verbose

# Clear Tauri cache (if builds are acting weird)
rm -rf src-tauri/target
```

### PR Checklist

Before creating a PR:
- [ ] Feature works across all supported platforms
- [ ] No TypeScript errors or warnings
- [ ] Keyboard shortcuts documented (if applicable)
- [ ] Settings persist correctly (if applicable)
- [ ] Error states handled gracefully
- [ ] Console is clean (no errors/warnings)
- [ ] Commit messages follow gitmoji convention
- [ ] README updated if adding major features

### Performance Considerations

- **Re-renders**: Use React.memo() for expensive components
- **Event Listeners**: Always clean up in useEffect return
- **Animations**: Use CSS transforms over position changes
- **Images**: Optimize images before committing (use WebP when possible)
- **Bundle Size**: Check size impact before adding new dependencies

### Accessibility Basics

- **Keyboard Navigation**: All interactive elements reachable via Tab
- **Focus Indicators**: Visible focus states for keyboard users
- **ARIA Labels**: Add labels to icon-only buttons
- **Color Contrast**: Ensure text is readable on all backgrounds
- **Motion**: Respect prefers-reduced-motion for animations

### Working Patterns & Best Practices

1. **Iterative Development**
   - Start with basic functionality, then enhance
   - Get user feedback early and often
   - Don't over-engineer the first implementation

2. **Clean Git History**
   - Use feature branches for larger changes
   - Squash commits if they're fixing previous commits in same PR
   - Write descriptive PR descriptions with bullet points

3. **Problem Solving Approach**
   - When UI doesn't fit: Consider separate windows (like shortcuts)
   - When positioning is tricky: Look for architectural solutions
   - When repeating code: Extract to shared components/hooks

4. **Todo Management**
   - Break large tasks into smaller, trackable items
   - Mark items complete as you go (not in batches)
   - Use todos to plan before implementing

## Project-Specific Guidelines

[Add project-specific guidelines below this line]