/**
 * Tests for app/auth/callback/route.ts
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

/* ── mocks ── */

const mockExchangeCodeForSession = jest.fn().mockResolvedValue({})
const mockGetUser = jest.fn()
const mockUpsert = jest.fn().mockResolvedValue({ error: null })
const mockEq = jest.fn().mockReturnThis()
const mockFrom = jest.fn().mockImplementation(() => ({
  upsert: mockUpsert,
  select: jest.fn().mockReturnValue({ eq: mockEq }),
}))

const mockSupabase = {
  auth: {
    exchangeCodeForSession: mockExchangeCodeForSession,
    getUser: mockGetUser,
  },
  from: mockFrom,
}

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(() => mockSupabase),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

const mockRedirect = jest.fn().mockImplementation((url: URL) => ({
  status: 302,
  headers: { location: url.toString() },
}))

jest.mock('next/server', () => ({
  NextResponse: { redirect: (url: URL) => mockRedirect(url) },
}))

/* ── import after mocks ── */

import { GET } from '../app/auth/callback/route'
import type { NextRequest } from 'next/server'

/* ── reset ── */

beforeEach(() => {
  jest.clearAllMocks()
})

/* ── tests ── */

describe('Auth callback route', () => {
  it('exchanges code for session and syncs user profile', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          user_metadata: { avatar_url: 'https://img.com/a.png', username: 'testuser' },
        },
      },
    })

    const request = {
      url: 'http://localhost:3000/auth/callback?code=auth-code-123',
    } as NextRequest

    await GET(request)

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('auth-code-123')
    expect(mockGetUser).toHaveBeenCalled()
    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(mockUpsert).toHaveBeenCalledWith(
      { id: 'user-1', avatar_url: 'https://img.com/a.png', username: 'testuser' },
      { onConflict: 'id' }
    )
    expect(mockRedirect).toHaveBeenCalled()
  })

  it('uses email prefix when username is not in metadata', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-2',
          email: 'john@example.com',
          user_metadata: {},
        },
      },
    })

    const request = { url: 'http://localhost:3000/auth/callback?code=code2' } as NextRequest
    await GET(request)

    expect(mockUpsert).toHaveBeenCalledWith(
      { id: 'user-2', avatar_url: null, username: 'john' },
      { onConflict: 'id' }
    )
  })

  it('redirects to /boards when no code is present', async () => {
    const request = { url: 'http://localhost:3000/auth/callback' } as NextRequest
    await GET(request)
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled()
    expect(mockRedirect).toHaveBeenCalled()
  })

  it('handles case when getUser returns no user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const request = { url: 'http://localhost:3000/auth/callback?code=code3' } as NextRequest
    await GET(request)

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('code3')
    expect(mockUpsert).not.toHaveBeenCalled()
    expect(mockRedirect).toHaveBeenCalled()
  })
})
