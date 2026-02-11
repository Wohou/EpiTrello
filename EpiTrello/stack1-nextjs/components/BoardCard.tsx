'use client'

import { useLanguage } from '@/lib/language-context'
import { useNotification } from '@/components/NotificationContext'
import type { Board } from '@/lib/supabase'
import './BoardCard.css'

interface BoardCardProps {
  board: Board
  onClick: () => void
  onDelete: () => void
}

export default function BoardCard({ board, onClick, onDelete }: BoardCardProps) {
  const { t } = useLanguage()
  const { confirm } = useNotification()

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const confirmed = await confirm({
      title: t.boards.deleteBoard,
      message: t.boards.deleteConfirm,
      confirmText: t.common.delete,
      cancelText: t.common.cancel,
      variant: 'danger',
    })
    if (confirmed) {
      onDelete()
    }
  }

  return (
    <div className="board-card" onClick={onClick}>
      <div className="board-card-content">
        <h3>{board.title}</h3>
        {board.description && <p>{board.description}</p>}
        {board.is_shared && board.owner_username && (
          <div className="board-shared-info">
            <span className="shared-icon">👥</span>
            <span className="shared-owner">
              {(t.sharing?.sharedBy || 'Partagé par {name}').replace('{name}', board.owner_username)}
            </span>
          </div>
        )}
      </div>
      {!board.is_shared && (
        <button className="delete-button" onClick={handleDelete}>
          ×
        </button>
      )}
    </div>
  )
}
