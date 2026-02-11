'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useLanguage } from '@/lib/language-context'
import './ProfileMenu.css'

interface ProfileMenuProps {
  username: string
  userEmail: string
  avatarUrl?: string | null
}

export default function ProfileMenu({ username, userEmail, avatarUrl }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { t } = useLanguage()

  // Get the first letter for avatar, handling empty/whitespace cases
  const getAvatarLetter = (name: string) => {
    const trimmed = name.trim()
    return trimmed ? trimmed.charAt(0).toUpperCase() : '?'
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowLogoutConfirm(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabaseBrowser.auth.signOut()
    router.push('/auth')
  }

  const handleProfileSettings = () => {
    setIsOpen(false)
    router.push('/profile/settings')
  }

  return (
    <div className="profile-menu-container" ref={menuRef}>
      <button
        className="profile-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="profile-avatar">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Avatar" className="avatar-image" width={32} height={32} />
          ) : (
            getAvatarLetter(username)
          )}
        </div>
        <span className="profile-name">{username}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="profile-dropdown">
          <div className="profile-info">
            <div className="profile-avatar-large">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" className="avatar-image" width={48} height={48} />
              ) : (
                getAvatarLetter(username)
              )}
            </div>
            <div className="profile-details">
              <div className="profile-username">{username}</div>
              <div className="profile-email">{userEmail}</div>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          <button
            className="dropdown-item"
            onClick={handleProfileSettings}
          >
            <span className="item-icon">⚙️</span>
            {t.common.settings}
          </button>

          <button
            className="dropdown-item logout-item"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <span className="item-icon">🚪</span>
            {t.common.logout}
          </button>

          {showLogoutConfirm && (
            <div className="logout-confirm">
              <p>{t.common.logoutConfirm}</p>
              <div className="confirm-buttons">
                <button
                  className="confirm-yes"
                  onClick={handleLogout}
                >
                  {t.common.logoutYes}
                </button>
                <button
                  className="confirm-no"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  {t.common.cancel}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
