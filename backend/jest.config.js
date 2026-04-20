/** @type {import('jest').Config} */
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-that-is-at-least-32-characters-long';

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      diagnostics: { ignoreCodes: [151002] },
    }],
  },
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/graphql-docs.ts',
    '!src/email.ts',
    '!src/schema.ts',
    '!src/db/**',
    '!src/scripts/**',
    '!src/modules/auth/user.repository.ts',
    '!src/modules/auth/types.ts',
    '!src/modules/goals/goal.repository.ts',
    '!src/modules/goals/operation.repository.ts',
    '!src/modules/goals/types.ts',
    '!src/modules/proposals/proposal.repository.ts',
    '!src/modules/analytics/analytics.repository.ts',
    '!src/**/__tests__/**',
  ],
};
