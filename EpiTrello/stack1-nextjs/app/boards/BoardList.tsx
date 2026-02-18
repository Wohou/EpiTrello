'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useLanguage } from '@/lib/language-context'
import CreateBoardModal from '@/components/CreateBoardModal'
import BoardCard from '@/components/BoardCard'
import ProfileMenu from '@/components/ProfileMenu'
import InvitationsPanel from '@/components/InvitationsPanel'
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
  const { t } = useLanguage()

  useEffect(() => {
    fetchUser()
    fetchBoards()
  }, [])

  const fetchUser = async () => {
    const { data: { user } } = await supabaseBrowser.auth.getUser()
    if (user) {
      const displayName = (user.user_metadata?.username || user.email || 'User').trim()
      const avatar = user.user_metadata?.avatar_url || null
      setUsername(displayName)
      setUserEmail(user.email || '')
      setAvatarUrl(avatar)

      // Sync avatar_url and username to profiles table (so cards/comments show the avatar)
      await supabaseBrowser
        .from('profiles')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Supabase client has no DB types
        .update({ avatar_url: avatar, username: displayName })
        .eq('id', user.id)
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
    return <div className="loading">{t.boards.loading}</div>
  }

  return (
    <div className="board-list-container">
      <div className="header">
        <div className="header-left">
          <h1>{t.boards.myBoards}</h1>
          <span className="welcome-text">{t.boards.welcome.replace('{name}', username)}</span>
        </div>
        <div className="header-right">
          <button className="create-button" onClick={() => setIsModalOpen(true)}>
            {t.boards.createBoard}
          </button>
          <Link href="/guide" className="help-button" title={t.guide.tooltip}>
            ?
          </Link>
          <ProfileMenu username={username} userEmail={userEmail} avatarUrl={avatarUrl} />
        </div>
      </div>

      <InvitationsPanel />

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
