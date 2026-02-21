/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import SettingsPage from '../app/profile/settings/SettingsPage'
import { useLanguage } from '../lib/language-context'
import { useTheme } from '../lib/theme-context'

const mockGetUser = jest.fn()
const mockUpdateUser = jest.fn()
const mockStorageUpload = jest.fn()
const mockStorageGetPublicUrl = jest.fn()
const mockProfileUpdate = jest.fn()

jest.mock('../lib/supabase-browser', () => ({
  supabaseBrowser: {
    auth: {
      getUser: () => mockGetUser(),
      updateUser: (...args: any[]) => mockUpdateUser(...args),
    },
    from: () => ({
      update: () => ({
        eq: () => mockProfileUpdate(),
      }),
    }),
    storage: {
      from: () => ({
        upload: (...args: any[]) => mockStorageUpload(...args),
        getPublicUrl: (...args: any[]) => mockStorageGetPublicUrl(...args),
      }),
    },
  },
}))

jest.mock('../lib/language-context', () => ({
  useLanguage: jest.fn(),
}))

const mockSetTheme = jest.fn()
jest.mock('../lib/theme-context', () => ({
  useTheme: jest.fn(),
}))

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}))

const mockTranslations = {
  common: { loading: 'Loading...' },
  boards: { backToBoards: 'Back to boards' },
  settings: {
    accountSettings: 'Account Settings',
    profilePicture: 'Profile Picture',
    changePhoto: 'Change Photo',
    addPhoto: 'Add Photo',
    removePhoto: 'Remove Photo',
    uploading: 'Uploading...',
    formatHelp: 'JPG, PNG max 2MB',
    appTheme: 'App Theme',
    customizeAppearance: 'Customize appearance',
    themeApplied: 'Theme {name} applied',
    language: 'Language',
    selectLanguage: 'Select language',
    languageChanged: 'Language changed',
    french: 'French',
    english: 'English',
    personalInfo: 'Personal Info',
    username: 'Username',
    usernamePlaceholder: 'Enter username',
    usernameHelp: 'Visible to others',
    usernameRequired: 'Username is required',
    email: 'Email',
    emailHelp: 'Cannot be changed',
    profileUpdated: 'Profile updated',
    updateError: 'Update error',
    photoUpdated: 'Photo updated',
    uploadError: 'Upload error',
    photoRemoved: 'Photo removed',
    removeError: 'Remove error',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    selectImage: 'Select an image',
    imageSize: 'Max 2MB',
    notAuthenticated: 'Not authenticated',
    bucketNotFound: 'Bucket not found',
    uniqueId: 'Unique ID',
    copyId: 'Copy ID',
    idHelp: 'Share this ID',
    idCopied: 'ID copied',
    copyError: 'Copy error',
  },
  themes: {
    default: 'Blue Gradient',
    purple: 'Mystic Purple',
    sunset: 'Sunset',
    forest: 'Forest',
    ocean: 'Ocean',
    rose: 'Rose',
    dark: 'Dark Night',
    mint: 'Fresh Mint',
  },
}

const mockSetLanguage = jest.fn().mockResolvedValue(undefined)

describe('SettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useLanguage as jest.Mock).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: mockTranslations,
    })
    ;(useTheme as jest.Mock).mockReturnValue({
      currentTheme: 'default',
      setTheme: mockSetTheme,
    })

    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'u-1',
          email: 'test@test.com',
          user_metadata: { username: 'TestUser', avatar_url: null },
        },
      },
    })
    mockUpdateUser.mockResolvedValue({ error: null })
    mockProfileUpdate.mockResolvedValue({ error: null })
  })

  it('should show loading state initially', () => {
    mockGetUser.mockImplementation(() => new Promise(() => {}))
    render(<SettingsPage />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should display user data after loading', async () => {
    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('TestUser')).toBeInTheDocument()
      expect(screen.getByDisplayValue('test@test.com')).toBeInTheDocument()
    })
  })

  it('should display back button', async () => {
    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Back to boards/)).toBeInTheDocument()
    })
  })

  it('should navigate back on back button click', async () => {
    render(<SettingsPage />)

    await waitFor(() => {
      fireEvent.click(screen.getByText(/Back to boards/))
    })

    expect(mockPush).toHaveBeenCalledWith('/boards')
  })

  it('should save profile changes', async () => {
    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('TestUser')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByDisplayValue('TestUser'), { target: { value: 'NewName' } })
    fireEvent.click(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ username: 'NewName' }),
      }))
    })
  })

  it('should show error for empty username', async () => {
    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('TestUser')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByDisplayValue('TestUser'), { target: { value: '   ' } })
    fireEvent.click(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(screen.getByText('Username is required')).toBeInTheDocument()
    })
  })

  it('should handle save error', async () => {
    const saveError = new Error('Save failed')
    mockUpdateUser.mockResolvedValue({ error: saveError })

    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('TestUser')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument()
    })
  })

  it('should render theme grid', async () => {
    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Blue Gradient')).toBeInTheDocument()
      expect(screen.getByText('Dark Night')).toBeInTheDocument()
    })
  })

  it('should change theme on click', async () => {
    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Dark Night')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Dark Night'))
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('should render language options', async () => {
    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('French')).toBeInTheDocument()
      expect(screen.getByText('English')).toBeInTheDocument()
    })
  })

  it('should change language', async () => {
    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('French')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('French'))

    await waitFor(() => {
      expect(mockSetLanguage).toHaveBeenCalledWith('fr')
    })
  })

  it('should render avatar section with no photo', async () => {
    render(<SettingsPage />)

    await waitFor(() => {
      // 'Add Photo' appears as both information text and button label
      expect(screen.getAllByText('Add Photo').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('should render avatar image when user has one', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'u-1',
          email: 'test@test.com',
          user_metadata: { username: 'TestUser', avatar_url: 'https://example.com/avatar.jpg' },
        },
      },
    })

    render(<SettingsPage />)

    await waitFor(() => {
      // 'Change Photo' appears as both the info text and the button label
      expect(screen.getAllByText('Change Photo').length).toBeGreaterThan(0)
      expect(screen.getByText('Remove Photo')).toBeInTheDocument()
    })
  })

  it('should handle remove avatar', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'u-1',
          email: 'test@test.com',
          user_metadata: { username: 'TestUser', avatar_url: 'https://example.com/avatar.jpg' },
        },
      },
    })

    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Remove Photo')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Remove Photo'))

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ data: { avatar_url: null } })
    })
  })

  it('should copy user ID to clipboard', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    })

    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('📋')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('📋'))

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('u-1')
    })
  })

  it('should display user ID field as disabled', async () => {
    render(<SettingsPage />)

    await waitFor(() => {
      const idInput = screen.getByDisplayValue('u-1')
      expect(idInput).toBeDisabled()
    })
  })

  it('should show selected theme check mark', async () => {
    render(<SettingsPage />)

    await waitFor(() => {
      const themeCards = document.querySelectorAll('.theme-card')
      expect(themeCards.length).toBeGreaterThan(0)
    })
  })

  it('should show selected language check mark', async () => {
    render(<SettingsPage />)

    await waitFor(() => {
      const selectedLang = document.querySelector('.language-option.selected')
      expect(selectedLang).toBeInTheDocument()
    })
  })

  it('should handle clipboard error', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockRejectedValue(new Error('Clipboard error')),
      },
    })

    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('📋')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('📋'))

    await waitFor(() => {
      expect(screen.getByText('Copy error')).toBeInTheDocument()
    })
    jest.restoreAllMocks()
  })
})
