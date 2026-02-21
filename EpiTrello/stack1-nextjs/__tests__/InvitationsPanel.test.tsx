/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import InvitationsPanel from '../components/InvitationsPanel'
import { useLanguage } from '../lib/language-context'

jest.mock('../lib/language-context', () => ({
  useLanguage: jest.fn(),
}))

const mockTranslations = {
  sharing: {
    pendingInvitations: 'Pending Invitations',
    invitedBy: 'Invited by {name}',
    accept: 'Accept',
    decline: 'Decline',
  },
}

describe('InvitationsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useLanguage as jest.Mock).mockReturnValue({ t: mockTranslations })
  })

  it('should render nothing while loading', () => {
    global.fetch = jest.fn().mockImplementation(() => new Promise(() => {})) as any
    const { container } = render(<InvitationsPanel />)
    expect(container.innerHTML).toBe('')
  })

  it('should render nothing when no invitations', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }) as any

    const { container } = render(<InvitationsPanel />)

    await waitFor(() => {
      expect(container.innerHTML).toBe('')
    })
  })

  it('should render invitations when they exist', async () => {
    const invitations = [
      {
        id: 'inv-1',
        board_title: 'Project Board',
        inviter_username: 'Alice',
        board_id: 'b-1',
        inviter_id: 'u-1',
        invitee_id: 'u-2',
        status: 'pending',
        created_at: '2024-01-01',
        responded_at: null,
      },
    ]

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(invitations),
    }) as any

    render(<InvitationsPanel />)

    await waitFor(() => {
      expect(screen.getByText('Pending Invitations')).toBeInTheDocument()
      expect(screen.getByText('Project Board')).toBeInTheDocument()
      expect(screen.getByText('Invited by Alice')).toBeInTheDocument()
      expect(screen.getByText('Accept')).toBeInTheDocument()
      expect(screen.getByText('Decline')).toBeInTheDocument()
    })
  })

  it('should show invitation count badge', async () => {
    const invitations = [
      {
        id: 'inv-1', board_title: 'Board 1', inviter_username: 'Alice',
        board_id: 'b-1', inviter_id: 'u-1', invitee_id: 'u-2',
        status: 'pending', created_at: '2024-01-01', responded_at: null,
      },
      {
        id: 'inv-2', board_title: 'Board 2', inviter_username: 'Bob',
        board_id: 'b-2', inviter_id: 'u-3', invitee_id: 'u-2',
        status: 'pending', created_at: '2024-01-02', responded_at: null,
      },
    ]

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(invitations),
    }) as any

    render(<InvitationsPanel />)

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  it('should handle accept invitation', async () => {
    const invitations = [
      {
        id: 'inv-1', board_title: 'Board', inviter_username: 'Alice',
        board_id: 'b-1', inviter_id: 'u-1', invitee_id: 'u-2',
        status: 'pending', created_at: '2024-01-01', responded_at: null,
      },
    ]

    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(invitations) })
      .mockResolvedValueOnce({ ok: true }) as any

    render(<InvitationsPanel />)

    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Accept'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/invitations/inv-1', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ action: 'accept' }),
      }))
    })
  })

  it('should handle decline invitation', async () => {
    const invitations = [
      {
        id: 'inv-1', board_title: 'Board', inviter_username: 'Alice',
        board_id: 'b-1', inviter_id: 'u-1', invitee_id: 'u-2',
        status: 'pending', created_at: '2024-01-01', responded_at: null,
      },
    ]

    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(invitations) })
      .mockResolvedValueOnce({ ok: true }) as any

    render(<InvitationsPanel />)

    await waitFor(() => {
      expect(screen.getByText('Decline')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Decline'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/invitations/inv-1', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ action: 'decline' }),
      }))
    })
  })

  it('should handle fetch error gracefully', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as any

    const { container } = render(<InvitationsPanel />)

    await waitFor(() => {
      expect(container.innerHTML).toBe('')
    })

    jest.restoreAllMocks()
  })

  it('should handle non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
    }) as any

    const { container } = render(<InvitationsPanel />)

    await waitFor(() => {
      expect(container.innerHTML).toBe('')
    })
  })
})
