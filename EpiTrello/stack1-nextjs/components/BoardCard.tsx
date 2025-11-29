'use client'

import { useLanguage } from '@/lib/language-context'
import type { Board } from '@/lib/supabase'
import './BoardCard.css'

interface BoardCardProps {
  board: Board
  onClick: () => void
  onDelete: () => void
}

export default function BoardCard({ board, onClick, onDelete }: BoardCardProps) {
  const { t } = useLanguage()
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(t.boards.deleteConfirm)) {
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
