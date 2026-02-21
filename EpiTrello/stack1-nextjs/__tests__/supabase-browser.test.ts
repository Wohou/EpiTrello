/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  })),
}))

describe('supabase-browser', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('should export getSupabaseBrowserClient function', () => {
    const mod = require('../lib/supabase-browser')
    expect(mod.getSupabaseBrowserClient).toBeDefined()
    expect(typeof mod.getSupabaseBrowserClient).toBe('function')
  })

  it('should export supabaseBrowser convenience export', () => {
    const mod = require('../lib/supabase-browser')
    expect(mod.supabaseBrowser).toBeDefined()
  })

  it('should return same instance on multiple calls (singleton)', () => {
    const mod = require('../lib/supabase-browser')
    const client1 = mod.getSupabaseBrowserClient()
    const client2 = mod.getSupabaseBrowserClient()
    expect(client1).toBe(client2)
  })
})
