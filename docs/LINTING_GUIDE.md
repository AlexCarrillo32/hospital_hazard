# Linting and Code Quality Guide

## Overview

This project uses ESLint 9.x with a flat config and Prettier for code quality
and formatting.

## Configuration Files

- **eslint.config.js** - ESLint configuration with comprehensive rules
- **.prettierrc.json** - Prettier formatting rules
- **.prettierignore** - Files to exclude from Prettier

## Quick Start

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors where possible
npm run lint:fix

# Check code formatting
npm run format:check

# Auto-fix formatting
npm run format
```

## ESLint Rules Summary

### Critical Rules (MUST comply)

#### Variables

- ✅ **no-var**: Never use `var`; always use `const` or `let`
- ✅ **prefer-const**: Use `const` by default; `let` only when reassignment
  needed
- ✅ **no-undef**: All variables must be declared
- ✅ **no-unused-vars**: Unused variables cause errors (prefix with `_` to mark
  intentionally unused)

#### Code Quality

- ✅ **eqeqeq**: Always use `===` and `!==` (except when checking null)
- ✅ **curly**: Always use braces for if/else/for/while blocks
- ✅ **no-eval**: Never use `eval()` or implied eval
- ✅ **no-debugger**: Never commit code with `debugger` statements

#### Error Prevention

- ✅ **no-unreachable**: No code after return/throw/break/continue
- ✅ **no-empty**: Never have empty blocks (including catch)
- ✅ **no-promise-executor-return**: Don't return values from Promise executors
- ✅ **consistent-return**: All branches must return same type

### Warning Rules (SHOULD comply)

- ⚠️ **require-await**: Async functions should contain await
- ⚠️ **no-await-in-loop**: Consider Promise.all() instead of await in loops
- ⚠️ **complexity**: Functions should not exceed complexity of 15
- ⚠️ **require-atomic-updates**: Watch for race conditions in assignments

### Disabled Rules (Intentionally off)

- 🚫 **no-magic-numbers**: Disabled (too noisy for practical development)
- 🚫 **no-param-reassign**: Disabled (sometimes needed for transformations)
- 🚫 **prefer-destructuring**: Disabled (not always clearer)
- 🚫 **arrow-body-style**: Disabled (explicit returns often clearer)
- 🚫 **func-style**: Disabled (both styles have their place)

## Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "bracketSpacing": true,
  "endOfLine": "lf"
}
```

### Key Formatting Rules

- **Line width**: 100 characters (80 for Markdown)
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Trailing commas**: ES5 style (arrays, objects)
- **Indentation**: 2 spaces (no tabs)

## Common Patterns

### Marking Intentionally Unused Variables

```javascript
// ❌ Bad - will error
export function handler(req, res, next) {
  res.json({ status: 'ok' });
}

// ✅ Good - prefix unused params with underscore
export function handler(_req, res, _next) {
  res.json({ status: 'ok' });
}
```

### Curly Braces Required

```javascript
// ❌ Bad
if (condition) doSomething();

// ✅ Good
if (condition) {
  doSomething();
}
```

### Consistent Returns

```javascript
// ❌ Bad - inconsistent returns
async function getUser(id) {
  if (id) {
    return await db.findUser(id);
  }
  // Missing return!
}

// ✅ Good - all branches return
async function getUser(id) {
  if (id) {
    return db.findUser(id);
  }
  return null;
}
```

### Async/Await in Loops

```javascript
// ⚠️ Warning - sequential execution
for (const item of items) {
  await processItem(item);
}

// ✅ Better - parallel execution
await Promise.all(items.map((item) => processItem(item)));
```

### Template Literals

```javascript
// ❌ Bad
const message = 'Hello ' + name + '!';

// ✅ Good
const message = `Hello ${name}!`;
```

## Pre-commit Checklist

Before committing code, ensure:

1. ✅ `npm run lint` passes with no errors (warnings OK)
2. ✅ `npm run format:check` passes
3. ✅ `npm test` passes
4. ✅ No `console.log` left in production code (unless intentional logging)
5. ✅ No commented-out code blocks
6. ✅ All `_` prefixed variables are truly unused

## IDE Integration

### VS Code

Install recommended extensions:

- **ESLint** (dbaeumer.vscode-eslint)
- **Prettier** (esbenp.prettier-vscode)

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript"]
}
```

## Ignored Files

The following are ignored by ESLint and Prettier:

- `node_modules/`
- `coverage/`
- `dist/` and `build/`
- `*.min.js` files
- `.env*` files (except `.env.example`)

## Troubleshooting

### "Parsing error" or "Cannot find module"

```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "Expected property shorthand" warnings

This is a warning, not an error. You can fix with:

```javascript
// Warning
const obj = { name: name };

// Fixed
const obj = { name };
```

### False positive "require-atomic-updates"

This rule can have false positives. If you're certain the code is safe:

```javascript
// Add comment to disable for specific line
// eslint-disable-next-line require-atomic-updates
prompt = await safetyCheck(prompt);
```

## Best Practices Summary

1. **Use the linter** - Don't fight it; it catches real bugs
2. **Fix errors first** - Errors must be resolved; warnings can wait
3. **Auto-fix when possible** - Use `npm run lint:fix` liberally
4. **Disable sparingly** - Only disable rules when truly necessary
5. **Comment disables** - Always explain why when disabling a rule
6. **Format before commit** - Run `npm run format` before committing

## Resources

- [ESLint Rules](https://eslint.org/docs/latest/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [CLAUDE.md](../CLAUDE.md) - Full development guidelines
