// Jest test setup file
// Ensure NODE_ENV is set to 'test' for all tests
process.env.NODE_ENV = 'test';

// Set default test environment variables
process.env.AI_MOCK_MODE = 'true';
process.env.PORT = '0'; // Use random port for tests
