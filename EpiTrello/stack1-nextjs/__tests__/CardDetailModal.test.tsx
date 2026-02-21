/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import CardDetailModal from '../components/CardDetailModal'
import type { Card, BoardMember, CardAssignment, CardImage } from '../lib/supabase'

/* ─── mocks ─── */

const mockConfirm = jest.fn().mockResolvedValue(true)
const mockAlert = jest.fn().mockResolvedValue(undefined)

jest.mock('../lib/language-context', () => ({
  useLanguage: jest.fn(),
}))

jest.mock('../components/NotificationContext', () => ({
  useNotification: () => ({ confirm: mockConfirm, alert: mockAlert }),
}))

jest.mock('../lib/supabase-browser', () => ({
  supabaseBrowser: {},
}))

jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  default: ({ fill, priority, unoptimized, ...rest }: any) => {
    return <img {...rest} />
  },
}))

jest.mock('../components/GitHubPowerUp', () => ({
  __esModule: true,
  default: ({ onClose }: any) => (
    <div data-testid="github-powerup">
      <button onClick={onClose}>CloseGitHub</button>
    </div>
  ),
}))

const mockTranslations: Record<string, any> = {
  common: {
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    loading: 'Loading...',
  },
  cards: {
    deleteCard: 'Delete card',
    deleteConfirm: 'Are you sure you want to delete this card?',
    description: 'Description',
    cardDescription: 'Description',
    descriptionPlaceholder: 'Add a more detailed description...',
    addDescription: 'Add a description...',
    color: 'Color',
    uploadImage: 'Upload image',
    dates: 'Dates',
    dueDate: 'Due date',
    startDate: 'Start date',
    setDates: 'Set dates',
    removeDates: 'Remove dates',
    duration: '{count} day',
    durationPlural: '{count} days',
    daysRemaining: '{count} day remaining',
    daysRemainingPlural: '{count} days remaining',
    overdue: 'Overdue',
    dueToday: 'Today',
    dueTomorrow: 'Tomorrow',
    noDueDate: 'No due date',
    day: 'day',
    days: 'days',
    assignMembers: 'Assign members',
    assignTasks: 'Assign members',
    assigned: 'Assigned',
    unassigned: 'Unassigned',
    assignedMembers: 'Assigned members',
    activity: 'Activity',
    attachments: 'Attachments',
    comments: 'Comments',
    changeCover: 'Change cover',
    removeCover: 'Remove cover',
    addImage: 'Add image',
    removeImage: 'Remove image',
    uploading: 'Uploading...',
    markComplete: 'Mark complete',
    markIncomplete: 'Mark incomplete',
    noStatus: 'No status',
    noLabels: 'No labels',
    statusAndLabels: 'Status & Labels',
    status: 'Status',
    labels: 'Labels',
    statusPlaceholder: 'Select status',
    labelPlaceholder: 'Select labels',
    addToGoogleCalendar: 'Add to Google Calendar',
    commentaryAndActivity: 'Commentary & Activity',
    showAll: 'All',
    showComments: 'Comments',
    showActivity: 'Activity',
    writeComment: 'Write a comment...',
    send: 'Send',
    noComments: 'No comments yet',
    noActivity: 'No activity yet',
    noActivityLog: 'No activity recorded',
    editComment: 'Edit',
    deleteComment: 'Delete',
    deleteCommentConfirm: 'Are you sure you want to delete this comment?',
    commentEdited: '(edited)',
    removeLabel: 'Remove label',
    statusAlreadyExists: 'This status already exists',
    labelAlreadyExists: 'This label already exists',
    deleteStatusConfirm: 'Delete this status for the entire board?',
    deleteLabelConfirm: 'Delete this label for the entire board?',
    newStatusPlaceholder: 'New status...',
    newLabelPlaceholder: 'New label...',
    addStatus: 'Add status',
    addLabel: 'Add label',
    activityCreated: 'created this card',
    activityMoved: 'moved this card',
    activityRenamed: 'renamed this card',
    activityDescriptionChanged: 'changed the description',
    activityCoverChanged: 'changed the cover',
    activityDueDateChanged: 'changed the due date',
    activityCompleted: 'marked this card complete',
    activityUncompleted: 'marked this card incomplete',
    activityStatusChanged: 'changed the status',
    activityLabelsChanged: 'changed the labels',
    activityAssigned: 'was assigned',
    activityUnassigned: 'was unassigned',
    activityImageAdded: 'added an image',
    activityImageRemoved: 'removed an image',
    activityCommentAdded: 'added a comment',
    activityCommentDeleted: 'deleted a comment',
  },
  settings: {
    selectImage: 'Please select an image',
    imageSize: 'Image must be less than 5MB',
    uploadError: 'Error uploading image',
  },
  github: {
    powerUp: 'GitHub Power-Up',
  },
  sharing: {
    manageMembers: 'Manage members',
    owner: 'Owner',
  },
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useLanguage } = require('../lib/language-context') as { useLanguage: jest.Mock }

/* ─── helpers ─── */

const makeCard = (overrides: Partial<Card> = {}): Card => ({
  id: 'card-1',
  title: 'Test Card',
  description: 'Test description',
  status: null,
  labels: [],
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
  ...overrides,
})

const makeBoardMember = (overrides: Partial<BoardMember> = {}): BoardMember => ({
  id: 'member-1',
  board_id: 'board-1',
  user_id: 'user-1',
  role: 'owner',
  joined_at: '2024-01-01T00:00:00Z',
  username: 'TestUser',
  avatar_url: null,
  ...overrides,
})

const makeAssignment = (overrides: Partial<CardAssignment> = {}): CardAssignment => ({
  id: 'assign-1',
  card_id: 'card-1',
  user_id: 'user-1',
  assigned_at: '2024-01-01T00:00:00Z',
  assigned_by: null,
  username: 'TestUser',
  avatar_url: null,
  ...overrides,
})

const makeImage = (overrides: Partial<CardImage> = {}): CardImage => ({
  id: 'img-1',
  card_id: 'card-1',
  url: 'https://example.com/test-image.jpg',
  position: 0,
  uploaded_by: null,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

const defaultProps = () => ({
  card: makeCard(),
  onClose: jest.fn(),
  onUpdate: jest.fn(),
  onDelete: jest.fn(),
  boardMembers: [makeBoardMember()] as BoardMember[],
  cardAssignments: [] as CardAssignment[],
  onToggleAssignment: jest.fn().mockResolvedValue(undefined),
  togglingUser: null as string | null,
  cardImages: [] as CardImage[],
  onImagesChange: jest.fn(),
  onCommentCountChange: jest.fn(),
  boardId: 'board-1',
  onRefreshBoard: jest.fn().mockResolvedValue(undefined),
})

const renderModal = (propOverrides: Record<string, any> = {}) => {
  const props = { ...defaultProps(), ...propOverrides }
  return render(<CardDetailModal {...(props as any)} />)
}

/* ─── setup ─── */

beforeEach(() => {
  jest.clearAllMocks()
  useLanguage.mockReturnValue({ language: 'en', t: mockTranslations })
  mockConfirm.mockResolvedValue(true)
  mockAlert.mockResolvedValue(undefined)
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ comments: [], activities: [], statuses: [], labels: [] }),
  })
  window.open = jest.fn()
})

/* ────────────────────────── Tests ────────────────────────── */

describe('CardDetailModal', () => {
  /* ─── basic rendering ─── */

  it('renders overlay and container when open', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
  })

  it('renders card title', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
  })

  it('renders card description', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('Test description')).toBeInTheDocument()
    })
  })

  it('renders placeholder when description is null', async () => {
    renderModal({ card: makeCard({ description: null }) })
    await waitFor(() => {
      expect(screen.getByText('Add a description...')).toBeInTheDocument()
    })
  })

  it('renders the close button', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('✕')).toBeInTheDocument()
    })
  })

  /* ─── close behaviors ─── */

  it('calls onClose when overlay is clicked', async () => {
    const onClose = jest.fn()
    const { container } = renderModal({ onClose })
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    const overlay = container.querySelector('.cdm-overlay')!
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when container is clicked (propagation stopped)', async () => {
    const onClose = jest.fn()
    const { container } = renderModal({ onClose })
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    const cdmContainer = container.querySelector('.cdm-container')!
    fireEvent.click(cdmContainer)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = jest.fn()
    renderModal({ onClose })
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    // The first ✕ is the close button
    const closeButtons = screen.getAllByText('✕')
    fireEvent.click(closeButtons[0])
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', async () => {
    const onClose = jest.fn()
    renderModal({ onClose })
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  /* ─── title editing ─── */

  it('enters title editing mode on title click', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Test Card'))
    expect(screen.getByDisplayValue('Test Card')).toBeInTheDocument()
  })

  it('saves title on blur with new value', async () => {
    const onUpdate = jest.fn()
    renderModal({ onUpdate })
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Test Card'))
    const input = screen.getByDisplayValue('Test Card')
    fireEvent.change(input, { target: { value: 'New Title' } })
    fireEvent.blur(input)
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Title' }))
    })
  })

  it('saves title on Enter key', async () => {
    const onUpdate = jest.fn()
    renderModal({ onUpdate })
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Test Card'))
    const input = screen.getByDisplayValue('Test Card')
    fireEvent.change(input, { target: { value: 'Enter Title' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ title: 'Enter Title' }))
    })
  })

  it('cancels title editing on Escape key', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Test Card'))
    const input = screen.getByDisplayValue('Test Card')
    fireEvent.change(input, { target: { value: 'Changed' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
  })

  it('does not update title when value is unchanged', async () => {
    const onUpdate = jest.fn()
    renderModal({ onUpdate })
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Test Card'))
    const input = screen.getByDisplayValue('Test Card')
    fireEvent.blur(input)
    expect(onUpdate).not.toHaveBeenCalledWith(expect.objectContaining({ title: expect.anything() }))
  })

  it('enters title editing mode via edit icon button', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    const editBtns = screen.getAllByText('✏️')
    // First ✏️ is the title edit icon on the h2
    fireEvent.click(editBtns[0])
    expect(screen.getByDisplayValue('Test Card')).toBeInTheDocument()
  })

  /* ─── description editing ─── */

  it('enters description editing mode on click', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('Test description')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Test description'))
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument()
  })

  it('saves new description on save button click', async () => {
    const onUpdate = jest.fn()
    renderModal({ onUpdate })
    await waitFor(() => {
      expect(screen.getByText('Test description')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Test description'))
    const textarea = screen.getByDisplayValue('Test description')
    fireEvent.change(textarea, { target: { value: 'Updated description' } })
    // Click the Save button in description edit actions
    const saveButtons = screen.getAllByText('Save')
    fireEvent.click(saveButtons[0])
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ description: 'Updated description' }))
    })
  })

  it('cancels description editing on cancel button', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('Test description')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Test description'))
    const textarea = screen.getByDisplayValue('Test description')
    fireEvent.change(textarea, { target: { value: 'Something else' } })
    const cancelButtons = screen.getAllByText('Cancel')
    fireEvent.click(cancelButtons[0])
    await waitFor(() => {
      expect(screen.getByText('Test description')).toBeInTheDocument()
    })
  })

  /* ─── completion toggle ─── */

  it('renders incomplete checkbox when not completed', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    // The sidebar button shows "Mark complete"
    expect(screen.getByText(/Mark complete/)).toBeInTheDocument()
  })

  it('renders completed state', async () => {
    renderModal({ card: makeCard({ is_completed: true }) })
    await waitFor(() => {
      expect(screen.getByText(/Mark incomplete/)).toBeInTheDocument()
    })
  })

  it('toggles completion on checkbox click', async () => {
    const onUpdate = jest.fn()
    renderModal({ onUpdate })
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    // Click the sidebar completion button
    fireEvent.click(screen.getByText(/Mark complete/))
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ is_completed: true }))
    })
  })

  it('toggles from completed to incomplete', async () => {
    const onUpdate = jest.fn()
    renderModal({ card: makeCard({ is_completed: true }), onUpdate })
    await waitFor(() => {
      expect(screen.getByText(/Mark incomplete/)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/Mark incomplete/))
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ is_completed: false }))
    })
  })

  /* ─── status display ─── */

  it('shows "No status" when card has no status', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getAllByText('No status').length).toBeGreaterThan(0)
    })
  })

  it('shows status chip when card has a status', async () => {
    renderModal({ card: makeCard({ status: 'In Progress' }) })
    await waitFor(() => {
      expect(screen.getAllByText('In Progress').length).toBeGreaterThan(0)
    })
  })

  /* ─── labels display ─── */

  it('shows "No labels" when card has no labels', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getAllByText('No labels').length).toBeGreaterThan(0)
    })
  })

  it('shows label chips when card has labels', async () => {
    renderModal({ card: makeCard({ labels: ['Bug', 'Feature'] }) })
    await waitFor(() => {
      expect(screen.getAllByText('Bug').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Feature').length).toBeGreaterThan(0)
    })
  })

  /* ─── dates display ─── */

  it('shows set dates button when no dates are set', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getAllByText(/Set dates/).length).toBeGreaterThan(0)
    })
  })

  it('shows due date when set', async () => {
    renderModal({ card: makeCard({ due_date: '2025-12-31T00:00:00Z' }) })
    await waitFor(() => {
      expect(screen.getByText('Due date')).toBeInTheDocument()
    })
  })

  it('shows start and due date when both set', async () => {
    renderModal({
      card: makeCard({
        start_date: '2025-12-01T00:00:00Z',
        due_date: '2025-12-31T00:00:00Z',
      }),
    })
    await waitFor(() => {
      expect(screen.getByText('Start date')).toBeInTheDocument()
      expect(screen.getByText('Due date')).toBeInTheDocument()
    })
  })

  it('opens date editor when clicking edit on date display', async () => {
    renderModal({ card: makeCard({ due_date: '2025-12-31T00:00:00Z' }) })
    await waitFor(() => {
      expect(screen.getByText('Due date')).toBeInTheDocument()
    })
    const editButtons = screen.getAllByText(/Edit/)
    // Find the date section edit button
    const dateEditBtn = editButtons.find(btn => btn.closest('.cdm-dates-display'))
    if (dateEditBtn) {
      fireEvent.click(dateEditBtn)
      await waitFor(() => {
        expect(screen.getByText('Remove dates')).toBeInTheDocument()
      })
    }
  })

  it('removes dates on remove button click', async () => {
    const onUpdate = jest.fn()
    renderModal({ card: makeCard({ due_date: '2025-12-31T00:00:00Z' }), onUpdate })
    await waitFor(() => {
      expect(screen.getByText('Due date')).toBeInTheDocument()
    })
    // Open date editor
    const editButtons = screen.getAllByText(/Edit/)
    const dateEditBtn = editButtons.find(btn => btn.closest('.cdm-dates-display'))
    if (dateEditBtn) {
      fireEvent.click(dateEditBtn)
      await waitFor(() => {
        expect(screen.getByText('Remove dates')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Remove dates'))
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ start_date: null, due_date: null })
      )
    }
  })

  it('opens date section when sidebar dates button is clicked', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    // Sidebar has the dates button
    const datesBtns = screen.getAllByText(/Set dates/)
    fireEvent.click(datesBtns[datesBtns.length - 1])
    await waitFor(() => {
      expect(screen.getByText('Due date')).toBeInTheDocument()
    })
  })

  /* ─── cover color ─── */

  it('opens color picker on sidebar button click', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/Change cover/))
    await waitFor(() => {
      // Color picker should show with color option buttons
      expect(screen.getByText(/Change cover/)).toBeInTheDocument()
    })
  })

  it('updates cover color when a color is selected', async () => {
    const onUpdate = jest.fn()
    const { container } = renderModal({ onUpdate })
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/Change cover/))
    await waitFor(() => {
      const colorOptions = container.querySelectorAll('.cdm-color-option')
      expect(colorOptions.length).toBeGreaterThan(0)
    })
    const colorOptions = container.querySelectorAll('.cdm-color-option')
    // Click the second option (Rouge / Red)
    fireEvent.click(colorOptions[1])
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ cover_color: '#eb5a46' }))
    })
  })

  it('removes cover color when "none" is selected', async () => {
    const onUpdate = jest.fn()
    const { container } = renderModal({
      card: makeCard({ cover_color: '#eb5a46' }),
      onUpdate,
    })
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/Change cover/))
    await waitFor(() => {
      const colorOptions = container.querySelectorAll('.cdm-color-option')
      expect(colorOptions.length).toBeGreaterThan(0)
    })
    const colorOptions = container.querySelectorAll('.cdm-color-option')
    // Click the first option (none)
    fireEvent.click(colorOptions[0])
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ cover_color: null }))
    })
  })

  it('renders cover color bar when card has cover color', async () => {
    const { container } = renderModal({ card: makeCard({ cover_color: '#eb5a46' }) })
    await waitFor(() => {
      const coverColor = container.querySelector('.cdm-cover-color')
      expect(coverColor).toBeInTheDocument()
      expect(coverColor).toHaveStyle({ backgroundColor: '#eb5a46' })
    })
  })

  it('shows remove cover button when cover_color is set', async () => {
    renderModal({ card: makeCard({ cover_color: '#eb5a46' }) })
    await waitFor(() => {
      expect(screen.getByText(/Remove cover/)).toBeInTheDocument()
    })
  })

  it('clears cover on remove cover button click', async () => {
    const onUpdate = jest.fn()
    renderModal({ card: makeCard({ cover_color: '#eb5a46' }), onUpdate })
    await waitFor(() => {
      expect(screen.getByText(/Remove cover/)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/Remove cover/))
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ cover_color: null }))
  })

  /* ─── images section ─── */

  it('renders image in cover when images exist', async () => {
    const images = [makeImage()]
    const { container } = renderModal({ cardImages: images })
    await waitFor(() => {
      const coverImage = container.querySelector('.cdm-cover-image')
      expect(coverImage).toBeInTheDocument()
    })
  })

  it('shows image count badge when multiple images', async () => {
    const images = [
      makeImage(),
      makeImage({ id: 'img-2', url: 'https://example.com/img2.jpg', position: 1 }),
    ]
    renderModal({ cardImages: images })
    await waitFor(() => {
      expect(screen.getByText(/2/)).toBeInTheDocument()
    })
  })

  it('shows gallery thumbnails in sidebar when images exist', async () => {
    const images = [makeImage()]
    const { container } = renderModal({ cardImages: images })
    await waitFor(() => {
      const gallery = container.querySelector('.cdm-sidebar-gallery')
      expect(gallery).toBeInTheDocument()
    })
  })

  it('opens carousel lightbox on image click', async () => {
    const images = [makeImage()]
    const { container } = renderModal({ cardImages: images })
    await waitFor(() => {
      const thumb = container.querySelector('.cdm-sidebar-thumb')
      expect(thumb).toBeInTheDocument()
    })
    const thumb = container.querySelector('.cdm-sidebar-thumb')!
    fireEvent.click(thumb)
    await waitFor(() => {
      const lightbox = container.querySelector('.cdm-image-lightbox')
      expect(lightbox).toBeInTheDocument()
    })
  })

  it('deletes image when confirmed', async () => {
    const images = [makeImage()]
    const onImagesChange = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ images: [], comments: [], activities: [], statuses: [], labels: [] }),
    })
    mockConfirm.mockResolvedValue(true)
    const { container } = renderModal({ cardImages: images, onImagesChange })
    await waitFor(() => {
      const deleteBtn = container.querySelector('.cdm-gallery-delete-btn')
      expect(deleteBtn).toBeInTheDocument()
    })
    const deleteBtn = container.querySelector('.cdm-gallery-delete-btn')!
    await act(async () => {
      fireEvent.click(deleteBtn)
    })
    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled()
    })
  })

  it('does not delete image when cancelled', async () => {
    const images = [makeImage()]
    const onImagesChange = jest.fn()
    mockConfirm.mockResolvedValue(false)
    const { container } = renderModal({ cardImages: images, onImagesChange })
    await waitFor(() => {
      const deleteBtn = container.querySelector('.cdm-gallery-delete-btn')
      expect(deleteBtn).toBeInTheDocument()
    })
    const deleteBtn = container.querySelector('.cdm-gallery-delete-btn')!
    await act(async () => {
      fireEvent.click(deleteBtn)
    })
    await waitFor(() => {
      expect(onImagesChange).not.toHaveBeenCalled()
    })
  })

  it('shows uploading state on add image button', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getAllByText(/Add image/).length).toBeGreaterThan(0)
    })
  })

  /* ─── assignment section ─── */

  it('shows assigned members row when assignments exist', async () => {
    const assignments = [makeAssignment()]
    renderModal({ cardAssignments: assignments })
    await waitFor(() => {
      expect(screen.getByText('Assigned members')).toBeInTheDocument()
    })
  })

  it('shows avatar initials for assigned members without avatar', async () => {
    const assignments = [makeAssignment({ avatar_url: undefined })]
    renderModal({ cardAssignments: assignments })
    await waitFor(() => {
      // getInitials('TestUser') yields 'T' (single word → first char only)
      expect(screen.getAllByText('T').length).toBeGreaterThan(0)
    })
  })

  it('opens assign panel on manage members click', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('Manage members')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Manage members'))
    await waitFor(() => {
      // Assign panel should show board members
      expect(screen.getByText('TestUser')).toBeInTheDocument()
    })
  })

  it('toggles assign panel on second click', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('Manage members')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Manage members'))
    await waitFor(() => {
      expect(screen.getByText('TestUser')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Manage members'))
    // Panel should close
  })

  it('calls onToggleAssignment when toggling a member in assign panel', async () => {
    const onToggleAssignment = jest.fn().mockResolvedValue(undefined)
    renderModal({
      boardMembers: [makeBoardMember()],
      onToggleAssignment,
    })
    await waitFor(() => {
      expect(screen.getByText('Manage members')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Manage members'))
    await waitFor(() => {
      // Look for the assign row button
      const assignRows = screen.getAllByText('TestUser')
      expect(assignRows.length).toBeGreaterThan(0)
    })
    // Find the assign row button within the panel
    const assignPanel = document.querySelector('.cdm-assign-panel')
    const assignButton = assignPanel?.querySelector('button')
    if (assignButton) {
      fireEvent.click(assignButton)
      expect(onToggleAssignment).toHaveBeenCalledWith('user-1')
    }
  })

  it('shows checkmark for already assigned members', async () => {
    const assignments = [makeAssignment()]
    renderModal({
      cardAssignments: assignments,
      boardMembers: [makeBoardMember()],
    })
    await waitFor(() => {
      expect(screen.getByText('Manage members')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Manage members'))
    await waitFor(() => {
      const assignPanel = document.querySelector('.cdm-assign-panel')
      const checkedDiv = assignPanel?.querySelector('.cdm-assign-check.checked')
      expect(checkedDiv).toBeInTheDocument()
    })
  })

  /* ─── comments section ─── */

  it('shows loading state while feed is loading', async () => {
    // Delay the fetch to see loading state
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/comments')) {
        return new Promise(() => { /* never resolves to test loading state */ })
      }
      if (url.includes('/activity')) {
        return new Promise(() => { /* never resolves to test loading state */ })
      }
      return Promise.resolve({ ok: true, json: async () => ({ statuses: [], labels: [] }) })
    })
    renderModal()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows empty state when no comments or activity', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ comments: [], activities: [], statuses: [], labels: [] }),
    })
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('No activity recorded')).toBeInTheDocument()
    })
  })

  it('displays comments when loaded', async () => {
    const mockComments = [
      {
        id: 'comment-1',
        card_id: 'card-1',
        user_id: 'user-1',
        content: 'Hello comment',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        username: 'TestUser',
        avatar_url: null,
      },
    ]
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/comments')) {
        return Promise.resolve({ ok: true, json: async () => ({ comments: mockComments }) })
      }
      if (url.includes('/activity')) {
        return Promise.resolve({ ok: true, json: async () => ({ activities: [] }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({ statuses: [], labels: [] }) })
    })
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('Hello comment')).toBeInTheDocument()
    })
  })

  it('renders comment username', async () => {
    const mockComments = [
      {
        id: 'comment-1',
        card_id: 'card-1',
        user_id: 'user-1',
        content: 'A comment',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        username: 'CommentUser',
        avatar_url: null,
      },
    ]
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/comments')) {
        return Promise.resolve({ ok: true, json: async () => ({ comments: mockComments }) })
      }
      if (url.includes('/activity')) {
        return Promise.resolve({ ok: true, json: async () => ({ activities: [] }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({ statuses: [], labels: [] }) })
    })
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('CommentUser')).toBeInTheDocument()
    })
  })

  it('shows (edited) badge for edited comments', async () => {
    const mockComments = [
      {
        id: 'comment-1',
        card_id: 'card-1',
        user_id: 'user-1',
        content: 'Edited comment',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
        username: 'TestUser',
        avatar_url: null,
      },
    ]
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/comments')) {
        return Promise.resolve({ ok: true, json: async () => ({ comments: mockComments }) })
      }
      if (url.includes('/activity')) {
        return Promise.resolve({ ok: true, json: async () => ({ activities: [] }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({ statuses: [], labels: [] }) })
    })
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('(edited)')).toBeInTheDocument()
    })
  })

  it('submits a new comment on send button click', async () => {
    const newComment = {
      id: 'comment-new',
      card_id: 'card-1',
      user_id: 'user-1',
      content: 'New comment text',
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
      username: 'TestUser',
      avatar_url: null,
    }
    ;(global.fetch as jest.Mock).mockImplementation((url: string, opts?: any) => {
      if (url.includes('/comments') && opts?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({ comment: newComment }) })
      }
      if (url.includes('/comments')) {
        return Promise.resolve({ ok: true, json: async () => ({ comments: [] }) })
      }
      if (url.includes('/activity')) {
        return Promise.resolve({ ok: true, json: async () => ({ activities: [] }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({ statuses: [], labels: [] }) })
    })
    renderModal()
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument()
    })
    const commentInput = screen.getByPlaceholderText('Write a comment...')
    fireEvent.change(commentInput, { target: { value: 'New comment text' } })
    fireEvent.click(screen.getByText('Send'))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/cards/card-1/comments',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('submits comment on Enter key (without shift)', async () => {
    ;(global.fetch as jest.Mock).mockImplementation((url: string, opts?: any) => {
      if (url.includes('/comments') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            comment: {
              id: 'comment-new',
              card_id: 'card-1',
              user_id: 'user-1',
              content: 'Enter comment',
              created_at: '2024-01-03T00:00:00Z',
              updated_at: '2024-01-03T00:00:00Z',
              username: 'TestUser',
              avatar_url: null,
            },
          }),
        })
      }
      if (url.includes('/comments')) {
        return Promise.resolve({ ok: true, json: async () => ({ comments: [] }) })
      }
      if (url.includes('/activity')) {
        return Promise.resolve({ ok: true, json: async () => ({ activities: [] }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({ statuses: [], labels: [] }) })
    })
    renderModal()
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument()
    })
    const commentInput = screen.getByPlaceholderText('Write a comment...')
    fireEvent.change(commentInput, { target: { value: 'Enter comment' } })
    fireEvent.keyDown(commentInput, { key: 'Enter', shiftKey: false })
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/cards/card-1/comments',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('does not submit empty comment', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument()
    })
    // Send button should be disabled when empty
    const sendBtn = screen.getByText('Send')
    expect(sendBtn).toBeDisabled()
  })

  it('enters edit mode when clicking edit on a comment', async () => {
    const mockComments = [
      {
        id: 'comment-1',
        card_id: 'card-1',
        user_id: 'user-1',
        content: 'Original comment',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        username: 'TestUser',
        avatar_url: null,
      },
    ]
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/comments')) {
        return Promise.resolve({ ok: true, json: async () => ({ comments: mockComments }) })
      }
      if (url.includes('/activity')) {
        return Promise.resolve({ ok: true, json: async () => ({ activities: [] }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({ statuses: [], labels: [] }) })
    })
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('Original comment')).toBeInTheDocument()
    })
    // Click the "Edit" button on the comment
    const editBtns = screen.getAllByText('Edit')
    const commentEditBtn = editBtns.find(btn => btn.classList.contains('cdm-comment-action-btn'))
    if (commentEditBtn) {
      fireEvent.click(commentEditBtn)
      await waitFor(() => {
        expect(screen.getByDisplayValue('Original comment')).toBeInTheDocument()
      })
    }
  })

  it('deletes comment when confirmed', async () => {
    const mockComments = [
      {
        id: 'comment-1',
        card_id: 'card-1',
        user_id: 'user-1',
        content: 'To be deleted',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        username: 'TestUser',
        avatar_url: null,
      },
    ]
    ;(global.fetch as jest.Mock).mockImplementation((url: string, opts?: any) => {
      if (url.includes('/comments') && opts?.method === 'DELETE') {
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }
      if (url.includes('/comments')) {
        return Promise.resolve({ ok: true, json: async () => ({ comments: mockComments }) })
      }
      if (url.includes('/activity')) {
        return Promise.resolve({ ok: true, json: async () => ({ activities: [] }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({ statuses: [], labels: [] }) })
    })
    mockConfirm.mockResolvedValue(true)
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('To be deleted')).toBeInTheDocument()
    })
    // Click the "Delete" button on the comment
    const deleteBtns = screen.getAllByText('Delete')
    const commentDeleteBtn = deleteBtns.find(btn => btn.classList.contains('cdm-comment-delete-btn'))
    if (commentDeleteBtn) {
      await act(async () => {
        fireEvent.click(commentDeleteBtn)
      })
      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalled()
      })
    }
  })

  /* ─── feed filter tabs ─── */

  it('renders feed filter tabs', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument()
      expect(screen.getByText('Comments')).toBeInTheDocument()
      expect(screen.getByText('Activity')).toBeInTheDocument()
    })
  })

  it('switches to comments-only filter', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ comments: [], activities: [], statuses: [], labels: [] }),
    })
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('Comments')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Comments'))
    await waitFor(() => {
      expect(screen.getByText('No comments yet')).toBeInTheDocument()
    })
  })

  it('switches to activity-only filter', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ comments: [], activities: [], statuses: [], labels: [] }),
    })
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('Activity')).toBeInTheDocument()
    })
    // Need to click the Activity tab (the one that is a feed tab, not the section label)
    const activityTabs = screen.getAllByText('Activity')
    const feedTab = activityTabs.find(el => el.classList.contains('cdm-feed-tab'))
    if (feedTab) {
      fireEvent.click(feedTab)
      await waitFor(() => {
        expect(screen.getByText('No activity yet')).toBeInTheDocument()
      })
    }
  })

  /* ─── activity display ─── */

  it('displays activity items', async () => {
    const mockActivities = [
      {
        id: 'activity-1',
        card_id: 'card-1',
        user_id: 'user-1',
        action_type: 'created',
        action_data: {},
        created_at: '2024-01-01T00:00:00Z',
        username: 'TestUser',
        avatar_url: null,
      },
    ]
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/comments')) {
        return Promise.resolve({ ok: true, json: async () => ({ comments: [] }) })
      }
      if (url.includes('/activity')) {
        return Promise.resolve({ ok: true, json: async () => ({ activities: mockActivities }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({ statuses: [], labels: [] }) })
    })
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('created this card')).toBeInTheDocument()
    })
  })

  /* ─── delete card ─── */

  it('calls onDelete and onClose after confirming card deletion', async () => {
    const onDelete = jest.fn()
    const onClose = jest.fn()
    mockConfirm.mockResolvedValue(true)
    renderModal({ onDelete, onClose })
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/Delete card/))
    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled()
      expect(onDelete).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('does not delete card when confirm is cancelled', async () => {
    const onDelete = jest.fn()
    mockConfirm.mockResolvedValue(false)
    renderModal({ onDelete })
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    await act(async () => {
      fireEvent.click(screen.getByText(/Delete card/))
    })
    await waitFor(() => {
      expect(onDelete).not.toHaveBeenCalled()
    })
  })

  /* ─── GitHub Power-Up ─── */

  it('opens GitHub Power-Up modal', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByText(/GitHub Power-Up/)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/GitHub Power-Up/))
    await waitFor(() => {
      expect(screen.getByTestId('github-powerup')).toBeInTheDocument()
    })
  })

  it('closes GitHub Power-Up modal', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByText(/GitHub Power-Up/)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/GitHub Power-Up/))
    await waitFor(() => {
      expect(screen.getByTestId('github-powerup')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('CloseGitHub'))
    await waitFor(() => {
      expect(screen.queryByTestId('github-powerup')).not.toBeInTheDocument()
    })
  })

  it('does not close modal via Escape when GitHub Power-Up is open', async () => {
    const onClose = jest.fn()
    renderModal({ onClose })
    await waitFor(() => {
      expect(screen.getByText(/GitHub Power-Up/)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/GitHub Power-Up/))
    await waitFor(() => {
      expect(screen.getByTestId('github-powerup')).toBeInTheDocument()
    })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  /* ─── status & label dropdowns ─── */

  it('opens status dropdown on click', async () => {
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/statuses')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            statuses: [
              { id: 'status-1', board_id: 'board-1', name: 'Todo', color: '#ff0000', created_by: null, created_at: '2024-01-01' },
            ],
          }),
        })
      }
      if (url.includes('/labels')) {
        return Promise.resolve({ ok: true, json: async () => ({ labels: [] }) })
      }
      if (url.includes('/comments')) {
        return Promise.resolve({ ok: true, json: async () => ({ comments: [] }) })
      }
      if (url.includes('/activity')) {
        return Promise.resolve({ ok: true, json: async () => ({ activities: [] }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    renderModal()
    await waitFor(() => {
      expect(screen.getByText(/Select status/)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/Select status/))
    await waitFor(() => {
      expect(screen.getByText('Todo')).toBeInTheDocument()
    })
  })

  it('selects a status from dropdown', async () => {
    const onUpdate = jest.fn()
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/statuses')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            statuses: [
              { id: 'status-1', board_id: 'board-1', name: 'Done', color: '#00ff00', created_by: null, created_at: '2024-01-01' },
            ],
          }),
        })
      }
      if (url.includes('/labels')) {
        return Promise.resolve({ ok: true, json: async () => ({ labels: [] }) })
      }
      if (url.includes('/comments')) {
        return Promise.resolve({ ok: true, json: async () => ({ comments: [] }) })
      }
      if (url.includes('/activity')) {
        return Promise.resolve({ ok: true, json: async () => ({ activities: [] }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    renderModal({ onUpdate })
    await waitFor(() => {
      expect(screen.getByText(/Select status/)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/Select status/))
    await waitFor(() => {
      expect(screen.getByText('Done')).toBeInTheDocument()
    })
    // Click on the status item button
    const doneButtons = screen.getAllByText('Done')
    const statusBtn = doneButtons.find(el => el.closest('.cdm-dropdown-item-btn'))
    if (statusBtn) {
      fireEvent.click(statusBtn)
      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'Done' }))
      })
    }
  })

  it('opens label dropdown on click', async () => {
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/labels')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            labels: [
              { id: 'label-1', board_id: 'board-1', name: 'Bug', color: '#ff0000', created_by: null, created_at: '2024-01-01' },
            ],
          }),
        })
      }
      if (url.includes('/statuses')) {
        return Promise.resolve({ ok: true, json: async () => ({ statuses: [] }) })
      }
      if (url.includes('/comments')) {
        return Promise.resolve({ ok: true, json: async () => ({ comments: [] }) })
      }
      if (url.includes('/activity')) {
        return Promise.resolve({ ok: true, json: async () => ({ activities: [] }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    renderModal()
    await waitFor(() => {
      expect(screen.getByText(/Select labels/)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/Select labels/))
    await waitFor(() => {
      expect(screen.getByText('Bug')).toBeInTheDocument()
    })
  })

  /* ─── label removal from sidebar ─── */

  it('removes a label by clicking label chip in sidebar', async () => {
    const onUpdate = jest.fn()
    renderModal({ card: makeCard({ labels: ['Bug', 'Feature'] }), onUpdate })
    await waitFor(() => {
      const sidebarLabels = document.querySelector('.cdm-sidebar-labels-list')
      expect(sidebarLabels).toBeInTheDocument()
    })
    const labelChips = document.querySelectorAll('.cdm-sidebar-label-chip')
    if (labelChips.length > 0) {
      fireEvent.click(labelChips[0])
      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ labels: expect.arrayContaining(['Feature']) })
        )
      })
    }
  })

  /* ─── completed title styling ─── */

  it('applies completed class to title when card is completed', async () => {
    const { container } = renderModal({ card: makeCard({ is_completed: true }) })
    await waitFor(() => {
      const title = container.querySelector('.cdm-title.completed')
      expect(title).toBeInTheDocument()
    })
  })

  /* ─── image carousel navigation ─── */

  it('navigates carousel with arrows', async () => {
    const images = [
      makeImage(),
      makeImage({ id: 'img-2', url: 'https://example.com/img2.jpg', position: 1 }),
    ]
    const { container } = renderModal({ cardImages: images })
    await waitFor(() => {
      const coverImage = container.querySelector('.cdm-cover-image')
      expect(coverImage).toBeInTheDocument()
    })
    // Open carousel from cover
    const coverImage = container.querySelector('.cdm-cover-image')!
    fireEvent.click(coverImage)
    await waitFor(() => {
      const rightArrow = container.querySelector('.cdm-carousel-right')
      expect(rightArrow).toBeInTheDocument()
    })
    // Click right arrow
    const rightArrow = container.querySelector('.cdm-carousel-right')!
    fireEvent.click(rightArrow)
    await waitFor(() => {
      expect(container.querySelector('.cdm-carousel-counter')?.textContent).toBe('2 / 2')
    })
    // Click left arrow
    const leftArrow = container.querySelector('.cdm-carousel-left')!
    fireEvent.click(leftArrow)
    await waitFor(() => {
      expect(container.querySelector('.cdm-carousel-counter')?.textContent).toBe('1 / 2')
    })
  })

  it('closes lightbox on background click', async () => {
    const images = [makeImage()]
    const { container } = renderModal({ cardImages: images })
    await waitFor(() => {
      const coverImage = container.querySelector('.cdm-cover-image')
      expect(coverImage).toBeInTheDocument()
    })
    const coverImage = container.querySelector('.cdm-cover-image')!
    fireEvent.click(coverImage)
    await waitFor(() => {
      const lightbox = container.querySelector('.cdm-image-lightbox')
      expect(lightbox).toBeInTheDocument()
    })
    const lightbox = container.querySelector('.cdm-image-lightbox')!
    fireEvent.click(lightbox)
    await waitFor(() => {
      expect(container.querySelector('.cdm-image-lightbox')).not.toBeInTheDocument()
    })
  })

  /* ─── Google Calendar link ─── */

  it('shows Google Calendar button when due date exists', async () => {
    renderModal({ card: makeCard({ due_date: '2025-12-31T00:00:00Z' }) })
    await waitFor(() => {
      expect(screen.getByText('Add to Google Calendar')).toBeInTheDocument()
    })
  })

  it('opens Google Calendar link on button click', async () => {
    renderModal({ card: makeCard({ due_date: '2025-12-31T00:00:00Z' }) })
    await waitFor(() => {
      expect(screen.getByText('Add to Google Calendar')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Add to Google Calendar'))
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('calendar.google.com'),
      '_blank'
    )
  })

  /* ─── date section editor ─── */

  it('opens date editor and saves dates', async () => {
    const onUpdate = jest.fn()
    renderModal({ onUpdate })
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    // Click sidebar dates button to open editor
    const datesBtns = screen.getAllByText(/Set dates/)
    fireEvent.click(datesBtns[datesBtns.length - 1])
    await waitFor(() => {
      // Due date input should be visible
      const dateInputs = document.querySelectorAll('.cdm-date-input')
      expect(dateInputs.length).toBeGreaterThan(0)
    })
    // Set a due date
    const dateInputs = document.querySelectorAll('.cdm-date-input')
    fireEvent.change(dateInputs[0], { target: { value: '2025-12-31' } })
    // Click Save
    const saveButtons = screen.getAllByText('Save')
    const dateSaveBtn = saveButtons.find(btn => btn.closest('.cdm-date-editor'))
    if (dateSaveBtn) {
      fireEvent.click(dateSaveBtn)
      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ due_date: expect.any(String) })
        )
      })
    }
  })

  /* ─── description section header edit button ─── */

  it('enters description edit mode via section header edit icon', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('Test description')).toBeInTheDocument()
    })
    // Find the description section edit icon button
    const editIcons = screen.getAllByText('✏️')
    const descEditIcon = editIcons.find(el =>
      el.closest('.cdm-description-section')
    )
    if (descEditIcon) {
      fireEvent.click(descEditIcon)
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test description')).toBeInTheDocument()
      })
    }
  })

  /* ─── sync card data on prop change ─── */

  it('updates internal state when card prop changes', async () => {
    const { rerender } = renderModal()
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    const props = defaultProps()
    const newCard = makeCard({ title: 'Updated Card', description: 'New desc' })
    rerender(<CardDetailModal {...props} card={newCard} />)
    await waitFor(() => {
      expect(screen.getByText('Updated Card')).toBeInTheDocument()
    })
  })

  /* ─── completion fires sync-github call ─── */

  it('calls sync-github API when toggling completion', async () => {
    const onUpdate = jest.fn()
    renderModal({ onUpdate })
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/Mark complete/))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/cards/card-1/sync-github',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  /* ─── Escape suppressed when assign panel open ─── */

  it('does not close modal via Escape when assign panel is open', async () => {
    const onClose = jest.fn()
    renderModal({ onClose })
    await waitFor(() => {
      expect(screen.getByText('Manage members')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Manage members'))
    await waitFor(() => {
      const assignPanel = document.querySelector('.cdm-assign-panel')
      expect(assignPanel).toBeInTheDocument()
    })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  /* ─── multiple board members in assign panel ─── */

  it('shows multiple board members in assign panel', async () => {
    const members = [
      makeBoardMember({ user_id: 'user-1', username: 'Alice' }),
      makeBoardMember({ id: 'member-2', user_id: 'user-2', username: 'Bob' }),
    ]
    renderModal({ boardMembers: members })
    await waitFor(() => {
      expect(screen.getByText('Manage members')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Manage members'))
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })
  })
})
