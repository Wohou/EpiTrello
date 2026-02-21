/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ListColumn from '../components/ListColumn'
import { useLanguage } from '../lib/language-context'
import { useNotification } from '../components/NotificationContext'

jest.mock('../lib/language-context', () => ({
  useLanguage: jest.fn(),
}))

const mockConfirm = jest.fn()
jest.mock('../components/NotificationContext', () => ({
  useNotification: jest.fn(),
}))

// Mock @hello-pangea/dnd
jest.mock('@hello-pangea/dnd', () => ({
  Droppable: ({ children }: any) => children({
    innerRef: jest.fn(),
    droppableProps: {},
    placeholder: null,
  }, { isDraggingOver: false }),
  Draggable: ({ children }: any) => children({
    innerRef: jest.fn(),
    draggableProps: {},
    dragHandleProps: {},
  }, { isDragging: false }),
}))

// Mock CardItem to simplify testing
jest.mock('../components/CardItem', () => ({
  __esModule: true,
  default: ({ card, onDelete }: any) => (
    <div data-testid={`card-${card.id}`}>
      <span>{card.title}</span>
      <button onClick={onDelete}>Delete Card</button>
    </div>
  ),
}))

const mockTranslations = {
  common: {
    cancel: 'Cancel',
    delete: 'Delete',
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
    titlePlaceholder: 'Card title',
    descriptionOptional: 'Description (optional)',
  },
}

describe('ListColumn', () => {
  let mockOnDeleteList: jest.Mock
  let mockOnUpdateList: jest.Mock
  let mockOnCreateCard: jest.Mock
  let mockOnDeleteCard: jest.Mock
  let mockOnUpdateCard: jest.Mock

  const mockList = {
    id: 'list-1',
    title: 'Todo',
    position: 0,
    board_id: 'b-1',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    cards: [
      {
        id: 'card-1', title: 'Task 1', description: null, position: 0, list_id: 'list-1',
        cover_color: null, cover_image: null, is_completed: false,
        start_date: null, due_date: null, created_by: null, last_modified_by: null,
        created_at: '2024-01-01', updated_at: '2024-01-01',
      },
      {
        id: 'card-2', title: 'Task 2', description: 'Desc', position: 1, list_id: 'list-1',
        cover_color: '#ff0000', cover_image: null, is_completed: false,
        start_date: null, due_date: null, created_by: null, last_modified_by: null,
        created_at: '2024-01-01', updated_at: '2024-01-01',
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnDeleteList = jest.fn()
    mockOnUpdateList = jest.fn()
    mockOnCreateCard = jest.fn()
    mockOnDeleteCard = jest.fn()
    mockOnUpdateCard = jest.fn()
    mockConfirm.mockResolvedValue(true)
    ;(useLanguage as jest.Mock).mockReturnValue({ t: mockTranslations })
    ;(useNotification as jest.Mock).mockReturnValue({ confirm: mockConfirm })
  })

  const renderList = (props = {}) => render(
    <ListColumn
      list={mockList}
      onDeleteList={mockOnDeleteList}
      onUpdateList={mockOnUpdateList}
      onCreateCard={mockOnCreateCard}
      onDeleteCard={mockOnDeleteCard}
      onUpdateCard={mockOnUpdateCard}
      {...props}
    />
  )

  it('should render list title', () => {
    renderList()
    expect(screen.getByText('Todo')).toBeInTheDocument()
  })

  it('should render all cards', () => {
    renderList()
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
  })

  it('should show add card button', () => {
    renderList()
    expect(screen.getByText(/Add card/)).toBeInTheDocument()
  })

  it('should open add card form', () => {
    renderList()
    fireEvent.click(screen.getByText(/Add card/))

    expect(screen.getByPlaceholderText('Card title')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Description (optional)')).toBeInTheDocument()
  })

  it('should create a card', () => {
    renderList()
    fireEvent.click(screen.getByText(/Add card/))

    fireEvent.change(screen.getByPlaceholderText('Card title'), { target: { value: 'New Card' } })
    fireEvent.change(screen.getByPlaceholderText('Description (optional)'), { target: { value: 'Description' } })

    const addButton = screen.getByRole('button', { name: 'Add card' })
    fireEvent.click(addButton)

    expect(mockOnCreateCard).toHaveBeenCalledWith('New Card', 'Description')
  })

  it('should not create card with empty title', () => {
    renderList()
    fireEvent.click(screen.getByText(/Add card/))

    const addButton = screen.getByRole('button', { name: 'Add card' })
    fireEvent.click(addButton)

    expect(mockOnCreateCard).not.toHaveBeenCalled()
  })

  it('should cancel add card', () => {
    renderList()
    fireEvent.click(screen.getByText(/Add card/))
    expect(screen.getByPlaceholderText('Card title')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByPlaceholderText('Card title')).not.toBeInTheDocument()
  })

  it('should call onDeleteList after confirm', async () => {
    renderList()
    const deleteButton = screen.getByText('×')
    fireEvent.click(deleteButton)

    expect(mockConfirm).toHaveBeenCalledWith(expect.objectContaining({
      variant: 'danger',
    }))

    await new Promise(resolve => setTimeout(resolve, 0))
    expect(mockOnDeleteList).toHaveBeenCalled()
  })

  it('should not delete list when confirm cancelled', async () => {
    mockConfirm.mockResolvedValue(false)
    renderList()
    fireEvent.click(screen.getByText('×'))

    await new Promise(resolve => setTimeout(resolve, 0))
    expect(mockOnDeleteList).not.toHaveBeenCalled()
  })

  it('should allow editing list title', () => {
    renderList()
    const title = screen.getByText('Todo')
    fireEvent.doubleClick(title)

    const input = screen.getByDisplayValue('Todo')
    expect(input).toBeInTheDocument()
  })

  it('should save edited title on Enter', () => {
    renderList()
    fireEvent.doubleClick(screen.getByText('Todo'))

    const input = screen.getByDisplayValue('Todo')
    fireEvent.change(input, { target: { value: 'Done' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockOnUpdateList).toHaveBeenCalledWith('list-1', 'Done')
  })

  it('should save edited title on checkmark click', () => {
    renderList()
    fireEvent.doubleClick(screen.getByText('Todo'))

    const input = screen.getByDisplayValue('Todo')
    fireEvent.change(input, { target: { value: 'Updated' } })

    const saveButton = screen.getByText('✓')
    fireEvent.click(saveButton)

    expect(mockOnUpdateList).toHaveBeenCalledWith('list-1', 'Updated')
  })

  it('should cancel editing on X button click', () => {
    renderList()
    fireEvent.doubleClick(screen.getByText('Todo'))

    const cancelButton = screen.getByText('✕')
    fireEvent.click(cancelButton)

    expect(screen.getByText('Todo')).toBeInTheDocument()
    expect(mockOnUpdateList).not.toHaveBeenCalled()
  })

  it('should handle card deletion', () => {
    renderList()
    const deleteButtons = screen.getAllByText('Delete Card')
    fireEvent.click(deleteButtons[0])

    expect(mockOnDeleteCard).toHaveBeenCalledWith('card-1')
  })
})
