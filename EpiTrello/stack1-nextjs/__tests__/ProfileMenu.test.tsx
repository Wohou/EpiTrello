/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ProfileMenu from '../components/ProfileMenu'
import { useLanguage } from '../lib/language-context'

// Mock supabase-browser
const mockSignOut = jest.fn().mockResolvedValue({})
jest.mock('../lib/supabase-browser', () => ({
  supabaseBrowser: {
    auth: {
      signOut: () => mockSignOut(),
    },
  },
}))

// Mock language context
jest.mock('../lib/language-context', () => ({
  useLanguage: jest.fn(),
}))

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}))

const mockTranslations = {
  common: {
    settings: 'Settings',
    logout: 'Logout',
    logoutConfirm: 'Are you sure?',
    logoutYes: 'Yes, logout',
    cancel: 'Cancel',
    profile: 'Profile',
  },
}

describe('ProfileMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useLanguage as jest.Mock).mockReturnValue({ t: mockTranslations })
  })

  it('should render with username', () => {
    render(<ProfileMenu username="John" userEmail="john@test.com" />)
    expect(screen.getByText('John')).toBeInTheDocument()
  })

  it('should show first letter as avatar when no image', () => {
    render(<ProfileMenu username="John" userEmail="john@test.com" />)
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('should show ? for empty username', () => {
    render(<ProfileMenu username="   " userEmail="test@test.com" />)
    // The getAvatarLetter returns '?' for empty/whitespace
    const avatars = screen.getAllByText('?')
    expect(avatars.length).toBeGreaterThan(0)
  })

  it('should show avatar image when provided', () => {
    render(<ProfileMenu username="John" userEmail="john@test.com" avatarUrl="https://example.com/avatar.jpg" />)
    const imgs = screen.getAllByAltText('Avatar')
    expect(imgs.length).toBeGreaterThan(0)
  })

  it('should toggle dropdown on click', () => {
    render(<ProfileMenu username="John" userEmail="john@test.com" />)

    const button = screen.getByText('John').closest('button')!
    fireEvent.click(button)

    expect(screen.getByText('john@test.com')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('should show dropdown arrow', () => {
    render(<ProfileMenu username="John" userEmail="john@test.com" />)
    expect(screen.getByText('▼')).toBeInTheDocument()

    const button = screen.getByText('John').closest('button')!
    fireEvent.click(button)
    expect(screen.getByText('▲')).toBeInTheDocument()
  })

  it('should navigate to settings on settings click', () => {
    render(<ProfileMenu username="John" userEmail="john@test.com" />)

    const button = screen.getByText('John').closest('button')!
    fireEvent.click(button)

    fireEvent.click(screen.getByText('Settings'))
    expect(mockPush).toHaveBeenCalledWith('/profile/settings')
  })

  it('should show logout confirmation on logout click', () => {
    render(<ProfileMenu username="John" userEmail="john@test.com" />)

    const button = screen.getByText('John').closest('button')!
    fireEvent.click(button)

    fireEvent.click(screen.getByText('Logout'))
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    expect(screen.getByText('Yes, logout')).toBeInTheDocument()
  })

  it('should cancel logout confirmation', () => {
    render(<ProfileMenu username="John" userEmail="john@test.com" />)

    const button = screen.getByText('John').closest('button')!
    fireEvent.click(button)
    fireEvent.click(screen.getByText('Logout'))
    fireEvent.click(screen.getByText('Cancel'))

    expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument()
  })

  it('should call signOut and navigate on confirm logout', async () => {
    render(<ProfileMenu username="John" userEmail="john@test.com" />)

    const button = screen.getByText('John').closest('button')!
    fireEvent.click(button)
    fireEvent.click(screen.getByText('Logout'))
    fireEvent.click(screen.getByText('Yes, logout'))

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/auth')
    })
  })

  it('should close menu on outside click', () => {
    render(<ProfileMenu username="John" userEmail="john@test.com" />)

    const button = screen.getByText('John').closest('button')!
    fireEvent.click(button)
    expect(screen.getByText('Settings')).toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('Settings')).not.toBeInTheDocument()
  })

  it('should show large avatar in dropdown', () => {
    render(<ProfileMenu username="John" userEmail="john@test.com" avatarUrl="https://example.com/avatar.jpg" />)

    const button = screen.getByText('John').closest('button')!
    fireEvent.click(button)

    const imgs = screen.getAllByAltText('Avatar')
    expect(imgs.length).toBe(2) // small and large
  })
})
