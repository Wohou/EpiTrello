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
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts', // Not definition files
    '!src/**/layout.tsx', // Hard to unit test
    '!src/**/page.tsx',   // Hard to unit test
  ],
}

export default createJestConfig(config)
