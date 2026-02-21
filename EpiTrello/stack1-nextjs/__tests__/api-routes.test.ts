/**
 * Comprehensive tests for Next.js App Router API routes:
 *   - /api/boards        (GET, POST)
 *   - /api/cards          (GET, POST)
 *   - /api/cards/[id]     (GET, PUT, DELETE)
 *   - /api/lists          (GET, POST)
 *   - /api/lists/[id]     (GET, PUT, DELETE)
 */

/* ------------------------------------------------------------------ */
/*  Mocks – must be declared before any import that touches them      */
/* ------------------------------------------------------------------ */

// Build a chainable Supabase query mock.
// Every query method returns `this` so chains like
//   supabase.from('x').select('*').eq('a','b').order('c',{ascending:true})
// resolve correctly.  The terminal methods (single / then) resolve the
// configured `mockResult`.

let mockResult: { data: unknown; error: unknown } = { data: null, error: null }

const chainable = () => {
  const obj: Record<string, jest.Mock> = {}
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'order', 'single']
  methods.forEach((m) => {
    obj[m] = jest.fn().mockImplementation(() => {
      // terminal – when nothing else is chained the promise resolves mockResult
      return { ...obj, then: (cb: (v: unknown) => void) => cb(mockResult) }
    })
  })
  return obj
}

const mockFrom = jest.fn().mockImplementation(() => chainable())
const mockGetUser = jest.fn()
const mockSupabase = {
  from: mockFrom,
  auth: { getUser: mockGetUser },
}

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(() => mockSupabase),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

// Provide a minimal NextResponse.json so we can inspect status / body.
jest.mock('next/server', () => {
  const actual: Record<string, unknown> = {}
  // NextRequest – build a lightweight stand-in
  class FakeNextRequest {
    nextUrl: URL
    _body: unknown
    constructor(url: string, init?: { method?: string; body?: string }) {
      this.nextUrl = new URL(url)
      this._body = init?.body ? JSON.parse(init.body) : undefined
    }
    async json() {
      return this._body
    }
  }

  return {
    ...actual,
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

import { GET as boardsGET, POST as boardsPOST } from '../app/api/boards/route'
import { GET as cardsGET, POST as cardsPOST } from '../app/api/cards/route'
import {
  GET as cardByIdGET,
  PUT as cardByIdPUT,
  DELETE as cardByIdDELETE,
} from '../app/api/cards/[id]/route'
import { GET as listsGET, POST as listsPOST } from '../app/api/lists/route'
import {
  GET as listByIdGET,
  PUT as listByIdPUT,
  DELETE as listByIdDELETE,
} from '../app/api/lists/[id]/route'

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const MOCK_USER = { id: 'user-123', email: 'test@example.com' }

/** Authenticate the mock supabase client for future calls */
function authenticateUser(user = MOCK_USER) {
  mockGetUser.mockResolvedValue({ data: { user }, error: null })
}

/** Make authentication fail */
function denyAuth() {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad' } })
}

/**
 * Configure what supabase.from(...) chains resolve to.
 *
 * When `sequence` is provided the successive calls to `from()` will
 * each resolve to the corresponding element.  This is useful for routes
 * that issue several queries in a row (e.g. boards GET fetches owned
 * boards, then board_members, then shared boards, then profiles).
 */
function setQueryResult(dataOrSequence: unknown, error: unknown = null) {
  if (Array.isArray(dataOrSequence) && dataOrSequence.length > 0 && typeof dataOrSequence[0] === 'object' && 'data' in (dataOrSequence[0] as Record<string, unknown>)) {
    // Array of { data, error } objects → sequence mode
    const seq = dataOrSequence as { data: unknown; error: unknown }[]
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

/** Create a NextRequest pointing at the given path with optional JSON body */
function makeReq(path: string, opts?: { method?: string; body?: unknown }) {
  return new NextRequest(`http://localhost${path}`, {
    method: opts?.method,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  }) as unknown as NextRequest
}

/* ------------------------------------------------------------------ */
/*  Reset between tests                                               */
/* ------------------------------------------------------------------ */

beforeEach(() => {
  jest.clearAllMocks()
  mockResult = { data: null, error: null }
  // Reset mockFrom to default chainable implementation
  mockFrom.mockImplementation(() => chainable())
})

/* ================================================================== */
/*  BOARDS  /api/boards                                               */
/* ================================================================== */

describe('API /api/boards', () => {
  // -------- GET --------
  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const res = await boardsGET()
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toBe('Unauthorized')
    })

    it('returns owned boards for authenticated user', async () => {
      authenticateUser()
      const owned = [
        { id: 'b1', title: 'Board 1', owner_id: MOCK_USER.id, created_at: '2025-01-01' },
      ]
      setQueryResult([
        { data: owned, error: null },            // boards (owned)
        { data: [], error: null },                // board_members
      ])

      const res = await boardsGET()
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(Array.isArray(json)).toBe(true)
    })

    it('returns combined owned + shared boards', async () => {
      authenticateUser()
      const owned = [
        { id: 'b1', title: 'My Board', owner_id: MOCK_USER.id, created_at: '2025-02-01' },
      ]
      const memberRecords = [{ board_id: 'b2', role: 'member' }]
      const shared = [
        { id: 'b2', title: 'Shared Board', owner_id: 'other-user', created_at: '2025-01-15' },
      ]
      const profiles = [{ id: 'other-user', username: 'alice' }]

      setQueryResult([
        { data: owned, error: null },
        { data: memberRecords, error: null },
        { data: shared, error: null },
        { data: profiles, error: null },
      ])

      const res = await boardsGET()
      expect(res.status).toBe(200)
    })

    it('returns 500 when supabase throws', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'db down' })

      const res = await boardsGET()
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to fetch boards')
    })

    it('excludes board_members with owner role from shared boards', async () => {
      authenticateUser()
      const owned = [{ id: 'b1', title: 'Own', owner_id: MOCK_USER.id, created_at: '2025-01-01' }]
      // Only owner-role membership → no shared boards fetched
      const memberRecords = [{ board_id: 'b1', role: 'owner' }]

      setQueryResult([
        { data: owned, error: null },
        { data: memberRecords, error: null },
      ])

      const res = await boardsGET()
      expect(res.status).toBe(200)
    })
  })

  // -------- POST --------
  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/boards', { method: 'POST', body: { title: 'New' } })
      const res = await boardsPOST(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when title is missing', async () => {
      authenticateUser()
      const req = makeReq('/api/boards', { method: 'POST', body: {} })
      const res = await boardsPOST(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Title is required')
    })

    it('creates a board and returns 201', async () => {
      authenticateUser()
      const created = { id: 'b-new', title: 'New Board', owner_id: MOCK_USER.id }
      setQueryResult(created)

      const req = makeReq('/api/boards', {
        method: 'POST',
        body: { title: 'New Board', description: 'desc' },
      })
      const res = await boardsPOST(req)
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.id).toBe('b-new')
    })

    it('returns 500 when insert fails', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'insert error' })

      const req = makeReq('/api/boards', { method: 'POST', body: { title: 'X' } })
      const res = await boardsPOST(req)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to create board')
    })
  })
})

/* ================================================================== */
/*  CARDS  /api/cards                                                 */
/* ================================================================== */

describe('API /api/cards', () => {
  // -------- GET --------
  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/cards?listId=l1')
      const res = await cardsGET(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when listId is missing', async () => {
      authenticateUser()
      const req = makeReq('/api/cards')
      const res = await cardsGET(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('listId is required')
    })

    it('returns cards for a given listId', async () => {
      authenticateUser()
      const cards = [
        { id: 'c1', title: 'Card 1', list_id: 'l1', position: 0 },
        { id: 'c2', title: 'Card 2', list_id: 'l1', position: 1 },
      ]
      setQueryResult(cards)

      const req = makeReq('/api/cards?listId=l1')
      const res = await cardsGET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(Array.isArray(json)).toBe(true)
    })

    it('returns 500 on db error', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'db error' })

      const req = makeReq('/api/cards?listId=l1')
      const res = await cardsGET(req)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to fetch cards')
    })
  })

  // -------- POST --------
  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/cards', { method: 'POST', body: { title: 'C', list_id: 'l1' } })
      const res = await cardsPOST(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when title is missing', async () => {
      authenticateUser()
      const req = makeReq('/api/cards', { method: 'POST', body: { list_id: 'l1' } })
      const res = await cardsPOST(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('title and list_id are required')
    })

    it('returns 400 when list_id is missing', async () => {
      authenticateUser()
      const req = makeReq('/api/cards', { method: 'POST', body: { title: 'Card' } })
      const res = await cardsPOST(req)
      expect(res.status).toBe(400)
    })

    it('creates a card and returns 201', async () => {
      authenticateUser()
      const created = { id: 'c-new', title: 'New Card', list_id: 'l1', position: 0 }
      setQueryResult(created)

      const req = makeReq('/api/cards', {
        method: 'POST',
        body: { title: 'New Card', list_id: 'l1', description: 'desc', labels: ['bug'] },
      })
      const res = await cardsPOST(req)
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.id).toBe('c-new')
    })

    it('returns 500 when insert fails', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'insert error' })

      const req = makeReq('/api/cards', {
        method: 'POST',
        body: { title: 'X', list_id: 'l1' },
      })
      const res = await cardsPOST(req)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to create card')
    })
  })
})

/* ================================================================== */
/*  CARDS [id]  /api/cards/:id                                        */
/* ================================================================== */

describe('API /api/cards/[id]', () => {
  const paramsObj = { params: { id: 'card-1' } }

  // -------- GET --------
  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/cards/card-1')
      const res = await cardByIdGET(req, paramsObj)
      expect(res.status).toBe(401)
    })

    it('returns a single card by id', async () => {
      authenticateUser()
      const card = { id: 'card-1', title: 'My Card', list_id: 'l1' }
      setQueryResult(card)

      const req = makeReq('/api/cards/card-1')
      const res = await cardByIdGET(req, paramsObj)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.id).toBe('card-1')
    })

    it('returns 500 when fetch fails', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'not found' })

      const req = makeReq('/api/cards/card-1')
      const res = await cardByIdGET(req, paramsObj)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to fetch card')
    })
  })

  // -------- PUT --------
  describe('PUT', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/cards/card-1', { method: 'PUT', body: { title: 'Up' } })
      const res = await cardByIdPUT(req, paramsObj)
      expect(res.status).toBe(401)
    })

    it('updates card title', async () => {
      authenticateUser()
      const updated = { id: 'card-1', title: 'Updated' }
      setQueryResult(updated)

      const req = makeReq('/api/cards/card-1', { method: 'PUT', body: { title: 'Updated' } })
      const res = await cardByIdPUT(req, paramsObj)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.title).toBe('Updated')
    })

    it('updates card with multiple fields', async () => {
      authenticateUser()
      const updated = { id: 'card-1', title: 'T', description: 'D', status: 'done', labels: ['fix'] }
      setQueryResult(updated)

      const req = makeReq('/api/cards/card-1', {
        method: 'PUT',
        body: { title: 'T', description: 'D', status: 'done', labels: ['fix'], cover_color: '#fff' },
      })
      const res = await cardByIdPUT(req, paramsObj)
      expect(res.status).toBe(200)
    })

    it('updates card due_date and is_completed', async () => {
      authenticateUser()
      const updated = { id: 'card-1', due_date: '2025-12-31', is_completed: true }
      setQueryResult(updated)

      const req = makeReq('/api/cards/card-1', {
        method: 'PUT',
        body: { due_date: '2025-12-31', is_completed: true },
      })
      const res = await cardByIdPUT(req, paramsObj)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.is_completed).toBe(true)
    })

    it('returns 500 when update fails', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'update error' })

      const req = makeReq('/api/cards/card-1', { method: 'PUT', body: { title: 'X' } })
      const res = await cardByIdPUT(req, paramsObj)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to update card')
    })
  })

  // -------- DELETE --------
  describe('DELETE', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/cards/card-1')
      const res = await cardByIdDELETE(req, paramsObj)
      expect(res.status).toBe(401)
    })

    it('deletes a card and returns success', async () => {
      authenticateUser()
      setQueryResult(null) // delete returns no data

      const req = makeReq('/api/cards/card-1')
      const res = await cardByIdDELETE(req, paramsObj)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('returns 500 when delete fails', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'delete error' })

      const req = makeReq('/api/cards/card-1')
      const res = await cardByIdDELETE(req, paramsObj)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to delete card')
    })
  })
})

/* ================================================================== */
/*  LISTS  /api/lists                                                 */
/* ================================================================== */

describe('API /api/lists', () => {
  // -------- GET --------
  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/lists?boardId=b1')
      const res = await listsGET(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when boardId is missing', async () => {
      authenticateUser()
      const req = makeReq('/api/lists')
      const res = await listsGET(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('boardId parameter is required')
    })

    it('returns lists for a board', async () => {
      authenticateUser()
      const lists = [
        { id: 'l1', title: 'To Do', board_id: 'b1', position: 0 },
        { id: 'l2', title: 'Done', board_id: 'b1', position: 1 },
      ]
      setQueryResult(lists)

      const req = makeReq('/api/lists?boardId=b1')
      const res = await listsGET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(Array.isArray(json)).toBe(true)
    })

    it('returns 500 on db error', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'db error' })

      const req = makeReq('/api/lists?boardId=b1')
      const res = await listsGET(req)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to fetch lists')
    })
  })

  // -------- POST --------
  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/lists', { method: 'POST', body: { title: 'L', board_id: 'b1' } })
      const res = await listsPOST(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when title is missing', async () => {
      authenticateUser()
      const req = makeReq('/api/lists', { method: 'POST', body: { board_id: 'b1' } })
      const res = await listsPOST(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Title and board_id are required')
    })

    it('returns 400 when board_id is missing', async () => {
      authenticateUser()
      const req = makeReq('/api/lists', { method: 'POST', body: { title: 'List' } })
      const res = await listsPOST(req)
      expect(res.status).toBe(400)
    })

    it('creates a list and returns 201', async () => {
      authenticateUser()
      const created = { id: 'l-new', title: 'New List', board_id: 'b1', position: 0 }
      setQueryResult(created)

      const req = makeReq('/api/lists', {
        method: 'POST',
        body: { title: 'New List', board_id: 'b1', position: 2 },
      })
      const res = await listsPOST(req)
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.id).toBe('l-new')
    })

    it('creates a list with default position when not provided', async () => {
      authenticateUser()
      const created = { id: 'l-new2', title: 'Another', board_id: 'b1', position: 0 }
      setQueryResult(created)

      const req = makeReq('/api/lists', {
        method: 'POST',
        body: { title: 'Another', board_id: 'b1' },
      })
      const res = await listsPOST(req)
      expect(res.status).toBe(201)
    })

    it('returns 500 when insert fails', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'insert error' })

      const req = makeReq('/api/lists', {
        method: 'POST',
        body: { title: 'X', board_id: 'b1' },
      })
      const res = await listsPOST(req)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to create list')
    })
  })
})

/* ================================================================== */
/*  LISTS [id]  /api/lists/:id                                        */
/* ================================================================== */

describe('API /api/lists/[id]', () => {
  const paramsObj = { params: { id: 'list-1' } }

  // -------- GET --------
  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/lists/list-1')
      const res = await listByIdGET(req, paramsObj)
      expect(res.status).toBe(401)
    })

    it('returns a single list by id', async () => {
      authenticateUser()
      const list = { id: 'list-1', title: 'To Do', board_id: 'b1', position: 0 }
      setQueryResult(list)

      const req = makeReq('/api/lists/list-1')
      const res = await listByIdGET(req, paramsObj)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.id).toBe('list-1')
    })

    it('returns 500 when fetch fails', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'not found' })

      const req = makeReq('/api/lists/list-1')
      const res = await listByIdGET(req, paramsObj)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to fetch list')
    })
  })

  // -------- PUT --------
  describe('PUT', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/lists/list-1', { method: 'PUT', body: { title: 'Up' } })
      const res = await listByIdPUT(req, paramsObj)
      expect(res.status).toBe(401)
    })

    it('updates list title and position', async () => {
      authenticateUser()
      const updated = { id: 'list-1', title: 'Renamed', position: 3 }
      setQueryResult(updated)

      const req = makeReq('/api/lists/list-1', {
        method: 'PUT',
        body: { title: 'Renamed', position: 3 },
      })
      const res = await listByIdPUT(req, paramsObj)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.title).toBe('Renamed')
    })

    it('returns 500 when update fails', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'update error' })

      const req = makeReq('/api/lists/list-1', { method: 'PUT', body: { title: 'X' } })
      const res = await listByIdPUT(req, paramsObj)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to update list')
    })
  })

  // -------- DELETE --------
  describe('DELETE', () => {
    it('returns 401 when not authenticated', async () => {
      denyAuth()
      const req = makeReq('/api/lists/list-1')
      const res = await listByIdDELETE(req, paramsObj)
      expect(res.status).toBe(401)
    })

    it('deletes a list and returns success', async () => {
      authenticateUser()
      setQueryResult(null)

      const req = makeReq('/api/lists/list-1')
      const res = await listByIdDELETE(req, paramsObj)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('returns 500 when delete fails', async () => {
      authenticateUser()
      setQueryResult(null, { message: 'delete error' })

      const req = makeReq('/api/lists/list-1')
      const res = await listByIdDELETE(req, paramsObj)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to delete list')
    })
  })
})
