export default {
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: ['**/*.test.js'],
  transform: {},
  moduleFileExtensions: ['js', 'json'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  maxWorkers: 1, // Run tests serially to avoid SQLite file locking issues
};
