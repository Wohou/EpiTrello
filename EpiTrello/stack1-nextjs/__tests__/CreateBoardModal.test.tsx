import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import CreateBoardModal from '../components/CreateBoardModal'
import { useLanguage } from '../lib/language-context'

// Mock the language context
jest.mock('../lib/language-context', () => ({
  useLanguage: jest.fn(),
}))

describe('CreateBoardModal', () => {
  let mockOnClose: jest.Mock
  let mockOnCreate: jest.Mock

  const mockTranslations = {
    boards: {
      createNewBoard: 'Create New Board',
      boardTitle: 'Board Title',
      boardTitlePlaceholder: 'Board Title',
      boardDescription: 'Description (optional)',
      boardDescriptionPlaceholder: 'Description (optional)',
    },
    common: {
      create: 'Create',
      cancel: 'Cancel',
    },
  }

  beforeEach(() => {
    mockOnClose = jest.fn()
    mockOnCreate = jest.fn()

    ;(useLanguage as jest.Mock).mockReturnValue({ t: mockTranslations })
  })

  describe('Modal rendering', () => {
    it('should render without crashing', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      expect(screen.getByText('Create New Board')).toBeInTheDocument()
    })

    it('should display all form labels', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      expect(screen.getByText('Board Title')).toBeInTheDocument()
      expect(screen.getByText('Description (optional)')).toBeInTheDocument()
    })

    it('should render title input field', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title')
      expect(titleInput).toBeInTheDocument()
      expect(titleInput).toHaveAttribute('type', 'text')
    })

    it('should render description textarea', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const descriptionInput = screen.getByPlaceholderText('Description (optional)')
      expect(descriptionInput).toBeInTheDocument()
      expect(descriptionInput.tagName).toBe('TEXTAREA')
    })

    it('should render create button', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const createButton = screen.getByRole('button', { name: 'Create' })
      expect(createButton).toBeInTheDocument()
    })

    it('should render cancel button', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      expect(cancelButton).toBeInTheDocument()
    })

    it('should initially focus on title input', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title')
      expect(titleInput).toHaveFocus()
    })
  })

  describe('Form input handling', () => {
    it('should update title value when typing', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title') as HTMLInputElement
      fireEvent.change(titleInput, { target: { value: 'My New Board' } })

      expect(titleInput.value).toBe('My New Board')
    })

    it('should update description value when typing', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const descriptionInput = screen.getByPlaceholderText('Description (optional)') as HTMLTextAreaElement
      fireEvent.change(descriptionInput, { target: { value: 'This is a test description' } })

      expect(descriptionInput.value).toBe('This is a test description')
    })

    it('should allow typing in both fields independently', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title') as HTMLInputElement
      const descriptionInput = screen.getByPlaceholderText('Description (optional)') as HTMLTextAreaElement

      fireEvent.change(titleInput, { target: { value: 'Title' } })
      fireEvent.change(descriptionInput, { target: { value: 'Description' } })

      expect(titleInput.value).toBe('Title')
      expect(descriptionInput.value).toBe('Description')
    })

    it('should handle special characters in inputs', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title') as HTMLInputElement
      const specialChars = '<>&"\''

      fireEvent.change(titleInput, { target: { value: specialChars } })
      expect(titleInput.value).toBe(specialChars)
    })

    it('should handle very long text in title', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title') as HTMLInputElement
      const longText = 'A'.repeat(500)

      fireEvent.change(titleInput, { target: { value: longText } })
      expect(titleInput.value).toBe(longText)
    })

    it('should handle multiline text in description', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const descriptionInput = screen.getByPlaceholderText('Description (optional)') as HTMLTextAreaElement
      const multilineText = 'Line 1\nLine 2\nLine 3'

      fireEvent.change(descriptionInput, { target: { value: multilineText } })
      expect(descriptionInput.value).toBe(multilineText)
    })
  })

  describe('Submit button state', () => {
    it('should disable submit button when title is empty', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const createButton = screen.getByRole('button', { name: 'Create' })
      expect(createButton).toBeDisabled()
    })

    it('should enable submit button when title is not empty', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title')
      fireEvent.change(titleInput, { target: { value: 'Valid Title' } })

      const createButton = screen.getByRole('button', { name: 'Create' })
      expect(createButton).not.toBeDisabled()
    })

    it('should disable submit button for whitespace-only title', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title')
      fireEvent.change(titleInput, { target: { value: '   ' } })

      const createButton = screen.getByRole('button', { name: 'Create' })
      expect(createButton).toBeDisabled()
    })

    it('should enable submit button with title but no description', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title')
      fireEvent.change(titleInput, { target: { value: 'Title Only' } })

      const createButton = screen.getByRole('button', { name: 'Create' })
      expect(createButton).not.toBeDisabled()
    })

    it('should update button state dynamically as user types', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title')
      const createButton = screen.getByRole('button', { name: 'Create' })

      expect(createButton).toBeDisabled()

      fireEvent.change(titleInput, { target: { value: 'T' } })
      expect(createButton).not.toBeDisabled()

      fireEvent.change(titleInput, { target: { value: '' } })
      expect(createButton).toBeDisabled()
    })
  })

  describe('Form submission', () => {
    it('should call onCreate with title only when submitting without description', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title')
      fireEvent.change(titleInput, { target: { value: 'Test Board' } })

      const createButton = screen.getByRole('button', { name: 'Create' })
      fireEvent.click(createButton)

      expect(mockOnCreate).toHaveBeenCalledWith('Test Board', '')
      expect(mockOnCreate).toHaveBeenCalledTimes(1)
    })

    it('should call onCreate with both title and description', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title')
      const descriptionInput = screen.getByPlaceholderText('Description (optional)')

      fireEvent.change(titleInput, { target: { value: 'Test Board' } })
      fireEvent.change(descriptionInput, { target: { value: 'Test Description' } })

      const createButton = screen.getByRole('button', { name: 'Create' })
      fireEvent.click(createButton)

      expect(mockOnCreate).toHaveBeenCalledWith('Test Board', 'Test Description')
    })

    it('should submit form with Enter key in title field', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title')
      fireEvent.change(titleInput, { target: { value: 'Enter Board' } })

      // Submit the form (Enter key on input inside form triggers submit)
      const form = titleInput.closest('form')!
      fireEvent.submit(form)

      expect(mockOnCreate).toHaveBeenCalledWith('Enter Board', '')
    })

    it('should not submit with Enter key when title is empty', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title')
      fireEvent.keyDown(titleInput, { key: 'Enter', code: 'Enter' })

      expect(mockOnCreate).not.toHaveBeenCalled()
    })

    it('should handle Enter in description without submitting', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title')
      const descriptionInput = screen.getByPlaceholderText('Description (optional)')

      fireEvent.change(titleInput, { target: { value: 'Test' } })
      // Enter in textarea shouldn't submit form (it creates new line)
      fireEvent.keyDown(descriptionInput, { key: 'Enter', code: 'Enter' })

      expect(mockOnCreate).not.toHaveBeenCalled()
    })

    it('should trim whitespace from title before submission', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title')
      fireEvent.change(titleInput, { target: { value: '  Trimmed Board  ' } })

      const createButton = screen.getByRole('button', { name: 'Create' })
      fireEvent.click(createButton)

      expect(mockOnCreate).toHaveBeenCalledWith('  Trimmed Board  ', '')
    })
  })

  describe('Modal close interactions', () => {
    it('should call onClose when cancel button is clicked', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      fireEvent.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when clicking outside modal content', () => {
      const { container } = render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const overlay = container.querySelector('.modal-overlay')
      fireEvent.click(overlay!)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should not close when clicking inside modal content', () => {
      const { container } = render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const modalContent = container.querySelector('.modal-content')
      fireEvent.click(modalContent!)

      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Translation integration', () => {
    it('should use translated modal title', () => {
      const customTranslations = {
        boards: {
          createNewBoard: 'Créer un nouveau tableau',
          boardTitle: 'Board Title',
          boardTitlePlaceholder: 'Board Title',
          boardDescription: 'Description',
          boardDescriptionPlaceholder: 'Description',
        },
        common: { create: 'Create', cancel: 'Cancel' },
      }
      ;(useLanguage as jest.Mock).mockReturnValue({ t: customTranslations })

      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      expect(screen.getByText('Créer un nouveau tableau')).toBeInTheDocument()
    })

    it('should use translated button labels', () => {
      const customTranslations = {
        boards: {
          createNewBoard: 'Create New Board',
          boardTitle: 'Board Title',
          boardTitlePlaceholder: 'Board Title',
          boardDescription: 'Description',
          boardDescriptionPlaceholder: 'Description',
        },
        common: {
          create: 'Erstellen',
          cancel: 'Abbrechen',
        },
      }
      ;(useLanguage as jest.Mock).mockReturnValue({ t: customTranslations })

      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      expect(screen.getByRole('button', { name: 'Erstellen' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeInTheDocument()
    })

    it('should use translated placeholder texts', () => {
      const customTranslations = {
        boards: {
          createNewBoard: 'Create Board',
          boardTitle: 'Board Title',
          boardTitlePlaceholder: 'Titre du tableau',
          boardDescription: 'Description',
          boardDescriptionPlaceholder: 'Description (optionnelle)',
        },
        common: { create: 'Create', cancel: 'Cancel' },
      }
      ;(useLanguage as jest.Mock).mockReturnValue({ t: customTranslations })

      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      expect(screen.getByPlaceholderText('Titre du tableau')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Description (optionnelle)')).toBeInTheDocument()
    })
  })

  describe('Form reset and state management', () => {
    it('should clear inputs after successful creation', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title') as HTMLInputElement
      const descriptionInput = screen.getByPlaceholderText('Description (optional)') as HTMLTextAreaElement

      fireEvent.change(titleInput, { target: { value: 'Board 1' } })
      fireEvent.change(descriptionInput, { target: { value: 'Desc 1' } })

      const createButton = screen.getByRole('button', { name: 'Create' })
      fireEvent.click(createButton)

      expect(titleInput.value).toBe('')
      expect(descriptionInput.value).toBe('')
    })

    it('should maintain inputs when canceling', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title') as HTMLInputElement
      fireEvent.change(titleInput, { target: { value: 'Unsaved Board' } })

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      fireEvent.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should allow creating multiple boards sequentially', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title')
      const createButton = screen.getByRole('button', { name: 'Create' })

      fireEvent.change(titleInput, { target: { value: 'Board 1' } })
      fireEvent.click(createButton)

      fireEvent.change(titleInput, { target: { value: 'Board 2' } })
      fireEvent.click(createButton)

      expect(mockOnCreate).toHaveBeenCalledTimes(2)
      expect(mockOnCreate).toHaveBeenNthCalledWith(1, 'Board 1', '')
      expect(mockOnCreate).toHaveBeenNthCalledWith(2, 'Board 2', '')
    })
  })

  describe('Component structure', () => {
    it('should have modal-overlay class on container', () => {
      const { container } = render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      expect(container.querySelector('.modal-overlay')).toBeInTheDocument()
    })

    it('should have modal-content wrapper', () => {
      const { container } = render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      expect(container.querySelector('.modal-content')).toBeInTheDocument()
    })

    it('should render title as h2 heading', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const heading = screen.getByRole('heading', { name: 'Create New Board' })
      expect(heading).toBeInTheDocument()
      expect(heading.tagName).toBe('H2')
    })

    it('should have form-group wrappers for inputs', () => {
      const { container } = render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const formGroups = container.querySelectorAll('.form-group')
      expect(formGroups.length).toBeGreaterThanOrEqual(2)
    })

    it('should have modal-actions container for buttons', () => {
      const { container } = render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      expect(container.querySelector('.modal-actions')).toBeInTheDocument()
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle rapid button clicks', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title')
      fireEvent.change(titleInput, { target: { value: 'Rapid Board' } })

      const createButton = screen.getByRole('button', { name: 'Create' })
      fireEvent.click(createButton)
      fireEvent.click(createButton)
      fireEvent.click(createButton)

      expect(mockOnCreate).toHaveBeenCalledTimes(1)
    })

    it('should handle empty string description same as no description', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title')
      const descriptionInput = screen.getByPlaceholderText('Description (optional)')

      fireEvent.change(titleInput, { target: { value: 'Test' } })
      fireEvent.change(descriptionInput, { target: { value: '' } })

      const createButton = screen.getByRole('button', { name: 'Create' })
      fireEvent.click(createButton)

      expect(mockOnCreate).toHaveBeenCalledWith('Test', '')
    })

    it('should handle emoji in title and description', () => {
      render(<CreateBoardModal onClose={mockOnClose} onCreate={mockOnCreate} />)

      const titleInput = screen.getByPlaceholderText('Board Title')
      const descriptionInput = screen.getByPlaceholderText('Description (optional)')

      fireEvent.change(titleInput, { target: { value: '🚀 Rocket Board 🚀' } })
      fireEvent.change(descriptionInput, { target: { value: '✨ Amazing ✨' } })

      const createButton = screen.getByRole('button', { name: 'Create' })
      fireEvent.click(createButton)

      expect(mockOnCreate).toHaveBeenCalledWith('🚀 Rocket Board 🚀', '✨ Amazing ✨')
    })
  })
})
