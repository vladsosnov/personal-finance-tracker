const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).[jt]s?(x)',
    '**/*.(test|spec).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__generated__/**',
    '!src/**/__tests__/**',
    '!src/app/**',
    '!src/middleware.ts',
    '!src/features/*/gql/**',
    '!src/features/*/constants/**',
    '!src/features/*/types.ts',
    '!src/features/profile/utils/**',
    '!src/features/admin/**',
    '!src/shared/lib/apollo-client.ts',
    '!src/shared/constants/**',
    '!src/shared/gql/**',
    '!src/shared/components/header.tsx',
    '!src/shared/components/footer.tsx',
    '!src/shared/components/page-container.tsx',
    '!src/shared/components/providers.tsx',
    '!src/shared/components/app-theme-provider.tsx',
    '!src/shared/components/toast-viewport.tsx',
    '!src/shared/lib/analytics.ts',
    '!src/shared/lib/toast-store.ts',
    '!src/shared/components/register-sw.tsx',
  ],
  coverageThreshold: {
    global: {
      statements: 85,
      branches: 77,
      functions: 80,
      lines: 90,
    },
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
};

module.exports = createJestConfig(customJestConfig);
