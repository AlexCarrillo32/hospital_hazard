# Session Journal System

Track your development progress across sessions with the built-in journal
system.

---

## Overview

The Session Journal System helps you:

- **Track commits**: Automatically sync git commits to your current session
- **Log started work**: Record what you're currently working on
- **Plan future work**: Document what needs to be done next
- **Add notes**: Capture important decisions and context
- **Review progress**: See what was accomplished in previous sessions

All journal data is stored in `.journal/sessions.json` (not committed to git).

---

## Quick Start

### 1. Start a New Session

```bash
npm run journal:start
```

Output:

```
📓 New session started
Session ID: 1706234567890
Branch: main
Time: 1/25/2025, 2:30:45 PM
```

### 2. Track Your Work

```bash
# Log something you started working on
npm run journal:started "Implementing user authentication"

# Log something that needs to be done
npm run journal:needed "Add input validation to API endpoints"

# Add a note
npm run journal:note "Decided to use JWT instead of sessions"
```

### 3. Sync Git Commits

```bash
npm run journal:sync
```

This will automatically pull recent git commits into your session.

### 4. Check Status

```bash
npm run journal:status
```

Output:

```
📓 Current Session Status
========================

Session ID: 1706234567890
Branch: main
Started: 1/25/2025, 2:30:45 PM

📝 COMMITS:
  ✓ abc1234 - feat: add user authentication middleware
    John Doe, 2 hours ago

🚀 STARTED:
  ⏳ [1706234567891] Implementing user authentication

📋 NEEDED:
  ❌ [1706234567892] Add input validation to API endpoints

💭 NOTES:
[2025-01-25T14:35:00.000Z] Decided to use JWT instead of sessions
```

### 5. Mark Items as Complete

```bash
# Mark a "started" item as done (use the ID from journal:status)
npm run journal:complete:started 1706234567891

# Mark a "needed" item as done
npm run journal:complete:needed 1706234567892
```

### 6. End Session

```bash
npm run journal:end
```

---

## Complete Command Reference

### Session Management

| Command                  | Description                  |
| ------------------------ | ---------------------------- |
| `npm run journal:start`  | Start a new session          |
| `npm run journal:end`    | End current session          |
| `npm run journal:status` | Show current session details |
| `npm run journal:list`   | List all sessions            |

### Adding Items

| Command                                   | Example                                            |
| ----------------------------------------- | -------------------------------------------------- |
| `npm run journal:started "<description>"` | `npm run journal:started "Building API endpoints"` |
| `npm run journal:needed "<description>"`  | `npm run journal:needed "Write integration tests"` |
| `npm run journal:note "<text>"`           | `npm run journal:note "Changed database schema"`   |

### Completing Items

| Command                                 | Example                                          |
| --------------------------------------- | ------------------------------------------------ |
| `npm run journal:complete:started <id>` | `npm run journal:complete:started 1706234567891` |
| `npm run journal:complete:needed <id>`  | `npm run journal:complete:needed 1706234567892`  |

### Utilities

| Command                | Description                         |
| ---------------------- | ----------------------------------- |
| `npm run journal:sync` | Sync git commits to current session |
| `npm run journal:help` | Show help message                   |

---

## Typical Workflow

### Starting Your Day

```bash
# 1. Start a new session
npm run journal:start

# 2. Sync any commits made offline
npm run journal:sync

# 3. Check previous session's status
npm run journal:list

# 4. Review what needs to be done
npm run journal:status
```

### During Development

```bash
# Log what you're working on
npm run journal:started "Implementing rate limiting middleware"

# After making a commit
git commit -m "feat: add rate limiting"
npm run journal:sync

# Mark completed work
npm run journal:complete:started <id>

# Add notes about important decisions
npm run journal:note "Using sliding window algorithm for rate limiting"

# Plan future work
npm run journal:needed "Add rate limit configuration to environment variables"
```

### End of Day

```bash
# 1. Sync final commits
npm run journal:sync

# 2. Review what was accomplished
npm run journal:status

# 3. Plan tomorrow's work
npm run journal:needed "Write unit tests for rate limiter"
npm run journal:needed "Update API documentation"

# 4. End session
npm run journal:end
```

---

## Use Cases

### 1. Context Switching

When switching between multiple features or projects:

```bash
# Before switching away
npm run journal:status  # Review current state
npm run journal:needed "Continue implementing webhook handlers"
npm run journal:end

# When switching back
npm run journal:start
npm run journal:list    # See previous sessions
npm run journal:status  # Resume where you left off
```

### 2. Collaboration Handoff

Before handing off work to another developer:

```bash
npm run journal:status > handoff.txt
# Share handoff.txt with team member
```

### 3. Daily Standup Preparation

Generate talking points for standup:

```bash
# Yesterday's work
npm run journal:list

# Today's plan
npm run journal:status
```

### 4. Progress Tracking

Track progress over time:

```bash
# View all sessions
npm run journal:list

# See detailed history
cat .journal/sessions.json
```

---

## Data Structure

The journal stores sessions in `.journal/sessions.json`:

```json
{
  "sessions": [
    {
      "id": 1706234567890,
      "startTime": "2025-01-25T14:30:45.000Z",
      "endTime": "2025-01-25T18:45:00.000Z",
      "branch": "main",
      "commits": [
        {
          "hash": "abc1234",
          "message": "feat: add user authentication",
          "author": "John Doe",
          "date": "2 hours ago"
        }
      ],
      "started": [
        {
          "id": 1706234567891,
          "description": "Implementing rate limiting",
          "timestamp": "2025-01-25T15:00:00.000Z",
          "completed": true,
          "completedAt": "2025-01-25T16:30:00.000Z"
        }
      ],
      "needed": [
        {
          "id": 1706234567892,
          "description": "Add input validation",
          "timestamp": "2025-01-25T15:30:00.000Z",
          "completed": false
        }
      ],
      "notes": "\n[2025-01-25T15:45:00.000Z] Using express-rate-limit library"
    }
  ]
}
```

---

## Integration with CI/CD

You can integrate journal entries into your commit messages or PR descriptions:

### Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Auto-sync commits after each commit
npm run journal:sync
```

### Commit Message Template

Use journal status in commit messages:

```bash
# Get current work items
npm run journal:status

# Use them in commit message
git commit -m "feat: implement rate limiting

Related to session work:
- Implementing rate limiting middleware
- Add configuration for rate limits"
```

---

## Tips and Best Practices

### 1. Be Specific with Descriptions

```bash
# ❌ Too vague
npm run journal:started "Working on API"

# ✅ Specific and actionable
npm run journal:started "Adding rate limiting to /api/auth endpoints"
```

### 2. Use Notes for Context

Document why, not just what:

```bash
npm run journal:note "Chose bcrypt over argon2 due to better ecosystem support"
```

### 3. Regularly Sync Commits

Sync after each commit to maintain accurate history:

```bash
git commit -m "feat: add authentication"
npm run journal:sync
```

### 4. Review Before Ending

Always check status before ending a session:

```bash
npm run journal:status  # Ensure nothing is missed
npm run journal:end
```

### 5. Plan Tomorrow Today

Before ending, add items for next session:

```bash
npm run journal:needed "Write integration tests for auth flow"
npm run journal:needed "Update API documentation"
npm run journal:end
```

---

## Troubleshooting

### No Active Session

**Error**: `❌ No active session. Start one with: npm run journal:start`

**Solution**: Start a new session:

```bash
npm run journal:start
```

### Git Commands Failing

**Error**: Git commands return empty results

**Solution**: Ensure you're in a git repository:

```bash
git status  # Verify git is working
cd /path/to/waste-compliance-agent
npm run journal:start
```

### Journal File Corrupted

**Error**: `SyntaxError: Unexpected token in JSON`

**Solution**: Reset journal file:

```bash
# Backup corrupted file
mv .journal/sessions.json .journal/sessions.json.backup

# Start fresh
npm run journal:start
```

### Can't Find Item ID

**Problem**: Need to complete an item but don't know the ID

**Solution**: Run status to see all IDs:

```bash
npm run journal:status
# Look for [ID] next to each item
```

---

## Advanced Usage

### Export Session Data

```bash
# Export current session to file
npm run journal:status > session-report.txt

# Export all sessions
cat .journal/sessions.json | jq '.' > all-sessions.json
```

### Filter Sessions by Branch

```bash
# View sessions for specific branch
cat .journal/sessions.json | jq '.sessions[] | select(.branch=="feature/auth")'
```

### Calculate Total Time

```bash
# Get total development time across all sessions
cat .journal/sessions.json | jq '[.sessions[] | select(.endTime) |
  (((.endTime | fromdateiso8601) - (.startTime | fromdateiso8601)) / 3600)] | add'
```

---

## Security Considerations

- Journal files are stored locally in `.journal/` directory
- **Not committed to git** (added to `.gitignore`)
- Contains no sensitive data (only commit messages and work descriptions)
- Safe to share with team members if needed

---

## Backup and Restore

### Backup Journal

```bash
# Backup journal to safe location
cp -r .journal ~/backups/waste-compliance-journal-$(date +%Y%m%d)
```

### Restore Journal

```bash
# Restore from backup
cp -r ~/backups/waste-compliance-journal-20250125/.journal .
```

---

## Keyboard Shortcuts (Optional)

Add these aliases to your `.bashrc` or `.zshrc` for faster access:

```bash
# Session management
alias js='npm run journal:start'
alias je='npm run journal:end'
alias jst='npm run journal:status'
alias jl='npm run journal:list'

# Adding items
alias jstart='npm run journal:started'
alias jneed='npm run journal:needed'
alias jnote='npm run journal:note'

# Utilities
alias jsync='npm run journal:sync'
```

Usage:

```bash
js                                      # Start session
jstart "Implementing webhooks"          # Log started work
jsync                                   # Sync commits
jst                                     # Check status
je                                      # End session
```

---

## Related Documentation

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment instructions
- [INTEGRATION_CHECKLIST.md](./INTEGRATION_CHECKLIST.md) - Integration guide
- [PRODUCTION_SECURITY_CHECKLIST.md](./PRODUCTION_SECURITY_CHECKLIST.md) -
  Security checklist

---

## Support

For issues or feature requests related to the journal system, please open an
issue in the project repository.

---

**Last Updated**: 2025-01-25
