import { themes, type ThemeKey, type Theme } from '../lib/themes'

describe('themes', () => {
  it('should export themes object', () => {
    expect(themes).toBeDefined()
    expect(typeof themes).toBe('object')
  })

  it('should have all expected theme keys', () => {
    const expectedKeys = ['default', 'purple', 'sunset', 'forest', 'ocean', 'rose', 'dark', 'mint']
    expect(Object.keys(themes).sort()).toEqual(expectedKeys.sort())
  })

  describe.each(Object.entries(themes))('theme: %s', (key, theme) => {
    it('should have a name', () => {
      expect(theme.name).toBeDefined()
      expect(typeof theme.name).toBe('string')
      expect(theme.name.length).toBeGreaterThan(0)
    })

    it('should have a background gradient', () => {
      expect(theme.background).toBeDefined()
      expect(theme.background).toContain('linear-gradient')
    })

    it('should have a primary color', () => {
      expect(theme.primary).toBeDefined()
      expect(theme.primary).toMatch(/^#[0-9a-fA-F]{6}$/)
    })

    it('should have a secondary color', () => {
      expect(theme.secondary).toBeDefined()
      expect(theme.secondary).toMatch(/^#[0-9a-fA-F]{6}$/)
    })

    it('should have an accent color', () => {
      expect(theme.accent).toBeDefined()
      expect(theme.accent).toMatch(/^#[0-9a-fA-F]{6}$/)
    })
  })

  it('should support ThemeKey type', () => {
    const key: ThemeKey = 'default'
    expect(key).toBe('default')
  })

  it('should support Theme type', () => {
    const theme: Theme = themes.default
    expect(theme.name).toBeDefined()
    expect(theme.background).toBeDefined()
    expect(theme.primary).toBeDefined()
    expect(theme.secondary).toBeDefined()
    expect(theme.accent).toBeDefined()
  })

  it('default theme should have blue gradient', () => {
    expect(themes.default.name).toBe('Gradient Bleu')
    expect(themes.default.primary).toBe('#4286f4')
  })

  it('dark theme should have night gradient', () => {
    expect(themes.dark.name).toBe('Nuit Étoilée')
  })
})
