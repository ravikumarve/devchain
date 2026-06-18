/**
 * Jest configuration for DevChain Backend
 * Uses jsdom-like node environment for Express testing
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/*.test.js',
    '**/*.spec.js',
  ],
  setupFiles: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
  },
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
};
