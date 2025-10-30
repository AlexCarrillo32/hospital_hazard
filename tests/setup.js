// Jest test setup file
// Ensure NODE_ENV is set to 'test' for all tests
process.env.NODE_ENV = 'test';

// Set default test environment variables
process.env.AI_MOCK_MODE = 'true';
process.env.PORT = '0'; // Use random port for tests

// Run migrations before all tests
import knex from 'knex';
import knexConfig from '../knexfile.js';
import fs from 'fs';

let db;

beforeAll(async () => {
  // Remove existing test database if it exists
  if (fs.existsSync('./test.sqlite3')) {
    fs.unlinkSync('./test.sqlite3');
  }

  // Initialize database connection
  db = knex(knexConfig.test);

  // Run migrations
  await db.migrate.latest();
});

afterAll(async () => {
  // Clean up database connection
  if (db) {
    await db.destroy();
  }

  // Remove test database file
  if (fs.existsSync('./test.sqlite3')) {
    fs.unlinkSync('./test.sqlite3');
  }
});
