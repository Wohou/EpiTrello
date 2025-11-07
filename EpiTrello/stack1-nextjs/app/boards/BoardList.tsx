'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'
import CreateBoardModal from '@/components/CreateBoardModal'
import BoardCard from '@/components/BoardCard'
import ProfileMenu from '@/components/ProfileMenu'
import type { Board } from '@/lib/supabase'
import './BoardList.css'

export default function BoardList() {
  const [boards, setBoards] = useState<Board[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchUser()
    fetchBoards()
  }, [])

  const fetchUser = async () => {
    const { data: { user } } = await supabaseBrowser.auth.getUser()
    if (user) {
      const displayName = (user.user_metadata?.username || user.email || 'User').trim()
      setUsername(displayName)
      setUserEmail(user.email || '')
      setAvatarUrl(user.user_metadata?.avatar_url || null)
    }
  }

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
        <div className="header-left">
          <h1>My Boards</h1>
          <span className="welcome-text">Welcome, {username}!</span>
        </div>
        <div className="header-right">
          <button className="create-button" onClick={() => setIsModalOpen(true)}>
            Create New Board
          </button>
          <ProfileMenu username={username} userEmail={userEmail} avatarUrl={avatarUrl} />
        </div>
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
