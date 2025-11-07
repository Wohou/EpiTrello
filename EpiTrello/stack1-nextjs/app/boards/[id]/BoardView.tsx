'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ListColumn from '@/components/ListColumn'
import CreateListButton from '@/components/CreateListButton'
import type { BoardWithLists, List, Card } from '@/lib/supabase'
import './BoardView.css'

interface BoardViewProps {
  boardId: string
}

export default function BoardView({ boardId }: BoardViewProps) {
  const [board, setBoard] = useState<BoardWithLists | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [tempTitle, setTempTitle] = useState('')
  const [tempDescription, setTempDescription] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchBoard()
  }, [boardId])

  const fetchBoard = async () => {
    try {
      const response = await fetch(`/api/boards/${boardId}`)
      const data = await response.json()
      setBoard(data)
    } catch (error) {
      console.error('Error fetching board:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateList = async (title: string) => {
    if (!board) return

    try {
      const position = board.lists.length
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, board_id: boardId, position }),
      })
      const newList = await response.json()
      setBoard({
        ...board,
        lists: [...board.lists, { ...newList, cards: [] }],
      })
    } catch (error) {
      console.error('Error creating list:', error)
    }
  }

  const handleDeleteList = async (listId: string) => {
    if (!board) return

    try {
      await fetch(`/api/lists/${listId}`, { method: 'DELETE' })
      setBoard({
        ...board,
        lists: board.lists.filter(list => list.id !== listId),
      })
    } catch (error) {
      console.error('Error deleting list:', error)
    }
  }

  const handleCreateCard = async (listId: string, title: string, description: string) => {
    if (!board) return

    const list = board.lists.find(l => l.id === listId)
    if (!list) return

    try {
      const position = list.cards.length
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, list_id: listId, position }),
      })
      const newCard = await response.json()

      setBoard({
        ...board,
        lists: board.lists.map(l =>
          l.id === listId
            ? { ...l, cards: [...l.cards, newCard] }
            : l
        ),
      })
    } catch (error) {
      console.error('Error creating card:', error)
    }
  }

  const handleDeleteCard = async (listId: string, cardId: string) => {
    if (!board) return

    try {
      await fetch(`/api/cards/${cardId}`, { method: 'DELETE' })
      setBoard({
        ...board,
        lists: board.lists.map(list =>
          list.id === listId
            ? { ...list, cards: list.cards.filter(card => card.id !== cardId) }
            : list
        ),
      })
    } catch (error) {
      console.error('Error deleting card:', error)
    }
  }

  const handleUpdateCard = async (cardId: string, updates: Partial<Card>) => {
    if (!board) return

    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const updatedCard = await response.json()

      setBoard({
        ...board,
        lists: board.lists.map(list => ({
          ...list,
          cards: list.cards.map(card =>
            card.id === cardId ? updatedCard : card
          ),
        })),
      })
    } catch (error) {
      console.error('Error updating card:', error)
    }
  }

  const handleStartEditTitle = () => {
    if (board) {
      setTempTitle(board.title)
      setEditingTitle(true)
    }
  }

  const handleStartEditDescription = () => {
    if (board) {
      setTempDescription(board.description || '')
      setEditingDescription(true)
    }
  }

  const handleSaveTitle = async () => {
    if (!board || !tempTitle.trim()) return

    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: tempTitle }),
      })
      const updatedBoard = await response.json()
      setBoard({ ...board, title: updatedBoard.title })
      setEditingTitle(false)
    } catch (error) {
      console.error('Error updating board title:', error)
    }
  }

  const handleSaveDescription = async () => {
    if (!board) return

    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: tempDescription }),
      })
      const updatedBoard = await response.json()
      setBoard({ ...board, description: updatedBoard.description })
      setEditingDescription(false)
    } catch (error) {
      console.error('Error updating board description:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingTitle(false)
    setEditingDescription(false)
    setTempTitle('')
    setTempDescription('')
  }

  const handleUpdateList = async (listId: string, title: string) => {
    if (!board) return

    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      const updatedList = await response.json()

      setBoard({
        ...board,
        lists: board.lists.map(list =>
          list.id === listId ? { ...list, title: updatedList.title } : list
        ),
      })
    } catch (error) {
      console.error('Error updating list title:', error)
    }
  }

  if (loading) {
    return <div className="loading">Loading board...</div>
  }

  if (!board) {
    return <div className="error">Board not found</div>
  }

  return (
    <div className="board-view-container">
      <div className="board-header">
        <button className="back-button" onClick={() => router.push('/boards')}>
          ← Back to Boards
        </button>

        <div className="board-title-section">
          {editingTitle ? (
            <div className="edit-title-container">
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                autoFocus
                className="edit-title-input"
              />
              <button onClick={handleSaveTitle} className="validate-button">✓</button>
              <button onClick={handleCancelEdit} className="cancel-button">✕</button>
            </div>
          ) : (
            <h1 onDoubleClick={handleStartEditTitle} className="editable-title">
              {board.title}
            </h1>
          )}
        </div>

        <div className="board-description-section">
          {editingDescription ? (
            <div className="edit-description-container">
              <textarea
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                autoFocus
                className="edit-description-input"
                rows={3}
              />
              <button onClick={handleSaveDescription} className="validate-button">✓</button>
              <button onClick={handleCancelEdit} className="cancel-button">✕</button>
            </div>
          ) : (
            <p
              onDoubleClick={handleStartEditDescription}
              className="board-description editable-description"
            >
              {board.description || 'Double-cliquez pour ajouter une description...'}
            </p>
          )}
        </div>
      </div>

      <div className="lists-container">
        {board.lists.map((list) => (
          <ListColumn
            key={list.id}
            list={list}
            onDeleteList={() => handleDeleteList(list.id)}
            onUpdateList={handleUpdateList}
            onCreateCard={(title, description) => handleCreateCard(list.id, title, description)}
            onDeleteCard={(cardId) => handleDeleteCard(list.id, cardId)}
            onUpdateCard={handleUpdateCard}
          />
        ))}
        <CreateListButton onCreate={handleCreateList} />
      </div>
    </div>
  )
}
