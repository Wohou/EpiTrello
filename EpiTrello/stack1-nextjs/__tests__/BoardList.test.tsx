/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import BoardList from '../app/boards/BoardList'
import { useLanguage } from '../lib/language-context'

const mockGetUser = jest.fn()
const mockProfileUpdate = jest.fn()

jest.mock('../lib/supabase-browser', () => ({
  supabaseBrowser: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: () => ({
      update: () => ({
        eq: () => mockProfileUpdate(),
      }),
    }),
  },
}))

jest.mock('../lib/language-context', () => ({
  useLanguage: jest.fn(),
}))

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}))

// Mock child components
jest.mock('../components/CreateBoardModal', () => ({
  __esModule: true,
  default: ({ onClose, onCreate }: any) => (
    <div data-testid="create-modal">
      <button onClick={() => onCreate('New Board', 'Desc')}>Create</button>
      <button onClick={onClose}>Close Modal</button>
    </div>
  ),
}))

jest.mock('../components/BoardCard', () => ({
  __esModule: true,
  default: ({ board, onClick, onDelete }: any) => (
    <div data-testid={`board-${board.id}`}>
      <span onClick={onClick}>{board.title}</span>
      <button onClick={onDelete}>Delete</button>
    </div>
  ),
}))

jest.mock('../components/ProfileMenu', () => ({
  __esModule: true,
  default: ({ username }: any) => <div data-testid="profile-menu">{username}</div>,
}))

jest.mock('../components/InvitationsPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="invitations-panel">Invitations</div>,
}))

const mockTranslations = {
  boards: {
    myBoards: 'My Boards',
    welcome: 'Welcome, {name}',
    createBoard: 'Create Board',
    loading: 'Loading...',
  },
  guide: {
    tooltip: 'Help',
  },
}

describe('BoardList', () => {
  const mockBoards = [
    { id: 'b-1', title: 'Board 1', description: 'Desc 1', owner_id: 'u-1', created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: 'b-2', title: 'Board 2', description: null, owner_id: 'u-1', created_at: '2024-01-02', updated_at: '2024-01-02' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useLanguage as jest.Mock).mockReturnValue({ t: mockTranslations })

    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'u-1',
          email: 'test@test.com',
          user_metadata: { username: 'TestUser', avatar_url: null },
        },
      },
    })

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockBoards),
    }) as any
  })

  it('should show loading state initially', () => {
    global.fetch = jest.fn().mockImplementation(() => new Promise(() => {})) as any
    render(<BoardList />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should display boards after loading', async () => {
    render(<BoardList />)

    await waitFor(() => {
      expect(screen.getByText('Board 1')).toBeInTheDocument()
      expect(screen.getByText('Board 2')).toBeInTheDocument()
    })
  })

  it('should display welcome message', async () => {
    render(<BoardList />)

    await waitFor(() => {
      expect(screen.getByText('Welcome, TestUser')).toBeInTheDocument()
    })
  })

  it('should navigate to board on click', async () => {
    render(<BoardList />)

    await waitFor(() => {
      expect(screen.getByText('Board 1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Board 1'))
    expect(mockPush).toHaveBeenCalledWith('/boards/b-1')
  })

  it('should delete a board', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockBoards) })
      .mockResolvedValueOnce({ ok: true }) as any

    render(<BoardList />)

    await waitFor(() => {
      expect(screen.getByText('Board 1')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/boards/b-1', { method: 'DELETE' })
    })
  })

  it('should open create board modal', async () => {
    render(<BoardList />)

    await waitFor(() => {
      expect(screen.getByText('Create Board')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Create Board'))
    expect(screen.getByTestId('create-modal')).toBeInTheDocument()
  })

  it('should create a new board', async () => {
    const newBoard = { id: 'b-3', title: 'New Board', description: 'Desc', owner_id: 'u-1', created_at: '2024-01-03', updated_at: '2024-01-03' }

    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockBoards) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(newBoard) }) as any

    render(<BoardList />)

    await waitFor(() => {
      expect(screen.getByText('Create Board')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Create Board'))
    fireEvent.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/boards', expect.objectContaining({
        method: 'POST',
      }))
    })
  })

  it('should close create modal', async () => {
    render(<BoardList />)

    await waitFor(() => {
      expect(screen.getByText('Create Board')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Create Board'))
    fireEvent.click(screen.getByText('Close Modal'))
    expect(screen.queryByTestId('create-modal')).not.toBeInTheDocument()
  })

  it('should render invitations panel', async () => {
    render(<BoardList />)

    await waitFor(() => {
      expect(screen.getByTestId('invitations-panel')).toBeInTheDocument()
    })
  })

  it('should render profile menu with username', async () => {
    render(<BoardList />)

    await waitFor(() => {
      expect(screen.getByTestId('profile-menu')).toBeInTheDocument()
    })
  })

  it('should handle fetch error gracefully', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as any

    render(<BoardList />)

    await waitFor(() => {
      // Should not crash - loading should complete
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
    jest.restoreAllMocks()
  })

  it('should render help link', async () => {
    render(<BoardList />)

    await waitFor(() => {
      expect(screen.getByText('?')).toBeInTheDocument()
    })
  })
})
