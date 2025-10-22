# Waste Compliance Agent - Development Guidelines

## Implementation Best Practices

### 0 — Purpose

These rules ensure maintainability, safety, and developer velocity for the Waste Compliance & Logistics AI Agent.
**MUST** rules are enforced by CI; **SHOULD** rules are strongly recommended.

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
- **C-5 (MUST)** Use `import type { … }` for type-only imports when using TypeScript.
- **C-6 (SHOULD NOT)** Add comments except for critical caveats; rely on self‑explanatory code.
- **C-7 (SHOULD NOT)** Extract a new function unless it will be reused elsewhere, is the only way to unit-test otherwise untestable logic, or drastically improves readability of an opaque block.

---

### 3 — Testing

- **T-1 (MUST)** For a simple function, colocate unit tests in `*.test.js` in same directory as source file.
- **T-2 (MUST)** For any API change, add/extend integration tests in `tests/` directory.
- **T-3 (MUST)** ALWAYS separate pure-logic unit tests from external API-touching integration tests.
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

- **AI-1 (MUST)** Always handle model endpoint failures gracefully with meaningful error messages.
- **AI-2 (MUST)** Implement proper timeout handling for all model API calls.
- **AI-3 (SHOULD)** Use streaming responses for better user experience with long generations.
- **AI-4 (MUST)** Validate all input parameters before sending to model endpoint.
- **AI-5 (SHOULD)** Implement retry logic for transient model API failures.

---

### 5 — Code Organization

- **O-1 (MUST)** Place shared utilities in `src/utils/` directory.
- **O-2 (MUST)** Separate AI service logic from HTTP routing logic.
- **O-3 (MUST)** Keep deployment configurations in `docker/` and `scripts/` directories.

---

### 6 — Tooling Gates

- **G-1 (MUST)** `prettier --check` passes.
- **G-2 (MUST)** `npm run lint` passes.
- **G-3 (MUST)** `npm test` passes.
- **G-4 (SHOULD)** `npm run typecheck` passes when using TypeScript.

---

### 7 - Git

- **GH-1 (MUST)** Use Conventional Commits format when writing commit messages: https://www.conventionalcommits.org/en/v1.0.0
- **GH-2 (SHOULD NOT)** Refer to Claude or Anthropic in commit messages.

---

## Writing Functions Best Practices

When evaluating whether a function you implemented is good or not, use this checklist:

1. Can you read the function and HONESTLY easily follow what it's doing? If yes, then stop here.
2. Does the function have very high cyclomatic complexity? (number of independent paths, or, in a lot of cases, number of nesting if if-else as a proxy). If it does, then it's probably sketchy.
3. Are there any common data structures and algorithms that would make this function much easier to follow and more robust? Parsers, trees, stacks / queues, etc.
4. Are there any unused parameters in the function?
5. Are there any unnecessary type casts that can be moved to function arguments?
6. Is the function easily testable without mocking core features (e.g. model API calls, external services, etc.)? If not, can this function be tested as part of an integration test?
7. Does it have any hidden untested dependencies or any values that can be factored out into the arguments instead? Only care about non-trivial dependencies that can actually change or affect the function.
8. Brainstorm 3 better function names and see if the current name is the best, consistent with rest of codebase.

IMPORTANT: you SHOULD NOT refactor out a separate function unless there is a compelling need, such as:

- the refactored function is used in more than one place
- the refactored function is easily unit testable while the original function is not AND you can't test it any other way
- the original function is extremely hard to follow and you resort to putting comments everywhere just to explain it

## Writing Tests Best Practices

When evaluating whether a test you've implemented is good or not, use this checklist:

1. SHOULD parameterize inputs; never embed unexplained literals such as 42 or "foo" directly in the test.
2. SHOULD NOT add a test unless it can fail for a real defect. Trivial asserts (e.g., expect(2).toBe(2)) are forbidden.
3. SHOULD ensure the test description states exactly what the final expect verifies. If the wording and assert don't align, rename or rewrite.
4. SHOULD compare results to independent, pre-computed expectations or to properties of the domain, never to the function's output re-used as the oracle.
5. SHOULD follow the same lint, type-safety, and style rules as prod code (prettier, ESLint, strict types).
6. SHOULD express invariants or axioms (e.g., commutativity, idempotence, round-trip) rather than single hard-coded cases whenever practical.
7. Unit tests for a function should be grouped under `describe(functionName, () => ...`.
8. Use `expect.any(...)` when testing for parameters that can be anything (e.g. variable ids).
9. ALWAYS use strong assertions over weaker ones e.g. `expect(x).toEqual(1)` instead of `expect(x).toBeGreaterThanOrEqual(1)`.
10. SHOULD test edge cases, realistic input, unexpected input, and value boundaries.
11. SHOULD NOT test conditions that are caught by linting or basic syntax checking.

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
- **Waste Profile**: 100+ page document describing waste composition and properties
- **RCRA**: Resource Conservation and Recovery Act (federal law)
- **Manifest**: Federal tracking document for waste shipment
- **TSDF**: Treatment, Storage, and Disposal Facility
- **Waste Code**: EPA hazardous waste classification code (e.g., D001, F001)
- **EHS Director**: Environmental, Health, and Safety director (primary user)

### Compliance & Safety

- **CS-1 (MUST)** Never auto-approve waste profiles without human review checkpoint.
- **CS-2 (MUST)** Log all AI decisions with full audit trail (who, what, when, why).
- **CS-3 (MUST)** Validate all EPA waste codes against official RCRA database.
- **CS-4 (MUST)** Flag any potential compliance risks for immediate human review.
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
- Never log sensitive client data (chemical formulas, facility names) in plain text
- Encrypt all waste profile documents at rest and in transit

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
