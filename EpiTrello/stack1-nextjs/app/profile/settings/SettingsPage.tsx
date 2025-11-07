'use client'

import { useState, useEffect, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { themes, type ThemeKey } from '@/lib/themes'
import { useTheme } from '@/lib/theme-context'
import './SettingsPage.css'

export default function SettingsPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const { currentTheme, setTheme } = useTheme()
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
      setMessage({ type: 'error', text: 'Le nom d\'utilisateur ne peut pas être vide' })
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

      // Update local state with trimmed username
      setUsername(trimmedUsername)
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' })
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la mise à jour' })
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
        setMessage({ type: 'error', text: 'Veuillez sélectionner une image' })
        return
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'L\'image ne doit pas dépasser 2MB' })
        return
      }

      const { data: { user } } = await supabaseBrowser.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabaseBrowser.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error('Le bucket "avatars" n\'existe pas. Veuillez configurer Supabase Storage (voir supabase/setup-avatars-storage.sql)')
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

      setAvatarUrl(publicUrl)
      setMessage({ type: 'success', text: 'Photo de profil mise à jour !' })
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      setMessage({ type: 'error', text: error.message || 'Erreur lors de l\'upload' })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      setUploading(true)
      setMessage(null)

      const { error } = await supabaseBrowser.auth.updateUser({
        data: { avatar_url: null }
      })

      if (error) throw error

      setAvatarUrl(null)
      setMessage({ type: 'success', text: 'Photo de profil supprimée' })
    } catch (error: any) {
      console.error('Error removing avatar:', error)
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la suppression' })
    } finally {
      setUploading(false)
    }
  }

  const handleBack = () => {
    router.push('/boards')
  }

  if (loading) {
    return <div className="settings-loading">Chargement...</div>
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <button className="back-button" onClick={handleBack}>
          ← Retour aux boards
        </button>
        <h1>Paramètres du compte</h1>
      </div>

      <div className="settings-content">
        <div className="settings-card">
          <div className="profile-section">
            <h2>Photo de profil</h2>
            <div className="avatar-section">
              <div className="current-avatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="avatar-image" />
                ) : (
                  getAvatarLetter(username)
                )}
              </div>
              <div className="avatar-info">
                <p className="info-text">
                  {avatarUrl
                    ? 'Vous pouvez changer votre photo de profil'
                    : 'Ajoutez une photo de profil personnalisée'}
                </p>
                <div className="avatar-buttons">
                  <label className="change-avatar-button" htmlFor="avatar-upload">
                    {uploading ? 'Chargement...' : avatarUrl ? 'Changer la photo' : 'Ajouter une photo'}
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
                      Supprimer
                    </button>
                  )}
                </div>
                <span className="field-help">Format: JPG, PNG. Max 2MB</span>
              </div>
            </div>
          </div>

          <div className="divider"></div>

          <div className="theme-section">
            <h2>Thème de l'application</h2>
            <p className="section-description">Personnalisez l'apparence de votre interface</p>

            <div className="theme-grid">
              {(Object.keys(themes) as ThemeKey[]).map((themeKey) => {
                const theme = themes[themeKey]
                return (
                  <div
                    key={themeKey}
                    className={`theme-card ${currentTheme === themeKey ? 'selected' : ''}`}
                    onClick={() => {
                      setTheme(themeKey)
                      setMessage({ type: 'success', text: `Thème "${theme.name}" appliqué !` })
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
                    <span className="theme-name">{theme.name}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="divider"></div>

          <div className="info-section">
            <h2>Informations personnelles</h2>

            <div className="form-group">
              <label htmlFor="username">Nom d'utilisateur</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Entrez votre nom d'utilisateur"
              />
              <span className="field-help">Ce nom sera affiché dans vos boards</span>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="disabled-input"
              />
              <span className="field-help">L'email ne peut pas être modifié</span>
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
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
