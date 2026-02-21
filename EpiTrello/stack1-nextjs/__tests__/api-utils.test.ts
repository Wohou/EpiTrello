/* eslint-disable @typescript-eslint/no-explicit-any */
// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({ body, status: init?.status || 200 })),
  },
}))

import { requireAuth, getGitHubIdentity, getGitHubToken } from '../lib/api-utils'

describe('api-utils', () => {
  describe('requireAuth', () => {
    it('should return user when authenticated', async () => {
      const mockUser = { id: 'user-1', email: 'test@test.com' }
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      } as any

      const result = await requireAuth(mockSupabase)
      expect(result.user).toEqual(mockUser)
      expect(result.error).toBeNull()
    })

    it('should return 401 error when auth fails', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      } as any

      const result = await requireAuth(mockSupabase)
      expect(result.user).toBeNull()
      expect(result.error).toBeDefined()
    })

    it('should return 401 error when no user', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      } as any

      const result = await requireAuth(mockSupabase)
      expect(result.user).toBeNull()
      expect(result.error).toBeDefined()
    })
  })

  describe('getGitHubIdentity', () => {
    it('should return github identity when found', async () => {
      const githubIdentity = { provider: 'github', id: 'gh-123' }
      const mockSupabase = {
        auth: {
          getUserIdentities: jest.fn().mockResolvedValue({
            data: {
              identities: [
                { provider: 'google', id: 'g-1' },
                githubIdentity,
              ],
            },
          }),
        },
      } as any

      const result = await getGitHubIdentity(mockSupabase)
      expect(result).toEqual(githubIdentity)
    })

    it('should return undefined when no github identity', async () => {
      const mockSupabase = {
        auth: {
          getUserIdentities: jest.fn().mockResolvedValue({
            data: {
              identities: [{ provider: 'google', id: 'g-1' }],
            },
          }),
        },
      } as any

      const result = await getGitHubIdentity(mockSupabase)
      expect(result).toBeUndefined()
    })

    it('should handle null identities data', async () => {
      const mockSupabase = {
        auth: {
          getUserIdentities: jest.fn().mockResolvedValue({
            data: null,
          }),
        },
      } as any

      const result = await getGitHubIdentity(mockSupabase)
      expect(result).toBeUndefined()
    })
  })

  describe('getGitHubToken', () => {
    it('should return provider_token when session exists', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: { provider_token: 'ghp_abc123' },
            },
          }),
        },
      } as any

      const result = await getGitHubToken(mockSupabase)
      expect(result).toBe('ghp_abc123')
    })

    it('should return null when no session', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
          }),
        },
      } as any

      const result = await getGitHubToken(mockSupabase)
      expect(result).toBeNull()
    })

    it('should return null when no provider_token', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: { provider_token: null },
            },
          }),
        },
      } as any

      const result = await getGitHubToken(mockSupabase)
      expect(result).toBeNull()
    })
  })
})
