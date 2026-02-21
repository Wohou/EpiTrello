/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ThemeProvider, useTheme } from '../lib/theme-context'

const mockGetUser = jest.fn()
const mockUpdateUser = jest.fn()

jest.mock('../lib/supabase-browser', () => ({
  supabaseBrowser: {
    auth: {
      getUser: () => mockGetUser(),
      updateUser: (...args: any[]) => mockUpdateUser(...args),
    },
  },
}))

function TestConsumer() {
  const { currentTheme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{currentTheme}</span>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('purple')}>Set Purple</button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: null } })
    mockUpdateUser.mockResolvedValue({})
  })

  it('should provide default theme', async () => {
    await act(async () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId('theme').textContent).toBe('default')
  })

  it('should change theme', async () => {
    await act(async () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Set Dark'))
    })

    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  it('should apply CSS variables when theme changes', async () => {
    await act(async () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Set Purple'))
    })

    const root = document.documentElement
    expect(root.style.getPropertyValue('--primary-color')).toBe('#0b8793')
  })

  it('should save theme to user metadata', async () => {
    await act(async () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Set Dark'))
    })

    expect(mockUpdateUser).toHaveBeenCalledWith({ data: { theme: 'dark' } })
  })

  it('should load theme from user metadata', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { user_metadata: { theme: 'sunset' } } },
    })

    await act(async () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId('theme').textContent).toBe('sunset')
  })

  it('should throw error when useTheme is used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => {
      render(<TestConsumer />)
    }).toThrow('useTheme must be used within a ThemeProvider')
    spy.mockRestore()
  })

  it('should handle error when saving theme', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockUpdateUser.mockRejectedValue(new Error('Save failed'))

    await act(async () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Set Dark'))
    })

    expect(screen.getByTestId('theme').textContent).toBe('dark')
    spy.mockRestore()
  })
})
