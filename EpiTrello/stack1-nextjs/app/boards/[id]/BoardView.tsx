'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
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

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result

    // Dropped outside a droppable area
    if (!destination) return

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    if (!board) return

    // Dragging lists
    if (type === 'list') {
      const newLists = Array.from(board.lists)
      const [movedList] = newLists.splice(source.index, 1)
      newLists.splice(destination.index, 0, movedList)

      // Update positions
      const updatedLists = newLists.map((list, index) => ({
        ...list,
        position: index,
      }))

      // Optimistic update
      setBoard({ ...board, lists: updatedLists })

      // Save to database
      try {
        await fetch('/api/lists/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lists: updatedLists.map(l => ({ id: l.id, position: l.position })),
          }),
        })
      } catch (error) {
        console.error('Error reordering lists:', error)
        // Revert on error
        fetchBoard()
      }
      return
    }

    // Dragging cards
    if (type === 'card') {
      const sourceListId = source.droppableId
      const destListId = destination.droppableId

      const sourceList = board.lists.find(l => l.id === sourceListId)
      const destList = board.lists.find(l => l.id === destListId)

      if (!sourceList || !destList) return

      // Same list - reorder within list
      if (sourceListId === destListId) {
        const newCards = Array.from(sourceList.cards)
        const [movedCard] = newCards.splice(source.index, 1)
        newCards.splice(destination.index, 0, movedCard)

        // Update positions
        const updatedCards = newCards.map((card, index) => ({
          ...card,
          position: index,
        }))

        // Optimistic update
        setBoard({
          ...board,
          lists: board.lists.map(list =>
            list.id === sourceListId ? { ...list, cards: updatedCards } : list
          ),
        })

        // Save to database
        try {
          await fetch('/api/cards/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cards: updatedCards.map(c => ({ 
                id: c.id, 
                position: c.position,
                list_id: sourceListId 
              })),
            }),
          })
        } catch (error) {
          console.error('Error reordering cards:', error)
          fetchBoard()
        }
      } else {
        // Different list - move card between lists
        const sourceCards = Array.from(sourceList.cards)
        const destCards = Array.from(destList.cards)

        const [movedCard] = sourceCards.splice(source.index, 1)
        movedCard.list_id = destListId
        destCards.splice(destination.index, 0, movedCard)

        // Update positions
        const updatedSourceCards = sourceCards.map((card, index) => ({
          ...card,
          position: index,
        }))
        const updatedDestCards = destCards.map((card, index) => ({
          ...card,
          position: index,
        }))

        // Optimistic update
        setBoard({
          ...board,
          lists: board.lists.map(list => {
            if (list.id === sourceListId) {
              return { ...list, cards: updatedSourceCards }
            }
            if (list.id === destListId) {
              return { ...list, cards: updatedDestCards }
            }
            return list
          }),
        })

        // Save to database
        try {
          await fetch('/api/cards/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cards: [
                ...updatedSourceCards.map(c => ({ 
                  id: c.id, 
                  position: c.position,
                  list_id: sourceListId 
                })),
                ...updatedDestCards.map(c => ({ 
                  id: c.id, 
                  position: c.position,
                  list_id: destListId 
                })),
              ],
            }),
          })
        } catch (error) {
          console.error('Error moving card:', error)
          fetchBoard()
        }
      }
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

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" type="list" direction="horizontal">
          {(provided) => (
            <div
              className="lists-container"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {board.lists.map((list, index) => (
                <Draggable key={list.id} draggableId={list.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`list-wrapper ${snapshot.isDragging ? 'dragging' : ''}`}
                    >
                      <ListColumn
                        list={list}
                        dragHandleProps={provided.dragHandleProps}
                        onDeleteList={() => handleDeleteList(list.id)}
                        onUpdateList={handleUpdateList}
                        onCreateCard={(title, description) => handleCreateCard(list.id, title, description)}
                        onDeleteCard={(cardId) => handleDeleteCard(list.id, cardId)}
                        onUpdateCard={handleUpdateCard}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              <CreateListButton onCreate={handleCreateList} />
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
