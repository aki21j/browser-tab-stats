# Contributing to Tab Stats

Thanks for your interest in contributing! 🎉

## How to Contribute

### Reporting Bugs

Found a bug? Please open an issue with:
- Browser version (Chrome/Brave/etc.)
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)

### Suggesting Features

Have an idea? Open an issue with:
- Clear description of the feature
- Use case / problem it solves
- Mockups or examples (if applicable)

### Code Contributions

1. **Fork** the repository
2. **Clone** your fork
3. **Create a branch**: `git checkout -b feature/your-feature`
4. **Make changes** and test thoroughly
5. **Commit**: `git commit -m 'Add: your feature description'`
6. **Push**: `git push origin feature/your-feature`
7. **Open a Pull Request**

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/browser-tab-stats.git
cd browser-tab-stats

# Load in browser
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select the browser-tab-stats folder
```

### Testing Your Changes

1. Make your code changes
2. Go to `chrome://extensions/`
3. Click reload on Tab Stats extension
4. Test all affected features
5. Check console for errors
6. Verify the TESTING.md checklist

### Code Style

- Use **descriptive variable names**
- Add **comments** for complex logic
- Keep functions **small and focused**
- Follow **existing code patterns**
- No external dependencies (keep it vanilla JS)

### Commit Messages

Use clear, descriptive commit messages:

```
Add: New feature description
Fix: Bug description
Update: What was updated
Remove: What was removed
Refactor: What was refactored
```

## Development Guidelines

### File Structure
- `/background/` - Service worker
- `/sidepanel/` - Side panel UI
- `/dashboard/` - Dashboard UI
- `/shared/` - Reusable utilities

### Best Practices
- Test with 10, 100, and 500+ tabs
- Ensure performance is acceptable
- Maintain privacy-first approach
- No external network requests
- Keep permissions minimal

## Pull Request Process

1. Update README if adding features
2. Update CHANGELOG.md
3. Ensure code works in Chrome and Brave
4. Reference any related issues
5. Wait for review

## Questions?

Open an issue or start a discussion. We're happy to help!

---

**Thank you for contributing!** 🚀

