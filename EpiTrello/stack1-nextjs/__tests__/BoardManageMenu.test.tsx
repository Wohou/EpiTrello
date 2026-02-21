/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import BoardManageMenu from '../components/BoardManageMenu'
import { useLanguage } from '../lib/language-context'
import { useNotification } from '../components/NotificationContext'

jest.mock('../lib/language-context', () => ({
  useLanguage: jest.fn(),
}))

const mockConfirm = jest.fn()
jest.mock('../components/NotificationContext', () => ({
  useNotification: jest.fn(),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}))

const mockTranslations = {
  common: {
    delete: 'Delete',
    cancel: 'Cancel',
    close: 'Close',
    loading: 'Loading...',
    logoutYes: 'Yes',
  },
  sharing: {
    manageBoard: 'Manage Board',
    inviteUser: 'Invite User',
    manageMembers: 'Manage Members',
    leaveBoard: 'Leave Board',
    enterUserId: 'Enter user ID',
    invitationSent: 'Invitation sent!',
    inviteError: 'Invite error',
    revokeConfirm: 'Remove {name}?',
    revokeError: 'Revoke error',
    leaveConfirm: 'Leave this board?',
    leaveError: 'Leave error',
    sendInvite: 'Send Invite',
    inviteDescription: 'Enter user ID to invite.',
    userIdPlaceholder: 'User ID',
    boardMembers: 'Board Members',
    noMembers: 'No members',
    roleOwner: 'Owner',
    roleMember: 'Member',
    revoke: 'Remove',
    accept: 'Accept',
    decline: 'Decline',
  },
}

describe('BoardManageMenu', () => {
  let mockOnInvite: jest.Mock
  let mockOnRevokeMember: jest.Mock
  let mockOnLeaveBoard: jest.Mock
  let mockOnRefreshMembers: jest.Mock

  const mockMembers = [
    {
      id: 'm-1', board_id: 'b-1', user_id: 'u-1', role: 'owner' as const, joined_at: '2024-01-01',
      username: 'Owner', avatar_url: 'https://example.com/avatar.jpg',
    },
    {
      id: 'm-2', board_id: 'b-1', user_id: 'u-2', role: 'member' as const, joined_at: '2024-01-02',
      username: 'Member1', avatar_url: null,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnInvite = jest.fn().mockResolvedValue(undefined)
    mockOnRevokeMember = jest.fn().mockResolvedValue(undefined)
    mockOnLeaveBoard = jest.fn().mockResolvedValue(undefined)
    mockOnRefreshMembers = jest.fn()
    mockConfirm.mockResolvedValue(true)
    ;(useLanguage as jest.Mock).mockReturnValue({ t: mockTranslations })
    ;(useNotification as jest.Mock).mockReturnValue({ confirm: mockConfirm })
  })

  const renderAsOwner = () => render(
    <BoardManageMenu
      boardId="b-1"
      isOwner={true}
      members={mockMembers}
      onInvite={mockOnInvite}
      onRevokeMember={mockOnRevokeMember}
      onLeaveBoard={mockOnLeaveBoard}
      onRefreshMembers={mockOnRefreshMembers}
    />
  )

  const renderAsMember = () => render(
    <BoardManageMenu
      boardId="b-1"
      isOwner={false}
      members={mockMembers}
      onInvite={mockOnInvite}
      onRevokeMember={mockOnRevokeMember}
      onLeaveBoard={mockOnLeaveBoard}
      onRefreshMembers={mockOnRefreshMembers}
    />
  )

  it('should render manage board button', () => {
    renderAsOwner()
    expect(screen.getByText(/Manage Board/)).toBeInTheDocument()
  })

  it('should toggle dropdown on click', () => {
    renderAsOwner()
    const toggleButton = screen.getByText(/Manage Board/)
    fireEvent.click(toggleButton)

    expect(screen.getByText('Invite User')).toBeInTheDocument()
    expect(screen.getByText('Manage Members')).toBeInTheDocument()
  })

  it('should show leave board for non-owners', () => {
    renderAsMember()
    fireEvent.click(screen.getByText(/Manage Board/))

    expect(screen.getByText('Leave Board')).toBeInTheDocument()
    expect(screen.queryByText('Invite User')).not.toBeInTheDocument()
  })

  it('should open invite modal', () => {
    renderAsOwner()
    fireEvent.click(screen.getByText(/Manage Board/))
    fireEvent.click(screen.getByText('Invite User'))

    expect(screen.getByPlaceholderText('User ID')).toBeInTheDocument()
    expect(screen.getByText('Send Invite')).toBeInTheDocument()
  })

  it('should handle invite with empty user ID', async () => {
    renderAsOwner()
    fireEvent.click(screen.getByText(/Manage Board/))
    fireEvent.click(screen.getByText('Invite User'))

    fireEvent.click(screen.getByText('Send Invite'))

    await waitFor(() => {
      expect(screen.getByText('Enter user ID')).toBeInTheDocument()
    })
  })

  it('should handle successful invite', async () => {
    jest.useFakeTimers()
    renderAsOwner()
    fireEvent.click(screen.getByText(/Manage Board/))
    fireEvent.click(screen.getByText('Invite User'))

    const input = screen.getByPlaceholderText('User ID')
    fireEvent.change(input, { target: { value: 'user-123' } })
    fireEvent.click(screen.getByText('Send Invite'))

    await waitFor(() => {
      expect(mockOnInvite).toHaveBeenCalledWith('user-123')
    })

    jest.useRealTimers()
  })

  it('should handle invite error', async () => {
    mockOnInvite.mockRejectedValue(new Error('User not found'))
    renderAsOwner()
    fireEvent.click(screen.getByText(/Manage Board/))
    fireEvent.click(screen.getByText('Invite User'))

    fireEvent.change(screen.getByPlaceholderText('User ID'), { target: { value: 'invalid' } })
    fireEvent.click(screen.getByText('Send Invite'))

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument()
    })
  })

  it('should open members modal', () => {
    renderAsOwner()
    fireEvent.click(screen.getByText(/Manage Board/))
    fireEvent.click(screen.getByText('Manage Members'))

    expect(screen.getByText('Board Members')).toBeInTheDocument()
    // 'Owner' appears as both username and role text, so use getAllByText
    expect(screen.getAllByText(/Owner/i).length).toBeGreaterThan(0)
    expect(screen.getByText('Member1')).toBeInTheDocument()
    expect(mockOnRefreshMembers).toHaveBeenCalled()
  })

  it('should show revoke button only for non-owner members', () => {
    renderAsOwner()
    fireEvent.click(screen.getByText(/Manage Board/))
    fireEvent.click(screen.getByText('Manage Members'))

    // Only one Remove button for non-owner member
    const removeButtons = screen.getAllByText('Remove')
    expect(removeButtons.length).toBe(1)
  })

  it('should handle revoke member', async () => {
    renderAsOwner()
    fireEvent.click(screen.getByText(/Manage Board/))
    fireEvent.click(screen.getByText('Manage Members'))

    fireEvent.click(screen.getByText('Remove'))

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled()
      expect(mockOnRevokeMember).toHaveBeenCalledWith('u-2')
    })
  })

  it('should handle leave board', async () => {
    renderAsMember()
    fireEvent.click(screen.getByText(/Manage Board/))
    fireEvent.click(screen.getByText('Leave Board'))

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled()
      expect(mockOnLeaveBoard).toHaveBeenCalled()
    })
  })

  it('should not leave board when confirm is cancelled', async () => {
    mockConfirm.mockResolvedValue(false)
    renderAsMember()
    fireEvent.click(screen.getByText(/Manage Board/))
    fireEvent.click(screen.getByText('Leave Board'))

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled()
    })
    expect(mockOnLeaveBoard).not.toHaveBeenCalled()
  })

  it('should close invite modal on cancel', () => {
    renderAsOwner()
    fireEvent.click(screen.getByText(/Manage Board/))
    fireEvent.click(screen.getByText('Invite User'))

    expect(screen.getByPlaceholderText('User ID')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Cancel'))

    expect(screen.queryByPlaceholderText('User ID')).not.toBeInTheDocument()
  })

  it('should close members modal on close button', () => {
    renderAsOwner()
    fireEvent.click(screen.getByText(/Manage Board/))
    fireEvent.click(screen.getByText('Manage Members'))

    fireEvent.click(screen.getByText('Close'))

    expect(screen.queryByText('Board Members')).not.toBeInTheDocument()
  })

  it('should close dropdown on outside click', () => {
    renderAsOwner()
    fireEvent.click(screen.getByText(/Manage Board/))
    expect(screen.getByText('Invite User')).toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('Invite User')).not.toBeInTheDocument()
  })

  it('should render no members message when empty', () => {
    render(
      <BoardManageMenu
        boardId="b-1"
        isOwner={true}
        members={[]}
        onInvite={mockOnInvite}
        onRevokeMember={mockOnRevokeMember}
        onLeaveBoard={mockOnLeaveBoard}
        onRefreshMembers={mockOnRefreshMembers}
      />
    )
    fireEvent.click(screen.getByText(/Manage Board/))
    fireEvent.click(screen.getByText('Manage Members'))

    expect(screen.getByText('No members')).toBeInTheDocument()
  })

  it('should show avatar images for members with avatars', () => {
    renderAsOwner()
    fireEvent.click(screen.getByText(/Manage Board/))
    fireEvent.click(screen.getByText('Manage Members'))

    const images = screen.getAllByRole('img')
    expect(images.length).toBeGreaterThan(0)
  })

  it('should show initial letter for members without avatars', () => {
    renderAsOwner()
    fireEvent.click(screen.getByText(/Manage Board/))
    fireEvent.click(screen.getByText('Manage Members'))

    expect(screen.getByText('M')).toBeInTheDocument() // First letter of "Member1"
  })

  it('should close invite modal on overlay click', () => {
    renderAsOwner()
    fireEvent.click(screen.getByText(/Manage Board/))
    fireEvent.click(screen.getByText('Invite User'))

    const overlay = document.querySelector('.modal-overlay')
    fireEvent.click(overlay!)

    expect(screen.queryByPlaceholderText('User ID')).not.toBeInTheDocument()
  })

  it('should handle leave board error', async () => {
    mockOnLeaveBoard.mockRejectedValue(new Error('Leave failed'))
    renderAsMember()
    fireEvent.click(screen.getByText(/Manage Board/))
    fireEvent.click(screen.getByText('Leave Board'))

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled()
    })
  })

  it('should handle revoke non-Error rejection', async () => {
    mockOnRevokeMember.mockRejectedValue('string error')
    renderAsOwner()
    fireEvent.click(screen.getByText(/Manage Board/))
    fireEvent.click(screen.getByText('Manage Members'))
    fireEvent.click(screen.getByText('Remove'))

    await waitFor(() => {
      expect(mockOnRevokeMember).toHaveBeenCalled()
    })
  })
})
