'use client'

import type { Board } from '@/lib/supabase'
import './BoardCard.css'

interface BoardCardProps {
  board: Board
  onClick: () => void
  onDelete: () => void
}

export default function BoardCard({ board, onClick, onDelete }: BoardCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this board?')) {
      onDelete()
    }
  }

  return (
    <div className="board-card" onClick={onClick}>
      <div className="board-card-content">
        <h3>{board.title}</h3>
        {board.description && <p>{board.description}</p>}
      </div>
      <button className="delete-button" onClick={handleDelete}>
        ×
      </button>
    </div>
  )
}
