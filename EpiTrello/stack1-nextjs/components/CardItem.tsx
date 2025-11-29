'use client'

import { useState, useRef, useEffect, ChangeEvent } from 'react'
import { useLanguage } from '@/lib/language-context'
import type { Card } from '@/lib/supabase'
import './CardItem.css'

interface CardItemProps {
  card: Card
  onDelete: () => void
  onUpdate: (updates: Partial<Card>) => void
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

export default function CardItem({ card, onDelete, onUpdate }: CardItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [showMenu, setShowMenu] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [uploading, setUploading] = useState(false)
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
    onUpdate({ cover_color: color, cover_image: null })
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
      onUpdate({ cover_image: url, cover_color: null })
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
    onUpdate({ cover_image: null, cover_color: null })
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
    if (!showMenu) {
      setIsEditing(true)
    }
  }

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUpdate({ is_completed: !card.is_completed })
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
      {card.cover_image && (
        <div className="card-cover-image">
          <img src={card.cover_image} alt="Cover" />
        </div>
      )}
      {card.cover_color && !card.cover_image && (
        <div className="card-cover" style={{ backgroundColor: card.cover_color }} />
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
        </div>
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
              {uploading ? 'Upload...' : (t.cards.addImage || 'Ajouter une image')}
            </button>
            
            {(card.cover_image || card.cover_color) && (
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
            
            <button className="menu-item danger" onClick={handleDelete}>
              <span className="menu-icon">🗑️</span>
              {t.cards.deleteCard}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
