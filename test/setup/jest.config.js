module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Root directory
  rootDir: '../../',
  
  // Test match patterns
  testMatch: [
    '<rootDir>/test/**/*.test.ts',
    '<rootDir>/test/**/*.test.tsx'
  ],
  
  // Transform TypeScript files
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', {
      tsconfig: {
        compilerOptions: {
          module: 'commonjs',
          target: 'es2020',
          lib: ['es2020'],
          moduleResolution: 'node',
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          skipLibCheck: true,
          strict: true,
          jsx: 'react-jsx'
        }
      }
    }]
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Module name mapping for path aliases
  moduleNameMapping: {
    '^@vivu/types$': '<rootDir>/packages/types/src/index.ts',
    '^@/(.*)$': '<rootDir>/apps/web/src/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/test/setup/jest.setup.ts'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'apps/api/src/**/*.{ts,tsx}',
    'apps/web/src/**/*.{ts,tsx}',
    'packages/types/src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.config.{js,ts}',
    '!**/main.ts'
  ],
  
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Projects for different test types
  projects: [
    {
      displayName: 'API Unit Tests',
      testMatch: ['<rootDir>/test/api/**/*.test.ts'],
      testEnvironment: 'node'
    },
    {
      displayName: 'Web Unit Tests', 
      testMatch: ['<rootDir>/test/web/**/*.test.{ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/test/setup/jest.setup.ts']
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/test/integration/**/*.test.ts'],
      testEnvironment: 'node'
    }
  ]
};