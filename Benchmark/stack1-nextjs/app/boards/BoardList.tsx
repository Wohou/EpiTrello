'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CreateBoardModal from '@/components/CreateBoardModal'
import BoardCard from '@/components/BoardCard'
import type { Board } from '@/lib/supabase'
import './BoardList.css'

export default function BoardList() {
  const [boards, setBoards] = useState<Board[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchBoards()
  }, [])

  const fetchBoards = async () => {
    try {
      const response = await fetch('/api/boards')
      const data = await response.json()
      setBoards(data)
    } catch (error) {
      console.error('Error fetching boards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBoard = async (title: string, description: string) => {
    try {
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      const newBoard = await response.json()
      setBoards([newBoard, ...boards])
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error creating board:', error)
    }
  }

  const handleDeleteBoard = async (id: string) => {
    try {
      await fetch(`/api/boards/${id}`, { method: 'DELETE' })
      setBoards(boards.filter(board => board.id !== id))
    } catch (error) {
      console.error('Error deleting board:', error)
    }
  }

  const handleBoardClick = (id: string) => {
    router.push(`/boards/${id}`)
  }

  if (loading) {
    return <div className="loading">Loading boards...</div>
  }

  return (
    <div className="board-list-container">
      <div className="header">
        <h1>My Boards</h1>
        <button className="create-button" onClick={() => setIsModalOpen(true)}>
          Create New Board
        </button>
      </div>

      <div className="boards-grid">
        {boards.map((board) => (
          <BoardCard
            key={board.id}
            board={board}
            onClick={() => handleBoardClick(board.id)}
            onDelete={() => handleDeleteBoard(board.id)}
          />
        ))}
      </div>

      {isModalOpen && (
        <CreateBoardModal
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateBoard}
        />
      )}
    </div>
  )
}
