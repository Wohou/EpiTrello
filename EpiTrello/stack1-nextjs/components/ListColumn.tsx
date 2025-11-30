'use client'

import { useState } from 'react'
import { Droppable, Draggable, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import CardItem from './CardItem'
import type { ListWithCards, Card } from '@/lib/supabase'
import './ListColumn.css'

interface ListColumnProps {
  list: ListWithCards
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  onDeleteList: () => void
  onUpdateList?: (listId: string, title: string) => void
  onCreateCard: (title: string, description: string) => void
  onDeleteCard: (cardId: string) => void
  onUpdateCard: (cardId: string, updates: Partial<Card>) => void
  isSharedBoard?: boolean
}

export default function ListColumn({
  list,
  dragHandleProps,
  onDeleteList,
  onUpdateList,
  onCreateCard,
  onDeleteCard,
  onUpdateCard,
  isSharedBoard = false,
}: ListColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [newCardDescription, setNewCardDescription] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState('')

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

  const handleStartEditTitle = () => {
    setTempTitle(list.title)
    setEditingTitle(true)
  }

  const handleSaveTitle = () => {
    if (tempTitle.trim() && onUpdateList) {
      onUpdateList(list.id, tempTitle)
      setEditingTitle(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingTitle(false)
    setTempTitle('')
  }

  return (
    <div className="list-column">
      <div className="list-header" {...dragHandleProps}>
        {editingTitle ? (
          <div className="edit-list-title-container">
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              autoFocus
              className="edit-list-title-input"
            />
            <button onClick={handleSaveTitle} className="validate-button-small">✓</button>
            <button onClick={handleCancelEdit} className="cancel-button-small">✕</button>
          </div>
        ) : (
          <h3 onDoubleClick={handleStartEditTitle} className="editable-list-title">
            {list.title}
          </h3>
        )}
        <button className="delete-list-button" onClick={handleDeleteList}>
          ×
        </button>
      </div>

      <Droppable droppableId={list.id} type="card">
        {(provided, snapshot) => (
          <div
            className={`cards-container ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {list.cards.map((card, index) => (
              <Draggable key={card.id} draggableId={card.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={snapshot.isDragging ? 'card-dragging' : ''}
                  >
                    <CardItem
                      card={card}
                      onDelete={() => onDeleteCard(card.id)}
                      onUpdate={(updates) => onUpdateCard(card.id, updates)}
                      isSharedBoard={isSharedBoard}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

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
