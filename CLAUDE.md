# Waste Compliance Agent - Development Guidelines

## Implementation Best Practices

### 0 — Purpose

These rules ensure maintainability, safety, and developer velocity for the Waste
Compliance & Logistics AI Agent. **MUST** rules are enforced by CI; **SHOULD**
rules are strongly recommended.

---

### 1 — Before Coding

- **BP-1 (MUST)** Ask the user clarifying questions.
- **BP-2 (SHOULD)** Draft and confirm an approach for complex work.
- **BP-3 (SHOULD)** If ≥ 2 approaches exist, list clear pros and cons.

---

### 2 — While Coding

- **C-1 (MUST)** Follow TDD: scaffold stub -> write failing test -> implement.
- **C-2 (MUST)** Name functions with existing domain vocabulary for consistency.
- **C-3 (SHOULD NOT)** Introduce classes when small testable functions suffice.
- **C-4 (SHOULD)** Prefer simple, composable, testable functions.
- **C-5 (MUST)** Use `import type { … }` for type-only imports when using
  TypeScript.
- **C-6 (SHOULD NOT)** Add comments except for critical caveats; rely on
  self‑explanatory code.
- **C-7 (SHOULD NOT)** Extract a new function unless it will be reused
  elsewhere, is the only way to unit-test otherwise untestable logic, or
  drastically improves readability of an opaque block.

---

### 3 — Testing

- **T-1 (MUST)** For a simple function, colocate unit tests in `*.test.js` in
  same directory as source file.
- **T-2 (MUST)** For any API change, add/extend integration tests in `tests/`
  directory.
- **T-3 (MUST)** ALWAYS separate pure-logic unit tests from external
  API-touching integration tests.
- **T-4 (SHOULD)** Prefer integration tests over heavy mocking.
- **T-5 (SHOULD)** Unit-test complex algorithms thoroughly.
- **T-6 (SHOULD)** Test the entire structure in one assertion if possible

  ```js
  expect(result).toEqual([value]); // Good

  expect(result).toHaveLength(1); // Bad
  expect(result[0]).toEqual(value); // Bad
  ```

---

### 4 — AI Model Integration

- **AI-1 (MUST)** Always handle model endpoint failures gracefully with
  meaningful error messages.
- **AI-2 (MUST)** Implement proper timeout handling for all model API calls.
- **AI-3 (SHOULD)** Use streaming responses for better user experience with long
  generations.
- **AI-4 (MUST)** Validate all input parameters before sending to model
  endpoint.
- **AI-5 (SHOULD)** Implement retry logic for transient model API failures.

---

### 5 — Code Organization

- **O-1 (MUST)** Place shared utilities in `src/utils/` directory.
- **O-2 (MUST)** Separate AI service logic from HTTP routing logic.
- **O-3 (MUST)** Keep deployment configurations in `docker/` and `scripts/`
  directories.

---

### 6 — Tooling Gates

- **G-1 (MUST)** `prettier --check` passes.
- **G-2 (MUST)** `npm run lint` passes.
- **G-3 (MUST)** `npm test` passes.
- **G-4 (SHOULD)** `npm run typecheck` passes when using TypeScript.

---

### 6.5 — Linting Best Practices

#### Variables & Declarations

- **L-1 (MUST)** Never use `var`; always use `const` or `let`.
- **L-2 (MUST)** Prefer `const` by default; only use `let` when reassignment is
  needed.
- **L-3 (MUST)** Prefix unused parameters/variables with underscore `_` to
  explicitly mark them as intentionally unused.
- **L-4 (MUST)** Never reference variables before they are defined (except for
  function declarations).
- **L-5 (MUST)** All variables must be declared; no implicit globals.

#### Functions

- **L-6 (MUST)** Prefer function declarations over function expressions for
  named functions.
- **L-7 (SHOULD)** Use arrow functions for callbacks and anonymous functions.
- **L-8 (SHOULD)** Omit braces in arrow functions when returning a single
  expression.
- **L-9 (MUST NOT)** Create empty functions except for arrow function
  placeholders.
- **L-10 (SHOULD)** Keep functions focused; complexity score should not
  exceed 10.
- **L-11 (SHOULD)** Limit function parameters to 5 or fewer.
- **L-12 (SHOULD)** Limit nesting depth to 4 levels maximum.

#### Code Quality

- **L-13 (MUST)** Always use `===` and `!==` instead of `==` and `!=` (except
  when checking for null/undefined).
- **L-14 (MUST)** Never use `eval()` or implied eval (new Function, setTimeout
  with string).
- **L-15 (MUST)** Always include curly braces for if/else/for/while blocks, even
  for single statements.
- **L-16 (MUST)** Use dot notation for property access when possible (`obj.prop`
  not `obj['prop']`).
- **L-17 (MUST)** Every switch statement must have a default case.
- **L-18 (MUST)** Async functions must always await something; never declare
  empty async functions.
- **L-19 (MUST)** Never use `return await` (return the promise directly).
- **L-20 (SHOULD)** Avoid magic numbers; extract to named constants.

#### Best Practices

- **L-21 (MUST)** Import each module only once per file.
- **L-22 (SHOULD)** Use template literals instead of string concatenation.
- **L-23 (SHOULD)** Use object/array destructuring when accessing multiple
  properties.
- **L-24 (SHOULD)** Use object shorthand notation (`{ name }` instead of
  `{ name: name }`).
- **L-25 (SHOULD)** Use spread operator instead of `apply()` or manual array
  copying.
- **L-26 (SHOULD)** Use rest parameters instead of `arguments` object.
- **L-27 (MUST)** Never reassign function parameters (reading is OK).
- **L-28 (MUST)** Reject promises with Error objects, not primitives.

#### Error Prevention

- **L-29 (MUST)** Never leave unreachable code after
  return/throw/break/continue.
- **L-30 (MUST)** Never create loops that are guaranteed unreachable.
- **L-31 (MUST)** Always have at least one case in switch statements.
- **L-32 (SHOULD)** Return consistent types from all branches of a function.
- **L-33 (WARN)** Be cautious with await inside loops; consider Promise.all()
  instead.
- **L-34 (MUST)** Always handle caught errors; never have empty catch blocks.
- **L-35 (MUST)** Throw Error objects, not primitives or strings.

#### Complexity Limits

- **L-36 (WARN)** Cyclomatic complexity should not exceed 10.
- **L-37 (WARN)** Maximum nesting depth: 4 levels.
- **L-38 (WARN)** Maximum callback nesting: 3 levels.
- **L-39 (WARN)** Maximum function parameters: 5 parameters.

#### Project-Specific

- **L-40 (MUST)** `console.log` is allowed in server-side code for logging
  purposes.
- **L-41 (MUST)** Never use `alert()`, `confirm()`, or `prompt()` in server
  code.
- **L-42 (MUST)** Never commit code with `debugger` statements.

#### Ignored Files

The following patterns are ignored by ESLint:

- `node_modules/`
- `coverage/`
- `dist/` and `build/`
- `*.min.js` files
- `.env*` files (except `.env.example`)

#### Running Linting

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

#### Pre-commit Checklist

Before committing code, ensure:

1. ✅ `npm run lint` passes with no errors
2. ✅ `npm run format:check` passes
3. ✅ `npm test` passes
4. ✅ No `console.log` left in production code (unless intentional logging)
5. ✅ No commented-out code blocks
6. ✅ All `_` prefixed variables are truly unused

---

### 7 - Git

- **GH-1 (MUST)** Use Conventional Commits format when writing commit messages:
  https://www.conventionalcommits.org/en/v1.0.0
- **GH-2 (SHOULD NOT)** Refer to Claude or Anthropic in commit messages.

---

## Writing Functions Best Practices

When evaluating whether a function you implemented is good or not, use this
checklist:

1. Can you read the function and HONESTLY easily follow what it's doing? If yes,
   then stop here.
2. Does the function have very high cyclomatic complexity? (number of
   independent paths, or, in a lot of cases, number of nesting if if-else as a
   proxy). If it does, then it's probably sketchy.
3. Are there any common data structures and algorithms that would make this
   function much easier to follow and more robust? Parsers, trees, stacks /
   queues, etc.
4. Are there any unused parameters in the function?
5. Are there any unnecessary type casts that can be moved to function arguments?
6. Is the function easily testable without mocking core features (e.g. model API
   calls, external services, etc.)? If not, can this function be tested as part
   of an integration test?
7. Does it have any hidden untested dependencies or any values that can be
   factored out into the arguments instead? Only care about non-trivial
   dependencies that can actually change or affect the function.
8. Brainstorm 3 better function names and see if the current name is the best,
   consistent with rest of codebase.

IMPORTANT: you SHOULD NOT refactor out a separate function unless there is a
compelling need, such as:

- the refactored function is used in more than one place
- the refactored function is easily unit testable while the original function is
  not AND you can't test it any other way
- the original function is extremely hard to follow and you resort to putting
  comments everywhere just to explain it

## Writing Tests Best Practices

When evaluating whether a test you've implemented is good or not, use this
checklist:

1. SHOULD parameterize inputs; never embed unexplained literals such as 42 or
   "foo" directly in the test.
2. SHOULD NOT add a test unless it can fail for a real defect. Trivial asserts
   (e.g., expect(2).toBe(2)) are forbidden.
3. SHOULD ensure the test description states exactly what the final expect
   verifies. If the wording and assert don't align, rename or rewrite.
4. SHOULD compare results to independent, pre-computed expectations or to
   properties of the domain, never to the function's output re-used as the
   oracle.
5. SHOULD follow the same lint, type-safety, and style rules as prod code
   (prettier, ESLint, strict types).
6. SHOULD express invariants or axioms (e.g., commutativity, idempotence,
   round-trip) rather than single hard-coded cases whenever practical.
7. Unit tests for a function should be grouped under
   `describe(functionName, () => ...`.
8. Use `expect.any(...)` when testing for parameters that can be anything (e.g.
   variable ids).
9. ALWAYS use strong assertions over weaker ones e.g. `expect(x).toEqual(1)`
   instead of `expect(x).toBeGreaterThanOrEqual(1)`.
10. SHOULD test edge cases, realistic input, unexpected input, and value
    boundaries.
11. SHOULD NOT test conditions that are caught by linting or basic syntax
    checking.

## Code Organization

- **Backend**: `src/server.js` - Express.js API server
- **Services**: `src/services/` - AI model integration and business logic
- **Routes**: `src/routes/` - API endpoint definitions
- **Middleware**: `src/middleware/` - Express middleware functions
- **Database**: `src/db/` - Database migrations, schemas, and queries
- **Utils**: `src/utils/` - Shared utility functions
- **Scripts**: `scripts/` - Deployment and utility scripts
- **Docker**: `docker/` - Container configurations
- **Tests**: `tests/` - Integration and end-to-end tests

## Waste Compliance Specific Guidelines

### Domain Terminology

Use EPA and industry-standard terminology consistently:

- **Generator**: Entity that produces hazardous waste (hospital, factory, etc.)
- **Waste Profile**: 100+ page document describing waste composition and
  properties
- **RCRA**: Resource Conservation and Recovery Act (federal law)
- **Manifest**: Federal tracking document for waste shipment
- **TSDF**: Treatment, Storage, and Disposal Facility
- **Waste Code**: EPA hazardous waste classification code (e.g., D001, F001)
- **EHS Director**: Environmental, Health, and Safety director (primary user)

### Compliance & Safety

- **CS-1 (MUST)** Never auto-approve waste profiles without human review
  checkpoint.
- **CS-2 (MUST)** Log all AI decisions with full audit trail (who, what, when,
  why).
- **CS-3 (MUST)** Validate all EPA waste codes against official RCRA database.
- **CS-4 (MUST)** Flag any potential compliance risks for immediate human
  review.
- **CS-5 (SHOULD)** Include confidence scores for all AI classifications.
- **CS-6 (MUST)** Never delete historical compliance records.

### Model Integration

- Always check `AI_MODEL_ENDPOINT` configuration before making API calls
- Handle streaming and non-streaming responses appropriately
- Implement proper error handling for model API failures
- Use appropriate timeouts for different types of requests
- For document analysis, use models with long context windows (Claude, GPT-4)

### Performance

- Use streaming responses for long-form content generation
- Implement caching for frequently accessed waste codes and facility data
- Monitor and log model response times and errors
- Cache EPA waste code lookups

### Security

- Validate all user inputs before sending to model
- Implement rate limiting to prevent abuse
- Use proper authentication for model endpoint access
- Never log sensitive client data (chemical formulas, facility names) in plain
  text
- Encrypt all waste profile documents at rest and in transit

## AI Operations (AIOps) Best Practices

### 8 — Instrumentation & Logging

- **I-1 (MUST)** Log all AI prompts, outputs, and costs with trace IDs for
  debugging.
- **I-2 (MUST)** Sanitize PII from logs before storing (emails, SSNs, IDs).
- **I-3 (SHOULD)** Track per-model metrics: request count, token usage, latency,
  cost.
- **I-4 (MUST)** Include model name, temperature, and token limits in prompt
  logs.
- **I-5 (SHOULD)** Calculate and log costs using current model pricing.

### 9 — Evaluation & Testing

- **E-1 (MUST)** Maintain offline test sets for regression testing AI outputs.
- **E-2 (SHOULD)** Run A/B tests when comparing model versions or prompts.
- **E-3 (MUST)** Define success criteria and thresholds for each test case.
- **E-4 (SHOULD)** Use domain-specific evaluation metrics (e.g., EPA code
  accuracy).
- **E-5 (SHOULD)** Record A/B test results before declaring a winner (min 100
  samples).

### 10 — Safety & Filtering

- **S-1 (MUST)** Filter inputs for jailbreak attempts before sending to model.
- **S-2 (MUST)** Detect and scrub PII from both inputs and outputs.
- **S-3 (SHOULD)** Assess toxicity/harmful content in user inputs.
- **S-4 (MUST)** Log all safety violations with severity levels.
- **S-5 (SHOULD)** Maintain allow/deny lists for sensitive topics.

### 11 — Reliability

- **R-1 (MUST)** Implement exponential backoff retry logic for transient
  failures.
- **R-2 (SHOULD)** Cache expensive AI operations with appropriate TTL.
- **R-3 (SHOULD)** Use shadow deployments to test new models without user
  impact.
- **R-4 (MUST)** Set timeouts for all model API calls.
- **R-5 (SHOULD)** Batch requests when possible to improve throughput.

### 12 — Lifecycle Management

- **L-1 (MUST)** Monitor model drift by tracking accuracy/confidence over time.
- **L-2 (SHOULD)** Define retraining triggers (e.g., accuracy drops >15%).
- **L-3 (MUST)** Establish baseline metrics with initial 100+ samples.
- **L-4 (SHOULD)** Check drift at regular intervals (e.g., every 5 minutes).
- **L-5 (MUST)** Alert when retraining triggers activate.

### 13 — Cost & Performance Optimization

- **O-1 (MUST)** Set daily/monthly cost budgets and enforce them.
- **O-2 (SHOULD)** Route requests to appropriate models based on complexity.
- **O-3 (SHOULD)** Use cheaper/faster models for simple tasks.
- **O-4 (MUST)** Track cost per request and optimize expensive operations.
- **O-5 (SHOULD)** Implement request batching to reduce API overhead.

### 14 — Agent Orchestration

- **A-1 (MUST)** Define workflows as declarative step configurations.
- **A-2 (SHOULD)** Support retry logic per-step for resilient workflows.
- **A-3 (SHOULD)** Execute independent agents in parallel when possible.
- **A-4 (MUST)** Log execution traces with step-level granularity.
- **A-5 (SHOULD)** Provide execution status endpoints for monitoring.

## Remember Shortcuts

### QNEW

When I type "qnew", this means:

```
Understand all BEST PRACTICES listed in CLAUDE.md.
Your code SHOULD ALWAYS follow these best practices.
```

### QPLAN

When I type "qplan", this means:

```
Analyze similar parts of the codebase and determine whether your plan:
- is consistent with rest of codebase
- introduces minimal changes
- reuses existing code
```

### QCODE

When I type "qcode", this means:

```
Implement your plan and make sure your new tests pass.
Always run tests to make sure you didn't break anything else.
Always run `prettier` on the newly created files to ensure standard formatting.
Always run `npm run lint` to make sure linting passes.
```

### QCHECK

When I type "qcheck", this means:

```
You are a SKEPTICAL senior software engineer.
Perform this analysis for every MAJOR code change you introduced (skip minor changes):

1. CLAUDE.md checklist Writing Functions Best Practices.
2. CLAUDE.md checklist Writing Tests Best Practices.
3. CLAUDE.md checklist Implementation Best Practices.
```

### QCHECKF

When I type "qcheckf", this means:

```
You are a SKEPTICAL senior software engineer.
Perform this analysis for every MAJOR function you added or edited (skip minor changes):

1. CLAUDE.md checklist Writing Functions Best Practices.
```

### QCHECKT

When I type "qcheckt", this means:

```
You are a SKEPTICAL senior software engineer.
Perform this analysis for every MAJOR test you added or edited (skip minor changes):

1. CLAUDE.md checklist Writing Tests Best Practices.
```

### QUX

When I type "qux", this means:

```
Imagine you are a human UX tester of the feature you implemented.
Output a comprehensive list of scenarios you would test, sorted by highest priority.
```

### QGIT

When I type "qgit", this means:

```
Add all changes to staging, create a commit, and push to remote.

Follow this checklist for writing your commit message:
- SHOULD use Conventional Commits format: https://www.conventionalcommits.org/en/v1.0.0
- SHOULD NOT refer to Claude or Anthropic in the commit message.
- SHOULD structure commit message as follows:
<type>[optional scope]: <description>
[optional body]
[optional footer(s)]
```

---

## Session Journal System

### Purpose

The Session Journal System tracks development progress across sessions to
maintain context when switching between tasks or resuming work. It automatically
captures commits, work in progress, and future tasks.

### When to Use

**SHOULD** use the journal system:

- At the start of each development session
- When making significant progress on a feature
- Before switching context to another task
- When planning future work
- At the end of each development session

**MUST** use the journal system:

- For any work spanning multiple sessions
- When collaborating and need to hand off context
- When working on complex features requiring planning

### Workflow Integration

#### Starting a Session

```bash
# 1. Start a new session
npm run journal:start

# 2. Review previous session (if resuming work)
npm run journal:list
npm run journal:status

# 3. Plan today's work
npm run journal:needed "Add validation to manifest endpoints"
npm run journal:needed "Write integration tests for facility matcher"
```

#### During Development

```bash
# Log when you start working on something
npm run journal:started "Implementing rate limiting middleware"

# After making commits, sync them to journal
git commit -m "feat: add rate limiting"
npm run journal:sync

# Mark items complete when done
npm run journal:complete:started <id>

# Add notes about important decisions
npm run journal:note "Using sliding window algorithm for rate limiting"
```

#### Ending a Session

```bash
# 1. Sync final commits
npm run journal:sync

# 2. Review what was accomplished
npm run journal:status

# 3. Plan next steps
npm run journal:needed "Add rate limit configuration to environment"
npm run journal:needed "Document rate limiting in API docs"

# 4. End session
npm run journal:end
```

### Best Practices

#### Journal Entry Guidelines

- **J-1 (SHOULD)** Start and end journal sessions for each work period
- **J-2 (SHOULD)** Sync commits immediately after pushing to remote
- **J-3 (SHOULD)** Use specific, actionable descriptions for started/needed
  items
- **J-4 (SHOULD)** Add notes for important architectural decisions
- **J-5 (SHOULD)** Review journal status before ending a session
- **J-6 (SHOULD)** Mark items as complete immediately after finishing them
- **J-7 (SHOULD NOT)** Use vague descriptions like "Working on API" or "Fix
  bugs"

#### Description Format

Good examples:

```bash
# ✅ Specific and actionable
npm run journal:started "Adding rate limiting to /api/auth endpoints"
npm run journal:needed "Write unit tests for wasteClassifier edge cases"
npm run journal:note "Chose bcrypt over argon2 due to better ecosystem support"
```

Bad examples:

```bash
# ❌ Too vague
npm run journal:started "Working on authentication"
npm run journal:needed "Add tests"
npm run journal:note "Made some changes"
```

### Command Reference

| Command                    | Purpose              | Example                                      |
| -------------------------- | -------------------- | -------------------------------------------- |
| `journal:start`            | Start new session    | `npm run journal:start`                      |
| `journal:end`              | End current session  | `npm run journal:end`                        |
| `journal:status`           | Show current session | `npm run journal:status`                     |
| `journal:list`             | List all sessions    | `npm run journal:list`                       |
| `journal:started`          | Log work in progress | `npm run journal:started "description"`      |
| `journal:needed`           | Log future work      | `npm run journal:needed "description"`       |
| `journal:note`             | Add session note     | `npm run journal:note "decision or context"` |
| `journal:sync`             | Sync git commits     | `npm run journal:sync`                       |
| `journal:complete:started` | Mark started as done | `npm run journal:complete:started <id>`      |
| `journal:complete:needed`  | Mark needed as done  | `npm run journal:complete:needed <id>`       |
| `journal:help`             | Show help            | `npm run journal:help`                       |

### Integration with Development Workflow

The journal system integrates with existing shortcuts:

**QCODE** (when implementing):

```bash
# After running tests and linting
npm run journal:sync  # Sync any commits made
npm run journal:complete:started <id>  # Mark feature complete
```

**QGIT** (when committing):

```bash
git add .
git commit -m "feat: add feature X"
git push
npm run journal:sync  # Automatically capture commit in journal
```

### Data Storage

- Journal data stored in `.journal/sessions.json`
- **NOT** committed to git (in `.gitignore`)
- User-specific development history
- Safe to share with team if needed (contains no sensitive data)

### Documentation

For complete documentation, see
[docs/SESSION_JOURNAL.md](./docs/SESSION_JOURNAL.md)
