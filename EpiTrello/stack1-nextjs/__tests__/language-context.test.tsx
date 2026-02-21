/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LanguageProvider, useLanguage } from '../lib/language-context'

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
  const { language, setLanguage, t } = useLanguage()
  return (
    <div>
      <span data-testid="lang">{language}</span>
      <span data-testid="loading-text">{t.common.loading}</span>
      <button onClick={() => setLanguage('en')}>Set English</button>
      <button onClick={() => setLanguage('fr')}>Set French</button>
    </div>
  )
}

describe('LanguageContext', () => {
  const originalLanguage = navigator.language

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: null } })
    mockUpdateUser.mockResolvedValue({})
    // Default jsdom navigator.language is 'en' which triggers browser detection
    Object.defineProperty(navigator, 'language', { value: 'fr-FR', writable: true, configurable: true })
  })

  afterAll(() => {
    Object.defineProperty(navigator, 'language', { value: originalLanguage, writable: true, configurable: true })
  })

  it('should provide default language (fr)', async () => {
    await act(async () => {
      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      )
    })

    expect(screen.getByTestId('lang').textContent).toBe('fr')
  })

  it('should provide translations', async () => {
    await act(async () => {
      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      )
    })

    expect(screen.getByTestId('loading-text').textContent).toBe('Chargement...')
  })

  it('should change language', async () => {
    await act(async () => {
      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Set English'))
    })

    expect(screen.getByTestId('lang').textContent).toBe('en')
    expect(screen.getByTestId('loading-text').textContent).toBe('Loading...')
  })

  it('should save language to user metadata', async () => {
    await act(async () => {
      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Set English'))
    })

    expect(mockUpdateUser).toHaveBeenCalledWith({ data: { language: 'en' } })
  })

  it('should load language from user metadata', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { user_metadata: { language: 'en' } } },
    })

    await act(async () => {
      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      )
    })

    expect(screen.getByTestId('lang').textContent).toBe('en')
  })

  it('should throw error when useLanguage is used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => {
      render(<TestConsumer />)
    }).toThrow('useLanguage must be used within a LanguageProvider')
    spy.mockRestore()
  })

  it('should handle error when saving language', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockUpdateUser.mockRejectedValue(new Error('Save failed'))

    await act(async () => {
      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Set English'))
    })

    // Should not crash
    expect(screen.getByTestId('lang').textContent).toBe('en')
    spy.mockRestore()
  })

  it('should detect browser language', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    // Mock navigator.language
    const originalLanguage = navigator.language
    Object.defineProperty(navigator, 'language', { value: 'en-US', writable: true, configurable: true })

    await act(async () => {
      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      )
    })

    expect(screen.getByTestId('lang').textContent).toBe('en')

    Object.defineProperty(navigator, 'language', { value: originalLanguage, writable: true, configurable: true })
  })
})
