import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import CreateListButton from '../components/CreateListButton'

describe('CreateListButton', () => {
  let mockOnCreate: jest.Mock

  beforeEach(() => {
    mockOnCreate = jest.fn()
  })

  describe('Initial render', () => {
    it('should render the add list button initially', () => {
      render(<CreateListButton onCreate={mockOnCreate} />)

      const button = screen.getByRole('button', { name: /add another list/i })
      expect(button).toBeInTheDocument()
    })

    it('should not display the form initially', () => {
      render(<CreateListButton onCreate={mockOnCreate} />)

      expect(screen.queryByPlaceholderText(/enter list title/i)).not.toBeInTheDocument()
    })
  })

  describe('Opening the form', () => {
    it('should show the form when clicking the add button', () => {
      render(<CreateListButton onCreate={mockOnCreate} />)

      const addButton = screen.getByRole('button', { name: /add another list/i })
      fireEvent.click(addButton)

      expect(screen.getByPlaceholderText(/enter list title/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add list/i })).toBeInTheDocument()
    })

    it('should focus the input when form opens', () => {
      render(<CreateListButton onCreate={mockOnCreate} />)

      const addButton = screen.getByRole('button', { name: /add another list/i })
      fireEvent.click(addButton)

      const input = screen.getByPlaceholderText(/enter list title/i)
      expect(input).toHaveFocus()
    })

    it('should hide the initial button when form is open', () => {
      render(<CreateListButton onCreate={mockOnCreate} />)

      const addButton = screen.getByRole('button', { name: /add another list/i })
      fireEvent.click(addButton)

      expect(screen.queryByRole('button', { name: /add another list/i })).not.toBeInTheDocument()
    })
  })

  describe('User input', () => {
    it('should update input value when user types', () => {
      render(<CreateListButton onCreate={mockOnCreate} />)

      fireEvent.click(screen.getByRole('button', { name: /add another list/i }))

      const input = screen.getByPlaceholderText(/enter list title/i) as HTMLInputElement
      fireEvent.change(input, { target: { value: 'New List' } })

      expect(input.value).toBe('New List')
    })

    it('should handle empty input', () => {
      render(<CreateListButton onCreate={mockOnCreate} />)

      fireEvent.click(screen.getByRole('button', { name: /add another list/i }))

      const input = screen.getByPlaceholderText(/enter list title/i) as HTMLInputElement
      expect(input.value).toBe('')
    })
  })

  describe('Creating a list', () => {
    it('should call onCreate with trimmed title when clicking Add List button', () => {
      render(<CreateListButton onCreate={mockOnCreate} />)

      fireEvent.click(screen.getByRole('button', { name: /add another list/i }))

      const input = screen.getByPlaceholderText(/enter list title/i)
      fireEvent.change(input, { target: { value: '  My List  ' } })

      const addButton = screen.getByRole('button', { name: /add list/i })
      fireEvent.click(addButton)

      expect(mockOnCreate).toHaveBeenCalledWith('  My List  ')
      expect(mockOnCreate).toHaveBeenCalledTimes(1)
    })

    it('should call onCreate when pressing Enter key', () => {
      render(<CreateListButton onCreate={mockOnCreate} />)

      fireEvent.click(screen.getByRole('button', { name: /add another list/i }))

      const input = screen.getByPlaceholderText(/enter list title/i)
      fireEvent.change(input, { target: { value: 'Quick List' } })
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })

      expect(mockOnCreate).toHaveBeenCalledWith('Quick List')
      expect(mockOnCreate).toHaveBeenCalledTimes(1)
    })

    it('should not call onCreate when pressing other keys', () => {
      render(<CreateListButton onCreate={mockOnCreate} />)

      fireEvent.click(screen.getByRole('button', { name: /add another list/i }))

      const input = screen.getByPlaceholderText(/enter list title/i)
      fireEvent.change(input, { target: { value: 'Test' } })
      fireEvent.keyPress(input, { key: 'a', code: 'KeyA' })

      expect(mockOnCreate).not.toHaveBeenCalled()
    })

    it('should reset form and close after successful creation', () => {
      render(<CreateListButton onCreate={mockOnCreate} />)

      fireEvent.click(screen.getByRole('button', { name: /add another list/i }))

      const input = screen.getByPlaceholderText(/enter list title/i)
      fireEvent.change(input, { target: { value: 'Test List' } })

      fireEvent.click(screen.getByRole('button', { name: /add list/i }))

      expect(screen.queryByPlaceholderText(/enter list title/i)).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add another list/i })).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('should not call onCreate with empty title', () => {
      render(<CreateListButton onCreate={mockOnCreate} />)

      fireEvent.click(screen.getByRole('button', { name: /add another list/i }))

      const addButton = screen.getByRole('button', { name: /add list/i })
      fireEvent.click(addButton)

      expect(mockOnCreate).not.toHaveBeenCalled()
    })

    it('should not call onCreate with only whitespace', () => {
      render(<CreateListButton onCreate={mockOnCreate} />)

      fireEvent.click(screen.getByRole('button', { name: /add another list/i }))

      const input = screen.getByPlaceholderText(/enter list title/i)
      fireEvent.change(input, { target: { value: '   ' } })

      fireEvent.click(screen.getByRole('button', { name: /add list/i }))

      expect(mockOnCreate).not.toHaveBeenCalled()
    })

    it('should not call onCreate when pressing Enter with empty input', () => {
      render(<CreateListButton onCreate={mockOnCreate} />)

      fireEvent.click(screen.getByRole('button', { name: /add another list/i }))

      const input = screen.getByPlaceholderText(/enter list title/i)
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })

      expect(mockOnCreate).not.toHaveBeenCalled()
    })
  })

  describe('Canceling', () => {
    it('should close form when clicking cancel button', () => {
      render(<CreateListButton onCreate={mockOnCreate} />)

      fireEvent.click(screen.getByRole('button', { name: /add another list/i }))

      const cancelButton = screen.getByRole('button', { name: '×' })
      fireEvent.click(cancelButton)

      expect(screen.queryByPlaceholderText(/enter list title/i)).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add another list/i })).toBeInTheDocument()
    })

    it('should not call onCreate when canceling', () => {
      render(<CreateListButton onCreate={mockOnCreate} />)

      fireEvent.click(screen.getByRole('button', { name: /add another list/i }))

      const input = screen.getByPlaceholderText(/enter list title/i)
      fireEvent.change(input, { target: { value: 'Not saved' } })

      const cancelButton = screen.getByRole('button', { name: '×' })
      fireEvent.click(cancelButton)

      expect(mockOnCreate).not.toHaveBeenCalled()
    })

    it('should clear input when reopening after cancel', () => {
      render(<CreateListButton onCreate={mockOnCreate} />)

      // Open, type, cancel
      fireEvent.click(screen.getByRole('button', { name: /add another list/i }))
      const input1 = screen.getByPlaceholderText(/enter list title/i)
      fireEvent.change(input1, { target: { value: 'Test' } })
      fireEvent.click(screen.getByRole('button', { name: '×' }))

      // Reopen
      fireEvent.click(screen.getByRole('button', { name: /add another list/i }))
      const input2 = screen.getByPlaceholderText(/enter list title/i) as HTMLInputElement

      expect(input2.value).toBe('')
    })
  })

  describe('Multiple interactions', () => {
    it('should allow creating multiple lists in sequence', () => {
      render(<CreateListButton onCreate={mockOnCreate} />)

      // First list
      fireEvent.click(screen.getByRole('button', { name: /add another list/i }))
      fireEvent.change(screen.getByPlaceholderText(/enter list title/i), {
        target: { value: 'List 1' }
      })
      fireEvent.click(screen.getByRole('button', { name: /add list/i }))

      // Second list
      fireEvent.click(screen.getByRole('button', { name: /add another list/i }))
      fireEvent.change(screen.getByPlaceholderText(/enter list title/i), {
        target: { value: 'List 2' }
      })
      fireEvent.click(screen.getByRole('button', { name: /add list/i }))

      expect(mockOnCreate).toHaveBeenCalledTimes(2)
      expect(mockOnCreate).toHaveBeenNthCalledWith(1, 'List 1')
      expect(mockOnCreate).toHaveBeenNthCalledWith(2, 'List 2')
    })
  })
})
