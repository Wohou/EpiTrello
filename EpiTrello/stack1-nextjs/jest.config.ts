import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Ignore build folders and node_modules
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],

  // For the coverage, we collect info on these files
  collectCoverage: true,
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!app/**/layout.tsx',
    '!app/**/page.tsx',
    '!components/ui/**',
    '!lib/utils.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/vendor/**',
  ],
  coverageReporters: ['text', 'text-summary', 'json-summary', 'lcov', 'cobertura'],
}

export default createJestConfig(config)
