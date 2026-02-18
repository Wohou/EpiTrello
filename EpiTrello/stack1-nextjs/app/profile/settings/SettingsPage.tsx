'use client'

import { useState, useEffect, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { themes, type ThemeKey } from '@/lib/themes'
import { useTheme } from '@/lib/theme-context'
import { useLanguage} from '@/lib/language-context'
import './SettingsPage.css'

export default function SettingsPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const { currentTheme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()

  // Get the first letter for avatar, handling empty/whitespace cases
  const getAvatarLetter = (name: string) => {
    const trimmed = name.trim()
    return trimmed ? trimmed.charAt(0).toUpperCase() : '?'
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabaseBrowser.auth.getUser()
      if (user) {
        setUserId(user.id)
        setUsername(user.user_metadata?.username || user.email || '')
        setEmail(user.email || '')
        setAvatarUrl(user.user_metadata?.avatar_url || null)
        // Theme is already managed by ThemeContext
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    // Trim whitespace from username
    const trimmedUsername = username.trim()

    if (!trimmedUsername) {
      setMessage({ type: 'error', text: t.settings.usernameRequired })
      setSaving(false)
      return
    }

    try {
      const { error } = await supabaseBrowser.auth.updateUser({
        data: {
          username: trimmedUsername,
          avatar_url: avatarUrl,
          // Theme is now saved automatically via ThemeContext
        }
      })

      if (error) throw error

      // Sync avatar_url and username to profiles table
      const { data: { user } } = await supabaseBrowser.auth.getUser()
      if (user) {
        await supabaseBrowser
          .from('profiles')
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - Supabase client has no DB types
          .update({ avatar_url: avatarUrl, username: trimmedUsername })
          .eq('id', user.id)
      }

      // Update local state with trimmed username
      setUsername(trimmedUsername)
      setMessage({ type: 'success', text: t.settings.profileUpdated })
    } catch (error: unknown) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: (error instanceof Error ? error.message : String(error)) || t.settings.updateError })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      setMessage(null)

      if (!event.target.files || event.target.files.length === 0) {
        return
      }

      const file = event.target.files[0]

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: t.settings.selectImage })
        return
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: t.settings.imageSize })
        return
      }

      const { data: { user } } = await supabaseBrowser.auth.getUser()
      if (!user) throw new Error(t.settings.notAuthenticated)

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = fileName

      // Upload to Supabase Storage
      const { error: uploadError } = await supabaseBrowser.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error(t.settings.bucketNotFound)
        }
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseBrowser.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update user metadata
      const { error: updateError } = await supabaseBrowser.auth.updateUser({
        data: { avatar_url: publicUrl }
      })

      if (updateError) throw updateError

      // Sync to profiles table so cards/comments show the avatar
      await supabaseBrowser
        .from('profiles')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Supabase client has no DB types
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      setAvatarUrl(publicUrl)
      setMessage({ type: 'success', text: t.settings.photoUpdated })
    } catch (error: unknown) {
      console.error('Error uploading avatar:', error)
      setMessage({ type: 'error', text: (error instanceof Error ? error.message : String(error)) || t.settings.uploadError })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      setUploading(true)
      setMessage(null)

      const { data: { user } } = await supabaseBrowser.auth.getUser()
      const { error } = await supabaseBrowser.auth.updateUser({
        data: { avatar_url: null }
      })

      if (error) throw error

      // Sync to profiles table
      if (user) {
        await supabaseBrowser
          .from('profiles')
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - Supabase client has no DB types
          .update({ avatar_url: null })
          .eq('id', user.id)
      }

      setAvatarUrl(null)
      setMessage({ type: 'success', text: t.settings.photoRemoved })
    } catch (error: unknown) {
      console.error('Error removing avatar:', error)
      setMessage({ type: 'error', text: (error instanceof Error ? error.message : String(error)) || t.settings.removeError })
    } finally {
      setUploading(false)
    }
  }

  const handleBack = () => {
    router.push('/boards')
  }

  const handleCopyUserId = async () => {
    try {
      await navigator.clipboard.writeText(userId)
      setMessage({ type: 'success', text: t.settings.idCopied || 'ID copié dans le presse-papier' })
    } catch (error) {
      console.error('Error copying ID:', error)
      setMessage({ type: 'error', text: t.settings.copyError || 'Erreur lors de la copie' })
    }
  }

  if (loading) {
    return <div className="settings-loading">{t.common.loading}</div>
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <button className="back-button" onClick={handleBack}>
          ← {t.boards.backToBoards}
        </button>
        <h1>{t.settings.accountSettings}</h1>
      </div>

      <div className="settings-content">
        <div className="settings-card">
          <div className="profile-section">
            <h2>{t.settings.profilePicture}</h2>
            <div className="avatar-section">
              <div className="current-avatar">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar" className="avatar-image" width={80} height={80} />
                ) : (
                  getAvatarLetter(username)
                )}
              </div>
              <div className="avatar-info">
                <p className="info-text">
                  {avatarUrl
                    ? t.settings.changePhoto
                    : t.settings.addPhoto}
                </p>
                <div className="avatar-buttons">
                  <label className="change-avatar-button" htmlFor="avatar-upload">
                    {uploading ? t.settings.uploading : avatarUrl ? t.settings.changePhoto : t.settings.addPhoto}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                  {avatarUrl && (
                    <button
                      className="remove-avatar-button"
                      onClick={handleRemoveAvatar}
                      disabled={uploading}
                    >
                      {t.settings.removePhoto}
                    </button>
                  )}
                </div>
                <span className="field-help">{t.settings.formatHelp}</span>
              </div>
            </div>
          </div>

          <div className="divider"></div>

          <div className="theme-section">
            <h2>{t.settings.appTheme}</h2>
            <p className="section-description">{t.settings.customizeAppearance}</p>

            <div className="theme-grid">
              {(Object.keys(themes) as ThemeKey[]).map((themeKey) => {
                const theme = themes[themeKey]
                const themeName = t.themes[themeKey]
                return (
                  <div
                    key={themeKey}
                    className={`theme-card ${currentTheme === themeKey ? 'selected' : ''}`}
                    onClick={() => {
                      setTheme(themeKey)
                      setMessage({ type: 'success', text: t.settings.themeApplied.replace('{name}', themeName) })
                    }}
                  >
                    <div
                      className="theme-preview"
                      style={{ background: theme.background }}
                    >
                      {currentTheme === themeKey && (
                        <span className="check-icon">✓</span>
                      )}
                    </div>
                    <span className="theme-name">{themeName}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="divider"></div>

          <div className="language-section">
            <h2>{t.settings.language}</h2>
            <p className="section-description">{t.settings.selectLanguage}</p>

            <div className="language-options">
              <div
                className={`language-option ${language === 'fr' ? 'selected' : ''}`}
                onClick={async () => {
                  await setLanguage('fr')
                  setMessage({ type: 'success', text: t.settings.languageChanged })
                }}
              >
                <span className="language-flag">🇫🇷</span>
                <span className="language-name">{t.settings.french}</span>
                {language === 'fr' && <span className="check-icon">✓</span>}
              </div>

              <div
                className={`language-option ${language === 'en' ? 'selected' : ''}`}
                onClick={async () => {
                  await setLanguage('en')
                  setMessage({ type: 'success', text: t.settings.languageChanged })
                }}
              >
                <span className="language-flag">🇬🇧</span>
                <span className="language-name">{t.settings.english}</span>
                {language === 'en' && <span className="check-icon">✓</span>}
              </div>
            </div>
          </div>

          <div className="divider"></div>

          <div className="info-section">
            <h2>{t.settings.personalInfo}</h2>

            <div className="form-group">
              <label htmlFor="username">{t.settings.username}</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t.settings.usernamePlaceholder}
              />
              <span className="field-help">{t.settings.usernameHelp}</span>
            </div>

            <div className="form-group">
              <label htmlFor="userId">{t.settings.uniqueId || 'ID unique'}</label>
              <div className="id-field-container">
                <input
                  id="userId"
                  type="text"
                  value={userId}
                  disabled
                  className="disabled-input id-input"
                />
                <button
                  type="button"
                  className="copy-id-button"
                  onClick={handleCopyUserId}
                  title={t.settings.copyId || 'Copier l\'ID'}
                >
                  📋
                </button>
              </div>
              <span className="field-help">{t.settings.idHelp || 'Partagez cet ID pour recevoir des invitations'}</span>
            </div>

            <div className="form-group">
              <label htmlFor="email">{t.settings.email}</label>
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="disabled-input"
              />
              <span className="field-help">{t.settings.emailHelp}</span>
            </div>
          </div>

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="actions">
            <button
              className="save-button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? t.settings.saving : t.settings.saveChanges}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
