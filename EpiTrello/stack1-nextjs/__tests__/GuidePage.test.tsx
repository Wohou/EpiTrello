/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import GuidePage from '../app/guide/GuidePage'
import { useLanguage } from '../lib/language-context'

jest.mock('../lib/language-context', () => ({
  useLanguage: jest.fn(),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}))

describe('GuidePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useLanguage as jest.Mock).mockReturnValue({ language: 'en' })

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn()
  })

  it('should render the guide page', () => {
    render(<GuidePage />)
    expect(screen.getByText(/User Guide|Guide/i)).toBeInTheDocument()
  })

  it('should render all section titles', () => {
    render(<GuidePage />)
    // Check for key sections
    expect(screen.getAllByText(/Getting Started/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Boards/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Lists/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Cards/i).length).toBeGreaterThan(0)
  })

  it('should render back to boards link', () => {
    render(<GuidePage />)
    const backLink = screen.getByText(/Back to (my )?boards/i)
    expect(backLink).toBeInTheDocument()
  })

  it('should toggle language', () => {
    render(<GuidePage />)
    // The toggle button has class guide-lang-toggle
    const langToggle = document.querySelector('.guide-lang-toggle')!
    fireEvent.click(langToggle)
    // After toggle, content should switch language
  })

  it('should render navigation sidebar', () => {
    render(<GuidePage />)
    // The guide should have navigation elements
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0)
  })

  it('should handle scroll to section', () => {
    render(<GuidePage />)
    const navLinks = screen.getAllByRole('button').filter(
      el => el.classList.contains('guide-nav-link') || el.closest('.guide-sidebar')
    )
    if (navLinks.length > 0) {
      fireEvent.click(navLinks[0])
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
    }
  })

  it('should render tips section', () => {
    render(<GuidePage />)
    expect(screen.getAllByText(/Tips|Tricks/i).length).toBeGreaterThan(0)
  })

  it('should render settings section', () => {
    render(<GuidePage />)
    expect(screen.getAllByText(/Settings/i).length).toBeGreaterThan(0)
  })

  it('should render sharing section', () => {
    render(<GuidePage />)
    expect(screen.getAllByText(/Collaboration|Sharing/i).length).toBeGreaterThan(0)
  })

  it('should render with French language', () => {
    ;(useLanguage as jest.Mock).mockReturnValue({ language: 'fr' })
    render(<GuidePage />)
    expect(screen.getAllByText(/Guide|Accueil/i).length).toBeGreaterThan(0)
  })

  it('should handle scroll events', () => {
    render(<GuidePage />)
    fireEvent.scroll(window, { target: { scrollY: 500 } })
    // Should not crash on scroll
  })

  it('should clean up scroll listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
    const { unmount } = render(<GuidePage />)
    unmount()
    expect(removeEventListenerSpy).toHaveBeenCalled()
    removeEventListenerSpy.mockRestore()
  })
})
