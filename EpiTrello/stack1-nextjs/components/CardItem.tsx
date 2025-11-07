'use client'

import { useState } from 'react'
import type { Card } from '@/lib/supabase'
import './CardItem.css'

interface CardItemProps {
  card: Card
  onDelete: () => void
  onUpdate: (updates: Partial<Card>) => void
}

export default function CardItem({ card, onDelete, onUpdate }: CardItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')

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
    if (confirm('Are you sure you want to delete this card?')) {
      onDelete()
    }
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
    <div className="card-item" onClick={() => setIsEditing(true)}>
      <div className="card-content">
        <div className="card-title">{card.title}</div>
        {card.description && <div className="card-description">{card.description}</div>}
      </div>
      <button className="delete-card-button" onClick={(e) => {
        e.stopPropagation()
        handleDelete()
      }}>
        ×
      </button>
    </div>
  )
}
