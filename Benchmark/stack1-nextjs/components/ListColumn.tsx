'use client'

import { useState } from 'react'
import CardItem from './CardItem'
import type { ListWithCards, Card } from '@/lib/supabase'
import './ListColumn.css'

interface ListColumnProps {
  list: ListWithCards
  onDeleteList: () => void
  onCreateCard: (title: string, description: string) => void
  onDeleteCard: (cardId: string) => void
  onUpdateCard: (cardId: string, updates: Partial<Card>) => void
}

export default function ListColumn({
  list,
  onDeleteList,
  onCreateCard,
  onDeleteCard,
  onUpdateCard,
}: ListColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [newCardDescription, setNewCardDescription] = useState('')

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onCreateCard(newCardTitle, newCardDescription)
      setNewCardTitle('')
      setNewCardDescription('')
      setIsAddingCard(false)
    }
  }

  const handleDeleteList = () => {
    if (confirm('Are you sure you want to delete this list? All cards will be deleted.')) {
      onDeleteList()
    }
  }

  return (
    <div className="list-column">
      <div className="list-header">
        <h3>{list.title}</h3>
        <button className="delete-list-button" onClick={handleDeleteList}>
          ×
        </button>
      </div>

      <div className="cards-container">
        {list.cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            onDelete={() => onDeleteCard(card.id)}
            onUpdate={(updates) => onUpdateCard(card.id, updates)}
          />
        ))}
      </div>

      {isAddingCard ? (
        <div className="add-card-form">
          <input
            type="text"
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            placeholder="Card title"
            autoFocus
          />
          <textarea
            value={newCardDescription}
            onChange={(e) => setNewCardDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
          />
          <div className="form-actions">
            <button className="add-button" onClick={handleAddCard}>
              Add Card
            </button>
            <button className="cancel-button" onClick={() => setIsAddingCard(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button className="add-card-button" onClick={() => setIsAddingCard(true)}>
          + Add a card
        </button>
      )}
    </div>
  )
}
