import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  forceExit: true,        // Prevents jest from hanging after tests due to app.listen
  clearMocks: true,       // Auto-clears mock state between tests
  verbose: true,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        strict: false,
        strictNullChecks: false,
        exactOptionalPropertyTypes: false,
        esModuleInterop: true,
        module: 'commonjs',
      },
    }],
  },
};

export default config;