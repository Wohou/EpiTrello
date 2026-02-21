/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import GitHubPowerUp from '../components/GitHubPowerUp'

/* ─── notification mocks ─── */

const mockAlert = jest.fn().mockResolvedValue(undefined)
const mockConfirm = jest.fn().mockResolvedValue(true)

/* ─── module mocks ─── */

jest.mock('../lib/language-context', () => ({
  useLanguage: jest.fn(),
}))

jest.mock('../components/NotificationContext', () => ({
  useNotification: () => ({ alert: mockAlert, confirm: mockConfirm }),
}))

const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnThis(),
}

jest.mock('../lib/supabase-browser', () => ({
  supabaseBrowser: {
    channel: jest.fn(() => mockChannel),
    removeChannel: jest.fn(),
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'tok' } },
      }),
      linkIdentity: jest.fn().mockResolvedValue({ error: null }),
    },
  },
}))

jest.mock('../components/GitHubPowerUp.css', () => ({}))

/* ─── translations ─── */

const mockTranslations: Record<string, any> = {
  common: {
    delete: 'Delete',
    cancel: 'Cancel',
    back: 'Back',
  },
  github: {
    powerUp: 'GitHub Power-Up',
    notConnected: 'GitHub is not connected',
    connectGitHub: 'Connect GitHub',
    connected: 'Connected as',
    disconnectGitHub: 'Disconnect',
    linkIssue: 'Link issue',
    createIssue: 'Create issue',
    linkedIssues: 'Linked issues',
    loading: 'Loading…',
    noLinkedIssues: 'No linked issues',
    clickToClose: 'Click to close',
    clickToReopen: 'Click to reopen',
    openIssue: 'Open',
    closedIssue: 'Closed',
    viewOnGitHub: 'View on GitHub',
    unlink: 'Unlink',
    linkExisting: 'Link existing issue',
    selectRepository: 'Select repository',
    loadingRepos: 'Loading repos…',
    noRepos: 'No repos found',
    selectRepoPlaceholder: 'Choose a repo',
    selectIssue: 'Select issue',
    loadingIssues: 'Loading issues…',
    noIssues: 'No issues',
    selectIssuePlaceholder: 'Choose an issue',
    issueTitle: 'Title',
    issueTitlePlaceholder: 'Issue title',
    issueDescription: 'Description',
    issueDescriptionPlaceholder: 'Describe the issue',
    creatingIssue: 'Creating…',
    createAndLink: 'Create & Link',
    connectionError: 'GitHub connection error',
    error: 'An error occurred',
    linkError: 'Error linking issue',
    createError: 'Error creating issue',
    unlinkConfirm: 'Unlink this issue?',
    closeAction: 'close',
    reopenAction: 'reopen',
    toggleIssueConfirm: 'Do you want to {action} #{number}?',
    toggleError: 'Error toggling issue',
  },
}

const { useLanguage } = require('../lib/language-context') as { useLanguage: jest.Mock }

/* ─── helpers ─── */

const onClose = jest.fn()
const onUpdate = jest.fn()

const defaultProps = { cardId: 'card-1', onClose, onUpdate }

/** Utility: build a fetch mock that dispatches by URL+method */
function mockFetchWith(overrides: Record<string, any> = {}) {
  const defaults: Record<string, any> = {
    // GitHub connection check
    'GET /api/github/connect': {
      ok: true,
      json: async () => ({ connected: true, hasRepoScope: true, github_username: 'octocat' }),
    },
    // Linked issues for card
    'GET /api/cards/card-1/github': {
      ok: true,
      json: async () => [],
    },
    // GitHub token
    'GET /api/github/token': {
      ok: true,
      json: async () => ({ token: 'gh-tok-123' }),
    },
  }

  const mapping = { ...defaults, ...overrides }

  return jest.fn().mockImplementation((url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    // strip origin for absolute URLs
    const path = url.replace(/^https?:\/\/[^/]+/, '')
    const key = `${method} ${path}`

    // exact match first
    if (mapping[key]) return Promise.resolve(mapping[key])

    // partial match (startsWith)
    const partialKey = Object.keys(mapping).find((k) => key.startsWith(k))
    if (partialKey) return Promise.resolve(mapping[partialKey])

    // Fallback
    return Promise.resolve({ ok: true, json: async () => ({}) })
  })
}

const LINKED_ISSUES_FIXTURE = [
  {
    id: 'link-1',
    card_id: 'card-1',
    github_type: 'issue',
    github_repo_owner: 'owner',
    github_repo_name: 'repo',
    github_number: 42,
    github_url: 'https://github.com/owner/repo/issues/42',
    github_title: 'Fix the bug',
    github_state: 'open',
    synced_at: '2024-06-01T00:00:00Z',
    created_by: 'u1',
    created_at: '2024-06-01T00:00:00Z',
  },
  {
    id: 'link-2',
    card_id: 'card-1',
    github_type: 'pull_request',
    github_repo_owner: 'owner',
    github_repo_name: 'repo',
    github_number: 55,
    github_url: 'https://github.com/owner/repo/pull/55',
    github_title: 'Add feature',
    github_state: 'closed',
    synced_at: '2024-06-02T00:00:00Z',
    created_by: 'u1',
    created_at: '2024-06-02T00:00:00Z',
  },
]

const REPOS_FIXTURE = [
  {
    id: 1,
    name: 'repo',
    full_name: 'owner/repo',
    owner: { login: 'owner', avatar_url: '' },
    description: 'A test repo',
    private: false,
    html_url: 'https://github.com/owner/repo',
  },
  {
    id: 2,
    name: 'other',
    full_name: 'owner/other',
    owner: { login: 'owner', avatar_url: '' },
    description: null,
    private: true,
    html_url: 'https://github.com/owner/other',
  },
]

const ISSUES_FIXTURE = [
  {
    id: 100,
    number: 10,
    title: 'Bug report',
    state: 'open' as const,
    html_url: 'https://github.com/owner/repo/issues/10',
    body: null,
    user: { login: 'alice', avatar_url: '' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    labels: [],
  },
  {
    id: 101,
    number: 11,
    title: 'Feature request',
    state: 'open' as const,
    html_url: 'https://github.com/owner/repo/issues/11',
    body: 'Please add X',
    user: { login: 'bob', avatar_url: '' },
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
    labels: [{ name: 'enhancement', color: '00ff00' }],
  },
]

/* ─── setup ─── */

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
  useLanguage.mockReturnValue({ language: 'en', t: mockTranslations })
  global.fetch = mockFetchWith()
  window.open = jest.fn()
})

afterEach(() => {
  jest.restoreAllMocks()
})

/* ═══════════════════════  TESTS  ═══════════════════════ */

describe('GitHubPowerUp', () => {
  /* ── Loading state ── */

  it('shows loading indicator on mount', async () => {
    // Never resolve the connection check so it stays loading
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}))
    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('shows close button in loading state', async () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}))
    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    expect(screen.getByText('✕')).toBeInTheDocument()
  })

  it('calls onClose when overlay is clicked', async () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}))
    let container: HTMLElement
    await act(async () => {
      const res = render(<GitHubPowerUp {...defaultProps} />)
      container = res.container
    })
    const overlay = container!.querySelector('.github-powerup-overlay')
    await act(async () => {
      fireEvent.click(overlay!)
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('does NOT call onClose when modal body is clicked (stopPropagation)', async () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}))
    let container: HTMLElement
    await act(async () => {
      const res = render(<GitHubPowerUp {...defaultProps} />)
      container = res.container
    })
    const modal = container!.querySelector('.github-powerup-modal')
    await act(async () => {
      fireEvent.click(modal!)
    })
    // The overlay onClick fires on overlay itself, but the modal click should stop propagation
    // onClose is called 0 times for modal click
    expect(onClose).not.toHaveBeenCalled()
  })

  /* ── Not connected state ── */

  it('shows not-connected view when GitHub is not connected', async () => {
    global.fetch = mockFetchWith({
      'GET /api/github/connect': {
        ok: true,
        json: async () => ({ connected: false, hasRepoScope: false, github_username: null }),
      },
    })
    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => {
      expect(screen.getByText('GitHub is not connected')).toBeInTheDocument()
    })
    expect(screen.getByText('Connect GitHub')).toBeInTheDocument()
  })

  it('shows the GitHub Power-Up title when not connected', async () => {
    global.fetch = mockFetchWith({
      'GET /api/github/connect': {
        ok: true,
        json: async () => ({ connected: false, hasRepoScope: false, github_username: null }),
      },
    })
    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => {
      expect(screen.getByText('GitHub Power-Up')).toBeInTheDocument()
    })
  })

  /* ── Connected state (no linked items) ── */

  it('shows connected state with username', async () => {
    global.fetch = mockFetchWith()
    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => {
      expect(screen.getByText('octocat')).toBeInTheDocument()
    })
    expect(screen.getByText(/Connected as/)).toBeInTheDocument()
  })

  it('shows disconnect button when connected', async () => {
    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => {
      expect(screen.getByText('Disconnect')).toBeInTheDocument()
    })
  })

  it('shows link and create action buttons when connected', async () => {
    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => {
      expect(screen.getByText(/Link issue/)).toBeInTheDocument()
      expect(screen.getByText(/Create issue/)).toBeInTheDocument()
    })
  })

  it('shows "No linked issues" when there are none', async () => {
    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => {
      expect(screen.getByText('No linked issues')).toBeInTheDocument()
    })
  })

  /* ── Connected state with linked items ── */

  it('renders linked issues with titles', async () => {
    global.fetch = mockFetchWith({
      'GET /api/cards/card-1/github': {
        ok: true,
        json: async () => LINKED_ISSUES_FIXTURE,
      },
    })
    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => {
      expect(screen.getByText('Fix the bug')).toBeInTheDocument()
      expect(screen.getByText('Add feature')).toBeInTheDocument()
    })
  })

  it('renders correct issue number badges', async () => {
    global.fetch = mockFetchWith({
      'GET /api/cards/card-1/github': {
        ok: true,
        json: async () => LINKED_ISSUES_FIXTURE,
      },
    })
    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => {
      expect(screen.getByText(/⚫ #42/)).toBeInTheDocument()
      expect(screen.getByText(/↗️ #55/)).toBeInTheDocument()
    })
  })

  it('renders repo owner/name for linked items', async () => {
    global.fetch = mockFetchWith({
      'GET /api/cards/card-1/github': {
        ok: true,
        json: async () => LINKED_ISSUES_FIXTURE,
      },
    })
    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => {
      const repoLabels = screen.getAllByText('owner/repo')
      expect(repoLabels.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows "Open" badge for open issues and "Closed" for closed', async () => {
    global.fetch = mockFetchWith({
      'GET /api/cards/card-1/github': {
        ok: true,
        json: async () => LINKED_ISSUES_FIXTURE,
      },
    })
    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => {
      expect(screen.getByText('Open')).toBeInTheDocument()
      expect(screen.getByText('Closed')).toBeInTheDocument()
    })
  })

  it('renders "View on GitHub" links pointing to issue URLs', async () => {
    global.fetch = mockFetchWith({
      'GET /api/cards/card-1/github': {
        ok: true,
        json: async () => [LINKED_ISSUES_FIXTURE[0]],
      },
    })
    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => {
      const link = screen.getByText(/View on GitHub/)
      expect(link.closest('a')).toHaveAttribute('href', 'https://github.com/owner/repo/issues/42')
      expect(link.closest('a')).toHaveAttribute('target', '_blank')
    })
  })

  it('renders unlink buttons for each linked item', async () => {
    global.fetch = mockFetchWith({
      'GET /api/cards/card-1/github': {
        ok: true,
        json: async () => LINKED_ISSUES_FIXTURE,
      },
    })
    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => {
      const unlinkBtns = screen.getAllByText('Unlink')
      expect(unlinkBtns).toHaveLength(2)
    })
  })

  /* ── Close button ── */

  it('calls onClose when close button is clicked', async () => {
    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText('Disconnect'))
    await act(async () => {
      fireEvent.click(screen.getByText('✕'))
    })
    expect(onClose).toHaveBeenCalled()
  })

  /* ── Disconnect ── */

  it('disconnects repository and resets state', async () => {
    let disconnected = false
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      if (method === 'DELETE' && url.includes('/api/github/connect')) {
        disconnected = true
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }
      if (method === 'GET' && url.includes('/api/github/connect')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            connected: !disconnected,
            hasRepoScope: !disconnected,
            github_username: disconnected ? null : 'octocat',
          }),
        })
      }
      if (url.includes('/api/cards/card-1/github')) {
        return Promise.resolve({ ok: true, json: async () => [] })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText('Disconnect'))
    await act(async () => {
      fireEvent.click(screen.getByText('Disconnect'))
    })
    await waitFor(() => {
      expect(screen.getByText('GitHub is not connected')).toBeInTheDocument()
    })
  })

  it('shows alert on disconnect failure', async () => {
    global.fetch = mockFetchWith({
      'DELETE /api/github/connect': {
        ok: false,
        json: async () => ({}),
      },
    })

    // Make disconnect throw
    const baseFetch = mockFetchWith({})
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      if (method === 'DELETE') return Promise.reject(new Error('network'))
      return baseFetch(url, init)
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText('Disconnect'))
    await act(async () => {
      fireEvent.click(screen.getByText('Disconnect'))
    })
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'GitHub connection error' }),
      )
    })
  })

  /* ── Link existing issue flow ── */

  it('navigates to link view and loads repos when "Link issue" is clicked', async () => {
    global.fetch = mockFetchWith({
      'GET /api/github/token': { ok: true, json: async () => ({ token: 'tok' }) },
      'GET /api.github.com/user/repos': { ok: true, json: async () => REPOS_FIXTURE },
    })
    // Override to intercept github API calls
    const baseFetch = mockFetchWith({
      'GET /api/github/token': { ok: true, json: async () => ({ token: 'tok' }) },
    })
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (typeof url === 'string' && url.includes('api.github.com/user/repos')) {
        return Promise.resolve({ ok: true, json: async () => REPOS_FIXTURE })
      }
      return baseFetch(url, init)
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText(/Link issue/))
    await act(async () => {
      fireEvent.click(screen.getByText(/Link issue/))
    })
    await waitFor(() => {
      expect(screen.getAllByText('Link existing issue').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Select repository')).toBeInTheDocument()
    })
  })

  it('shows back button in link view and navigates back', async () => {
    global.fetch = mockFetchWith({
      'GET /api/github/token': { ok: true, json: async () => ({ token: 'tok' }) },
    })
    const baseFetch = global.fetch as jest.Mock
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (typeof url === 'string' && url.includes('api.github.com')) {
        return Promise.resolve({ ok: true, json: async () => [] })
      }
      return baseFetch(url, init)
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText(/Link issue/))
    await act(async () => {
      fireEvent.click(screen.getByText(/Link issue/))
    })
    await waitFor(() => screen.getByText(/Back/))
    await act(async () => {
      fireEvent.click(screen.getByText(/Back/))
    })
    await waitFor(() => {
      expect(screen.getByText('Linked issues')).toBeInTheDocument()
    })
  })

  it('loads and shows issues when a repository is selected', async () => {
    const baseFetch = mockFetchWith({
      'GET /api/github/token': { ok: true, json: async () => ({ token: 'tok' }) },
    })
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (typeof url === 'string' && url.includes('api.github.com/user/repos')) {
        return Promise.resolve({ ok: true, json: async () => REPOS_FIXTURE })
      }
      if (typeof url === 'string' && url.includes('api.github.com/repos/owner/repo/issues')) {
        return Promise.resolve({ ok: true, json: async () => ISSUES_FIXTURE })
      }
      return baseFetch(url, init)
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText(/Link issue/))

    // Click link issue
    await act(async () => {
      fireEvent.click(screen.getByText(/Link issue/))
    })

    // Wait for repos to load in the select
    await waitFor(() => {
      expect(screen.getByText('Select repository')).toBeInTheDocument()
    })

    // Wait for the repo options to appear
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    // Select a repo
    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'owner/repo' } })
    })

    // Wait for issue select to appear
    await waitFor(() => {
      expect(screen.getByText('Select issue')).toBeInTheDocument()
    })
  })

  it('links an existing issue successfully', async () => {
    const baseFetch = mockFetchWith({
      'GET /api/github/token': { ok: true, json: async () => ({ token: 'tok' }) },
    })
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (typeof url === 'string' && url.includes('api.github.com/user/repos')) {
        return Promise.resolve({ ok: true, json: async () => REPOS_FIXTURE })
      }
      if (typeof url === 'string' && url.includes('api.github.com/repos/owner/repo/issues')) {
        return Promise.resolve({ ok: true, json: async () => ISSUES_FIXTURE })
      }
      const method = init?.method ?? 'GET'
      if (method === 'POST' && typeof url === 'string' && url.includes('/api/cards/card-1/github')) {
        return Promise.resolve({ ok: true, json: async () => ({ id: 'new-link', webhook: { created: true } }) })
      }
      return baseFetch(url, init)
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText(/Link issue/))

    await act(async () => {
      fireEvent.click(screen.getByText(/Link issue/))
    })

    // Wait for repos
    await waitFor(() => screen.getByRole('combobox'))

    // Select repo
    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'owner/repo' } })
    })

    // Wait for issues to load - both selects now
    await waitFor(() => screen.getAllByRole('combobox'))

    const selects = screen.getAllByRole('combobox')
    // Second select is the issue select
    await act(async () => {
      fireEvent.change(selects[1], { target: { value: '10' } })
    })

    // Click the link button
    const linkButton = screen.getAllByText('Link existing issue').find(
      (el) => el.tagName === 'BUTTON'
    )
    await act(async () => {
      fireEvent.click(linkButton!)
    })

    // Should go back to main view
    await waitFor(() => {
      expect(screen.getByText('Linked issues')).toBeInTheDocument()
    })
  })

  it('shows error when linking fails with server error', async () => {
    const baseFetch = mockFetchWith({
      'GET /api/github/token': { ok: true, json: async () => ({ token: 'tok' }) },
    })
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (typeof url === 'string' && url.includes('api.github.com/user/repos')) {
        return Promise.resolve({ ok: true, json: async () => REPOS_FIXTURE })
      }
      if (typeof url === 'string' && url.includes('api.github.com/repos/owner/repo/issues')) {
        return Promise.resolve({ ok: true, json: async () => ISSUES_FIXTURE })
      }
      const method = init?.method ?? 'GET'
      if (method === 'POST' && typeof url === 'string' && url.includes('/api/cards/card-1/github')) {
        return Promise.resolve({ ok: false, json: async () => ({ error: 'Duplicate link' }) })
      }
      return baseFetch(url, init)
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText(/Link issue/))
    await act(async () => {
      fireEvent.click(screen.getByText(/Link issue/))
    })
    await waitFor(() => screen.getByRole('combobox'))
    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'owner/repo' } })
    })
    await waitFor(() => screen.getAllByRole('combobox'))
    const selects = screen.getAllByRole('combobox')
    await act(async () => {
      fireEvent.change(selects[1], { target: { value: '10' } })
    })
    const linkButton = screen.getAllByText('Link existing issue').find(
      (el) => el.tagName === 'BUTTON'
    )
    await act(async () => {
      fireEvent.click(linkButton!)
    })
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Duplicate link' }),
      )
    })
  })

  it('shows generic linkError when linking throws', async () => {
    const baseFetch = mockFetchWith({
      'GET /api/github/token': { ok: true, json: async () => ({ token: 'tok' }) },
    })
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (typeof url === 'string' && url.includes('api.github.com/user/repos')) {
        return Promise.resolve({ ok: true, json: async () => REPOS_FIXTURE })
      }
      if (typeof url === 'string' && url.includes('api.github.com/repos/owner/repo/issues')) {
        return Promise.resolve({ ok: true, json: async () => ISSUES_FIXTURE })
      }
      const method = init?.method ?? 'GET'
      if (method === 'POST' && typeof url === 'string' && url.includes('/api/cards/card-1/github')) {
        return Promise.reject(new Error('network fail'))
      }
      return baseFetch(url, init)
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText(/Link issue/))
    await act(async () => {
      fireEvent.click(screen.getByText(/Link issue/))
    })
    await waitFor(() => screen.getByRole('combobox'))
    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'owner/repo' } })
    })
    await waitFor(() => screen.getAllByRole('combobox'))
    const selects = screen.getAllByRole('combobox')
    await act(async () => {
      fireEvent.change(selects[1], { target: { value: '10' } })
    })
    const linkButton = screen.getAllByText('Link existing issue').find(
      (el) => el.tagName === 'BUTTON'
    )
    await act(async () => {
      fireEvent.click(linkButton!)
    })
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Error linking issue' }),
      )
    })
  })

  /* ── Unlink issue ── */

  it('unlinks an issue after confirmation', async () => {
    mockConfirm.mockResolvedValue(true)

    const baseFetch = mockFetchWith({
      'GET /api/cards/card-1/github': {
        ok: true,
        json: async () => LINKED_ISSUES_FIXTURE,
      },
    })
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      if (method === 'DELETE' && typeof url === 'string' && url.includes('/api/cards/card-1/github')) {
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }
      return baseFetch(url, init)
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText('Fix the bug'))

    const unlinkBtns = screen.getAllByText('Unlink')
    await act(async () => {
      fireEvent.click(unlinkBtns[0])
    })

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unlink this issue?',
          variant: 'danger',
        }),
      )
    })
  })

  it('does not unlink when confirmation is cancelled', async () => {
    mockConfirm.mockResolvedValue(false)

    global.fetch = mockFetchWith({
      'GET /api/cards/card-1/github': {
        ok: true,
        json: async () => LINKED_ISSUES_FIXTURE,
      },
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText('Fix the bug'))

    const unlinkBtns = screen.getAllByText('Unlink')
    await act(async () => {
      fireEvent.click(unlinkBtns[0])
    })

    // The issue should still be present
    await waitFor(() => {
      expect(screen.getByText('Fix the bug')).toBeInTheDocument()
    })
  })

  /* ── Create issue flow ── */

  it('navigates to create view when "Create issue" is clicked', async () => {
    const baseFetch = mockFetchWith({
      'GET /api/github/token': { ok: true, json: async () => ({ token: 'tok' }) },
    })
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (typeof url === 'string' && url.includes('api.github.com/user/repos')) {
        return Promise.resolve({ ok: true, json: async () => REPOS_FIXTURE })
      }
      return baseFetch(url, init)
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText(/Create issue/))
    await act(async () => {
      // Click the "Create issue" button (with ✨ emoji)
      fireEvent.click(screen.getByText(/✨.*Create issue/))
    })
    await waitFor(() => {
      // Second heading should say Create issue
      const headings = screen.getAllByRole('heading')
      const createH3 = headings.find((h) => h.textContent === 'Create issue')
      expect(createH3).toBeInTheDocument()
    })
  })

  it('creates a new issue and links it', async () => {
    const baseFetch = mockFetchWith({
      'GET /api/github/token': { ok: true, json: async () => ({ token: 'tok' }) },
    })
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      if (typeof url === 'string' && url.includes('api.github.com/user/repos')) {
        return Promise.resolve({ ok: true, json: async () => REPOS_FIXTURE })
      }
      if (method === 'POST' && typeof url === 'string' && url.includes('api.github.com/repos/owner/repo/issues')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            number: 99,
            html_url: 'https://github.com/owner/repo/issues/99',
            title: 'New Bug',
            state: 'open',
          }),
        })
      }
      if (method === 'POST' && typeof url === 'string' && url.includes('/api/cards/card-1/github')) {
        return Promise.resolve({ ok: true, json: async () => ({ id: 'new-link', webhook: null }) })
      }
      return baseFetch(url, init)
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText(/Create issue/))
    await act(async () => {
      fireEvent.click(screen.getByText(/✨.*Create issue/))
    })

    // Wait for repo select
    await waitFor(() => screen.getByRole('combobox'))

    // Select a repo
    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'owner/repo' } })
    })

    // Fill in title
    await waitFor(() => screen.getByPlaceholderText('Issue title'))
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Issue title'), {
        target: { value: 'New Bug' },
      })
    })

    // Fill in description
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Describe the issue'), {
        target: { value: 'Something is broken' },
      })
    })

    // Click create & link button
    await act(async () => {
      fireEvent.click(screen.getByText('Create & Link'))
    })

    // Should go back to main view
    await waitFor(() => {
      expect(screen.getByText('Linked issues')).toBeInTheDocument()
    })
  })

  it('disables create button when title is empty', async () => {
    const baseFetch = mockFetchWith({
      'GET /api/github/token': { ok: true, json: async () => ({ token: 'tok' }) },
    })
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (typeof url === 'string' && url.includes('api.github.com/user/repos')) {
        return Promise.resolve({ ok: true, json: async () => REPOS_FIXTURE })
      }
      return baseFetch(url, init)
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText(/Create issue/))
    await act(async () => {
      fireEvent.click(screen.getByText(/✨.*Create issue/))
    })
    await waitFor(() => screen.getByRole('combobox'))
    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'owner/repo' } })
    })

    // The submit button should be disabled (no title yet)
    await waitFor(() => {
      const submitBtn = screen.getByText('Create & Link')
      expect(submitBtn).toBeDisabled()
    })
  })

  it('shows error alert when create issue on GitHub fails', async () => {
    const baseFetch = mockFetchWith({
      'GET /api/github/token': { ok: true, json: async () => ({ token: 'tok' }) },
    })
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      if (typeof url === 'string' && url.includes('api.github.com/user/repos')) {
        return Promise.resolve({ ok: true, json: async () => REPOS_FIXTURE })
      }
      if (method === 'POST' && typeof url === 'string' && url.includes('api.github.com/repos/owner/repo/issues')) {
        return Promise.resolve({ ok: false, json: async () => ({ message: 'validation failed' }) })
      }
      return baseFetch(url, init)
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText(/Create issue/))
    await act(async () => {
      fireEvent.click(screen.getByText(/✨.*Create issue/))
    })
    await waitFor(() => screen.getByRole('combobox'))
    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'owner/repo' } })
    })
    await waitFor(() => screen.getByPlaceholderText('Issue title'))
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Issue title'), {
        target: { value: 'Test Issue' },
      })
    })
    await act(async () => {
      fireEvent.click(screen.getByText('Create & Link'))
    })
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Error creating issue' }),
      )
    })
  })

  /* ── Toggle issue state ── */

  it('toggles an open issue to closed after confirmation', async () => {
    mockConfirm.mockResolvedValue(true)

    const baseFetch = mockFetchWith({
      'GET /api/cards/card-1/github': {
        ok: true,
        json: async () => [LINKED_ISSUES_FIXTURE[0]], // open issue
      },
      'GET /api/github/token': { ok: true, json: async () => ({ token: 'tok' }) },
    })
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      if (method === 'PATCH' && typeof url === 'string' && url.includes('api.github.com/repos/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ state: 'closed' }),
        })
      }
      if (method === 'PATCH' && typeof url === 'string' && url.includes('/api/cards/card-1/github')) {
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }
      return baseFetch(url, init)
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText('Open'))

    // Click the open/close toggle
    await act(async () => {
      fireEvent.click(screen.getByText('Open'))
    })

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Do you want to close #42?',
        }),
      )
    })
  })

  it('does not toggle when confirmation is cancelled', async () => {
    mockConfirm.mockResolvedValue(false)

    global.fetch = mockFetchWith({
      'GET /api/cards/card-1/github': {
        ok: true,
        json: async () => [LINKED_ISSUES_FIXTURE[0]],
      },
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText('Open'))

    await act(async () => {
      fireEvent.click(screen.getByText('Open'))
    })

    // Still shows Open (state not changed)
    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  /* ── Connect GitHub flow ── */

  it('connects GitHub when connect button is clicked and data.success is true', async () => {
    let connected = false
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      if (method === 'GET' && url.includes('/api/github/connect')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            connected,
            hasRepoScope: connected,
            github_username: connected ? 'newuser' : null,
          }),
        })
      }
      if (method === 'POST' && url.includes('/api/github/connect')) {
        connected = true
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, github_username: 'newuser' }),
        })
      }
      if (url.includes('/api/cards/card-1/github')) {
        return Promise.resolve({ ok: true, json: async () => [] })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText('Connect GitHub'))

    await act(async () => {
      fireEvent.click(screen.getByText('Connect GitHub'))
    })

    await waitFor(() => {
      expect(screen.getByText('newuser')).toBeInTheDocument()
    })
  })

  it('shows error when connect POST fails with 401', async () => {
    global.fetch = mockFetchWith({
      'GET /api/github/connect': {
        ok: true,
        json: async () => ({ connected: false, hasRepoScope: false, github_username: null }),
      },
      'POST /api/github/connect': {
        ok: false,
        status: 401,
        json: async () => ({}),
      },
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText('Connect GitHub'))

    await act(async () => {
      fireEvent.click(screen.getByText('Connect GitHub'))
    })

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'GitHub connection error' }),
      )
    })
  })

  /* ── Error fetching repos ── */

  it('shows error alert when fetching repos fails', async () => {
    const baseFetch = mockFetchWith({
      'GET /api/github/token': { ok: true, json: async () => ({ token: 'tok' }) },
    })
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (typeof url === 'string' && url.includes('api.github.com/user/repos')) {
        return Promise.reject(new Error('network'))
      }
      return baseFetch(url, init)
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText(/Link issue/))
    await act(async () => {
      fireEvent.click(screen.getByText(/Link issue/))
    })

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'An error occurred' }),
      )
    })
  })

  /* ── Error fetching linked issues ── */

  it('handles error when fetching linked issues', async () => {
    global.fetch = mockFetchWith({
      'GET /api/cards/card-1/github': {
        ok: false,
        json: async () => ({}),
      },
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    // Should not crash and still show the connected view
    await waitFor(() => {
      expect(screen.getByText('No linked issues')).toBeInTheDocument()
    })
  })

  /* ── Error checking connection ── */

  it('handles fetch error on GitHub connection check gracefully', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/api/github/connect')) {
        return Promise.reject(new Error('offline'))
      }
      return Promise.resolve({ ok: true, json: async () => ([]) })
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    // Should finish loading and show not-connected by default (connected stays false)
    await waitFor(() => {
      expect(screen.getByText('GitHub is not connected')).toBeInTheDocument()
    })
  })

  /* ── Link submit disabled without selection ── */

  it('link submit button is disabled when no repo or issue is selected', async () => {
    const baseFetch = mockFetchWith({
      'GET /api/github/token': { ok: true, json: async () => ({ token: 'tok' }) },
    })
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (typeof url === 'string' && url.includes('api.github.com/user/repos')) {
        return Promise.resolve({ ok: true, json: async () => REPOS_FIXTURE })
      }
      return baseFetch(url, init)
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText(/Link issue/))
    await act(async () => {
      fireEvent.click(screen.getByText(/Link issue/))
    })

    const submitBtn = await waitFor(() => {
      const btn = screen.getAllByText('Link existing issue').find(
        (el) => el.tagName === 'BUTTON'
      )
      return btn
    })
    expect(submitBtn).toBeDisabled()
  })

  /* ── Realtime channel subscription ── */

  it('subscribes to realtime channel on mount', async () => {
    const { supabaseBrowser } = require('../lib/supabase-browser')

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })

    expect(supabaseBrowser.channel).toHaveBeenCalledWith('card-github-card-1')
    expect(mockChannel.on).toHaveBeenCalled()
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })

  it('cleans up realtime channel on unmount', async () => {
    const { supabaseBrowser } = require('../lib/supabase-browser')

    let unmount: () => void
    await act(async () => {
      const result = render(<GitHubPowerUp {...defaultProps} />)
      unmount = result.unmount
    })
    await act(async () => {
      unmount()
    })
    expect(supabaseBrowser.removeChannel).toHaveBeenCalled()
  })

  /* ── Token 403 during fetchRepositories ── */

  it('shows connectionError when token returns 403', async () => {
    global.fetch = mockFetchWith({
      'GET /api/github/token': { ok: false, status: 403, json: async () => ({}) },
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText(/Link issue/))
    await act(async () => {
      fireEvent.click(screen.getByText(/Link issue/))
    })

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'GitHub connection error' }),
      )
    })
  })

  /* ── Create view back button ── */

  it('shows back button in create view and navigates back to main', async () => {
    const baseFetch = mockFetchWith({
      'GET /api/github/token': { ok: true, json: async () => ({ token: 'tok' }) },
    })
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (typeof url === 'string' && url.includes('api.github.com')) {
        return Promise.resolve({ ok: true, json: async () => [] })
      }
      return baseFetch(url, init)
    })

    await act(async () => {
      render(<GitHubPowerUp {...defaultProps} />)
    })
    await waitFor(() => screen.getByText(/✨.*Create issue/))
    await act(async () => {
      fireEvent.click(screen.getByText(/✨.*Create issue/))
    })
    await waitFor(() => screen.getByText(/Back/))
    await act(async () => {
      fireEvent.click(screen.getByText(/Back/))
    })
    await waitFor(() => {
      expect(screen.getByText('Linked issues')).toBeInTheDocument()
    })
  })
})
