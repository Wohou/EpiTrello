/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AuthForm from '../app/auth/AuthForm'
import { useLanguage } from '../lib/language-context'
import { useNotification } from '../components/NotificationContext'

const mockSignUp = jest.fn()
const mockSignInWithPassword = jest.fn()
const mockSignInWithOAuth = jest.fn()

jest.mock('../lib/supabase-browser', () => ({
  supabaseBrowser: {
    auth: {
      signUp: (...args: any[]) => mockSignUp(...args),
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signInWithOAuth: (...args: any[]) => mockSignInWithOAuth(...args),
    },
  },
}))

jest.mock('../lib/language-context', () => ({
  useLanguage: jest.fn(),
}))

const mockAlert = jest.fn().mockResolvedValue(undefined)
jest.mock('../components/NotificationContext', () => ({
  useNotification: jest.fn(),
}))

const mockPush = jest.fn()
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

const mockTranslations = {
  auth: {
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    username: 'Username',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    signInWithGoogle: 'Sign in with Google',
    signInWithGithub: 'Sign in with GitHub',
    continueWithGoogle: 'Continue with Google',
    continueWithGithub: 'Continue with GitHub',
    emailPlaceholder: 'your@email.com',
    passwordPlaceholder: 'Your password',
    usernamePlaceholder: 'Enter username',
    signingIn: 'Signing in...',
    signingUp: 'Signing up...',
    loading: 'Loading...',
    or: 'OR',
    checkEmail: 'Check your email',
    emailExists: 'Email already exists',
    confirmEmail: 'Please confirm your email',
    authError: 'Authentication error',
    oauthError: 'OAuth error',
  },
}

describe('AuthForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useLanguage as jest.Mock).mockReturnValue({ t: mockTranslations })
    ;(useNotification as jest.Mock).mockReturnValue({ alert: mockAlert })
  })

  it('should render sign in form by default', () => {
    render(<AuthForm />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.queryByLabelText('Username')).not.toBeInTheDocument()
  })

  it('should switch to sign up form', () => {
    render(<AuthForm />)
    const signUpTab = screen.getAllByText('Sign Up')[0]
    fireEvent.click(signUpTab)

    expect(screen.getByLabelText('Username')).toBeInTheDocument()
  })

  it('should switch back to sign in form', () => {
    render(<AuthForm />)
    const signUpTab = screen.getAllByText('Sign Up')[0]
    fireEvent.click(signUpTab)
    expect(screen.getByLabelText('Username')).toBeInTheDocument()

    const signInTab = screen.getAllByText('Sign In')[0]
    fireEvent.click(signInTab)
    expect(screen.queryByLabelText('Username')).not.toBeInTheDocument()
  })

  const submitForm = () => {
    const form = document.querySelector('form.auth-form-content')!
    fireEvent.submit(form)
  }

  it('should handle successful sign in', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    })

    render(<AuthForm />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } })
    submitForm()

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password',
      })
    })
  })

  it('should handle sign in error', async () => {
    const signInError = new Error('Invalid credentials')
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null },
      error: signInError,
    })

    render(<AuthForm />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } })
    submitForm()

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('should handle unconfirmed email error', async () => {
    const emailError = new Error('Email not confirmed')
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null },
      error: emailError,
    })

    render(<AuthForm />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } })
    submitForm()

    await waitFor(() => {
      expect(screen.getByText('Please confirm your email')).toBeInTheDocument()
    })
  })

  it('should handle successful sign up', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { identities: [{ id: '1' }] } },
      error: null,
    })

    render(<AuthForm />)

    // Switch to sign up
    fireEvent.click(screen.getAllByText('Sign Up')[0])

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'newuser' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@test.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } })
    submitForm()

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(expect.objectContaining({
        email: 'new@test.com',
        password: 'password',
      }))
      expect(mockAlert).toHaveBeenCalled()
    })
  })

  it('should handle sign up with existing email', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { identities: [] } },
      error: null,
    })

    render(<AuthForm />)

    fireEvent.click(screen.getAllByText('Sign Up')[0])
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'user' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'existing@test.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } })
    submitForm()

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument()
    })
  })

  it('should handle sign up error', async () => {
    const signUpError = new Error('Signup failed')
    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: signUpError,
    })

    render(<AuthForm />)

    fireEvent.click(screen.getAllByText('Sign Up')[0])
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'user' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } })
    submitForm()

    await waitFor(() => {
      expect(screen.getByText('Signup failed')).toBeInTheDocument()
    })
  })

  it('should handle Google OAuth sign in', () => {
    mockSignInWithOAuth.mockResolvedValue({ error: null })

    render(<AuthForm />)
    fireEvent.click(screen.getByText('Continue with Google'))

    expect(mockSignInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'google',
    }))
  })

  it('should handle GitHub OAuth sign in', () => {
    mockSignInWithOAuth.mockResolvedValue({ error: null })

    render(<AuthForm />)
    fireEvent.click(screen.getByText('Continue with GitHub'))

    expect(mockSignInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'github',
    }))
  })

  it('should handle OAuth error', async () => {
    const oauthError = new Error('OAuth failed')
    mockSignInWithOAuth.mockResolvedValue({ error: oauthError })

    render(<AuthForm />)
    fireEvent.click(screen.getByText('Continue with Google'))

    await waitFor(() => {
      expect(screen.getByText('OAuth failed')).toBeInTheDocument()
    })
  })

  it('should toggle between sign in and sign up via footer link', () => {
    render(<AuthForm />)

    // Footer should show "Don't have an account?" with "Sign Up" link
    fireEvent.click(screen.getAllByText('Sign Up').at(-1)!)
    expect(screen.getByLabelText('Username')).toBeInTheDocument()

    // Now footer shows "Already have an account?" with "Sign In" link
    fireEvent.click(screen.getAllByText('Sign In').at(-1)!)
    expect(screen.queryByLabelText('Username')).not.toBeInTheDocument()
  })

  it('should render OR divider', () => {
    render(<AuthForm />)
    expect(screen.getByText('OR')).toBeInTheDocument()
  })

  it('should show loading state', async () => {
    // Never resolve to keep loading state
    mockSignInWithPassword.mockReturnValue(new Promise(() => {}))

    render(<AuthForm />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } })
    submitForm()

    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  it('should handle non-Error exception', async () => {
    mockSignInWithPassword.mockRejectedValue('string error')

    render(<AuthForm />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } })
    submitForm()

    await waitFor(() => {
      expect(screen.getByText('Authentication error')).toBeInTheDocument()
    })
  })
})
