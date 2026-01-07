'use client'

import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/lib/language-context'
import type { BoardMember } from '@/lib/supabase'
import './BoardManageMenu.css'

interface BoardManageMenuProps {
  boardId: string
  isOwner: boolean
  members: BoardMember[]
  onInvite: (userId: string) => Promise<void>
  onRevokeMember: (userId: string) => Promise<void>
  onLeaveBoard: () => Promise<void>
  onRefreshMembers: () => void
}

export default function BoardManageMenu({
  isOwner,
  members,
  onInvite,
  onRevokeMember,
  onLeaveBoard,
  onRefreshMembers
}: BoardManageMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [inviteUserId, setInviteUserId] = useState('')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleInvite = async () => {
    if (!inviteUserId.trim()) {
      setError(t.sharing?.enterUserId || 'Veuillez entrer un ID utilisateur')
      return
    }

    setInviting(true)
    setError(null)
    try {
      await onInvite(inviteUserId.trim())
      setSuccess(t.sharing?.invitationSent || 'Invitation envoyée !')
      setInviteUserId('')
      setTimeout(() => {
        setSuccess(null)
        setShowInviteModal(false)
      }, 2000)
    } catch (err: unknown) {
      setError(err.message || t.sharing?.inviteError || 'Erreur lors de l\'invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleRevoke = async (userId: string, username: string) => {
    const confirmText = (t.sharing?.revokeConfirm || 'Êtes-vous sûr de vouloir retirer {name} du board ?').replace('{name}', username)
    if (confirm(confirmText)) {
      try {
        await onRevokeMember(userId)
        onRefreshMembers()
      } catch (err: unknown) {
        setError(err.message || t.sharing?.revokeError || 'Erreur lors de la révocation')
      }
    }
  }

  const handleLeave = async () => {
    if (confirm(t.sharing?.leaveConfirm || 'Êtes-vous sûr de vouloir quitter ce board ?')) {
      try {
        await onLeaveBoard()
      } catch (err: unknown) {
        setError(err.message || t.sharing?.leaveError || 'Erreur lors du départ')
      }
    }
  }

  return (
    <div className="board-manage-container" ref={menuRef}>
      <button
        className="board-manage-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        ⚙️ {t.sharing?.manageBoard || 'Gérer le board'}
      </button>

      {isOpen && (
        <div className="board-manage-dropdown">
          {isOwner ? (
            <>
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowInviteModal(true)
                  setIsOpen(false)
                }}
              >
                <span className="dropdown-icon">➕</span>
                {t.sharing?.inviteUser || 'Inviter un utilisateur'}
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowMembersModal(true)
                  setIsOpen(false)
                  onRefreshMembers()
                }}
              >
                <span className="dropdown-icon">👥</span>
                {t.sharing?.manageMembers || 'Gérer les membres'}
              </button>
            </>
          ) : (
            <button
              className="dropdown-item danger"
              onClick={() => {
                handleLeave()
                setIsOpen(false)
              }}
            >
              <span className="dropdown-icon">🚪</span>
              {t.sharing?.leaveBoard || 'Quitter le board'}
            </button>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t.sharing?.inviteUser || 'Inviter un utilisateur'}</h2>
              <button className="modal-close" onClick={() => setShowInviteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                {t.sharing?.inviteDescription || 'Entrez l\'ID unique de l\'utilisateur que vous souhaitez inviter.'}
              </p>
              <input
                type="text"
                value={inviteUserId}
                onChange={(e) => setInviteUserId(e.target.value)}
                placeholder={t.sharing?.userIdPlaceholder || 'ID de l\'utilisateur'}
                className="invite-input"
              />
              {error && <p className="error-message">{error}</p>}
              {success && <p className="success-message">{success}</p>}
            </div>
            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => setShowInviteModal(false)}
              >
                {t.common?.cancel || 'Annuler'}
              </button>
              <button
                className="invite-button"
                onClick={handleInvite}
                disabled={inviting}
              >
                {inviting ? (t.common?.loading || 'Chargement...') : (t.sharing?.sendInvite || 'Envoyer l\'invitation')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && (
        <div className="modal-overlay" onClick={() => setShowMembersModal(false)}>
          <div className="modal-content members-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t.sharing?.boardMembers || 'Membres du board'}</h2>
              <button className="modal-close" onClick={() => setShowMembersModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {members.length === 0 ? (
                <p className="no-members">{t.sharing?.noMembers || 'Aucun membre'}</p>
              ) : (
                <ul className="members-list">
                  {members.map((member) => (
                    <li key={member.id} className="member-item">
                      <div className="member-info">
                        <div className="member-avatar">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.username} />
                          ) : (
                            <span>{(member.username || 'U').charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="member-details">
                          <span className="member-name">{member.username || 'Utilisateur'}</span>
                          <span className="member-role">
                            {member.role === 'owner'
                              ? (t.sharing?.roleOwner || 'Propriétaire')
                              : (t.sharing?.roleMember || 'Membre')}
                          </span>
                        </div>
                      </div>
                      {isOwner && member.role !== 'owner' && (
                        <button
                          className="revoke-button"
                          onClick={() => handleRevoke(member.user_id, member.username || 'cet utilisateur')}
                        >
                          {t.sharing?.revoke || 'Retirer'}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="close-button"
                onClick={() => setShowMembersModal(false)}
              >
                {t.common?.close || 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
