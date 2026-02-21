import '@testing-library/jest-dom'

// Silence console.error, console.warn, and console.log during tests.
// Using beforeEach so it's re-applied even after jest.restoreAllMocks().
const noop = () => {}
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(noop)
  jest.spyOn(console, 'warn').mockImplementation(noop)
  jest.spyOn(console, 'log').mockImplementation(noop)
})
