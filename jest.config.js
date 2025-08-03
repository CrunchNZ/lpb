module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/frontend/index.tsx',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/frontend/components/$1',
    '^@/pages/(.*)$': '<rootDir>/src/frontend/pages/$1',
    '^@/store/(.*)$': '<rootDir>/src/frontend/store/$1',
    '^@/backend/(.*)$': '<rootDir>/src/backend/$1',
    '^@/utils/(.*)$': '<rootDir>/src/backend/utils/$1',
    '^@/strategies/(.*)$': '<rootDir>/src/backend/strategies/$1',
    '^@/integrations/(.*)$': '<rootDir>/src/backend/integrations/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
  verbose: true,
}; 