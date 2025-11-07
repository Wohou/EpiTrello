import AuthForm from './AuthForm'

export default function AuthPage() {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>EpiTrello</h1>
          <p>Organize your work and life, finally.</p>
        </div>
        <AuthForm />
      </div>
    </div>
  )
}
