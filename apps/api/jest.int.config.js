/**
 * Jest config cho integration test. Khác `jest.config.js` ở:
 *
 * - `testRegex` chỉ match `*.int.spec.ts` trong `test/integration/**`.
 * - `globalSetup` / `globalTeardown` start/stop PostgreSQL container (testcontainers)
 *   với image `postgis/postgis:15-3.4` — đã có cả PostGIS lẫn pg_trgm.
 * - `testTimeout` 60s vì pull image lần đầu có thể chậm.
 * - `runInBand` (ép qua CLI) để các test dùng chung container không stomp lên nhau.
 */
/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testRegex: 'test/integration/.*\\.int\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  globalSetup: '<rootDir>/test/integration/global-setup.ts',
  globalTeardown: '<rootDir>/test/integration/global-teardown.ts',
  testTimeout: 60_000,
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
};
