/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import BoardView from '../app/boards/[id]/BoardView'
import { useLanguage } from '../lib/language-context'
import { useNotification } from '../components/NotificationContext'

// ─── Mock language context ──────────────────────────────────────────
jest.mock('../lib/language-context', () => ({
  useLanguage: jest.fn(),
}))

// ─── Mock notification context ──────────────────────────────────────
const mockConfirm = jest.fn()
const mockAlert = jest.fn()
jest.mock('../components/NotificationContext', () => ({
  useNotification: jest.fn(),
}))

// ─── Mock next/navigation ───────────────────────────────────────────
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: 'board-1' }),
}))

// ─── Mock next/link ─────────────────────────────────────────────────
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}))

// ─── Mock @hello-pangea/dnd ─────────────────────────────────────────
let capturedOnDragEnd: any = null
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children, onDragEnd }: any) => {
    capturedOnDragEnd = onDragEnd
    return <div data-testid="dnd-context">{children}</div>
  },
  Droppable: ({ children }: any) =>
    children(
      { droppableProps: {}, innerRef: jest.fn(), placeholder: null },
      {}
    ),
  Draggable: ({ children }: any) =>
    children(
      { draggableProps: {}, dragHandleProps: {}, innerRef: jest.fn() },
      { isDragging: false }
    ),
}))

// ─── Mock child components ──────────────────────────────────────────
jest.mock('../components/ListColumn', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid={`list-${props.list.id}`}>
      <span>{props.list.title}</span>
      <button data-testid={`delete-list-${props.list.id}`} onClick={props.onDeleteList}>
        Delete List
      </button>
      <button
        data-testid={`create-card-${props.list.id}`}
        onClick={() => props.onCreateCard('New Card', 'Card desc')}
      >
        Add Card
      </button>
      <button
        data-testid={`update-list-${props.list.id}`}
        onClick={() => props.onUpdateList(props.list.id, 'Updated Title')}
      >
        Update List
      </button>
      {props.list.cards.map((c: any) => (
        <div key={c.id} data-testid={`card-${c.id}`}>
          <span>{c.title}</span>
          <button
            data-testid={`delete-card-${c.id}`}
            onClick={() => props.onDeleteCard(c.id)}
          >
            Delete Card
          </button>
          <button
            data-testid={`update-card-${c.id}`}
            onClick={() => props.onUpdateCard(c.id, { title: 'Updated Card' })}
          >
            Update Card
          </button>
        </div>
      ))}
      {props.isSharedBoard && <span data-testid="shared-badge">shared</span>}
    </div>
  ),
}))

jest.mock('../components/CreateListButton', () => ({
  __esModule: true,
  default: ({ onCreate }: any) => (
    <div data-testid="create-list-btn">
      <button data-testid="create-list-action" onClick={() => onCreate('New List')}>
        Create List
      </button>
    </div>
  ),
}))

let lastInviteError: Error | null = null
let lastRevokeError: Error | null = null
jest.mock('../components/BoardManageMenu', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="manage-menu">
      <span data-testid="is-owner">{String(props.isOwner)}</span>
      <span data-testid="member-count">{props.members.length}</span>
      <button data-testid="invite-btn" onClick={() => {
        props.onInvite('user-2').catch((e: Error) => { lastInviteError = e })
      }}>
        Invite
      </button>
      <button data-testid="revoke-btn" onClick={() => {
        props.onRevokeMember('user-2').catch((e: Error) => { lastRevokeError = e })
      }}>
        Revoke
      </button>
      <button data-testid="leave-btn" onClick={() => props.onLeaveBoard()}>
        Leave
      </button>
      <button data-testid="refresh-members-btn" onClick={props.onRefreshMembers}>
        Refresh
      </button>
    </div>
  ),
}))

// ─── Mock supabase-browser ──────────────────────────────────────────
const mockGetUser = jest.fn()
const mockChannelOn = jest.fn()
const mockSubscribe = jest.fn()
const mockRemoveChannel = jest.fn()
const mockChannelSend = jest.fn()

const mockChannelObj = {
  on: (...args: any[]) => {
    mockChannelOn(...args)
    return mockChannelObj
  },
  subscribe: (cb?: any) => {
    mockSubscribe(cb)
    return mockChannelObj
  },
  send: mockChannelSend,
}

jest.mock('../lib/supabase-browser', () => ({
  supabaseBrowser: {
    auth: {
      getUser: () => mockGetUser(),
    },
    channel: () => mockChannelObj,
    removeChannel: (...args: any[]) => mockRemoveChannel(...args),
  },
}))

// ─── CSS import mock ────────────────────────────────────────────────
jest.mock('../app/boards/[id]/BoardView.css', () => ({}))

// ─── Translations ───────────────────────────────────────────────────
const mockTranslations = {
  common: {
    cancel: 'Cancel',
    delete: 'Delete',
    save: 'Save',
    loading: 'Loading...',
    error: 'Error',
  },
  boards: {
    loadingBoard: 'Loading board...',
    boardNotFound: 'Board not found',
    backToBoards: 'Back to boards',
    myBoards: 'My Boards',
    deleteBoard: 'Delete board',
    deleteConfirm: 'Are you sure?',
  },
  lists: {
    addAnotherList: 'Add another list',
    enterListTitle: 'Enter list title',
    createList: 'Add list',
    deleteList: 'Delete list',
    deleteListConfirm: 'Delete this list?',
  },
  cards: {
    addCard: 'Add card',
    addDescription: 'Add a description...',
    titlePlaceholder: 'Card title',
    descriptionOptional: 'Description (optional)',
  },
  sharing: {
    sharedBy: 'Shared by {name}',
  },
}

// ─── Test data ──────────────────────────────────────────────────────
const mockBoardData = {
  id: 'board-1',
  title: 'Test Board',
  description: 'A test board',
  owner_id: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  lists: [
    {
      id: 'list-1',
      title: 'To Do',
      position: 0,
      board_id: 'board-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      cards: [
        {
          id: 'card-1',
          title: 'Task 1',
          description: 'First task',
          position: 0,
          list_id: 'list-1',
          cover_color: null,
          cover_image: null,
          is_completed: false,
          start_date: null,
          due_date: null,
          created_by: null,
          last_modified_by: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'card-2',
          title: 'Task 2',
          description: null,
          position: 1,
          list_id: 'list-1',
          cover_color: null,
          cover_image: null,
          is_completed: false,
          start_date: null,
          due_date: null,
          created_by: null,
          last_modified_by: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
    },
    {
      id: 'list-2',
      title: 'In Progress',
      position: 1,
      board_id: 'board-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      cards: [
        {
          id: 'card-3',
          title: 'Task 3',
          description: null,
          position: 0,
          list_id: 'list-2',
          cover_color: null,
          cover_image: null,
          is_completed: false,
          start_date: null,
          due_date: null,
          created_by: null,
          last_modified_by: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
    },
  ],
}

const mockMembersData = [
  {
    id: 'member-1',
    board_id: 'board-1',
    user_id: 'user-1',
    role: 'owner' as const,
    joined_at: '2024-01-01T00:00:00Z',
    username: 'TestUser',
  },
  {
    id: 'member-2',
    board_id: 'board-1',
    user_id: 'user-2',
    role: 'member' as const,
    joined_at: '2024-01-02T00:00:00Z',
    username: 'OtherUser',
  },
]

// ─── Helpers ────────────────────────────────────────────────────────
function setupFetchMock(overrides: Record<string, any> = {}) {
  global.fetch = jest.fn((url: string, options?: any) => {
    // Check overrides first (exact match then includes)
    for (const [pattern, response] of Object.entries(overrides)) {
      if (url === pattern || url.includes(pattern)) {
        if (typeof response === 'function') {
          return Promise.resolve(response(url, options))
        }
        return Promise.resolve(response)
      }
    }
    // Default API responses (check more specific URLs first)
    if (url.includes('/api/boards/board-1/members')) {
      return Promise.resolve({ ok: true, json: async () => [...mockMembersData] })
    }
    if (url.includes('/api/boards/board-1')) {
      return Promise.resolve({ ok: true, json: async () => ({ ...mockBoardData }) })
    }
    // Fallback
    return Promise.resolve({ ok: true, json: async () => ({}) })
  }) as jest.Mock
}

async function renderAndWait(boardId = 'board-1') {
  let result: ReturnType<typeof render> | undefined
  await act(async () => {
    result = render(<BoardView boardId={boardId} />)
  })
  // Wait for loading to complete
  await waitFor(() => {
    expect(screen.queryByText('Loading board...')).not.toBeInTheDocument()
  })
  return result!
}

// ═════════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════════

describe('BoardView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedOnDragEnd = null
    lastInviteError = null
    lastRevokeError = null
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', user_metadata: { username: 'TestUser' } } },
    })
    ;(useLanguage as jest.Mock).mockReturnValue({ language: 'en', t: mockTranslations })
    ;(useNotification as jest.Mock).mockReturnValue({ confirm: mockConfirm, alert: mockAlert })
    setupFetchMock()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // ─── Loading state ──────────────────────────────────────────────
  describe('Loading state', () => {
    it('should show loading text initially', async () => {
      // Make fetch hang so loading stays visible
      global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock

      await act(async () => {
        render(<BoardView boardId="board-1" />)
      })

      expect(screen.getByText('Loading board...')).toBeInTheDocument()
    })

    it('should remove loading once data is fetched', async () => {
      await renderAndWait()

      expect(screen.queryByText('Loading board...')).not.toBeInTheDocument()
    })
  })

  // ─── Board not found ───────────────────────────────────────────
  describe('Board not found', () => {
    it('should show board not found when API returns error', async () => {
      setupFetchMock({
        '/api/boards/board-1': { ok: false, status: 404 },
      })

      await act(async () => {
        render(<BoardView boardId="board-1" />)
      })

      await waitFor(() => {
        expect(screen.getByText('Board not found')).toBeInTheDocument()
      })
    })

    it('should show board not found when fetch throws', async () => {
      global.fetch = jest.fn((url: string) => {
        if (url.includes('/api/boards/board-1') && !url.includes('members')) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({ ok: true, json: async () => ([]) })
      }) as jest.Mock

      await act(async () => {
        render(<BoardView boardId="board-1" />)
      })

      await waitFor(() => {
        expect(screen.getByText('Board not found')).toBeInTheDocument()
      })
    })
  })

  // ─── Board rendering ──────────────────────────────────────────
  describe('Board rendering', () => {
    it('should render board title', async () => {
      await renderAndWait()

      expect(screen.getByText('Test Board')).toBeInTheDocument()
    })

    it('should render board description', async () => {
      await renderAndWait()

      expect(screen.getByText('A test board')).toBeInTheDocument()
    })

    it('should render placeholder when description is null', async () => {
      setupFetchMock({
        '/api/boards/board-1': {
          ok: true,
          json: async () => ({ ...mockBoardData, description: null }),
        },
      })

      await renderAndWait()

      expect(screen.getByText('Add a description...')).toBeInTheDocument()
    })

    it('should render all lists', async () => {
      await renderAndWait()

      expect(screen.getByTestId('list-list-1')).toBeInTheDocument()
      expect(screen.getByTestId('list-list-2')).toBeInTheDocument()
      expect(screen.getByText('To Do')).toBeInTheDocument()
      expect(screen.getByText('In Progress')).toBeInTheDocument()
    })

    it('should render cards within lists', async () => {
      await renderAndWait()

      expect(screen.getByTestId('card-card-1')).toBeInTheDocument()
      expect(screen.getByTestId('card-card-2')).toBeInTheDocument()
      expect(screen.getByTestId('card-card-3')).toBeInTheDocument()
    })

    it('should render the DragDropContext', async () => {
      await renderAndWait()

      expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
    })

    it('should render the CreateListButton', async () => {
      await renderAndWait()

      expect(screen.getByTestId('create-list-btn')).toBeInTheDocument()
    })

    it('should render the BoardManageMenu', async () => {
      await renderAndWait()

      expect(screen.getByTestId('manage-menu')).toBeInTheDocument()
    })
  })

  // ─── Back to boards ───────────────────────────────────────────
  describe('Back to boards', () => {
    it('should render back button with translated text', async () => {
      await renderAndWait()

      expect(screen.getByText(/Back to boards/)).toBeInTheDocument()
    })

    it('should navigate to /boards when back button is clicked', async () => {
      await renderAndWait()

      const backButton = screen.getByText(/Back to boards/)
      fireEvent.click(backButton)

      expect(mockPush).toHaveBeenCalledWith('/boards')
    })
  })

  // ─── Owner vs shared board ────────────────────────────────────
  describe('Owner vs shared board', () => {
    it('should set isOwner=true when user is the board owner', async () => {
      await renderAndWait()

      expect(screen.getByTestId('is-owner')).toHaveTextContent('true')
    })

    it('should set isOwner=false when user is not the board owner', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-other', user_metadata: { username: 'Other' } } },
      })

      await renderAndWait()

      expect(screen.getByTestId('is-owner')).toHaveTextContent('false')
    })

    it('should mark board as shared when user is not owner', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-other', user_metadata: { username: 'Other' } } },
      })

      await renderAndWait()

      // ListColumn receives isSharedBoard=true, our mock renders a badge
      const badges = screen.getAllByTestId('shared-badge')
      expect(badges.length).toBeGreaterThan(0)
    })

    it('should not mark board as shared when user is owner', async () => {
      await renderAndWait()

      expect(screen.queryByTestId('shared-badge')).not.toBeInTheDocument()
    })
  })

  // ─── Board members ────────────────────────────────────────────
  describe('Board members', () => {
    it('should fetch and pass members to BoardManageMenu', async () => {
      await renderAndWait()

      expect(screen.getByTestId('member-count')).toHaveTextContent('2')
    })

    it('should handle invite member', async () => {
      setupFetchMock({
        '/api/invitations': { ok: true, json: async () => ({ success: true }) },
      })

      await renderAndWait()

      await act(async () => {
        fireEvent.click(screen.getByTestId('invite-btn'))
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/invitations',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ board_id: 'board-1', invitee_id: 'user-2' }),
        })
      )
    })

    it('should handle revoke member', async () => {
      await renderAndWait()

      await act(async () => {
        fireEvent.click(screen.getByTestId('revoke-btn'))
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/boards/board-1/members?userId=user-2',
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('should handle leave board and navigate away', async () => {
      setupFetchMock({
        '/api/boards/board-1/members': { ok: true, json: async () => mockMembersData },
      })

      // For the DELETE call we need a separate matcher
      global.fetch = jest.fn((url: string, opts?: any) => {
        if (url === '/api/boards/board-1/members' && opts?.method === 'DELETE') {
          return Promise.resolve({ ok: true, json: async () => ({}) })
        }
        if (url === '/api/boards/board-1/members') {
          return Promise.resolve({ ok: true, json: async () => [...mockMembersData] })
        }
        if (url.includes('/api/boards/board-1')) {
          return Promise.resolve({ ok: true, json: async () => ({ ...mockBoardData }) })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }) as jest.Mock

      await renderAndWait()

      await act(async () => {
        fireEvent.click(screen.getByTestId('leave-btn'))
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/boards')
      })
    })

    it('should handle refresh members', async () => {
      await renderAndWait()

      const fetchCallsBefore = (global.fetch as jest.Mock).mock.calls.length

      await act(async () => {
        fireEvent.click(screen.getByTestId('refresh-members-btn'))
      })

      await waitFor(() => {
        expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(fetchCallsBefore)
      })
    })
  })

  // ─── Title editing ────────────────────────────────────────────
  describe('Title editing', () => {
    it('should enter title edit mode on double click', async () => {
      await renderAndWait()

      const title = screen.getByText('Test Board')
      fireEvent.doubleClick(title)

      expect(screen.getByDisplayValue('Test Board')).toBeInTheDocument()
    })

    it('should save title on Enter key', async () => {
      setupFetchMock({
        '/api/boards/board-1': (url: string, opts?: any) => {
          if (opts?.method === 'PUT') {
            return { ok: true, json: async () => ({ ...mockBoardData, title: 'Updated Title' }) }
          }
          return { ok: true, json: async () => ({ ...mockBoardData }) }
        },
      })

      await renderAndWait()

      fireEvent.doubleClick(screen.getByText('Test Board'))

      const input = screen.getByDisplayValue('Test Board')
      fireEvent.change(input, { target: { value: 'Updated Title' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/boards/board-1',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ title: 'Updated Title' }),
          })
        )
      })
    })

    it('should save title on validate button click', async () => {
      setupFetchMock({
        '/api/boards/board-1': (url: string, opts?: any) => {
          if (opts?.method === 'PUT') {
            return { ok: true, json: async () => ({ ...mockBoardData, title: 'New' }) }
          }
          return { ok: true, json: async () => ({ ...mockBoardData }) }
        },
      })

      await renderAndWait()

      fireEvent.doubleClick(screen.getByText('Test Board'))

      const input = screen.getByDisplayValue('Test Board')
      fireEvent.change(input, { target: { value: 'New' } })

      const saveBtn = screen.getByText('✓')
      fireEvent.click(saveBtn)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/boards/board-1',
          expect.objectContaining({ method: 'PUT' })
        )
      })
    })

    it('should cancel title editing on cancel button click', async () => {
      await renderAndWait()

      fireEvent.doubleClick(screen.getByText('Test Board'))
      expect(screen.getByDisplayValue('Test Board')).toBeInTheDocument()

      const cancelBtn = screen.getByText('✕')
      fireEvent.click(cancelBtn)

      expect(screen.queryByDisplayValue('Test Board')).not.toBeInTheDocument()
      expect(screen.getByText('Test Board')).toBeInTheDocument()
    })

    it('should not save empty title', async () => {
      await renderAndWait()

      fireEvent.doubleClick(screen.getByText('Test Board'))

      const input = screen.getByDisplayValue('Test Board')
      fireEvent.change(input, { target: { value: '   ' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      // fetch should not be called with PUT for the board when title is blank
      const putCalls = (global.fetch as jest.Mock).mock.calls.filter(
        ([url, opts]: any) => url === '/api/boards/board-1' && opts?.method === 'PUT'
      )
      expect(putCalls.length).toBe(0)
    })
  })

  // ─── Description editing ──────────────────────────────────────
  describe('Description editing', () => {
    it('should enter description edit mode on double click', async () => {
      await renderAndWait()

      const desc = screen.getByText('A test board')
      fireEvent.doubleClick(desc)

      expect(screen.getByDisplayValue('A test board')).toBeInTheDocument()
    })

    it('should save description on validate click', async () => {
      setupFetchMock({
        '/api/boards/board-1': (url: string, opts?: any) => {
          if (opts?.method === 'PUT') {
            return {
              ok: true,
              json: async () => ({ ...mockBoardData, description: 'New desc' }),
            }
          }
          return { ok: true, json: async () => ({ ...mockBoardData }) }
        },
      })

      await renderAndWait()

      fireEvent.doubleClick(screen.getByText('A test board'))

      const textarea = screen.getByDisplayValue('A test board')
      fireEvent.change(textarea, { target: { value: 'New desc' } })

      // There are two ✓ buttons potentially, pick the one visible
      const saveBtns = screen.getAllByText('✓')
      fireEvent.click(saveBtns[0])

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/boards/board-1',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ description: 'New desc' }),
          })
        )
      })
    })

    it('should cancel description editing', async () => {
      await renderAndWait()

      fireEvent.doubleClick(screen.getByText('A test board'))
      expect(screen.getByDisplayValue('A test board')).toBeInTheDocument()

      const cancelBtns = screen.getAllByText('✕')
      fireEvent.click(cancelBtns[0])

      expect(screen.getByText('A test board')).toBeInTheDocument()
    })
  })

  // ─── Create list ──────────────────────────────────────────────
  describe('Create list', () => {
    it('should create a new list when CreateListButton fires', async () => {
      const newList = {
        id: 'list-new',
        title: 'New List',
        position: 2,
        board_id: 'board-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      setupFetchMock({
        '/api/lists': { ok: true, json: async () => newList },
      })

      await renderAndWait()

      await act(async () => {
        fireEvent.click(screen.getByTestId('create-list-action'))
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/lists',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ title: 'New List', board_id: 'board-1', position: 2 }),
          })
        )
      })
    })
  })

  // ─── Delete list ──────────────────────────────────────────────
  describe('Delete list', () => {
    it('should delete a list when onDeleteList is called', async () => {
      await renderAndWait()

      await act(async () => {
        fireEvent.click(screen.getByTestId('delete-list-list-1'))
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/lists/list-1',
          expect.objectContaining({ method: 'DELETE' })
        )
      })
    })
  })

  // ─── Create card ──────────────────────────────────────────────
  describe('Create card', () => {
    it('should create a card in a list', async () => {
      const newCard = {
        id: 'card-new',
        title: 'New Card',
        description: 'Card desc',
        position: 2,
        list_id: 'list-1',
      }

      setupFetchMock({
        '/api/cards': { ok: true, json: async () => newCard },
      })

      await renderAndWait()

      await act(async () => {
        fireEvent.click(screen.getByTestId('create-card-list-1'))
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/cards',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              title: 'New Card',
              description: 'Card desc',
              list_id: 'list-1',
              position: 2,
            }),
          })
        )
      })
    })
  })

  // ─── Delete card ──────────────────────────────────────────────
  describe('Delete card', () => {
    it('should delete a card', async () => {
      await renderAndWait()

      await act(async () => {
        fireEvent.click(screen.getByTestId('delete-card-card-1'))
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/cards/card-1',
          expect.objectContaining({ method: 'DELETE' })
        )
      })
    })
  })

  // ─── Update card ──────────────────────────────────────────────
  describe('Update card', () => {
    it('should update a card', async () => {
      setupFetchMock({
        '/api/cards/card-1': (url: string, opts?: any) => {
          if (opts?.method === 'PUT') {
            return { ok: true, json: async () => ({ ...mockBoardData.lists[0].cards[0], title: 'Updated Card' }) }
          }
          return { ok: true, json: async () => ({}) }
        },
      })

      await renderAndWait()

      await act(async () => {
        fireEvent.click(screen.getByTestId('update-card-card-1'))
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/cards/card-1',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ title: 'Updated Card' }),
          })
        )
      })
    })
  })

  // ─── Update list ──────────────────────────────────────────────
  describe('Update list title', () => {
    it('should update a list title', async () => {
      setupFetchMock({
        '/api/lists/list-1': (url: string, opts?: any) => {
          if (opts?.method === 'PUT') {
            return { ok: true, json: async () => ({ id: 'list-1', title: 'Updated Title' }) }
          }
          return { ok: true, json: async () => ({}) }
        },
      })

      await renderAndWait()

      await act(async () => {
        fireEvent.click(screen.getByTestId('update-list-list-1'))
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/lists/list-1',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ title: 'Updated Title' }),
          })
        )
      })
    })
  })

  // ─── Drag and drop ────────────────────────────────────────────
  describe('Drag and drop', () => {
    it('should do nothing when dropped outside a droppable', async () => {
      await renderAndWait()

      const fetchCallCount = (global.fetch as jest.Mock).mock.calls.length

      await act(async () => {
        capturedOnDragEnd({
          destination: null,
          source: { droppableId: 'board', index: 0 },
          type: 'list',
        })
      })

      // No additional fetch calls for reorder
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(fetchCallCount)
    })

    it('should do nothing when dropped in same position', async () => {
      await renderAndWait()

      const fetchCallCount = (global.fetch as jest.Mock).mock.calls.length

      await act(async () => {
        capturedOnDragEnd({
          destination: { droppableId: 'board', index: 0 },
          source: { droppableId: 'board', index: 0 },
          type: 'list',
        })
      })

      expect((global.fetch as jest.Mock).mock.calls.length).toBe(fetchCallCount)
    })

    it('should reorder lists when list is dragged', async () => {
      await renderAndWait()

      await act(async () => {
        capturedOnDragEnd({
          destination: { droppableId: 'board', index: 1 },
          source: { droppableId: 'board', index: 0 },
          type: 'list',
        })
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/lists/reorder',
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      })
    })

    it('should reorder cards within same list', async () => {
      await renderAndWait()

      await act(async () => {
        capturedOnDragEnd({
          destination: { droppableId: 'list-1', index: 1 },
          source: { droppableId: 'list-1', index: 0 },
          type: 'card',
        })
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/cards/reorder',
          expect.objectContaining({
            method: 'PUT',
          })
        )
      })

      // Verify the payload includes cards with updated positions
      const reorderCall = (global.fetch as jest.Mock).mock.calls.find(
        ([url]: any) => url === '/api/cards/reorder'
      )
      const body = JSON.parse(reorderCall[1].body)
      expect(body.cards).toHaveLength(2)
      expect(body.cards[0].list_id).toBe('list-1')
    })

    it('should move card between lists', async () => {
      await renderAndWait()

      await act(async () => {
        capturedOnDragEnd({
          destination: { droppableId: 'list-2', index: 0 },
          source: { droppableId: 'list-1', index: 0 },
          type: 'card',
        })
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/cards/reorder',
          expect.objectContaining({ method: 'PUT' })
        )
      })

      const reorderCall = (global.fetch as jest.Mock).mock.calls.find(
        ([url, o]: any) => url === '/api/cards/reorder' && o?.method === 'PUT'
      )
      const body = JSON.parse(reorderCall[1].body)
      // Should contain cards from both source and destination lists
      const listIds = body.cards.map((c: any) => c.list_id)
      expect(listIds).toContain('list-1')
      expect(listIds).toContain('list-2')
    })

    it('should broadcast after list reorder', async () => {
      await renderAndWait()

      await act(async () => {
        capturedOnDragEnd({
          destination: { droppableId: 'board', index: 1 },
          source: { droppableId: 'board', index: 0 },
          type: 'list',
        })
      })

      await waitFor(() => {
        expect(mockChannelSend).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'broadcast',
            event: 'board-update',
          })
        )
      })
    })

    it('should revert on list reorder error', async () => {
      global.fetch = jest.fn((url: string) => {
        if (url === '/api/lists/reorder') {
          return Promise.reject(new Error('Reorder failed'))
        }
        if (url.includes('/api/boards/board-1/members')) {
          return Promise.resolve({ ok: true, json: async () => [...mockMembersData] })
        }
        if (url.includes('/api/boards/board-1')) {
          return Promise.resolve({ ok: true, json: async () => ({ ...mockBoardData }) })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }) as jest.Mock

      await renderAndWait()

      await act(async () => {
        capturedOnDragEnd({
          destination: { droppableId: 'board', index: 1 },
          source: { droppableId: 'board', index: 0 },
          type: 'list',
        })
      })

      // Should have called fetchBoard again to revert
      await waitFor(() => {
        const boardFetches = (global.fetch as jest.Mock).mock.calls.filter(
          ([url, opts]: any) => url.includes('/api/boards/board-1') && !url.includes('members') && !opts?.method
        )
        // Initial fetch + revert fetch
        expect(boardFetches.length).toBeGreaterThanOrEqual(2)
      })
    })
  })

  // ─── Realtime subscription ────────────────────────────────────
  describe('Realtime subscription', () => {
    it('should set up realtime channel on mount', async () => {
      await renderAndWait()

      // channel().on() should have been called multiple times for different events
      expect(mockChannelOn).toHaveBeenCalled()
      expect(mockSubscribe).toHaveBeenCalled()
    })

    it('should clean up channel on unmount', async () => {
      const { unmount } = await renderAndWait() as any

      act(() => {
        unmount()
      })

      expect(mockRemoveChannel).toHaveBeenCalled()
    })

    it('should listen for broadcast events', async () => {
      await renderAndWait()

      // Verify .on was called with 'broadcast'
      const broadcastCall = mockChannelOn.mock.calls.find(
        (args: any) => args[0] === 'broadcast'
      )
      expect(broadcastCall).toBeDefined()
    })

    it('should listen for postgres_changes on lists', async () => {
      await renderAndWait()

      const pgChangesCall = mockChannelOn.mock.calls.find(
        (args: any) =>
          args[0] === 'postgres_changes' &&
          args[1]?.table === 'lists'
      )
      expect(pgChangesCall).toBeDefined()
    })

    it('should listen for postgres_changes on cards', async () => {
      await renderAndWait()

      const pgChangesCall = mockChannelOn.mock.calls.find(
        (args: any) =>
          args[0] === 'postgres_changes' &&
          args[1]?.table === 'cards'
      )
      expect(pgChangesCall).toBeDefined()
    })

    it('should listen for postgres_changes on boards', async () => {
      await renderAndWait()

      const pgChangesCall = mockChannelOn.mock.calls.find(
        (args: any) =>
          args[0] === 'postgres_changes' &&
          args[1]?.table === 'boards'
      )
      expect(pgChangesCall).toBeDefined()
    })

    it('should listen for postgres_changes on card_github_links', async () => {
      await renderAndWait()

      const pgChangesCall = mockChannelOn.mock.calls.find(
        (args: any) =>
          args[0] === 'postgres_changes' &&
          args[1]?.table === 'card_github_links'
      )
      expect(pgChangesCall).toBeDefined()
    })
  })

  // ─── Error handling for API calls ─────────────────────────────
  describe('Error handling', () => {
    it('should handle invite error gracefully', async () => {
      global.fetch = jest.fn((url: string, opts?: any) => {
        if (url === '/api/invitations' && opts?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            json: async () => ({ error: 'Already invited' }),
          })
        }
        if (url.includes('/api/boards/board-1/members')) {
          return Promise.resolve({ ok: true, json: async () => [...mockMembersData] })
        }
        if (url.includes('/api/boards/board-1')) {
          return Promise.resolve({ ok: true, json: async () => ({ ...mockBoardData }) })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }) as jest.Mock

      await renderAndWait()

      await act(async () => {
        fireEvent.click(screen.getByTestId('invite-btn'))
      })

      // Wait for async handler to complete
      await waitFor(() => {
        expect(lastInviteError).not.toBeNull()
      })
      expect(lastInviteError!.message).toBe('Already invited')
    })

    it('should handle revoke member error gracefully', async () => {
      global.fetch = jest.fn((url: string, opts?: any) => {
        if (url.includes('members?userId=') && opts?.method === 'DELETE') {
          return Promise.resolve({
            ok: false,
            json: async () => ({ error: 'Cannot remove owner' }),
          })
        }
        if (url.includes('/api/boards/board-1/members')) {
          return Promise.resolve({ ok: true, json: async () => [...mockMembersData] })
        }
        if (url.includes('/api/boards/board-1')) {
          return Promise.resolve({ ok: true, json: async () => ({ ...mockBoardData }) })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }) as jest.Mock

      await renderAndWait()

      await act(async () => {
        fireEvent.click(screen.getByTestId('revoke-btn'))
      })

      await waitFor(() => {
        expect(lastRevokeError).not.toBeNull()
      })
      expect(lastRevokeError!.message).toBe('Cannot remove owner')
    })

    it('should handle board title update error', async () => {
      global.fetch = jest.fn((url: string, opts?: any) => {
        if (url === '/api/boards/board-1' && opts?.method === 'PUT') {
          return Promise.resolve({ ok: false, status: 500 })
        }
        if (url.includes('/api/boards/board-1/members')) {
          return Promise.resolve({ ok: true, json: async () => [...mockMembersData] })
        }
        if (url.includes('/api/boards/board-1')) {
          return Promise.resolve({ ok: true, json: async () => ({ ...mockBoardData }) })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }) as jest.Mock

      await renderAndWait()

      fireEvent.doubleClick(screen.getByText('Test Board'))
      const input = screen.getByDisplayValue('Test Board')
      fireEvent.change(input, { target: { value: 'Will Fail' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      // Should exit edit mode even on error
      await waitFor(() => {
        expect(screen.queryByDisplayValue('Will Fail')).not.toBeInTheDocument()
      })
    })

    it('should handle board description update error', async () => {
      global.fetch = jest.fn((url: string, opts?: any) => {
        if (url === '/api/boards/board-1' && opts?.method === 'PUT') {
          return Promise.resolve({ ok: false, status: 500 })
        }
        if (url.includes('/api/boards/board-1/members')) {
          return Promise.resolve({ ok: true, json: async () => [...mockMembersData] })
        }
        if (url.includes('/api/boards/board-1')) {
          return Promise.resolve({ ok: true, json: async () => ({ ...mockBoardData }) })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }) as jest.Mock

      await renderAndWait()

      fireEvent.doubleClick(screen.getByText('A test board'))
      const textarea = screen.getByDisplayValue('A test board')
      fireEvent.change(textarea, { target: { value: 'Will Fail' } })

      const saveBtns = screen.getAllByText('✓')
      fireEvent.click(saveBtns[0])

      await waitFor(() => {
        expect(screen.queryByDisplayValue('Will Fail')).not.toBeInTheDocument()
      })
    })

    it('should handle create list fetch error', async () => {
      global.fetch = jest.fn((url: string, opts?: any) => {
        if (url === '/api/lists' && opts?.method === 'POST') {
          return Promise.reject(new Error('Network error'))
        }
        if (url.includes('/api/boards/board-1/members')) {
          return Promise.resolve({ ok: true, json: async () => [...mockMembersData] })
        }
        if (url.includes('/api/boards/board-1')) {
          return Promise.resolve({ ok: true, json: async () => ({ ...mockBoardData }) })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }) as jest.Mock

      await renderAndWait()

      // Should not throw
      await act(async () => {
        fireEvent.click(screen.getByTestId('create-list-action'))
      })

      // Component should still be rendered
      expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
    })

    it('should handle card move reorder error by refetching board', async () => {
      let callCount = 0
      global.fetch = jest.fn((url: string, opts?: any) => {
        if (url === '/api/cards/reorder' && opts?.method === 'PUT') {
          return Promise.reject(new Error('Reorder failed'))
        }
        if (url.includes('/api/boards/board-1/members')) {
          return Promise.resolve({ ok: true, json: async () => [...mockMembersData] })
        }
        if (url.includes('/api/boards/board-1')) {
          callCount++
          return Promise.resolve({ ok: true, json: async () => ({ ...mockBoardData }) })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }) as jest.Mock

      await renderAndWait()
      const boardFetchesBefore = callCount

      await act(async () => {
        capturedOnDragEnd({
          destination: { droppableId: 'list-2', index: 0 },
          source: { droppableId: 'list-1', index: 0 },
          type: 'card',
        })
      })

      await waitFor(() => {
        expect(callCount).toBeGreaterThan(boardFetchesBefore)
      })
    })
  })

  // ─── boardId prop ─────────────────────────────────────────────
  describe('boardId prop', () => {
    it('should use the boardId prop for API calls', async () => {
      global.fetch = jest.fn((url: string) => {
        if (url.includes('/api/boards/custom-id/members')) {
          return Promise.resolve({ ok: true, json: async () => [] })
        }
        if (url.includes('/api/boards/custom-id')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ ...mockBoardData, id: 'custom-id' }),
          })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }) as jest.Mock

      await act(async () => {
        render(<BoardView boardId="custom-id" />)
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/boards/custom-id')
      })
    })
  })
})
