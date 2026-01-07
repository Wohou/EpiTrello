'use client'

import { useState, useRef, useEffect, ChangeEvent } from 'react'
import { useLanguage } from '@/lib/language-context'
import type { Card } from '@/lib/supabase'
import GitHubPowerUp from './GitHubPowerUp'
import './CardItem.css'

interface CardLog {
  created_by: string | null
  created_by_username: string | null
  created_at: string | null
  last_modified_by: string | null
  last_modified_by_username: string | null
  updated_at: string | null
}

interface CardItemProps {
  card: Card
  onDelete: () => void
  onUpdate: (updates: Partial<Card>) => void
  isSharedBoard?: boolean
}

const CARD_COLORS = [
  { name: 'Aucune', value: null },
  { name: 'Rouge', value: '#eb5a46' },
  { name: 'Orange', value: '#ff9f1a' },
  { name: 'Jaune', value: '#f2d600' },
  { name: 'Vert', value: '#61bd4f' },
  { name: 'Bleu', value: '#0079bf' },
  { name: 'Violet', value: '#c377e0' },
  { name: 'Rose', value: '#ff78cb' },
  { name: 'Gris', value: '#b3bac5' },
]

// Helper functions for dates
const getDaysRemaining = (dueDate: string): number => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

const getDuration = (startDate: string, endDate: string): number => {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  })
}

// Generate Google Calendar URL
const generateGoogleCalendarUrl = (
  title: string,
  description: string | null,
  startDate: string | null,
  endDate: string
): string => {
  const formatDateForGoogle = (date: string): string => {
    return new Date(date).toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, 8)
  }

  const start = startDate ? formatDateForGoogle(startDate) : formatDateForGoogle(endDate)
  // For all-day events, end date should be the next day
  const endDateObj = new Date(endDate)
  endDateObj.setDate(endDateObj.getDate() + 1)
  const end = formatDateForGoogle(endDateObj.toISOString())

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    details: description || '',
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export default function CardItem({ card, onDelete, onUpdate}: CardItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [showMenu, setShowMenu] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [uploading, setUploading] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showLogModal, setShowLogModal] = useState(false)
  const [showDateModal, setShowDateModal] = useState(false)
  const [showGitHubPowerUp, setShowGitHubPowerUp] = useState(false)
  const [cardLog, setCardLog] = useState<CardLog | null>(null)
  const [loadingLog, setLoadingLog] = useState(false)
  const [tempStartDate, setTempStartDate] = useState<string>(card.start_date ? new Date(card.start_date).toISOString().split('T')[0] : '')
  const [tempDueDate, setTempDueDate] = useState<string>(card.due_date ? new Date(card.due_date).toISOString().split('T')[0] : '')
  const [useStartDate, setUseStartDate] = useState(!!card.start_date)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useLanguage()

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
        setShowColorPicker(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const handleSave = () => {
    onUpdate({ title, description })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTitle(card.title)
    setDescription(card.description || '')
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm(t.cards.deleteConfirm || 'Are you sure you want to delete this card?')) {
      onDelete()
      setShowMenu(false)
    }
  }

  const handleColorChange = (color: string | null) => {
    onUpdate({ cover_color: color })
    setShowColorPicker(false)
    setShowMenu(false)
  }

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image doit faire moins de 5MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('cardId', card.id)

      const response = await fetch('/api/cards/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const { url } = await response.json()
      onUpdate({ cover_image: url })
      setShowMenu(false)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Erreur lors de l\'upload de l\'image')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveCover = () => {
    onUpdate({ cover_color: null })
    setShowMenu(false)
  }

  const handleRemoveImage = () => {
    onUpdate({ cover_image: null })
    setShowMenu(false)
  }

  const handleEdit = () => {
    setIsEditing(true)
    setShowMenu(false)
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    // Calculate position for the dropdown menu
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.right - 220 // 220 is the min-width of the menu
      })
    }

    setShowMenu(!showMenu)
  }

  const handleCardClick = () => {
    if (!showMenu && card.cover_image) {
      setShowImageModal(true)
    }
  }

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const newCompletedState = !card.is_completed

    onUpdate({ is_completed: newCompletedState })

    try {
      const response = await fetch(`/api/cards/${card.id}/sync-github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: card.id,
          isCompleted: newCompletedState
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.updated > 0) {
          console.log(`Synced ${result.updated} GitHub issue(s)`)
        }
      }
    } catch (error) {
      console.error('Error syncing to GitHub:', error)
    }
  }

  const handleShowLog = async () => {
    setShowMenu(false)
    setLoadingLog(true)
    setShowLogModal(true)

    try {
      const response = await fetch(`/api/cards/${card.id}/log`)
      if (response.ok) {
        const data = await response.json()
        setCardLog(data)
      }
    } catch (error) {
      console.error('Error fetching card log:', error)
    } finally {
      setLoadingLog(false)
    }
  }

  const handleOpenDateModal = () => {
    setTempStartDate(card.start_date ? new Date(card.start_date).toISOString().split('T')[0] : '')
    setTempDueDate(card.due_date ? new Date(card.due_date).toISOString().split('T')[0] : '')
    setUseStartDate(!!card.start_date)
    setShowDateModal(true)
    setShowMenu(false)
  }

  const handleSaveDates = () => {
    const updates: Partial<Card> = {}

    if (useStartDate && tempStartDate) {
      updates.start_date = new Date(tempStartDate).toISOString()
    } else {
      updates.start_date = null
    }

    if (tempDueDate) {
      updates.due_date = new Date(tempDueDate).toISOString()
    } else {
      updates.due_date = null
    }

    onUpdate(updates)
    setShowDateModal(false)
  }

  const handleRemoveDates = () => {
    onUpdate({ start_date: null, due_date: null })
    setTempStartDate('')
    setTempDueDate('')
    setUseStartDate(false)
    setShowDateModal(false)
  }

  const handleAddToGoogleCalendar = () => {
    const dueDateToUse = tempDueDate || (card.due_date ? new Date(card.due_date).toISOString().split('T')[0] : '')
    const startDateToUse = useStartDate ? tempStartDate || (card.start_date ? new Date(card.start_date).toISOString().split('T')[0] : null) : null

    if (!dueDateToUse) return

    const url = generateGoogleCalendarUrl(
      card.title,
      card.description,
      startDateToUse,
      dueDateToUse
    )
    window.open(url, '_blank')
  }

  const getDateBadgeInfo = () => {
    if (!card.due_date) return null

    const daysRemaining = getDaysRemaining(card.due_date)
    let badgeClass = 'date-badge'
    let text = ''

    if (card.is_completed) {
      badgeClass += ' completed'
      text = formatDateShort(card.due_date)
    } else if (daysRemaining < 0) {
      badgeClass += ' overdue'
      text = t.cards.overdue || 'En retard'
    } else if (daysRemaining === 0) {
      badgeClass += ' due-today'
      text = t.cards.dueToday || 'Aujourd\'hui'
    } else if (daysRemaining === 1) {
      badgeClass += ' due-soon'
      text = t.cards.dueTomorrow || 'Demain'
    } else {
      badgeClass += ' upcoming'
      const template = daysRemaining === 1 ? (t.cards.daysRemaining || '{count} jour restant') : (t.cards.daysRemainingPlural || '{count} jours restants')
      text = template.replace('{count}', String(daysRemaining))
    }

    return { badgeClass, text, daysRemaining }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isEditing) {
    return (
      <div className="card-item editing">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Card title"
          autoFocus
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={3}
        />
        <div className="card-actions">
          <button className="save-button" onClick={handleSave}>
            Save
          </button>
          <button className="cancel-button" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`card-item ${card.is_completed ? 'completed' : ''}`} onClick={handleCardClick}>
      {card.cover_color && (
        <div className="card-cover" style={{ backgroundColor: card.cover_color }} />
      )}
      {card.cover_image && (
        <div className="card-cover-image">
          <img src={card.cover_image} alt="Cover" />
        </div>
      )}
      <div className="card-content">
        <button
          className={`card-checkbox ${card.is_completed ? 'checked' : ''}`}
          onClick={handleToggleComplete}
          title={card.is_completed ? 'Marquer comme non terminé' : 'Marquer comme terminé'}
        >
          {card.is_completed && '✓'}
        </button>
        <div className="card-text">
          <div className={`card-title ${card.is_completed ? 'completed' : ''}`}>{card.title}</div>
          {card.description && <div className="card-description">{card.description}</div>}
          {/* Date Badge */}
          {card.due_date && (() => {
            const badgeInfo = getDateBadgeInfo()
            if (!badgeInfo) return null
            return (
              <div className="card-dates-display">
                <span className={badgeInfo.badgeClass}>
                  <span className="date-icon">📅</span>
                  {card.start_date && (
                    <span className="date-range">
                      {formatDateShort(card.start_date)} → {formatDateShort(card.due_date)}
                    </span>
                  )}
                  {!card.start_date && (
                    <span className="date-due">{formatDateShort(card.due_date)}</span>
                  )}
                  <span className="date-remaining">{badgeInfo.text}</span>
                </span>
                {card.start_date && card.due_date && (
                  <span className="duration-badge">
                    {(() => {
                      const days = getDuration(card.start_date, card.due_date)
                      const template = days === 1 ? (t.cards.duration || '{count} jour') : (t.cards.durationPlural || '{count} jours')
                      return template.replace('{count}', String(days))
                    })()}
                  </span>
                )}
              </div>
            )
          })()}
        </div>

        {/* GitHub Badge */}
        {'github_links_count' in card && (card as { github_links_count: number }).github_links_count > 0 && (
          <div className="github-badge" title={`${(card as { github_links_count: number }).github_links_count} issue(s) GitHub li\u00e9e(s)`}>
            <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
              <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
            {(card as { github_links_count: number }).github_links_count}
          </div>
        )}
      </div>

      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      <div className="card-menu-container" ref={menuRef}>
        <button
          ref={buttonRef}
          className="card-menu-button"
          onClick={handleMenuClick}
          title={t.cards.cardMenu}
        >
          ⋯
        </button>

        {showMenu && (
          <div
            className="card-dropdown-menu"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <button className="menu-item" onClick={handleEdit}>
              <span className="menu-icon">✏️</span>
              {t.cards.editCard}
            </button>

            <button className="menu-item" onClick={handleOpenDateModal}>
              <span className="menu-icon">📅</span>
              {t.cards.setDates || 'Définir les dates'}
            </button>

            <button
              className="menu-item"
              onClick={(e) => {
                e.stopPropagation()
                setShowColorPicker(!showColorPicker)
              }}
            >
              <span className="menu-icon">🎨</span>
              {t.cards.changeCover}
            </button>

            {showColorPicker && (
              <div className="color-picker">
                <div className="color-picker-header">{t.cards.changeCover}</div>
                <div className="color-grid">
                  {CARD_COLORS.map((color) => (
                    <button
                      key={color.value || 'none'}
                      className={`color-option ${card.cover_color === color.value ? 'selected' : ''}`}
                      style={{
                        backgroundColor: color.value || '#fff',
                        border: color.value ? 'none' : '2px solid #ddd'
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleColorChange(color.value)
                      }}
                      title={color.name}
                    >
                      {card.cover_color === color.value && '✓'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              className="menu-item"
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
              disabled={uploading}
            >
              <span className="menu-icon">🖼️</span>
              {uploading ? 'Upload...' : (card.cover_image ? (t.cards.changeImage || 'Changer la photo') : (t.cards.addImage || 'Ajouter une photo'))}
            </button>

            {card.cover_image && (
              <button
                className="menu-item"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveImage()
                }}
              >
                <span className="menu-icon">🖼️</span>
                {t.cards.removeImage || 'Supprimer la photo'}
              </button>
            )}

            {card.cover_color && (
              <button
                className="menu-item"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveCover()
                }}
              >
                <span className="menu-icon">✖️</span>
                {t.cards.removeCover || 'Supprimer la couverture'}
              </button>
            )}

            <div className="menu-divider" />
            <button className="menu-item" onClick={handleShowLog}>
              <span className="menu-icon">📋</span>
              {t.cards.viewActivity || 'Voir l\'activité'}
            </button>

            <button
              className="menu-item"
              onClick={(e) => {
                e.stopPropagation()
                setShowGitHubPowerUp(true)
                setShowMenu(false)
              }}
            >
              <span className="menu-icon">🔗</span>
              {t.github.powerUp}
            </button>

            <div className="menu-divider" />

            <button className="menu-item danger" onClick={handleDelete}>
              <span className="menu-icon">🗑️</span>
              {t.cards.deleteCard}
            </button>
          </div>
        )}
      </div>

      {/* Image Lightbox Modal */}
      {showImageModal && card.cover_image && (
        <div
          className="image-modal-overlay"
          onClick={() => setShowImageModal(false)}
        >
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="image-modal-close"
              onClick={() => setShowImageModal(false)}
            >
              ✕
            </button>
            <img src={card.cover_image} alt={card.title} />
            <div className="image-modal-title">{card.title}</div>
          </div>
        </div>
      )}

      {/* Card Activity Log Modal */}
      {showLogModal && (
        <div
          className="image-modal-overlay"
          onClick={() => setShowLogModal(false)}
        >
          <div className="card-log-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="image-modal-close"
              onClick={() => setShowLogModal(false)}
            >
              ✕
            </button>
            <h3>{t.cards.activityLog || 'Historique d\'activité'}</h3>
            {loadingLog ? (
              <div className="log-loading">{t.common.loading || 'Chargement...'}</div>
            ) : cardLog ? (
              <div className="log-content">
                <div className="log-entry">
                  <span className="log-label">{t.cards.createdBy || 'Créé par'}</span>
                  <span className="log-value">
                    {cardLog.created_by_username || t.cards.unknownUser || 'Utilisateur inconnu'}
                  </span>
                  <span className="log-date">{formatDate(cardLog.created_at)}</span>
                </div>
                <div className="log-entry">
                  <span className="log-label">{t.cards.lastModifiedBy || 'Dernière modification par'}</span>
                  <span className="log-value">
                    {cardLog.last_modified_by_username || cardLog.created_by_username || t.cards.unknownUser || 'Utilisateur inconnu'}
                  </span>
                  <span className="log-date">{formatDate(cardLog.updated_at)}</span>
                </div>
              </div>
            ) : (
              <div className="log-empty">{t.cards.noActivityLog || 'Aucune activité enregistrée'}</div>
            )}
          </div>
        </div>
      )}

      {/* Date Picker Modal */}
      {showDateModal && (
        <div
          className="image-modal-overlay"
          onClick={() => setShowDateModal(false)}
        >
          <div className="date-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="image-modal-close"
              onClick={() => setShowDateModal(false)}
            >
              ✕
            </button>
            <h3>📅 {t.cards.dates || 'Dates'}</h3>

            <div className="date-modal-content">
              {/* Start Date Toggle */}
              <div className="date-option">
                <label className="date-checkbox-label">
                  <input
                    type="checkbox"
                    checked={useStartDate}
                    onChange={(e) => setUseStartDate(e.target.checked)}
                  />
                  <span>{t.cards.startDate || 'Date de début'}</span>
                </label>
                {useStartDate && (
                  <input
                    type="date"
                    className="date-input"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    max={tempDueDate || undefined}
                  />
                )}
              </div>

              {/* Due Date */}
              <div className="date-option">
                <label className="date-label">
                  <span>{t.cards.dueDate || 'Date de fin'}</span>
                </label>
                <input
                  type="date"
                  className="date-input"
                  value={tempDueDate}
                  onChange={(e) => setTempDueDate(e.target.value)}
                  min={useStartDate ? tempStartDate : undefined}
                />
              </div>

              {/* Duration Preview */}
              {tempDueDate && (
                <div className="date-preview">
                  <div className="preview-item">
                    <span className="preview-icon">⏱️</span>
                    <span className="preview-label">{t.cards.daysRemainingPlural?.replace('{count}', '') || 'Jours restants'}</span>
                    <span className={`preview-value ${getDaysRemaining(tempDueDate) < 0 ? 'overdue' : getDaysRemaining(tempDueDate) <= 3 ? 'soon' : ''}`}>
                      {getDaysRemaining(tempDueDate)} {getDaysRemaining(tempDueDate) === 1 ? 'jour' : 'jours'}
                    </span>
                  </div>
                  {useStartDate && tempStartDate && (
                    <div className="preview-item">
                      <span className="preview-icon">📊</span>
                      <span className="preview-label">{t.cards.durationPlural?.replace('{count}', '') || 'Durée totale'}</span>
                      <span className="preview-value duration">
                        {getDuration(tempStartDate, tempDueDate)} {getDuration(tempStartDate, tempDueDate) === 1 ? 'jour' : 'jours'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Google Calendar Button */}
              {tempDueDate && (
                <button
                  className="google-calendar-btn"
                  onClick={handleAddToGoogleCalendar}
                  type="button"
                >
                  <svg className="google-calendar-icon" viewBox="0 0 24 24" width="18" height="18">
                    <path fill="#4285F4" d="M22 5.5v13c0 1.38-1.12 2.5-2.5 2.5H4.5C3.12 21 2 19.88 2 18.5v-13C2 4.12 3.12 3 4.5 3h15C20.88 3 22 4.12 22 5.5z"/>
                    <path fill="#fff" d="M12 7v10M7 12h10"/>
                    <rect fill="#fff" x="6" y="6" width="12" height="2"/>
                    <rect fill="#fff" x="6" y="10" width="3" height="3"/>
                    <rect fill="#fff" x="10.5" y="10" width="3" height="3"/>
                    <rect fill="#fff" x="15" y="10" width="3" height="3"/>
                    <rect fill="#fff" x="6" y="15" width="3" height="3"/>
                    <rect fill="#fff" x="10.5" y="15" width="3" height="3"/>
                  </svg>
                  {t.cards.addToGoogleCalendar || 'Ajouter à Google Calendar'}
                </button>
              )}
            </div>

            <div className="date-modal-actions">
              {(card.start_date || card.due_date) && (
                <button className="date-remove-btn" onClick={handleRemoveDates}>
                  {t.cards.removeDates || 'Supprimer les dates'}
                </button>
              )}
              <div className="date-action-buttons">
                <button className="date-cancel-btn" onClick={() => setShowDateModal(false)}>
                  {t.cards.cancel || 'Annuler'}
                </button>
                <button className="date-save-btn" onClick={handleSaveDates} disabled={!tempDueDate}>
                  {t.cards.save || 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGitHubPowerUp && (
        <GitHubPowerUp
          cardId={card.id}
          onClose={() => setShowGitHubPowerUp(false)}
          onUpdate={() => onUpdate({})}
        />
      )}
    </div>
  )
}
