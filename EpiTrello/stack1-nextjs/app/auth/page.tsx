'use client'

import { useLanguage } from '@/lib/language-context'
import AuthForm from './AuthForm'

export default function AuthPage() {
  const { t } = useLanguage()

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>EpiTrello</h1>
          <p>{t.auth.tagline}</p>
        </div>
        <AuthForm />
      </div>
    </div>
  )
}
