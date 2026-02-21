/**
 * Comprehensive tests for Next.js App Router API routes (Part 2):
 *   - /api/boards/[id]            (GET, PUT, DELETE)
 *   - /api/boards/[id]/labels     (GET, POST, DELETE)
 *   - /api/boards/[id]/members    (GET, DELETE)
 *   - /api/boards/[id]/statuses   (GET, POST, DELETE)
 *   - /api/cards/[id]/activity    (GET, POST)
 *   - /api/cards/[id]/assignments (GET, POST)
 *   - /api/cards/[id]/comments    (GET, POST, PUT, DELETE)
 *   - /api/cards/[id]/log         (GET)
 *   - /api/cards/reorder          (PUT)
 *   - /api/lists/reorder          (PUT)
 *   - /api/cards/upload           (POST)
 *   - /api/cards/[id]/images      (GET, DELETE)
 *   - /api/invitations            (GET, POST)
 *   - /api/invitations/[id]       (PUT, DELETE)
 *   - /api/github/connect         (GET, POST, DELETE)
 *   - /api/github/token           (GET)
 *   - /api/cards/[id]/github      (GET, POST, DELETE, PATCH)
 *   - /api/cards/[id]/sync-github (POST)
 *   - /api/webhooks/github        (POST)
 */

/* ------------------------------------------------------------------ */
/*  Environment variables                                             */
/* ------------------------------------------------------------------ */

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.GITHUB_WEBHOOK_SECRET = 'test-webhook-secret'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

/* ------------------------------------------------------------------ */
/*  Mocks – must be declared before any import that touches them      */
/* ------------------------------------------------------------------ */

let mockResult: { data: unknown; error: unknown; count?: number } = { data: null, error: null }

const chainable = () => {
  const obj: Record<string, jest.Mock> = {}
  const methods = [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'in', 'order', 'single', 'maybeSingle', 'limit', 'contains',
  ]
  methods.forEach((m) => {
    obj[m] = jest.fn().mockImplementation(() => ({
      ...obj,
      then: (cb: (v: unknown) => void) => cb(mockResult),
    }))
  })
  return obj
}

const mockFrom = jest.fn().mockImplementation(() => chainable())
const mockGetUser = jest.fn()
const mockGetSession = jest.fn()
const mockGetUserIdentities = jest.fn()
const mockUnlinkIdentity = jest.fn()

const mockStorageUpload = jest.fn().mockResolvedValue({ error: null })
const mockStorageGetPublicUrl = jest.fn().mockReturnValue({
  data: { publicUrl: 'https://storage.example.com/test.png' },
})
const mockStorageFrom = jest.fn().mockReturnValue({
  upload: mockStorageUpload,
  getPublicUrl: mockStorageGetPublicUrl,
})

const mockSupabase = {
  from: mockFrom,
  auth: {
    getUser: mockGetUser,
    getSession: mockGetSession,
    getUserIdentities: mockGetUserIdentities,
    unlinkIdentity: mockUnlinkIdentity,
  },
  storage: { from: mockStorageFrom },
}

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(() => mockSupabase),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

// Mock api-utils
const mockRequireAuth = jest.fn()
const mockGetGitHubIdentity = jest.fn()
const mockGetGitHubToken = jest.fn()

jest.mock('../lib/api-utils', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  getGitHubIdentity: (...args: unknown[]) => mockGetGitHubIdentity(...args),
  getGitHubToken: (...args: unknown[]) => mockGetGitHubToken(...args),
}))

// Mock nodemailer (used by email-service)
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  })),
}))

// Mock email-service
jest.mock('../lib/email-service', () => ({
  notifyCommentAdded: jest.fn().mockResolvedValue(undefined),
  notifyCardAssignment: jest.fn().mockResolvedValue(undefined),
  notifyCardMoved: jest.fn().mockResolvedValue(undefined),
}))

// Mock github-utils
const mockUpdateCardCompletion = jest.fn().mockResolvedValue(undefined)
jest.mock('../lib/github-utils', () => ({
  updateCardCompletion: (...args: unknown[]) => mockUpdateCardCompletion(...args),
}))

// Mock global fetch for GitHub API calls
const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

// NextRequest / NextResponse mock
jest.mock('next/server', () => {
  class FakeNextRequest {
    nextUrl: URL
    url: string
    _rawBody: string | undefined
    _body: unknown
    _formDataStore: unknown
    _headersMap: Map<string, string>

    constructor(
      url: string,
      init?: { method?: string; body?: string; headers?: Record<string, string> }
    ) {
      this.url = url
      this.nextUrl = new URL(url)
      this._rawBody = init?.body
      this._body = init?.body ? JSON.parse(init.body) : undefined
      this._headersMap = new Map(
        Object.entries(init?.headers || {}).map(([k, v]) => [k.toLowerCase(), v])
      )
      this._formDataStore = null
    }

    async json() {
      return this._body
    }
    async text() {
      return this._rawBody || ''
    }
    async formData() {
      return this._formDataStore
    }
    get headers() {
      const m = this._headersMap
      return { get: (key: string) => m.get(key.toLowerCase()) || null }
    }
  }

  return {
    NextRequest: FakeNextRequest,
    NextResponse: {
      json: jest.fn((body: unknown, init?: { status?: number }) => ({
        json: async () => body,
        status: init?.status ?? 200,
        body,
      })),
    },
  }
})

/* ------------------------------------------------------------------ */
/*  Imports (after mocks)                                             */
/* ------------------------------------------------------------------ */

import { NextRequest } from 'next/server'
import crypto from 'crypto'

// Board routes
import {
  GET as boardByIdGET,
  PUT as boardByIdPUT,
  DELETE as boardByIdDELETE,
} from '../app/api/boards/[id]/route'

import {
  GET as labelsGET,
  POST as labelsPOST,
  DELETE as labelsDELETE,
} from '../app/api/boards/[id]/labels/route'

import {
  GET as membersGET,
  DELETE as membersDELETE,
} from '../app/api/boards/[id]/members/route'

import {
  GET as statusesGET,
  POST as statusesPOST,
  DELETE as statusesDELETE,
} from '../app/api/boards/[id]/statuses/route'

// Card sub-routes
import {
  GET as activityGET,
  POST as activityPOST,
} from '../app/api/cards/[id]/activity/route'

import {
  GET as assignmentsGET,
  POST as assignmentsPOST,
} from '../app/api/cards/[id]/assignments/route'

import {
  GET as commentsGET,
  POST as commentsPOST,
  PUT as commentsPUT,
  DELETE as commentsDELETE,
} from '../app/api/cards/[id]/comments/route'

import { GET as cardLogGET } from '../app/api/cards/[id]/log/route'

import { PUT as cardsReorderPUT } from '../app/api/cards/reorder/route'
import { PUT as listsReorderPUT } from '../app/api/lists/reorder/route'

import { POST as cardsUploadPOST } from '../app/api/cards/upload/route'

import {
  GET as cardImagesGET,
  DELETE as cardImagesDELETE,
} from '../app/api/cards/[id]/images/route'

// Invitations
import {
  GET as invitationsGET,
  POST as invitationsPOST,
} from '../app/api/invitations/route'

import {
  PUT as invitationByIdPUT,
  DELETE as invitationByIdDELETE,
} from '../app/api/invitations/[id]/route'

// GitHub
import {
  GET as githubConnectGET,
  POST as githubConnectPOST,
  DELETE as githubConnectDELETE,
} from '../app/api/github/connect/route'

import { GET as githubTokenGET } from '../app/api/github/token/route'

import {
  GET as cardGithubGET,
  POST as cardGithubPOST,
  DELETE as cardGithubDELETE,
  PATCH as cardGithubPATCH,
} from '../app/api/cards/[id]/github/route'

import { POST as syncGithubPOST } from '../app/api/cards/[id]/sync-github/route'

import { POST as webhookGithubPOST } from '../app/api/webhooks/github/route'

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const MOCK_USER = { id: 'user-123', email: 'test@example.com', user_metadata: { user_name: 'testuser' } }

function authenticateUser(user = MOCK_USER) {
  mockGetUser.mockResolvedValue({ data: { user }, error: null })
}

function denyAuth() {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad' } })
}

/** Configure requireAuth mock for routes that use @/lib/api-utils */
function requireAuthSuccess(user = MOCK_USER) {
  mockRequireAuth.mockResolvedValue({ user, error: null })
}

function requireAuthDeny() {
  mockRequireAuth.mockResolvedValue({
    user: null,
    error: {
      json: async () => ({ error: 'Unauthorized' }),
      status: 401,
      body: { error: 'Unauthorized' },
    },
  })
}

/**
 * Configure what supabase.from(...) chains resolve to.
 * Accepts a single result or an array of { data, error } for sequential queries.
 */
function setQueryResult(dataOrSequence: unknown, error: unknown = null) {
  if (
    Array.isArray(dataOrSequence) &&
    dataOrSequence.length > 0 &&
    typeof dataOrSequence[0] === 'object' &&
    dataOrSequence[0] !== null &&
    'data' in (dataOrSequence[0] as Record<string, unknown>)
  ) {
    const seq = dataOrSequence as { data: unknown; error: unknown; count?: number }[]
    let callIndex = 0
    mockFrom.mockImplementation(() => {
      const result = seq[callIndex] ?? { data: null, error: null }
      callIndex++
      mockResult = result
      return chainable()
    })
  } else {
    mockResult = { data: dataOrSequence, error }
  }
}

function makeReq(
  path: string,
  opts?: { method?: string; body?: unknown; headers?: Record<string, string> }
) {
  return new NextRequest(`http://localhost${path}`, {
    method: opts?.method,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
    headers: opts?.headers,
  }) as unknown as NextRequest
}

/* ------------------------------------------------------------------ */
/*  Reset between tests                                               */
/* ------------------------------------------------------------------ */

beforeEach(() => {
  jest.clearAllMocks()
  mockResult = { data: null, error: null }
  mockFrom.mockImplementation(() => chainable())
  mockFetch.mockReset()
  mockGetSession.mockResolvedValue({ data: { session: null } })
  mockGetUserIdentities.mockResolvedValue({ data: { identities: [] } })
  mockUnlinkIdentity.mockResolvedValue({ error: null })
})

/* ================================================================== */
/*  BOARDS [id]  /api/boards/:id                                      */
/* ================================================================== */

describe('API /api/boards/[id]', () => {
  const params = { params: { id: 'board-1' } }

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/boards/board-1')
      const res = await boardByIdGET(req, params)
      expect(res.status).toBe(401)
    })

    it('returns 404 when board not found', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'not found' })
      const req = makeReq('/api/boards/board-1')
      const res = await boardByIdGET(req, params)
      expect(res.status).toBe(404)
    })

    it('returns board with empty lists for owner', async () => {
      authenticateUser()
      setQueryResult([
        { data: { id: 'board-1', title: 'My Board', owner_id: MOCK_USER.id }, error: null },
        { data: [], error: null }, // lists
      ])
      const req = makeReq('/api/boards/board-1')
      const res = await boardByIdGET(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.id).toBe('board-1')
      expect(json.lists).toEqual([])
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult([
        { data: { id: 'board-1', title: 'B', owner_id: MOCK_USER.id }, error: null },
        { data: null, error: { message: 'db error' } },
      ])
      const req = makeReq('/api/boards/board-1')
      const res = await boardByIdGET(req, params)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to fetch board')
    })
  })

  describe('PUT', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/boards/board-1', { method: 'PUT', body: { title: 'Up' } })
      const res = await boardByIdPUT(req, params)
      expect(res.status).toBe(401)
    })

    it('returns 404 when board not found', async () => {
      authenticateUser()
      setQueryResult([
        { data: null, error: null }, // board query returns null
      ])
      const req = makeReq('/api/boards/board-1', { method: 'PUT', body: { title: 'Up' } })
      const res = await boardByIdPUT(req, params)
      expect(res.status).toBe(404)
    })

    it('updates board title for owner', async () => {
      authenticateUser()
      const updated = { id: 'board-1', title: 'Updated', owner_id: MOCK_USER.id }
      setQueryResult([
        { data: { owner_id: MOCK_USER.id }, error: null }, // board ownership check
        { data: updated, error: null },                      // update
      ])
      const req = makeReq('/api/boards/board-1', { method: 'PUT', body: { title: 'Updated' } })
      const res = await boardByIdPUT(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.title).toBe('Updated')
    })

    it('returns 500 when update throws', async () => {
      authenticateUser()
      setQueryResult([
        { data: { owner_id: MOCK_USER.id }, error: null },
        { data: null, error: { message: 'update error' } },
      ])
      const req = makeReq('/api/boards/board-1', { method: 'PUT', body: { title: 'X' } })
      const res = await boardByIdPUT(req, params)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to update board')
    })
  })

  describe('DELETE', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/boards/board-1')
      const res = await boardByIdDELETE(req, params)
      expect(res.status).toBe(401)
    })

    it('deletes a board and returns success', async () => {
      authenticateUser()
      setQueryResult(null)
      const req = makeReq('/api/boards/board-1')
      const res = await boardByIdDELETE(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('returns 500 when delete throws', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'delete error' })
      const req = makeReq('/api/boards/board-1')
      const res = await boardByIdDELETE(req, params)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to delete board')
    })
  })
})

/* ================================================================== */
/*  BOARD LABELS  /api/boards/:id/labels                              */
/* ================================================================== */

describe('API /api/boards/[id]/labels', () => {
  const params = { params: { id: 'board-1' } }

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/boards/board-1/labels')
      const res = await labelsGET(req, params)
      expect(res.status).toBe(401)
    })

    it('returns labels for a board', async () => {
      authenticateUser()
      const labels = [{ id: 'l1', name: 'Bug', color: '#ff0000', board_id: 'board-1' }]
      setQueryResult(labels)
      const req = makeReq('/api/boards/board-1/labels')
      const res = await labelsGET(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.labels).toHaveLength(1)
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'db error' })
      const req = makeReq('/api/boards/board-1/labels')
      const res = await labelsGET(req, params)
      expect(res.status).toBe(500)
    })
  })

  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/boards/board-1/labels', { method: 'POST', body: { name: 'Bug' } })
      const res = await labelsPOST(req, params)
      expect(res.status).toBe(401)
    })

    it('returns 400 when name is empty', async () => {
      authenticateUser()
      const req = makeReq('/api/boards/board-1/labels', { method: 'POST', body: { name: '  ' } })
      const res = await labelsPOST(req, params)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Name is required')
    })

    it('creates a label and returns it', async () => {
      authenticateUser()
      const label = { id: 'lbl-1', name: 'Feature', color: '#00ff00', board_id: 'board-1' }
      setQueryResult(label)
      const req = makeReq('/api/boards/board-1/labels', {
        method: 'POST',
        body: { name: 'Feature', color: '#00ff00' },
      })
      const res = await labelsPOST(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.label.name).toBe('Feature')
    })

    it('returns 409 on duplicate label', async () => {
      authenticateUser()
      setQueryResult(null, { code: '23505', message: 'duplicate' })
      const req = makeReq('/api/boards/board-1/labels', { method: 'POST', body: { name: 'Bug' } })
      const res = await labelsPOST(req, params)
      expect(res.status).toBe(409)
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'insert error' })
      const req = makeReq('/api/boards/board-1/labels', { method: 'POST', body: { name: 'X' } })
      const res = await labelsPOST(req, params)
      expect(res.status).toBe(500)
    })
  })

  describe('DELETE', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/boards/board-1/labels', { method: 'DELETE', body: { labelId: 'lbl-1' } })
      const res = await labelsDELETE(req, params)
      expect(res.status).toBe(401)
    })

    it('returns 400 when labelId is missing', async () => {
      authenticateUser()
      const req = makeReq('/api/boards/board-1/labels', { method: 'DELETE', body: {} })
      const res = await labelsDELETE(req, params)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Label ID is required')
    })

    it('deletes label and returns success', async () => {
      authenticateUser()
      setQueryResult([
        { data: { name: 'Bug' }, error: null },  // get label name
        { data: null, error: null },               // delete label
        { data: [], error: null },                 // get lists
      ])
      const req = makeReq('/api/boards/board-1/labels', { method: 'DELETE', body: { labelId: 'lbl-1' } })
      const res = await labelsDELETE(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult([
        { data: { name: 'Bug' }, error: null },
        { data: null, error: { message: 'delete error' } },
      ])
      const req = makeReq('/api/boards/board-1/labels', { method: 'DELETE', body: { labelId: 'lbl-1' } })
      const res = await labelsDELETE(req, params)
      expect(res.status).toBe(500)
    })
  })
})

/* ================================================================== */
/*  BOARD MEMBERS  /api/boards/:id/members                            */
/* ================================================================== */

describe('API /api/boards/[id]/members', () => {
  const params = { params: { id: 'board-1' } }

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/boards/board-1/members')
      const res = await membersGET(req, params)
      expect(res.status).toBe(401)
    })

    it('returns members for a board', async () => {
      authenticateUser()
      const board = { owner_id: 'owner-1' }
      const memberCheck = null
      const members: unknown[] = []
      const ownerProfile = { username: 'owner', avatar_url: null }
      setQueryResult([
        { data: board, error: null },
        { data: memberCheck, error: null },
        { data: members, error: null },
        { data: ownerProfile, error: null },
      ])
      const req = makeReq('/api/boards/board-1/members')
      const res = await membersGET(req, params)
      expect(res.status).toBe(200)
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult([
        { data: { owner_id: 'o1' }, error: null },
        { data: null, error: null },
        { data: null, error: { message: 'db error' } },
      ])
      const req = makeReq('/api/boards/board-1/members')
      const res = await membersGET(req, params)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to fetch board members')
    })
  })

  describe('DELETE', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/boards/board-1/members')
      const res = await membersDELETE(req, params)
      expect(res.status).toBe(401)
    })

    it('allows owner to remove a member via userId query param', async () => {
      authenticateUser()
      setQueryResult([
        { data: { owner_id: MOCK_USER.id }, error: null }, // board query
        { data: null, error: null },                         // delete member
      ])
      const req = makeReq('/api/boards/board-1/members?userId=other-user')
      const res = await membersDELETE(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('allows member to leave the board', async () => {
      authenticateUser()
      setQueryResult([
        { data: { owner_id: 'other-owner' }, error: null }, // board (not owner)
        { data: null, error: null },                          // delete self membership
      ])
      const req = makeReq('/api/boards/board-1/members')
      const res = await membersDELETE(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('returns 400 when owner tries to leave', async () => {
      authenticateUser()
      setQueryResult([
        { data: { owner_id: MOCK_USER.id }, error: null },
      ])
      const req = makeReq('/api/boards/board-1/members')
      const res = await membersDELETE(req, params)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toContain('Owner cannot leave')
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult([
        { data: { owner_id: 'other-owner' }, error: null },
        { data: null, error: { message: 'db error' } },
      ])
      const req = makeReq('/api/boards/board-1/members')
      const res = await membersDELETE(req, params)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to remove board member')
    })
  })
})

/* ================================================================== */
/*  BOARD STATUSES  /api/boards/:id/statuses                          */
/* ================================================================== */

describe('API /api/boards/[id]/statuses', () => {
  const params = { params: { id: 'board-1' } }

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/boards/board-1/statuses')
      const res = await statusesGET(req, params)
      expect(res.status).toBe(401)
    })

    it('returns statuses for a board', async () => {
      authenticateUser()
      const statuses = [{ id: 's1', name: 'In Progress', color: '#deebff' }]
      setQueryResult(statuses)
      const req = makeReq('/api/boards/board-1/statuses')
      const res = await statusesGET(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.statuses).toHaveLength(1)
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'db error' })
      const req = makeReq('/api/boards/board-1/statuses')
      const res = await statusesGET(req, params)
      expect(res.status).toBe(500)
    })
  })

  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/boards/board-1/statuses', { method: 'POST', body: { name: 'Done' } })
      const res = await statusesPOST(req, params)
      expect(res.status).toBe(401)
    })

    it('returns 400 when name is empty', async () => {
      authenticateUser()
      const req = makeReq('/api/boards/board-1/statuses', { method: 'POST', body: { name: '' } })
      const res = await statusesPOST(req, params)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Name is required')
    })

    it('creates a status and returns it', async () => {
      authenticateUser()
      const status = { id: 's-new', name: 'Done', color: '#deebff', board_id: 'board-1' }
      setQueryResult(status)
      const req = makeReq('/api/boards/board-1/statuses', {
        method: 'POST',
        body: { name: 'Done', color: '#deebff' },
      })
      const res = await statusesPOST(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.status.name).toBe('Done')
    })

    it('returns 409 on duplicate status', async () => {
      authenticateUser()
      setQueryResult(null, { code: '23505', message: 'duplicate' })
      const req = makeReq('/api/boards/board-1/statuses', { method: 'POST', body: { name: 'Done' } })
      const res = await statusesPOST(req, params)
      expect(res.status).toBe(409)
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'insert error' })
      const req = makeReq('/api/boards/board-1/statuses', { method: 'POST', body: { name: 'X' } })
      const res = await statusesPOST(req, params)
      expect(res.status).toBe(500)
    })
  })

  describe('DELETE', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/boards/board-1/statuses', { method: 'DELETE', body: { statusId: 's1' } })
      const res = await statusesDELETE(req, params)
      expect(res.status).toBe(401)
    })

    it('returns 400 when statusId is missing', async () => {
      authenticateUser()
      const req = makeReq('/api/boards/board-1/statuses', { method: 'DELETE', body: {} })
      const res = await statusesDELETE(req, params)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Status ID is required')
    })

    it('deletes status and returns success', async () => {
      authenticateUser()
      setQueryResult([
        { data: { name: 'Done' }, error: null },  // get status name
        { data: null, error: null },                // delete status
        { data: [{ id: 'list-1' }], error: null },  // get lists
        { data: null, error: null },                // update cards
      ])
      const req = makeReq('/api/boards/board-1/statuses', { method: 'DELETE', body: { statusId: 's1' } })
      const res = await statusesDELETE(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult([
        { data: { name: 'Done' }, error: null },
        { data: null, error: { message: 'delete error' } },
      ])
      const req = makeReq('/api/boards/board-1/statuses', { method: 'DELETE', body: { statusId: 's1' } })
      const res = await statusesDELETE(req, params)
      expect(res.status).toBe(500)
    })
  })
})

/* ================================================================== */
/*  CARD ACTIVITY  /api/cards/:id/activity                            */
/* ================================================================== */

describe('API /api/cards/[id]/activity', () => {
  const params = { params: { id: 'card-1' } }

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/cards/card-1/activity')
      const res = await activityGET(req, params)
      expect(res.status).toBe(401)
    })

    it('returns activities for a card', async () => {
      authenticateUser()
      setQueryResult([
        { data: [{ id: 'a1', card_id: 'card-1', user_id: MOCK_USER.id, action_type: 'created' }], error: null },
        { data: [{ id: MOCK_USER.id, username: 'test', avatar_url: null }], error: null },
      ])
      const req = makeReq('/api/cards/card-1/activity')
      const res = await activityGET(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.activities).toBeDefined()
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'db error' })
      const req = makeReq('/api/cards/card-1/activity')
      const res = await activityGET(req, params)
      expect(res.status).toBe(500)
    })
  })

  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/cards/card-1/activity', { method: 'POST', body: { action_type: 'created' } })
      const res = await activityPOST(req, params)
      expect(res.status).toBe(401)
    })

    it('returns 400 when action_type is missing', async () => {
      authenticateUser()
      const req = makeReq('/api/cards/card-1/activity', { method: 'POST', body: {} })
      const res = await activityPOST(req, params)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('action_type is required')
    })

    it('creates activity and returns 201', async () => {
      authenticateUser()
      const activity = { id: 'act-1', card_id: 'card-1', action_type: 'moved' }
      setQueryResult([
        { data: activity, error: null },                              // insert activity
        { data: { username: 'test', avatar_url: null }, error: null }, // profile
      ])
      const req = makeReq('/api/cards/card-1/activity', {
        method: 'POST',
        body: { action_type: 'moved', action_data: { from: 'A', to: 'B' } },
      })
      const res = await activityPOST(req, params)
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.activity).toBeDefined()
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'insert error' })
      const req = makeReq('/api/cards/card-1/activity', { method: 'POST', body: { action_type: 'x' } })
      const res = await activityPOST(req, params)
      expect(res.status).toBe(500)
    })
  })
})

/* ================================================================== */
/*  CARD ASSIGNMENTS  /api/cards/:id/assignments                      */
/* ================================================================== */

describe('API /api/cards/[id]/assignments', () => {
  const params = { params: { id: 'card-1' } }

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/cards/card-1/assignments')
      const res = await assignmentsGET(req, params)
      expect(res.status).toBe(401)
    })

    it('returns assignments for a card', async () => {
      authenticateUser()
      setQueryResult([
        { data: [{ id: 'a1', card_id: 'card-1', user_id: 'u1' }], error: null },
        { data: { username: 'alice', avatar_url: null }, error: null },
      ])
      const req = makeReq('/api/cards/card-1/assignments')
      const res = await assignmentsGET(req, params)
      expect(res.status).toBe(200)
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'db error' })
      const req = makeReq('/api/cards/card-1/assignments')
      const res = await assignmentsGET(req, params)
      expect(res.status).toBe(500)
    })
  })

  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/cards/card-1/assignments', { method: 'POST', body: { user_id: 'u1' } })
      const res = await assignmentsPOST(req, params)
      expect(res.status).toBe(401)
    })

    it('returns 400 when user_id is missing', async () => {
      authenticateUser()
      const req = makeReq('/api/cards/card-1/assignments', { method: 'POST', body: {} })
      const res = await assignmentsPOST(req, params)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('user_id is required')
    })

    it('assigns user when not already assigned', async () => {
      authenticateUser()
      setQueryResult([
        { data: null, error: null },                           // existing check → null = not assigned
        { data: null, error: null },                           // insert
        { data: [{ id: 'a1', user_id: 'u1', card_id: 'card-1' }], error: null }, // fetch assignments
        { data: { username: 'alice', avatar_url: null }, error: null },            // profile
      ])
      const req = makeReq('/api/cards/card-1/assignments', { method: 'POST', body: { user_id: 'u1' } })
      const res = await assignmentsPOST(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.action).toBe('assigned')
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'insert error' })
      const req = makeReq('/api/cards/card-1/assignments', { method: 'POST', body: { user_id: 'u1' } })
      const res = await assignmentsPOST(req, params)
      expect(res.status).toBe(500)
    })
  })
})

/* ================================================================== */
/*  CARD COMMENTS  /api/cards/:id/comments                            */
/* ================================================================== */

describe('API /api/cards/[id]/comments', () => {
  const params = { params: { id: 'card-1' } }

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/cards/card-1/comments')
      const res = await commentsGET(req, params)
      expect(res.status).toBe(401)
    })

    it('returns comments for a card', async () => {
      authenticateUser()
      setQueryResult([
        { data: [{ id: 'c1', content: 'Hello', user_id: MOCK_USER.id }], error: null },
        { data: { username: 'test', avatar_url: null }, error: null },
      ])
      const req = makeReq('/api/cards/card-1/comments')
      const res = await commentsGET(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.comments).toBeDefined()
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'db error' })
      const req = makeReq('/api/cards/card-1/comments')
      const res = await commentsGET(req, params)
      expect(res.status).toBe(500)
    })
  })

  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/cards/card-1/comments', { method: 'POST', body: { content: 'hi' } })
      const res = await commentsPOST(req, params)
      expect(res.status).toBe(401)
    })

    it('returns 400 when content is empty', async () => {
      authenticateUser()
      const req = makeReq('/api/cards/card-1/comments', { method: 'POST', body: { content: '  ' } })
      const res = await commentsPOST(req, params)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Content is required')
    })

    it('creates a comment and returns 201', async () => {
      authenticateUser()
      const comment = { id: 'cmt-1', content: 'Hello', card_id: 'card-1', user_id: MOCK_USER.id }
      setQueryResult([
        { data: comment, error: null },                              // insert comment
        { data: null, error: null },                                  // log activity
        { data: { username: 'test', avatar_url: null }, error: null }, // profile
      ])
      const req = makeReq('/api/cards/card-1/comments', { method: 'POST', body: { content: 'Hello' } })
      const res = await commentsPOST(req, params)
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.comment.content).toBe('Hello')
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'insert error' })
      const req = makeReq('/api/cards/card-1/comments', { method: 'POST', body: { content: 'hi' } })
      const res = await commentsPOST(req, params)
      expect(res.status).toBe(500)
    })
  })

  describe('PUT', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/cards/card-1/comments', {
        method: 'PUT',
        body: { commentId: 'c1', content: 'edited' },
      })
      const res = await commentsPUT(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when commentId or content missing', async () => {
      authenticateUser()
      const req = makeReq('/api/cards/card-1/comments', { method: 'PUT', body: {} })
      const res = await commentsPUT(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('commentId and content are required')
    })

    it('returns 403 when user is not comment owner', async () => {
      authenticateUser()
      setQueryResult([
        { data: { user_id: 'other-user' }, error: null }, // existing comment belongs to other user
      ])
      const req = makeReq('/api/cards/card-1/comments', {
        method: 'PUT',
        body: { commentId: 'c1', content: 'edited' },
      })
      const res = await commentsPUT(req)
      expect(res.status).toBe(403)
    })

    it('updates comment successfully', async () => {
      authenticateUser()
      const updated = { id: 'c1', content: 'edited', user_id: MOCK_USER.id }
      setQueryResult([
        { data: { user_id: MOCK_USER.id }, error: null },            // ownership check
        { data: updated, error: null },                                // update
        { data: { username: 'test', avatar_url: null }, error: null }, // profile
      ])
      const req = makeReq('/api/cards/card-1/comments', {
        method: 'PUT',
        body: { commentId: 'c1', content: 'edited' },
      })
      const res = await commentsPUT(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.comment.content).toBe('edited')
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult([
        { data: { user_id: MOCK_USER.id }, error: null },
        { data: null, error: { message: 'update error' } },
      ])
      const req = makeReq('/api/cards/card-1/comments', {
        method: 'PUT',
        body: { commentId: 'c1', content: 'edited' },
      })
      const res = await commentsPUT(req)
      expect(res.status).toBe(500)
    })
  })

  describe('DELETE', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/cards/card-1/comments', { method: 'DELETE', body: { commentId: 'c1' } })
      const res = await commentsDELETE(req, params)
      expect(res.status).toBe(401)
    })

    it('returns 400 when commentId is missing', async () => {
      authenticateUser()
      const req = makeReq('/api/cards/card-1/comments', { method: 'DELETE', body: {} })
      const res = await commentsDELETE(req, params)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('commentId is required')
    })

    it('returns 403 when user is not comment owner', async () => {
      authenticateUser()
      setQueryResult([
        { data: { user_id: 'other-user' }, error: null },
      ])
      const req = makeReq('/api/cards/card-1/comments', { method: 'DELETE', body: { commentId: 'c1' } })
      const res = await commentsDELETE(req, params)
      expect(res.status).toBe(403)
    })

    it('deletes comment successfully', async () => {
      authenticateUser()
      setQueryResult([
        { data: { user_id: MOCK_USER.id }, error: null }, // ownership check
        { data: null, error: null },                        // delete
        { data: null, error: null },                        // log activity
      ])
      const req = makeReq('/api/cards/card-1/comments', { method: 'DELETE', body: { commentId: 'c1' } })
      const res = await commentsDELETE(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult([
        { data: { user_id: MOCK_USER.id }, error: null },
        { data: null, error: { message: 'delete error' } },
      ])
      const req = makeReq('/api/cards/card-1/comments', { method: 'DELETE', body: { commentId: 'c1' } })
      const res = await commentsDELETE(req, params)
      expect(res.status).toBe(500)
    })
  })
})

/* ================================================================== */
/*  CARD LOG  /api/cards/:id/log                                      */
/* ================================================================== */

describe('API /api/cards/[id]/log', () => {
  const params = { params: { id: 'card-1' } }

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/cards/card-1/log')
      const res = await cardLogGET(req, params)
      expect(res.status).toBe(401)
    })

    it('returns card log data', async () => {
      authenticateUser()
      setQueryResult([
        { data: { id: 'card-1', created_by: 'u1', last_modified_by: 'u2', created_at: '2025-01-01', updated_at: '2025-01-02' }, error: null },
        { data: [{ id: 'u1', username: 'alice' }, { id: 'u2', username: 'bob' }], error: null },
      ])
      const req = makeReq('/api/cards/card-1/log')
      const res = await cardLogGET(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.created_by).toBe('u1')
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'db error' })
      const req = makeReq('/api/cards/card-1/log')
      const res = await cardLogGET(req, params)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to fetch card log')
    })
  })
})

/* ================================================================== */
/*  CARDS REORDER  /api/cards/reorder                                 */
/* ================================================================== */

describe('API /api/cards/reorder', () => {
  describe('PUT', () => {
    it('reorders cards and returns success', async () => {
      authenticateUser()
      setQueryResult(null)
      const req = makeReq('/api/cards/reorder', {
        method: 'PUT',
        body: { cards: [{ id: 'c1', position: 0, list_id: 'l1' }, { id: 'c2', position: 1, list_id: 'l1' }] },
      })
      const res = await cardsReorderPUT(req as unknown as Request)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/cards/reorder', {
        method: 'PUT',
        body: { cards: [{ id: 'c1', position: 0, list_id: 'l1' }] },
      })
      const res = await cardsReorderPUT(req as unknown as Request)
      expect(res.status).toBe(401)
    })

    it('detects cards moved to a different list and sends notifications', async () => {
      authenticateUser()
      // First from() returns current cards, subsequent calls are updates
      setQueryResult([
        { data: [{ id: 'c1', list_id: 'l1' }, { id: 'c2', list_id: 'l1' }], error: null }, // current cards
        { data: null, error: null }, // update c1
        { data: null, error: null }, // update c2
      ])
      const req = makeReq('/api/cards/reorder', {
        method: 'PUT',
        body: { cards: [{ id: 'c1', position: 0, list_id: 'l2' }, { id: 'c2', position: 1, list_id: 'l1' }] },
      })
      const res = await cardsReorderPUT(req as unknown as Request)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      mockFrom.mockImplementation(() => { throw new Error('reorder error') })
      const req = makeReq('/api/cards/reorder', {
        method: 'PUT',
        body: { cards: [{ id: 'c1', position: 0, list_id: 'l1' }] },
      })
      const res = await cardsReorderPUT(req as unknown as Request)
      expect(res.status).toBe(500)
    })
  })
})

/* ================================================================== */
/*  LISTS REORDER  /api/lists/reorder                                 */
/* ================================================================== */

describe('API /api/lists/reorder', () => {
  describe('PUT', () => {
    it('reorders lists and returns success', async () => {
      authenticateUser()
      setQueryResult(null)
      const req = makeReq('/api/lists/reorder', {
        method: 'PUT',
        body: { lists: [{ id: 'l1', position: 0 }, { id: 'l2', position: 1 }] },
      })
      const res = await listsReorderPUT(req as unknown as Request)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      mockFrom.mockImplementation(() => { throw new Error('reorder error') })
      const req = makeReq('/api/lists/reorder', {
        method: 'PUT',
        body: { lists: [{ id: 'l1', position: 0 }] },
      })
      const res = await listsReorderPUT(req as unknown as Request)
      expect(res.status).toBe(500)
    })
  })
})

/* ================================================================== */
/*  CARDS UPLOAD  /api/cards/upload                                   */
/* ================================================================== */

describe('API /api/cards/upload', () => {
  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/cards/upload', { method: 'POST' }) as unknown as NextRequest & { _formDataStore: unknown }
      req._formDataStore = { get: () => null }
      const res = await cardsUploadPOST(req as unknown as NextRequest)
      expect(res.status).toBe(401)
    })

    it('returns 400 when no file is provided', async () => {
      authenticateUser()
      const req = makeReq('/api/cards/upload', { method: 'POST' }) as unknown as NextRequest & { _formDataStore: unknown }
      req._formDataStore = { get: () => null }
      const res = await cardsUploadPOST(req as unknown as NextRequest)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('No file provided')
    })

    it('returns 400 when file is not an image', async () => {
      authenticateUser()
      const req = makeReq('/api/cards/upload', { method: 'POST' }) as unknown as NextRequest & { _formDataStore: unknown }
      req._formDataStore = {
        get: (key: string) => {
          if (key === 'file') return { type: 'application/pdf', size: 1024, name: 'doc.pdf' }
          if (key === 'cardId') return 'card-1'
          return null
        },
      }
      const res = await cardsUploadPOST(req as unknown as NextRequest)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('File must be an image')
    })

    it('returns 400 when file exceeds 5MB', async () => {
      authenticateUser()
      const req = makeReq('/api/cards/upload', { method: 'POST' }) as unknown as NextRequest & { _formDataStore: unknown }
      req._formDataStore = {
        get: (key: string) => {
          if (key === 'file') return { type: 'image/png', size: 10 * 1024 * 1024, name: 'big.png' }
          if (key === 'cardId') return 'card-1'
          return null
        },
      }
      const res = await cardsUploadPOST(req as unknown as NextRequest)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('File size must be less than 5MB')
    })

    it('uploads image successfully and returns URL', async () => {
      authenticateUser()
      mockStorageUpload.mockResolvedValue({ error: null })
      // Sequential query results: existingImages, insert, card check, update card, allImages
      setQueryResult([
        { data: [{ position: 2 }], error: null },  // existing images
        { data: null, error: null },                // insert
        { data: { cover_image: null }, error: null }, // card with no cover
        { data: null, error: null },                // update card cover
        { data: [{ id: 'img-1', url: 'https://storage.example.com/test.png' }], error: null }, // allImages
      ])
      const req = makeReq('/api/cards/upload', { method: 'POST' }) as unknown as NextRequest & { _formDataStore: unknown }
      req._formDataStore = {
        get: (key: string) => {
          if (key === 'file') return {
            type: 'image/png',
            size: 1024,
            name: 'test.png',
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
          }
          if (key === 'cardId') return 'card-1'
          return null
        },
      }
      const res = await cardsUploadPOST(req as unknown as NextRequest)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.url).toBeDefined()
      expect(json.images).toBeDefined()
    })

    it('uploads image when card already has cover_image', async () => {
      authenticateUser()
      mockStorageUpload.mockResolvedValue({ error: null })
      setQueryResult([
        { data: [], error: null },                          // no existing images
        { data: null, error: null },                        // insert
        { data: { cover_image: 'existing.png' }, error: null }, // card already has cover
        { data: [{ id: 'img-1', url: 'https://storage.example.com/test.png' }], error: null }, // allImages
      ])
      const req = makeReq('/api/cards/upload', { method: 'POST' }) as unknown as NextRequest & { _formDataStore: unknown }
      req._formDataStore = {
        get: (key: string) => {
          if (key === 'file') return {
            type: 'image/jpeg',
            size: 2048,
            name: 'photo.jpg',
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(2048)),
          }
          if (key === 'cardId') return 'card-2'
          return null
        },
      }
      const res = await cardsUploadPOST(req as unknown as NextRequest)
      expect(res.status).toBe(200)
    })

    it('returns 500 when storage upload fails', async () => {
      authenticateUser()
      mockStorageUpload.mockResolvedValue({ error: { message: 'Storage full' } })
      const req = makeReq('/api/cards/upload', { method: 'POST' }) as unknown as NextRequest & { _formDataStore: unknown }
      req._formDataStore = {
        get: (key: string) => {
          if (key === 'file') return {
            type: 'image/png',
            size: 1024,
            name: 'test.png',
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
          }
          if (key === 'cardId') return 'card-1'
          return null
        },
      }
      const res = await cardsUploadPOST(req as unknown as NextRequest)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to upload image')
    })

    it('returns 500 when insert record fails', async () => {
      authenticateUser()
      mockStorageUpload.mockResolvedValue({ error: null })
      setQueryResult([
        { data: [], error: null },                              // existing images
        { data: null, error: { message: 'insert failed' } },   // insert fails
      ])
      const req = makeReq('/api/cards/upload', { method: 'POST' }) as unknown as NextRequest & { _formDataStore: unknown }
      req._formDataStore = {
        get: (key: string) => {
          if (key === 'file') return {
            type: 'image/png',
            size: 1024,
            name: 'test.png',
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
          }
          if (key === 'cardId') return 'card-1'
          return null
        },
      }
      const res = await cardsUploadPOST(req as unknown as NextRequest)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to save image record')
    })

    it('returns 500 on unexpected exception', async () => {
      authenticateUser()
      // Make formData throw
      const req = makeReq('/api/cards/upload', { method: 'POST' }) as unknown as NextRequest & { _formDataStore: unknown }
      req._formDataStore = null
      // Override formData to throw
      ;(req as unknown as { formData: () => Promise<never> }).formData = () => Promise.reject(new Error('parse error'))
      const res = await cardsUploadPOST(req as unknown as NextRequest)
      expect(res.status).toBe(500)
    })
  })
})

/* ================================================================== */
/*  CARD IMAGES  /api/cards/:id/images                                */
/* ================================================================== */

describe('API /api/cards/[id]/images', () => {
  const params = { params: { id: 'card-1' } }

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/cards/card-1/images')
      const res = await cardImagesGET(req, params)
      expect(res.status).toBe(401)
    })

    it('returns images for a card', async () => {
      authenticateUser()
      const images = [{ id: 'img-1', url: 'https://example.com/img.png', position: 0 }]
      setQueryResult(images)
      const req = makeReq('/api/cards/card-1/images')
      const res = await cardImagesGET(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.images).toHaveLength(1)
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'db error' })
      const req = makeReq('/api/cards/card-1/images')
      const res = await cardImagesGET(req, params)
      expect(res.status).toBe(500)
    })
  })

  describe('DELETE', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/cards/card-1/images', { method: 'DELETE', body: { imageId: 'img-1' } })
      const res = await cardImagesDELETE(req, params)
      expect(res.status).toBe(401)
    })

    it('returns 400 when imageId and all are missing', async () => {
      authenticateUser()
      const req = makeReq('/api/cards/card-1/images', { method: 'DELETE', body: {} })
      const res = await cardImagesDELETE(req, params)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('imageId or all is required')
    })

    it('deletes a specific image by imageId', async () => {
      authenticateUser()
      setQueryResult([
        { data: null, error: null },                // delete
        { data: [], error: null },                   // remaining images
      ])
      const req = makeReq('/api/cards/card-1/images', { method: 'DELETE', body: { imageId: 'img-1' } })
      const res = await cardImagesDELETE(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.images).toEqual([])
    })

    it('deletes all images when all=true', async () => {
      authenticateUser()
      setQueryResult([
        { data: null, error: null }, // delete all card_images
        { data: null, error: null }, // clear cover_image on card
      ])
      const req = makeReq('/api/cards/card-1/images', { method: 'DELETE', body: { all: true } })
      const res = await cardImagesDELETE(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.images).toEqual([])
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'delete error' })
      const req = makeReq('/api/cards/card-1/images', { method: 'DELETE', body: { imageId: 'img-1' } })
      const res = await cardImagesDELETE(req, params)
      expect(res.status).toBe(500)
    })
  })
})

/* ================================================================== */
/*  INVITATIONS  /api/invitations                                     */
/* ================================================================== */

describe('API /api/invitations', () => {
  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const res = await invitationsGET()
      expect(res.status).toBe(401)
    })

    it('returns pending invitations', async () => {
      authenticateUser()
      setQueryResult([
        { data: [{ id: 'inv-1', inviter_id: 'u2', boards: { title: 'Board' } }], error: null },
        { data: { username: 'inviter' }, error: null },
      ])
      const res = await invitationsGET()
      expect(res.status).toBe(200)
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'db error' })
      const res = await invitationsGET()
      expect(res.status).toBe(500)
    })
  })

  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/invitations', { method: 'POST', body: { board_id: 'b1', invitee_id: 'u2' } })
      const res = await invitationsPOST(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when board_id or invitee_id is missing', async () => {
      authenticateUser()
      const req = makeReq('/api/invitations', { method: 'POST', body: {} })
      const res = await invitationsPOST(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('board_id and invitee_id are required')
    })

    it('returns 400 when inviting yourself', async () => {
      authenticateUser()
      setQueryResult([
        { data: { owner_id: MOCK_USER.id }, error: null }, // board check
      ])
      const req = makeReq('/api/invitations', {
        method: 'POST',
        body: { board_id: 'b1', invitee_id: MOCK_USER.id },
      })
      const res = await invitationsPOST(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Cannot invite yourself')
    })

    it('creates an invitation and returns 201', async () => {
      authenticateUser()
      const invitation = { id: 'inv-new', board_id: 'b1', invitee_id: 'u2', status: 'pending' }
      setQueryResult([
        { data: { owner_id: MOCK_USER.id }, error: null },  // board check
        { data: { id: 'u2' }, error: null },                 // invitee profile exists
        { data: null, error: null },                          // existing member check
        { data: null, error: null },                          // existing invitation check
        { data: [invitation], error: null },                  // insert invitation
      ])
      const req = makeReq('/api/invitations', {
        method: 'POST',
        body: { board_id: 'b1', invitee_id: 'u2' },
      })
      const res = await invitationsPOST(req)
      expect(res.status).toBe(201)
    })

    it('returns 404 when board not found', async () => {
      authenticateUser()
      setQueryResult([
        { data: null, error: { message: 'not found' } }, // board check fails
      ])
      const req = makeReq('/api/invitations', {
        method: 'POST',
        body: { board_id: 'b1', invitee_id: 'u2' },
      })
      const res = await invitationsPOST(req)
      expect(res.status).toBe(404)
    })

    it('returns 403 when user is not board owner', async () => {
      authenticateUser()
      setQueryResult([
        { data: { owner_id: 'other-user' }, error: null }, // board owner is different
      ])
      const req = makeReq('/api/invitations', {
        method: 'POST',
        body: { board_id: 'b1', invitee_id: 'u2' },
      })
      const res = await invitationsPOST(req)
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.error).toBe('Only board owner can invite users')
    })

    it('returns 404 when invitee not found', async () => {
      authenticateUser()
      setQueryResult([
        { data: { owner_id: MOCK_USER.id }, error: null },  // board
        { data: null, error: null },                          // invitee not found
      ])
      const req = makeReq('/api/invitations', {
        method: 'POST',
        body: { board_id: 'b1', invitee_id: 'u2' },
      })
      const res = await invitationsPOST(req)
      expect(res.status).toBe(404)
      const json = await res.json()
      expect(json.error).toContain('User not found')
    })

    it('returns 400 when user is already a member', async () => {
      authenticateUser()
      setQueryResult([
        { data: { owner_id: MOCK_USER.id }, error: null },  // board
        { data: { id: 'u2' }, error: null },                 // invitee exists
        { data: { id: 'member-1' }, error: null },           // already member
      ])
      const req = makeReq('/api/invitations', {
        method: 'POST',
        body: { board_id: 'b1', invitee_id: 'u2' },
      })
      const res = await invitationsPOST(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('User is already a member of this board')
    })

    it('returns 400 when a pending invitation already exists', async () => {
      authenticateUser()
      setQueryResult([
        { data: { owner_id: MOCK_USER.id }, error: null },
        { data: { id: 'u2' }, error: null },
        { data: null, error: null },                          // not a member
        { data: { id: 'inv-old', status: 'pending' }, error: null }, // pending invitation
      ])
      const req = makeReq('/api/invitations', {
        method: 'POST',
        body: { board_id: 'b1', invitee_id: 'u2' },
      })
      const res = await invitationsPOST(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toContain('already pending')
    })

    it('re-sends a declined invitation by updating to pending', async () => {
      authenticateUser()
      setQueryResult([
        { data: { owner_id: MOCK_USER.id }, error: null },
        { data: { id: 'u2' }, error: null },
        { data: null, error: null },
        { data: { id: 'inv-old', status: 'declined' }, error: null }, // declined invitation
        { data: [{ id: 'inv-old', status: 'pending' }], error: null }, // update result
      ])
      const req = makeReq('/api/invitations', {
        method: 'POST',
        body: { board_id: 'b1', invitee_id: 'u2' },
      })
      const res = await invitationsPOST(req)
      expect(res.status).toBe(200)
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult([
        { data: { owner_id: MOCK_USER.id }, error: null },
        { data: { id: 'u2' }, error: null },
        { data: null, error: null },
        { data: null, error: null },
        { data: null, error: { message: 'insert error' } },
      ])
      const req = makeReq('/api/invitations', {
        method: 'POST',
        body: { board_id: 'b1', invitee_id: 'u2' },
      })
      const res = await invitationsPOST(req)
      expect(res.status).toBe(500)
    })
  })
})

/* ================================================================== */
/*  INVITATIONS [id]  /api/invitations/:id                            */
/* ================================================================== */

describe('API /api/invitations/[id]', () => {
  const params = { params: { id: 'inv-1' } }

  describe('PUT', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/invitations/inv-1', { method: 'PUT', body: { action: 'accept' } })
      const res = await invitationByIdPUT(req, params)
      expect(res.status).toBe(401)
    })

    it('returns 400 for invalid action', async () => {
      authenticateUser()
      const req = makeReq('/api/invitations/inv-1', { method: 'PUT', body: { action: 'invalid' } })
      const res = await invitationByIdPUT(req, params)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toContain('Invalid action')
    })

    it('accepts an invitation', async () => {
      authenticateUser()
      setQueryResult([
        { data: { id: 'inv-1', invitee_id: MOCK_USER.id, board_id: 'b1', status: 'pending' }, error: null },
        { data: null, error: null }, // update invitation
        { data: null, error: null }, // upsert board_members
      ])
      const req = makeReq('/api/invitations/inv-1', { method: 'PUT', body: { action: 'accept' } })
      const res = await invitationByIdPUT(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.status).toBe('accepted')
    })

    it('declines an invitation', async () => {
      authenticateUser()
      setQueryResult([
        { data: { id: 'inv-1', invitee_id: MOCK_USER.id, board_id: 'b1', status: 'pending' }, error: null },
        { data: null, error: null }, // update invitation
      ])
      const req = makeReq('/api/invitations/inv-1', { method: 'PUT', body: { action: 'decline' } })
      const res = await invitationByIdPUT(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.status).toBe('declined')
    })

    it('returns 404 when invitation not found', async () => {
      authenticateUser()
      setQueryResult([
        { data: null, error: { message: 'not found' } },
      ])
      const req = makeReq('/api/invitations/inv-1', { method: 'PUT', body: { action: 'accept' } })
      const res = await invitationByIdPUT(req, params)
      expect(res.status).toBe(404)
    })

    it('returns 403 when user is not the invitee', async () => {
      authenticateUser()
      setQueryResult([
        { data: { id: 'inv-1', invitee_id: 'other-user', board_id: 'b1', status: 'pending' }, error: null },
      ])
      const req = makeReq('/api/invitations/inv-1', { method: 'PUT', body: { action: 'accept' } })
      const res = await invitationByIdPUT(req, params)
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.error).toContain('your own invitations')
    })

    it('returns 400 when invitation is not pending', async () => {
      authenticateUser()
      setQueryResult([
        { data: { id: 'inv-1', invitee_id: MOCK_USER.id, board_id: 'b1', status: 'accepted' }, error: null },
      ])
      const req = makeReq('/api/invitations/inv-1', { method: 'PUT', body: { action: 'accept' } })
      const res = await invitationByIdPUT(req, params)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toContain('already been responded')
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult([
        { data: { id: 'inv-1', invitee_id: MOCK_USER.id, board_id: 'b1', status: 'pending' }, error: null },
        { data: null, error: { message: 'update error' } },
      ])
      const req = makeReq('/api/invitations/inv-1', { method: 'PUT', body: { action: 'accept' } })
      const res = await invitationByIdPUT(req, params)
      expect(res.status).toBe(500)
    })
  })

  describe('DELETE', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/invitations/inv-1')
      const res = await invitationByIdDELETE(req, params)
      expect(res.status).toBe(401)
    })

    it('deletes an invitation', async () => {
      authenticateUser()
      setQueryResult([
        { data: { id: 'inv-1', invitee_id: MOCK_USER.id, boards: { owner_id: 'other' } }, error: null },
        { data: null, error: null }, // delete
      ])
      const req = makeReq('/api/invitations/inv-1')
      const res = await invitationByIdDELETE(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('returns 404 when invitation not found', async () => {
      authenticateUser()
      setQueryResult([
        { data: null, error: { message: 'not found' } },
      ])
      const req = makeReq('/api/invitations/inv-1')
      const res = await invitationByIdDELETE(req, params)
      expect(res.status).toBe(404)
    })

    it('returns 403 when user is not owner or invitee', async () => {
      authenticateUser()
      setQueryResult([
        { data: { id: 'inv-1', invitee_id: 'other-user', boards: { owner_id: 'another-user' } }, error: null },
      ])
      const req = makeReq('/api/invitations/inv-1')
      const res = await invitationByIdDELETE(req, params)
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.error).toContain('permission')
    })

    it('allows board owner to delete invitation', async () => {
      authenticateUser()
      setQueryResult([
        { data: { id: 'inv-1', invitee_id: 'other-user', boards: { owner_id: MOCK_USER.id } }, error: null },
        { data: null, error: null },
      ])
      const req = makeReq('/api/invitations/inv-1')
      const res = await invitationByIdDELETE(req, params)
      expect(res.status).toBe(200)
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      setQueryResult([
        { data: { id: 'inv-1', invitee_id: MOCK_USER.id, boards: { owner_id: 'other' } }, error: null },
        { data: null, error: { message: 'delete error' } },
      ])
      const req = makeReq('/api/invitations/inv-1')
      const res = await invitationByIdDELETE(req, params)
      expect(res.status).toBe(500)
    })
  })
})

/* ================================================================== */
/*  GITHUB CONNECT  /api/github/connect                               */
/* ================================================================== */

describe('API /api/github/connect', () => {
  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      requireAuthDeny()
      const res = await githubConnectPOST()
      expect(res.status).toBe(401)
    })

    it('returns needsLinking when no GitHub identity', async () => {
      requireAuthSuccess()
      mockGetGitHubIdentity.mockResolvedValue(null)
      const res = await githubConnectPOST()
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.needsLinking).toBe(true)
    })

    it('returns needsReauth when no token', async () => {
      requireAuthSuccess()
      mockGetGitHubIdentity.mockResolvedValue({ provider: 'github' })
      mockGetGitHubToken.mockResolvedValue(null)
      const res = await githubConnectPOST()
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.needsReauth).toBe(true)
    })

    it('returns success with scopes when token is valid', async () => {
      requireAuthSuccess()
      mockGetGitHubIdentity.mockResolvedValue({ provider: 'github' })
      mockGetGitHubToken.mockResolvedValue('gh-token-123')
      mockFetch.mockResolvedValue({
        ok: true,
        headers: { get: (h: string) => (h === 'x-oauth-scopes' ? 'repo,user' : null) },
      })
      const res = await githubConnectPOST()
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.hasRepoScope).toBe(true)
    })

    it('returns 500 on server error', async () => {
      requireAuthSuccess()
      mockGetGitHubIdentity.mockRejectedValue(new Error('GitHub error'))
      const res = await githubConnectPOST()
      expect(res.status).toBe(500)
    })
  })

  describe('DELETE', () => {
    it('returns 401 when not authenticated', async () => {
      requireAuthDeny()
      const res = await githubConnectDELETE()
      expect(res.status).toBe(401)
    })

    it('disconnects GitHub successfully', async () => {
      requireAuthSuccess()
      mockGetGitHubIdentity.mockResolvedValue({ provider: 'github', id: 'ident-1' })
      mockUnlinkIdentity.mockResolvedValue({ error: null })
      setQueryResult(null)
      const res = await githubConnectDELETE()
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('returns 500 on server error', async () => {
      requireAuthSuccess()
      mockGetGitHubIdentity.mockResolvedValue({ provider: 'github' })
      mockUnlinkIdentity.mockResolvedValue({ error: new Error('unlink failed') })
      const res = await githubConnectDELETE()
      expect(res.status).toBe(500)
    })
  })

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      requireAuthDeny()
      const res = await githubConnectGET()
      expect(res.status).toBe(401)
    })

    it('returns GitHub connection status', async () => {
      requireAuthSuccess()
      mockGetGitHubIdentity.mockResolvedValue({ provider: 'github', identity_data: { user_name: 'octocat' } })
      mockGetGitHubToken.mockResolvedValue('gh-token')
      setQueryResult({ github_username: 'octocat', github_connected_at: '2025-01-01' })
      mockFetch.mockResolvedValue({
        ok: true,
        headers: { get: (h: string) => (h === 'x-oauth-scopes' ? 'repo' : null) },
      })
      const res = await githubConnectGET()
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.connected).toBe(true)
      expect(json.hasRepoScope).toBe(true)
    })

    it('returns 500 on server error', async () => {
      requireAuthSuccess()
      mockGetGitHubIdentity.mockRejectedValue(new Error('err'))
      const res = await githubConnectGET()
      expect(res.status).toBe(500)
    })
  })
})

/* ================================================================== */
/*  GITHUB TOKEN  /api/github/token                                   */
/* ================================================================== */

describe('API /api/github/token', () => {
  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      requireAuthDeny()
      const res = await githubTokenGET()
      expect(res.status).toBe(401)
    })

    it('returns token and username', async () => {
      requireAuthSuccess()
      mockGetGitHubToken.mockResolvedValue('my-gh-token')
      const res = await githubTokenGET()
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.token).toBe('my-gh-token')
    })

    it('returns 403 when token is missing', async () => {
      requireAuthSuccess()
      mockGetGitHubToken.mockResolvedValue(null)
      const res = await githubTokenGET()
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.needsReauth).toBe(true)
    })

    it('returns 500 on server error', async () => {
      requireAuthSuccess()
      mockGetGitHubToken.mockRejectedValue(new Error('token error'))
      const res = await githubTokenGET()
      expect(res.status).toBe(500)
    })
  })
})

/* ================================================================== */
/*  CARD GITHUB LINKS  /api/cards/:id/github                         */
/* ================================================================== */

describe('API /api/cards/[id]/github', () => {
  const params = { params: { id: 'card-1' } }

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      requireAuthDeny()
      const req = makeReq('/api/cards/card-1/github')
      const res = await cardGithubGET(req, params)
      expect(res.status).toBe(401)
    })

    it('returns github links for a card', async () => {
      requireAuthSuccess()
      const links = [{ id: 'gl-1', card_id: 'card-1', github_url: 'https://github.com/test/issue/1' }]
      setQueryResult(links)
      const req = makeReq('/api/cards/card-1/github')
      const res = await cardGithubGET(req, params)
      expect(res.status).toBe(200)
    })

    it('returns 500 on server error', async () => {
      requireAuthSuccess()
      setQueryResult(null, { message: 'db error' })
      const req = makeReq('/api/cards/card-1/github')
      const res = await cardGithubGET(req, params)
      expect(res.status).toBe(500)
    })
  })

  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      requireAuthDeny()
      const req = makeReq('/api/cards/card-1/github', { method: 'POST', body: {} })
      const res = await cardGithubPOST(req, params)
      expect(res.status).toBe(401)
    })

    it('returns 400 when required fields are missing', async () => {
      requireAuthSuccess()
      const req = makeReq('/api/cards/card-1/github', {
        method: 'POST',
        body: { github_type: 'issue' },
      })
      const res = await cardGithubPOST(req, params)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Missing required fields')
    })

    it('creates a github link and returns 201', async () => {
      requireAuthSuccess()
      const link = {
        id: 'gl-new',
        card_id: 'card-1',
        github_type: 'issue',
        github_repo_owner: 'owner',
        github_repo_name: 'repo',
        github_number: 1,
        github_url: 'https://github.com/owner/repo/issues/1',
      }
      setQueryResult(link)
      mockGetGitHubToken.mockResolvedValue('gh-token')
      // Webhook creation calls fetch
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
        status: 200,
      })
      mockUpdateCardCompletion.mockResolvedValue(undefined)

      const req = makeReq('/api/cards/card-1/github', {
        method: 'POST',
        body: {
          github_type: 'issue',
          github_repo_owner: 'owner',
          github_repo_name: 'repo',
          github_number: 1,
          github_url: 'https://github.com/owner/repo/issues/1',
          github_title: 'Test Issue',
          github_state: 'open',
        },
      })
      const res = await cardGithubPOST(req, params)
      expect(res.status).toBe(201)
    })

    it('returns 500 on server error', async () => {
      requireAuthSuccess()
      setQueryResult(null, { message: 'insert error' })
      const req = makeReq('/api/cards/card-1/github', {
        method: 'POST',
        body: {
          github_type: 'issue',
          github_repo_owner: 'o',
          github_repo_name: 'r',
          github_number: 1,
          github_url: 'https://github.com/o/r/issues/1',
        },
      })
      const res = await cardGithubPOST(req, params)
      expect(res.status).toBe(500)
    })
  })

  describe('DELETE', () => {
    it('returns 401 when not authenticated', async () => {
      requireAuthDeny()
      const req = makeReq('/api/cards/card-1/github?linkId=gl-1')
      const res = await cardGithubDELETE(req, params)
      expect(res.status).toBe(401)
    })

    it('returns 400 when linkId is missing', async () => {
      requireAuthSuccess()
      const req = makeReq('/api/cards/card-1/github')
      const res = await cardGithubDELETE(req, params)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('linkId is required')
    })

    it('deletes a github link successfully', async () => {
      requireAuthSuccess()
      setQueryResult(null)
      mockUpdateCardCompletion.mockResolvedValue(undefined)
      const req = makeReq('/api/cards/card-1/github?linkId=gl-1')
      const res = await cardGithubDELETE(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('returns 500 on server error', async () => {
      requireAuthSuccess()
      setQueryResult(null, { message: 'delete error' })
      const req = makeReq('/api/cards/card-1/github?linkId=gl-1')
      const res = await cardGithubDELETE(req, params)
      expect(res.status).toBe(500)
    })
  })

  describe('PATCH', () => {
    it('returns 401 when not authenticated', async () => {
      requireAuthDeny()
      const req = makeReq('/api/cards/card-1/github', {
        method: 'PATCH',
        body: { linkId: 'gl-1', github_state: 'closed' },
      })
      const res = await cardGithubPATCH(req, params)
      expect(res.status).toBe(401)
    })

    it('returns 400 when linkId or github_state missing', async () => {
      requireAuthSuccess()
      const req = makeReq('/api/cards/card-1/github', {
        method: 'PATCH',
        body: { linkId: 'gl-1' },
      })
      const res = await cardGithubPATCH(req, params)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('linkId and github_state are required')
    })

    it('updates github link state', async () => {
      requireAuthSuccess()
      const updated = { id: 'gl-1', github_state: 'closed' }
      setQueryResult(updated)
      mockUpdateCardCompletion.mockResolvedValue(undefined)
      const req = makeReq('/api/cards/card-1/github', {
        method: 'PATCH',
        body: { linkId: 'gl-1', github_state: 'closed' },
      })
      const res = await cardGithubPATCH(req, params)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.github_state).toBe('closed')
    })

    it('returns 500 on server error', async () => {
      requireAuthSuccess()
      setQueryResult(null, { message: 'update error' })
      const req = makeReq('/api/cards/card-1/github', {
        method: 'PATCH',
        body: { linkId: 'gl-1', github_state: 'closed' },
      })
      const res = await cardGithubPATCH(req, params)
      expect(res.status).toBe(500)
    })
  })
})

/* ================================================================== */
/*  SYNC GITHUB  /api/cards/:id/sync-github                          */
/* ================================================================== */

describe('API /api/cards/[id]/sync-github', () => {
  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/cards/card-1/sync-github', {
        method: 'POST',
        body: { cardId: 'card-1', isCompleted: true },
      })
      const res = await syncGithubPOST(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when cardId or isCompleted missing', async () => {
      authenticateUser()
      const req = makeReq('/api/cards/card-1/sync-github', {
        method: 'POST',
        body: { cardId: 'card-1' },
      })
      const res = await syncGithubPOST(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('cardId and isCompleted are required')
    })

    it('returns 403 when GitHub not connected', async () => {
      authenticateUser()
      mockGetSession.mockResolvedValue({ data: { session: { provider_token: null } } })
      const req = makeReq('/api/cards/card-1/sync-github', {
        method: 'POST',
        body: { cardId: 'card-1', isCompleted: true },
      })
      const res = await syncGithubPOST(req)
      expect(res.status).toBe(403)
    })

    it('returns success with no links found', async () => {
      authenticateUser()
      mockGetSession.mockResolvedValue({ data: { session: { provider_token: 'gh-tok' } } })
      setQueryResult([])
      const req = makeReq('/api/cards/card-1/sync-github', {
        method: 'POST',
        body: { cardId: 'card-1', isCompleted: true },
      })
      const res = await syncGithubPOST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.updated).toBe(0)
    })

    it('returns 500 on server error', async () => {
      authenticateUser()
      mockGetSession.mockResolvedValue({ data: { session: { provider_token: 'gh-tok' } } })
      setQueryResult(null, { message: 'fetch error' })
      const req = makeReq('/api/cards/card-1/sync-github', {
        method: 'POST',
        body: { cardId: 'card-1', isCompleted: true },
      })
      const res = await syncGithubPOST(req)
      expect(res.status).toBe(500)
    })

    it('updates GitHub issues when links are found', async () => {
      authenticateUser()
      mockGetSession.mockResolvedValue({ data: { session: { provider_token: 'gh-tok' } } })
      setQueryResult([
        {
          data: [
            { id: 'link-1', card_id: 'card-1', github_repo_owner: 'owner', github_repo_name: 'repo', github_number: 10, github_state: 'open' },
          ],
          error: null,
        },
        { data: null, error: null }, // update link state
      ])
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ state: 'closed' }),
      })
      const req = makeReq('/api/cards/card-1/sync-github', {
        method: 'POST',
        body: { cardId: 'card-1', isCompleted: true },
      })
      const res = await syncGithubPOST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.updated).toBe(1)
    })

    it('skips issues already in the target state', async () => {
      authenticateUser()
      mockGetSession.mockResolvedValue({ data: { session: { provider_token: 'gh-tok' } } })
      setQueryResult([
        {
          data: [
            { id: 'link-1', card_id: 'card-1', github_repo_owner: 'owner', github_repo_name: 'repo', github_number: 10, github_state: 'closed' },
          ],
          error: null,
        },
      ])
      const req = makeReq('/api/cards/card-1/sync-github', {
        method: 'POST',
        body: { cardId: 'card-1', isCompleted: true }, // wants closed, already closed
      })
      const res = await syncGithubPOST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.updated).toBe(0)
    })

    it('reports errors when GitHub API fails for some issues', async () => {
      authenticateUser()
      mockGetSession.mockResolvedValue({ data: { session: { provider_token: 'gh-tok' } } })
      setQueryResult([
        {
          data: [
            { id: 'link-1', card_id: 'card-1', github_repo_owner: 'owner', github_repo_name: 'repo', github_number: 10, github_state: 'open' },
          ],
          error: null,
        },
      ])
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Not found' }),
      })
      const req = makeReq('/api/cards/card-1/sync-github', {
        method: 'POST',
        body: { cardId: 'card-1', isCompleted: true },
      })
      const res = await syncGithubPOST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.errors).toBeDefined()
      expect(json.errors.length).toBeGreaterThan(0)
    })

    it('handles exception in the loop for a specific issue', async () => {
      authenticateUser()
      mockGetSession.mockResolvedValue({ data: { session: { provider_token: 'gh-tok' } } })
      setQueryResult([
        {
          data: [
            { id: 'link-1', card_id: 'card-1', github_repo_owner: 'owner', github_repo_name: 'repo', github_number: 10, github_state: 'open' },
          ],
          error: null,
        },
      ])
      mockFetch.mockRejectedValue(new Error('Network failure'))
      const req = makeReq('/api/cards/card-1/sync-github', {
        method: 'POST',
        body: { cardId: 'card-1', isCompleted: true },
      })
      const res = await syncGithubPOST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.errors).toBeDefined()
    })
  })
})

/* ================================================================== */
/*  WEBHOOKS GITHUB  /api/webhooks/github                             */
/* ================================================================== */

describe('API /api/webhooks/github', () => {
  function makeWebhookReq(
    body: object,
    event: string,
    validSignature = true
  ) {
    const payload = JSON.stringify(body)
    let signature: string
    if (validSignature) {
      const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET!)
      signature = 'sha256=' + hmac.update(payload).digest('hex')
    } else {
      signature = 'sha256=invalidsignature'
    }
    return makeReq('/api/webhooks/github', {
      method: 'POST',
      body,
      headers: {
        'x-hub-signature-256': signature,
        'x-github-event': event,
      },
    })
  }

  describe('POST', () => {
    it('returns 401 when signature is invalid', async () => {
      const body = { action: 'opened', issue: { number: 1, state: 'open' }, repository: { owner: { login: 'o' }, name: 'r' } }
      const payload = JSON.stringify(body)
      // Compute a same-length but wrong signature (flip first hex char)
      const realHmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET!)
      const realDigest = realHmac.update(payload).digest('hex')
      const wrongDigest = (realDigest[0] === 'a' ? 'b' : 'a') + realDigest.slice(1)
      const wrongSignature = 'sha256=' + wrongDigest

      const req = makeReq('/api/webhooks/github', {
        method: 'POST',
        body,
        headers: {
          'x-hub-signature-256': wrongSignature,
          'x-github-event': 'issues',
        },
      })
      const res = await webhookGithubPOST(req)
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toBe('Invalid signature')
    })

    it('responds to ping events', async () => {
      const req = makeWebhookReq(
        { hook_id: 12345, repository: { full_name: 'owner/repo' } },
        'ping'
      )
      const res = await webhookGithubPOST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.message).toBe('pong')
    })

    it('processes issue events (no linked cards)', async () => {
      setQueryResult([
        { data: [], error: null }, // no linked cards
      ])
      const req = makeWebhookReq(
        {
          action: 'closed',
          issue: { number: 42, state: 'closed' },
          repository: { owner: { login: 'owner' }, name: 'repo' },
        },
        'issues'
      )
      const res = await webhookGithubPOST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('processes issue events with linked cards', async () => {
      setQueryResult([
        { data: [{ id: 'gl-1', card_id: 'card-1' }], error: null }, // linked cards
        { data: null, error: null },                                   // update links
      ])
      mockUpdateCardCompletion.mockResolvedValue(undefined)
      const req = makeWebhookReq(
        {
          action: 'closed',
          issue: { number: 42, state: 'closed' },
          repository: { owner: { login: 'owner' }, name: 'repo' },
        },
        'issues'
      )
      const res = await webhookGithubPOST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.processed).toBe(true)
    })

    it('ignores unhandled events', async () => {
      const req = makeWebhookReq({ action: 'pushed' }, 'push')
      const res = await webhookGithubPOST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.message).toBe('Event not handled')
    })
  })
})
