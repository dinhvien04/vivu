/**
 * Jest config for `@vivu/api`. Đặt root = repo của app, scan `src/**` cho
 * `*.spec.ts`. Sử dụng `ts-jest` để compile TypeScript inline; module resolution
 * giữ giống `tsconfig.json` (CommonJS, Node).
 */
/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.module.ts', '!src/**/dto/*.ts', '!src/main.ts'],
  coverageDirectory: '<rootDir>/coverage',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
};
