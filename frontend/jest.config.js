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
    '!src/shared/lib/apollo-client.ts',
    '!src/features/*/gql/**',
    '!src/features/*/constants/**',
    '!src/features/*/types.ts',
    '!src/features/dashboard/utils/**',
    '!src/features/dashboard/components/dashboard-*.tsx',
    '!src/features/dashboard/components/create-*.tsx',
    '!src/features/dashboard/components/goal-chart.tsx',
    '!src/features/dashboard/components/goal-color-picker.tsx',
    '!src/features/dashboard/components/goal-details-panel.tsx',
    '!src/features/dashboard/components/goals-list.tsx',
    '!src/features/dashboard/hooks/useGoals.ts',
    '!src/features/dashboard/hooks/useGoalDetails.ts',
    '!src/features/feedback/**',
    '!src/features/landing/**',
    '!src/features/profile/components/profile-client.tsx',
    '!src/features/profile/components/ImportProgressCard.tsx',
    '!src/features/profile/hooks/**',
    '!src/features/profile/utils/**',
    '!src/features/admin/**',
    '!src/shared/components/header.tsx',
    '!src/shared/components/footer.tsx',
    '!src/shared/components/page-container.tsx',
    '!src/shared/components/providers.tsx',
    '!src/shared/components/app-theme-provider.tsx',
    '!src/shared/components/toast-viewport.tsx',
    '!src/shared/lib/analytics.ts',
    '!src/shared/lib/toast-store.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 85,
      functions: 79,
      lines: 90,
    },
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
};

module.exports = createJestConfig(customJestConfig);
