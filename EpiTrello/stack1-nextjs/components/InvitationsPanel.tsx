'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/language-context'
import type { BoardInvitation } from '@/lib/supabase'
import './InvitationsPanel.css'

export default function InvitationsPanel() {
  const [invitations, setInvitations] = useState<BoardInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<string | null>(null)
  const { t } = useLanguage()

  useEffect(() => {
    fetchInvitations()
  }, [])

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/invitations')
      if (response.ok) {
        const data = await response.json()
        setInvitations(data)
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRespond = async (invitationId: string, action: 'accept' | 'decline') => {
    setResponding(invitationId)
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        // Remove from list
        setInvitations(invitations.filter(inv => inv.id !== invitationId))

        // Refresh the page if accepted to show the new board
        if (action === 'accept') {
          window.location.reload()
        }
      }
    } catch (error) {
      console.error('Error responding to invitation:', error)
    } finally {
      setResponding(null)
    }
  }

  if (loading) {
    return null
  }

  if (invitations.length === 0) {
    return null
  }

  return (
    <div className="invitations-panel">
      <div className="invitations-header">
        <span className="invitations-icon">📬</span>
        <h3>{t.sharing?.pendingInvitations || 'Invitations en attente'}</h3>
        <span className="invitations-count">{invitations.length}</span>
      </div>

      <div className="invitations-list">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="invitation-item">
            <div className="invitation-info">
              <span className="invitation-board">{invitation.board_title || 'Board'}</span>
              <span className="invitation-from">
                {(t.sharing?.invitedBy || 'Invité par {name}').replace('{name}', invitation.inviter_username || 'un utilisateur')}
              </span>
            </div>
            <div className="invitation-actions">
              <button
                className="accept-button"
                onClick={() => handleRespond(invitation.id, 'accept')}
                disabled={responding === invitation.id}
              >
                {responding === invitation.id ? '...' : (t.sharing?.accept || 'Accepter')}
              </button>
              <button
                className="decline-button"
                onClick={() => handleRespond(invitation.id, 'decline')}
                disabled={responding === invitation.id}
              >
                {t.sharing?.decline || 'Refuser'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
