import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import BoardCard from '../components/BoardCard'
import { useLanguage } from '../lib/language-context'
import type { Board } from '../lib/supabase'

// Mock the language context
jest.mock('../lib/language-context', () => ({
  useLanguage: jest.fn(),
}))

describe('BoardCard', () => {
  let mockOnClick: jest.Mock
  let mockOnDelete: jest.Mock
  let mockConfirm: jest.SpyInstance

  const mockBoard: Board = {
    id: 'board-1',
    title: 'Test Board',
    description: 'Test Description',
    owner_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_shared: false,
    owner_username: null,
  }

  const mockTranslations = {
    boards: {
      deleteConfirm: 'Are you sure you want to delete this board?',
    },
    sharing: {
      sharedBy: 'Shared by {name}',
    },
  }

  beforeEach(() => {
    mockOnClick = jest.fn()
    mockOnDelete = jest.fn()
    mockConfirm = jest.spyOn(window, 'confirm')

    ;(useLanguage as jest.Mock).mockReturnValue({ t: mockTranslations })
  })

  afterEach(() => {
    mockConfirm.mockRestore()
  })

  describe('Basic rendering', () => {
    it('should render without crashing', () => {
      render(<BoardCard board={mockBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      expect(screen.getByText('Test Board')).toBeInTheDocument()
    })

    it('should display board title', () => {
      render(<BoardCard board={mockBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      expect(screen.getByText('Test Board')).toBeInTheDocument()
    })

    it('should display board description when provided', () => {
      render(<BoardCard board={mockBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      expect(screen.getByText('Test Description')).toBeInTheDocument()
    })

    it('should not display description when not provided', () => {
      const boardWithoutDescription = { ...mockBoard, description: null }
      render(<BoardCard board={boardWithoutDescription} onClick={mockOnClick} onDelete={mockOnDelete} />)

      expect(screen.queryByText('Test Description')).not.toBeInTheDocument()
    })
  })

  describe('Click interactions', () => {
    it('should call onClick when card is clicked', () => {
      render(<BoardCard board={mockBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      const card = screen.getByText('Test Board').closest('.board-card')
      fireEvent.click(card!)

      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('should call onClick when clicking on description', () => {
      render(<BoardCard board={mockBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      const description = screen.getByText('Test Description')
      fireEvent.click(description)

      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('should allow multiple clicks', () => {
      render(<BoardCard board={mockBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      const card = screen.getByText('Test Board').closest('.board-card')
      fireEvent.click(card!)
      fireEvent.click(card!)
      fireEvent.click(card!)

      expect(mockOnClick).toHaveBeenCalledTimes(3)
    })
  })

  describe('Delete functionality for owned boards', () => {
    it('should show delete button for non-shared boards', () => {
      render(<BoardCard board={mockBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      const deleteButton = screen.getByRole('button', { name: '×' })
      expect(deleteButton).toBeInTheDocument()
    })

    it('should show confirmation dialog when clicking delete', () => {
      mockConfirm.mockReturnValue(true)
      render(<BoardCard board={mockBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      const deleteButton = screen.getByRole('button', { name: '×' })
      fireEvent.click(deleteButton)

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this board?')
    })

    it('should call onDelete when user confirms deletion', () => {
      mockConfirm.mockReturnValue(true)
      render(<BoardCard board={mockBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      const deleteButton = screen.getByRole('button', { name: '×' })
      fireEvent.click(deleteButton)

      expect(mockOnDelete).toHaveBeenCalledTimes(1)
    })

    it('should not call onDelete when user cancels deletion', () => {
      mockConfirm.mockReturnValue(false)
      render(<BoardCard board={mockBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      const deleteButton = screen.getByRole('button', { name: '×' })
      fireEvent.click(deleteButton)

      expect(mockOnDelete).not.toHaveBeenCalled()
    })

    it('should not trigger onClick when clicking delete button', () => {
      mockConfirm.mockReturnValue(true)
      render(<BoardCard board={mockBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      const deleteButton = screen.getByRole('button', { name: '×' })
      fireEvent.click(deleteButton)

      expect(mockOnClick).not.toHaveBeenCalled()
    })
  })

  describe('Shared board display', () => {
    const sharedBoard: Board = {
      ...mockBoard,
      is_shared: true,
      owner_username: 'john_doe',
    }

    it('should not show delete button for shared boards', () => {
      render(<BoardCard board={sharedBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      expect(screen.queryByRole('button', { name: '×' })).not.toBeInTheDocument()
    })

    it('should display shared indicator with owner name', () => {
      render(<BoardCard board={sharedBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      expect(screen.getByText(/shared by john_doe/i)).toBeInTheDocument()
    })

    it('should show shared icon', () => {
      render(<BoardCard board={sharedBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      const sharedIcon = screen.getByText('👥')
      expect(sharedIcon).toBeInTheDocument()
    })

    it('should not display shared info when is_shared is true but owner_username is missing', () => {
      const incompleteBoardData = { ...mockBoard, is_shared: true, owner_username: null }
      render(<BoardCard board={incompleteBoardData} onClick={mockOnClick} onDelete={mockOnDelete} />)

      expect(screen.queryByText('👥')).not.toBeInTheDocument()
    })

    it('should still be clickable when shared', () => {
      render(<BoardCard board={sharedBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      const card = screen.getByText('Test Board').closest('.board-card')
      fireEvent.click(card!)

      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Translation integration', () => {
    it('should use translated confirmation message', () => {
      const customTranslations = {
        boards: { deleteConfirm: 'Voulez-vous vraiment supprimer ce tableau ?' },
        sharing: { sharedBy: 'Shared by {name}' },
      }
      ;(useLanguage as jest.Mock).mockReturnValue({ t: customTranslations })
      mockConfirm.mockReturnValue(true)

      render(<BoardCard board={mockBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      const deleteButton = screen.getByRole('button', { name: '×' })
      fireEvent.click(deleteButton)

      expect(mockConfirm).toHaveBeenCalledWith('Voulez-vous vraiment supprimer ce tableau ?')
    })

    it('should use translated shared by text with placeholder replacement', () => {
      const customTranslations = {
        boards: { deleteConfirm: 'Delete?' },
        sharing: { sharedBy: 'Partagé par {name}' },
      }
      ;(useLanguage as jest.Mock).mockReturnValue({ t: customTranslations })

      const sharedBoard: Board = {
        ...mockBoard,
        is_shared: true,
        owner_username: 'alice',
      }

      render(<BoardCard board={sharedBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      expect(screen.getByText('Partagé par alice')).toBeInTheDocument()
    })

    it('should handle missing translation gracefully', () => {
      const incompleteTranslations = {
        boards: { deleteConfirm: 'Delete?' },
        sharing: {},
      }
      ;(useLanguage as jest.Mock).mockReturnValue({ t: incompleteTranslations })

      const sharedBoard: Board = {
        ...mockBoard,
        is_shared: true,
        owner_username: 'bob',
      }

      render(<BoardCard board={sharedBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      // Should use fallback text from component
      expect(screen.getByText(/partagé par bob/i)).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('should handle board with empty title', () => {
      const boardWithEmptyTitle = { ...mockBoard, title: '' }
      render(<BoardCard board={boardWithEmptyTitle} onClick={mockOnClick} onDelete={mockOnDelete} />)

      const card = screen.getByRole('button', { name: '×' }).closest('.board-card')
      expect(card).toBeInTheDocument()
    })

    it('should handle board with empty description', () => {
      const boardWithEmptyDesc = { ...mockBoard, description: '' }
      render(<BoardCard board={boardWithEmptyDesc} onClick={mockOnClick} onDelete={mockOnDelete} />)

      const card = screen.getByText('Test Board').closest('.board-card')
      expect(card).toBeInTheDocument()
      // Empty description should not render a paragraph tag
      const paragraphs = card!.querySelectorAll('p')
      expect(paragraphs.length).toBe(0)
    })

    it('should handle very long board title', () => {
      const longTitle = 'A'.repeat(200)
      const boardWithLongTitle = { ...mockBoard, title: longTitle }
      render(<BoardCard board={boardWithLongTitle} onClick={mockOnClick} onDelete={mockOnDelete} />)

      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('should handle special characters in board title', () => {
      const specialTitle = '<script>alert("xss")</script>'
      const boardWithSpecialChars = { ...mockBoard, title: specialTitle }
      render(<BoardCard board={boardWithSpecialChars} onClick={mockOnClick} onDelete={mockOnDelete} />)

      expect(screen.getByText(specialTitle)).toBeInTheDocument()
    })

    it('should handle special characters in owner username', () => {
      const sharedBoard: Board = {
        ...mockBoard,
        is_shared: true,
        owner_username: "user<>@'\"&",
      }
      render(<BoardCard board={sharedBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      expect(screen.getByText(/user<>@'"&/)).toBeInTheDocument()
    })
  })

  describe('Component structure', () => {
    it('should have correct CSS class on main container', () => {
      const { container } = render(<BoardCard board={mockBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      expect(container.querySelector('.board-card')).toBeInTheDocument()
    })

    it('should have board-card-content wrapper', () => {
      const { container } = render(<BoardCard board={mockBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      expect(container.querySelector('.board-card-content')).toBeInTheDocument()
    })

    it('should render title inside heading element', () => {
      render(<BoardCard board={mockBoard} onClick={mockOnClick} onDelete={mockOnDelete} />)

      const heading = screen.getByRole('heading', { name: 'Test Board' })
      expect(heading).toBeInTheDocument()
      expect(heading.tagName).toBe('H3')
    })
  })
})
