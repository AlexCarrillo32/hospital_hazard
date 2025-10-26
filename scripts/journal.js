#!/usr/bin/env node

/**
 * Session Journal System
 *
 * Tracks development progress across sessions:
 * - Commits: What was completed and committed
 * - Started: Work in progress
 * - Needed: Future requirements and next steps
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const JOURNAL_DIR = path.join(PROJECT_ROOT, '.journal');
const JOURNAL_FILE = path.join(JOURNAL_DIR, 'sessions.json');

// Ensure journal directory exists
if (!fs.existsSync(JOURNAL_DIR)) {
  fs.mkdirSync(JOURNAL_DIR, { recursive: true });
}

/**
 * Load journal data from file
 */
function loadJournal() {
  if (!fs.existsSync(JOURNAL_FILE)) {
    return { sessions: [] };
  }
  try {
    const data = fs.readFileSync(JOURNAL_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { sessions: [] };
  }
}

/**
 * Save journal data to file
 */
function saveJournal(journal) {
  fs.writeFileSync(JOURNAL_FILE, JSON.stringify(journal, null, 2));
}

/**
 * Get recent git commits
 */
function getRecentCommits(count = 5) {
  try {
    const output = execSync(
      `git -C "${PROJECT_ROOT}" log -${count} --pretty=format:"%h|%s|%an|%ar"`,
      { encoding: 'utf-8' }
    );
    return output
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const [hash, message, author, date] = line.split('|');
        return { hash, message, author, date };
      });
  } catch {
    return [];
  }
}

/**
 * Get current git branch
 */
function getCurrentBranch() {
  try {
    return execSync(`git -C "${PROJECT_ROOT}" branch --show-current`, {
      encoding: 'utf-8',
    }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Start a new session
 */
function startSession() {
  const journal = loadJournal();
  const session = {
    id: Date.now(),
    startTime: new Date().toISOString(),
    branch: getCurrentBranch(),
    commits: [],
    started: [],
    needed: [],
    notes: '',
  };

  journal.sessions.unshift(session);
  saveJournal(journal);

  console.log('\n📓 New session started');
  console.log(`Session ID: ${session.id}`);
  console.log(`Branch: ${session.branch}`);
  console.log(`Time: ${new Date(session.startTime).toLocaleString()}\n`);

  return session.id;
}

/**
 * End current session
 */
function endSession() {
  const journal = loadJournal();
  if (journal.sessions.length === 0) {
    console.log('❌ No active session found');
    return;
  }

  const session = journal.sessions[0];
  session.endTime = new Date().toISOString();

  saveJournal(journal);

  console.log('\n📓 Session ended');
  console.log(`Session ID: ${session.id}`);
  console.log(`Duration: ${calculateDuration(session.startTime, session.endTime)}\n`);
}

/**
 * Add item to current session
 */
function addItem(category, description) {
  const journal = loadJournal();
  if (journal.sessions.length === 0) {
    console.log('❌ No active session. Start one with: npm run journal:start');
    return;
  }

  const session = journal.sessions[0];
  const item = {
    id: Date.now(),
    description,
    timestamp: new Date().toISOString(),
  };

  if (!session[category]) {
    session[category] = [];
  }

  session[category].push(item);
  saveJournal(journal);

  console.log(`\n✅ Added to ${category}: ${description}\n`);
}

/**
 * Mark item as completed
 */
function completeItem(category, itemId) {
  const journal = loadJournal();
  if (journal.sessions.length === 0) {
    console.log('❌ No active session found');
    return;
  }

  const session = journal.sessions[0];
  const items = session[category] || [];
  const item = items.find((i) => i.id === parseInt(itemId));

  if (!item) {
    console.log(`❌ Item ${itemId} not found in ${category}`);
    return;
  }

  item.completed = true;
  item.completedAt = new Date().toISOString();
  saveJournal(journal);

  console.log(`\n✅ Marked as completed: ${item.description}\n`);
}

/**
 * Add note to current session
 */
function addNote(note) {
  const journal = loadJournal();
  if (journal.sessions.length === 0) {
    console.log('❌ No active session. Start one with: npm run journal:start');
    return;
  }

  const session = journal.sessions[0];
  const timestamp = new Date().toISOString();
  session.notes += `\n[${timestamp}] ${note}`;
  saveJournal(journal);

  console.log(`\n✅ Note added\n`);
}

/**
 * Sync commits from git history
 */
function syncCommits() {
  const journal = loadJournal();
  if (journal.sessions.length === 0) {
    console.log('❌ No active session. Start one with: npm run journal:start');
    return;
  }

  const session = journal.sessions[0];
  const commits = getRecentCommits(10);

  // Filter commits made during this session
  const sessionCommits = commits.filter((commit) => {
    // If session has no commits yet, include all recent commits
    if (session.commits.length === 0) {
      return true;
    }

    // Otherwise, only include commits not already in session
    return !session.commits.some((c) => c.hash === commit.hash);
  });

  if (sessionCommits.length === 0) {
    console.log('✅ No new commits to sync\n');
    return;
  }

  session.commits.unshift(...sessionCommits);
  saveJournal(journal);

  console.log(`\n✅ Synced ${sessionCommits.length} commit(s)\n`);
  sessionCommits.forEach((commit) => {
    console.log(`  ${commit.hash} - ${commit.message}`);
  });
  console.log();
}

/**
 * Display current session status
 */
function showStatus() {
  const journal = loadJournal();
  if (journal.sessions.length === 0) {
    console.log('\n❌ No active session. Start one with: npm run journal:start\n');
    return;
  }

  const session = journal.sessions[0];

  console.log('\n📓 Current Session Status');
  console.log('========================\n');
  console.log(`Session ID: ${session.id}`);
  console.log(`Branch: ${session.branch}`);
  console.log(`Started: ${new Date(session.startTime).toLocaleString()}`);
  if (session.endTime) {
    console.log(`Ended: ${new Date(session.endTime).toLocaleString()}`);
    console.log(`Duration: ${calculateDuration(session.startTime, session.endTime)}`);
  }

  // Commits
  console.log('\n📝 COMMITS:');
  if (session.commits.length === 0) {
    console.log('  (none)');
  } else {
    session.commits.forEach((commit) => {
      console.log(`  ✓ ${commit.hash} - ${commit.message}`);
      console.log(`    ${commit.author}, ${commit.date}`);
    });
  }

  // Started (Work in Progress)
  console.log('\n🚀 STARTED:');
  const startedItems = session.started || [];
  if (startedItems.length === 0) {
    console.log('  (none)');
  } else {
    startedItems.forEach((item) => {
      const status = item.completed ? '✓' : '⏳';
      console.log(`  ${status} [${item.id}] ${item.description}`);
      if (item.completed) {
        console.log(`    Completed: ${new Date(item.completedAt).toLocaleString()}`);
      }
    });
  }

  // Needed (Future Work)
  console.log('\n📋 NEEDED:');
  const neededItems = session.needed || [];
  if (neededItems.length === 0) {
    console.log('  (none)');
  } else {
    neededItems.forEach((item) => {
      const status = item.completed ? '✓' : '❌';
      console.log(`  ${status} [${item.id}] ${item.description}`);
      if (item.completed) {
        console.log(`    Completed: ${new Date(item.completedAt).toLocaleString()}`);
      }
    });
  }

  // Notes
  if (session.notes && session.notes.trim()) {
    console.log('\n💭 NOTES:');
    console.log(session.notes.trim());
  }

  console.log();
}

/**
 * List all sessions
 */
function listSessions(limit = 10) {
  const journal = loadJournal();

  if (journal.sessions.length === 0) {
    console.log('\n❌ No sessions found\n');
    return;
  }

  console.log('\n📓 Recent Sessions');
  console.log('==================\n');

  journal.sessions.slice(0, limit).forEach((session, index) => {
    const active = index === 0 && !session.endTime ? '🟢' : '⚪';
    console.log(`${active} Session ${session.id}`);
    console.log(`   Branch: ${session.branch}`);
    console.log(`   Started: ${new Date(session.startTime).toLocaleString()}`);
    if (session.endTime) {
      console.log(`   Ended: ${new Date(session.endTime).toLocaleString()}`);
      console.log(`   Duration: ${calculateDuration(session.startTime, session.endTime)}`);
    }
    console.log(`   Commits: ${session.commits?.length || 0}`);
    console.log(`   Started: ${session.started?.length || 0}`);
    console.log(`   Needed: ${session.needed?.length || 0}`);
    console.log();
  });
}

/**
 * Calculate duration between two timestamps
 */
function calculateDuration(start, end) {
  const ms = new Date(end) - new Date(start);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

/**
 * Display help
 */
function showHelp() {
  console.log(`
📓 Session Journal System
========================

Usage: npm run journal:<command> [arguments]

Commands:
  start              Start a new session
  end                End current session
  status             Show current session status
  list               List all sessions

  commit             Add a commit entry (description)
  started <desc>     Add a "started" item
  needed <desc>      Add a "needed" item
  note <text>        Add a note to current session

  complete:started <id>   Mark started item as completed
  complete:needed <id>    Mark needed item as completed

  sync               Sync git commits to current session

Examples:
  npm run journal:start
  npm run journal:started "Implementing session journal system"
  npm run journal:needed "Add database migrations"
  npm run journal:sync
  npm run journal:status
  npm run journal:complete:started 1234567890
  npm run journal:note "Fixed linting errors"
  npm run journal:end
  npm run journal:list

Journal data is stored in: .journal/sessions.json
`);
}

// CLI handler
const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case 'start':
    startSession();
    break;
  case 'end':
    endSession();
    break;
  case 'status':
    showStatus();
    break;
  case 'list':
    listSessions();
    break;
  case 'started':
    addItem('started', args.join(' '));
    break;
  case 'needed':
    addItem('needed', args.join(' '));
    break;
  case 'note':
    addNote(args.join(' '));
    break;
  case 'complete:started':
    completeItem('started', args[0]);
    break;
  case 'complete:needed':
    completeItem('needed', args[0]);
    break;
  case 'sync':
    syncCommits();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    console.log(`\n❌ Unknown command: ${command}\n`);
    showHelp();
    process.exit(1);
}
